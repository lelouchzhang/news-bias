import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ServiceClient = SupabaseClient<Database>;
type LogLevel = "info" | "warn" | "error";

/**
 * 双写日志：控制台 + logs 表（搂9 run logging）。
 * logs 表写入失败不中断流水线，仅记录警告。
 */
export async function writeLog(
  supabase: ServiceClient,
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  if (level === "error") {
    console.error(`[scraper] ${message}`, context ?? "");
  } else if (level === "warn") {
    console.warn(`[scraper] ${message}`, context ?? "");
  } else {
    console.log(`[scraper] ${message}`, context ?? "");
  }

  try {
    await supabase.from("logs").insert({
      level,
      message,
      context: (context ?? {}) as Database["public"]["Tables"]["logs"]["Insert"]["context"],
    });
  } catch (error) {
    console.warn(
      `[scraper] Failed to write log to Supabase: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
