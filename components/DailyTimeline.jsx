'use client';

// Each day = one horizontal 24h strip from midnight SGT.
// Sleep = indigo blocks. Feed = circles. Diaper = squares.

const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
const FEED_COLOR  = { latch: '#f472b6', formula: '#fbbf24', breast: '#93c5fd' };
const ROW_H       = 28;
const LABEL_W     = 52;

export default function DailyTimeline({ timeline, calDates }) {
  const sorted = [...calDates].sort().reverse(); // newest first

  return (
    <div>
      <p className="text-xs text-slate-500 mb-4">Each row = one calendar day (SGT midnight–midnight). Newest on top.</p>

      {/* X-axis labels */}
      <div style={{ display: 'flex', paddingLeft: LABEL_W, marginBottom: 4 }}>
        {HOUR_LABELS.map((l, i) => (
          <div key={i} style={{ width: `${100 / 8}%`, fontSize: 10, color: '#64748b' }}>{l}</div>
        ))}
      </div>

      {/* Day rows */}
      <div className="space-y-0.5">
        {sorted.map(d => {
          const day = timeline[d] || { sleepBlocks: [], feeds: [], diapers: [] };
          return <DayRow key={d} date={d} day={day} />;
        })}
      </div>
    </div>
  );
}

function DayRow({ date, day }) {
  const label = new Date(date + 'T00:00:00Z').toLocaleDateString('en-SG', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Date label */}
      <div style={{ width: LABEL_W, fontSize: 10, color: '#64748b', textAlign: 'right', flexShrink: 0 }}>
        {label.replace(',', '')}
      </div>

      {/* Strip */}
      <div style={{ flex: 1, position: 'relative', height: ROW_H, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
        {/* Grid lines at 3h intervals */}
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} style={{
            position: 'absolute', left: `${(i / 8) * 100}%`, top: 0,
            width: 1, height: '100%', backgroundColor: '#1e293b',
          }} />
        ))}

        {/* Sleep blocks */}
        {day.sleepBlocks.map((b, i) => (
          <div key={i} style={{
            position: 'absolute',
            left:  `${Math.max(0, b.start) * 100}%`,
            width: `${Math.max(0, Math.min(1, b.end) - Math.max(0, b.start)) * 100}%`,
            top: 4, bottom: 4,
            backgroundColor: '#6366f1',
            borderRadius: 3,
            opacity: 0.85,
          }} />
        ))}

        {/* Feed dots */}
        {day.feeds.map((f, i) => (
          <div key={i} title={`${f.type}${f.ml ? ` · ${f.ml}ml` : ''}`} style={{
            position:  'absolute',
            left:      `calc(${f.frac * 100}% - 4px)`,
            top:       '50%',
            transform: 'translateY(-50%)',
            width: 8, height: 8,
            borderRadius: '50%',
            backgroundColor: FEED_COLOR[f.type] || '#fbbf24',
            border: '1.5px solid #0f172a',
            zIndex: 2,
          }} />
        ))}

        {/* Diaper squares */}
        {day.diapers.map((d2, i) => (
          <div key={i} title={`${d2.wet ? 'wet' : ''}${d2.wet && d2.dirty ? '+' : ''}${d2.dirty ? 'dirty' : ''}`} style={{
            position:  'absolute',
            left:      `calc(${d2.frac * 100}% - 4px)`,
            top:       '50%',
            transform: 'translateY(-50%)',
            width: 7, height: 7,
            backgroundColor: d2.dirty ? '#fb923c' : '#7dd3fc',
            border: '1.5px solid #0f172a',
            zIndex: 2,
          }} />
        ))}
      </div>
    </div>
  );
}
