import { z } from "zod";
import { runAnalysisPipeline } from "@/lib/ai/analyze";
import { isAuthorizedAdminRequest } from "@/lib/scraper/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

const AnalyzeRequestBody = z.object({
  articleIds: z.array(z.uuid()).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

/**
 * POST /api/analyze（§14/§15/§19）。
 * 触发 AI 文章分析流水线，需要 x-biasly-admin-secret 请求头。
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

  const parsed = AnalyzeRequestBody.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const summary = await runAnalysisPipeline(parsed.data);
    return Response.json({ summary });
  } catch (error) {
    // const message = error instanceof Error ? error.message : String(error);
    console.error("[analyze] Analysis run failed:", error);
    return Response.json({ error: "Analysis run failed" }, { status: 500 });
  }
}

export function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
