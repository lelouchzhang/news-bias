import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether to render the trailing "+" icon. */
  withPlus?: boolean;
}

export function Chip({
  className,
  withPlus = true,
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-bg-secondary px-4 py-1.5 text-body-md font-medium text-text-primary transition-colors hover:bg-surface",
        className,
      )}
      {...props}
    >
      {children}
      {withPlus ? (
        <Plus aria-hidden className="size-3.5" strokeWidth={2} />
      ) : null}
    </button>
  );
}
