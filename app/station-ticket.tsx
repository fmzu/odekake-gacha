"use client";

import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { formatTicketDate } from "@/lib/format-ticket-date";
import { generateTicketNumber } from "@/lib/generate-ticket-number";
import type { StationResult } from "@/lib/types";

type TicketState = "hidden" | "unfurling" | "revealed";

type StationTicketProps = {
  state: TicketState;
  result: StationResult | null;
};

/**
 * 駅モード用の硬券風チケットコンポーネント。
 * state が "unfurling" → "revealed" と推移するとき、
 * チケットがふわっと出てくるアニメーションを再生する。
 */
export function StationTicket({ state, result }: StationTicketProps) {
  const visible = state === "unfurling" || state === "revealed";
  // チケット番号は result が切り替わったタイミングで毎回引き直す
  const ticketNumber = useMemo(
    () => generateTicketNumber(),
    // result.name が変われば新しい番号に
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result?.name],
  );
  const today = useMemo(() => formatTicketDate(new Date()), [result?.name]);

  return (
    <AnimatePresence>
      {visible && result && (
        <motion.div
          className="mx-auto mt-4 w-full max-w-xs"
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 6 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="relative overflow-hidden rounded-sm bg-[#fdf9ec] px-5 pt-4 pb-6 shadow-xl ring-1 ring-[#cdb97f]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(138,109,59,0.04) 0px, rgba(138,109,59,0.04) 2px, transparent 2px, transparent 6px)",
            }}
          >
            {/* 上部ラベル */}
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[#3a1d0a]">
              <span className="inline-block size-2 rounded-full border border-[#3a1d0a]" />
              <span>乗車券</span>
            </div>

            {/* 中央の駅名 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-center"
            >
              <p
                className="text-3xl font-bold tracking-[0.3em] text-[#3a1d0a]"
                style={{ fontFamily: "serif" }}
              >
                {result.name}
              </p>
              <div className="mx-auto mt-2 w-2/3 border-t border-dashed border-[#8a6d3b]/60" />
              <p className="mt-2 text-[11px] tracking-wider text-[#8a6d3b]">
                {result.line}
              </p>
              <p className="mt-0.5 text-[11px] tracking-wider text-[#8a6d3b]">
                {result.prefecture}
              </p>
            </motion.div>

            {/* 下部情報 */}
            <div className="mt-5 flex items-center justify-between text-[10px] text-[#3a1d0a]/70">
              <span className="tracking-wider">{today}</span>
              <span className="tracking-wider">No.{ticketNumber}</span>
            </div>

            {/* 磁気帯 */}
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#1a1a1a]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
