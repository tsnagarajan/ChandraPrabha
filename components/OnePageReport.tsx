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
    onClick={async () => {
      const onePage = document.querySelector(".onepage-wrap") as HTMLElement | null;
      if (!onePage) return;

      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [0.3, 0.3],
          filename: "One-Page-Jathakam.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(onePage)
        .save();
    }}
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
    Download One Page PDF
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
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
          margin-top: 12px;
        }

        .chart-box {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          overflow: hidden;
          background: #fff;
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
      `}</style>

      <div className="onepage-card">
        <div className="title">Chandra Prabha – One Page Summary</div>

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

        <div className="chart-row">
  <div className="chart-box">
    <SouthIndianChart
      title="Rāśi (D1)"
      mode="sign"
      ascDeg={data.ascDeg}
      positions={data.d1Positions}
      retroSet={new Set()}
    />
  </div>

  <div className="chart-box">
    <SouthIndianChart
      title="Navāṁśa (D9)"
      mode="sign"
      ascDeg={data.d9AscDeg}
      positions={data.d9Positions}
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