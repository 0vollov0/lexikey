"use client";

import {
  nextCard,
  previousCard,
  revealAnswer,
  selectActiveCard,
  selectVocabulary,
  toggleMastered,
} from "@/features/vocabulary/vocabularySlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export function VocabularyTrainer() {
  const dispatch = useAppDispatch();
  const activeCard = useAppSelector(selectActiveCard);
  const { activeIndex, cards, isAnswerVisible, masteredIds, studyStreak } =
    useAppSelector(selectVocabulary);
  const masteredCount = masteredIds.length;
  const isMastered = masteredIds.includes(activeCard.id);

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#171717]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-[#d8d2bf] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#5b6b73]">
              LexiKey
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-[#20231f] sm:text-5xl">
              Build vocabulary around memorable keywords.
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:w-72">
            <div className="border border-[#d8d2bf] bg-white px-4 py-3">
              <span className="block text-[#68716b]">Cards</span>
              <strong className="text-2xl">{cards.length}</strong>
            </div>
            <div className="border border-[#d8d2bf] bg-white px-4 py-3">
              <span className="block text-[#68716b]">Mastered</span>
              <strong className="text-2xl">{masteredCount}</strong>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[1fr_340px]">
          <article className="flex min-h-[460px] flex-col justify-between border border-[#d8d2bf] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="border border-[#2f5d50] px-3 py-1 text-sm font-medium text-[#2f5d50]">
                {activeCard.keyword}
              </span>
              <span className="text-sm text-[#68716b]">
                {activeIndex + 1} / {cards.length}
              </span>
            </div>

            <div className="my-12">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b4532a]">
                Word
              </p>
              <h2 className="mt-4 text-6xl font-semibold tracking-normal text-[#20231f] sm:text-7xl">
                {activeCard.word}
              </h2>
              <div className="mt-10 min-h-32 border-l-4 border-[#e0a458] pl-5">
                {isAnswerVisible ? (
                  <div className="space-y-4">
                    <p className="text-2xl font-medium text-[#20231f]">
                      {activeCard.meaning}
                    </p>
                    <p className="max-w-2xl text-lg leading-8 text-[#5b625c]">
                      {activeCard.example}
                    </p>
                  </div>
                ) : (
                  <p className="max-w-xl text-lg leading-8 text-[#68716b]">
                    Think of the keyword first, then reveal the meaning when
                    you can explain it in your own words.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="h-12 border border-[#a9a18d] px-5 font-medium text-[#20231f] transition hover:bg-[#f1eee4]"
                type="button"
                onClick={() => dispatch(previousCard())}
              >
                Previous
              </button>
              <button
                className="h-12 bg-[#2f5d50] px-5 font-medium text-white transition hover:bg-[#254a40]"
                type="button"
                onClick={() => dispatch(revealAnswer())}
              >
                Reveal Meaning
              </button>
              <button
                className="h-12 border border-[#a9a18d] px-5 font-medium text-[#20231f] transition hover:bg-[#f1eee4]"
                type="button"
                onClick={() => dispatch(nextCard())}
              >
                Next
              </button>
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <div className="border border-[#d8d2bf] bg-[#20231f] p-6 text-white">
              <p className="text-sm uppercase tracking-[0.16em] text-[#e0a458]">
                Study streak
              </p>
              <p className="mt-5 text-5xl font-semibold">{studyStreak}</p>
              <p className="mt-2 text-sm text-[#d8d2bf]">
                day starter state wired through Redux.
              </p>
            </div>

            <div className="border border-[#d8d2bf] bg-white p-6">
              <h2 className="text-lg font-semibold">Current focus</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#68716b]">Keyword</dt>
                  <dd className="font-medium">{activeCard.keyword}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#68716b]">Status</dt>
                  <dd className="font-medium">
                    {isMastered ? "Mastered" : "Learning"}
                  </dd>
                </div>
              </dl>
              <button
                className="mt-6 h-11 w-full border border-[#b4532a] px-4 font-medium text-[#b4532a] transition hover:bg-[#fff4ed]"
                type="button"
                onClick={() => dispatch(toggleMastered(activeCard.id))}
              >
                {isMastered ? "Mark as Learning" : "Mark as Mastered"}
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
