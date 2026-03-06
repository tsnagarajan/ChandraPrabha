

// components/ShadbalaSection.tsx
import React from "react";


// --- SHADBALA SECTION (BACKEND DATA ONLY) ---
export default function ShadbalaSection({ data }: { data: any }) {
  if (!data || typeof data !== "object") {
    return <div>No Shadbala data available.</div>;
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Shadbala (Classical Parāśara)</h2>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Planet</th>
            <th>Sthāna</th>
            <th>Dig</th>
            <th>Kāla</th>
            <th>Cheshtā</th>
            <th>Naisargika</th>
            <th>Drik</th>
            <th>Total</th>
            <th>Rupas</th>
          </tr>
        </thead>

        <tbody>
          {Object.keys(data).map((p) => {
            const r: any = data[p];
            if (!r) return null;

            return (
              <tr key={p}>
                <td>{p}</td>
                <td>{Number(r.sthana ?? r.STHAN ?? 0).toFixed(2)}</td>
<td>{Number(r.dig ?? r.DIK ?? 0).toFixed(2)}</td>
<td>{Number(r.kala ?? r.KALA ?? 0).toFixed(2)}</td>
<td>{Number(r.chesta ?? r.CHEST ?? 0).toFixed(2)}</td>
<td>{Number(r.naisargika ?? r.NYSAR ?? 0).toFixed(2)}</td>
<td>{Number(r.drik ?? r.DHRIS ?? 0).toFixed(2)}</td>
<td>{Number(r.total ?? r.SHADBAL ?? 0).toFixed(2)}</td>
<td>{Number(r.rupas ?? r.RUPAS ?? 0).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  );
}



// --- BHAVA BALA SECTION (BACKEND DATA ONLY) ---
export const BhavaBalaSection = ({ data }: { data: any }) => {
  if (!data || typeof data !== "object") return null;

  const houses = Object.keys(data);

  return (
    <div style={{ marginTop: "40px", pageBreakInside: "avoid" }}>
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: "1rem",
          borderLeft: "4px solid #3b82f6",
          paddingLeft: "10px",
        }}
      >
        BHAVA BALA: House Strengths
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>House</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {houses.map((h) => {
            const r = data[h];
            if (!r) return null;

            return (
              <tr key={h}>
                <td>{h}</td>
                <td>{r.total?.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};


// --- STRENGTH INTERPRETATION (SAFE VERSION) ---
export const StrengthInterpretation = ({
  shadData,
  bhavaData,
}: {
  shadData: any;
  bhavaData: any;
}) => {
  // 1. Safety check: if no data, show nothing instead of crashing
  if (!shadData || typeof shadData !== 'object' || Object.keys(shadData).length === 0) return null;
  if (!bhavaData || typeof bhavaData !== 'object' || Object.keys(bhavaData).length === 0) return null;

  const planets = Object.keys(shadData ?? {});

// bhavaData shape is: { components: {...}, totals: {...} }
const totals = bhavaData?.totals ?? {};
const houses = Object.keys(totals);

// strongest planet
const strongestPlanet = planets
  .map((p) => ({ planet: p, total: Number(shadData?.[p]?.total ?? 0) }))
  .sort((a, b) => b.total - a.total)[0];

// strongest house (from bhavaData.totals)
const strongestHouse = houses
  .map((h) => ({ house: h, total: Number(totals?.[h] ?? 0) }))
  .sort((a, b) => b.total - a.total)[0];

if (!strongestPlanet || !strongestHouse) return null;
  return (
    <div
      className="page-section card avoid-break"
      style={{ marginTop: "30px", borderLeft: "5px solid #1e40af", padding: "15px" }}
    >
      <h3 className="section-title" style={{ color: "#1e40af" }}>
        Detailed Planetary Analysis
      </h3>

      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
        The <strong>{strongestPlanet.planet}</strong> is the dominant force in this chart with a
        total score of <strong>{(strongestPlanet.total || 0).toFixed(2)}</strong>.
      </p>

      <h3 className="section-title" style={{ color: "#1e40af", marginTop: "20px" }}>
        House Strength (Bhava Bala)
      </h3>

      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
        Your <strong>House {strongestHouse.house}</strong> is the strongest area of life (Score:{" "}
        <strong>{(strongestHouse.total || 0).toFixed(2)}</strong>).
      </p>
    </div>
  );
};