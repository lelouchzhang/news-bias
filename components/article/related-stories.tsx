import Image from "next/image";
import Link from "next/link";
import type { RelatedStory } from "@/lib/article/mock-article-details";

export function RelatedStories({ stories }: { stories: RelatedStory[] }) {
  return (
    <section>
      <h2 className="text-h2 font-semibold text-text-primary">
        Related Stories
      </h2>
      <div className="mt-4 border-t border-border" />
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {stories.map((story) => (
          <Link
            key={story.slug}
            href={`/article/${story.slug}`}
            className="group flex gap-4 rounded-lg bg-bg-primary p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-bg-secondary">
              <Image
                src={story.imageUrl}
                alt=""
                fill
                sizes="96px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center">
              <p className="text-caption font-medium uppercase tracking-wide text-text-secondary">
                {story.category} · {story.region}
              </p>
              <h3 className="mt-1 line-clamp-2 text-body-md font-semibold leading-snug text-text-primary group-hover:text-right-bias">
                {story.title}
              </h3>
              <p className="mt-1 text-caption text-text-secondary">
                {story.date} · {story.readMinutes} min read
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
