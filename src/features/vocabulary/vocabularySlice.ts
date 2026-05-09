import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

export type WordCard = {
  id: string;
  keyword: string;
  word: string;
  meaning: string;
  example: string;
};

type VocabularyState = {
  cards: WordCard[];
  activeIndex: number;
  masteredIds: string[];
  isAnswerVisible: boolean;
  studyStreak: number;
};

type AddCardPayload = Omit<WordCard, "id">;

const initialState: VocabularyState = {
  cards: [
    {
      id: "anchor",
      keyword: "Root",
      word: "anchor",
      meaning: "A reliable point of support or focus.",
      example: "A familiar keyword can anchor a new English word in memory.",
    },
    {
      id: "recall",
      keyword: "Active",
      word: "recall",
      meaning: "To bring information back into your mind.",
      example: "Short review sessions improve recall more than rereading.",
    },
    {
      id: "retain",
      keyword: "Long-term",
      word: "retain",
      meaning: "To keep knowledge or information over time.",
      example: "You retain vocabulary better when you connect it to context.",
    },
  ],
  activeIndex: 0,
  masteredIds: [],
  isAnswerVisible: false,
  studyStreak: 1,
};

const vocabularySlice = createSlice({
  name: "vocabulary",
  initialState,
  reducers: {
    revealAnswer(state) {
      state.isAnswerVisible = true;
    },
    hideAnswer(state) {
      state.isAnswerVisible = false;
    },
    nextCard(state) {
      state.activeIndex = (state.activeIndex + 1) % state.cards.length;
      state.isAnswerVisible = false;
    },
    previousCard(state) {
      state.activeIndex =
        (state.activeIndex - 1 + state.cards.length) % state.cards.length;
      state.isAnswerVisible = false;
    },
    toggleMastered(state, action: PayloadAction<string>) {
      const cardId = action.payload;
      const isMastered = state.masteredIds.includes(cardId);

      state.masteredIds = isMastered
        ? state.masteredIds.filter((id) => id !== cardId)
        : [...state.masteredIds, cardId];
    },
    addCard: {
      reducer(state, action: PayloadAction<WordCard>) {
        state.cards.push(action.payload);
      },
      prepare(card: AddCardPayload) {
        return {
          payload: {
            ...card,
            id: crypto.randomUUID(),
          },
        };
      },
    },
  },
});

export const {
  addCard,
  hideAnswer,
  nextCard,
  previousCard,
  revealAnswer,
  toggleMastered,
} = vocabularySlice.actions;

export const selectVocabulary = (state: RootState) => state.vocabulary;
export const selectActiveCard = (state: RootState) =>
  state.vocabulary.cards[state.vocabulary.activeIndex];

export default vocabularySlice.reducer;
