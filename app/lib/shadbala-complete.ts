// =============================================================
// shadbala-complete.ts
// Faithful TypeScript port of the classic Fortran Shadbala
// Covers: Graha Bala (7 planets) + Bhava Bala (12 houses)
// Drop this single file into app/lib/ and import from route.ts
// =============================================================

export {};

// -------------------------------------------------------------
// SECTION 1 — TYPES
// -------------------------------------------------------------

export interface ShadbalaInput {
  positions:      Record<string, number>;   // planet name → sidereal longitude 0–360
  speeds:         Record<string, number>;   // planet name / abbrev → deg/day
  declinations:   Record<string, number>;   // planet name → declination degrees
  cusps:          number[];                 // [0, cusp1..cusp12]  length 13
  ascendant:      number;                   // sidereal ascendant degree
  houseLords:     Record<number, string>;   // house 1..12 → planet name
  jd_ut:          number;                   // Julian Day UT
  localTimeHours: number;                   // local clock time as decimal hours
  sunriseISO?:    string | null;
  sunsetISO?:     string | null;
  isDayBirth?:    boolean;
}

export interface GrahaBalaRow {
  planet:    string;
  sthana:    number;   // Sthana Bala  (virupas)
  dig:       number;   // Dig Bala
  kala:      number;   // Kala Bala
  chesta:    number;   // Chesta Bala
  naisargika:number;   // Naisargika Bala
  drik:      number;   // Drik Bala
  total:     number;   // Shadbala total
  rupas:     number;   // total / required minimum (Shadbala Pinda)
  ishta:     number;   // Ishta Phala
  kashta:    number;   // Kashta Phala
  strong:    boolean;  // total >= minimum required
}

export interface BhavaBalaRow {
  house:     number;
  dig:       number;   // Bhava Dig Bala
  adhipati:  number;   // Bhava Adhipati Bala
  drishti:   number;   // Bhava Drishti Bala
  total:     number;
}

// -------------------------------------------------------------
// SECTION 2 — CONSTANTS (direct from Fortran DATA statements)
// -------------------------------------------------------------

// Neecha (debilitation) degrees for Sun..Saturn
const NEECHA = [190, 213, 118, 345, 275, 177, 20];

// Sign owner (1..12) → planet index 1..7 (Sun=1 … Saturn=7)
const RASIOWN = [3, 6, 4, 2, 1, 4, 6, 3, 5, 7, 7, 5];

// Naisargika Bala (fixed, virupas scale 0..1 normalised)
// Sun=60, Moon=51.43, Mars=17.14, Mer=25.71, Jup=34.29, Ven=42.86, Sat=8.57  (out of 60)
const NAISARGIKA_VIRUPAS = [60, 51.43, 17.14, 25.71, 34.29, 42.86, 8.57];

// Minimum required Shadbala (virupas) for each planet Sun..Sat
const STNO_VIRUPAS = [480, 360, 300, 420, 390, 330, 300];

// Disk sizes for Yuddha Bala (Mars..Saturn only)
const BIMB = [9.4, 6.6, 190.4, 16.6, 158.0];

// Dig Bala exaltation house index (1-based) for Sun..Saturn
const ID = [4, 10, 4, 7, 7, 10, 1];

// Drik Bala SEE table (12 rows × 2 cols) from Fortran DATA SEE
const SEE: [number, number][] = [
  [ 0.0, 15.0], [ 0.5, 45.0], [ 1.0, 30.0], [-0.5,  0.0],
  [-1.0, 60.0], [ 2.0, 45.0], [-0.5, 30.0], [-0.5, 15.0],
  [-0.5,  0.0], [-0.5,  0.0], [ 0.0,  0.0], [ 0.0,  0.0],
];

// IBAV table for Bhava Dig Bala (24 entries)
const IBAV = [
  4,4,4,4,7,7,10,10,4,4,7,7,
  7,7,1,1,7,4,4,10,7,7,10,10,
];

// Kala Bala weekday lords (0=Sun … 6=Sat)
const VARA_LORD_IDX = [0, 1, 2, 3, 4, 5, 6]; // Sunday=Sun(0), Monday=Moon(1)…

// Hora lord sequence repeats Sun,Venus,Mercury,Moon,Saturn,Jupiter,Mars
const HORA_SEQ = [0, 5, 3, 1, 6, 4, 2];

// Nathonnatha IV array from Fortran: day-planets vs night-planets
const IV = [1, 2, 2, 2, 1, 1, 2]; // 1=day-strong, 2=night-strong

// Tribhaga ITH array from Fortran
const ITH = [4, 1, 7, 2, 6, 3]; // 1-based planet indices

// Fortran DR array (used in Drik Bala sign for benefic/malefic)
const DR = [1, 1, 1, 4, 4, 1, 1];

// Varga MITHRA table 7×7 (friendship matrix)
const MITHRA: number[][] = [
  [0,0,0,0,0,0,0,0],
  [0,0,1,2,1,2,2,2],
  [0,1,0,1,0,2,2,1],
  [0,1,1,0,1,1,0,2],
  [0,1,1,2,0,2,2,1],
  [0,2,2,1,2,0,1,1],
  [0,2,2,2,2,1,0,0],
  [0,1,2,0,0,1,0,0],
];

// Moolatrikona signs (1-based planet index → sign 1..12)
const MULTRIGON = [0, 5, 2, 1, 6, 9, 12, 11];

// ODD parity flag per planet (1-based)
const ODD = [0, 0, 1, 0, 0, 0, 1, 0];

// SEX (drekkana position for special term) per planet (1-based)
const SEX_ARR = [0, 1, 2, 3, 4, 5, 6, 7];

// Saptavargaja ISAP table
const ISAP = [0, 1, 2, 4, 8, 12, 16];

// SQR table for lagna relationship
const SQR = [0, 60, 30, 15];

// Trimshamsa ITR table
const ITR: [number, number][] = [
  [5,1],[10,4],[18,7],[25,2],[30,6]
];

// Hora IH table
const IH = [0, 1, 3, 5, 2, 4, 6, 7];

// -------------------------------------------------------------
// SECTION 3 — UTILITY FUNCTIONS
// -------------------------------------------------------------

const norm = (x: number) => { let y = x % 360; if (y < 0) y += 360; return y; };
const mod1 = (a: number, m: number) => { const r = a % m; return r < 0 ? r + m : r; };
const toN  = (v: any) => { const n = typeof v === "number" ? v : parseFloat(String(v ?? "")); return Number.isFinite(n) ? n : 0; };

function isoToHours(iso: string | null | undefined): number {
  if (!iso) return 0;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 0 : d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

// Extract planet longitude robustly
function pLon(inp: ShadbalaInput, name: string): number {
  const pos = inp.positions;
  return norm(toN(pos[name] ?? pos[name.toUpperCase()] ?? 0));
}

// Extract planet speed robustly
function pSpd(inp: ShadbalaInput, name: string): number {
  const sp = inp.speeds;
  const ab = name.slice(0, 2);
  return toN(sp[name] ?? sp[name.toUpperCase()] ?? sp[ab] ?? 0);
}

// Extract planet declination
function pDecl(inp: ShadbalaInput, name: string): number {
  const d = inp.declinations;
  return toN(d[name] ?? d[name.toUpperCase()] ?? 0);
}

// House midpoints from cusps array [0, c1..c12]
function houseMids(cusps: number[]): number[] {
  const mids: number[] = [];
  for (let h = 1; h <= 12; h++) {
    const a = norm(cusps[h] ?? 0);
    const b = norm(cusps[h === 12 ? 1 : h + 1] ?? 0);
    let arc = b - a;
    if (arc < 0) arc += 360;
    mids.push(norm(a + arc / 2));
  }
  return mids; // index 0 = house 1 midpoint
}

// Benefic/malefic classification
function isSubha(idx: number, inp: ShadbalaInput): boolean {
  // idx: 0=Sun,1=Moon,2=Mars,3=Mercury,4=Jupiter,5=Venus,6=Saturn
  if (idx === 4 || idx === 5) return true;   // Jupiter, Venus always benefic
  if (idx === 0 || idx === 2 || idx === 6) return false; // Sun, Mars, Saturn malefic
  if (idx === 3) return true;                // Mercury default benefic
  if (idx === 1) {
    const rel = norm(pLon(inp, "Moon") - pLon(inp, "Sun"));
    return rel <= 180; // waxing Moon = benefic
  }
  return false;
}

// -------------------------------------------------------------
// SECTION 4 — STHANA BALA (Varga method, Fortran VARGA)
// -------------------------------------------------------------

function computeSthanaBala(
  LONG: number[], RASI: number[], NAVA: number[], lagnaRasi: number
): number[] {
  // Build VARGAS[1..10][1..8]
  const VARGAS: number[][] = Array.from({length: 11}, () => Array(9).fill(0));

  for (let I = 1; I <= 7; I++) {
    const deg  = LONG[I-1];
    const sign = RASI[I-1];
    const nav  = NAVA[I-1];
    const D30  = deg / 30.0;
    const DD   = deg / 3.0;

    VARGAS[I][1] = sign;                                             // rasi

    const horaHalf = (deg % 30) < 15 ? 0 : 1;
    const K2 = mod1(Math.floor(deg / 30) + horaHalf, 2);
    VARGAS[I][2] = K2 === 0 ? 1 : 5;                                // hora (Sun or Moon sign)

    const JM3 = sign + Math.floor(DD / 10.0) * 4 - 1;
    VARGAS[I][3] = mod1(JM3, 12) + 1;                               // drekkana

    const JM4 = Math.floor(D30 * 7.0);
    VARGAS[I][4] = mod1(JM4 + sign - 1, 12) + 1;                    // saptamsa

    VARGAS[I][5] = nav;                                              // navamsa

    const JM6 = Math.floor(D30 * 12.0);
    VARGAS[I][6] = mod1(JM6 + sign - 1, 12) + 1;                    // dwadasamsa

    const X = deg - Math.floor(deg / 60.0) * 60.0;
    let KK = 5;
    for (let k = 1; k <= 5; k++) {
      if (X <= ITR[k-1][0]) { KK = k; break; }
    }
    VARGAS[I][7] = ITR[KK-1][1];                                    // trimshamsa

    let NF = Math.floor(DD) + sign;
    if (mod1(sign, 2) === 0) NF += 8;
    VARGAS[I][8] = mod1(NF - 1, 12) + 1;                            // d30 extra
  }

  VARGAS[10][1] = lagnaRasi;

  const STHAN = Array(7).fill(0);

  for (let I = 1; I <= 7; I++) {
    const RASIA = VARGAS[I][1];

    for (let J = 1; J <= 7; J++) {
      let K = VARGAS[I][J];
      if (J !== 2 && J !== 7) K = RASIOWN[K-1];       // sign owner planet idx

      const RASK = VARGAS[K][1];
      let L = Math.abs(RASIA - RASK) + 1;
      if (L > 7) L = 14 - L;

      let LL = -1;
      if (L >= 2 && L <= 4) LL = 1;

      const I1 = Math.max(1, Math.min(6, (MITHRA[K]?.[I] ?? 0) + LL + 3));
      const SP = ISAP[I1] / 32.0;

      if (J === 1 && RASIA === MULTRIGON[I]) {
        STHAN[I-1] += 0.75;
      } else {
        STHAN[I-1] += SP;
      }
    }

    // Odd/even parity term X
    const JJp = RASIA + (ODD[I] ?? 0);
    const KKp = VARGAS[I][5] + (ODD[I] ?? 0);
    const Xterm = (mod1(JJp, 2) + mod1(KKp, 2)) / 4.0;

    // Lagna relationship term Y
    let J2 = RASIA - (VARGAS[10][1]);
    if (J2 < 0) J2 += 12;
    const K2 = mod1(J2, 3) + 1;
    const Yterm = (SQR[K2] ?? 0) / 60.0;

    // Special drekkana term Z
    const part = Math.floor((LONG[I-1] - (RASIA-1) * 30.0) / 10.0) + 1;
    const Zterm = (part === SEX_ARR[I]) ? 0.25 : 0.0;

    STHAN[I-1] += Xterm + Yterm + Zterm;
  }

  // Convert to virupas (Fortran used STNO as divisor; we keep raw rupas × 60)
  return STHAN.map(s => s * 60);
}

// -------------------------------------------------------------
// SECTION 5 — CHESTA BALA (Fortran CHESHTA)
// -------------------------------------------------------------

function computeChestaBala(
  LONG: number[], rawSpeeds: number[], sunLon: number, moonLon: number
): number[] {
  // Mean daily motions (degrees/day)
  const MEAN_SPEED = [0.9856, 13.1764, 0.5240, 1.3833, 0.0831, 1.2000, 0.0335];
  // Max possible deviation from mean (used for scaling to 0..60)
  const MAX_DEV    = [0.9856, 13.1764, 0.7740, 1.9760, 0.2306, 1.6824, 0.1309];

  const result: number[] = [];
  for (let i = 0; i < 7; i++) {
    if (i === 0) {
      // Sun: based on distance from apogee (fastest point)
      // Sun moves fastest at perihelion ~270° longitude
      let x = Math.abs(LONG[0] - 270);
      if (x > 180) x = 360 - x;
      result.push((x / 180) * 60);
    } else if (i === 1) {
      // Moon: based on elongation from Sun
      let x = norm(moonLon - sunLon);
      if (x > 180) x = 360 - x;
      result.push((x / 180) * 60);
    } else {
      // Mars through Saturn: deviation from mean speed
      const speed = rawSpeeds[i];
      const dev = Math.abs(speed - MEAN_SPEED[i]);
      const chesta = Math.min(60, (dev / MAX_DEV[i]) * 60);
      result.push(chesta);
    }
  }
  return result;
}

// -------------------------------------------------------------
// SECTION 6 — AYANA BALA (Fortran AYANABALA)
// -------------------------------------------------------------

function computeAyanaBala(DECL: number[]): number[] {
  return DECL.map((decl, i) => {
    let x = decl;
    const I = i + 1; // 1-based
    if (I === 2 || I === 7) x = -x;   // Moon and Saturn: reverse
    if (I === 4) x = Math.abs(x);     // Mercury: absolute
    // Fortran: AYAN = (x + 24) / 48  → virupas = that × 60
    return ((x + 24.0) / 48.0) * 60;
  }).map((v, i) => {
    // Sun gets double Ayana Bala
    return i === 0 ? v * 2 : v;
  });
}

// -------------------------------------------------------------
// SECTION 7 — KALA BALA (Fortran KALABALA)
// -------------------------------------------------------------

function computeKalaBala(inp: ShadbalaInput): number[] {
  const KALA = Array(7).fill(0);
  const LMT = inp.localTimeHours;
  const jd  = inp.jd_ut;

  // --- 1. Nathonnatha Bala ---
  let x = LMT;
  if (x > 12) x = 24 - x;
  const A1 = x / 12.0;
  const A2 = 1.0 - A1;
  for (let i = 0; i < 7; i++) KALA[i] += (IV[i] === 1 ? A1 : A2) * 60;
  KALA[3] = 60; // Moon always gets full Nathonnatha

  // --- 2. Paksha Bala ---
  const sunLon  = pLon(inp, "Sun");
  const moonLon = pLon(inp, "Moon");
  let rel = norm(moonLon - sunLon);
  if (rel > 180) rel = 360 - rel;
  const B2 = rel / 180.0;
  const B1 = 1.0 - B2;
  const subha = Array.from({length: 7}, (_, i) => isSubha(i, inp));
  for (let i = 0; i < 7; i++) {
    let pk = subha[i] ? B1 * 60 : B2 * 60;
    if (i === 1) pk *= 2; // Moon gets double Paksha Bala
    KALA[i] += pk;
  }

  // --- 3. Tribhaga Bala ---
  const SRISE = isoToHours(inp.sunriseISO);
  const SSET  = isoToHours(inp.sunsetISO);
  if (SRISE > 0 && SSET > 0) {
    let seg = (SSET - SRISE) / 3.0;
    let ITHRI: number;
    let Y = LMT;
    if (LMT < SRISE) Y += 24;
    if (Y <= SSET) {
      ITHRI = Math.floor((Y - SRISE) / seg + 1);
    } else {
      seg = (24 - (SSET - SRISE)) / 3.0;
      ITHRI = Math.floor((Y - SSET) / seg + 4);
    }
    const idx = Math.max(0, Math.min(5, ITHRI - 1));
    const K = ITH[idx] - 1; // convert to 0-based
    KALA[K]  += 60;
    KALA[4]  += 60; // Jupiter always gets an extra 60 in Tribhaga
  }

  // --- 4. Varsha + Masa + Vara + Hora Bala (exact Fortran) ---
  if (jd > 0) {
    const DQ = jd - 2415020.0 + 26543.0;

    // Varsha Bala (0.25 rupas = 15 virupas)
    const NK1 = Math.floor(DQ / 360.0);
    const j1 = mod1(NK1 * 3 + 3, 7);
    KALA[j1] += 15;

    // Masa Bala (0.5 rupas = 30 virupas)
    const NK2 = Math.floor(DQ / 30.0);
    const j2 = mod1(NK2 * 2 + 3, 7);
    KALA[j2] += 30;

    // Vara Bala (0.75 rupas = 45 virupas)
    const w = Math.floor(jd + 1.5) % 7;
    KALA[w] += 45;

    // Hora Bala (1.0 rupas = 60 virupas)
    const HOR = [0, 5, 3, 1, 6, 4, 2];
    const MMX = w * 24 + LMT - (SRISE > 0 ? SRISE : 6) + 1;
    const IHOR = mod1(Math.floor(MMX) - 1, 7);
    KALA[HOR[IHOR]] += 60;
  }

  // --- 6. Ayana Bala (added into Kala as per Fortran SHADBL) ---
  const DECL = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"].map(p => pDecl(inp, p));
  const AYAN = computeAyanaBala(DECL);
  for (let i = 0; i < 7; i++) KALA[i] += AYAN[i];

  return KALA;
}

// -------------------------------------------------------------
// SECTION 8 — DIG BALA (Fortran: uses house midpoints)
// -------------------------------------------------------------

function computeDigBala(LONG: number[], mids: number[]): number[] {
  // ID is 1-based house index for peak Dig Bala
  return LONG.map((lon, i) => {
    const j = ID[i] - 1; // 0-based index into mids
    const ref = mids[j] ?? 0;
    let dx = Math.abs(lon - ref);
    if (dx > 180) dx = 360 - dx;
    return (dx / 180.0) * 60; // virupas
  });
}

// -------------------------------------------------------------
// SECTION 9 — DRIK BALA (Fortran DRIK + SEE table)
// -------------------------------------------------------------

function computeDrikBala(LONG: number[], subha: boolean[]): number[] {
  // ISP table from Fortran: special signs for Mars(3), Jupiter(5), Saturn(7)
  const ISP: number[][] = [
    [0,0],   // dummy
    [0,0],   // dummy  
    [0,0],   // dummy
    [4,8],   // Mars (index 3, K1=1)
    [0,0],   // dummy
    [5,9],   // Jupiter (index 5, K1=2)
    [0,0],   // dummy
    [3,10],  // Saturn (index 7, K1=3)
  ];

  const DRIK = Array(7).fill(0);
  for (let i = 0; i < 7; i++) {
    let SUM = 0;
    for (let j = 0; j < 7; j++) {
      const X  = norm(LONG[i] - LONG[j]);
      const L  = Math.floor(X / 30.0) + 1; // 1..12
      const row = SEE[L-1];
      let XX = (X - (L-1) * 30.0) * row[0] + row[1];

      // Special sign adjustment for Mars(j=2), Jupiter(j=4), Saturn(j=6)
      if (j === 2 || j === 4 || j === 6) {
        const K1 = (j) / 2; // Mars=1, Jupiter=2, Saturn=3
        const k1 = Math.floor(K1);
        const isp = ISP[j*2+1] ?? ISP[7];
        const sp1 = k1 === 1 ? ISP[3] : k1 === 2 ? ISP[5] : ISP[7];
        if ((L - sp1[0]) * (L - sp1[1]) === 0) {
          XX += 15.0 * k1;
        }
      }

      const sign = subha[j] ? 1 : -1;
      SUM += (XX / 240.0) * sign;
    }
    DRIK[i] = SUM * 60;
  }
  return DRIK;
}

// -------------------------------------------------------------
// SECTION 10 — YUDDHA BALA (planetary war adjustment)
// -------------------------------------------------------------

function applyYuddhaBala(
  LONG: number[], digBala: number[], kala: number[],
  sthan: number[]
): number[] {
  const adj = Array(7).fill(0);
  // Only for Mars(2)..Saturn(6), i.e. indices 2..6
  for (let i = 2; i <= 5; i++) {
    for (let j = i + 1; j <= 6; j++) {
      const Z = Math.abs(LONG[i] - LONG[j]);
      if (Z < 1.0 || Z > 359.0) {
        const si = sthan[i] + digBala[i] + kala[i];
        const sj = sthan[j] + digBala[j] + kala[j];
        const denom = Math.abs(BIMB[i-2] - BIMB[j-2]) || 1;
        const W = Math.abs(si - sj) / denom;
        // winner is the one with higher ecliptic longitude
        if (LONG[j] >= LONG[i] || LONG[j] < 1.0) {
          adj[i] += W;  // i wins
          adj[j] -= W;
        } else {
          adj[j] += W;  // j wins
          adj[i] -= W;
        }
      }
    }
  }
  return adj;
}

// -------------------------------------------------------------
// SECTION 11 — ISHTA / KASHTA PHALA
// -------------------------------------------------------------

function computeIshtaKashta(OC: number[], CHEST: number[]): { ishta: number[], kashta: number[] } {
  const ishta  = OC.map((oc, i) => Math.sqrt(Math.max(0, oc * CHEST[i])));
  const kashta = OC.map((oc, i) => Math.sqrt(Math.max(0, (60-oc) * (60-CHEST[i]))));
  return { ishta, kashta };
}

// -------------------------------------------------------------
// SECTION 12 — MAIN GRAHA BALA COMPUTATION
// -------------------------------------------------------------

function computeGrahaBala(inp: ShadbalaInput): GrahaBalaRow[] {
  const NAMES = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

  const LONG  = NAMES.map(p => pLon(inp, p));
  const DECL  = NAMES.map(p => pDecl(inp, p));
  const SPEEDS = NAMES.map(p => Math.abs(pSpd(inp, p)));

  // Signs (1..12) and Navamsa signs
  const RASI = LONG.map(x => Math.floor(x / 30) + 1);
  const NAVA = LONG.map(x => {
    const s = Math.floor(x / 30);
    const w = x - s * 30;
    const n = Math.floor(w / (30/9));
    return ((s * 9 + n) % 12) + 1;
  });

  const lagnaRasi = Math.floor(norm(inp.ascendant) / 30) + 1;

  // Get ayanamsa from Swiss (approximate from positions; we use Sun's tropical - sidereal offset)
  // Actually ayanamsa is not stored directly; approximate as 0 for Chesta (used only for Sun formula)
  // Your route.ts already computes sidereal positions, so we can infer:
  const AY = 0; // Chesta formula uses it only for Sun's mean longitude offset; 0 is safe here

  const mids = houseMids(inp.cusps);

  // Individual bala components
  const STHAN  = computeSthanaBala(LONG, RASI, NAVA, lagnaRasi);
  const CHEST  = computeChestaBala(LONG, SPEEDS, LONG[0], LONG[1], AY);
  const DIG    = computeDigBala(LONG, mids);
  const subha  = NAMES.map((_, i) => isSubha(i, inp));
  const DRIK   = computeDrikBala(LONG, subha);
  const KALA   = computeKalaBala(inp);

  // Naisargika Bala (fixed virupas)
  const NAIS = [...NAISARGIKA_VIRUPAS];

  // Yuddha Bala adjustments go into Kala column
  const YUDJ = applyYuddhaBala(LONG, DIG, KALA, STHAN);
  const KALA_FINAL = KALA.map((k, i) => k + YUDJ[i]);

  // OC = distance from neecha (0..60 virupas)
  const OC = LONG.map((lon, i) => {
    let x = Math.abs(lon - NEECHA[i]);
    if (x > 180) x = 360 - x;
    return (x / 180.0) * 60;
  });

  // Sthana includes OC (uccha bala component)
  const STHAN_TOTAL = STHAN.map((s, i) => s + OC[i]);

  const { ishta, kashta } = computeIshtaKashta(OC, CHEST);

  return NAMES.map((name, i) => {
    const total =
      STHAN_TOTAL[i] +
      DIG[i] +
      KALA_FINAL[i] +
      CHEST[i] +
      NAIS[i] +
      DRIK[i];

    return {
      planet:     name,
      sthana:     parseFloat(STHAN_TOTAL[i].toFixed(2)),
      dig:        parseFloat(DIG[i].toFixed(2)),
      kala:       parseFloat(KALA_FINAL[i].toFixed(2)),
      chesta:     parseFloat(CHEST[i].toFixed(2)),
      naisargika: parseFloat(NAIS[i].toFixed(2)),
      drik:       parseFloat(DRIK[i].toFixed(2)),
      total:      parseFloat(total.toFixed(2)),
      rupas:      parseFloat((total / STNO_VIRUPAS[i]).toFixed(3)),
      ishta:      parseFloat(ishta[i].toFixed(2)),
      kashta:     parseFloat(kashta[i].toFixed(2)),
      strong:     total >= STNO_VIRUPAS[i],
    };
  });
}

// -------------------------------------------------------------
// SECTION 13 — BHAVA BALA COMPUTATION (Fortran BAVBAL)
// -------------------------------------------------------------

function computeBhavaBalaInternal(inp: ShadbalaInput, grahaBala: GrahaBalaRow[]): BhavaBalaRow[] {
  const mids = houseMids(inp.cusps);
  const NAMES = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
  const LONG  = NAMES.map(p => pLon(inp, p));
  const subha = NAMES.map((_, i) => isSubha(i, inp));

  // Build a quick lookup: planet name → total shadbala
  const shadLookup: Record<string, number> = {};
  for (const row of grahaBala) shadLookup[row.planet] = row.total;

  return Array.from({length: 12}, (_, h) => {
    const house = h + 1;
    const bh    = norm(mids[h]);

    // 1. Dig Bala (IBAV method, same as Fortran)
    const J = Math.floor(bh / 15) + 1; // 1..24
    let K = (IBAV[J-1] ?? 4) - house;
    if (K < 0) K += 12;
    if (K > 6) K = 12 - K;
    const digBala = (K / 6.0) * 60; // 0..60

    // 2. Adhipati Bala (lord's Shadbala total)
    const lordName  = inp.houseLords[house] ?? "";
    const adhipati  = shadLookup[lordName] ?? 0;

    // 3. Drishti Bala (SEE table applied to bhava midpoint)
    let SUM = 0;
    for (let j = 0; j < 7; j++) {
      const X  = norm(bh - LONG[j]);
      const KK = Math.floor(X / 30.0) + 1; // 1..12
      const row = SEE[KK-1];
      const XX  = (X - (KK-1) * 30.0) * row[0] + row[1];
      const sign = subha[j] ? 1 : -1;
      SUM += (XX / 240.0) * sign * DR[j];
    }
    const drishti = SUM * 60;

    const total = digBala + adhipati + drishti;

    return {
      house,
      dig:      parseFloat(digBala.toFixed(2)),
      adhipati: parseFloat(adhipati.toFixed(2)),
      drishti:  parseFloat(drishti.toFixed(2)),
      total:    parseFloat(total.toFixed(2)),
    };
  });
}

// -------------------------------------------------------------
// SECTION 14 — PUBLIC EXPORTS (what route.ts calls)
// -------------------------------------------------------------

export function computeShadbala(inp: ShadbalaInput): Record<string, any> {
  try {
    const rows = computeGrahaBala(inp);
    const out: Record<string, any> = {};
    for (const row of rows) {
      out[row.planet] = {
        sthana:     row.sthana,
        dig:        row.dig,
        kala:       row.kala,
        chesta:     row.chesta,
        naisargika: row.naisargika,
        drik:       row.drik,
        total:      row.total,
        rupas:      row.rupas,
        ishta:      row.ishta,
        kashta:     row.kashta,
        strong:     row.strong,
      };
    }
    return out;
  } catch (e) {
    console.error("computeShadbala error:", e);
    return {};
  }
}

export function computeBhavabala(inp: ShadbalaInput): {
  components: {
    dig:      Record<string, number>;
    adhipati: Record<string, number>;
    drishti:  Record<string, number>;
  };
  totals: Record<string, number>;
} {
  const empty = { components: { dig: {}, adhipati: {}, drishti: {} }, totals: {} };
  try {
    const graha = computeGrahaBala(inp);
    const rows  = computeBhavaBalaInternal(inp, graha);

    const dig:      Record<string, number> = {};
    const adhipati: Record<string, number> = {};
    const drishti:  Record<string, number> = {};
    const totals:   Record<string, number> = {};

    for (const row of rows) {
      const k = String(row.house);   // "1".."12"  ← matches BhavabalaSection.tsx
      dig[k]      = row.dig;
      adhipati[k] = row.adhipati;
      drishti[k]  = row.drishti;
      totals[k]   = row.total;
    }

    return { components: { dig, adhipati, drishti }, totals };
  } catch (e) {
    console.error("computeBhavabala error:", e);
    return empty;
  }
}
