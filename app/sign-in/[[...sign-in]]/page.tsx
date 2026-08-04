import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-h2 font-bold tracking-tight text-text-primary">
            biasly{" "}
            <span className="text-h3 font-normal text-text-secondary">
              News
            </span>
          </p>
          <p className="mt-2 text-body-md text-text-secondary">
            Balanced news coverage, powered by AI.
          </p>
        </div>
        <SignIn />
      </div>
    </main>
  );
}
