import type {
  CocktailResult,
  CreativeRequest,
  Enrichment,
  ParseResponse,
  RecommendRequest,
  RecommendResponse,
  Language,
} from "./schemas";

export interface IngredientSummary {
  id: string;
  nameEn: string;
  nameZh: string;
  category: string;
  flavor: string[];
  emoji: string;
  aliases: string[];
}

async function parseJSON<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function fetchIngredients(): Promise<IngredientSummary[]> {
  const res = await fetch("/api/ingredients", { cache: "no-store" });
  return parseJSON<IngredientSummary[]>(res);
}

export interface RecommendStreamEvent {
  type: "result" | "enrich" | "creative" | "done" | "error";
  result?: RecommendResponse;
  substitutions?: Enrichment["substitutions"];
  explanations?: Enrichment["explanations"];
  creative?: CocktailResult[];
  error?: string;
}

/**
 * Streams the /api/recommend NDJSON response, invoking `onEvent` for each
 * event so the caller can render the classic results instantly and fill in the
 * LLM enrichment + creative recipes as they arrive.
 */
export async function requestRecommend(
  req: RecommendRequest,
  onEvent: (event: RecommendStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      let event: RecommendStreamEvent;
      try {
        event = JSON.parse(line) as RecommendStreamEvent;
      } catch {
        continue;
      }
      onEvent(event);
    }
  }
}

export async function parseIngredientsText(text: string, language: Language): Promise<ParseResponse> {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return parseJSON<ParseResponse>(res);
}

export async function requestCreative(req: CreativeRequest): Promise<CocktailResult[]> {
  const res = await fetch("/api/creative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return parseJSON<CocktailResult[]>(res);
}

export async function fetchCocktailDetail(
  id: string,
  ingredients: string[],
  language: Language,
): Promise<CocktailResult> {
  const params = new URLSearchParams();
  params.set("lang", language);
  if (ingredients.length > 0) params.set("ingredients", ingredients.join(","));
  const res = await fetch(`/api/cocktails/${encodeURIComponent(id)}?${params.toString()}`, {
    cache: "no-store",
  });
  return parseJSON<CocktailResult>(res);
}

export async function enrichCocktailDetail(
  id: string,
  ingredients: string[],
  language: Language,
): Promise<{ enabled: boolean; substitutions?: CocktailResult["substitutions"]; explanation?: string }> {
  const res = await fetch(`/api/cocktails/${encodeURIComponent(id)}/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients, language }),
  });
  return parseJSON<{ enabled: boolean; substitutions?: CocktailResult["substitutions"]; explanation?: string }>(res);
}