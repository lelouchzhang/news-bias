import { Button } from "@/components/ui/button";

export function SubscribeBar() {
  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-bg-primary px-6 py-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-body-lg font-semibold text-text-primary">
          Stay Informed. Stay Balanced.
        </h2>
        <p className="mt-1 text-body-sm text-text-secondary">
          Get the top stories and bias analysis delivered to your inbox.
        </p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="Enter your email"
          className="h-10 w-full rounded-md border border-border bg-bg-primary px-3 text-body-md text-text-primary placeholder:text-text-secondary focus:border-text-primary focus:outline-none"
        />
        <Button className="shrink-0">Subscribe</Button>
      </div>
    </section>
  );
}
