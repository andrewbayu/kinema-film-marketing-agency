import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  updateDoc,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  WithFieldValue
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class DbBase<T extends DocumentData> {
  constructor(protected path: string) {}

  protected get collectionRef() {
    return collection(db, this.path);
  }

  async create(data: WithFieldValue<T>) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Auth required");

    try {
      const docRef = await addDoc(this.collectionRef, {
        ...data,
        userId,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, this.path);
    }
  }

  async update(id: string, updates: Partial<T>) {
    try {
      const docRef = doc(db, this.path, id);
      await updateDoc(docRef, updates as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.path);
    }
  }

  async getLatestByCampaign(campaignId: string): Promise<T | null> {
    try {
      const q = query(
        this.collectionRef,
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as T;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.path);
      return null;
    }
  }

  async getAllByCampaign(campaignId: string): Promise<T[]> {
    try {
      const q = query(
        this.collectionRef,
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.path);
      return [];
    }
  }
}
