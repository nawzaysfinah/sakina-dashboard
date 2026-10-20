'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [pw, setPw]     = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const router          = useRouter();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const res = await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setErr('Wrong password');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌿</div>
          <h1 className="text-2xl font-semibold text-slate-100">Sakina Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Baby sleep · feed · diaper patterns</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={busy || !pw}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            {busy ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
