"use client"

import { motion } from "motion/react"
import type { GachaSequenceState } from "@/lib/types"

type EnvelopeProps = {
  state: GachaSequenceState
}

/**
 * 封筒SVGコンポーネント。
 * - hidden / idle / drawing / waiting: 非表示
 * - extracting: 中央上空から下に落下（easeIn）
 * - revealing: 着地後、蓋が開く
 * - done: 非表示（チケットにバトンタッチ）
 */
export function Envelope({ state }: EnvelopeProps) {
  const isHidden =
    state === "idle" ||
    state === "drawing" ||
    state === "waiting" ||
    state === "done"

  if (isHidden) return null

  // y は「コンテナ内の上端からの距離(%)」を string で扱う
  // initial: 上端 (0%) 付近、最終: 中央下寄り (60%)
  const isFalling = state === "extracting"
  const isOpening = state === "revealing"

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute z-30"
      style={{
        left: "50%",
        top: "40%",
        marginLeft: -22, // width=44 / 2
      }}
      initial={{ y: 0, opacity: 0, rotate: -8 }}
      animate={
        isFalling
          ? { y: 70, opacity: 1, rotate: [-8, 6, -4, 2, 0] }
          : isOpening
            ? { y: 70, opacity: 1, rotate: 0 }
            : { y: 0, opacity: 0, rotate: 0 }
      }
      transition={
        isFalling
          ? {
              y: { duration: 1.3, ease: "easeIn" as const },
              opacity: { duration: 0.2 },
              rotate: { duration: 1.3, ease: "easeOut" as const },
            }
          : { duration: 0.3 }
      }
    >
      <svg
        aria-hidden="true"
        width="44"
        height="32"
        viewBox="0 0 44 32"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="env-body" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fff8e1" />
            <stop offset="100%" stopColor="#f0e4c2" />
          </linearGradient>
          <linearGradient id="env-flap" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fffdf3" />
            <stop offset="100%" stopColor="#f5e9c8" />
          </linearGradient>
        </defs>

        {/* 影 */}
        <ellipse cx="22" cy="30" rx="18" ry="1.5" fill="#00000033" />

        {/* 封筒本体 */}
        <rect
          x="2"
          y="6"
          width="40"
          height="24"
          rx="2"
          fill="url(#env-body)"
          stroke="#8a6d3b"
          strokeWidth="1"
        />

        {/* 内側の線（封筒のあわせ目） */}
        <polyline
          points="2,6 22,20 42,6"
          fill="none"
          stroke="#c8b88a"
          strokeWidth="0.6"
          opacity="0.7"
        />

        {/* 蓋（開閉アニメーション）。
            isOpening の時に上に持ち上がるよう transform-origin を上端中央に置く。 */}
        <motion.polygon
          points="2,6 22,20 42,6 22,2"
          fill="url(#env-flap)"
          stroke="#8a6d3b"
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ transformOrigin: "22px 6px" }}
          initial={{ rotateX: 0 }}
          animate={isOpening ? { rotateX: -160 } : { rotateX: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* 朱色封蝋 */}
        <circle
          cx="22"
          cy="18"
          r="3.5"
          fill="#c8102e"
          stroke="#8a0a1c"
          strokeWidth="0.8"
        />
        <text
          x="22"
          y="20.2"
          textAnchor="middle"
          fontSize="4"
          fontFamily="serif"
          fontWeight="bold"
          fill="#fff8e1"
        >
          籤
        </text>
      </svg>
    </motion.div>
  )
}
