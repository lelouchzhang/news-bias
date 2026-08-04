import Image from "next/image";
import type { ArticleMeta } from "@/lib/article/mock-article-details";

export function ArticleHero({ article }: { article: ArticleMeta }) {
  return (
    <figure>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-bg-secondary">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
      </div>
      <figcaption className="mt-2 text-caption text-text-secondary">
        {article.imageCaption}
      </figcaption>
    </figure>
  );
}
