import { Bookmark, MoreHorizontal, Share2 } from "lucide-react";
import type { ArticleMeta } from "@/lib/article/mock-article-details";

const actions = [
  { label: "Save", Icon: Bookmark },
  { label: "Share", Icon: Share2 },
] as const;

export function ArticleHeader({ article }: { article: ArticleMeta }) {
  return (
    <header>
      <p className="text-caption font-medium uppercase tracking-wide text-text-secondary">
        {article.category} · {article.region}
      </p>
      <h1 className="mt-3 text-2xl font-bold leading-tight text-text-primary md:text-3xl">
        {article.title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-body-sm text-text-secondary">
          By{" "}
          <span className="font-medium text-text-primary">
            {article.author}
          </span>{" "}
          | {article.publishedAt} | {article.readMinutes} min read
        </p>
        <div className="flex items-center gap-1">
          {actions.map(({ label, Icon }) => (
            <button
              key={label}
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-body-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              <Icon aria-hidden className="size-4" strokeWidth={2} />
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-label="More options"
            className="inline-flex size-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
          >
            <MoreHorizontal aria-hidden className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
