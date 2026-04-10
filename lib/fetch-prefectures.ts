export async function fetchPrefectures(area: string): Promise<string[]> {
  const res = await fetch(
    `/api/prefectures?area=${encodeURIComponent(area)}`,
  );
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  return data.prefectures as string[];
}
