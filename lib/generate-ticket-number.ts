/**
 * チケットの装飾用ダミー番号（4桁）を生成する。
 */
export function generateTicketNumber(): string {
  return String(Math.floor(Math.random() * 9000) + 1000)
}
