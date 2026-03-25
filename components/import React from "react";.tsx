import React from "react";

type Props = {
  out: any;
  input?: any;
};

const SIGNS = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karkata",
  "Simha",
  "Kanya",
  "Tula",
  "Vrischika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
];

const SIGN_LORDS: Record<string, string> = {
  Mesha: "Kuja",
  Vrishabha: "Shukra",
  Mithuna: "Budha",
  Karkata: "Chandra",
  Simha: "Surya",
  Kanya: "Budha",
  Tula: "Shukra",
  Vrischika: "Kuja",
  Dhanu: "Guru",
  Makara: "Sani",
  Kumbha: "Sani",
  Meena: "Guru",
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

function getPlanetEntries(positions: Record<string, any>) {
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
    ? out?.ascendant
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
            <td style={cellStyle}>{renderSign(0)}</td>
            <td style={cellStyle}>{renderSign(1)}</td>
            <td style={cellStyle}>{renderSign(2)}</td>
            <td style={cellStyle}>{renderSign(3)}</td>
          </tr>
          <tr>
            <td style={cellStyle}>{renderSign(11)}</td>
            <td style={centerStyle} colSpan={2} rowSpan={2}>
              {centerText}
            </td>
            <td style={cellStyle}>{renderSign(4)}</td>
          </tr>
          <tr>
            <td style={cellStyle}>{renderSign(10)}</td>
            <td style={cellStyle}>{renderSign(5)}</td>
          </tr>
          <tr>
            <td style={cellStyle}>{renderSign(9)}</td>
            <td style={cellStyle}>{renderSign(8)}</td>
            <td style={cellStyle}>{renderSign(7)}</td>
            <td style={cellStyle}>{renderSign(6)}</td>
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
    
    ["Sex", input?.sex || out?.sex || "—"],
    ["Date of Birth", splitDate(input?.date || input?.dob || out?.dob)],
    ["Time of Birth", input?.time || input?.birthTime || out?.birthTime || "—"],
    ["Time Zone", input?.timezone || input?.tz || out?.timezone || "—"],
    ["Place of Birth", input?.place || input?.location || out?.place || "—"],
    ["Longitude & Latitude", formatLatLon(input?.lat ?? out?.lat, input?.lon ?? out?.lon)],
    ["Ayanamsa", out?.ayanamsaText || out?.ayanamsa || "—"],
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
    ["Tithi", out?.tithi || out?.panchanga?.tithi || "—"],
  ];

  const longTable = getPlanetEntries(positions);
  const leftTable = longTable.slice(0, 6);
  const rightTable = longTable.slice(6);

  const currentMain =
  out?.currentDasha?.main ||
  out?.dasha?.find((d: any) => {
    const now = new Date();
    return new Date(d.startISO) <= now && now < new Date(d.endISO);
  })?.lord ||
  "—";
    

  const currentSub =
  out?.currentDasha?.sub ||
  out?.subPeriod ||
  "—";

  const birthBalance =
    out?.birthDashaBalance ||
    out?.dashaBalanceAtBirth ||
    out?.dashaBalance ||
    "—";

  const currentRange =
    out?.currentDasha?.range ||
    (out?.dasha?.[0]?.startISO && out?.dasha?.[0]?.endISO
      ? `${out.dasha[0].startISO} >> ${out.dasha[0].endISO}`
      : "");

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
      style={{
        width: "100%",
        background: "#fff",
        color: "#111",
        padding: 16,
        fontFamily: '"Times New Roman", serif',
        fontSize: 14,
        lineHeight: 1.25,
      }}
    >
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
        Chandra Prabha Jathakam
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

      <div style={{ display: "flex", justifyContent: "space-between", gap: "2%", marginTop: 12 }}>
        <ChartBox
          title="Rasi"
          positions={positions}
          ascendant={out.ascendant}
          centerText={
            <div>Rasi</div>
          }
        />

        <ChartBox
          title="Navamsa"
          positions={d9Positions}
          ascendant={out.d9Ascendant}
          centerText={<div>Navamsa</div>}
        />
      <div style={{ marginTop: 12, fontSize: 14 }}>
  <span>Dasa balance at birth = {birthBalance}</span>
  <span style={{ marginLeft: 16 }}>Current Dasa: {currentMain}</span>
  <span style={{ marginLeft: 16 }}>Sub Period: {currentSub}</span>
</div>
    </div>
  );
}