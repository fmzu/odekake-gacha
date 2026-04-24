export async function retryWithAttempts<T>(
  fn: () => Promise<T | null>,
  maxAttempts: number,
  context: string,
): Promise<T> {
  let lastError: unknown = null
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const result = await fn()
      if (result !== null) return result
    } catch (err) {
      lastError = err
    }
  }
  throw new Error(
    `${context} failed after ${maxAttempts} attempts: ${String(lastError)}`,
  )
}
