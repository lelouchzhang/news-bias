import { cn } from "@/lib/utils";

export interface BiasMeterProps {
  /** Left bias percentage (0-100). */
  left?: number;
  /** Center percentage (0-100). */
  center?: number;
  /** Right bias percentage (0-100). */
  right?: number;
  /**
   * "detailed" renders segment labels below the bar plus a 0/50/100 scale.
   * "segmented" renders short labels inside each colored segment (news card style).
   */
  variant?: "detailed" | "segmented";
  className?: string;
}

export function BiasMeter({
  left = 25,
  center = 50,
  right = 25,
  variant = "detailed",
  className,
}: BiasMeterProps) {
  const segments = [
    {
      label: variant === "segmented" ? `Left ${left}%` : "Left",
      value: left,
      barClass: "bg-left-bias",
      textClass: "text-bg-primary",
    },
    {
      label: variant === "segmented" ? `Center ${center}%` : "Center",
      value: center,
      barClass: "bg-center-bias",
      textClass: "text-text-primary",
    },
    {
      label: variant === "segmented" ? `Right ${right}%` : "Right",
      value: right,
      barClass: "bg-right-bias",
      textClass: "text-bg-primary",
    },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full",
          variant === "segmented" ? "h-7 gap-px" : "h-2.5",
        )}
        role="img"
        aria-label={`Bias meter: Left ${left}%, Center ${center}%, Right ${right}%`}
      >
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={cn(
              segment.barClass,
              variant === "segmented" &&
                "flex min-w-10 items-center justify-center overflow-hidden px-1",
            )}
            style={{ width: `${segment.value}%` }}
            title={segment.label}
          >
            {variant === "segmented" ? (
              <span
                className={cn(
                  "truncate text-[11px] font-medium leading-none",
                  segment.textClass,
                )}
              >
                {segment.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {variant === "detailed" ? (
        <>
          <div className="mt-2 flex w-full items-center justify-between text-caption text-text-secondary">
            {segments.map((segment) => (
              <span key={segment.label}>
                {segment.label} {segment.value}%
              </span>
            ))}
          </div>
          <div className="mt-1 flex w-full items-center justify-between text-caption text-text-secondary">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
