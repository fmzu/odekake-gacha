type DartIconProps = {
  size?: number;
};

/**
 * ダーツSVGアイコン。矢印っぽい形状。
 * 先端が (0,0) に来るように配置しているので、motion の x/y をそのまま着弾座標に使える。
 */
export function DartIcon({ size = 44 }: DartIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-40 -40 80 80"
      fill="none"
      aria-hidden="true"
    >
      {/* 軸 */}
      <line
        x1={0}
        y1={0}
        x2={-28}
        y2={-28}
        stroke="#0f172a"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* 先端 */}
      <polygon
        points="0,0 -7,-3 -3,-7"
        fill="#ef4444"
        stroke="#991b1b"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* フィン */}
      <polygon
        points="-28,-28 -38,-24 -32,-34"
        fill="#facc15"
        stroke="#92400e"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <polygon
        points="-28,-28 -24,-38 -34,-32"
        fill="#facc15"
        stroke="#92400e"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}
