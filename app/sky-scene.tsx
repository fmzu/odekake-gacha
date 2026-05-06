"use client"

import { motion } from "motion/react"
import type { GachaSequenceState } from "@/lib/types"
import { Envelope } from "./envelope"
import { VehiclePlane } from "./vehicle-plane"

type SkySceneProps = {
  state: GachaSequenceState
  onDrawClick: () => void
  children?: React.ReactNode
}

// 雲アニメーションの設定
const CLOUD_CONFIGS = [
  {
    width: 90,
    height: 28,
    top: "18%",
    left: "12%",
    backgroundColor: "rgba(255,255,255,0.7)",
    duration: 8,
    drift: 10,
  },
  {
    width: 70,
    height: 22,
    top: "55%",
    left: "65%",
    backgroundColor: "rgba(255,255,255,0.6)",
    duration: 10,
    drift: -12,
  },
  {
    width: 50,
    height: 18,
    top: "72%",
    left: "8%",
    backgroundColor: "rgba(255,255,255,0.55)",
    duration: 9,
    drift: 8,
  },
] as const

/**
 * 青空を俯瞰する抽選シーン。
 * - 背景に青空 + ふんわりした雲を配置
 * - 飛行機が画面を横切り、封筒を落とす
 * - 封筒が落下 → 開封 → チケット表示（children）へ繋ぐ
 * - 下部の「引く」ボタンで抽選開始（idle のときのみ表示）
 */
export function SkyScene({ state, onDrawClick, children }: SkySceneProps) {
  const isRevealedPhase = state === "revealing" || state === "done"

  return (
    <div className="relative flex flex-col items-center justify-center gap-3">
      {/* 空のステージ */}
      <div
        className="relative w-full overflow-hidden rounded-lg border border-[#cfe4f3] bg-gradient-to-b from-[#a8d8ea] to-[#fdf6e3]"
        style={{ height: 280 }}
      >
        {/* 雲（薄い透明度） */}
        {CLOUD_CONFIGS.map((cloud) => (
          <motion.div
            key={`cloud-${cloud.top}-${cloud.left}`}
            aria-hidden
            className="pointer-events-none absolute z-0 rounded-full blur-[1px]"
            style={{
              width: cloud.width,
              height: cloud.height,
              top: cloud.top,
              left: cloud.left,
              backgroundColor: cloud.backgroundColor,
            }}
            animate={{ x: [0, cloud.drift, 0] }}
            transition={{
              duration: cloud.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* 乗り物（駅・観光地どちらも飛行機） */}
        <VehiclePlane state={state} />

        {/* 封筒（落下→開封） */}
        <Envelope state={state} />

        {/* チケット表示エリア（revealing / done のときのみ） */}
        {isRevealedPhase && (
          <motion.div
            key="ticket-overlay"
            className="absolute inset-0 z-40 flex items-center justify-center px-4 py-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        )}

        {/* 引くボタン（idle 時のみ表示。シーンの上に重ねる） */}
        {state === "idle" && (
          <button
            type="button"
            onClick={onDrawClick}
            className="absolute bottom-12 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-lg border border-[#a04e15] bg-gradient-to-b from-[#f08c2a] to-[#cc5e15] px-10 py-2.5 text-base font-bold text-white shadow-md transition hover:brightness-105 active:translate-y-[1px] active:shadow-sm"
            aria-label="おみくじを引く"
          >
            引く
          </button>
        )}

        {/* idle 時のヒント（ボタンの下） */}
        {state === "idle" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[11px] tracking-wider text-[#8a6d3b]/70">
            空に乗り物がやってきます
          </div>
        )}
      </div>
    </div>
  )
}
