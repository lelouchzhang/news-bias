import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { BiasMeter } from "@/components/ui/bias-meter";
import type { HomeArticle } from "@/lib/home/mock-articles";

export function NewsCard({ article }: { article: HomeArticle }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-bg-primary shadow-md transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-bg-secondary">
        <Image
          src={article.imageUrl}
          alt={`${article.category} news illustration`}
          fill
          priority={article.id === "card-01"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-bg-primary/80 text-text-secondary backdrop-blur-sm">
          <Info aria-hidden className="size-3.5" strokeWidth={2} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-caption font-medium uppercase tracking-wide text-text-secondary">
          {article.category} · {article.region}
        </p>
        <h3 className="line-clamp-3 text-[15px] font-semibold leading-snug text-text-primary">
          {article.title}
        </h3>
        <div className="mt-auto">
          <BiasMeter
            left={article.left}
            center={article.center}
            right={article.right}
            variant="segmented"
          />
          <p className="mt-2 text-caption text-text-secondary">
            {article.sourceCount} sources
          </p>
        </div>
      </div>
    </Link>
  );
}
