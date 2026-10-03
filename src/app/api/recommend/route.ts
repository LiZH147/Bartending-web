import { NextResponse } from "next/server";
import { RecommendRequestSchema } from "@/lib/schemas";
import {
  buildCreativeForRecommend,
  buildRecommendation,
  buildRecommendationEnrichment,
} from "@/lib/recommend";

export const dynamic = "force-dynamic";
// Vercel: the LLM enrichment + creative generation run long (~30-40s), so raise
// the function timeout from the 10s default. 60s is the Hobby (free) cap.
export const maxDuration = 60;

/**
 * Streams the recommendation as newline-delimited JSON so the client can render
 * the instant classic results immediately, then fill in LLM enrichment and the
 * AI creative recipes as they finish (both run concurrently in the background).
 *
 * Events, in order:
 *   { "type": "result",   result: RecommendResponse }      // classic, instant
 *   { "type": "enrich",   substitutions, explanations }    // LLM deltas (when ai enabled)
 *   { "type": "creative", creative: CocktailResult[] }     // when classic count is low
 *   { "type": "done" }                                     // stream finished
 *   { "type": "error",    error: string }                  // fatal (after result)
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RecommendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {
          // Client disconnected; ignore and let the run finish.
        }
      };

      try {
        // 1) Classic results — deterministic, instant.
        const result = await buildRecommendation(parsed.data);
        if (req.signal.aborted) return;
        send({ type: "result", result });

        // 2) LLM enrichment + creative run concurrently, each streamed when done.
        const hasResults = result.available.length + result.almost.length > 0;
        const enrichPromise =
          result.meta.aiEnabled && hasResults
            ? buildRecommendationEnrichment(result, parsed.data)
                .then((e) => {
                  if (!req.signal.aborted) {
                    send({ type: "enrich", substitutions: e.substitutions, explanations: e.explanations });
                  }
                })
                .catch(() => {})
            : Promise.resolve();

        // AI creative recipes are always generated in the background (they're the
        // "AI creations" section) and streamed in when ready, independent of how
        // many classics matched — unless the client has a local cache hit and
        // asked us to skip, in which case it already shows the cached list.
        const creativePromise = parsed.data.skipCreative
          ? Promise.resolve()
          : buildCreativeForRecommend(parsed.data, result)
              .then((creative) => {
                if (!req.signal.aborted) send({ type: "creative", creative });
              })
              .catch(() => {});

        await Promise.all([enrichPromise, creativePromise]);

        if (!req.signal.aborted) send({ type: "done" });
      } catch (e) {
        console.error("[recommend] stream error", e);
        send({ type: "error", error: e instanceof Error ? e.message : "Internal server error" });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}