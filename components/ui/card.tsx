import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
}

export function Card({
  className,
  title,
  description,
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={cn("rounded-lg bg-bg-primary p-8 shadow-md", className)}
      {...props}
    >
      {title ? (
        <header className="mb-6">
          <h2 className="text-h2 font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-body-sm text-text-secondary">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
