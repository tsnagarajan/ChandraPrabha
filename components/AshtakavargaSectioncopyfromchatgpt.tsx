// app/components/AshtakavargaSection.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Planet7 = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
const P7: Planet7[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

type AvApiResponse = {
  sav: number[];
  bav: Record<Planet7, number[]>;
  lagnaBav: number[];
};

const SIGN_ABBR = ['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];

function GridRow({ title, values }: { title: string; values: number[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8 }}>
        {values.map((v, i) => (
          <div key={i} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{SIGN_ABBR[i]}</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AshtakavargaSection({ out }: { out: any }) {
  const payload = useMemo(() => {
    if (!out?.positions || typeof out?.ascendant !== 'number') return null;
    return { positions: out.positions as Record<string, number>, ascendant: out.ascendant as number };
  }, [out]);

  const [data, setData] = useState<AvApiResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showBav, setShowBav] = useState(false);
  const [showLagna, setShowLagna] = useState(false);

  
  useEffect(() => {
  let cancelled = false;

  async function run() {
    if (!payload) return;
    setErr(null);

    try {
      const res = await fetch('/api/ashtakavarga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      }

      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response: ${text.slice(0, 300)}`);
      }

      if (!cancelled) setData(json as AvApiResponse);
    } catch (e: any) {
      if (!cancelled) setErr(String(e?.message ?? e));
    }
  }

  run();
  return () => {
    cancelled = true;
  };
}, [payload]);


  if (!payload) return null;

  return (
    <section className="page-section avoid-break">
      <div className="section-title">Ashtakavarga</div>

      {err && (
        <div className="card" style={{ border: '1px solid #fca5a5' }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Ashtakavarga error</div>
          <div style={{ opacity: 0.85 }}>{err}</div>
        </div>
      )}

      {!err && !data && (
        <div className="card">
          <div style={{ opacity: 0.85 }}>Computing Ashtakavarga…</div>
        </div>
      )}

      {data && (
        <div className="card avoid-break">
          <GridRow title="Sarvashtakavarga (SAV)" values={data.sav} />

          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowBav((v) => !v)}>
              {showBav ? 'Hide BAV' : 'Show BAV (Sun..Saturn)'}
            </button>
            <button type="button" onClick={() => setShowLagna((v) => !v)}>
              {showLagna ? 'Hide Lagna BAV' : 'Show Lagna BAV'}
            </button>
          </div>

          {showBav && (
            <div style={{ marginTop: 12 }}>
              {P7.map((p) => (
                <GridRow key={p} title={`Binna Ashtakavarga (BAV) — ${p}`} values={data.bav[p]} />
              ))}
            </div>
          )}

          {showLagna && (
            <div style={{ marginTop: 12 }}>
              <GridRow title="Asc/Lagna BAV" values={data.lagnaBav} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
