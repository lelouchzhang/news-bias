import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { AiSummaryView } from "@/lib/article/types";

export function AiSummaryCard({ summary }: { summary: AiSummaryView }) {
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
        Generated {summary.generatedAt}
      </p>

      <p className="mt-4 text-body-md text-text-primary">{summary.summary}</p>

      {summary.loadedTerms.length > 0 ? (
        <div className="mt-5">
          <p className="text-caption font-medium uppercase tracking-wide text-text-secondary">
            Loaded Terms
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.loadedTerms.map((term) => (
              <Chip
                key={term}
                withPlus={false}
                className="px-3 py-1 text-caption"
              >
                {term}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-caption text-text-secondary">
        {summary.disclaimer}
      </p>

      <Button variant="secondary" className="mt-4 w-full">
        Provide Feedback
      </Button>
    </section>
  );
}
