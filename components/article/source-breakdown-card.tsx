import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  biasLabelBarClass,
  biasLabelDisplay,
  biasLabelTextClass,
  type SourceBreakdown,
} from "@/lib/article/mock-article-details";

export function SourceBreakdownCard({
  breakdown,
}: {
  breakdown: SourceBreakdown;
}) {
  return (
    <section className="rounded-lg border border-border bg-bg-primary p-5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-body-md font-semibold text-text-primary">
          Source Breakdown
        </h2>
        <Info
          aria-hidden
          className="size-4 text-text-secondary"
          strokeWidth={2}
        />
      </div>
      <p className="mt-1 text-caption text-text-secondary">
        {breakdown.totalSources} Total Sources
      </p>

      <ul className="mt-4 space-y-2">
        {breakdown.tallies.map((tally) => (
          <li
            key={tally.label}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-body-sm text-text-primary">
              {biasLabelDisplay[tally.label]} {tally.count} ({tally.percent}%)
            </span>
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-secondary">
              <span
                className={cn(
                  "block h-full rounded-full",
                  biasLabelBarClass[tally.label],
                )}
                style={{ width: `${tally.percent}%` }}
              />
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-border" />

      <div className="mt-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-caption font-medium uppercase tracking-wide text-text-secondary">
            Top Sources
          </span>
          <span className="text-caption font-medium uppercase tracking-wide text-text-secondary">
            Bias
          </span>
        </div>
        <ul>
          {breakdown.topSources.map((source) => (
            <li
              key={source.name}
              className="flex items-center justify-between border-b border-divider py-2.5 last:border-b-0"
            >
              <span className="text-body-md text-text-primary">
                {source.name}
              </span>
              <span
                className={cn(
                  "text-body-sm font-medium",
                  biasLabelTextClass[source.bias],
                )}
              >
                {biasLabelDisplay[source.bias]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button variant="secondary" className="mt-4 w-full">
        View All Sources
      </Button>
    </section>
  );
}
