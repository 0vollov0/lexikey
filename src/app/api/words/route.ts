import { NextResponse } from "next/server";
import { loadLearningWords } from "@/lib/notion";

export async function GET() {
  try {
    const cards = await loadLearningWords();
    return NextResponse.json({ cards });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "단어장을 불러오지 못했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
