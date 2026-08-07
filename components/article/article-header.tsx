import { Bookmark, MoreHorizontal, Share2 } from "lucide-react";

interface ArticleHeaderProps {
  title: string;
  sourceName: string;
  publishedAt: string;
  readMinutes: number;
}

const actions = [
  { label: "Save", Icon: Bookmark },
  { label: "Share", Icon: Share2 },
] as const;

export function ArticleHeader({
  title,
  sourceName,
  publishedAt,
  readMinutes,
}: ArticleHeaderProps) {
  return (
    <header>
      <h1 className="text-2xl font-bold leading-tight text-text-primary md:text-3xl">
        {title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-body-sm text-text-secondary">
          {sourceName} | {publishedAt} | {readMinutes} min read
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
