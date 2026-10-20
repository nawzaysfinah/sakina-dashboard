'use client';

import { useState, useMemo } from 'react';
import { buildHeatmap, buildTimeline, buildWeekly, buildClock, sgtRowDate, sgtCalDate } from '../lib/transform';
import SleepHeatmap  from './SleepHeatmap';
import DailyTimeline from './DailyTimeline';
import WeeklyTotals  from './WeeklyTotals';
import ClockRadial   from './ClockRadial';

const TABS = [
  { id: 'timeline', icon: '📅', label: 'Timeline' },
  { id: 'heatmap',  icon: '🟣', label: 'Heatmap'  },
  { id: 'weekly',   icon: '📊', label: 'Weekly'   },
  { id: 'clock',    icon: '🕐', label: 'Patterns'  },
];

export default function DashboardClient({ events, babyName }) {
  const [tab, setTab] = useState('timeline');

  const processed = useMemo(() => {
    const sleep  = events.filter(e => e.kind === 'sleep');
    const rowDates = [...new Set(events.map(e => sgtRowDate(e.start_at)))].sort();
    const calDates = [...new Set(events.map(e => sgtCalDate(e.start_at)))].sort();
    return {
      heatmap:  buildHeatmap(sleep, rowDates),
      rowDates,
      timeline: buildTimeline(events),
      calDates,
      weekly:   buildWeekly(events),
      clock:    buildClock(events),
    };
  }, [events]);

  const firstDate = events.length ? new Date(events[0].start_at).toLocaleDateString('en-SG') : '—';
  const lastDate  = events.length ? new Date(events[events.length - 1].start_at).toLocaleDateString('en-SG') : '—';

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100">

      {/* Header */}
      <div className="border-b border-slate-800 px-4 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-xl font-semibold">{babyName} · Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-9">{firstDate} → {lastDate} · {events.length} events</p>
        </div>
        <div className="flex gap-4 text-xs text-slate-400 pl-9 sm:pl-0">
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-400 mr-1" />Sleep</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-400 mr-1" />Latch</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 mr-1" />Formula</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-300 mr-1" />BM</span>
          <span><span className="inline-block w-2.5 h-2.5 bg-sky-300 mr-1" />Wet</span>
          <span><span className="inline-block w-2.5 h-2.5 bg-orange-400 mr-1" />Dirty</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-4 sm:px-8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Chart area — timeline gets no vertical padding so it can fill to the viewport edge */}
      <div className={tab === 'timeline' ? 'px-4 sm:px-8 pt-4' : 'px-4 sm:px-8 py-6'}>
        {tab === 'timeline' && <DailyTimeline timeline={processed.timeline} calDates={processed.calDates} />}
        {tab === 'heatmap'  && <SleepHeatmap  heatmap={processed.heatmap}   rowDates={processed.rowDates} />}
        {tab === 'weekly'   && <WeeklyTotals  weeks={processed.weekly} />}
        {tab === 'clock'    && <ClockRadial   data={processed.clock} />}
      </div>
    </div>
  );
}
