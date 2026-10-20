'use client';

// Each day = one vertical column, time runs top (6am) → bottom (6pm).
// Scroll horizontally; oldest day on the left.

const WINDOW_START_H = 6;
const WINDOW_END_H   = 18;
const WINDOW_H       = WINDOW_END_H - WINDOW_START_H; // 12h

const COL_W   = 28;
const TIME_W  = 28;
const HEAD_H  = 58; // month + day-initial + date
// COL_H is dynamic — fills remaining viewport height

const FEED_COLOR = { latch: '#f472b6', formula: '#fbbf24', breast: '#93c5fd' };

const TIME_LABELS = [
  { h: 6,  label: '6a'  },
  { h: 9,  label: '9a'  },
  { h: 12, label: '12p' },
  { h: 15, label: '3p'  },
  { h: 18, label: '6p'  },
];

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toWindowFrac(frac24) {
  return (frac24 - WINDOW_START_H / 24) / (WINDOW_H / 24);
}

export default function DailyTimeline({ timeline, calDates }) {
  const sorted = [...calDates].sort(); // oldest → left

  // Group consecutive days by month for the overarching label
  const monthGroups = [];
  sorted.forEach(d => {
    const month = d.slice(0, 7);
    const last  = monthGroups[monthGroups.length - 1];
    if (last && last.month === month) last.count++;
    else monthGroups.push({ month, count: 1 });
  });

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
      <div style={{ display: 'inline-flex', minWidth: TIME_W + sorted.length * COL_W }}>

        {/* ── Y-axis time labels ── */}
        <div style={{ width: TIME_W, flexShrink: 0 }}>
          {/* blank space above to align with column headers */}
          <div style={{ height: HEAD_H }} />
          <div style={{ position: 'relative', height: 'calc(100svh - 195px)', minHeight: 180 }}>
            {TIME_LABELS.map(({ h, label }) => (
              <div key={h} style={{
                position:  'absolute',
                top:       `${((h - WINDOW_START_H) / WINDOW_H) * 100}%`,
                right:     6,
                transform: 'translateY(-50%)',
                fontSize:  9,
                color:     '#475569',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Day columns ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Month row */}
          <div style={{ display: 'flex', height: 18 }}>
            {monthGroups.map(({ month, count }) => {
              const [y, m] = month.split('-');
              const label = new Date(`${y}-${m}-01T00:00:00Z`)
                .toLocaleDateString('en', { month: 'short', timeZone: 'UTC' });
              return (
                <div key={month} style={{
                  width:       count * COL_W,
                  fontSize:    9,
                  fontWeight:  700,
                  color:       '#64748b',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  paddingLeft: 4,
                  borderLeft:  '1px solid #334155',
                  lineHeight:  '18px',
                }}>
                  {label}
                </div>
              );
            })}
          </div>

          {/* Day-initial + date number */}
          <div style={{ display: 'flex', height: 40 }}>
            {sorted.map(d => {
              const dt = new Date(d + 'T00:00:00Z');
              return (
                <div key={d} style={{
                  width:          COL_W,
                  flexShrink:     0,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            2,
                  borderLeft:     '1px solid #1e293b',
                }}>
                  <span style={{ fontSize: 9, color: '#475569', lineHeight: 1 }}>
                    {DAY_INITIALS[dt.getUTCDay()]}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, lineHeight: 1 }}>
                    {dt.getUTCDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time strips */}
          <div style={{ display: 'flex', position: 'relative', height: 'calc(100svh - 195px)', minHeight: 180 }}>
            {/* Horizontal grid lines */}
            {TIME_LABELS.map(({ h }) => (
              <div key={h} style={{
                position:        'absolute',
                left:            0,
                right:           0,
                top:             `${((h - WINDOW_START_H) / WINDOW_H) * 100}%`,
                height:          1,
                backgroundColor: '#1e293b',
                pointerEvents:   'none',
              }} />
            ))}

            {sorted.map(d => (
              <DayColumn
                key={d}
                day={timeline[d] || { sleepBlocks: [], feeds: [], diapers: [] }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ day }) {
  return (
    <div style={{
      width:           COL_W,
      height:          '100%',
      position:        'relative',
      backgroundColor: '#0f172a',
      borderLeft:      '1px solid #1e293b',
      flexShrink:      0,
      overflow:        'hidden',
    }}>
      {/* Sleep blocks */}
      {day.sleepBlocks.map((b, i) => {
        const t = toWindowFrac(b.start);
        const e = toWindowFrac(b.end);
        const top    = Math.max(0, t) * 100;
        const bottom = Math.min(1, e) * 100;
        if (bottom <= 0 || top >= 100) return null;
        return (
          <div key={i} style={{
            position:        'absolute',
            top:             `${top}%`,
            height:          `${Math.max(0, bottom - top)}%`,
            left:            3,
            right:           3,
            backgroundColor: '#6366f1',
            borderRadius:    3,
            opacity:         0.85,
          }} />
        );
      })}

      {/* Feed dots */}
      {day.feeds.map((f, i) => {
        const frac = toWindowFrac(f.frac);
        if (frac < -0.02 || frac > 1.02) return null;
        return (
          <div key={i} title={`${f.type}${f.ml ? ` · ${f.ml}ml` : ''}`} style={{
            position:        'absolute',
            top:             `calc(${Math.max(0, Math.min(1, frac)) * 100}% - 4px)`,
            left:            '50%',
            transform:       'translateX(-50%)',
            width:           8,
            height:          8,
            borderRadius:    '50%',
            backgroundColor: FEED_COLOR[f.type] || '#fbbf24',
            border:          '1.5px solid #0f172a',
            zIndex:          2,
          }} />
        );
      })}

      {/* Diaper squares */}
      {day.diapers.map((d2, i) => {
        const frac = toWindowFrac(d2.frac);
        if (frac < -0.02 || frac > 1.02) return null;
        return (
          <div key={i} title={`${d2.wet ? 'wet' : ''}${d2.wet && d2.dirty ? '+' : ''}${d2.dirty ? 'dirty' : ''}`} style={{
            position:        'absolute',
            top:             `calc(${Math.max(0, Math.min(1, frac)) * 100}% - 3.5px)`,
            left:            '50%',
            transform:       'translateX(-50%)',
            width:           7,
            height:          7,
            backgroundColor: d2.dirty ? '#fb923c' : '#7dd3fc',
            border:          '1.5px solid #0f172a',
            zIndex:          2,
          }} />
        );
      })}
    </div>
  );
}
