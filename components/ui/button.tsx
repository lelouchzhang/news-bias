import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "text";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const baseClasses =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-right-bias focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-transparent disabled:bg-surface disabled:text-text-secondary";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-text-primary text-bg-primary hover:bg-text-primary/90",
  secondary:
    "border border-text-primary bg-bg-primary text-text-primary hover:bg-surface",
  text: "bg-transparent px-2 text-text-primary hover:text-right-bias",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    );
  },
);
