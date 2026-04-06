export async function fetchAreas(): Promise<string[]> {
  const res = await fetch("/api/areas");
  const data = await res.json();
  return data.areas as string[];
}
