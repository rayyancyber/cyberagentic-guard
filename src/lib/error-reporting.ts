// Generic runtime error reporting. Logs to console in dev; swap for
// your error monitoring service (Sentry, etc.) in production.

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[ErrorBoundary]", describeThrown(error), context);
}

const MAX_LEN = 2000;

export function describeThrown(error: unknown): string {
  if (error instanceof Response) {
    return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  const { message } = (error ?? {}) as { message?: unknown };
  if (typeof message === "string" && message.length > 0) return message;
  try {
    return JSON.stringify(error)?.slice(0, MAX_LEN) ?? String(error);
  } catch {
    return String(error);
  }
}
