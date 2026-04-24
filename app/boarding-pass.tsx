"use client"

import { AnimatePresence, motion } from "motion/react"
import { useMemo } from "react"
import { formatTicketDate } from "@/lib/format-ticket-date"
import { generateTicketNumber } from "@/lib/generate-ticket-number"
import { TOURISM_LABELS } from "@/lib/tourism-labels"
import type { SpotResult } from "@/lib/types"

type TicketState = "hidden" | "unfurling" | "revealed"

type BoardingPassProps = {
  state: TicketState
  result: SpotResult | null
}

/**
 * 観光地モード用の航空券（ボーディングパス）風チケット。
 * 左側メイン + 右側スタブの2カラム構成で、中央にパンチ穴風の区切りを配する。
 */
export function BoardingPass({ state, result }: BoardingPassProps) {
  const visible = state === "unfurling" || state === "revealed"
  // biome-ignore lint/correctness/useExhaustiveDependencies: result を意図的に再計算トリガーとして使用
  const ticketNumber = useMemo(() => generateTicketNumber(), [result])
  const today = formatTicketDate(new Date())

  if (!result) return null

  const tourismLabel = TOURISM_LABELS[result.tourism] ?? result.tourism

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="mx-auto mt-4 w-full max-w-sm"
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 6 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative flex overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-[#1a3a6c]/20">
            {/* メイン部 */}
            <div className="flex-1 bg-white p-4">
              {/* ヘッダー */}
              <div className="flex items-center justify-between border-b border-[#1a3a6c]/20 pb-2">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.15em] text-[#1a3a6c]">
                    BOARDING PASS
                  </p>
                  <p className="text-[8px] tracking-wider text-[#1a3a6c]/70">
                    おでかけ航空 / ODEKAKE AIRLINES
                  </p>
                </div>
                <div
                  className="text-[10px] font-bold tracking-widest text-[#1a3a6c]"
                  style={{ fontFamily: "serif" }}
                >
                  OA
                </div>
              </div>

              {/* DESTINATION */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-3"
              >
                <p className="text-[9px] tracking-[0.2em] text-[#1a3a6c]/60">
                  DESTINATION
                </p>
                <p className="mt-1 break-words text-xl font-bold leading-tight text-[#1a3a6c]">
                  {result.name}
                </p>
                {result.prefecture && (
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-[9px] tracking-[0.2em] text-[#1a3a6c]/60">
                      REGION
                    </p>
                    <p className="text-[11px] font-semibold text-[#1a3a6c]">
                      {result.prefecture}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* DATE / TYPE */}
              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[9px] tracking-[0.2em] text-[#1a3a6c]/60">
                    DATE
                  </p>
                  <p className="text-xs font-semibold text-[#1a3a6c]">
                    {today}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] tracking-[0.2em] text-[#1a3a6c]/60">
                    TOURISM TYPE
                  </p>
                  <p className="text-xs font-semibold text-[#1a3a6c]">
                    {tourismLabel}
                  </p>
                </div>
              </div>

              {/* バーコード風装飾 */}
              <div className="mt-4 border-t border-[#1a3a6c]/20 pt-2">
                <div className="flex h-6 items-center gap-[1.5px]">
                  {Array.from({ length: 44 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full bg-[#1a3a6c]"
                      style={{
                        width:
                          i % 4 === 0 ? "3px" : i % 3 === 0 ? "1px" : "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 区切り（パンチ穴） */}
            <div className="relative w-0 border-l-2 border-dashed border-[#1a3a6c]/30">
              <div className="absolute -left-[6px] -top-[6px] size-3 rounded-full bg-[#fdf6e3]" />
              <div className="absolute -left-[6px] -bottom-[6px] size-3 rounded-full bg-[#fdf6e3]" />
            </div>

            {/* スタブ部 */}
            <div className="flex w-24 flex-col justify-between bg-[#1a3a6c] p-3 text-white">
              <div>
                <p className="text-[8px] tracking-[0.15em] text-white/70">
                  STUB
                </p>
                <p
                  className="mt-2 break-words text-[11px] font-bold leading-tight"
                  style={{ fontFamily: "serif" }}
                >
                  {result.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-white/60">{today}</p>
                <p className="text-[9px] font-bold tracking-wider">
                  No.{ticketNumber}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
