import { isAxiosError } from 'axios';

// Laravel's validation response shape: { message, errors: { field: string[] } }
type ValidationErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function extractFieldErrors(err: unknown): Record<string, string[]> | null {
  if (isAxiosError(err) && err.response?.status === 422) {
    const body = err.response.data as ValidationErrorBody;
    return body.errors ?? null;
  }
  return null;
}

export function extractErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as ValidationErrorBody | undefined;
    if (body?.message) return body.message;
    if (err.message) return err.message;
  }
  // Not an Axios error at all — a genuine bug (bad response shape, a
  // TypeError in our own code) rather than a network/API failure. Surface
  // whatever we have instead of a generic string, so the real cause shows
  // up on screen instead of getting silently collapsed.
  if (err instanceof Error) return err.message || err.toString();
  return 'Something went wrong. Please try again.';
}
