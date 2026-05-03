import { create } from 'zustand';
import { collection, doc, setDoc, query, where, onSnapshot, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, serverTimestamp } from '../lib/firebase';

export interface VibeEntry {
  id: string;
  date: string; // ISO string
  transcription?: string;
  tone: string;
  energyLevel: number;
  sentiment: string;
  culturalContext?: string;
  verse?: string; // from Qalam
  imageUrl?: string; // from Aks/Imagen
  uiState: {
    color: string;
    spacing: string;
    animationSpeed: number;
  };
  userId?: string;
}

interface VibesState {
  vibes: VibeEntry[];
  initialized: boolean;
  isNavHidden: boolean;
  setNavHidden: (hidden: boolean) => void;
  unsubscribeFromFirestore: (() => void) | null;
  initSync: () => void;
  addVibe: (vibe: Omit<VibeEntry, 'id' | 'date'>) => Promise<string>;
  updateVibeImage: (id: string, imageUrl: string) => Promise<void>;
  updateVibeVerse: (id: string, verse: string) => Promise<void>;
  removeVibe: (id: string) => Promise<void>;
  wipeData: () => Promise<void>;
  clearVibes: () => void;
}

export const useVibesStore = create<VibesState>()((set, get) => ({
  vibes: [],
  initialized: false,
  isNavHidden: false,
  setNavHidden: (hidden) => set({ isNavHidden: hidden }),
  unsubscribeFromFirestore: null,

  initSync: () => {
    const state = get();
    if (state.unsubscribeFromFirestore) {
      state.unsubscribeFromFirestore();
    }

    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'vibes'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vibesData: VibeEntry[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        vibesData.push({
          ...data,
          id: doc.id,
        } as VibeEntry);
      });
      set({ vibes: vibesData, initialized: true });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vibes');
    });

    set({ unsubscribeFromFirestore: unsubscribe });
  },

  addVibe: async (vibeData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in to add a vibe");

    const id = `vibe-${Date.now()}`;
    const newVibe = {
      ...vibeData,
      userId: user.uid,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Optistic update (Firestore listener will handle the rest)
    try {
      await setDoc(doc(db, 'vibes', id), newVibe);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `vibes/${id}`);
      throw err;
    }
  },

  updateVibeImage: async (id, imageUrl) => {
    try {
      await updateDoc(doc(db, 'vibes', id), { 
        imageUrl,
        updatedAt: serverTimestamp() 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vibes/${id}`);
    }
  },

  updateVibeVerse: async (id, verse) => {
    try {
      await updateDoc(doc(db, 'vibes', id), { 
        verse,
        updatedAt: serverTimestamp() 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vibes/${id}`);
    }
  },

  removeVibe: async (id) => {
    try {
      await deleteDoc(doc(db, 'vibes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vibes/${id}`);
    }
  },

  wipeData: async () => {
    const state = get();
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const deletePromises = state.vibes.map(v => deleteDoc(doc(db, 'vibes', v.id)));
      await Promise.all(deletePromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vibes (wipeData)`);
    }
  },

  clearVibes: () => set({ vibes: [] }),
}));

