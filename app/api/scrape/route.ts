import { z } from "zod";
import { isAuthorizedAdminRequest } from "@/lib/scraper/admin";
import { runScrapePipeline } from "@/lib/scraper/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

const ScrapeRequestBody = z.object({
  sourceIds: z.array(z.uuid()).optional(),
  limitPerSource: z.number().int().min(1).max(50).optional(),
});

/**
 * POST /api/scrape（session 14/session 15/session 16）
 * 手动触发抓取-入库流水线，需要 x-biasly-admin-secret 请求头。
 */
export async function POST(request: Request) {
  const auth = isAuthorizedAdminRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ScrapeRequestBody.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const summary = await runScrapePipeline(parsed.data);
    return Response.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[scraper] Scrape run failed:", error);
    return Response.json(
      {
        error: "Scrape run failed",
        message,
      },
      { status: 500 },
    );
  }
}
