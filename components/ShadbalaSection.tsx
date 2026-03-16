// components/ShadbalaSection.tsx
import React from "react";

// ── Minimum required Shadbala (virupas) ──────────────────────
const REQUIRED: Record<string, number> = {
  Sun: 480, Moon: 360, Mars: 300,
  Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300,
};

// ── Planet significations for interpretation ─────────────────
const SIGNIFICATIONS: Record<string, string> = {
  Sun:     "soul, authority, father, health and vitality",
  Moon:    "mind, emotions, mother, adaptability and peace",
  Mars:    "energy, courage, siblings, property and ambition",
  Mercury: "intelligence, speech, business, learning and communication",
  Jupiter: "wisdom, wealth, children, spirituality and good fortune",
  Venus:   "love, marriage, beauty, comforts and artistic talent",
  Saturn:  "discipline, longevity, career, hard work and endurance",
};

// ── House significations ──────────────────────────────────────
const HOUSE_SIG: Record<number, string> = {
  1:  "Self, body and personality",
  2:  "Wealth, family and speech",
  3:  "Courage, siblings and communication",
  4:  "Home, mother and happiness",
  5:  "Children, intellect and creativity",
  6:  "Health, enemies and service",
  7:  "Marriage, partnerships and travel",
  8:  "Longevity, obstacles and transformation",
  9:  "Fortune, father and spirituality",
  10: "Career, status and authority",
  11: "Gains, friends and aspirations",
  12: "Expenses, liberation and foreign lands",
};

// ── Shared table styles ───────────────────────────────────────
const th: React.CSSProperties = {
  border: "1px solid #ccc", padding: "6px 10px",
  textAlign: "left", background: "#f3f4f6", fontWeight: 700,
};
const td: React.CSSProperties = {
  border: "1px solid #ccc", padding: "6px 10px",
};
const tdRight: React.CSSProperties = { ...td, textAlign: "right" };

// ─────────────────────────────────────────────────────────────
// SHADBALA TABLE + INTERPRETATION
// ─────────────────────────────────────────────────────────────
export default function ShadbalaSection({ data }: { data: any }) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return <div>No Shadbala data available.</div>;
  }

  // ── Build sorted planet rows ──────────────────────────────
  const planets = Object.keys(data).filter(p =>
    ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"].includes(p)
  );

  if (planets.length === 0) return <div>No Shadbala data available.</div>;

  const rows = planets.map(p => {
    const r = data[p] ?? {};
    const total    = Number(r.total    ?? r.SHADBAL  ?? 0);
    const rupas    = Number(r.rupas    ?? r.RUPAS    ?? 0);
    const required = REQUIRED[p] ?? 360;
    return {
      planet: p,
      sthana:     Number(r.sthana     ?? r.STHAN  ?? 0),
      dig:        Number(r.dig        ?? r.DIK    ?? 0),
      kala:       Number(r.kala       ?? r.KALA   ?? 0),
      chesta:     Number(r.chesta     ?? r.CHEST  ?? 0),
      naisargika: Number(r.naisargika ?? r.NYSAR  ?? 0),
      drik:       Number(r.drik       ?? r.DHRIS  ?? 0),
      total, rupas, required,
      strong: total >= required,
    };
  });

  const strongest = [...rows].sort((a, b) => b.total - a.total)[0];
  const weakest   = [...rows].sort((a, b) => a.total - b.total)[0];
  const strongPlanets = rows.filter(r => r.strong);
  const weakPlanets   = rows.filter(r => !r.strong);

  return (
    <div style={{ marginTop: 20 }}>

      <p style={{ fontSize: 15, lineHeight: 1.8, fontFamily: "serif", color: "#4b5563", marginBottom: 16 }}>
        Ashtakavarga measures the environmental support a planet receives from other planets across houses — 
        it shows where a planet is well-placed to deliver results. Shadbala measures a planet's own intrinsic 
        strength — its positional, directional and temporal power independent of external support. 
        The two systems complement each other and may rank planets differently, which is normal and expected.
      </p>

      {/* ── GRAHA BALA TABLE ─────────────────────────────── */}
      <h2 style={{ fontFamily: "serif", color: "#1f2937", marginBottom: 8 }}>
        Shadbala — Planetary Strengths (Virupas)
      </h2>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontSize: 14 }}>
        <thead>
          <tr>
            {["Planet","Sthāna","Dig","Kāla","Cheshtā","Naisargika","Drik","Total","Rupas","Status"].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.planet} style={{ background: r.strong ? "#f0fdf4" : "#fff7f7" }}>
              <td style={{ ...td, fontWeight: 700 }}>{r.planet}</td>
              <td style={tdRight}>{r.sthana.toFixed(1)}</td>
              <td style={tdRight}>{r.dig.toFixed(1)}</td>
              <td style={tdRight}>{r.kala.toFixed(1)}</td>
              <td style={tdRight}>{r.chesta.toFixed(1)}</td>
              <td style={tdRight}>{r.naisargika.toFixed(1)}</td>
              <td style={tdRight}>{r.drik.toFixed(1)}</td>
              <td style={{ ...tdRight, fontWeight: 700 }}>{r.total.toFixed(1)}</td>
              <td style={tdRight}>{r.rupas.toFixed(2)}</td>
              <td style={{
                ...td, fontWeight: 700,
                color: r.strong ? "#15803d" : "#b91c1c",
              }}>
                {r.strong ? "Strong ✓" : "Weak ✗"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
        Green rows = planet meets its minimum required strength (Rupas ≥ 1.00).
        Red rows = planet falls below minimum. Virupas are the classical unit of measurement.
      </div>

      {/* ── INTERPRETATION ───────────────────────────────── */}
      <div style={{
        marginTop: 28,
        padding: "20px 24px",
        background: "#fffdf5",
        borderLeft: "5px solid #7c3aed",
        borderRadius: 6,
      }}>
        <h3 style={{
          fontFamily: "serif", fontSize: 20,
          color: "#3730a3", marginBottom: 14,
        }}>
          Shadbala Strength Analysis
        </h3>

        {/* Summary paragraph */}
        <p style={{ fontSize: 15, lineHeight: 1.8, fontFamily: "serif", color: "#1f2937" }}>
          Among the seven classical planets, <strong>{strongest.planet}</strong> emerges
          as the most powerful force in this chart with a Shadbala total
          of <strong>{strongest.total.toFixed(1)} virupas</strong> (Rupas:{" "}
          <strong>{strongest.rupas.toFixed(2)}</strong>), strongly supporting the areas
          of <em>{SIGNIFICATIONS[strongest.planet]}</em>.{" "}
          {strongPlanets.length > 1 && (
            <>
              {strongPlanets.filter(p => p.planet !== strongest.planet).map(p => p.planet).join(", ")}{" "}
              {strongPlanets.length - 1 === 1 ? "also meets" : "also meet"} the minimum required strength,
              indicating overall good planetary support in this chart.{" "}
            </>
          )}
          {weakPlanets.length > 0 && (
            <>
              <strong>{weakest.planet}</strong> registers the lowest Shadbala
              at <strong>{weakest.total.toFixed(1)} virupas</strong>, falling below
              its required {weakest.required} virupas. This suggests that matters
              related to <em>{SIGNIFICATIONS[weakest.planet]}</em> may require
              conscious effort and attention.
            </>
          )}
        </p>

        {/* Planet-by-planet highlights */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ fontFamily: "serif", color: "#1e40af", marginBottom: 10 }}>
            Planet-by-Planet Highlights
          </h4>

          {rows.map(r => (
            <div key={r.planet} style={{
              marginBottom: 12,
              paddingLeft: 14,
              borderLeft: `3px solid ${r.strong ? "#22c55e" : "#f87171"}`,
            }}>
              <span style={{ fontWeight: 700, fontFamily: "serif" }}>{r.planet}</span>
              {" — "}
              <span style={{ fontSize: 14, color: "#374151", fontFamily: "serif", lineHeight: 1.7 }}>
                {r.strong
                  ? `Strong (${r.total.toFixed(1)} virupas, Rupas ${r.rupas.toFixed(2)}). 
                     ${planetInterpretation(r.planet, r.rupas, true)}`
                  : `Needs attention (${r.total.toFixed(1)} virupas, Rupas ${r.rupas.toFixed(2)} — 
                     below required ${r.required}). 
                     ${planetInterpretation(r.planet, r.rupas, false)}`
                }
              </span>
            </div>
          ))}
        </div>

        {/* Weakest planet advice */}
        {weakPlanets.length > 0 && (
          <div style={{
            marginTop: 20, padding: "14px 18px",
            background: "#fef9c3", borderRadius: 6,
            border: "1px solid #fde047",
          }}>
            <strong style={{ fontFamily: "serif" }}>Remedial Note: </strong>
            <span style={{ fontSize: 14, fontFamily: "serif", lineHeight: 1.7 }}>
              For planets below required strength —{" "}
              {weakPlanets.map(p => p.planet).join(", ")} — classical Vedic
              astrology recommends strengthening through gems, mantras, charity
              and propitiation of the respective planetary deity on the ruling day
              of that planet.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Per-planet interpretation text
// ─────────────────────────────────────────────────────────────
function planetInterpretation(planet: string, rupas: number, strong: boolean): string {
  const level = rupas >= 1.5 ? "exceptionally" : rupas >= 1.2 ? "notably" : "adequately";
  const texts: Record<string, [string, string]> = {
    Sun: [
      `The Sun is ${level} strong, bestowing confidence, natural leadership and robust vitality. 
       Father relationships and authority figures tend to be supportive. Government dealings and 
       positions of power are favoured.`,
      `A weaker Sun may bring self-doubt, health challenges related to heart and eyes, or 
       difficulties with authority. Offering water to the Sun at sunrise and wearing ruby 
       (after consultation) can help strengthen solar energy.`,
    ],
    Moon: [
      `The Moon is ${level} strong, granting a calm and receptive mind, strong intuition and 
       emotional resilience. Relationships with mother and women in general tend to be harmonious. 
       Memory and imagination are well-supported.`,
      `A weaker Moon may lead to mental restlessness, emotional sensitivity or difficulty with 
       sleep. Keeping fasts on Monday and wearing pearl (after consultation) can help 
       stabilise lunar energy.`,
    ],
    Mars: [
      `Mars is ${level} strong, conferring drive, physical stamina and the courage to overcome 
       obstacles. Property matters, younger siblings and competitive endeavours tend to go well. 
       The native possesses good executive ability.`,
      `A weaker Mars may bring lack of initiative, conflicts with siblings or property disputes. 
       Tuesday fasts and coral gemstone (after consultation) are classical remedies.`,
    ],
    Mercury: [
      `Mercury is ${level} strong, sharpening analytical ability, communication skills and 
       business acumen. Learning comes easily and the native can excel in writing, trade 
       or mathematics.`,
      `A weaker Mercury may affect clarity of speech, decision-making or business judgment. 
       Wednesday fasts and emerald (after consultation) are recommended.`,
    ],
    Jupiter: [
      `Jupiter is ${level} strong — a highly auspicious placement. Wisdom, generosity and 
       spiritual merit are highlighted. Children, teachers and religious matters bring 
       blessings. Financial fortune tends to improve over time.`,
      `A weaker Jupiter may delay marriage, childbirth or higher education. Thursday fasts, 
       charity to teachers or temples, and yellow sapphire (after consultation) can 
       strengthen Jupiterian qualities.`,
    ],
    Venus: [
      `Venus is ${level} strong, bringing refinement, aesthetic appreciation and happiness 
       in marriage and partnerships. Material comforts, artistic talent and social charm 
       are well-supported.`,
      `A weaker Venus may bring dissatisfaction in relationships or financial instability. 
       Friday fasts, charity to women and diamond or white sapphire (after consultation) 
       can be helpful.`,
    ],
    Saturn: [
      `Saturn is ${level} strong, conferring perseverance, discipline and the capacity for 
       long-term achievement. The native can handle hard work and responsibility well. 
       Longevity and structural stability are indicated.`,
      `A weaker Saturn may bring delays, chronic health issues or career setbacks. 
       Saturday fasts, service to the elderly or underprivileged, and blue sapphire 
       (after careful consultation only) are classical remedies.`,
    ],
  };
  const pair = texts[planet];
  if (!pair) return "";
  return strong ? pair[0] : pair[1];
}

// ─────────────────────────────────────────────────────────────
// BHAVA BALA SECTION
// ─────────────────────────────────────────────────────────────
export function BhavaBalaSection({ data }: { data: any }) {
  const bb = data ?? {};
  const comps  = bb.components ?? {};
  const totals = bb.totals ?? {};

  const houses = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const hasAny = houses.some(h => typeof totals[h] === "number");
  if (!hasAny) return <div>No Bhava Bala data available.</div>;

  const fmt = (v: any) => Number(v ?? 0).toFixed(1);

  // Find strongest and weakest houses
  const houseNums = houses.map(h => ({ h, total: Number(totals[h] ?? 0) }));
  const strongest = [...houseNums].sort((a, b) => b.total - a.total)[0];
  const weakest   = [...houseNums].sort((a, b) => a.total - b.total)[0];
  const topThree  = [...houseNums].sort((a, b) => b.total - a.total).slice(0, 3);

  return (
    <div style={{ marginTop: 40 }}>

      {/* ── BHAVA BALA TABLE ─────────────────────────────── */}
      <h2 style={{ fontFamily: "serif", color: "#1f2937", marginBottom: 8 }}>
        Bhava Bala — House Strengths (Virupas)
      </h2>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontSize: 14 }}>
        <thead>
          <tr>
            {["House","Signification","Dig Bala","Adhipati Bala","Drishti Bala","Total"].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {houses.map(h => {
            const total = Number(totals[h] ?? 0);
            const isTop = topThree.some(t => t.h === h);
            return (
              <tr key={h} style={{ background: isTop ? "#f0fdf4" : undefined }}>
                <td style={{ ...td, fontWeight: 700 }}>H{h}</td>
                <td style={{ ...td, fontSize: 12, color: "#6b7280" }}>
                  {HOUSE_SIG[Number(h)] ?? ""}
                </td>
                <td style={tdRight}>{fmt((comps?.dig     ?? {})[h])}</td>
                <td style={tdRight}>{fmt((comps?.adhipati ?? {})[h])}</td>
                <td style={tdRight}>{fmt((comps?.drishti  ?? {})[h])}</td>
                <td style={{ ...tdRight, fontWeight: 700 }}>{fmt(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
        Green rows = top three strongest houses. Bhava Bala combines the house lord's strength 
        (Adhipati), directional strength (Dig) and planetary aspect strength (Drishti).
      </div>

      {/* ── BHAVA INTERPRETATION ─────────────────────────── */}
      <div style={{
        marginTop: 28, padding: "20px 24px",
        background: "#f0f9ff",
        borderLeft: "5px solid #0ea5e9",
        borderRadius: 6,
      }}>
        <h3 style={{
          fontFamily: "serif", fontSize: 20,
          color: "#0c4a6e", marginBottom: 14,
        }}>
          House Strength Analysis
        </h3>

        <p style={{ fontSize: 15, lineHeight: 1.8, fontFamily: "serif", color: "#1f2937" }}>
          The <strong>{HOUSE_SIG[Number(strongest.h)]}</strong> (House {strongest.h}) 
          is the strongest area of life in this chart with a Bhava Bala 
          of <strong>{strongest.total.toFixed(1)} virupas</strong>. This house is 
          exceptionally well-supported and its significations — {HOUSE_SIG[Number(strongest.h)]?.toLowerCase()} — 
          tend to flourish throughout life.{" "}
          The <strong>{HOUSE_SIG[Number(weakest.h)]}</strong> (House {weakest.h}) 
          registers the lowest strength at <strong>{weakest.total.toFixed(1)} virupas</strong>,
          suggesting that matters of {HOUSE_SIG[Number(weakest.h)]?.toLowerCase()} 
          may need more conscious cultivation.
        </p>

        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontFamily: "serif", color: "#0369a1", marginBottom: 10 }}>
            Top Three Houses
          </h4>
          {topThree.map(({ h, total }) => (
            <div key={h} style={{
              marginBottom: 10, paddingLeft: 14,
              borderLeft: "3px solid #38bdf8",
            }}>
              <strong style={{ fontFamily: "serif" }}>
                House {h} — {HOUSE_SIG[Number(h)]}
              </strong>
              {" "}
              <span style={{ fontSize: 14, color: "#374151", fontFamily: "serif" }}>
                ({total.toFixed(1)} virupas) — This house is strongly activated, 
                bringing enhanced results in {HOUSE_SIG[Number(h)]?.toLowerCase()}.
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STRENGTH INTERPRETATION (summary block for page.tsx)
// ─────────────────────────────────────────────────────────────
export function StrengthInterpretation({
  shadData, bhavaData,
}: {
  shadData: any; bhavaData: any;
}) {
  if (!shadData || typeof shadData !== "object" || Object.keys(shadData).length === 0) return null;
  if (!bhavaData || typeof bhavaData !== "object") return null;

  const totals = bhavaData?.totals ?? {};
  const planets = Object.keys(shadData).filter(p => REQUIRED[p]);

  const strongestPlanet = [...planets]
    .map(p => ({ planet: p, total: Number(shadData[p]?.total ?? 0) }))
    .sort((a, b) => b.total - a.total)[0];

  const strongestHouse = Object.keys(totals)
    .map(h => ({ house: h, total: Number(totals[h] ?? 0) }))
    .sort((a, b) => b.total - a.total)[0];

  if (!strongestPlanet || !strongestHouse) return null;

  return (
    <div style={{
      marginTop: 30,
      borderLeft: "5px solid #1e40af",
      padding: "15px 20px",
      background: "#eff6ff",
      borderRadius: 6,
    }}>
      <h3 style={{ fontFamily: "serif", color: "#1e40af" }}>
        Overall Strength Summary
      </h3>
      <p style={{ fontSize: 15, lineHeight: 1.8, fontFamily: "serif" }}>
        <strong>{strongestPlanet.planet}</strong> is the dominant planetary force 
        (Shadbala: <strong>{strongestPlanet.total.toFixed(1)}</strong>), 
        supporting {SIGNIFICATIONS[strongestPlanet.planet]}.{" "}
        <strong>House {strongestHouse.house}</strong> — {HOUSE_SIG[Number(strongestHouse.house)]} — 
        is the strongest area of life (Bhava Bala: <strong>{strongestHouse.total.toFixed(1)}</strong>).
      </p>
    </div>
  );
}
