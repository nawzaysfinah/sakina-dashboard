'use client';

// 24h clock-face showing when events cluster by time of day.
// Three polar bar charts stacked as concentric ring bands.

const SIZE  = 340;
const CX    = SIZE / 2;
const CY    = SIZE / 2;
const MIN_R = 38;   // inner ring radius
const MAX_R = 148;  // outer ring radius
const BAND  = (MAX_R - MIN_R) / 3;

// 0h = top, clockwise
const toAngle = h => (h / 24) * 2 * Math.PI - Math.PI / 2;

function wedge(cx, cy, r1, r2, a1, a2) {
  if (r2 <= r1) return '';
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x1, y1] = p(r1, a1), [x2, y2] = p(r2, a1);
  const [x3, y3] = p(r2, a2), [x4, y4] = p(r1, a2);
  const large = a2 - a1 > Math.PI ? 1 : 0;
  return `M${x1},${y1} L${x2},${y2} A${r2},${r2} 0 ${large} 1 ${x3},${y3} L${x4},${y4} A${r1},${r1} 0 ${large} 0 ${x1},${y1}Z`;
}

const HOUR_LABELS = [
  { h: 0, label: '12a' }, { h: 3, label: '3a'  }, { h: 6,  label: '6a'  },
  { h: 9, label: '9a'  }, { h:12, label: '12p' }, { h:15, label: '3p'  },
  { h:18, label: '6p'  }, { h:21, label: '9p'  },
];

export default function ClockRadial({ data }) {
  const { sleepMin, feeds, diapers } = data;

  const maxSleep  = Math.max(...sleepMin, 1);
  const maxFeed   = Math.max(...feeds, 1);
  const maxDiaper = Math.max(...diapers, 1);

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-xs text-slate-500 self-start">
        How events cluster by hour of day (SGT) across all recorded data.
      </p>

      <svg width={SIZE} height={SIZE}>
        {/* Background rings */}
        {[1/3, 2/3, 1].map(f => (
          <circle key={f} cx={CX} cy={CY} r={MIN_R + f * (MAX_R - MIN_R)}
            fill="none" stroke="#1e293b" strokeWidth={1} />
        ))}
        {/* Tick marks every hour */}
        {Array.from({ length: 24 }, (_, h) => {
          const a = toAngle(h);
          const r1 = MAX_R + 2, r2 = MAX_R + (h % 6 === 0 ? 10 : 5);
          return (
            <line key={h}
              x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
              x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
              stroke={h % 6 === 0 ? '#475569' : '#1e293b'} strokeWidth={1}
            />
          );
        })}

        {/* Sleep band (outer) */}
        {sleepMin.map((v, h) => {
          const r1 = MIN_R + 2 * BAND;
          const r2 = r1 + (v / maxSleep) * (BAND - 4);
          return <path key={`s${h}`} d={wedge(CX, CY, r1, r2, toAngle(h) + 0.02, toAngle(h+1) - 0.02)}
            fill="#818cf8" opacity={0.85} />;
        })}

        {/* Feed band (middle) */}
        {feeds.map((v, h) => {
          const r1 = MIN_R + BAND;
          const r2 = r1 + (v / maxFeed) * (BAND - 4);
          return <path key={`f${h}`} d={wedge(CX, CY, r1, r2, toAngle(h) + 0.02, toAngle(h+1) - 0.02)}
            fill="#f472b6" opacity={0.85} />;
        })}

        {/* Diaper band (inner) */}
        {diapers.map((v, h) => {
          const r1 = MIN_R;
          const r2 = r1 + (v / maxDiaper) * (BAND - 4);
          return <path key={`d${h}`} d={wedge(CX, CY, r1, r2, toAngle(h) + 0.02, toAngle(h+1) - 0.02)}
            fill="#7dd3fc" opacity={0.85} />;
        })}

        {/* Centre cap */}
        <circle cx={CX} cy={CY} r={MIN_R - 1} fill="#030712" />

        {/* Hour labels */}
        {HOUR_LABELS.map(({ h, label }) => {
          const a = toAngle(h);
          const r = MAX_R + 20;
          return (
            <text key={h} x={CX + r * Math.cos(a)} y={CY + r * Math.sin(a)}
              textAnchor="middle" dominantBaseline="central"
              fontSize={10} fill="#64748b">
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-6 text-sm text-slate-400">
        <span><span className="inline-block w-3 h-3 rounded-sm bg-indigo-400 mr-1.5 align-middle" />Sleep</span>
        <span><span className="inline-block w-3 h-3 rounded-sm bg-pink-400 mr-1.5 align-middle" />Feed</span>
        <span><span className="inline-block w-3 h-3 rounded-sm bg-sky-300 mr-1.5 align-middle" />Diaper</span>
      </div>

      <p className="text-xs text-slate-600 text-center max-w-xs">
        Outer band = sleep minutes · Middle = feed count · Inner = diaper count.<br />
        Bar length = relative frequency in that hour.
      </p>
    </div>
  );
}
