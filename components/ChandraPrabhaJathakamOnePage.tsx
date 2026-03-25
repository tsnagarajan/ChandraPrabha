import React from "react";

type Props = {
  out: any;
  input?: any;
};

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const SIGN_LORDS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

const PLANET_LABELS: Record<string, string> = {
  Sun: "Sun",
  Moon: "Moo",
  Mercury: "Mer",
  Venus: "Ven",
  Mars: "Mar",
  Jupiter: "Jup",
  Saturn: "Sat",
  Rahu: "Rah",
  Ketu: "Ket",
  Uranus: "Ura",
  Neptune: "Nep",
  Pluto: "Plu",
  Ascendant: "Lag",
};

const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigasira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Visakha",
  "Anuradha",
  "Jyeshta",
  "Mula",
  "Purvashadha",
  "Uttarashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadra",
  "Uttara Bhadra",
  "Revati",
];

function safeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function norm360(x: number) {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
}

function getSignIndex(longitude: number) {
  return Math.floor(norm360(longitude) / 30);
}

function getSignName(longitude: number) {
  return SIGNS[getSignIndex(longitude)];
}

function toDMSWithinSign(longitude: number) {
  const within = norm360(longitude) % 30;
  const d = Math.floor(within);
  const mFloat = (within - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${String(d).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getNakshatraPada(longitude: number) {
  const v = norm360(longitude);
  const nakSize = 13 + 20 / 60; // 13°20'
  const padaSize = 3 + 20 / 60; // 3°20'
  const nakIndex = Math.floor(v / nakSize);
  const offsetInNak = v - nakIndex * nakSize;
  const pada = Math.floor(offsetInNak / padaSize) + 1;
  return {
    star: NAKSHATRAS[Math.max(0, Math.min(26, nakIndex))],
    pada,
  };
}

function splitDate(dateStr?: string) {
  if (!dateStr) return "—";
  return dateStr;
}

function formatLatLon(lat?: any, lon?: any) {
  const la = safeNum(lat);
  const lo = safeNum(lon);
  if (la == null || lo == null) return "—";
  return `${Math.abs(lo).toFixed(2)} ${lo >= 0 ? "East" : "West"}, ${Math.abs(la).toFixed(2)} ${la >= 0 ? "North" : "South"}`;
}

function getPlanetEntries(positions: Record<string, any>, ascendant?: number | null) { 
  const order = [
    "Ascendant",
    "Moon",
    "Sun",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Rahu",
    "Ketu",
  ];

  return order
    .map((name) => {
      const val =
      name === "Ascendant"
    ? ascendant
    : positions?.[name] ?? positions?.[name.toLowerCase()] ?? null;
        
        
      const n = safeNum(val);
      return n == null ? null : { name, longitude: n };
    })
    .filter(Boolean) as { name: string; longitude: number }[];
}

function buildChartMap(positions: Record<string, any>, asc?: number) {
  const map: Record<number, string[]> = {};
  for (let i = 0; i < 12; i++) map[i] = [];

  Object.entries(positions || {}).forEach(([key, value]) => {
    const n = safeNum(value);
    if (n == null) return;

    const sign = getSignIndex(n);

    let label =
      PLANET_LABELS[key] ||
      PLANET_LABELS[
        key.charAt(0).toUpperCase() + key.slice(1)
      ] ||
      key;

    if (label === "Ascendant") label = "Lag";
    if (["Sun", "Moo", "Mer", "Ven", "Mar", "Jup", "Sat", "Rah", "Ket", "Lag", "Ura", "Nep", "Plu"].includes(label)) {
      map[sign].push(label);
    }
  });

  const ascNum = safeNum(asc);
  if (ascNum != null) {
    const ascSign = getSignIndex(ascNum);
    if (!map[ascSign].includes("Lag")) map[ascSign].unshift("Lag");
  }

  return map;
}

function ChartBox({
  title,
  positions,
  ascendant,
  centerText,
}: {
  title: string;
  positions: Record<string, any>;
  ascendant?: number | null;
  centerText: React.ReactNode;
}) {
  const chart = buildChartMap(positions, ascendant ?? undefined);

  const border = "1px solid #333";

  const cellStyle: React.CSSProperties = {
  border: border,
  height: 78,
  padding: "4px 6px",
  fontSize: 11,
  verticalAlign: "top",
  textAlign: "left",
  lineHeight: 1.15,
};

  const centerStyle: React.CSSProperties = {
  border: border,
  textAlign: "center",
  verticalAlign: "middle",
  fontSize: 14,
  fontWeight: 700,
  padding: 6,
};

  const renderSign = (signIndex: number) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {chart[signIndex]?.map((p, i) => (
        <div key={`${signIndex}-${p}-${i}`}>{p}</div>
      ))}
    </div>
  );

  return (
    <div style={{ width: "48.5%" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
  <tr>
    <td style={cellStyle}>{renderSign(11)}</td>
    <td style={cellStyle}>{renderSign(0)}</td>
    <td style={cellStyle}>{renderSign(1)}</td>
    <td style={cellStyle}>{renderSign(2)}</td>
  </tr>
  <tr>
    <td style={cellStyle}>{renderSign(10)}</td>
    <td style={centerStyle} colSpan={2} rowSpan={2}>
      {centerText}
    </td>
    <td style={cellStyle}>{renderSign(3)}</td>
  </tr>
  <tr>
    <td style={cellStyle}>{renderSign(9)}</td>
    <td style={cellStyle}>{renderSign(4)}</td>
  </tr>
  <tr>
    <td style={cellStyle}>{renderSign(8)}</td>
    <td style={cellStyle}>{renderSign(7)}</td>
    <td style={cellStyle}>{renderSign(6)}</td>
    <td style={cellStyle}>{renderSign(5)}</td>
  </tr>
</tbody>
      </table>
    </div>
  );
}

export default function ChandraPrabhaJathakamOnePage({ out, input }: Props) {
  if (!out) return null;

  const positions = out?.positions || {};
  const d9Positions = out?.d9Positions || out?.navamsaPositions || {};
  const ascendant = safeNum(out?.ascendant);
  const d9Ascendant = safeNum(out?.d9Ascendant);

  const moonLong = safeNum(positions?.Moon);
  const moonSign = moonLong != null ? getSignName(moonLong) : "—";
  const moonStar = moonLong != null ? getNakshatraPada(moonLong) : null;

  const lagnaSign = ascendant != null ? getSignName(ascendant) : "—";

  const topRows = [
    ["Name", input?.name || input?.fullName || out?.name || "—"],
    
    
    ["Date of Birth", splitDate(input?.date || input?.dob || out?.dob)],
    ["Time of Birth", input?.time || input?.birthTime || out?.birthTime || "—"],
    ["Time Zone", input?.timezone || input?.tz || out?.timezone || "—"],
    ["Place of Birth", input?.place || input?.location || out?.place || "—"],
    ["Longitude & Latitude", formatLatLon(input?.lat ?? out?.lat, input?.lon ?? out?.lon)],
    ["Ayanamsa", out?.ayanamsaText || out?.ayanamsaDisplay || out?.meta?.ayanamsaText || (typeof out?.ayanamsa === "number" ? `${out.ayanamsa.toFixed(6)}°` : out?.ayanamsa) || "Lahiri"],
    [
      "Birth Star - Pada",
      moonStar ? `${moonStar.star} - ${moonStar.pada}` : "—",
    ],
    [
      "Birth Rasi - Rasi Lord",
      moonLong != null ? `${moonSign} - ${SIGN_LORDS[moonSign]}` : "—",
    ],
    [
      "Lagna (Ascendant) - Lagna Lord",
      ascendant != null ? `${lagnaSign} - ${SIGN_LORDS[lagnaSign]}` : "—",
    ],
   
  ];

  const longTable = getPlanetEntries(positions, ascendant);
const leftTable = longTable.slice(0, 6);
const rightTable = longTable.slice(6);

const currentItem =
  Array.isArray(out?.dasha)
    ? out.dasha.find((d: any) => {
        const now = new Date();
        return new Date(d.startISO) <= now && now < new Date(d.endISO);
      }) || out.dasha[0]
    : null;

const birthMain =
  out?.birthDasha?.main ||
  out?.dasha?.[0]?.lord ||
  out?.dasha?.[0]?.mahadasha ||
  out?.dasha?.[0]?.planet ||
  "—";

const currentMain =
  out?.currentDasha?.main ||
  currentItem?.lord ||
  currentItem?.mahadasha ||
  currentItem?.planet ||
  "—";

const currentSub =
  out?.currentDasha?.sub ||
  out?.currentDasha?.bhukti ||
  out?.subPeriod ||
  currentItem?.bhukti ||
  currentItem?.sub ||
  (() => {
    if (!currentItem?.startISO || !currentItem?.endISO) return "—";

    const now = new Date();
    const lord = String(
      currentItem?.lord || currentItem?.mahadasha || currentItem?.planet || "UNKNOWN"
    ).toUpperCase();

    const dashaStart = new Date(currentItem.startISO).getTime();
    const dashaEnd = new Date(currentItem.endISO).getTime();
    const totalDuration = dashaEnd - dashaStart;

    const vOrder = ["SUN", "MOON", "MARS", "RAHU", "JUPITER", "SATURN", "MERCURY", "KETU", "VENUS"];
    const vYears = [6, 10, 7, 18, 16, 19, 17, 7, 20];

    const currentIndex = vOrder.indexOf(lord);
    if (currentIndex === -1) return "—";

    let accumulatedTime = dashaStart;
    let subLord = "—";

    for (let i = 0; i < 9; i++) {
      const pIdx = (currentIndex + i) % 9;
      const subDuration = (vYears[pIdx] / 120) * totalDuration;
      const nextTime = accumulatedTime + subDuration;

      if (now.getTime() >= accumulatedTime && now.getTime() < nextTime) {
        subLord = vOrder[pIdx];
        break;
      }
      accumulatedTime = nextTime;
    }

    return subLord.charAt(0) + subLord.slice(1).toLowerCase();
  })();

const birthBalance =
  out?.birthDashaBalance ||
  out?.dashaBalanceAtBirth ||
  out?.dashaBalance ||
  (out?.dasha && out.dasha.length > 0
    ? (() => {
        const start = new Date(out.dasha[0].startISO);
        const end = new Date(out.dasha[0].endISO);

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
          months -= 1;
          days += 30;
        }
        if (months < 0) {
          years -= 1;
          months += 12;
        }

        return `${years}y ${months}m ${days}d`;
      })()
    : "—");

const currentRange =
  currentItem?.startISO && currentItem?.endISO
    ? `${currentItem.startISO} >> ${currentItem.endISO}`
    : "";
  const tableWrap: React.CSSProperties = {
    width: "49%",
    borderCollapse: "collapse",
    fontSize: 12,
  };

  const thtd: React.CSSProperties = {
  border: "1px solid #333",
  padding: "4px 6px",
};

return (
  
  <div
  className="onepage-wrap"
  style={{
    width: "100%",
    background: "#fff",
    color: "#111",
    padding: 16,
    fontFamily: '"Times New Roman", serif',
    fontSize: 14,
    lineHeight: 1.25,
    fontWeight: 600,
  }}
>
    
  
    <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
      Chandra Prabha Jathakam
    </div>

    <div style={{ textAlign: "center", fontSize: 12, marginBottom: 10 }}>
      You may print or download the full report from the main page.<br />
      This page can be printed or saved as a PDF using the buttons below.
    </div>

    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
      <tbody>
        {topRows.map(([label, value]) => (
          <tr key={label}>
            <td style={{ padding: "2px 4px", width: "38%", fontWeight: 600 }}>{label}</td>
            <td style={{ padding: "2px 4px", width: "2%" }}>:</td>
            <td style={{ padding: "2px 4px" }}>{value}</td>
          </tr>
        ))}
        
      </tbody>
    </table>

    <div style={{ fontWeight: 700, margin: "8px 0 4px 0" }}>
      Nirayana Longitudes (Summary)
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", gap: "2%" }}>
      <table style={tableWrap}>
        <thead>
          <tr>
            <th style={thtd}>Planet</th>
            <th style={thtd}>Rasi</th>
            <th style={thtd}>Longitude</th>
            <th style={thtd}>Star/Pada</th>
          </tr>
        </thead>
        <tbody>
          {leftTable.map((row) => {
            const sign = getSignName(row.longitude);
            const np = getNakshatraPada(row.longitude);
            return (
              <tr key={row.name}>
                <td style={thtd}>{row.name === "Ascendant" ? "Lagnam" : row.name}</td>
                <td style={thtd}>{sign}</td>
                <td style={thtd}>{toDMSWithinSign(row.longitude)}</td>
                <td style={thtd}>{np.star} / {np.pada}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <table style={tableWrap}>
        <thead>
          <tr>
            <th style={thtd}>Planet</th>
            <th style={thtd}>Rasi</th>
            <th style={thtd}>Longitude</th>
            <th style={thtd}>Star/Pada</th>
          </tr>
        </thead>
        <tbody>
          {rightTable.map((row) => {
            const sign = getSignName(row.longitude);
            const np = getNakshatraPada(row.longitude);
            return (
              <tr key={row.name}>
                <td style={thtd}>{row.name}</td>
                <td style={thtd}>{sign}</td>
                <td style={thtd}>{toDMSWithinSign(row.longitude)}</td>
                <td style={thtd}>{np.star} / {np.pada}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    gap: "2%",
    marginTop: 8,
    transform: "scale(0.88)",
    transformOrigin: "top center",
  }}
>
      <ChartBox
        title="Rasi"
        positions={positions}
        ascendant={out.ascendant}
        centerText={<div>Rasi</div>}
      />

      <ChartBox
        title="Navamsa"
        positions={d9Positions}
        ascendant={out.d9Ascendant}
        centerText={<div>Navamsa</div>}
      />
    </div>

    <div style={{ marginTop: 12, fontSize: 14 }}>
      <div><b>Birth Main Period:</b> {birthMain}</div>
      <div><b>Dasa Balance at Birth:</b> {birthBalance}</div>
      <div><b>Current Dasa:</b> {currentMain}</div>
      <div><b>Sub Period:</b> {currentSub}</div>
    </div>

    <div className="no-print" style={{ marginTop: 20, textAlign: "center" }}>
      <button
        type="button"
        onClick={() => {
          const onePage = document.querySelector(".onepage-wrap") as HTMLElement | null;
          if (!onePage) return;

          const printWindow = window.open("", "_blank", "width=900,height=1200");
          if (!printWindow) return;

          printWindow.document.open();
          printWindow.document.write(`
            <html>
              <head>
                <title>One Page Report</title>
                <style>
                  body {
                    margin: 0;
                    padding: 12px;
                    font-family: "Times New Roman", serif;
                    color: #111;
                    background: #fff;
                  }
                  .no-print {
                    display: none !important;
                  }
                  @page {
                    size: letter portrait;
                    margin: 0.35in;
                  }
                </style>
              </head>
              <body>
                ${onePage.outerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 300);
        }}
        style={{
          padding: "6px 14px",
          marginRight: 10,
          cursor: "pointer",
          border: "1px solid #333",
          background: "#fff",
        }}
      >
        Print One Page
      </button>

      <button
        type="button"
        onClick={async () => {
  const onePage = document.querySelector(".onepage-wrap") as HTMLElement | null;
  if (!onePage) return;

  const clone = onePage.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".no-print").forEach((el) => el.remove());

  const wrapper = document.createElement("div");
  wrapper.style.background = "#fff";
  wrapper.style.padding = "0";
  wrapper.appendChild(clone);

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
    .from(wrapper)
    .save();
}}
        style={{
          padding: "6px 14px",
          cursor: "pointer",
          border: "1px solid #333",
          background: "#fff",
        }}
      >
        Download as PDF
      </button>
    </div>
  </div>
);
}