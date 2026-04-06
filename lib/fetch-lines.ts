export async function fetchLines(prefecture: string): Promise<string[]> {
  const res = await fetch(
    `/api/lines?prefecture=${encodeURIComponent(prefecture)}`,
  );
  const data = await res.json();
  return data.lines as string[];
}
