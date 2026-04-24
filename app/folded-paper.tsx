"use client"

import { motion } from "motion/react"

export type FoldedPaperState = "hidden" | "extracting" | "done"

type FoldedPaperProps = {
  state: FoldedPaperState
}

/**
 * 折りたたまれたおみくじ紙のSVGコンポーネント。
 * 箱の上面の穴から上方向にスーッと出てくる。
 * API が返ってくるまでは hidden のまま（紙は箱の中に完全に隠れている）。
 * API が返ってきたら extracting で一気に滑らかに出てくる。
 */
export function FoldedPaper({ state }: FoldedPaperProps) {
  // 座標計算（omikuji-box.tsx の穴の位置に合わせる）:
  // - 箱 motion.div: width=220 height=260、SVG viewBox も 0 0 220 260（1px=1unit）
  // - 穴: <ellipse cx=120 cy=62 rx=26 ry=6> → 中心(120, 62), 内径 幅52 × 高さ12
  // - 紙SVG: width=32 height=96, 内部 rect は x=4 y=2 width=24 height=92 → 紙の下端は SVG ローカル y=94
  // - 紙の横中心を穴中心 x=120 に合わせる:
  //     left = 120 - 32/2 = 104 → rect 中心 104+4+12 = 120
  // - 縦位置の基準（baseTop）は「紙の下端が穴の中心 y=62 に一致する位置」:
  //     baseTop = 62 - 94 = -32
  //   この状態（y=0）で紙の上端は画面 y=-30、下端は画面 y=62 となり、紙の大部分は箱の上に見える。
  // - extracting / done（紙が完全に出てきた状態）: 紙の下端を穴の少し下 (画面 y=70) に置き、
  //   下端が穴に少し食い込んで「穴から生えている」ように見せる → y = +8
  //     → 紙上端: -30+8 = -22、紙下端: 62+8 = 70
  // - hidden（完全に箱の中）: 紙の上端を穴の下 (画面 y=94) に沈める → y = 124
  //     → 紙上端: -30+124 = 94、紙下端: 62+124 = 186
  const baseTop = 62 - 94 // -32
  const hiddenY = 124 // 紙全体を穴の下に沈める（上端が穴の下端 y=94 に一致）
  const fullY = 8 // 紙の下端を穴の少し下 (y=70) に置き、本体は穴から上に伸びている

  const animate = (() => {
    switch (state) {
      case "hidden":
        return { y: hiddenY, opacity: 0 }
      case "extracting":
      case "done":
        return { y: fullY, opacity: 1 }
    }
  })()

  const transition = (() => {
    switch (state) {
      case "extracting":
        return {
          y: { duration: 1.5, ease: [0.22, 1, 0.36, 1] as const },
          opacity: { duration: 0.3 },
        }
      default:
        return {
          y: { duration: 0.3, ease: "easeOut" as const },
          opacity: { duration: 0.3 },
        }
    }
  })()

  return (
    <motion.div
      className="pointer-events-none absolute z-30"
      style={{ left: 120 - 16, top: baseTop }}
      initial={{ y: hiddenY, opacity: 0 }}
      animate={animate}
      transition={transition}
    >
      <svg
        width="32"
        height="96"
        viewBox="0 0 32 96"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", position: "relative" }}
      >
        <title>おみくじ紙</title>
        <defs>
          <linearGradient id="paper-body" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f0e6c8" />
            <stop offset="50%" stopColor="#fff8e1" />
            <stop offset="100%" stopColor="#e8dcb5" />
          </linearGradient>
        </defs>

        {/* 紙本体（折り紙風の縦長長方形） */}
        <rect
          x="4"
          y="2"
          width="24"
          height="92"
          rx="1.5"
          fill="url(#paper-body)"
          stroke="#8a6d3b"
          strokeWidth="0.8"
        />

        {/* 折り目ライン（縦に沿う薄い線） */}
        <line
          x1="10"
          y1="4"
          x2="10"
          y2="92"
          stroke="#c8b88a"
          strokeWidth="0.5"
          opacity="0.7"
        />
        <line
          x1="16"
          y1="4"
          x2="16"
          y2="92"
          stroke="#c8b88a"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <line
          x1="22"
          y1="4"
          x2="22"
          y2="92"
          stroke="#c8b88a"
          strokeWidth="0.5"
          opacity="0.7"
        />

        {/* 上の朱色帯 */}
        <rect
          x="4"
          y="2"
          width="24"
          height="6"
          fill="#c8102e"
          stroke="#8a0a1c"
          strokeWidth="0.5"
        />
        {/* 上帯の金線 */}
        <line x1="4" y1="8" x2="28" y2="8" stroke="#f5d76e" strokeWidth="0.6" />

        {/* 下の朱色帯 */}
        <rect
          x="4"
          y="88"
          width="24"
          height="6"
          fill="#c8102e"
          stroke="#8a0a1c"
          strokeWidth="0.5"
        />
        {/* 下帯の金線 */}
        <line
          x1="4"
          y1="88"
          x2="28"
          y2="88"
          stroke="#f5d76e"
          strokeWidth="0.6"
        />

        {/* 中央の縦書き飾り文字 */}
        <text
          x="16"
          y="30"
          textAnchor="middle"
          fontSize="8"
          fontFamily="serif"
          fontWeight="bold"
          fill="#8a0a1c"
        >
          御
        </text>
        <text
          x="16"
          y="44"
          textAnchor="middle"
          fontSize="8"
          fontFamily="serif"
          fontWeight="bold"
          fill="#8a0a1c"
        >
          神
        </text>
        <text
          x="16"
          y="58"
          textAnchor="middle"
          fontSize="8"
          fontFamily="serif"
          fontWeight="bold"
          fill="#8a0a1c"
        >
          籤
        </text>
      </svg>
    </motion.div>
  )
}
