// app/lib/avkPinda.ts
// AVK PINDA CALCULATOR (JHora-style: uses Shodhita Ashtakavarga)
// - Does NOT modify your AVK engine or display shifting.
// - Expects avTable to be indexed Aries(0)..Pisces(11).
// - Computes Trikona + Ekadhipatya shodhana correctly, then pindas.

type Table = Record<string, number[]>; // planet -> 12 numbers (Aries..Pisces)
type PSigns = Record<string, number>;  // planetKey -> signIndex (0..11)

const PLANETS = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN"] as const;

const RASI_MULT = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12]; // Aries..Pisces

const GRAHA_MULT: Record<string, number> = {
  SUN: 5,
  MOON: 5,
  MARS: 8,
  MERCURY: 5,
  JUPITER: 10,
  VENUS: 7,
  SATURN: 5
};

// Trikona groups by sign index (0-based): (Aries,Leo,Sag) etc.
const TRIKONA_GROUPS = [
  [0, 4, 8],
  [1, 5, 9],
  [2, 6, 10],
  [3, 7, 11]
];

// Ekadhipatya sign pairs (0-based sign indexes):
// Mars: Aries(0) & Scorpio(7)
// Venus: Taurus(1) & Libra(6)
// Mercury: Gemini(2) & Virgo(5)
// Jupiter: Sagittarius(8) & Pisces(11)
// Saturn: Capricorn(9) & Aquarius(10)
const EKADHIPATYA_PAIRS: Array<[number, number]> = [
  [0, 7],
  [1, 6],
  [2, 5],
  [8, 11],
  [9, 10]
];

function deepCopyTable(avTable: any): Table {
  const t: Table = {};
  for (const p of PLANETS) {
    const row = avTable?.[p];
    t[p] = Array.isArray(row) ? row.slice(0, 12).map((x: any) => Number(x) || 0) : Array(12).fill(0);
  }
  return t;
}

function trikonaShodhana(t: Table): Table {
  for (const p of PLANETS) {
    for (const g of TRIKONA_GROUPS) {
      const minVal = Math.min(t[p][g[0]], t[p][g[1]], t[p][g[2]]);
      t[p][g[0]] -= minVal;
      t[p][g[1]] -= minVal;
      t[p][g[2]] -= minVal;
    }
  }
  return t;
}

function ekadhipatyaShodhana(t: Table): Table {
  for (const p of PLANETS) {
    for (const [s1, s2] of EKADHIPATYA_PAIRS) {
      const v1 = t[p][s1];
      const v2 = t[p][s2];

      if (v1 > 0 && v2 > 0) {
        if (v1 > v2) {
          t[p][s1] = v1 - v2;
          t[p][s2] = 0;
        } else if (v2 > v1) {
          t[p][s2] = v2 - v1;
          t[p][s1] = 0;
        } else {
          // equal
          t[p][s1] = 0;
          t[p][s2] = 0;
        }
      }
      // if one is 0 => no change
    }
  }
  return t;
}

// app/lib/avkPinda.ts
export function computeAvkPindas(avTable: any, pSigns: any) {
  // Aries..Pisces (index 0..11) — this is what JHora expects
  const rasiMult = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];

  const grahaMult: Record<string, number> = {
    SUN: 5,
    MOON: 5,
    MARS: 8,
    MERCURY: 5,
    JUPITER: 10,
    VENUS: 7,
    SATURN: 5,
  };

  const planets = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN"];

  const rasiPinda: Record<string, number> = {};
  const grahaPinda: Record<string, number> = {};
  const sodhyaPinda: Record<string, number> = {};

  for (const p of planets) {
    const row: number[] = Array.isArray(avTable?.[p]) ? avTable[p] : Array(12).fill(0);

    // Rasi Pinda = Σ (bindus in sign i * rasiMult[i])  — Aries-based
    const rp = row.reduce((sum, v, i) => sum + (Number(v) || 0) * rasiMult[i] / 3, 0);

    // Graha Pinda = Σ (bindus of planet p in the signs occupied by planets) * graha weights
    let gp = 0;
    for (const pl of planets) {
      const signIndex = Number.isFinite(pSigns?.[pl]) ? pSigns[pl] : 0; // 0..11 Aries..Pisces
      const pts = Number(row?.[signIndex] ?? 0);
      gp += pts * (grahaMult[pl] || 0);
    }

    rasiPinda[p] = Math.round(rp);
    grahaPinda[p] = Math.round(gp);
    sodhyaPinda[p] = Math.round(rp + gp);
  }

  return { rasiPinda, grahaPinda, sodhyaPinda };
}