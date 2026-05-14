import { NextResponse } from "next/server";
import { markWordsAsCompleted } from "@/lib/notion";

type SyncRequestBody = {
  pageIds?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncRequestBody;
    const pageIds = body.pageIds ?? [];

    if (!Array.isArray(pageIds) || pageIds.length === 0) {
      return NextResponse.json(
        { error: "동기화할 카드 ID가 없습니다." },
        { status: 400 },
      );
    }

    const { failedIds, syncedIds } = await markWordsAsCompleted(pageIds);
    return NextResponse.json({ failedIds, syncedIds });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "동기화 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
