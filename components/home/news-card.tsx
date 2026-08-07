import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { BiasMeter } from "@/components/ui/bias-meter";
import { Chip } from "@/components/ui/chip";
import { biasLabelDisplay } from "@/lib/article/types";
import type { ArticleCard } from "@/lib/article/types";

export function NewsCard({ article }: { article: ArticleCard }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-bg-primary shadow-md transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-bg-secondary">
        <Image
          src={article.imageUrl}
          alt={`${article.sourceName} news illustration`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-bg-primary/80 text-text-secondary backdrop-blur-sm">
          <Info aria-hidden className="size-3.5" strokeWidth={2} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-caption font-medium uppercase tracking-wide text-text-secondary">
          {article.sourceName} · {article.publishedAt}
        </p>
        <h3 className="line-clamp-3 text-[15px] font-semibold leading-snug text-text-primary">
          {article.title}
        </h3>
        <div className="mt-auto space-y-2">
          <BiasMeter
            left={article.left}
            center={article.center}
            right={article.right}
            variant="segmented"
          />
          <div className="flex items-center justify-between gap-2 text-caption text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Chip withPlus={false} className="px-2.5 py-0.5">
                {article.sentimentLabel}
              </Chip>
              <Chip withPlus={false} className="px-2.5 py-0.5">
                {biasLabelDisplay[article.biasLabel]}
              </Chip>
            </div>
            <span>{Math.round(article.confidence * 100)}% confidence</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
