import { cache } from "react";
import { createServerDataClient } from "@/lib/supabase/server";

export interface ActiveSource {
  id: string;
  name: string;
  listingUrl: string;
  parserStrategy: string | null;
  logoUrl: string | null;
}

/** 加载全部活跃新闻源（§8/§9：抓取流程的入口数据，供后续任务消费）。 */
export const getActiveSources = cache(async (): Promise<ActiveSource[]> => {
  const supabase = createServerDataClient();

  const { data, error } = await supabase
    .from("sources")
    .select("id, name, listing_url, parser_strategy, logo_url")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load active sources: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    listingUrl: row.listing_url,
    parserStrategy: row.parser_strategy,
    logoUrl: row.logo_url,
  }));
});
