// app/lib/shadbala-logic.ts
// Ported (structure + constants) from your Fortran: CHESHTA, AYANABALA, KALABALA, SHADBL, VARGA
// This version is designed to accept your existing `out` object (from /api/chart) without touching page.tsx.

export {};


type OutAny = any;

const ratnl = (x: number) => {
  let y = x % 360;
  if (y < 0) y += 360;
  return y;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const toNum = (v: any) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

const degDiff180 = (a: number, b: number) => {
  let x = Math.abs(ratnl(a) - ratnl(b));
  if (x > 180) x = 360 - x;
  return x;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

// ---------- Extractors (robust; no page.tsx changes) ----------
function getPlanetLon(out: OutAny, name: string): number {
  // Common shapes: out.positions {SUN: {lon}}, out.planets.Sun, out.Sun, etc.
  const keyU = name.toUpperCase();
  const v =
    out?.positions?.[keyU] ??
    out?.planets?.[name] ??
    out?.planets?.[keyU] ??
    out?.[name] ??
    out?.[keyU] ??
    null;

  if (typeof v === "number") return ratnl(v);
  if (v && typeof v.lon === "number") return ratnl(v.lon);
  if (v && typeof v.longitude === "number") return ratnl(v.longitude);
  if (v && typeof v.LONG === "number") return ratnl(v.LONG);

  // If positions array like [{name:"Sun", lon:..}]
  if (Array.isArray(out?.positions)) {
    const hit = out.positions.find((p: any) => (p?.name || p?.planet || "").toLowerCase() === name.toLowerCase());
    if (hit && typeof hit.lon === "number") return ratnl(hit.lon);
    if (hit && typeof hit.longitude === "number") return ratnl(hit.longitude);
  }

  return 0;
}

function getPlanetDecl(out: OutAny, name: string): number {
  const keyU = name.toUpperCase();
  const v =
    out?.positions?.[keyU] ??
    out?.planets?.[name] ??
    out?.planets?.[keyU] ??
    out?.[name] ??
    out?.[keyU] ??
    null;

  if (v && typeof v.decl === "number") return v.decl;
  if (v && typeof v.declination === "number") return v.declination;
  if (v && typeof v.dec === "number") return v.dec;
  return 0;
}


function getPlanetSpeed(out: any, name: string): number {
  const keyU = name.toUpperCase();                         // "SUN"
  const keyC = name.charAt(0) + name.slice(1).toLowerCase(); // "Sun"
  const key2 = keyC.slice(0, 2);                            // "Su"

  // A) First: look in out.speeds (this is where your API actually stores it)
  const speedsObj = out?.speeds ?? out?.speed ?? null;
  if (speedsObj && typeof speedsObj === "object") {
    const raw =
      speedsObj[keyU] ??   // "SUN" (if present)
      speedsObj[keyC] ??   // "Sun" (if present)
      speedsObj[key2] ??   // "Su"  ✅ (your current API)
      speedsObj[name] ??   // original string
      0;

    const n = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (Number.isFinite(n)) return n;
  }

  // B) Next: if speed is embedded inside out.positions[planet]
  const p =
    out?.positions?.[keyU] ??
    out?.positions?.[keyC] ??
    out?.positions?.[name] ??
    null;

  if (p) {
    const raw = p.speed ?? p.lonSpeed ?? p.dlon ?? p.motionSpeed ?? 0;
    const n = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (Number.isFinite(n)) return n;
  }

  // C) If positions is an array [{name:"Sun", speed:...}]
  if (Array.isArray(out?.positions)) {
    const hit = out.positions.find(
      (x: any) => (x?.name || x?.planet || "").toLowerCase() === keyC.toLowerCase()
    );
    if (hit) {
      const raw = hit.speed ?? hit.lonSpeed ?? hit.dlon ?? hit.motionSpeed ?? 0;
      const n = typeof raw === "number" ? raw : parseFloat(String(raw));
      if (Number.isFinite(n)) return n;
    }
  }

  return 0;
}




function getBhavmd12(out: OutAny): number[] {
  // We try a few common shapes. If you already compute house midpoints/cusps, one of these will work.
  const cand =
    out?.bhavmd ??
    out?.houseMidpoints ??
    out?.housesMid ??
    out?.houses?.midpoints ??
    out?.houses?.bhavmd ??
    out?.houseCusps ??
    out?.houses?.cusps ??
    out?.cusps ??
    null;

  if (Array.isArray(cand) && cand.length >= 12) return cand.slice(0, 12).map((x: any) => ratnl(toNum(x)));

  // If object {1: deg, 2: deg, ...}
  if (cand && typeof cand === "object") {
    const arr = [];
    for (let i = 1; i <= 12; i++) arr.push(ratnl(toNum(cand[i] ?? cand[String(i)])));
    if (arr.some((x) => x !== 0)) return arr;
  }

  return Array(12).fill(0);
}

function getAyan(out: OutAny): number {
  return toNum(out?.ayanamsa ?? out?.ay ?? out?.AY ?? out?.siderealOffset ?? 0);
}

// Time pieces for KALABALA (we do best-effort)
function getDateParts(out: OutAny): { y: number; m: number; d: number } {
  // out may carry dateStr like YYYY-MM-DD
  const s = out?.dateStr ?? out?.date ?? out?.input?.date ?? null;
  if (typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [Y, M, D] = s.slice(0, 10).split("-").map((x) => parseInt(x, 10));
    return { y: Y, m: M, d: D };
  }
  // fall back to today-like safe defaults
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

function getLmtHours(out: OutAny): number {
  // LMT in Fortran means local clock time (hours)
  // Try out.timeStr "HH:MM" or input
  const t = out?.timeStr ?? out?.time ?? out?.input?.time ?? null;
  if (typeof t === "string") {
    const m = t.match(/(\d{1,2}):(\d{2})/);
    if (m) return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
  }
  // fallback from out.localTimeHours if exists
  return toNum(out?.localTimeHours ?? 0);
}

function isoToLocalHours(iso: string | null | undefined): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

// ---------- Fortran tables/constants ----------
const NEECHA = [190, 213, 118, 345, 275, 177, 20]; // Sun..Sat
const RASIOWN = [3, 6, 4, 2, 1, 4, 6, 3, 5, 7, 7, 5]; // 1..12
const USUAL = [1.0, 0.857, 0.286, 0.429, 0.571, 0.714, 0.143]; // naisargika
const BIMB = [9.4, 6.6, 190.4, 16.6, 158.0]; // Mars..Sat (For Yuddha)
const ISP = [
  [4, 8],
  [5, 9],
  [3, 10],
]; // (2,3) Fortran -> for Mars/Jup/Sat special signs
const STNO = [5.0, 6.0, 5.0, 7.0, 6.5, 5.5, 5.0];
const IBAV = [
  4, 4, 4, 4, 7, 7, 10, 10, 4, 4, 7, 7, 7, 7, 1, 1, 7, 4, 4, 10, 7, 7, 10, 10,
];
const DR = [1, 1, 1, 4, 4, 1, 1];
const ID = [4, 10, 4, 7, 7, 10, 1];

// SEE table 12x2 (from your Fortran DATA SEE)
const SEE: number[][] = [
  [0.0, 15.0],
  [0.5, 45.0],
  [1.0, 30.0],
  [-0.5, 0.0],
  [-1.0, 60.0],
  [2.0, 45.0],
  [-0.5, 30.0],
  [-0.5, 15.0],
  [-0.5, 0.0],
  [-0.5, 0.0],
  [0.0, 0.0],
  [0.0, 0.0],
];

// ---------- VARGA port (produces STHAN[7]) ----------
// Direct port of Fortran SUBROUTINE VARGA -> computes STHAN (rupas)
function vargaSTHAN(
  LONG: number[],   // [0..6] Sun..Sat longitudes (deg 0..360)
  RASI: number[],   // [0..6] sign 1..12
  NAVA: number[],   // [0..6] navamsa sign 1..12
  LAGNA_RASI: number // lagna sign 1..12
): number[] {

  // 1-based tables (same values as Fortran)
  const IH = [0, 1, 3, 5, 2, 4, 6, 7]; // IH(1..7) -> note index 0 unused

  const ITR: Array<[number, number]> = [
    [5, 1], [10, 4], [18, 7], [25, 2], [30, 6]
  ]; // (limit, signIndex)

  const ISAP = [0, 1, 2, 4, 8, 12, 16]; // ISAP(1..6) in Fortran; index 0 unused
  const SQR = [0, 60, 30, 15];           // SQR(1..3); index 0 unused

  // MITHRA(7x7) from Fortran DATA
  // Row = friend/relationship owner planet K, Col = planet i
  const MITHRA: number[][] = [
    [0,0,0,0,0,0,0,0], // dummy row 0
    [0, 0, 1, 2, 1, 2, 2, 2], // 1
    [0, 1, 0, 1, 0, 2, 2, 1], // 2
    [0, 1, 1, 0, 1, 1, 0, 2], // 3
    [0, 1, 1, 2, 0, 2, 2, 1], // 4
    [0, 2, 2, 1, 2, 0, 1, 1], // 5
    [0, 2, 2, 2, 2, 1, 0, 0], // 6
    [0, 1, 2, 0, 0, 1, 0, 0], // 7
  ];

  // ODD(7), MULTRIGON(7), SEX(7) from Fortran DATA
  const ODD = [0, 0, 1, 0, 0, 0, 1, 0]; // index 1..7
  const MULTRIGON = [0, 5, 2, 1, 6, 9, 12, 11]; // index 1..7
  const SEX = [0, 1, 2, 3, 4, 5, 6, 7]; // index 1..7 (as in Fortran)

  // RASIOWN(1..12) must already exist in your file; it maps sign -> planet index 1..7
  // We will use it directly.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;

  // VARGAS(I,J) for I=1..10, J=1..8 (we only need I=1..7 + lagna)
  const VARGAS: number[][] = Array.from({ length: 11 }, () => Array(9).fill(0)); // [0..10][0..8]

  const mod1 = (a: number, m: number) => {
    const r = a % m;
    return r < 0 ? r + m : r;
  };

  // Build VARGAS for planets 1..7
  for (let I = 1; I <= 7; I++) {
    const deg = LONG[I - 1] || 0;
    const sign = RASI[I - 1] || 1;
    const nav = NAVA[I - 1] || 1;

    const D30 = deg / 30.0;
    const DD = deg / 3.0;
    const J = sign;

    // VARGAS(I,1) = rasi
    VARGAS[I][1] = J;

    // VARGAS(I,2) = hora
    const K = mod1(Math.floor(DD) * 2, 4) + 1; // 1..4
    VARGAS[I][2] = IH[K];

    // VARGAS(I,3) = drekkana
    const JM3 = J + Math.floor(DD / 10.0) * 4 - 1;
    VARGAS[I][3] = mod1(JM3, 12) + 1;

    // VARGAS(I,4) = saptamsa
    const JM4 = Math.floor(D30 * 7.0);
    VARGAS[I][4] = mod1(JM4 + J - 1, 12) + 1;

    // VARGAS(I,5) = navamsa (given)
    VARGAS[I][5] = nav;

    // VARGAS(I,6) = dwadasamsa
    const JM6 = Math.floor(D30 * 12.0);
    VARGAS[I][6] = mod1(JM6 + J - 1, 12) + 1;

    // VARGAS(I,7) = trimshamsa
    const X = deg - Math.floor(deg / 60.0) * 60.0; // same as Fortran
    let KK = 1;
    for (let k = 1; k <= 5; k++) {
      if (X <= ITR[k - 1][0]) { KK = k; break; }
    }
    VARGAS[I][7] = ITR[KK - 1][1];

    // VARGAS(I,8) = d30-like
    let NF = Math.floor(DD) + J;
    if (mod1(J, 2) === 0) NF = NF + 8;
    VARGAS[I][8] = mod1(NF - 1, 12) + 1;
  }

  // Put Lagna rasi into VARGAS(10,1) (Fortran uses VARGAS(10,1))
  VARGAS[10][1] = LAGNA_RASI || 1;

  const STHAN = Array(7).fill(0);

  // Main STHAN loop (I=1..7)
  for (let I = 1; I <= 7; I++) {
    const RASIA = VARGAS[I][1];

    // J=1..7 in Fortran
    for (let J = 1; J <= 7; J++) {
      let K = VARGAS[I][J];

      if (J !== 2 && J !== 7) {
        // owner of sign
        // @ts-ignore: RASIOWN is defined elsewhere in this module
        K = (RASIOWN[K - 1] as number) || 1;
      }

      const RASK = VARGAS[K][1];

      let L = Math.abs(RASIA - RASK) + 1;
      if (L > 7) L = 14 - L;

      let LL = -1;
      if (L >= 2 && L <= 4) LL = 1;

      const I1 = (MITHRA[K][I] ?? 0) + LL + 3; // 1..6
      const SP = (ISAP[I1] ?? 0) / 32.0;

      if (J === 1 && RASIA === (MULTRIGON[I] ?? -999)) {
        STHAN[I - 1] += 0.75;
      } else {
        STHAN[I - 1] += SP;
      }
    }

    // X (odd/even parity term)
    const JJ = RASIA + (ODD[I] ?? 0);
    const KK = VARGAS[I][5] + (ODD[I] ?? 0);
    const X = (mod1(JJ, 2) + mod1(KK, 2)) / 4.0;

    // Y (from lagna relationship)
    let J2 = RASIA - (VARGAS[10][1] || 1);
    if (J2 < 0) J2 = J2 + 12;
    const K2 = mod1(J2, 3) + 1; // 1..3
    const Y = (SQR[K2] ?? 0) / 60.0;

    // Z (special 0.25 if “sex” match)
    const part = Math.floor((LONG[I - 1] - (RASIA - 1) * 30.0) / 10.0) + 1; // 1..3
    const Z = (part === (SEX[I] ?? -999)) ? 0.25 : 0.0;

    STHAN[I - 1] += X + Y + Z;
  }

  return STHAN;
}


// ---------- CHESHTA port (Virupas scale: 0..60) ----------
function cheshtaFromFortran(CHEST_IN: number[], sunLon: number, moonLon: number, AY: number): number[] {
  const CHEST = CHEST_IN.slice(0, 7);

  // as in Fortran
  CHEST[0] = sunLon + 90.0 + AY;
  CHEST[1] = moonLon - sunLon;

  for (let i = 0; i < 7; i++) {
    let x = ratnl(CHEST[i]);
    if (x > 180) x = 360 - x;

    // Fortran produces 0..1 by dividing by 180
    // Convert to classical virupas (0..60) so it matches Shadbala table scale
    CHEST[i] = (x / 180.0); // 0..1 like Fortran

  }

  return CHEST;
}


// ---------- AYANABALA port ----------
function ayanabalaFromFortran(DECL: number[]): number[] {
  const AYAN = Array(7).fill(0);
  for (let i = 0; i < 7; i++) {
    let x = DECL[i];
    const I = i + 1; // Fortran index
    if (I === 2 || I === 7) x = -x;
    if (I === 4) x = Math.abs(x);
    AYAN[i] = (x + 24.0) / 48.0;
  }
  AYAN[0] = 2 * AYAN[0];
  return AYAN;
}

// ---------- KALABALA port (partial but functional) ----------
function kalabalaFromFortran(out: OutAny): number[] {
  // Partial port: Nathonnatha + Tribhaga.
  // (Varsha/Masa/Vara/Hora parts require T1900 + NWEEK; we skip for now.)

  const TEMP = Array(7).fill(0);

  const LMT = getLmtHours(out);
  const SRISE = isoToLocalHours(out?.sunriseISO ?? null);
  const SSET = isoToLocalHours(out?.sunsetISO ?? null);

  // NATHONNATHA BALA (Fortran IV array)
  // DATA IV /1,3*2,1,1,2/  =>  [1,2,2,2,1,1,2]
  const IV = [1, 2, 2, 2, 1, 1, 2];

  let x = LMT;
  if (x > 12) x = 24 - x;

  const A1 = x / 12.0;
  const A2 = 1.0 - A1;

  for (let i = 0; i < 7; i++) {
    TEMP[i] = IV[i] === 1 ? A1 : A2;
  }

  // Fortran: TEMP(4)=1.0 (1-based) => index 3 in JS
  TEMP[3] = 1.0;

  // THRIBAGHA BALA (needs sunrise/sunset)
  if (Number.isFinite(SRISE) && Number.isFinite(SSET) && SRISE > 0 && SSET > 0) {
    let Y = LMT;
    if (LMT < SRISE) Y = Y + 24;

    let seg = (SSET - SRISE) / 3.0;
    let ITHRI = Math.floor((LMT - SRISE) / seg + 1.0);

    if (Y > SSET) {
      seg = 8.0 - seg;
      ITHRI = Math.floor((Y - SSET) / seg + 4.0);
    }

    // Fortran: ITH(6) = /4,1,7,2,6,3/
    const ITH = [4, 1, 7, 2, 6, 3];

    // Clamp ITHRI to 1..6
    const idx = Math.max(1, Math.min(6, ITHRI)) - 1;
    const K = ITH[idx] - 1; // convert 1-based planet index to 0-based

    TEMP[K] = TEMP[K] + 1.0;

    // Fortran: TEMP(5)=TEMP(5)+1.0 (1-based) => index 4
    TEMP[4] = TEMP[4] + 1.0;
  }

  return TEMP;
}

// ---------- SUBHA selection (approx; you can refine later) ----------
function subha7(out: OutAny): number[] {
  // Fortran uses SUBHA(I) (1 or 2) to choose B(1) or B(2).
  // We implement a standard: benefics choose 1, malefics choose 2.
  // Moon depends on waxing (0..180 from Sun).
  const sun = getPlanetLon(out, "Sun");
  const moon = getPlanetLon(out, "Moon");
  const rel = ratnl(moon - sun);
  const waxing = rel <= 180; // standard
  // order: Sun Moon Mars Mercury Jupiter Venus Saturn
  return [
    2, // Sun malefic
    waxing ? 1 : 2, // Moon
    2, // Mars
    1, // Mercury (treated benefic here)
    1, // Jupiter
    1, // Venus
    2, // Saturn
  ];
}

// --- helpers to match Fortran ---
function t1900_from_jd(jdUT: number): number {
  // Fortran: T1900(DATE,GMT)*36525 + 26543
  // Standard astronomy: centuries since 1900-01-00 12:00 (JD 2415020.0)
  return (jdUT - 2415020.0) / 36525.0;
}

function weekdayPlanetIndexFromJD(jdUT: number): number {
  // returns 1..7 where 1=Sun,2=Moon,3=Mars,4=Mercury,5=Jupiter,6=Venus,7=Saturn
  // Compute weekday: 0=Sunday ... 6=Saturday (standard)
  const w = Math.floor(jdUT + 1.5) % 7;
  const map = [1, 2, 3, 4, 5, 6, 7]; // Sun..Sat
  return map[w] ?? 1;
}



// ---------- SHADBL main (produces GRHBAL 7x11 and BAVBAL 12x4) ----------
function shadblCompute(out: OutAny) {
  const planetNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

  const LONG = planetNames.map((p) => getPlanetLon(out, p));
  const DECL = planetNames.map((p) => getPlanetDecl(out, p));
  const AY = getAyan(out);

  // Base CHEST values from absolute speed; then normalize with your Fortran-style CHESHTA
  const CHEST0 = planetNames.map((p) => Math.abs(getPlanetSpeed(out, p)));
  const CHEST = cheshtaFromFortran(CHEST0, LONG[0], LONG[1], AY);

  const AYAN = ayanabalaFromFortran(DECL);

  // NOTE: TEMP is the working accumulator (Paksha + Yuddha + Kala additions)
  const TEMP = Array(7).fill(0);

  // RASI & NAVA signs (1..12)
  const RASI = LONG.map((x) => Math.floor(ratnl(x) / 30) + 1);
  const NAVA = LONG.map((x) => {
    const rasi = Math.floor(ratnl(x) / 30);
    const part = Math.floor(((ratnl(x) - rasi * 30) / (30 / 9)));
    const navSign = ((rasi * 9 + part) % 12) + 1;
    return navSign;
  });

  const STHAN = vargaSTHAN(LONG, RASI, NAVA);
  const BHAVMD = getBhavmd12(out);

  const GRHBAL = Array.from({ length: 7 }, () => Array(11).fill(0));
  const BAVBAL = Array.from({ length: 12 }, () => Array(4).fill(0));

  // ----------------------------
  // PAKSHA BALA → TEMP
  // ----------------------------
  const subha = subha7(out);
  let rel = ratnl(LONG[1] - LONG[0]);
  if (rel > 180) rel = rel - 180;

  const B2 = rel / 180.0;
  const B1 = 1.0 - B2;

  for (let i = 0; i < 7; i++) {
    let Y = subha[i] === 1 ? B1 : B2;
    if (i === 1) Y = 2.0 * Y; // Moon special
    TEMP[i] += Y;
  }

  // preload CHEST/USUAL
  for (let i = 0; i < 7; i++) {
    GRHBAL[i][2] = CHEST[i];
    GRHBAL[i][3] = USUAL[i];
  }

  // ----------------------------
  // Main per-planet: STHAN, DIK, ISHTA/KASHT/NET
  // ----------------------------
  const OC = Array(7).fill(0);

  for (let i = 0; i < 7; i++) {
    // OC from neecha-distance
    let X = Math.abs(LONG[i] - NEECHA[i]);
    if (X > 180) X = 360 - X;
    OC[i] = X / 180.0;

    // STHANA
    GRHBAL[i][0] = (STHAN[i] ?? 0) + OC[i];

    // ISHTA/KASHT/NET (Fortran style)
    const chest01 = (CHEST[i] ?? 0); // 0..1

    GRHBAL[i][8] = Math.sqrt(Math.max(0, OC[i] * chest01));
    GRHBAL[i][9] = -Math.sqrt(Math.max(0, (1 - OC[i]) * (1 - chest01)));
    GRHBAL[i][10] = GRHBAL[i][8] + GRHBAL[i][9];

    // DIK BALA (0..1)
    const j = ID[i] - 1;
    const ref = BHAVMD[j] ?? 0;
    if (ref !== 0) {
      let dx = Math.abs(LONG[i] - ref);
      if (dx > 180) dx = 360 - dx;
      GRHBAL[i][1] = dx / 180.0;
    } else {
      GRHBAL[i][1] = 0;
    }
  }

  // Sun/Moon CHEST forced 0
  GRHBAL[0][2] = 0;
  GRHBAL[1][2] = 0;

  // ----------------------------
  // YUDHDHA → TEMP adjustments
  // ----------------------------
  for (let i = 2; i <= 5; i++) {
    for (let j = i + 1; j <= 6; j++) {
      const Z = Math.abs(LONG[i] - LONG[j]);
      if (Z < 1.0 || Z > 359.0) {
        const si = GRHBAL[i][0] + GRHBAL[i][1] + TEMP[i];
        const sj = GRHBAL[j][0] + GRHBAL[j][1] + TEMP[j];
        const denom = Math.abs(BIMB[i - 2] - BIMB[j - 2]) || 1;
        const W = Math.abs(si - sj) / denom;

        let IW = i;
        let IL = j;
        if (!(LONG[j] >= LONG[i] || LONG[j] < 1.0)) {
          IW = j;
          IL = i;
        }
        TEMP[IW] += W;
        TEMP[IL] -= W;
      }
    }
  }

  // ----------------------------
  // KALA = TEMP + AYAN
  // ----------------------------
  for (let i = 0; i < 7; i++) {
    GRHBAL[i][4] = TEMP[i] + AYAN[i];
  }

  // DEBUG (optional)
  console.log("SHADBALA DEBUG SUN:  TEMP=", TEMP[0], "AYAN=", AYAN[0], "KALA=", GRHBAL[0][4]);
  console.log("SHADBALA DEBUG MOON: TEMP=", TEMP[1], "AYAN=", AYAN[1], "KALA=", GRHBAL[1][4]);

  // ----------------------------
  // DRIK + TOTAL (Fortran style)
  // ----------------------------
  for (let i = 0; i < 7; i++) {
    let SUM = 0;

    for (let j = 0; j < 7; j++) {
      const X = ratnl(LONG[i] - LONG[j]);
      const L = Math.floor(X / 30.0) + 1; // 1..12
      const row = SEE[L - 1];
      const XX = (X - (L - 1) * 30.0) * row[0] + row[1];

      const sign = subha[j] % 2 === 0 ? -1 : 1; // (-1)**SUBHA
      SUM += (XX / 240.0) * sign;
    }

    GRHBAL[i][5] = SUM; // DRIK

    // TOTAL = sum of cols 0..5 (STHAN..DRIK)
    let total = 0;
    for (let k = 0; k < 6; k++) total += GRHBAL[i][k];

    GRHBAL[i][6] = total;                  // SHADBAL
    GRHBAL[i][7] = total / (STNO[i] || 1); // REL.STR
  }

  // ----------------------------
  // BHAVA BALAS (BAVBAL)
  // ----------------------------
  for (let i = 0; i < 12; i++) {
    const bh = ratnl(BHAVMD[i]);
    const J = Math.floor(bh / 15.0) + 1;

    let K = IBAV[J - 1] - (i + 1);
    if (K < 0) K += 12;
    if (K > 6) K = 12 - K;

    BAVBAL[i][0] = K / 6.0; // DIK

    const signIdx = Math.floor(bh / 30.0) + 1;
    const L = RASIOWN[signIdx - 1];
    BAVBAL[i][1] = GRHBAL[L - 1][6]; // ADHIPATI uses SHADBAL

    let SUM = 0;
    for (let j = 0; j < 7; j++) {
      const X = ratnl(bh - LONG[j]);
      const KK = Math.floor(X / 30.0) + 1;
      const row = SEE[KK - 1];
      const XX = (X - (KK - 1) * 30.0) * row[0] + row[1];

      const sign = subha[j] % 2 === 0 ? -1 : 1;
      SUM += (XX / 240.0) * sign * DR[j];
    }

    BAVBAL[i][2] = SUM; // DRSHTI
    BAVBAL[i][3] = BAVBAL[i][0] + BAVBAL[i][1] + BAVBAL[i][2]; // TOTAL
  }

  return { GRHBAL, BAVBAL };
}

// ---------- Public APIs used by components ----------
export function calculateShadbala(input: any) {
  if (!input) return [];
  if (Array.isArray(input) && input.length && (input[0]?.PLANET || input[0]?.planet)) return input;

  const res = shadblCompute(input);
  const GRHBAL = res?.GRHBAL;
  if (!GRHBAL) return [];

  const names = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"];
  const fmt = (v: number) => (Number(v) || 0).toFixed(2);

  return names.map((p, i) => ({
    PLANET: p,
    STHAN: fmt(GRHBAL[i][0]),
    DIK: fmt(GRHBAL[i][1]),
    CHEST: fmt(GRHBAL[i][2]),
    NYSAR: fmt(GRHBAL[i][3]),
    KALA: fmt(GRHBAL[i][4]),
    DHRIS: fmt(GRHBAL[i][5]),
    SHADBAL: fmt(GRHBAL[i][6]),
    REL_STR: fmt(GRHBAL[i][7]),
    ISHTA: fmt(GRHBAL[i][8]),
    KASHT: fmt(GRHBAL[i][9]),
    NET: fmt(GRHBAL[i][10]),
  }));
}

export function calculateBhavaBala(input: any) {
  if (!input) return [];
  if (Array.isArray(input) && input.length && input[0]?.house) return input;

  const res = shadblCompute(input);
  const BAVBAL = res?.BAVBAL;
  if (!BAVBAL) return [];

  const fmt = (v: number) => (Number(v) || 0).toFixed(2);

  return Array.from({ length: 12 }, (_, i) => ({
    house: `H${i + 1}`,
    DIK: fmt(BAVBAL[i][0]),
    ADHIPATI: fmt(BAVBAL[i][1]),
    DRSHTI: fmt(BAVBAL[i][2]),
    TOTAL: fmt(BAVBAL[i][3]),
  }));
}

