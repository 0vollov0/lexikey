export type MemorizationStatus = "학습 필요" | "완료";

export type VocabularyCard = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  status: MemorizationStatus;
};
