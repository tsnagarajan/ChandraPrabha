'use client';

import React from 'react';
import SouthIndianChart from '@/components/SouthIndianChart';

export default function ChandraPrabhaJathakamOnePage({ data }: any) {
  if (!data) return null;

  const {
    name,
    birthDetails,
    lagna,
    rasi,
    nakshatra,
    pada,
    d1Positions,
    d9Positions,
    ascDeg,
    d9AscDeg,
    vargaRows,
    dashaBalance,
    currentDasha,
    birthDasha,
    speeds,
  } = data;

 // Map speed abbreviations to full planet names
const planetNameMap: Record<string, string> = {
  Su: 'Sun',
  Mo: 'Moon',
  Me: 'Mercury',
  Ve: 'Venus',
  Ma: 'Mars',
  Ju: 'Jupiter',
  Sa: 'Saturn',
};

const retroPlanetsD1 = Object.entries(speeds || {}).filter(([abbr, speed]) => {
  const map: any = {
    Su: 'Sun', Mo: 'Moon', Me: 'Mercury', Ve: 'Venus',
    Ma: 'Mars', Ju: 'Jupiter', Sa: 'Saturn'
  };

  if (!map[abbr]) return false;
  return typeof speed === 'number' && speed < 0;
}).map(([abbr]) => {
  const map: any = {
    Su: 'Sun', Mo: 'Moon', Me: 'Mercury', Ve: 'Venus',
    Ma: 'Mars', Ju: 'Jupiter', Sa: 'Saturn'
  };
  return map[abbr];
});


// Build the summary sentence
let retroText = '';
if (retroPlanetsD1.length === 0) {
  retroText = 'All planets are direct.';
} else if (retroPlanetsD1.length === 1) {
  retroText = `${retroPlanetsD1[0]} is retrograde.`;
} else {
  retroText = `${retroPlanetsD1.join(', ')} are retrograde.`;
}











  const leftRows  = (vargaRows || []).slice(0, 6);
  const rightRows = (vargaRows || []).slice(6);

  const handlePrint = () => {
    const root = document.querySelector('.onepage-root') as HTMLElement | null;
    if (!root) return;
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Chandra Prabha Jathakam</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Georgia, 'Times New Roman', serif; color: #111; background: #fff; }
            .no-print { display: none !important; }
            @page { size: letter portrait; margin: 0.3in; }
            .onepage-root { transform: scale(0.55); transform-origin: top center; width: 100%; }
          </style>
        </head>
        <body>${root.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const tdB: React.CSSProperties = { border: '1px solid #444', padding: '4px 6px', textAlign: 'left', fontSize: 11 };
  const thB: React.CSSProperties = { border: '1px solid #444', padding: '4px 6px', background: '#f0f0f0', fontWeight: 'bold', textAlign: 'left', fontSize: 11 };
  
  








  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#111', background: '#fff' }}>
      <div className="onepage-root" style={{ maxWidth: 860, margin: '0 auto', padding: '12px 20px', fontSize: 11, ['--cell-size' as any]: '90px' }}>

        {/* TITLE */}
        <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 'bold', marginBottom: 3 }}>
          Chandra Prabha Jathakam
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 2 }}>
          Made with lots of Love by Dr. Tirunelveli Subramanian Nagarajan (Raja Nagarajan) — tsnagarajan@gmail.com
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#333', marginBottom: 14 }}>
          You may print or download the full report from the main page.<br />
          This page can be printed or saved as a PDF using the button below.
        </div>

        {/* BIRTH DETAILS */}
        <table style={{ width: '100%', marginBottom: 12, borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {([
              ['Name', name],
              ['Date of Birth', birthDetails?.date],
              ['Time of Birth', birthDetails?.time],
              ['Time Zone', birthDetails?.timezone],
              ['Place of Birth', birthDetails?.place],
              ['Longitude & Latitude', birthDetails?.lon && birthDetails?.lat
                ? `${parseFloat(birthDetails.lon).toFixed(2)} East, ${parseFloat(birthDetails.lat).toFixed(2)} North`
                : '—'],
              ['Ayanamsa', 'Lahiri'],
              ['Birth Star - Pada', nakshatra && pada ? `${nakshatra} - ${pada}` : '—'],
              ['Birth Rasi - Rasi Lord', rasi || '—'],
              ['Lagna (Ascendant) - Lagna Lord', lagna || '—'],
            ] as [string, string][]).map(([label, value], i) => (
              <tr key={i}>
                <td style={{ fontWeight: 'bold', width: '35%', padding: '1px 4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{label}</td>
                <td style={{ padding: '1px 4px', verticalAlign: 'top' }}>:&nbsp;&nbsp;{value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* NIRAYANA LONGITUDES */}
        <div style={{ fontWeight: 'bold', fontSize: 11, textDecoration: 'underline', marginBottom: 5 }}>
          Nirayana Longitudes (Summary)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Planet','Rasi','Longitude','Star/Pada'].map(h => <th key={h} style={thB}>{h}</th>)}</tr></thead>
            <tbody>
              {leftRows.map((row: any, i: number) => (
                <tr key={i}>
                  <td style={{ ...tdB, fontWeight: i === 0 ? 'bold' : 'normal' }}>{row.body}</td>
                  <td style={{ ...tdB, fontWeight: i === 0 ? 'bold' : 'normal' }}>{row.d1?.split(' ')[0] || '—'}</td>
                  <td style={{ ...tdB, fontWeight: i === 0 ? 'bold' : 'normal' }}>{row.d1?.split(' ')[1] || '—'}</td>
                  <td style={{ ...tdB, fontWeight: i === 0 ? 'bold' : 'normal' }}>{row.nakshatra && row.pada ? `${row.nakshatra} / ${row.pada}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Planet','Rasi','Longitude','Star/Pada'].map(h => <th key={h} style={thB}>{h}</th>)}</tr></thead>
            <tbody>
              {rightRows.map((row: any, i: number) => (
                <tr key={i}>
                  <td style={tdB}>{row.body}</td>
                  <td style={tdB}>{row.d1?.split(' ')[0] || '—'}</td>
                  <td style={tdB}>{row.d1?.split(' ')[1] || '—'}</td>
                  <td style={tdB}>{row.nakshatra && row.pada ? `${row.nakshatra} / ${row.pada}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/*
          CHARTS
          CHANGED (see chat for full reasoning):
          1. gridTemplateColumns changed from '1fr 1fr' (2 columns, side by
             side) to '1fr' (1 column) so D1 sits above D9, each getting the
             full width instead of half.
          2. --cell-size increased from 80px to 130px on each chart, giving
             each Rasi cell much more room for a 4th/5th planet label.
          3. compact={true} removed (changed to compact={false}) -- this was
             very likely switching SouthIndianChart into a deliberately
             smaller/denser layout mode built for tight two-column space,
             which may itself have been capping how much a cell shows.
             Since D1 and D9 no longer need to share a row, compact mode is
             no longer needed anyway.
        */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 10 }}>
          <div style={{'--cell-size': '130px'} as React.CSSProperties}>
            <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 3 }}>Rasi</div>
            <SouthIndianChart title="" mode="sign" ascDeg={ascDeg} positions={d1Positions} retroSet={new Set()} compact={false} />
          </div>
          <div style={{'--cell-size': '130px'} as React.CSSProperties}>
            <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 3 }}>Navamsa</div>
            <SouthIndianChart title="" mode="sign" ascDeg={d9AscDeg} positions={d9Positions} retroSet={new Set()} compact={false} />
          </div>
          </div>
        
          <div style={{ fontSize: 11, marginTop: 6, fontWeight: 'bold', textAlign: 'center' }}>
          {retroText}
          </div>




        {/* DASHA */}
        <div style={{ fontSize: 11, lineHeight: 2, marginTop: 6 }}>
          <div><b>Birth Main Period:</b> {birthDasha?.main || '—'}</div>
          <div><b>Dasa Balance at Birth:</b> {dashaBalance || '—'}</div>
          <div><b>Current Dasa:</b> {currentDasha?.main || '—'}</div>
          <div><b>Sub Period:</b> {currentDasha?.sub || '—'}</div>
        </div>

        {/* PRINT BUTTON - bottom */}
        <div className="no-print" style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '8px 28px',
              backgroundColor: '#4B5563',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 'bold',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            🖨️ Print / Save as PDF
          </button>
        </div>

      </div>
    </div>
  );
}
