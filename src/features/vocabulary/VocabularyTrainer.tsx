"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";
import type { VocabularyCard } from "@/features/vocabulary/types";
import {
  markCurrentCardCompleted,
  moveToNextCard,
  revealMeaning,
  selectActiveCard,
  selectVocabulary,
  setCards,
  setErrorMessage,
  setLoading,
} from "@/features/vocabulary/vocabularySlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const SWIPE_THRESHOLD = 110;
const OUT_ANIMATION_MS = 210;

type SwipeDirection = "left" | "right";
type SpeechTarget = "word" | "example" | null;

type WordsApiResponse = {
  cards: VocabularyCard[];
  error?: string;
};

function SoundIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 9.5a4.5 4.5 0 0 1 0 5" />
      <path d="M18.5 7a8 8 0 0 1 0 10" />
    </svg>
  );
}

export function VocabularyTrainer() {
  const dispatch = useAppDispatch();
  const activeCard = useAppSelector(selectActiveCard);
  const { cards, completedCount, currentIndex, errorMessage, isMeaningVisible, loading } =
    useAppSelector(selectVocabulary);

  const [startX, setStartX] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [speechTarget, setSpeechTarget] = useState<SpeechTarget>(null);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCards() {
      dispatch(setLoading(true));
      dispatch(setErrorMessage(null));

      try {
        const response = await fetch("/api/words", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as WordsApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "단어장을 불러오지 못했습니다.");
        }

        dispatch(setCards(data.cards));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "단어장을 불러오지 못했습니다.";
        dispatch(setErrorMessage(message));
      } finally {
        if (!controller.signal.aborted) {
          dispatch(setLoading(false));
        }
      }
    }

    void loadCards();

    return () => controller.abort();
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cardProgress = useMemo(() => {
    if (cards.length === 0) {
      return 0;
    }
    return Math.min(((currentIndex + 1) / cards.length) * 100, 100);
  }, [cards.length, currentIndex]);

  const speechStatusText =
    speechMessage ??
    (speechTarget === "word"
      ? "단어 재생 중..."
      : speechTarget === "example"
        ? "예문 재생 중..."
        : "");

  async function onCompleteCard(cardId: string) {
    const response = await fetch(`/api/words/${cardId}/complete`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error ?? "암기 완료 상태를 저장하지 못했습니다.");
    }
  }

  async function applySwipe(direction: SwipeDirection) {
    if (!activeCard || isAnimatingOut) {
      return;
    }

    setIsAnimatingOut(true);
    setOffsetX(direction === "right" ? 430 : -430);

    setTimeout(async () => {
      try {
        if (direction === "right") {
          await onCompleteCard(activeCard.id);
          dispatch(markCurrentCardCompleted());
        } else {
          dispatch(moveToNextCard());
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "카드 상태를 업데이트하지 못했습니다.";
        dispatch(setErrorMessage(message));
      } finally {
        setOffsetX(0);
        setStartX(null);
        setIsAnimatingOut(false);
      }
    }, OUT_ANIMATION_MS);
  }

  function handlePointerDown(clientX: number) {
    if (!activeCard || isAnimatingOut) {
      return;
    }
    setStartX(clientX);
  }

  function handlePointerMove(clientX: number) {
    if (startX === null || isAnimatingOut) {
      return;
    }
    setOffsetX(clientX - startX);
  }

  function handlePointerEnd() {
    if (startX === null || isAnimatingOut) {
      return;
    }

    const delta = offsetX;
    setStartX(null);

    if (delta >= SWIPE_THRESHOLD) {
      void applySwipe("right");
      return;
    }

    if (delta <= -SWIPE_THRESHOLD) {
      void applySwipe("left");
      return;
    }

    setOffsetX(0);
  }

  function handleVoiceButtonPointerDown(
    event: PointerEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
  }

  function speakText(text: string, target: Exclude<SpeechTarget, null>) {
    setSpeechMessage(null);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechMessage("이 브라우저는 음성 읽기를 지원하지 않습니다.");
      return;
    }

    const normalized = text.trim();
    if (!normalized) {
      setSpeechMessage("읽을 문장이 없습니다.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(normalized);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeechTarget(target);
    utterance.onend = () => setSpeechTarget(null);
    utterance.onerror = () => {
      setSpeechTarget(null);
      setSpeechMessage("음성 재생에 실패했습니다.");
    };
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff3dd_0%,_#f6ead3_45%,_#efe0c4_100%)] px-4 pb-10 pt-6 text-[#2d2923] sm:px-6">
      <section className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="rounded-2xl border border-[#d7c3a0] bg-white/70 px-4 py-4 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d5f2e]">
            LexiKey
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight">
            Notion 단어장 스와이프 학습
          </h1>
          <p className="mt-2 text-sm text-[#5f564a]">
            오른쪽: 완료, 왼쪽: 학습 유지 후 다음 카드
          </p>
        </header>

        <div className="rounded-xl border border-[#d7c3a0] bg-white/75 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span>남은 카드 {cards.length}개</span>
            <span>완료 {completedCount}개</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ead8ba]">
            <div
              className="h-full rounded-full bg-[#cc7a2b] transition-all duration-200"
              style={{ width: `${cardProgress}%` }}
            />
          </div>
        </div>

        {loading ? (
          <section className="mt-8 rounded-2xl border border-[#d7c3a0] bg-white p-6 text-center text-[#5f564a]">
            단어장을 불러오는 중입니다...
          </section>
        ) : null}

        {!loading && errorMessage ? (
          <section className="mt-8 rounded-2xl border border-[#db8c77] bg-[#fff4f1] p-6 text-center text-[#7d2f1f]">
            {errorMessage}
          </section>
        ) : null}

        {!loading && !errorMessage && cards.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-[#c7dab0] bg-[#f4fde9] p-7 text-center">
            <h2 className="text-xl font-semibold text-[#294d13]">
              학습 필요 카드가 없습니다.
            </h2>
            <p className="mt-2 text-sm text-[#4f6f38]">
              Notion에서 암기 상태가 학습 필요인 단어를 추가해 주세요.
            </p>
          </section>
        ) : null}

        {!loading && !errorMessage && activeCard ? (
          <section className="pt-2">
            <div
              className="select-none touch-none rounded-3xl border border-[#d7c3a0] bg-white px-5 pb-8 pt-5 shadow-[0_15px_45px_rgba(89,63,17,0.18)] transition-transform duration-200"
              onPointerDown={(event) => handlePointerDown(event.clientX)}
              onPointerMove={(event) => handlePointerMove(event.clientX)}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onClick={() => dispatch(revealMeaning())}
              style={{
                transform: `translateX(${offsetX}px) rotate(${offsetX * 0.04}deg)`,
                transition: isAnimatingOut ? `transform ${OUT_ANIMATION_MS}ms ease-out` : "none",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[#d3b48f] bg-[#fff8ef] px-3 py-1 text-xs font-medium text-[#7a5a31]">
                  {activeCard.partOfSpeech || "품사 없음"}
                </span>
                <span className="text-xs text-[#8f7e68]">
                  {cards.length === 0 ? 0 : currentIndex + 1}/{cards.length}
                </span>
              </div>

              <div className="relative mt-8">
                <button
                  type="button"
                  aria-label="단어 듣기"
                  title="단어 듣기"
                  onPointerDown={handleVoiceButtonPointerDown}
                  onClick={(event) => {
                    event.stopPropagation();
                    speakText(activeCard.word, "word");
                  }}
                  className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7c3a0] bg-[#fff8ef] text-[#5f564a]"
                >
                  <SoundIcon className="h-5 w-5" />
                </button>
                <p className="pr-12 text-center text-[2.3rem] font-semibold leading-tight tracking-tight text-[#2f2922]">
                  {activeCard.word}
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-[#e7d4b5] bg-[#fef8ef] px-4 py-4">
                {isMeaningVisible ? (
                  <div className="space-y-3">
                    <p className="text-base font-medium text-[#2f2922]">
                      뜻: {activeCard.meaning}
                    </p>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-7 text-[#5f564a]">
                        예문: {activeCard.example || "-"}
                      </p>
                      {activeCard.example.trim().length > 0 ? (
                        <button
                          type="button"
                          aria-label="예문 듣기"
                          title="예문 듣기"
                          onPointerDown={handleVoiceButtonPointerDown}
                          onClick={(event) => {
                            event.stopPropagation();
                            speakText(activeCard.example, "example");
                          }}
                          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7c3a0] bg-white text-[#5f564a]"
                        >
                          <SoundIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-[#776a59]">
                    카드를 탭하면 뜻과 예문이 표시됩니다.
                  </p>
                )}
              </div>

              <div className="mt-4 min-h-10 rounded-xl border border-[#e7d4b5] bg-[#fff8ef] px-3 py-2">
                <p
                  className={`text-center text-xs ${
                    speechMessage ? "text-[#8f3c2a]" : "text-[#6f644f]"
                  } ${speechStatusText ? "" : "opacity-0"}`}
                >
                  {speechStatusText || "상태"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-[#6a5d4b]">
              <div className="rounded-lg border border-[#d7c3a0] bg-white/70 py-2">
                좌측 스와이프: 학습 유지
              </div>
              <div className="rounded-lg border border-[#d7c3a0] bg-white/70 py-2">
                우측 스와이프: 암기 완료
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
