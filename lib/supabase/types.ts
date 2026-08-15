/**
 * Supabase 数据库类型（与 supabase/schema.sql 严格同步）。
 *
 * 变更约定（AGENTS.md §7）：
 * - 修改下方任意字段时，同时更新 supabase/schema.sql，
 *   并在测试前于 Supabase Dashboard → SQL Editor 执行对应的 ALTER SQL。
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BiasLabel = "left" | "center" | "right" | "mixed" | "unclear";
export type SentimentLabel = "positive" | "neutral" | "negative";

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: {
          id: string;
          name: string;
          listing_url: string;
          parser_strategy: string | null;
          active: boolean;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          listing_url: string;
          parser_strategy?: string | null;
          active?: boolean;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          listing_url?: string;
          parser_strategy?: string | null;
          active?: boolean;
          logo_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          source_id: string;
          original_url: string;
          canonical_url: string;
          slug: string;
          title: string;
          image_url: string;
          published_at: string;
          raw_text: string;
          scraped_at: string;
          analyzed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          original_url: string;
          canonical_url: string;
          slug: string;
          title: string;
          image_url: string;
          published_at: string;
          raw_text: string;
          scraped_at?: string;
          analyzed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          original_url?: string;
          canonical_url?: string;
          slug?: string;
          title?: string;
          image_url?: string;
          published_at?: string;
          raw_text?: string;
          scraped_at?: string;
          analyzed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      article_analyses: {
        Row: {
          id: string;
          article_id: string;
          summary: string;
          sentiment_score: number;
          sentiment_label: SentimentLabel;
          bias_label: BiasLabel;
          left_percentage: number;
          center_percentage: number;
          right_percentage: number;
          bias_score: number;
          confidence: number;
          framing_notes: string;
          loaded_terms: string[];
          disclaimer: string;
          model: string;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          summary: string;
          sentiment_score: number;
          sentiment_label: SentimentLabel;
          bias_label: BiasLabel;
          left_percentage: number;
          center_percentage: number;
          right_percentage: number;
          bias_score?: never; // 生成列
          confidence: number;
          framing_notes: string;
          loaded_terms?: string[];
          disclaimer: string;
          model: string;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          summary?: string;
          sentiment_score?: number;
          sentiment_label?: SentimentLabel;
          bias_label?: BiasLabel;
          left_percentage?: number;
          center_percentage?: number;
          right_percentage?: number;
          bias_score?: never; // 生成列
          confidence?: number;
          framing_notes?: string;
          loaded_terms?: string[];
          disclaimer?: string;
          model?: string;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_analyses_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: true;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      logs: {
        Row: {
          id: number;
          level: "info" | "warn" | "error";
          message: string;
          context: Json | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          level: "info" | "warn" | "error";
          message: string;
          context?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          level?: "info" | "warn" | "error";
          message?: string;
          context?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      oxylabs_schedules: {
        Row: {
          id: string;
          source_id: string;
          oxylabs_schedule_id: string;
          status: "active" | "paused";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          oxylabs_schedule_id: string;
          status?: "active" | "paused";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          oxylabs_schedule_id?: string;
          status?: "active" | "paused";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oxylabs_schedules_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: true;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      oxylabs_schedule_runs: {
        Row: {
          id: string;
          schedule_id: string;
          oxylabs_run_id: string;
          status: "pending" | "done" | "faulted";
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          oxylabs_run_id: string;
          status?: "pending" | "done" | "faulted";
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          oxylabs_run_id?: string;
          status?: "pending" | "done" | "faulted";
          processed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oxylabs_schedule_runs_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "oxylabs_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_related_articles: {
        Args: {
          p_article_id: string;
          p_embedding: number[];
          p_limit?: number;
        };
        Returns: {
          article_id: string;
          slug: string;
          title: string;
          image_url: string;
          published_at: string;
          source_id: string;
          source_name: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
