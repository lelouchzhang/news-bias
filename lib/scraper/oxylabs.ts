import "server-only";
import { OXYLABS_REQUEST_TIMEOUT_MS } from "@/lib/scraper/constants";

const OXYLABS_REALTIME_URL = "https://realtime.oxylabs.io/v1/queries";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function basicAuthHeader(): string {
  const username = requireEnv("OXY_WSA_USERNAME");
  const password = requireEnv("OXY_WSA_PASSWORD");
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

interface OxylabsResult {
  content?: string;
  content_encoding?: string;
  status_code?: number;
  url?: string;
}

interface OxylabsResponse {
  results?: OxylabsResult[];
  error?: string;
}

/**
 * 通过 Oxylabs Realtime API 抓取单个页面的 HTML。
 * 首页与详情页共用同一客户端（session 9）。
 */
export async function fetchPageHtml(url: string): Promise<{
  html: string;
  statusCode: number;
}> {
  const response = await fetch(OXYLABS_REALTIME_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify({
      source: "universal",
      url,
      render: "html",
      user_agent_type: "desktop_chrome",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(OXYLABS_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Oxylabs request failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as OxylabsResponse;
  const result = payload.results?.[0];

  if (!result) {
    throw new Error(
      `Oxylabs returned no results: ${payload.error ?? "unknown error"}`,
    );
  }

  if (result.status_code !== undefined && result.status_code !== 200) {
    throw new Error(
      `Oxylabs target page returned HTTP ${result.status_code} for ${url}`,
    );
  }

  if (!result.content) {
    throw new Error(`Oxylabs returned empty content for ${url}`);
  }

  const html =
    result.content_encoding === "base64"
      ? Buffer.from(result.content, "base64").toString("utf-8")
      : result.content;

  return { html, statusCode: result.status_code ?? 200 };
}
