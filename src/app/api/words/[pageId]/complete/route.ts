import { NextResponse } from "next/server";
import { markWordAsCompleted } from "@/lib/notion";

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

export async function PATCH(_: Request, context: RouteContext) {
  try {
    const { pageId } = await context.params;
    await markWordAsCompleted(pageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "암기 완료 상태를 저장하지 못했습니다.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
