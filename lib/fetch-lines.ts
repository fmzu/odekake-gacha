export async function fetchLines(prefecture: string): Promise<string[]> {
  const res = await fetch(
    `/api/lines?prefecture=${encodeURIComponent(prefecture)}`,
  );
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  return data.lines as string[];
}
