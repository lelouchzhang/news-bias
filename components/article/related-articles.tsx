import Image from "next/image";
import Link from "next/link";
import type { RelatedArticle } from "@/lib/article/types";

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

/**
 * 「相关文章」区块（AGENTS.md §20）：按余弦相似度展示最多 5 篇相似文章。
 * 无相关文章时不渲染（由页面侧控制传入空数组或直接不挂载）。
 */
export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-body-lg font-semibold text-text-primary">
        Related Stories
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/article/${article.slug}`}
            className="group flex items-start gap-4 rounded-lg border border-border bg-bg-primary p-4 transition-shadow hover:shadow-md"
          >
            {article.imageUrl ? (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-bg-secondary">
                <Image
                  src={article.imageUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-caption font-medium uppercase tracking-wide text-text-secondary">
                {article.sourceName} · {article.publishedAt}
              </p>
              <h3 className="mt-1 line-clamp-2 text-body-md font-semibold leading-snug text-text-primary">
                {article.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
