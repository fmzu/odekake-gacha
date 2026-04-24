export async function fetchFromApi<T>(
  path: string,
  params: Record<string, string>,
  key: string,
): Promise<T[]> {
  const query = new URLSearchParams(params).toString()
  const url = query ? `/api/${path}?${query}` : `/api/${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`status ${res.status}`)
  const data = await res.json()
  const result = data[key]
  if (!Array.isArray(result)) {
    throw new Error(`Expected array for key "${key}", got ${typeof result}`)
  }
  return result as T[]
}
