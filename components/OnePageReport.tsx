'use client';

import React from 'react';
import SouthIndianChart from '@/components/SouthIndianChart';

export default function OnePageReport({ data }: any) {
  if (!data) return null;

  const {
    name,
    birthDetails,
    lagna,
    d9Lagna,
    rasi,
    nakshatra,
    pada,
    d1Positions,
    d9Positions,
    ascDeg,
    d9AscDeg,
    speeds,
    vargaRows,
    dashaBalance,
    currentDasha,
    birthDasha,
  } = data;

  const getKetuDeg = (pos: Record<string, any>) => {
    if (!pos) return 0;
    if (typeof pos.Ketu === 'number') return pos.Ketu;
    if (typeof pos.Ket === 'number') return pos.Ket;
    
    const rahuDeg = pos.Rahu ?? pos.Rah ?? pos.rahu ?? pos.Ra;
    if (typeof rahuDeg === 'number') {
      return (rahuDeg + 180) % 360;
    }
    return 0;
  };

  const safeD1 = { ...d1Positions, Ketu: d1Positions?.Ketu ?? d1Positions?.Ket ?? ((d1Positions?.Rahu ?? d1Positions?.Rah ?? 0) + 180) % 360 };
  const safeD9 = { ...d9Positions, Ketu: getKetuDeg(d9Positions) };

  return (
  <div className="onepage-wrap">
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <img
        src="/logo.png"
        alt="Logo"
        style={{ height: 60, objectFit: "contain" }}
      />
    </div>
     <div className="no-print" style={{ textAlign: "center", marginBottom: 12 }}>
  <button
    type="button"
    onClick={() => window.print()}
    style={{
      padding: "8px 16px",
      backgroundColor: "#2563EB",
      color: "white",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Print / Save as PDF

  </button>
</div>
    

      <style jsx>{`
        .onepage-wrap {
          padding: 16px;
          font-family: Georgia, 'Times New Roman', serif;
          color: #111827;
          background: white;
        }

        .onepage-card {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 16px;
          background: #ffffff;
        }

        .title {
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          margin: 14px 0 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
        }

        .line {
          margin: 4px 0;
          font-size: 14px;
          line-height: 1.35;
        }

       .charts-grid {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: start;
          margin-top: 12px;
        }

        /*
          The two chart-box divs (D1 and D9) actually live inside a container
          with class "chart-row" in the JSX below -- but no rule for that
          class name existed before now (the rule above, "charts-grid", was
          defined but never actually applied to anything). That mismatch is
          fixed here: chart-row now explicitly stacks the two charts one
          below the other, each given the full available width, matching
          how the main page report displays them (where the 4th/5th planet
          problem does not occur).
        */
        .chart-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
        }

        .chart-row .chart-box {
          width: 100% !important;
          max-width: 480px;
        }

        .chart-box {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px;
          background: #fff;
          overflow: visible !important;
          width: fit-content;
        }

        /*
          Previously this scaled the chart down to 90% and widened it to
          111% to help two charts squeeze into a side-by-side row. Now that
          charts stack vertically with the full page width each (see
          .chart-row above), that compression is counterproductive -- it
          works against having more room per cell, which is the actual goal.
          Left at 1.0 (effectively a no-op) rather than deleted outright, so
          it's easy to reintroduce if the layout ever goes back to side-by-side.
        */
        .chart-box :global(> div) {
          transform: scale(1.0);
          transform-origin: top left;
        }

        /*
          BROAD, DEFENSIVE OVERRIDE — targets every element inside a chart cell,
          not just div/span. This addresses the most common reasons a 4th item
          in a crowded cell (e.g. Ketu, always last since it's appended last
          when the position object is built) silently disappears:
            1. overflow/max-height clipping (the original fix)
            2. text refusing to wrap onto a second line (white-space)
            3. flex children refusing to shrink below their natural width,
               which silently pushes the last item outside the visible box
               even though the parent itself isn't "overflowing" in the
               traditional sense (the min-width:0 rule below is the fix for
               this specific, very common flexbox trap)
        */
        .chart-box :global(*) {
          overflow: visible !important;
          max-height: none !important;
          white-space: normal !important;
          text-overflow: clip !important;
          flex-wrap: wrap !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }

        /* Prevent clipping inside chart cells and allow cell contents to overflow cleanly */
        .chart-box :global(div) {
          overflow: visible !important;
          max-height: none !important;
        }
        .mini-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 12px;
        }

        .mini-table th,
        .mini-table td {
          border: 1px solid #d1d5db;
          padding: 5px 6px;
          text-align: left;
          vertical-align: top;
        }

        .mini-table th {
          background: #f9fafb;
          font-weight: 700;
        }

        .subtle {
          color: #4b5563;
        }

        @media (max-width: 768px) {
          .title {
            font-size: 19px;
          }

          .grid-2,
          .charts-grid {
            grid-template-columns: 1fr;
          }

          .onepage-wrap {
            padding: 10px;
          }

          .onepage-card {
            padding: 12px;
          }

          .line {
            font-size: 13px;
          }

          .mini-table {
            font-size: 11px;
          }

          .chart-box :global(.card) {
            transform: scale(0.92);
            transform-origin: top center;
          }
        }

       @media print {
          .chart-box {
            overflow: visible !important;
          }

          /* Same broad, defensive override as above, repeated here because
             print rendering can apply its own layout pass in some browsers
             (especially Chrome's print preview), so it's safer not to rely
             solely on the non-print rule cascading through unchanged. */
          .chart-box :global(*) {
            overflow: visible !important;
            max-height: none !important;
            white-space: normal !important;
            text-overflow: clip !important;
            flex-wrap: wrap !important;
            min-width: 0 !important;
          }

          .chart-box :global(span) {
            font-size: 8px !important;
            line-height: 1.1 !important;
            padding: 0px 1px !important;
          }

          .chart-box :global(div) {
            font-size: 8px !important;
          }
        }
      `}</style>

      <div className="onepage-card">
        <div className="title">Chandra Prabha Jathakam– One Page Summary</div>
        <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginBottom: 10 }}>Made with lots of Love by Dr. Tirunelveli Subramanian Nagarajan (Raja Nagarajan) — tsnagarajan@gmail.com</div>
        
        <div className="grid-2">
          <div>
            <div className="section-title">Birth Details</div>
            <div className="line"><b>Name:</b> {name || '—'}</div>
            <div className="line"><b>Date:</b> {birthDetails?.date || '—'}</div>
            <div className="line"><b>Time:</b> {birthDetails?.time || '—'}</div>
            <div className="line"><b>Place:</b> {birthDetails?.place || '—'}</div>
            <div className="line"><b>Latitude:</b> {birthDetails?.lat || '—'}</div>
            <div className="line"><b>Longitude:</b> {birthDetails?.lon || '—'}</div>
            <div className="line"><b>Timezone:</b> {birthDetails?.timezone || '—'}</div>
          </div>

          <div>
            <div className="section-title">Key Identity</div>
            <div className="line"><b>Lagna:</b> {lagna || '—'}</div>
            <div className="line"><b>Navamsa Lagna:</b> {d9Lagna || '—'}</div>
            <div className="line"><b>Moon Rasi:</b> {rasi || '—'}</div>
            <div className="line"><b>Nakshatra:</b> {nakshatra || '—'}</div>
            <div className="line"><b>Pada:</b> {pada || '—'}</div>
          </div>
        </div>

        <div
          className="chart-row"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: 12,
          }}
        >
  <div className="chart-box" style={{ width: "100%", maxWidth: 480 }}>
    <SouthIndianChart
      title="Rāśi (D1)"
      mode="sign"
      ascDeg={data.ascDeg}
      positions={safeD1}
      retroSet={new Set()}
    />
  </div>

  <div className="chart-box" style={{ width: "100%", maxWidth: 480 }}>
    <SouthIndianChart
      title="Navāṁśa (D9)"
      mode="sign"
      ascDeg={data.d9AscDeg}
      positions={safeD9}
      retroSet={new Set()}
    />
  </div>
</div>

<div style={{ breakBefore: "page", pageBreakBefore: "always" }}>
  <div className="section-title">Varga Summary — D1 → D9</div>
  <table className="mini-table">
    <thead>
      <tr>
        <th>Body</th>
        <th>D1 (Rāśi)</th>
        <th>Star • Pada (D1)</th>
        <th>D9 (Navāṁśa)</th>
      </tr>
    </thead>
    <tbody>
      {(vargaRows || []).map((row: any, i: number) => (
        <tr key={i}>
          <td>{row.body}</td>
          <td>{row.d1}</td>
          <td>{row.nakshatra || "—"} • {row.pada || "—"}</td>
          <td>{row.d9}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<div style={{ marginTop: 16 }} className="grid-2">
  <div>
    <h3>Dasha Balance at Birth</h3>
    <div>Birth Main Period: {data.birthDasha?.main || "—"}</div>
    <div>Balance: {data.dashaBalance || "—"}</div>
  </div>

  <div>
    <h3>Current Period</h3>
    <div>Main Period: {data.currentDasha?.main || "—"}</div>
    <div>Sub-Period: {data.currentDasha?.sub || "—"}</div>
  </div>
</div>

      
          </div>
    </div>
  );
}