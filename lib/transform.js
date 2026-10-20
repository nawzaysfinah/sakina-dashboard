// All time values are UTC from Supabase; SGT = UTC+8.
// Notebook "row date" day boundary: 7pm SGT (= 11am UTC previous calendar day).
// SQL equivalent: ((ts AT TIME ZONE 'Asia/Singapore') + INTERVAL '5 hours')::date

const SGT   = 8 * 3600 * 1000;
const EXTRA = 5 * 3600 * 1000; // the extra shift that puts 7pm → midnight

export function sgtRowDate(ts) {
  const d = new Date(new Date(ts).getTime() + SGT + EXTRA);
  return d.toISOString().slice(0, 10);
}

export function sgtCalDate(ts) {
  const d = new Date(new Date(ts).getTime() + SGT);
  return d.toISOString().slice(0, 10);
}

// Fraction of SGT midnight-to-midnight day (0.0 → 1.0)
function sgtFrac(ts) {
  return ((new Date(ts).getTime() + SGT) % (24 * 3600 * 1000)) / (24 * 3600 * 1000);
}

// SGT hour as float (0.0–24.0)
export function sgtHour(ts) { return sgtFrac(ts) * 24; }

// UTC timestamp of 7pm SGT on the evening before rowDate
function rowStartMs(rowDate) {
  // 7pm SGT = 11am UTC; "before" means subtract 1 UTC day
  const d = new Date(`${rowDate}T11:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.getTime();
}

// UTC timestamp of SGT midnight for a calendar date string
function sgtMidnightMs(calDate) {
  return new Date(`${calDate}T00:00:00+08:00`).getTime();
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
// Returns { [rowDate]: Uint8Array(48) } — 1 = asleep, 0 = awake

export function buildHeatmap(sleepEvents, rowDates) {
  const result = Object.fromEntries(rowDates.map(d => [d, new Uint8Array(48)]));
  const now    = Date.now();
  const CELL   = 30 * 60 * 1000;

  for (const ev of sleepEvents) {
    const evStart = new Date(ev.start_at).getTime();
    const evEnd   = ev.end_at ? new Date(ev.end_at).getTime() : now;
    const rdStart = sgtRowDate(ev.start_at);
    const rdEnd   = sgtRowDate(ev.end_at || new Date().toISOString());

    for (const rd of rowDates) {
      if (rd < rdStart || rd > rdEnd) continue;
      const dayStart = rowStartMs(rd);
      for (let i = 0; i < 48; i++) {
        const cs = dayStart + i * CELL;
        if (evStart < cs + CELL && evEnd > cs) result[rd][i] = 1;
      }
    }
  }
  return result;
}

// ── Daily Timeline ────────────────────────────────────────────────────────────
// Returns { [sgtCalDate]: { sleepBlocks, feeds, diapers } }
// sleepBlocks: [{ start: 0–1, end: 0–1 }] fraction of SGT calendar day
// feeds:       [{ frac, type: 'latch'|'formula'|'breast', ml }]
// diapers:     [{ frac, wet, dirty }]

export function buildTimeline(events) {
  const byDate = {};
  const now    = Date.now();
  const ensure = (d) => { if (!byDate[d]) byDate[d] = { sleepBlocks: [], feeds: [], diapers: [] }; return byDate[d]; };

  for (const ev of events) {
    if (ev.kind === 'sleep') {
      const evStart = new Date(ev.start_at).getTime();
      const evEnd   = ev.end_at ? new Date(ev.end_at).getTime() : now;
      // Split across SGT calendar day boundaries
      let cur = evStart;
      while (cur < evEnd) {
        const d       = sgtCalDate(cur);
        const dayMs   = sgtMidnightMs(d);
        const nextMs  = dayMs + 24 * 3600 * 1000;
        const segEnd  = Math.min(evEnd, nextMs);
        ensure(d).sleepBlocks.push({
          start: (cur    - dayMs) / (24 * 3600 * 1000),
          end:   (segEnd - dayMs) / (24 * 3600 * 1000),
        });
        cur = nextMs;
      }
    } else if (ev.kind === 'feed') {
      const d = sgtCalDate(ev.start_at);
      ensure(d).feeds.push({
        frac: sgtFrac(ev.start_at),
        type: ev.detail?.type === 'latch' ? 'latch' : ev.detail?.type === 'formula' ? 'formula' : 'breast',
        ml:   ev.detail?.amount_ml || 0,
      });
    } else if (ev.kind === 'diaper') {
      const d = sgtCalDate(ev.start_at);
      ensure(d).diapers.push({
        frac:  sgtFrac(ev.start_at),
        wet:   !!ev.detail?.wet,
        dirty: !!ev.detail?.dirty,
      });
    }
  }
  return byDate;
}

// ── Weekly Stats ──────────────────────────────────────────────────────────────
// Returns array of { label, weekStart, sleepH, feeds, ml, wet, dirty }

export function buildWeekly(events) {
  if (!events.length) return [];
  const firstMs = new Date(events[0].start_at).getTime();
  const WEEK    = 7 * 24 * 3600 * 1000;
  const now     = Date.now();
  const weeks   = {};

  for (const ev of events) {
    const ms  = new Date(ev.start_at).getTime();
    const wk  = Math.floor((ms - firstMs) / WEEK);
    if (!weeks[wk]) {
      const ws = new Date(firstMs + wk * WEEK);
      weeks[wk] = { label: fmtWeek(ws), weekStart: ws, sleepMs: 0, feeds: 0, ml: 0, wet: 0, dirty: 0 };
    }
    const w = weeks[wk];
    if (ev.kind === 'sleep')  { w.sleepMs += Math.max(0, (ev.end_at ? new Date(ev.end_at).getTime() : now) - ms); }
    if (ev.kind === 'feed')   { w.feeds++; w.ml += ev.detail?.amount_ml || 0; }
    if (ev.kind === 'diaper') { if (ev.detail?.wet) w.wet++; if (ev.detail?.dirty) w.dirty++; }
  }

  return Object.values(weeks)
    .sort((a, b) => a.weekStart - b.weekStart)
    .map(w => ({ ...w, sleepH: +(w.sleepMs / 3600000).toFixed(1) }));
}

function fmtWeek(date) {
  const d = new Date(date.getTime() + SGT);
  return d.toLocaleDateString('en-SG', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// ── Clock Data ────────────────────────────────────────────────────────────────
// Returns { sleepMin[24], feeds[24], diapers[24] } — indexed by SGT hour of day

export function buildClock(events) {
  const sleepMin = new Array(24).fill(0);
  const feeds    = new Array(24).fill(0);
  const diapers  = new Array(24).fill(0);
  const now      = Date.now();

  for (const ev of events) {
    const h = Math.floor(sgtHour(ev.start_at)) % 24;
    if (ev.kind === 'sleep') {
      const dur = (ev.end_at ? new Date(ev.end_at).getTime() : now) - new Date(ev.start_at).getTime();
      sleepMin[h] += dur / 60000;
    }
    if (ev.kind === 'feed')   feeds[h]++;
    if (ev.kind === 'diaper') diapers[h]++;
  }
  return { sleepMin, feeds, diapers };
}
