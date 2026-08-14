/**
 * Utility functions
 */

export const stringifyError = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return JSON.stringify(err);
};
