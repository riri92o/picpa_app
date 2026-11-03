/** Browser decoders/encoders can stall or reject with AbortError independently
 * of our cancellation. Bound every wait and release late decoder results. */
export function waitForImageTask<T>(
  operation: Promise<T>,
  signal?: AbortSignal,
  timeoutMs = 12_000,
  disposeLate?: (value: T) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const abort = () =>
      fail(new DOMException("Export cancelled", "AbortError"));
    const timer = setTimeout(() => {
      const error = new Error("画像の準備がタイムアウトしました");
      error.name = "TimeoutError";
      fail(error);
    }, timeoutMs);
    operation.then((value) => {
      if (settled) {
        disposeLate?.(value);
        return;
      }
      settled = true;
      cleanup();
      resolve(value);
    }, fail);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
  });
}
