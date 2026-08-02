"use client";

/**
 * Root error boundary. This replaces the entire app (including the layout)
 * on fatal errors, so it must render its own <html> and <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center bg-background p-6 font-sans text-foreground">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Unexpected error</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The app hit a fatal error. Reload to recover.
            {error.digest ? ` (${error.digest})` : ""}
          </p>
          <button
            onClick={reset}
            className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
