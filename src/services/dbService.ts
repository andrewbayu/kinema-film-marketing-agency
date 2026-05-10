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
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AudienceDNAResult, BoxPredictResult, FilmProfileInput, BoxPredictInput } from '../lib/types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // Campaigns
  async createCampaign(input: FilmProfileInput) {
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

  async getCampaigns() {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const path = 'campaigns';
    try {
      const q = query(
        collection(db, path), 
        where('userId', '==', userId), 
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Audience DNA Results
  async saveAudienceDNA(campaignId: string, results: AudienceDNAResult) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    const path = 'audience_dna';
    try {
      await addDoc(collection(db, path), {
        campaignId,
        userId,
        results,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getLatestAudienceDNA(campaignId: string) {
    const path = 'audience_dna';
    try {
      const q = query(
        collection(db, path),
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data().results as AudienceDNAResult;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Box Predict Results
  async saveBoxPredict(campaignId: string, results: BoxPredictResult) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    const path = 'box_predict';
    try {
      await addDoc(collection(db, path), {
        campaignId,
        userId,
        results,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getLatestBoxPredict(campaignId: string) {
    const path = 'box_predict';
    try {
      const q = query(
        collection(db, path),
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data().results as BoxPredictResult;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // FIB Results
  async saveFIB(campaignId: string, results: any) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    const path = 'fib';
    try {
      await addDoc(collection(db, path), {
        campaignId,
        userId,
        results,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getLatestFIB(campaignId: string) {
    const path = 'fib';
    try {
      const q = query(
        collection(db, path),
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data().results as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};
