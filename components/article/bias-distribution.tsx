import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BiasDistribution as BiasDistributionData } from "@/lib/article/mock-article-details";

interface BiasDistributionProps {
  distribution: BiasDistributionData;
  sourceCount: number;
}

const segments = [
  {
    label: "Left",
    barClass: "bg-left-bias",
    textClass: "text-bg-primary",
  },
  {
    label: "Center",
    barClass: "bg-center-bias",
    textClass: "text-text-primary",
  },
  {
    label: "Right",
    barClass: "bg-right-bias",
    textClass: "text-bg-primary",
  },
] as const;

export function BiasDistribution({
  distribution,
  sourceCount,
}: BiasDistributionProps) {
  const values = [
    distribution.left,
    distribution.center,
    distribution.right,
  ];

  return (
    <section className="rounded-lg border border-border bg-bg-primary p-5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-body-md font-semibold text-text-primary">
          Bias Distribution
        </h2>
        <Info
          aria-hidden
          className="size-4 text-text-secondary"
          strokeWidth={2}
        />
      </div>
      <div
        className="mt-3 flex h-8 w-full overflow-hidden rounded-md"
        role="img"
        aria-label={`Bias distribution: Left ${distribution.left}%, Center ${distribution.center}%, Right ${distribution.right}%`}
      >
        {segments.map((segment, index) => (
          <div
            key={segment.label}
            className={cn(
              "flex min-w-10 items-center justify-center overflow-hidden px-1",
              segment.barClass,
            )}
            style={{ width: `${values[index]}%` }}
          >
            <span
              className={cn(
                "truncate text-[11px] font-medium leading-none",
                segment.textClass,
              )}
            >
              {segment.label} {values[index]}%
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-caption text-text-secondary">
        {sourceCount} sources
      </p>
    </section>
  );
}
