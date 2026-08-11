// app/lib/shadbala-logic.ts

// 1. CONSTANTS
export const MEAN_SPEEDS_VALUES: Record<string, number> = {
  SURY: 0.9856, CHAN: 13.1764, KUJA: 0.524, BUDH: 1.607,
  GURU: 0.0831, SUKR: 1.174, SANI: 0.0335
};

const EXALTATION_SIGN: Record<string, number> = {
  SURY: 1, CHAN: 2, KUJA: 10, BUDH: 6, GURU: 4, SUKR: 12, SANI: 7
};

const SIGN_LORD: Record<number, string> = {
  1: "KUJA", 2: "SUKR", 3: "BUDH", 4: "CHAN", 5: "SURY", 6: "BUDH",
  7: "SUKR", 8: "KUJA", 9: "GURU", 10: "SANI", 11: "SANI", 12: "GURU"
};

// 2. HELPERS
export function getVargaSign(degree: number, varga: number): number {
  const totalMinutes = degree * 60;
  const vargaMinutes = (30 * 60) / varga;
  const segment = Math.floor((totalMinutes % (30 * 60)) / vargaMinutes);
  const startSign = Math.floor(degree / 30);
  return ((startSign + segment) % 12) + 1;
}

// 3. CORE BALA FUNCTIONS
export function calculateSthanaBala(
  planetDegrees: Record<string, number>,
  planetHouses: Record<string, number>
) {
  const result: Record<string, number> = {};

  const PLANETS = ["SURY", "CHAN", "KUJA", "BUDH", "GURU", "SUKR", "SANI"];

  for (const pKey of PLANETS) {
    const deg = planetDegrees[pKey] ?? 0;

    // Uchcha bala (simple distance-to-exaltation model)
    const exaltSign = EXALTATION_SIGN[pKey];
    const exaltDeg = (exaltSign - 1) * 30 + 15;
    let dist = Math.abs(deg - exaltDeg);
    if (dist > 180) dist = 360 - dist;
    const uchchaBala = (180 - dist) / 3;

    // Saptavargaja (your existing approximation)
    let vargaBala = 0;
    for (const v of [1, 2, 3, 7, 9, 12, 30]) {
      const vSign = getVargaSign(deg, v);
      vargaBala += SIGN_LORD[vSign] === pKey ? 30 : 15;
    }

    // Kendradi bala based on precomputed house number (1..12)
    const house = Number(planetHouses?.[pKey] ?? 1);
    const kendraBala =
      [1, 4, 7, 10].includes(house) ? 60 :
      [2, 5, 8, 11].includes(house) ? 30 :
      15;

    result[pKey] = uchchaBala + (vargaBala / 7) + kendraBala;
  }

  return result;
}
export function calculateDigBala(planetDegrees: Record<string, number>, ascendantDeg: number) {
  const result: Record<string, number> = {};
  const DIG_POINTS: any = { SURY: 10, KUJA: 10, CHAN: 4, SUKR: 4, GURU: 1, BUDH: 1, SANI: 7 };
  Object.keys(DIG_POINTS).forEach(p => {
    const peak = ((DIG_POINTS[p] - 1) * 30 + ascendantDeg) % 360;
    let diff = Math.abs((planetDegrees[p] || 0) - peak);
    if (diff > 180) diff = 360 - diff;
    result[p] = 60 * (1 - (diff / 180));
  });
  return result;
}

export function computeKaalaBala(ctx: any, planetDegrees: Record<string, number>) {
  const result: Record<string, number> = {};

  const toLocalHours = (iso?: string | null) => {
    if (!iso) return NaN;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return NaN;
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  };

  const keys = ["SURY", "CHAN", "KUJA", "BUDH", "GURU", "SUKR", "SANI"];

  // base (keep whatever you already had conceptually, but structurally safe)
  for (const p of keys) {
    result[p] = 0;
  }

  // Vara + Hora lords (time-lord part)
  const idxToKey = ["SURY", "CHAN", "KUJA", "BUDH", "GURU", "SUKR", "SANI"];

  const jd = Number(ctx?.jd_ut);
  if (Number.isFinite(jd)) {
    const w = (Math.floor(jd + 1.5) % 7 + 7) % 7; // 0=Sun..6=Sat
    const varaLord = idxToKey[w] ?? "SURY";
    result[varaLord] = (result[varaLord] ?? 0) + 30;
  }

  const lmt = Number(ctx?.localTimeHours);
  const rise = toLocalHours(ctx?.sunriseISO);

  if (Number.isFinite(lmt) && Number.isFinite(rise)) {
    let hoursFromRise = lmt - rise;
    if (hoursFromRise < 0) hoursFromRise += 24;

    const horaIndex = Math.floor(hoursFromRise) % 24;

    const horaSeq = ["SANI", "GURU", "KUJA", "SURY", "SUKR", "BUDH", "CHAN"];

    let startLord = "SURY";
    if (Number.isFinite(jd)) {
      const w = (Math.floor(jd + 1.5) % 7 + 7) % 7;
      startLord = idxToKey[w] ?? "SURY";
    }

    const startIdx = horaSeq.indexOf(startLord);
    const lord = horaSeq[(startIdx < 0 ? 0 : startIdx) + (horaIndex % 7) % 7];

    result[lord] = (result[lord] ?? 0) + 60;
  }

  return result;
}
export function calculateChestaBala(speeds: Record<string, number>) {
  const result: Record<string, number> = {};
  ["SURY", "CHAN", "KUJA", "BUDH", "GURU", "SUKR", "SANI"].forEach(p => {
    const s = speeds[p] || 0;
    if (p === "SURY" || p === "CHAN") { result[p] = 30; return; }
    if (s < 0) result[p] = 55 + Math.min(5, Math.abs(s) * 10);
    else result[p] = Math.max(0, 30 - ((s / (MEAN_SPEEDS_VALUES[p] || 1)) * 10));
  });
  return result;
}

export function calculateDrikBala(planetDegrees: Record<string, number>) {
  const result: Record<string, number> = {};
  ["SURY", "CHAN", "KUJA", "BUDH", "GURU", "SUKR", "SANI"].forEach(p1 => {
    let aspect = 0;
    ["SURY", "CHAN", "KUJA", "BUDH", "GURU", "SUKR", "SANI"].forEach(p2 => {
      if (p1 === p2) return;
      let diff = (planetDegrees[p1] - planetDegrees[p2] + 360) % 360;
      if (Math.abs(diff - 180) < 10) aspect += 15;
    });
    result[p1] = aspect;
  });
  return result;
}

export function calculateNaisargikaBala() {
  return { SURY: 60, CHAN: 51.43, KUJA: 17.14, BUDH: 25.71, GURU: 34.29, SUKR: 42.86, SANI: 8.57 };
}

function isoToLocalHours(iso?: string | null): number {
  if (!iso) return NaN;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NaN;
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function getLmtHoursFromCtx(ctx: any): number {
  const t = ctx?.timeStr ?? ctx?.time ?? null;
  if (typeof t === "string") {
    const m = t.match(/(\d{1,2}):(\d{2})/);
    if (m) return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
  }
  return Number(ctx?.localTimeHours ?? NaN);
}

// returns 0..1 style weights per planet (Sun..Sat), then we scale
function kalabalaCoreFortranLike(ctx: any): Record<string, number> {
  // order: SURY CHAN KUJA BUDH GURU SUKR SANI
  const out = Array(7).fill(0);

  const LMT = getLmtHoursFromCtx(ctx);
  const SRISE = isoToLocalHours(ctx?.sunriseISO ?? null);
  const SSET  = isoToLocalHours(ctx?.sunsetISO ?? null);

  // NATHONNATHA weights (Fortran IV): [1,2,2,2,1,1,2]
  const IV = [1, 2, 2, 2, 1, 1, 2];

  let x = LMT;
  if (Number.isFinite(x)) {
    if (x > 12) x = 24 - x;
    const A1 = x / 12.0;      // 0..1
    const A2 = 1.0 - A1;      // 0..1
    for (let i = 0; i < 7; i++) out[i] = (IV[i] === 1 ? A1 : A2);
    out[3] = 1.0; // Mercury forced 1.0 in the Fortran
  }

  // THRIBAGHA BALA (adds +1 to one planet and +1 to Venus in the Fortran)
  if (
    Number.isFinite(LMT) &&
    Number.isFinite(SRISE) &&
    Number.isFinite(SSET) &&
    SRISE > 0 &&
    SSET > 0
  ) {
    let Y = LMT;
    if (LMT < SRISE) Y = Y + 24;

    let seg = (SSET - SRISE) / 3.0;
    let ITHRI = Math.floor((LMT - SRISE) / (seg || 1) + 1.0);

    if (Y > SSET) {
      seg = 8.0 - seg;
      ITHRI = Math.floor((Y - SSET) / (seg || 1) + 4.0);
    }

    const ITH = [4, 1, 7, 2, 6, 3]; // Fortran mapping 1..6
    const idx = Math.max(1, Math.min(6, ITHRI)) - 1;
    const K = (ITH[idx] ?? 1) - 1;

    out[K] = (out[K] ?? 0) + 1.0;
    out[5] = (out[5] ?? 0) + 1.0; // Venus +1
  }

  const keys = ["SURY", "CHAN", "KUJA", "BUDH", "GURU", "SUKR", "SANI"];
  const res: Record<string, number> = {};
  for (let i = 0; i < 7; i++) res[keys[i]] = Number(out[i] ?? 0);
  return res;
}





// 4. MASTER EXPORT
export function computeShadbala(ctx: any) {
  const planetDegrees: Record<string, number> = {};
  const speeds: Record<string, number> = {};
  Object.keys(ctx.planets || {}).forEach(key => {
    planetDegrees[key] = ctx.planets[key].lon;
    speeds[key] = ctx.planets[key].speed;
  });
  const sthana = calculateSthanaBala(planetDegrees, ctx.houses ?? {});
  const ascLog = Number(ctx.ascLongitude ?? ctx.ascendant ?? 0);

  const dig = calculateDigBala(planetDegrees, ascLog);
  const kaala = computeKaalaBala(ctx, planetDegrees);
  const chesta = calculateChestaBala(speeds);
  const naisargika = calculateNaisargikaBala();
  const drik = calculateDrikBala(planetDegrees);

  const finalReport: Record<string, any> = {};
  ["SURY", "CHAN", "KUJA", "BUDH", "GURU", "SUKR", "SANI"].forEach(p => {
    finalReport[p] = {
      sthana: sthana[p],
      dig: dig[p],
      kala: kaala[p],
      chesta: chesta[p],
      naisargika: naisargika[p],
      drik: drik[p],
      total: sthana[p] + dig[p] + kaala[p] + chesta[p] + naisargika[p] + drik[p]
    };
  });
  return finalReport;
}

// 5. COMPATIBILITY STUBS
export const computeAllBalaComponents = (ctx: any) => computeShadbala(ctx);
export const calculateNatonnataBala = (isDay: boolean) => ({}); 
export const calculatePakshaBala = (sun: number, moon: number) => ({});
export const calculateTribhagaBala = (isDay: boolean, idx: number) => ({});
export const calculateYearMonthWeekHourBala = () => ({});
export const calculateAyanaBala = () => ({});