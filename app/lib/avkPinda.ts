// app/lib/avkPinda.ts
// AVK PINDA CALCULATOR (JHora-style Shodhana + Pindas)
// - Does Trikona Shodhana
// - Does Ekadhipatya Shodhana using occupancy rule (JHora-like practical rule)
// - Then computes Rasi/Graha/Sodhya Pinda using standard multipliers

type AvTable = Record<string, number[]>; // planetKey -> 12-length array (Aries..Pisces)
type PSigns = Record<string, number>;    // planetKey -> sign index 0..11 (Aries..Pisces)

const PLANETS_7 = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"] as const;

// Aries..Pisces multipliers (standard)
const RASI_MULT = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];

// Planet multipliers (standard)
const GRAHA_MULT: Record<string, number> = {
  SUN: 5,
  MOON: 5,
  MARS: 8,
  MERCURY: 5,
  JUPITER: 10,
  VENUS: 7,
  SATURN: 5,
};

// Signs owned by dual-lord planets (Aries index 0..11)
const OWNED_SIGNS: Record<string, [number, number]> = {
  MARS: [0, 7],      // Aries, Scorpio
  VENUS: [1, 6],     // Taurus, Libra
  MERCURY: [2, 5],   // Gemini, Virgo
  JUPITER: [8, 11],  // Sagittarius, Pisces
  SATURN: [9, 10],   // Capricorn, Aquarius
};

function cloneTable(avTable: AvTable): AvTable {
  const out: AvTable = {};
  for (const k of Object.keys(avTable)) out[k] = (avTable[k] ?? []).slice(0, 12);
  return out;
}

// Trikona Shodhana: for each (Aries,Leo,Sag) etc subtract the minimum from the three
function applyTrikonaShodhana(t: AvTable) {
  const triGroups = [
    [0, 4, 8],
    [1, 5, 9],
    [2, 6, 10],
    [3, 7, 11],
  ];

  for (const p of Object.keys(t)) {
    const row = t[p];
    if (!row || row.length < 12) continue;

    for (const g of triGroups) {
      const m = Math.min(row[g[0]], row[g[1]], row[g[2]]);
      row[g[0]] -= m;
      row[g[1]] -= m;
      row[g[2]] -= m;
    }
  }
}

// Ekadhipatya Shodhana (JHora-like practical rule):
// For dual-lord planets:
// - If both signs have bindus (>0):
//   * If both signs occupied -> no reduction
//   * If one occupied -> empty sign becomes 0 (keep occupied as-is)
//   * If neither occupied -> subtract min from both (so one becomes 0)
function applyEkadhipatyaShodhana(t: AvTable, occupiedSigns: Set<number>) {
  for (const p of Object.keys(OWNED_SIGNS)) {
    const row = t[p];
    if (!row || row.length < 12) continue;

    const [s1, s2] = OWNED_SIGNS[p];
    const v1 = row[s1] ?? 0;
    const v2 = row[s2] ?? 0;

    if (v1 <= 0 || v2 <= 0) continue;

    const occ1 = occupiedSigns.has(s1);
    const occ2 = occupiedSigns.has(s2);

    if (occ1 && occ2) {
      // no reduction
      continue;
    } else if (occ1 && !occ2) {
      row[s2] = 0;
    } else if (!occ1 && occ2) {
      row[s1] = 0;
    } else {
      // both empty: subtract min from both
      const m = Math.min(v1, v2);
      row[s1] = v1 - m;
      row[s2] = v2 - m;
    }
  }
}

// Compute pindas from a shodita table
function computePindasFromTable(t: AvTable, pSigns: PSigns) {
  const rasiPinda: Record<string, number> = {};
  const grahaPinda: Record<string, number> = {};
  const sodhyaPinda: Record<string, number> = {};

  for (const p of PLANETS_7) {
    const row = t[p] ?? Array(12).fill(0);

    // Rasi Pinda = sum over Aries..Pisces of (bindu * rasiMultiplier)
    const rp = row.reduce((sum, v, i) => sum + (v || 0) * (RASI_MULT[i] || 0), 0);

    // Graha Pinda = sum over planets X of (bindu of P in sign occupied by X) * grahaMultiplier(X)
    let gp = 0;
    for (const pl of PLANETS_7) {
      const sIdx = pSigns[pl] ?? 0;
      const pts = row[sIdx] ?? 0;
      gp += pts * (GRAHA_MULT[pl] || 0);
    }

    rasiPinda[p] = Math.round(rp);
    grahaPinda[p] = Math.round(gp);
    sodhyaPinda[p] = Math.round(rp + gp);
  }

  return { rasiPinda, grahaPinda, sodhyaPinda };
}

// MAIN EXPORT
// Pass Aries-based AV table (avTable) + Aries-based planet sign indices (pSigns)
export function computeAvkPindas(avTable: AvTable, pSigns: PSigns) {
  // occupied signs set (use 7 planets + nodes if you want; we keep to 7 for JHora-like pindas)
  const occupied = new Set<number>();
  for (const p of PLANETS_7) occupied.add(pSigns[p] ?? 0);

  // shodhana on a clone
  const t = cloneTable(avTable);
  applyTrikonaShodhana(t);
  applyEkadhipatyaShodhana(t, occupied);

  // compute pindas
  return computePindasFromTable(t, pSigns);
}