import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  AudienceDNAResult,
  BoxPredictResult,
  FilmProfileInput,
  BoxPredictInput,
  CineForgeResult,
  VisibilityTrackerResult,
  FIBResult,
  Film,
  ShowtimeSnapshot,
  Client,
  ClientProfileInput
} from '../lib/types';
import { OperationType, handleFirestoreError } from './dbBase';

// Generic helper for fetching latest document by campaignId
async function getLatestByCampaignId<T>(collectionName: string, campaignId: string): Promise<T | null> {
  try {
    const q = query(
      collection(db, collectionName),
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as T;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return null;
  }
}

// Generic helper for saving results
async function saveResult<T>(collectionName: string, campaignId: string, results: T) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Auth required");

  try {
    await addDoc(collection(db, collectionName), {
      campaignId,
      userId,
      results,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

export const dbService = {
  // -------------------- Clients (production house / account) --------------------
  // Note: this collection is the new Client entity (Phase 1). The legacy auth
  // allowlist that previously lived under `clients` has been renamed to
  // `client_users` (see useAuth.tsx + firestore.rules). Any existing docs in the
  // old `clients` collection should be migrated to `client_users` before deploy.

  async createClient(input: ClientProfileInput) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    const path = 'clients';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...input,
        members: input.members ?? [],
        userId,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getClients(uid?: string): Promise<Client[]> {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) return [];

    const path = 'clients';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Client);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getClient(clientId: string): Promise<Client | null> {
    const path = 'clients';
    try {
      const snap = await getDoc(doc(db, path, clientId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Client;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return null;
    }
  },

  async updateClient(clientId: string, updates: Partial<ClientProfileInput>) {
    const path = 'clients';
    try {
      await updateDoc(doc(db, path, clientId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Batch-assign campaigns to a Client. Used by the Phase 1 migration tool
  // when the user backfills clientId onto pre-existing campaigns. Firestore
  // batch writes commit atomically up to 500 ops; we chunk above that.
  async assignCampaignsToClient(campaignIds: string[], clientId: string) {
    if (campaignIds.length === 0) return;
    const chunks: string[][] = [];
    for (let i = 0; i < campaignIds.length; i += 400) {
      chunks.push(campaignIds.slice(i, i + 400));
    }
    try {
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        for (const id of chunk) {
          batch.update(doc(db, 'campaigns', id), { clientId });
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'campaigns');
    }
  },

  // -------------------- Campaigns (Films) --------------------

  async createCampaign(input: FilmProfileInput & { clientId?: string }) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    const path = 'campaigns';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...input,
        userId,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateCampaign(campaignId: string, updates: Partial<FilmProfileInput> & { clientId?: string }) {
    const path = 'campaigns';
    try {
      await updateDoc(doc(db, path, campaignId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Batched existence check across DNA / Box / FIB collections for a list of
  // campaign IDs. Reduces Library page mount from 3N Firestore reads to 3
  // queries per 30-id chunk.
  async getCampaignReportFlags(campaignIds: string[]): Promise<Record<string, { dna: boolean; box: boolean; fib: boolean }>> {
    if (campaignIds.length === 0) return {};

    const chunks: string[][] = [];
    for (let i = 0; i < campaignIds.length; i += 30) {
      chunks.push(campaignIds.slice(i, i + 30));
    }

    const presentIn = async (collectionName: string): Promise<Set<string>> => {
      const found = new Set<string>();
      try {
        for (const chunk of chunks) {
          const q = query(collection(db, collectionName), where('campaignId', 'in', chunk));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            const cid = (d.data() as any).campaignId;
            if (cid) found.add(cid);
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      }
      return found;
    };

    const [dna, box, fib] = await Promise.all([
      presentIn('audience_dna'),
      presentIn('box_predict'),
      presentIn('fib')
    ]);

    const result: Record<string, { dna: boolean; box: boolean; fib: boolean }> = {};
    for (const id of campaignIds) {
      result[id] = { dna: dna.has(id), box: box.has(id), fib: fib.has(id) };
    }
    return result;
  },

  async getCampaigns(uid?: string) {
    const userId = uid || auth.currentUser?.uid;
    console.log("Fetching campaigns for user:", userId);
    if (!userId) {
      console.warn("No userId provided, returning empty list");
      return [];
    }

    const path = 'campaigns';
    try {
      const q = query(
        collection(db, path), 
        where('userId', '==', userId), 
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      console.log(`Found ${snapshot.size} campaigns for user ${userId}`);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Film);
    } catch (error) {
      console.error("Firestore getCampaigns error:", error);
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Audience DNA Results
  async saveAudienceDNA(campaignId: string, results: AudienceDNAResult) {
    return saveResult('audience_dna', campaignId, results);
  },

  async getLatestAudienceDNA(campaignId: string) {
    const data = await getLatestByCampaignId<{results: AudienceDNAResult}>('audience_dna', campaignId);
    return data?.results || null;
  },

  // Box Predict Results
  async saveBoxPredict(campaignId: string, results: BoxPredictResult) {
    return saveResult('box_predict', campaignId, results);
  },

  async getLatestBoxPredict(campaignId: string) {
    const data = await getLatestByCampaignId<{results: BoxPredictResult}>('box_predict', campaignId);
    return data?.results || null;
  },

  // FIB Results
  async saveFIB(campaignId: string, results: FIBResult['results']) {
    return saveResult('fib', campaignId, results);
  },

  async getLatestFIB(campaignId: string) {
    const data = await getLatestByCampaignId<{results: FIBResult['results']}>('fib', campaignId);
    return data?.results || null;
  },

  // CineForge Results
  async saveCineForge(campaignId: string, results: CineForgeResult) {
    return saveResult('cineforge', campaignId, results);
  },

  async getLatestCineForge(campaignId: string) {
    const data = await getLatestByCampaignId<{results: CineForgeResult}>('cineforge', campaignId);
    return data?.results || null;
  },

  // Visibility Tracker Methods
  async saveVisibilityScan(campaignId: string, results: VisibilityTrackerResult) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    const path = 'visibility_tracker';
    try {
      // Create a copy to avoid mutating the original
      const dataToSave = { ...results };
      // Remove lastScanAt if it's there to avoid double-dipping with createdAt
      if ('lastScanAt' in dataToSave) {
        delete (dataToSave as any).lastScanAt;
      }

      // 1. Save scan result
      await addDoc(collection(db, path), {
        ...dataToSave,
        campaignId,
        userId,
        createdAt: serverTimestamp()
      });

      // 2. Update campaign lastScan date
      await updateDoc(doc(db, 'campaigns', campaignId), {
        lastVisibilityScan: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getLatestVisibilityScan(campaignId: string): Promise<VisibilityTrackerResult | null> {
    const data = await getLatestByCampaignId<any>('visibility_tracker', campaignId);
    if (!data) return null;
    
    return {
      ...data,
      lastScanAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
    } as VisibilityTrackerResult;
  },

  async getVisibilityHistory(campaignId: string): Promise<VisibilityTrackerResult[]> {
    const path = 'visibility_tracker';
    try {
      const q = query(
        collection(db, path),
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          lastScanAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as VisibilityTrackerResult;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async backfillGarudaData(campaignId: string) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    const path = 'visibility_tracker';
    const dates = [
      new Date('2026-05-01T09:00:00Z'),
      new Date('2026-05-04T10:00:00Z'),
      new Date('2026-05-07T11:00:00Z'),
      new Date('2026-05-10T12:00:00Z'),
      new Date('2026-05-13T13:00:00Z'),
      new Date('2026-05-16T12:00:00Z'), // Adjusted to be in the past (current time is 12:23)
    ];

    const targetReach = 24400000;
    const reachProgression = [4200000, 7500000, 10800000, 13200000, 15900000, 18400000];
    const scoreProgression = [25, 38, 45, 58, 65, 74];

    try {
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const reach = reachProgression[i];
        const score = scoreProgression[i];

        await addDoc(collection(db, path), {
          campaignId,
          userId,
          visibilityScore: score,
          metrics: {
            searchVolume: 30 + (i * 10),
            socialBuzz: 25 + (i * 8),
            mediaHits: 10 + (i * 6),
            shareOfVoice: 15 + (i * 4)
          },
          sentiment: { positive: 60 + i, neutral: 30 - i, negative: 10 },
          trends: ['Viral Trailer', 'Football Enthusiasm'],
          platformPerformance: [
             { platform: 'TikTok', buzzLevel: score + 5, sentiment: 'Positive', topContent: 'Trailer reaction' },
             { platform: 'Instagram', buzzLevel: score - 2, sentiment: 'Positive', topContent: 'Cast showcase' }
          ],
          summary: 'Historical backfill data.',
          strategicAdvice: 'Continue current momentum.',
          benchmarkContext: 'Similar trajectory to previous hit sports dramas in ID market.',
          trajectory: {
            daysToH7: 20 - (i * 3),
            requiredDailyGrowth: 15,
            currentVelocity: 5 + i,
            status: score > 50 ? 'on-track' : 'at-risk',
            targetPeakDate: '2026-06-11'
          },
          funnel: {
            p50Target: 1200000,
            requiredAwareness: targetReach,
            currentAwareness: reach,
            gapToP50: Math.round(((targetReach - reach) / targetReach) * 100),
            conversionRates: {
              awarenessToInterest: 12,
              interestToIntent: 8,
              intentToTicket: 5
            }
          },
          evidencePoints: [
            { source: 'System Backfill', dataPoint: `Historical Awareness Check: ${reach.toLocaleString()}`, timestamp: date.toISOString() }
          ],
          createdAt: Timestamp.fromDate(date)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Showtime Snapshots
  async saveShowtimeSnapshot(campaignId: string, snapshot: Omit<ShowtimeSnapshot, 'campaignId' | 'userId' | 'velocity'>) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    const path = 'showtime_snapshots';
    try {
      // Compute velocity vs previous snapshot
      const previous = await getLatestByCampaignId<ShowtimeSnapshot>(path, campaignId);
      const velocity = previous && previous.totalShows > 0
        ? Math.round(((snapshot.totalShows - previous.totalShows) / previous.totalShows) * 100)
        : 0;

      await addDoc(collection(db, path), {
        ...snapshot,
        campaignId,
        userId,
        velocity,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getLatestShowtimeSnapshot(campaignId: string): Promise<ShowtimeSnapshot | null> {
    const data = await getLatestByCampaignId<any>('showtime_snapshots', campaignId);
    if (!data) return null;
    return {
      ...data,
      scannedAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.scannedAt
    } as ShowtimeSnapshot;
  },

  async getShowtimeHistory(campaignId: string, days: number = 30): Promise<ShowtimeSnapshot[]> {
    const path = 'showtime_snapshots';
    try {
      const q = query(
        collection(db, path),
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc'),
        limit(days)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          scannedAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.scannedAt
        } as ShowtimeSnapshot;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
};
