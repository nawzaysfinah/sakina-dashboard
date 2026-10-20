'use client';

// 48-cell grid (30-min slots) per notebook row date (7pm SGT → 7pm SGT).
// X-axis columns = time of day. Y-axis rows = dates (newest at top).

const CELL_W = 13;
const CELL_H = 7;
const LABEL_W = 52;
const GAP = 1;

// Slot labels for every 6th cell (3h intervals), starting from 7pm
const X_LABELS = Array.from({ length: 9 }, (_, i) => ({
  col:   i * 6,
  label: ['7p','10p','1a','4a','7a','10a','1p','4p','7p'][i],
}));

export default function SleepHeatmap({ heatmap, rowDates }) {
  const sorted = [...rowDates].sort().reverse();

  return (
    <div>
      <p className="text-xs text-slate-500 mb-4">
        Each row = one day (7pm–7pm SGT). Each cell = 30 min.{' '}
        <span className="text-indigo-400">■</span> asleep.
      </p>

      {/* X-axis labels */}
      <div style={{ display: 'flex', paddingLeft: LABEL_W + 4, marginBottom: 4 }}>
        {X_LABELS.map(({ col, label }) => (
          <div key={col} style={{
            position:  'absolute',
            marginLeft: LABEL_W + 4 + col * (CELL_W + GAP),
            fontSize: 10, color: '#64748b',
          }}>
            {label}
          </div>
        ))}
        <div style={{ height: 14 }} />
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: LABEL_W + 48 * (CELL_W + GAP) }}>
          {sorted.map(rd => {
            const cells = heatmap[rd] || new Uint8Array(48);
            const label = new Date(rd + 'T00:00:00Z').toLocaleDateString('en-SG', {
              month: 'short', day: 'numeric', timeZone: 'UTC',
            });
            return (
              <div key={rd} style={{ display: 'flex', alignItems: 'center', marginBottom: GAP }}>
                <div style={{ width: LABEL_W, textAlign: 'right', paddingRight: 8, fontSize: 10, color: '#64748b', flexShrink: 0 }}>
                  {label}
                </div>
                <div style={{ display: 'flex', gap: GAP }}>
                  {Array.from(cells).map((asleep, i) => (
                    <div
                      key={i}
                      title={cellLabel(rd, i)}
                      style={{
                        width:           CELL_W,
                        height:          CELL_H,
                        backgroundColor: asleep ? '#818cf8' : '#1e293b',
                        borderRadius:    1,
                        flexShrink:      0,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#64748b' }}>
        <span><span style={{ display:'inline-block', width:10, height:10, backgroundColor:'#818cf8', marginRight:4, borderRadius:1 }}/>Asleep</span>
        <span><span style={{ display:'inline-block', width:10, height:10, backgroundColor:'#1e293b', marginRight:4, borderRadius:1, border:'1px solid #334155' }}/>Awake</span>
      </div>
    </div>
  );
}

function cellLabel(rowDate, cellIndex) {
  const totalMin = cellIndex * 30;
  const h = (19 + Math.floor(totalMin / 60)) % 24;
  const m = totalMin % 60;
  const hh = h % 12 || 12;
  const ap = h >= 12 ? 'pm' : 'am';
  return `${rowDate} · ${hh}:${String(m).padStart(2,'0')}${ap} SGT`;
}
