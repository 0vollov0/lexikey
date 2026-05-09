import "server-only";
import type {
  MemorizationStatus,
  VocabularyCard,
} from "@/features/vocabulary/types";

const NOTION_VERSION = "2022-06-28";
const LEARNING_STATUS: MemorizationStatus = "학습 필요";
const COMPLETED_STATUS: MemorizationStatus = "완료";

type NotionRichText = {
  plain_text: string;
};

type NotionProperty = {
  type?: string;
  [key: string]: unknown;
};

type NotionPage = {
  id: string;
  properties: Record<string, NotionProperty>;
};

type QueryDatabaseResponse = {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
  }
  return value;
}

function getNotionHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = getRequiredEnv("NOTION_API_TOKEN");
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      ...getNotionHeaders(token),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API 오류(${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

function isFilterTypeError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("validation_error");
}

function toText(value: NotionProperty | undefined): string {
  if (!value) {
    return "";
  }

  if (value.type === "title" && Array.isArray(value.title)) {
    return value.title
      .map((item) => (item as NotionRichText).plain_text ?? "")
      .join("")
      .trim();
  }

  if (value.type === "rich_text" && Array.isArray(value.rich_text)) {
    return value.rich_text
      .map((item) => (item as NotionRichText).plain_text ?? "")
      .join("")
      .trim();
  }

  if (value.type === "select") {
    const select = value.select as { name?: string } | null | undefined;
    return select?.name ?? "";
  }

  if (value.type === "status") {
    const status = value.status as { name?: string } | null | undefined;
    return status?.name ?? "";
  }

  if (value.type === "multi_select") {
    const multiSelect = value.multi_select as { name?: string }[] | undefined;
    return (multiSelect ?? [])
      .map((item) => item.name ?? "")
      .filter((name) => name.length > 0)
      .join(", ");
  }

  return "";
}

function normalizeStatus(raw: string): MemorizationStatus {
  return raw === COMPLETED_STATUS ? COMPLETED_STATUS : LEARNING_STATUS;
}

function mapPageToCard(page: NotionPage): VocabularyCard {
  const word = toText(page.properties["단어"]);
  const meaning = toText(page.properties["뜻"]);
  const partOfSpeech = toText(page.properties["품사"]);
  const example = toText(page.properties["예문"]);
  const status = normalizeStatus(toText(page.properties["암기 상태"]));

  return {
    id: page.id,
    word,
    meaning,
    partOfSpeech,
    example,
    status,
  };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function loadLearningWords(): Promise<VocabularyCard[]> {
  const databaseId = getRequiredEnv("NOTION_DATABASE_ID");
  let cursor: string | null = null;
  const pages: NotionPage[] = [];
  let filterType: "status" | "select" = "status";

  do {
    const makeBody = () => ({
      page_size: 100,
      filter: {
        property: "암기 상태",
        [filterType]: {
          equals: LEARNING_STATUS,
        },
      },
    });

    if (cursor) {
      const body = makeBody() as Record<string, unknown>;
      body.start_cursor = cursor;
      const result = await notionRequest<QueryDatabaseResponse>(
        `/databases/${databaseId}/query`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      pages.push(...result.results);
      cursor = result.has_more ? result.next_cursor : null;
      continue;
    }
    try {
      const result = await notionRequest<QueryDatabaseResponse>(
        `/databases/${databaseId}/query`,
        {
          method: "POST",
          body: JSON.stringify(makeBody()),
        },
      );

      pages.push(...result.results);
      cursor = result.has_more ? result.next_cursor : null;
    } catch (error) {
      if (filterType === "status" && isFilterTypeError(error)) {
        filterType = "select";
        const retryResult = await notionRequest<QueryDatabaseResponse>(
          `/databases/${databaseId}/query`,
          {
            method: "POST",
            body: JSON.stringify(makeBody()),
          },
        );
        pages.push(...retryResult.results);
        cursor = retryResult.has_more ? retryResult.next_cursor : null;
      } else {
        throw error;
      }
    }
  } while (cursor);

  const cards = pages
    .map(mapPageToCard)
    .filter((card) => card.word.length > 0 && card.meaning.length > 0);

  return shuffle(cards);
}

export async function markWordAsCompleted(pageId: string): Promise<void> {
  const makeBody = (type: "status" | "select") => ({
    properties: {
      "암기 상태": {
        [type]: {
          name: COMPLETED_STATUS,
        },
      },
    },
  });

  try {
    await notionRequest(`/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify(makeBody("status")),
    });
  } catch (error) {
    if (isFilterTypeError(error)) {
      await notionRequest(`/pages/${pageId}`, {
        method: "PATCH",
        body: JSON.stringify(makeBody("select")),
      });
      return;
    }

    throw error;
  }
}
