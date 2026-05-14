import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { VocabularyCard } from "@/features/vocabulary/types";
import type { RootState } from "@/lib/store";

type VocabularyState = {
  cards: VocabularyCard[];
  currentIndex: number;
  isMeaningVisible: boolean;
  loading: boolean;
  errorMessage: string | null;
  completedCount: number;
  pendingSyncIds: string[];
  syncing: boolean;
  syncMessage: string | null;
};

const initialState: VocabularyState = {
  cards: [],
  currentIndex: 0,
  isMeaningVisible: false,
  loading: true,
  errorMessage: null,
  completedCount: 0,
  pendingSyncIds: [],
  syncing: false,
  syncMessage: null,
};

const vocabularySlice = createSlice({
  name: "vocabulary",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setErrorMessage(state, action: PayloadAction<string | null>) {
      state.errorMessage = action.payload;
    },
    setCards(state, action: PayloadAction<VocabularyCard[]>) {
      state.cards = action.payload;
      state.currentIndex = 0;
      state.isMeaningVisible = false;
    },
    revealMeaning(state) {
      state.isMeaningVisible = true;
    },
    hideMeaning(state) {
      state.isMeaningVisible = false;
    },
    moveToNextCard(state) {
      if (state.cards.length === 0) {
        return;
      }

      state.currentIndex = (state.currentIndex + 1) % state.cards.length;
      state.isMeaningVisible = false;
    },
    markCurrentCardCompletedLocal(state) {
      if (state.cards.length === 0) {
        return;
      }

      const completedCard = state.cards[state.currentIndex];
      state.cards.splice(state.currentIndex, 1);
      state.completedCount += 1;

      if (!state.pendingSyncIds.includes(completedCard.id)) {
        state.pendingSyncIds.push(completedCard.id);
      }

      if (state.currentIndex >= state.cards.length) {
        state.currentIndex = 0;
      }

      state.isMeaningVisible = false;
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.syncing = action.payload;
    },
    setSyncMessage(state, action: PayloadAction<string | null>) {
      state.syncMessage = action.payload;
    },
    removeSyncedIds(state, action: PayloadAction<string[]>) {
      const synced = new Set(action.payload);
      state.pendingSyncIds = state.pendingSyncIds.filter((id) => !synced.has(id));
    },
  },
});

export const {
  hideMeaning,
  markCurrentCardCompletedLocal,
  moveToNextCard,
  removeSyncedIds,
  revealMeaning,
  setCards,
  setErrorMessage,
  setLoading,
  setSyncing,
  setSyncMessage,
} = vocabularySlice.actions;

export const selectVocabulary = (state: RootState) => state.vocabulary;
export const selectActiveCard = (state: RootState) =>
  state.vocabulary.cards[state.vocabulary.currentIndex] ?? null;

export default vocabularySlice.reducer;
