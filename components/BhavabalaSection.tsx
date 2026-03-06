import React from "react";

export default function BhavabalaSection({ data }: { data: any }) {
  // data is expected to be the API's bhavabala object:
  // { components: { sthana, adhipati, ... }, totals: { "1":.. } }
  const bb = data ?? {};

  const comps = bb.components ?? {};
  const totals = bb.totals ?? {};

  const sthana: Record<string, number> = comps.sthana ?? {};
  const adhipati: Record<string, number> = comps.adhipati ?? {};

  const houses = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const hasAny = houses.some((h) => {
    const t = totals[h];
    return typeof t === "number" || (typeof t === "string" && t.trim() !== "");
  });

  if (!hasAny) {
    return <div>No Bhava Bala data available.</div>;
  }

  const fmt = (v: any) => Number(v ?? 0).toFixed(2);

  const th: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "6px",
    textAlign: "left",
    background: "#f3f4f6",
  };

  const td: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "6px",
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Bhava Bala</h2>
      
      
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
  <tr>
    <th style={th}>Bhava</th>
    <th style={th}>Dig Bala</th>
    <th style={th}>Adhipati Bala</th>
    <th style={th}>Drishti Bala</th>
    <th style={th}>Total</th>
  </tr>
</thead>
<tbody>
  {houses.map((h) => (
    <tr key={h}>
      <td style={td}>{h}</td>
      <td style={td}>{fmt((comps?.dig ?? {})[h])}</td>
      <td style={td}>{fmt((comps?.adhipati ?? {})[h])}</td>
      <td style={td}>{fmt((comps?.drishti ?? {})[h])}</td>
      <td style={td}>{fmt((bb?.totals ?? {})[h])}</td>
    </tr>
  ))}
</tbody>
      </table>
    </div>
  );
}