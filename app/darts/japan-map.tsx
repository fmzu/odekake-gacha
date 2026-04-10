"use client";

import { geoPath, type GeoProjection } from "d3-geo";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import type { JapanFeatureCollection } from "@/lib/load-japan-topojson";
import { DartIcon } from "./dart-icon";

type JapanMapProps = {
  width: number;
  height: number;
  projection: GeoProjection;
  features: JapanFeatureCollection | null;
  loadError: string | null;
  dartPosition: { x: number; y: number } | null;
  isThrowing: boolean;
  onAnimationComplete?: () => void;
};

export function JapanMap({
  width,
  height,
  projection,
  features,
  loadError,
  dartPosition,
  isThrowing,
  onAnimationComplete,
}: JapanMapProps) {
  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const paths = useMemo(() => {
    if (!features) return [];
    return features.features
      .map((f, i) => ({ d: pathGenerator(f) ?? "", key: `pref-${i}` }))
      .filter((p) => p.d !== "");
  }, [features, pathGenerator]);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-sky-50 to-sky-100"
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="日本地図"
      >
        <title>日本地図</title>
        {/* 海（背景） */}
        <rect width={width} height={height} fill="transparent" />

        {/* 都道府県 */}
        <g>
          {paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill="#d9f99d"
              stroke="#65a30d"
              strokeWidth={0.6}
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* 着弾点の波紋 */}
        <AnimatePresence>
          {dartPosition && !isThrowing && (
            <motion.g
              key={`ripple-${dartPosition.x}-${dartPosition.y}`}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <motion.circle
                cx={dartPosition.x}
                cy={dartPosition.y}
                r={4}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2}
                initial={{ r: 4 }}
                animate={{ r: 36 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* ダーツ本体。DartIcon の中央 (0,0) = 先端 を着弾点に合わせるため、
          motion.div を (size/2, size/2) 引いた位置に置く。 */}
      <AnimatePresence>
        {dartPosition && (
          <motion.div
            key={`dart-${dartPosition.x}-${dartPosition.y}`}
            className="pointer-events-none absolute"
            style={{ left: dartPosition.x - 22, top: dartPosition.y - 22 }}
            initial={{ y: -140, opacity: 0, scale: 1.4, rotate: -10 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.45, 0, 0.2, 1] }}
            onAnimationComplete={onAnimationComplete}
          >
            <DartIcon size={44} />
          </motion.div>
        )}
      </AnimatePresence>

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">
          {loadError}
        </div>
      )}
      {!features && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          地図を読み込み中...
        </div>
      )}
    </div>
  );
}
