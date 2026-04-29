type FlagCode = "KE" | "NG" | "GH" | "US" | "UG" | "TZ";

interface FlagProps {
  code: FlagCode;
  size?: number;
  className?: string;
}

export default function Flag({ code, size = 20, className = "" }: FlagProps) {
  const s = size;
  const r = s / 2;

  const flags: Record<FlagCode, React.ReactElement> = {
    KE: (
      <g>
        <rect x="0" y="0" width={s} height={s / 3} fill="#000" />
        <rect x="0" y={s / 3} width={s} height={s / 3} fill="#BE0027" />
        <rect x="0" y={(2 * s) / 3} width={s} height={s / 3} fill="#006B3F" />
        <ellipse cx={r} cy={r} rx={s * 0.12} ry={s * 0.22} fill="#fff" />
        <ellipse cx={r} cy={r} rx={s * 0.07} ry={s * 0.18} fill="#BE0027" />
      </g>
    ),
    NG: (
      <g>
        <rect x="0" y="0" width={s / 3} height={s} fill="#008751" />
        <rect x={s / 3} y="0" width={s / 3} height={s} fill="#fff" />
        <rect x={(2 * s) / 3} y="0" width={s / 3} height={s} fill="#008751" />
      </g>
    ),
    GH: (
      <g>
        <rect x="0" y="0" width={s} height={s / 3} fill="#CE1126" />
        <rect x="0" y={s / 3} width={s} height={s / 3} fill="#FCD116" />
        <rect x="0" y={(2 * s) / 3} width={s} height={s / 3} fill="#006B3F" />
        <polygon
          points={`${r},${s * 0.38} ${r + s * 0.06},${s * 0.5} ${r - s * 0.06},${s * 0.5}`}
          fill="#000"
        />
      </g>
    ),
    US: (
      <g>
        {Array.from({ length: 7 }).map((_, i) => (
          <rect
            key={i}
            x="0"
            y={(i * s) / 7}
            width={s}
            height={s / 7}
            fill={i % 2 === 0 ? "#B22234" : "#fff"}
          />
        ))}
        <rect x="0" y="0" width={s * 0.45} height={s * 0.55} fill="#3C3B6E" />
      </g>
    ),
    // Uganda — black / yellow / red horizontal stripes with grey crane silhouette
    UG: (
      <g>
        {(["#000", "#FCD116", "#DE3908", "#000", "#FCD116", "#DE3908"] as const).map(
          (fill, i) => (
            <rect key={i} x="0" y={(i * s) / 6} width={s} height={s / 6} fill={fill} />
          ),
        )}
        {/* Simplified crane disc */}
        <circle cx={r} cy={r} r={s * 0.22} fill="#fff" />
        <ellipse cx={r} cy={r} rx={s * 0.08} ry={s * 0.14} fill="#888" />
        {/* Crest feathers */}
        <circle cx={r} cy={r - s * 0.14} r={s * 0.04} fill="#DE3908" />
      </g>
    ),
    // Tanzania — green / yellow diagonal / blue with black stripe
    TZ: (
      <g>
        {/* Green top-left triangle */}
        <polygon points={`0,0 ${s},0 0,${s}`} fill="#1EB53A" />
        {/* Blue bottom-right triangle */}
        <polygon points={`${s},0 ${s},${s} 0,${s}`} fill="#00A3DD" />
        {/* Black diagonal band */}
        <polygon
          points={`0,${s * 0.62} ${s * 0.38},0 ${s * 0.62},0 0,${s * 0.38}`}
          fill="#000"
        />
        <polygon
          points={`${s},${s * 0.38} ${s * 0.62},${s} ${s * 0.38},${s} ${s},${s * 0.62}`}
          fill="#000"
        />
        {/* Yellow border lines */}
        <polygon
          points={`0,${s * 0.55} ${s * 0.45},0 ${s * 0.38},0 0,${s * 0.38}`}
          fill="#FCD116"
        />
        <polygon
          points={`${s},${s * 0.45} ${s * 0.55},${s} ${s * 0.62},${s} ${s},${s * 0.62}`}
          fill="#FCD116"
        />
      </g>
    ),
  };

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-full border border-black/5 ${className}`}
      style={{ width: s, height: s, flexShrink: 0 }}
    >
      <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s}>
        {flags[code]}
      </svg>
    </span>
  );
}

export type { FlagCode };
