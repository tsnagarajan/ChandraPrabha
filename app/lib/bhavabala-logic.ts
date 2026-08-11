// -------------------------------------------------------------
// BHAVA BALA LOGIC (robust + cusp-correct + IBAV DigBala)
// -------------------------------------------------------------

export interface PlanetData {
  name: string;          // "Sun", "Moon", etc.
  degree: number;        // 0–360 ecliptic longitude
  isBenefic: boolean;
  isMalefic: boolean;
}

export interface HouseCusps {
  [house: number]: number; // 1..12 → cusp degree (0–360)
}

export interface BhavaComponents {
  sthana: Record<number, number>;
  adhipati: Record<number, number>;
  dig: Record<number, number>;
  kaala: Record<number, number>;
  drishti: Record<number, number>;
  ayana: Record<number, number>;
}

export interface ComputeBhavaParams {
  // canonical form
  houseCusps?: HouseCusps;

  // route.ts form (what you currently pass)
  cusps?: number[]; // [0,c1..c12]
  positions?: Record<string, number>; // {"Sun":deg,...}
  declinations?: Record<string, number>;

  // shared
  houseLords: Record<number, string>; // 1..12 → "Sun"/"Moon"/...
  shadbalaTotals?: Record<string, number>;

  // optional (if not present → kaala becomes 0)
  yearLord?: string;
  monthLord?: string;
  weekdayLord?: string;
  horaLord?: string;
  isDay?: boolean;
  isDayBirth?: boolean;
}

// ---------------- Helpers ----------------

function normalizeDegree(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

function forwardArc(a: number, b: number): number {
  // distance going forward from a -> b (0..360)
  const x = normalizeDegree(b) - normalizeDegree(a);
  return x >= 0 ? x : x + 360;
}

function midpointForward(a: number, b: number): number {
  // midpoint along forward direction from a to b
  return normalizeDegree(normalizeDegree(a) + forwardArc(a, b) / 2);
}

function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(normalizeDegree(a) - normalizeDegree(b));
  return Math.min(diff, 360 - diff);
}

function toHouseCusps(input: ComputeBhavaParams): HouseCusps {
  if (input.houseCusps && typeof input.houseCusps === "object") return input.houseCusps;

  const arr = Array.isArray(input.cusps) ? input.cusps : [];
  const out: HouseCusps = {};
  for (let h = 1; h <= 12; h++) out[h] = normalizeDegree(Number(arr[h] ?? 0));
  return out;
}

function buildPlanetData(input: ComputeBhavaParams): PlanetData[] {
  const pos = (input.positions && typeof input.positions === "object") ? input.positions : {};
  const sun = Number(pos["Sun"] ?? pos["SUN"] ?? 0);
  const moon = Number(pos["Moon"] ?? pos["MOON"] ?? 0);

  // waxing Moon test (simple): elongation Sun->Moon <= 180
  const elong = normalizeDegree(moon - sun);
  const waxing = elong <= 180;

  const planets = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
  return planets
    .filter(p => typeof pos[p] === "number" || typeof pos[p.toUpperCase()] === "number")
    .map((p) => {
      const deg = normalizeDegree(Number(pos[p] ?? pos[p.toUpperCase()] ?? 0));

      // Classical-ish benefic/malefic defaults
      const isBenefic =
        p === "Jupiter" || p === "Venus" ||
        (p === "Mercury") || // keep Mercury benefic for now (you can refine later)
        (p === "Moon" && waxing);

      const isMalefic =
        p === "Saturn" || p === "Mars" || p === "Sun" ||
        (p === "Moon" && !waxing) ||
        p === "Rahu" || p === "Ketu";

      return { name: p, degree: deg, isBenefic, isMalefic };
    });
}

function houseMidpoints(cusps: HouseCusps): Record<number, number> {
  const mid: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) {
    const a = cusps[h];
    const b = cusps[h === 12 ? 1 : (h + 1)];
    mid[h] = midpointForward(a, b);
  }
  return mid;
}

function isInHouse(deg: number, cusps: HouseCusps, house: number): boolean {
  const a = cusps[house];
  const b = cusps[house === 12 ? 1 : (house + 1)];
  const span = forwardArc(a, b);
  const fromA = forwardArc(a, deg);
  return fromA >= 0 && fromA < span;
}

function getPlanetsInHouse(house: number, cusps: HouseCusps, planetPositions: PlanetData[]): PlanetData[] {
  return planetPositions.filter(p => isInHouse(p.degree, cusps, house));
}

// ---------------- 1) Sthana Bala ----------------

const BHAVA_BASE_STRENGTH = 30;
const OCCUPANT_BENEFIC_WEIGHT = 10;
const OCCUPANT_MALEFIC_WEIGHT = -10;

// simple “occupancy-based” sthana (stable & predictable)
export function calculateBhavaSthanaBala(cusps: HouseCusps, planetPositions: PlanetData[]) {
  const result: Record<number, number> = {};
  for (let house = 1; house <= 12; house++) {
    let bala = BHAVA_BASE_STRENGTH;
    const occupants = getPlanetsInHouse(house, cusps, planetPositions);
    for (const p of occupants) {
      if (p.isBenefic) bala += OCCUPANT_BENEFIC_WEIGHT;
      if (p.isMalefic) bala += OCCUPANT_MALEFIC_WEIGHT;
    }
    result[house] = bala;
  }
  return result;
}

// ---------------- 2) Adhipati Bala ----------------
// keep your style, but make it safe + stable
export function calculateBhavaAdhipatiBala(
  houseLords: Record<number, string>,
  planetPositions: PlanetData[],
  shadbalaTotals: Record<string, number>
) {
  const result: Record<number, number> = {};
  for (let house = 1; house <= 12; house++) {
    const lordName = houseLords[house];
    const lord = planetPositions.find(p => p.name === lordName);

    const totalShadbala = Number(shadbalaTotals?.[lordName] ?? 0);

    let bala = 25 + totalShadbala / 10;

    if (lord) {
      if (lord.isBenefic) bala += 5;
      if (lord.isMalefic) bala -= 5;
    }
    result[house] = bala;
  }
  return result;
}

// ---------------- 3) Dig Bala (IBAV 15° segment method) ----------------
// This matches the “pattern” of your friend’s Fortran DIKBAL values.
export function calculateBhavaDigBala(cusps: HouseCusps) {
  const mid = houseMidpoints(cusps);

  // Fortran IBAV table (length 24; J = floor(bh/15)+1 gives 1..24)
  const IBAV = [
    4, 4, 4, 4, 7, 7, 10, 10, 4, 4, 7, 7,
    7, 7, 1, 1, 7, 4, 4, 10, 7, 7, 10, 10
  ];

  const out: Record<number, number> = {};
  for (let house = 1; house <= 12; house++) {
    const bh = normalizeDegree(mid[house] ?? 0);
    const J = Math.floor(bh / 15) + 1; // 1..24

    let K = (IBAV[J - 1] ?? 4) - house;
    if (K < 0) K += 12;
    if (K > 6) K = 12 - K;

    out[house] = 60 * (K / 6); // 0..60
  }
  return out;
}

// ---------------- 4) Drishti Bala ----------------

const HOUSE_ASPECT_FACTORS: Record<string, number> = {
  full: 1.0,
  trine: 0.75,
  square: 0.5,
  sextile: 0.5,
  conjunction: 0.5
};

function getHouseAspectType(diff: number): string | null {
  if (Math.abs(diff - 180) < 5) return "full";
  if (Math.abs(diff - 120) < 5) return "trine";
  if (Math.abs(diff - 90) < 5) return "square";
  if (Math.abs(diff - 60) < 5) return "sextile";
  if (diff < 5) return "conjunction";
  return null;
}

export function calculateBhavaDrishtiBala(cusps: HouseCusps, planetPositions: PlanetData[]) {
  const mid = houseMidpoints(cusps);
  const result: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) result[h] = 0;

  for (let house = 1; house <= 12; house++) {
    const cuspDeg = mid[house] ?? cusps[house] ?? 0;

    for (const planet of planetPositions) {
      const diff = angularSeparation(cuspDeg, planet.degree);
      const type = getHouseAspectType(diff);
      if (!type) continue;

      const base = (HOUSE_ASPECT_FACTORS[type] ?? 0) * 60;

      // benefic adds, malefic subtracts
      if (planet.isBenefic) result[house] += base;
      else if (planet.isMalefic) result[house] -= base;
    }
  }

  return result;
}

// ---------------- 5) Ayana Bala (safe) ----------------
// if declinations not given -> 0
export function calculateBhavaAyanaBala(
  houseLords: Record<number, string>,
  declinations: Record<string, number>,
  planetPositions: PlanetData[]
) {
  const result: Record<number, number> = {};
  for (let house = 1; house <= 12; house++) {
    const lordName = houseLords[house];
    const decl = Number(declinations?.[lordName] ?? 0);

    let bala = (Math.abs(decl) / 24) * 60;

    const lord = planetPositions.find(p => p.name === lordName);
    if (lord) {
      if (lord.isBenefic) bala += 10;
      if (lord.isMalefic) bala -= 10;
    }
    result[house] = Math.max(0, bala);
  }
  return result;
}

// ---------------- 6) Kaala Bala (safe) ----------------
// if lords not supplied -> 0
export function calculateBhavaKaalaBala(params: ComputeBhavaParams) {
  const result: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) result[h] = 0;

  const houseLords = params.houseLords ?? {};
  const addToHouse = (planet?: string) => {
    if (!planet) return;
    for (let h = 1; h <= 12; h++) {
      if (houseLords[h] === planet) result[h] += 15;
    }
  };

  addToHouse(params.yearLord);
  addToHouse(params.monthLord);
  addToHouse(params.weekdayLord);
  addToHouse(params.horaLord);

  const isDay = typeof params.isDay === "boolean" ? params.isDay : !!params.isDayBirth;
  const dayPlanets = ["Sun", "Jupiter", "Mars"];
  const nightPlanets = ["Moon", "Venus", "Saturn"];
  for (const p of (isDay ? dayPlanets : nightPlanets)) addToHouse(p);

  return result;
}

// ---------------- Totals ----------------

export function calculateTotalBhavaBala(components: BhavaComponents) {
  const result: Record<number, number> = {};
  for (let house = 1; house <= 12; house++) {
    result[house] =
      (components.sthana[house] ?? 0) +
      (components.adhipati[house] ?? 0) +
      (components.dig[house] ?? 0) +
      (components.kaala[house] ?? 0) +
      (components.drishti[house] ?? 0) +
      (components.ayana[house] ?? 0);
  }
  return result;
}

// ---------------- Main wrapper (what route.ts calls) ----------------

export function computeBhavabala(params: ComputeBhavaParams) {
  const cusps = toHouseCusps(params);
  const planets = buildPlanetData(params);

  const sthana = calculateBhavaSthanaBala(cusps, planets);
  const adhipati = calculateBhavaAdhipatiBala(params.houseLords ?? {}, planets, params.shadbalaTotals ?? {});
  const dig = calculateBhavaDigBala(cusps);
  const kaala = calculateBhavaKaalaBala(params);
  const drishti = calculateBhavaDrishtiBala(cusps, planets);
  const ayana = calculateBhavaAyanaBala(params.houseLords ?? {}, params.declinations ?? {}, planets);

  const components: BhavaComponents = { sthana, adhipati, dig, kaala, drishti, ayana };
  const totals = calculateTotalBhavaBala(components);

  return { components, totals };
}
