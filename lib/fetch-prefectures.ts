export async function fetchPrefectures(area: string): Promise<string[]> {
  const res = await fetch(
    `/api/prefectures?area=${encodeURIComponent(area)}`,
  );
  const data = await res.json();
  return data.prefectures as string[];
}
