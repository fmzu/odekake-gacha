"use client";

import { motion } from "motion/react";

export type OmikujiBoxState =
  | "idle"
  | "drawing"
  | "waiting"
  | "extracting"
  | "revealing"
  | "done";

type OmikujiBoxProps = {
  state: OmikujiBoxState;
  onDrawClick: () => void;
  children?: React.ReactNode;
};

/**
 * 御神籤箱（木箱）のSVGコンポーネント。
 * 上面の穴から紙が出てくる想定で、紙を引き出している最中 / 待機中に箱が微妙に揺れる。
 * 箱の外側下に「引く」ボタンを配置する。
 */
export function OmikujiBox({
  state,
  onDrawClick,
  children,
}: OmikujiBoxProps) {
  const clickable = state === "idle" || state === "done";
  const isShaking =
    state === "drawing" ||
    state === "waiting" ||
    state === "extracting";

  return (
    <div className="relative flex flex-col items-center justify-center gap-3 py-10">
      <motion.div
        className="relative"
        style={{ width: 220, height: 260 }}
        animate={
          isShaking
            ? {
                rotate: [-1.2, 1.2, -0.8, 0.8, -1.0, 1.0, 0],
                x: [-1, 1, -1, 1, -1, 1, 0],
              }
            : { rotate: 0, x: 0 }
        }
        transition={
          isShaking
            ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      >
        <svg
          width="220"
          height="260"
          viewBox="0 0 220 260"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>御神籤箱</title>
          <defs>
            {/* 箱前面の木目グラデーション */}
            <linearGradient id="box-front" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#4a2710" />
              <stop offset="20%" stopColor="#6b3a18" />
              <stop offset="50%" stopColor="#8a4e24" />
              <stop offset="80%" stopColor="#6b3a18" />
              <stop offset="100%" stopColor="#3a1d0a" />
            </linearGradient>
            {/* 箱側面（少し暗め） */}
            <linearGradient id="box-side" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#2a1508" />
              <stop offset="100%" stopColor="#4a2710" />
            </linearGradient>
            {/* 箱上面（明るめ＋手前に向かってグラデ） */}
            <linearGradient id="box-top" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7a4420" />
              <stop offset="100%" stopColor="#a0623a" />
            </linearGradient>
            {/* 穴の内側（暗い） */}
            <radialGradient id="hole-inside" cx="0.5" cy="0.5" r="0.6">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="70%" stopColor="#0a0402" />
              <stop offset="100%" stopColor="#1a0a03" />
            </radialGradient>
            {/* 朱色札 */}
            <linearGradient id="red-plate" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#d81e3a" />
              <stop offset="50%" stopColor="#c8102e" />
              <stop offset="100%" stopColor="#8a0a1c" />
            </linearGradient>
          </defs>

          {/* 地面の影 */}
          <ellipse cx="110" cy="252" rx="92" ry="6" fill="#00000033" />

          {/* 箱の右側面（奥行きを表現） */}
          <polygon
            points="180,70 200,55 200,235 180,250"
            fill="url(#box-side)"
            stroke="#1a0a03"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* 箱の上面（奥に向かって遠近） */}
          <polygon
            points="40,70 180,70 200,55 60,55"
            fill="url(#box-top)"
            stroke="#1a0a03"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* 上面の木目（薄い横線） */}
          <line
            x1="55"
            y1="61"
            x2="190"
            y2="61"
            stroke="#3a1d0a"
            strokeWidth="0.6"
            opacity="0.45"
          />
          <line
            x1="52"
            y1="65"
            x2="188"
            y2="65"
            stroke="#3a1d0a"
            strokeWidth="0.6"
            opacity="0.35"
          />

          {/* 注連縄っぽい金ライン（上面の縁取り） */}
          <polyline
            points="40,70 180,70 200,55 60,55 40,70"
            fill="none"
            stroke="#d4a03a"
            strokeWidth="1.2"
            opacity="0.85"
          />

          {/* 穴（上面中央） — 楕円で穴あき表現 */}
          <ellipse
            cx="120"
            cy="62"
            rx="26"
            ry="6"
            fill="url(#hole-inside)"
            stroke="#1a0a03"
            strokeWidth="1.5"
          />
          {/* 穴の金縁 */}
          <ellipse
            cx="120"
            cy="62"
            rx="27"
            ry="6.8"
            fill="none"
            stroke="#d4a03a"
            strokeWidth="1"
            opacity="0.8"
          />

          {/* 箱の前面 */}
          <rect
            x="40"
            y="70"
            width="140"
            height="180"
            fill="url(#box-front)"
            stroke="#1a0a03"
            strokeWidth="2"
          />

          {/* 前面の木目縦ライン */}
          <line
            x1="75"
            y1="72"
            x2="75"
            y2="248"
            stroke="#3a1d0a"
            strokeWidth="0.8"
            opacity="0.45"
          />
          <line
            x1="110"
            y1="72"
            x2="110"
            y2="248"
            stroke="#3a1d0a"
            strokeWidth="0.8"
            opacity="0.35"
          />
          <line
            x1="145"
            y1="72"
            x2="145"
            y2="248"
            stroke="#3a1d0a"
            strokeWidth="0.8"
            opacity="0.45"
          />

          {/* 金の縁取り（前面） */}
          <rect
            x="42"
            y="72"
            width="136"
            height="176"
            fill="none"
            stroke="#d4a03a"
            strokeWidth="1.2"
            opacity="0.8"
          />

          {/* 前面の朱色札（縦長） */}
          <rect
            x="92"
            y="100"
            width="36"
            height="120"
            rx="2"
            fill="url(#red-plate)"
            stroke="#4a0510"
            strokeWidth="1.5"
          />
          {/* 札の金縁 */}
          <rect
            x="94"
            y="102"
            width="32"
            height="116"
            rx="1"
            fill="none"
            stroke="#f5d76e"
            strokeWidth="0.8"
            opacity="0.85"
          />
          {/* 札の「御」 */}
          <text
            x="110"
            y="130"
            textAnchor="middle"
            fontSize="20"
            fontFamily="serif"
            fontWeight="bold"
            fill="#fff8e1"
          >
            御
          </text>
          {/* 札の「神」 */}
          <text
            x="110"
            y="160"
            textAnchor="middle"
            fontSize="20"
            fontFamily="serif"
            fontWeight="bold"
            fill="#fff8e1"
          >
            神
          </text>
          {/* 札の「籤」 */}
          <text
            x="110"
            y="190"
            textAnchor="middle"
            fontSize="20"
            fontFamily="serif"
            fontWeight="bold"
            fill="#fff8e1"
          >
            籤
          </text>

          {/* 下部の朱色帯 */}
          <rect
            x="40"
            y="232"
            width="140"
            height="16"
            fill="url(#red-plate)"
            stroke="#4a0510"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="233"
            x2="180"
            y2="233"
            stroke="#f5d76e"
            strokeWidth="1"
            opacity="0.85"
          />
          <line
            x1="40"
            y1="247"
            x2="180"
            y2="247"
            stroke="#f5d76e"
            strokeWidth="1"
            opacity="0.85"
          />
        </svg>
        {/* 箱の穴から出てくる紙などを重ねるスロット */}
        {children}
      </motion.div>

      {/* 引くボタン */}
      <button
        type="button"
        onClick={clickable ? onDrawClick : undefined}
        disabled={!clickable}
        className={`rounded-full border-2 border-[#4a0510] bg-gradient-to-b from-[#d81e3a] via-[#c8102e] to-[#8a0a1c] px-6 py-1.5 text-sm font-bold text-[#fff8e1] shadow-[0_3px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-[#f5d76e] transition ${
          clickable
            ? "hover:brightness-110 active:translate-y-[1px] active:shadow-[0_1px_3px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] cursor-pointer"
            : "cursor-not-allowed opacity-60"
        }`}
        aria-label="おみくじを引く"
      >
        引く
      </button>
    </div>
  );
}
