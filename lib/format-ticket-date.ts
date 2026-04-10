/**
 * チケットに表示する日付をフォーマットする（例: "2026.4.10"）。
 */
export function formatTicketDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}.${m}.${d}`;
}
