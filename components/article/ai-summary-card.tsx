import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiSummary } from "@/lib/article/mock-article-details";

export function AiSummaryCard({ summary }: { summary: AiSummary }) {
  return (
    <section className="rounded-lg border border-border bg-bg-primary p-5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-body-md font-semibold text-text-primary">
          AI Summary
        </h2>
        <Info
          aria-hidden
          className="size-4 text-text-secondary"
          strokeWidth={2}
        />
      </div>
      <p className="mt-1 text-caption text-text-secondary">
        Generated {summary.generatedAt} · {summary.readMinutes} min read
      </p>

      <ul className="mt-4 space-y-3">
        {summary.points.map((point, index) => (
          <li key={index} className="flex gap-2.5 text-body-md text-text-primary">
            <span
              aria-hidden
              className="mt-2 size-1.5 shrink-0 rounded-full bg-text-primary"
            />
            {point}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-caption text-text-secondary">
        {summary.disclaimer}
      </p>

      <Button variant="secondary" className="mt-4 w-full">
        Provide Feedback
      </Button>
    </section>
  );
}
