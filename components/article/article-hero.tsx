import Image from "next/image";

interface ArticleHeroProps {
  title: string;
  imageUrl: string;
  imageCaption?: string | null;
}

export function ArticleHero({
  title,
  imageUrl,
  imageCaption,
}: ArticleHeroProps) {
  return (
    <figure>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-bg-secondary">
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
      </div>
      {imageCaption ? (
        <figcaption className="mt-2 text-caption text-text-secondary">
          {imageCaption}
        </figcaption>
      ) : null}
    </figure>
  );
}
