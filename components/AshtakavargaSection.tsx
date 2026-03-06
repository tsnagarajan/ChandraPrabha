import React, { useMemo } from "react";
import { computeAvkPindas } from "@/app/lib/avkPinda";

export default function AshtakavargaSection({ out }: any) {
  const positions = out?.positions || {};
  const liveAsc = out?.ascendant || 0;

  const signs = [
    "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
    "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
  ];

  const lagnaIdx = Math.floor((((liveAsc % 360) + 360) % 360) / 30);

  const planets = [
    { key: "SUN", display: "Sun" },
    { key: "MOON", display: "Moon" },
    { key: "MARS", display: "Mars" },
    { key: "MERCURY", display: "Mercury" },
    { key: "JUPITER", display: "Jupiter" },
    { key: "VENUS", display: "Venus" },
    { key: "SATURN", display: "Saturn" },
  ];

  // ----------------------------
  // 1) AVK engine (BAV + SAV)
  // ----------------------------
  const result = useMemo(() => {
    const signsList = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN"] as const;

    const getLon = (v: any) => {
      if (typeof v === "number") return v;
      if (v && typeof v.lon === "number") return v.lon;
      if (v && typeof v.longitude === "number") return v.longitude;
      return undefined;
    };

    const getS = (v: any) => {
      const deg = getLon(v);
      if (deg === undefined) return 0;
      return Math.floor((((deg % 360) + 360) % 360) / 30);
    };

    const pSigns: Record<string, number> = {
      SUN: getS(positions.Sun ?? positions.SUN),
      MOON: getS(positions.Moon ?? positions.MOON),
      MARS: getS(positions.Mars ?? positions.MARS),
      MERCURY: getS(positions.Mercury ?? positions.MERCURY),
      JUPITER: getS(positions.Jupiter ?? positions.JUPITER),
      VENUS: getS(positions.Venus ?? positions.VENUS),
      SATURN: getS(positions.Saturn ?? positions.SATURN),
      RAHU: getS(positions.Rahu ?? positions.RAHU),
      KETU: getS(positions.Ketu ?? positions.KETU),
      ASC: lagnaIdx,
    };

    // BAV rules (as you already had)
    const rules: any = {
      SUN: { SUN:[1,2,4,7,8,9,10,11], MOON:[3,6,10,11], MARS:[1,2,4,7,8,9,10,11], MERCURY:[3,5,6,9,10,11,12], JUPITER:[5,6,9,11], VENUS:[6,7,12], SATURN:[1,2,4,7,8,9,10,11], ASC:[3,4,6,10,11,12] },
      MOON:{ SUN:[3,6,7,8,10,11], MOON:[1,3,6,7,10,11], MARS:[2,3,5,6,9,10,11], MERCURY:[1,3,4,5,7,8,10,11], JUPITER:[1,4,7,8,10,11,12], VENUS:[3,4,5,7,9,10,11], SATURN:[3,5,6,11], ASC:[3,6,10,11] },
      MARS:{ SUN:[3,5,6,10,11], MOON:[3,6,11], MARS:[1,2,4,7,8,10,11], MERCURY:[3,5,6,11], JUPITER:[6,10,11,12], VENUS:[6,8,11,12], SATURN:[1,4,7,8,9,10,11], ASC:[1,3,6,10,11] },
      MERCURY:{ SUN:[5,6,9,11,12], MOON:[2,4,6,8,10,11], MARS:[1,2,4,7,8,9,10,11], MERCURY:[1,3,5,6,9,10,11,12], JUPITER:[6,8,11,12], VENUS:[1,2,3,4,5,8,9,11], SATURN:[1,2,4,7,8,9,10,11], ASC:[1,2,4,6,8,10,11] },
      JUPITER:{ SUN:[1,2,3,4,7,8,9,10,11], MOON:[2,5,7,9,11], MARS:[1,2,4,7,8,10,11], MERCURY:[1,2,4,5,6,9,10,11], JUPITER:[1,2,3,4,7,8,10,11], VENUS:[2,5,6,9,10,11], SATURN:[3,5,6,12], ASC:[1,2,4,5,6,7,9,10,11] },
      VENUS:{ SUN:[8,11,12], MOON:[1,2,3,4,5,8,9,11,12], MARS:[3,5,6,9,11,12], MERCURY:[3,5,6,9,11], JUPITER:[5,8,9,10,11], VENUS:[1,2,3,4,5,8,9,10,11], SATURN:[3,4,5,8,9,10,11], ASC:[1,2,3,4,5,8,9,11] },
      SATURN:{ SUN:[1,2,4,7,8,10,11], MOON:[3,6,11], MARS:[3,5,6,10,11,12], MERCURY:[6,8,9,10,11,12], JUPITER:[5,6,11,12], VENUS:[6,11,12], SATURN:[3,5,6,11], ASC:[1,3,4,6,10,11] }
    };

    const table: any = {};
    const bavTotals: any = {};
    const sarva = Array(12).fill(0);

    (signsList as any).forEach((pKey: string) => {
      table[pKey] = Array(12).fill(0);

      Object.keys(rules[pKey]).forEach((refKey: string) => {
        const startSign = pSigns[refKey];
        if (startSign === undefined) return;

        rules[pKey][refKey].forEach((houseNum: number) => {
          const targetSign = (startSign + (houseNum - 1)) % 12;
          table[pKey][targetSign] += 1;
        });
      });

      bavTotals[pKey] = table[pKey].reduce((a: number, b: number) => a + b, 0);
      table[pKey].forEach((pts: number, i: number) => { sarva[i] += pts; });
    });

    return { table, sarva, bavTotals, pSigns };
  }, [positions, lagnaIdx]);

  const { table: avTable, sarva: savArray, bavTotals, pSigns } = result;

  // ----------------------------
  // 2) Pindas (JHora style) — use avTable + pSigns
  // ----------------------------
  const { rasiPinda, grahaPinda, sodhyaPinda } = useMemo(
    () => computeAvkPindas(avTable, pSigns),
    [avTable, pSigns]
  );

  const pindaSummary = useMemo(() => {
    const keys = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN"] as const;
    const maxS = Math.max(...keys.map(k => sodhyaPinda?.[k] ?? 0), 1);

    const ranked = keys
      .map(k => ({
        key: k,
        sodhya: sodhyaPinda?.[k] ?? 0,
        rasi: rasiPinda?.[k] ?? 0,
        graha: grahaPinda?.[k] ?? 0,
        pct: Math.round(((sodhyaPinda?.[k] ?? 0) / maxS) * 100),
      }))
      .sort((a, b) => b.sodhya - a.sodhya);

    return { ranked, top3: ranked.slice(0, 3), maxS };
  }, [rasiPinda, grahaPinda, sodhyaPinda]);

  const currentDasa = useMemo(() => {
    if (!out?.dasha) return { lord: "UNKNOWN", subLord: "UNKNOWN", points: 0, subPoints: 0, prediction: "" };

    const now = new Date();
    const d = out.dasha.find((item: any) => new Date(item.startISO) <= now && now < new Date(item.endISO));
    if (!d) return { lord: "UNKNOWN", subLord: "UNKNOWN", points: 0, subPoints: 0, prediction: "" };

    const lord = String(d.lord || "UNKNOWN").toUpperCase();
    const dashaStart = new Date(d.startISO).getTime();
    const dashaEnd = new Date(d.endISO).getTime();
    const totalDuration = dashaEnd - dashaStart;

    const vOrder = ["SUN","MOON","MARS","RAHU","JUPITER","SATURN","MERCURY","KETU","VENUS"];
    const vYears = [6,10,7,18,16,19,17,7,20];

    let currentIndex = vOrder.indexOf(lord);
    let accumulatedTime = dashaStart;
    let subLord = "UNKNOWN";

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

    const getPts = (l: string) => {
      const sIdx = pSigns[l] ?? 0;
      const key = (l === "RAHU") ? "SATURN" : (l === "KETU") ? "MARS" : l;
      return avTable[key]?.[sIdx] ?? 0;
    };

    const pts = getPts(lord);
    const sPts = getPts(subLord);

    let mainStatus = pts >= 5 ? "empowered" : pts >= 4 ? "stable" : "foundational";
    let pred = `The ${lord} main cycle sets a ${mainStatus} tone for your life. `;

    if (lord === subLord) pred += `As you are in the opening phase (${subLord} sub-period), focus on setting long-term seeds for this ${lord} era.`;
    else if (sPts > pts) pred += `The current sub-period of ${subLord} is stronger than the main cycle, acting as a 'Growth Engine' to help you overcome ${lord}'s limitations.`;
    else if (sPts < pts) pred += `While ${lord} provides the broad direction, the current ${subLord} phase suggests a time to slow down and handle finer details.`;
    else pred += `Both ${lord} and ${subLord} are working in harmony, providing a consistent environment.`;

    const totalStrength = pts + sPts;
    if (totalStrength >= 10) pred += " This is a peak window for significant achievements.";
    else if (totalStrength <= 5) pred += " This phase emphasizes inner work and consolidation.";

    return { lord, subLord, points: pts, subPoints: sPts, prediction: pred };
  }, [out, pSigns, avTable]);

  const planetTraits: Record<string, string> = {
    SUN: "visibility, authority, confidence",
    MOON: "mind, emotions, adaptability",
    MARS: "drive, courage, initiative",
    MERCURY: "learning, analysis, speech",
    JUPITER: "wisdom, protection, growth",
    VENUS: "relationships, comforts, harmony",
    SATURN: "discipline, endurance, long-term results",
  };

  const pindaNarrative = useMemo(() => {
  const top = pindaSummary.top3;
  if (!top?.length) return "";

  const [a, b, c] = top;

  let txt =
    `Based on Sodhya Pinda, ${a.key} is the strongest influence (${a.sodhya}, ${a.pct}%), ` +
    `followed by ${b.key} (${b.sodhya}, ${b.pct}%) and ${c.key} (${c.sodhya}, ${c.pct}%). ` +
    `${a.key} supports ${planetTraits[a.key]}. ` +
    `${b.key} supports ${planetTraits[b.key]}. ` +
    `${c.key} supports ${planetTraits[c.key]}. `;

  return txt;
}, [pindaSummary]);

  const houseLabels: any = {
    1:"Vitality/Self", 2:"Wealth/Family", 3:"Effort/Siblings", 4:"Mother/Home",
    5:"Intellect/Children", 6:"Resistance/Debts", 7:"Marriage/Partner", 8:"Obstacles/Longevity",
    9:"Fortune/Father", 10:"Career/Status", 11:"Gains/Dreams", 12:"Expenditure/Spirit"
  };

  // ranked + scaled house strengths (kept SIMPLE + safe)
  const houseStrengthRows = useMemo(() => {
    const houses = [1,2,3,4,5,6,7,8,9,10,11,12];

    const rows = houses.map((n) => {
      const hIdx = (lagnaIdx + n - 1) % 12;
      const pts = savArray[hIdx] ?? 0;
      return { n, pts };
    });

    rows.sort((a, b) => b.pts - a.pts);

    const maxPts = Math.max(...rows.map(r => r.pts), 1);
    const minPts = Math.min(...rows.map(r => r.pts), 0);

    const scaled = rows.map(r => ({
      ...r,
      pct: Math.round(((r.pts - minPts) / (maxPts - minPts || 1)) * 100),
    }));

    return { scaled, maxPts, minPts };
  }, [lagnaIdx, savArray]);

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <div style={{ padding: "20px", border: "2px solid black", fontFamily: "serif", backgroundColor: "#fff", color: "#000" }}>
      <h2 style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
        Ashtakavarga Detailed Analysis
      </h2>

      {/* TABLE */}
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", fontSize: "10px", marginBottom: "18px" }}>
        <thead>
          <tr style={{ backgroundColor: "#eee" }}>
            <th style={{ border: "1px solid #000" }}>Planet</th>
            {Array.from({ length: 12 }).map((_, i) => (
              <th key={i} style={{ border: "1px solid #000" }}>
                H{i + 1}<br />{signs[(lagnaIdx + i) % 12].slice(0, 3)}
              </th>
            ))}
            <th style={{ border: "1px solid #000", backgroundColor: "#fffde7" }}>Total</th>
            <th style={{ border: "1px solid #000", backgroundColor: "#e8f5e9" }}>Rasi</th>
            <th style={{ border: "1px solid #000", backgroundColor: "#e3f2fd" }}>Graha</th>
            <th style={{ border: "1px solid #000", backgroundColor: "#ffebee" }}>Sodhya</th>
            <th style={{ border: "1px solid #000", backgroundColor: "#f3e5f5" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {planets.map(p => {
            const pct = pindaSummary.ranked.find(x => x.key === p.key)?.pct ?? 0;
            return (
              <tr key={p.key}>
                <td style={{ border: "1px solid #000", fontWeight: "bold", textAlign: "left", paddingLeft: "4px" }}>
                  {p.display}
                </td>
                {Array.from({ length: 12 }).map((_, i) => (
                  <td key={i} style={{ border: "1px solid #000" }}>
                    {avTable[p.key]?.[(lagnaIdx + i) % 12] ?? 0}
                  </td>
                ))}
                <td style={{ border: "1px solid #000", fontWeight: "bold", backgroundColor: "#fffde7" }}>
                  {bavTotals[p.key] ?? 0}
                </td>
                <td style={{ border: "1px solid #000", fontWeight: "bold", backgroundColor: "#e8f5e9" }}>
                  {rasiPinda?.[p.key] ?? 0}
                </td>
                <td style={{ border: "1px solid #000", fontWeight: "bold", backgroundColor: "#e3f2fd" }}>
                  {grahaPinda?.[p.key] ?? 0}
                </td>
                <td style={{ border: "1px solid #000", fontWeight: "bold", color: "#b30000", backgroundColor: "#ffebee" }}>
                  {sodhyaPinda?.[p.key] ?? 0}
                </td>
                <td style={{ border: "1px solid #000", fontWeight: "bold", backgroundColor: "#f3e5f5" }}>
                  {pct}%
                </td>
              </tr>
            );
          })}

          <tr style={{ backgroundColor: "#eee", fontWeight: "bold" }}>
            <td style={{ border: "1px solid #000" }}>SAV</td>
            {Array.from({ length: 12 }).map((_, i) => (
              <td key={i} style={{ border: "1px solid #000" }}>
                {savArray[(lagnaIdx + i) % 12] ?? 0}
              </td>
            ))}
            <td colSpan={5} style={{ border: "1px solid #000" }}>
              Total: {savArray.reduce((a: number, b: number) => a + (b ?? 0), 0)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Pinda narrative */}
      <div style={{ padding: "12px", border: "1px solid #000", marginBottom: "14px", background: "#fff" }}>
        <b>Planetary Strength Summary (Sodhya Pinda):</b>
        <div style={{ marginTop: 6, lineHeight: 1.5 }}>
          {pindaNarrative}
        </div>
      </div>

      {/* Dasa */}
      <div style={{ padding: "15px", border: "2px solid #2c3e50", backgroundColor: "#f9fbfd", marginBottom: "15px", borderRadius: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #d1d9e0", paddingBottom: "8px", marginBottom: "10px" }}>
          <b style={{ fontSize: "16px", color: "#1a5a96" }}>
            Main Period: {currentDasa.lord} 
          </b>
          <b style={{ fontSize: "16px", color: "#e67e22" }}>
            Sub-Period: {currentDasa.subLord} 
          </b>
        </div>

        <div style={{ fontSize: "14px", lineHeight: "1.5", color: "#333" }}>
        <strong>Analysis:</strong> {currentDasa.prediction}
        </div>
      </div>

      {/* House strengths (ranked + scaled) */}
      <div style={{ marginBottom: "10px" }}>
        <b>Strength of Houses (Environment Analysis):</b>

        <div style={{ marginTop: 8, fontSize: 12 }}>
          <b>Top houses:</b>{" "}
          {houseStrengthRows.scaled.slice(0, 3).map(r => `H${r.n} (${r.pts})`).join(", ")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginTop: "10px", fontSize: "12px" }}>
          {houseStrengthRows.scaled.map(r => (
            <div key={r.n} style={{ border: "1px solid #000", padding: "6px" }}>
              <b>H{r.n} ({houseLabels[r.n]}):</b> {r.pts} pts &nbsp;|&nbsp; {r.pct}%
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
}