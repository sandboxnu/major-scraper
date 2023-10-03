/**
 * Types for a some result from an algorithim.
 */
export enum ResultType {
  Ok = "Ok",
  Err = "Err",
}

export type Result<T, E> =
  | { ok: T; type: ResultType.Ok }
  | { err: E; type: ResultType.Err };

export const Ok = <T, E>(ok: T): Result<T, E> => ({ ok, type: ResultType.Ok });

export const Err = <T, E>(err: E): Result<T, E> => ({
  err,
  type: ResultType.Err,
});

// A helper to show that a branch or condition shouldn't occur.

export const assertUnreachable = (_: never): never => {
  throw new Error("This code is unreachable");
};
