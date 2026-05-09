import { configureStore } from "@reduxjs/toolkit";
import vocabularyReducer from "@/features/vocabulary/vocabularySlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      vocabulary: vocabularyReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
