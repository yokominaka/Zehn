import { create } from 'zustand';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, serverTimestamp } from '../lib/firebase';

export interface UserProfile {
  bio?: string;
  avatarUrl?: string;
  updatedAt?: any;
}

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  loading: true,

  fetchProfile: async () => {
    const user = auth.currentUser;
    if (!user) {
      set({ profile: null, loading: false });
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ profile: docSnap.data() as UserProfile });
      } else {
        set({ profile: {} });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      const payload = { ...data, updatedAt: serverTimestamp() };
      
      if (docSnap.exists()) {
        await updateDoc(docRef, payload);
      } else {
        await setDoc(docRef, payload);
      }
      
      // update local
      set((state) => ({
        profile: { ...state.profile, ...data }
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      throw err;
    }
  },

  clearProfile: () => set({ profile: null, loading: false }),
}));
