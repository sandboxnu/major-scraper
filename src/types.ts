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

export type Matcher<T, E, R1, R2> = {
  Ok: (value: T) => R1;
  Err: (error: E) => R2;
};

export function matchResult<T, E, R1, R2>(
  result: Result<T, E>,
  matcher: Matcher<T, E, R1, R2>,
) {
  return result.type === ResultType.Ok
    ? matcher.Ok(result.ok)
    : matcher.Err(result.err);
}

export function matchPipe<T, E, R1, R2>(matcher: Matcher<T, E, R1, R2>) {
  return (result: Result<T, E>) =>
    result.type === ResultType.Ok
      ? matcher.Ok(result.ok)
      : matcher.Err(result.err);
}
