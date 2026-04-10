export async function fetchAreas(): Promise<string[]> {
  const res = await fetch("/api/areas");
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  return data.areas as string[];
}
