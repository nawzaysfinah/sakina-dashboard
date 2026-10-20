'use client';

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const TT_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 12,
  color: '#f1f5f9',
};

export default function WeeklyTotals({ weeks }) {
  if (!weeks.length) return <p className="text-slate-500 text-sm">No weekly data yet.</p>;

  const sleepData   = weeks.map(w => ({ week: w.label, 'Sleep (h)': w.sleepH }));
  const feedData    = weeks.map(w => ({ week: w.label, Feeds: w.feeds, 'Milk (ml)': w.ml }));
  const diaperData  = weeks.map(w => ({ week: w.label, Wet: w.wet, Dirty: w.dirty }));

  const tick = { fill: '#64748b', fontSize: 11 };
  const grid = { stroke: '#1e293b' };

  return (
    <div className="space-y-10">
      <Section title="💤 Sleep per week">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sleepData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis dataKey="week" tick={tick} />
            <YAxis tick={tick} unit="h" />
            <Tooltip contentStyle={TT_STYLE} />
            <Bar dataKey="Sleep (h)" fill="#818cf8" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="🍼 Feeds per week">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={feedData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis dataKey="week" tick={tick} />
            <YAxis yAxisId="left" tick={tick} />
            <YAxis yAxisId="right" orientation="right" tick={tick} unit="ml" />
            <Tooltip contentStyle={TT_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left"  dataKey="Feeds"      fill="#f472b6" radius={[3,3,0,0]} />
            <Bar yAxisId="right" dataKey="Milk (ml)"  fill="#fbbf24" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="🧷 Diapers per week">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={diaperData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis dataKey="week" tick={tick} />
            <YAxis tick={tick} />
            <Tooltip contentStyle={TT_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Wet"   stroke="#7dd3fc" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Dirty" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-slate-300 mb-4">{title}</h2>
      <div className="bg-slate-900 rounded-xl p-4">{children}</div>
    </div>
  );
}
