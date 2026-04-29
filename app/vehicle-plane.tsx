"use client"

import { motion } from "motion/react"

export type VehicleState =
  | "idle"
  | "drawing"
  | "waiting"
  | "extracting"
  | "revealing"
  | "done"

type VehiclePlaneProps = {
  state: VehicleState
}

/**
 * 観光地モード用：俯瞰視点の飛行機SVG。
 * drawing / waiting で画面右外から左外へ横切る。waiting 中はループ。
 * extracting 以降は画面外で非表示。
 */
export function VehiclePlane({ state }: VehiclePlaneProps) {
  const isFlying = state === "drawing" || state === "waiting"
  const isHidden = state === "idle" || state === "revealing" || state === "done"

  if (isHidden) return null

  const animateProps = (() => {
    if (isFlying) {
      return {
        x: ["110%", "-110%"] as (string | number)[],
      }
    }
    return { x: ["0%", "-110%"] as (string | number)[] }
  })()

  const transitionProps = (() => {
    if (isFlying) {
      return {
        x: {
          duration: 1.8,
          ease: "linear" as const,
          repeat: Infinity,
        },
      }
    }
    return {
      x: { duration: 0.9, ease: "easeIn" as const },
    }
  })()

  return (
    <motion.div
      className="pointer-events-none absolute z-20"
      style={{
        left: "50%",
        top: "32%",
        marginLeft: -50, // width=100 / 2
      }}
      initial={{ x: "110%" }}
      animate={animateProps}
      transition={transitionProps}
    >
      <svg
        width="100"
        height="60"
        viewBox="0 0 100 60"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <title>飛行機</title>
        <defs>
          <linearGradient id="plane-body" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="50%" stopColor="#f4ead0" />
            <stop offset="100%" stopColor="#e6d8a8" />
          </linearGradient>
        </defs>
        {/* 主翼（左右に広がる） */}
        <polygon
          points="50,18 14,38 22,42 50,30 78,42 86,38"
          fill="url(#plane-body)"
          stroke="#8a6d3b"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* 胴体（左→右が機首方向、ここでは左を機首に向ける） */}
        <ellipse
          cx="50"
          cy="30"
          rx="42"
          ry="6"
          fill="url(#plane-body)"
          stroke="#8a6d3b"
          strokeWidth="1"
        />
        {/* 機首（左端を尖らせる） */}
        <polygon
          points="8,30 18,26 18,34"
          fill="url(#plane-body)"
          stroke="#8a6d3b"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* 尾翼（右端の小さな三角） */}
        <polygon
          points="86,30 96,22 96,38"
          fill="url(#plane-body)"
          stroke="#8a6d3b"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* 水平尾翼（横線） */}
        <polygon
          points="86,30 78,40 84,40 92,30 84,20 78,20"
          fill="url(#plane-body)"
          stroke="#8a6d3b"
          strokeWidth="0.8"
          strokeLinejoin="round"
          opacity="0.95"
        />
        {/* 胴体の窓ライン */}
        <line
          x1="22"
          y1="30"
          x2="80"
          y2="30"
          stroke="#8a6d3b"
          strokeWidth="0.5"
          opacity="0.5"
          strokeDasharray="2 2"
        />
      </svg>
    </motion.div>
  )
}
