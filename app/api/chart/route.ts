// @ts-nocheck
/* eslint-disable */
/* @ts-ignore */
// @ts-ignore: force global Object

import "server-only";
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // make sure this API runs in Node (not Edge)

import { computeShadbala, computeBhavabala } from "@/app/lib/shadbala-complete";

import { getHouseLords } from "@/app/lib/house-lords";

import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "module";
import { cookies } from "next/headers";

const require = createRequire(import.meta.url);
const swe = require("swisseph");

let SunCalc: any = null;
try {
  SunCalc = require("suncalc");
} catch {
  SunCalc = null;
}

// ---- Swiss setup ----
const EPHE_PATH = path.join(process.cwd(), "ephe");
try {
  swe.swe_set_ephe_path(EPHE_PATH);
} catch {}
try {
  swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
} catch {}

function listEphe(dir: string) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}
const EPHE_FILES = listEphe(EPHE_PATH);

// ---------- Helpers (sync first, else callback) ----------
function callDual(fn: any, args: any[], probe?: (r: any) => any) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof fn !== "function") return reject(new Error("Function not available"));
      try {
        const r = fn(...args);
        const ok = probe ? probe(r) : r;
        if (ok !== undefined && ok !== null) return resolve(r);
      } catch {}
      try {
        fn(...args, (r: any) => resolve(r));
      } catch (e) {
        reject(e);
      }
    } catch (e) {
      reject(e);
    }
  });
}

async function sweCalcUT(jd_ut: number, ipl: number, iflag: number) {
  const fn = swe.swe_calc_ut ?? swe.calc_ut;
  return callDual(
    fn,
    [jd_ut, ipl, iflag],
    (r) => r && (Array.isArray(r.xx) || typeof r.longitude === "number")
  );
}

async function sweHouses(jd_ut: number, lat: number, lon: number, hs: string) {
  const fn = swe.swe_houses ?? swe.houses;
  return callDual(fn, [jd_ut, lat, lon, hs], (r) => {
    const cusp = r?.cusp || r?.cusps || r?.house || r?.houses;
    const asc = Array.isArray(r?.ascmc) ? r.ascmc[0] : r?.ascendant ?? r?.asc;
    return Array.isArray(cusp) && typeof asc === "number";
  });
}

function parseDateTimeFlexible(dateStr: string, timeStr: string, tz: string) {
  const d = (dateStr ?? "").toString().trim();
  const t = (timeStr ?? "").toString().trim().toUpperCase();
  let dt = DateTime.fromISO(`${d}T${t}`, { zone: tz });
  if (!dt.isValid) {
    const dateFormats = ["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "M/d/yyyy", "d/M/yyyy"];
    const timeFormats = [
      "HH:mm:ss",
      "HH:mm",
      "H:mm",
      "h:mm a",
      "h:mm:ss a",
      "hh:mm a",
      "hh:mm:ss a",
    ];
    outer: for (const df of dateFormats) {
      for (const tf of timeFormats) {
        dt = DateTime.fromFormat(`${d} ${t}`, `${df} ${tf}`, { zone: tz });
        if (dt.isValid) break outer;
      }
    }
  }
  return dt.setZone("utc", { keepLocalTime: false });
}

// ---------- Sidereal helpers ----------
const SEG = 30 / 9; // 3°20'
const norm360 = (x: number) => (((x % 360) + 360) % 360);
function signIndex(deg: number) {
  return Math.floor(norm360(deg) / 30);
}
function navamsaLong(d1Long: number) {
  const L = norm360(d1Long);
  const s = signIndex(L);
  const within = L - s * 30;
  const n = Math.floor(within / SEG);
  const movable = [0, 3, 6, 9].includes(s);
  const fixed = [1, 4, 7, 10].includes(s);
  const dual = [2, 5, 8, 11].includes(s);
  let start = s;
  if (fixed) start = (s + 8) % 12;
  if (dual) start = (s + 4) % 12;
  const d9Sign = (start + n) % 12;
  const withinSeg = within - n * SEG;
  const d9Within = withinSeg * 9;
  return d9Sign * 30 + d9Within;
}

// ---------- Planet calculation ----------
function getLongitude(res: any): number | null {
  if (!res) return null;
  if (Array.isArray(res.xx) && Number.isFinite(res.xx[0])) return res.xx[0];
  if (typeof res.longitude === "number" && Number.isFinite(res.longitude)) return res.longitude;
  return null;
}

async function computePlanetsAsync(jd_ut: number, iflag: number) {
  const plist = [
    ["Sun", swe.SE_SUN],
    ["Moon", swe.SE_MOON],
    ["Mercury", swe.SE_MERCURY],
    ["Venus", swe.SE_VENUS],
    ["Mars", swe.SE_MARS],
    ["Jupiter", swe.SE_JUPITER],
    ["Saturn", swe.SE_SATURN],
    ["Uranus", swe.SE_URANUS],
    ["Neptune", swe.SE_NEPTUNE],
    ["Pluto", swe.SE_PLUTO],
    ["Rahu", swe.SE_TRUE_NODE],
  ] as const;

  const positions: Record<string, number> = {};
  const speeds: Record<string, number> = {};
  const declinations: Record<string, number> = {};
  const serrMap: Record<string, string> = {};

  for (const [name, code] of plist) {
    const res: any = await sweCalcUT(jd_ut, code, iflag | swe.SEFLG_SPEED);
    const lon = getLongitude(res);

    if (!Number.isFinite(lon as number)) {
      serrMap[name] = res?.serr || "no longitude returned";
      return { ok: false as const, positions, speeds, declinations, serrMap };
    }

    positions[name] = lon as number;
    declinations[name] = Array.isArray(res.xx) && typeof res.xx[1] === "number" ? res.xx[1] : 0;

    const spRaw =
      Array.isArray(res?.xx) && typeof res.xx[3] === "number"
        ? res.xx[3]
        : typeof (res as any)?.speed === "number"
        ? (res as any).speed
        : typeof (res as any)?.speedLong === "number"
        ? (res as any).speedLong
        : typeof (res as any)?.lonSpeed === "number"
        ? (res as any).lonSpeed
        : typeof (res as any)?.longitudeSpeed === "number"
        ? (res as any).longitudeSpeed
        : NaN;

    const sp = Number.isFinite(spRaw) ? spRaw : 0;

    const ab = name.slice(0, 2);
    speeds[ab] = sp;

    const SHAD_KEY: Record<string, string> = {
      Sun: "SUN",
      Moon: "MOON",
      Mars: "MARS",
      Mercury: "MERCURY",
      Jupiter: "JUPITER",
      Venus: "VENUS",
      Saturn: "SATURN",
      Rahu: "RAHU",
      Ketu: "KETU",
      Uranus: "URANUS",
      Neptune: "NEPTUNE",
      Pluto: "PLUTO",
    };

    const sk = SHAD_KEY[name] ?? name.toUpperCase();
    speeds[sk] = sp;
    speeds[name] = sp;

    if (res.serr) serrMap[name] = res.serr;
  }

  positions["Ketu"] = norm360(positions["Rahu"] + 180);

  speeds["Ra"] = Math.abs(speeds["Ra"] ?? 0);
  speeds["Ke"] = Math.abs(speeds["Ra"] ?? 0);
  speeds["RAHU"] = Math.abs(speeds["RAHU"] ?? 0);
  speeds["KETU"] = Math.abs(speeds["KETU"] ?? 0);

  return { ok: true as const, positions, speeds, declinations, serrMap };
}

// ---------- Nakshatra & Dasha ----------
const NAK_NAMES = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
];

const LORD_SEQ = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
const LORD_YEARS: Record<string, number> = {
  Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17
};

const DEG_PER_NAK = 360/27;
const DEG_PER_PADA = DEG_PER_NAK/4;

function nakFor(deg: number) {
  const L = norm360(deg);
  const idx = Math.floor(L / DEG_PER_NAK);
  const within = L - idx * DEG_PER_NAK;
  const pada = Math.floor(within / DEG_PER_PADA) + 1;
  const lord = LORD_SEQ[idx % 9];
  return { index: idx, name: NAK_NAMES[idx], pada, lord };
}

function buildNakTable(ascDeg: number, pos: Record<string, number>) {
  const bodies = ["Ascendant","Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Rahu","Ketu","Uranus","Neptune","Pluto"];
  return bodies.map(b => {
    const deg = b === "Ascendant" ? ascDeg : pos[b];
    const sIdx = Math.floor(norm360(deg) / 30);
    const signName = [
      "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
      "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
    ][sIdx];
    const { name, lord, pada } = nakFor(deg);
    return { body: b, sign: signName, degree: deg, nakshatra: name, pada, lord };
  });
}

function buildVimDasha(moonDeg: number, startLocal: DateTime) {
  const nk = nakFor(moonDeg);
  const posInNak = norm360(moonDeg) % DEG_PER_NAK;
  const remFrac = (DEG_PER_NAK - posInNak) / DEG_PER_NAK;

  const order = LORD_SEQ;
  const startIdx = order.indexOf(nk.lord);

  const seq = [];
  for (let i = 0; i < 9; i++) {
    const lord = order[(startIdx + i) % 9];
    seq.push({ lord, years: LORD_YEARS[lord] });
  }

  const out = [];
  let cursor = startLocal;

  const firstYears = seq[0].years * remFrac;
  let end = cursor.plus({ days: firstYears * 365.2425 });
  out.push({ lord: seq[0].lord, startISO: cursor.toISO(), endISO: end.toISO() });
  cursor = end;

  for (let i = 1; i < 9; i++) {
    const yrs = seq[i].years;
    end = cursor.plus({ days: yrs * 365.2425 });
    out.push({ lord: seq[i].lord, startISO: cursor.toISO(), endISO: end.toISO() });
    cursor = end;
  }

  return out;
}

// ---------- Major Aspects ----------
const MAJOR_ASPECTS = [
  { name: "Conjunction", angle: 0,   orb: 6 },
  { name: "Opposition",  angle: 180, orb: 6 },
  { name: "Trine",       angle: 120, orb: 5 },
  { name: "Square",      angle: 90,  orb: 5 },
  { name: "Sextile",     angle: 60,  orb: 4 },
];

function deltaDeg(a: number, b: number) {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
}

function buildAspectsPairs(positions: Record<string, number>) {
  const names = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Rahu","Ketu","Uranus","Neptune","Pluto"];
  const pairs = [];

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const A = names[i], B = names[j];
      const la = positions[A], lb = positions[B];
      if (!Number.isFinite(la) || !Number.isFinite(lb)) continue;

      const d = deltaDeg(la, lb);
      for (const asp of MAJOR_ASPECTS) {
        if (Math.abs(d - asp.angle) <= asp.orb) {
          pairs.push({ a: A, b: B, type: asp.name, delta: Number(d.toFixed(2)) });
          break;
        }
      }
    }
  }
  return pairs;
}

function norm24(x: number) {
  return (((x % 24) + 24) % 24);
}

const asObj = (v: any): Record<string, any> =>
  v && typeof v === "object" ? v : {};

const asNumMap = (v: any): Record<string, number> => {
  if (!v || typeof v !== "object") return {};
  const o: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "number") o[k] = val;
  }
  return o;
};

// ---------- POST Handler ----------
export async function POST(req: NextRequest) {
  let out: any = {};
console.log("CHART ROUTE HIT");
  try {
    const body = await req.json();
    let { date, time, timezone, lat, lon, houseSystem = "P" } = body ?? {};

    

    if (!date || !time || !timezone || lat === undefined || lon === undefined) {
  return NextResponse.json({
    engine: "n/a",
    jd_ut: null,
    lstHours: null,
    timezone: timezone ?? "",
    ascendant: null,
    cusps: [],
    positions: {},
    speeds: {},
    shadbala: {},
    bhavabala: {},
    d9Ascendant: null,
    d9Cusps: [],
    d9Positions: {},
    sunriseISO: null,
    sunsetISO: null,
    nakTable: [],
    dasha: null,
    aspects: {}
  });
}



    lat = Number(lat);
    lon = Number(lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return NextResponse.json({ error: "Invalid latitude/longitude." }, { status: 400 });
    }

    houseSystem = String(houseSystem || "P").slice(0, 1).toUpperCase();

    // Parse datetime
    const dtUTC = parseDateTimeFlexible(String(date), String(time), String(timezone));
    if (!dtUTC.isValid) {
      return NextResponse.json(
        { error: "Unrecognized date/time. Try 1936-05-08 and 07:22:00 or 07:22:00 AM." },
        { status: 400 }
      );
    }

    // Local time
    const dtLocal = parseDateTimeFlexible(String(date), String(time), String(timezone)).setZone(String(timezone));

    

        // Compute JD
    const hour = dtUTC.hour + dtUTC.minute / 60 + dtUTC.second / 3600;
    const jd_ut = swe.swe_julday(dtUTC.year, dtUTC.month, dtUTC.day, hour, swe.SE_GREG_CAL);

    // Flags
    const BASE_SIDEREAL = swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL;
    const canUseSWIEPH = EPHE_FILES.some(f => /\.se\d$/.test(f) || /\.sef?$/.test(f));
    const IF_SWIEPH = (canUseSWIEPH ? swe.SEFLG_SWIEPH : 0) | BASE_SIDEREAL;

    // Try SWIEPH only
const tryOrder = [{ name: "SWIEPH", iflag: IF_SWIEPH }];

let engineUsed = "SWIEPH";
let positions: Record<string, number> | null = null;
let speeds: Record<string, number> = {};
let declinations: Record<string, number> | null = null;
let lastError: any = null;

// Helpers (place once inside POST)
const asObj = (v: any): Record<string, any> => (v && typeof v === "object" ? v : {});
const asNumMap = (v: any): Record<string, number> => {
  if (!v || typeof v !== "object") return {};
  const o: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "number") o[k] = val;
  }
  return o;
};

for (const eng of tryOrder) {
  engineUsed = eng.name;

  const attempt = await computePlanetsAsync(jd_ut, eng.iflag);

  if (attempt.ok) {
    positions = asNumMap(attempt.positions);
    speeds = asNumMap(attempt.speeds);
    declinations = asNumMap(attempt.declinations);
    lastError = null;
    break;
  }

  lastError = attempt;
}

// ✅ MUST be OUTSIDE the for-loop
if (!positions || Object.keys(positions).length === 0) {
  const serrMap = asObj(lastError?.serrMap);
  const culprit = Object.keys(serrMap)[0] ?? "Unknown";

  return NextResponse.json(
    {
      error: `Computation failed for ${culprit}.`,
      details: {
        engineTried: engineUsed,
        serr: serrMap[culprit] ?? "no detail",
        ephePath: EPHE_PATH,
        epheFiles: EPHE_FILES,
        jd_ut
      }
    },
    { status: 500 }
  );
}
// ---------- FIX: declinations must never be null ----------
   if (!declinations) declinations = {};

    // ---------- HOUSES (FIXED BLOCK) ----------
let cusps: number[] = [];
let ascendant = 0;
let hRaw: any = null;

try {
  hRaw = swe.swe_houses(jd_ut, lat, lon, houseSystem);
  if (!hRaw) throw new Error("swe_houses returned null");

  const cuspsTrop =
    hRaw.cusp ??
    hRaw.cusps ??
    hRaw.house ??
    hRaw.houses;

  if (!cuspsTrop || !Array.isArray(cuspsTrop) || cuspsTrop.length !== 12) {
    throw new Error("Could not find valid house cusps");
  }

  const ascTrop =
    (Array.isArray(hRaw.ascmc) ? hRaw.ascmc[0] : null) ??
    hRaw.ascendant ??
    hRaw.asc ??
    null;

  if (ascTrop === null || ascTrop === undefined) {
    throw new Error("Could not find ascendant");
  }

  const ayan = swe.swe_get_ayanamsa_ut(jd_ut);

  ascendant = norm360(ascTrop - ayan);

  cusps = cuspsTrop.map((deg: number, idx: number) =>
    idx === 0 ? 0 : norm360(deg - ayan)
  );

  out.houseCusps = cusps;
  out.ascendant = ascendant;

} catch (e: any) {
  return NextResponse.json(
    {
      error: "Computation failed (houses).",
      details: {
        message: e?.message ?? String(e),
        stack: e?.stack ?? "no stack",
        ephePath: EPHE_PATH,
        epheFiles: EPHE_FILES,
        jd_ut,
        lat,
        lon,
        houseSystem
      }
    },
    { status: 500 }
  );
}

// ⭐ FIX: ascSign must be defined OUTSIDE the try block
const ascSign = Math.floor(norm360(ascendant) / 30);

    // Navamsa
const d9Positions: Record<string, number> = {};
Object.entries(positions ?? {}).forEach(([name, d]) => {
  d9Positions[name] = navamsaLong(d as number);
});

    const d9Ascendant = navamsaLong(ascendant);
    const d9Cusps = Array(13).fill(0);
    const d9AscSign = Math.floor(d9Ascendant / 30);
    for (let i = 1; i <= 12; i++) {
      d9Cusps[i] = ((d9AscSign * 30) + (i - 1) * 30) % 360;
    }

    // Sidereal time
    let gstRes: any = 0;
    try {
      if (typeof swe.swe_sidtime === "function") gstRes = swe.swe_sidtime(jd_ut);
      else if (typeof swe.sidtime === "function") gstRes = swe.sidtime(jd_ut);
    } catch {}

    const gstHours =
      typeof gstRes === "number"
        ? gstRes
        : (typeof gstRes?.siderealTime === "number"
            ? gstRes.siderealTime
            : (typeof gstRes?.sidtime === "number" ? gstRes.sidtime : 0));

    const lstHours = norm24(gstHours + (lon / 15));

    // Nakshatra table
    const nakTable = buildNakTable(ascendant, positions);

    // Dasha
    const moonLon = positions["Moon"];
    const dasha = buildVimDasha(moonLon, dtLocal);

    // Sunrise / Sunset
    let sunriseISO: string | null = null;
    let sunsetISO: string | null = null;

    if (SunCalc) {
      try {
        const localDate = DateTime.fromObject(
          { year: dtLocal.year, month: dtLocal.month, day: dtLocal.day },
          { zone: String(timezone) }
        );
        const times = SunCalc.getTimes(localDate.toJSDate(), lat, lon);
        sunriseISO = DateTime.fromJSDate(times.sunrise).setZone(String(timezone)).toISO();
        sunsetISO = DateTime.fromJSDate(times.sunset).setZone(String(timezone)).toISO();
      } catch {}
    }

    // Aspects
    const aspects = buildAspectsPairs(positions);

    // Planet → House mapping
    const planetHouses: Record<string, number> = {};

    function getHouseForDegree(deg: number, cusps: number[]) {
      for (let h = 1; h <= 12; h++) {
        const start = cusps[h];
        const end = cusps[h === 12 ? 1 : h + 1];
        if (start < end) {
          if (deg >= start && deg < end) return h;
        } else {
          if (deg >= start || deg < end) return h;
        }
      }
      return 1;
    }

    for (const p in positions) {
      planetHouses[p] = getHouseForDegree(positions[p], cusps);
    }
    const positionsUC: Record<string, number> = {};
for (const [k, v] of Object.entries(positions ?? {})) {
  positionsUC[k] = Number(v);
  positionsUC[k.toUpperCase()] = Number(v);
}
 const planets: Record<string, { lon: number; speed: number }> = {};
for (const [name, lon] of Object.entries(positions ?? {})) {
  const sp =
    (speeds as any)?.[name] ??
    (speeds as any)?.[name.toUpperCase?.() as any] ??
    0;
  planets[name] = { lon: Number(lon), speed: Number(sp) };
}   

    // --- SHADBALA INPUT (FULL, CORRECT) ---
const shadInput = {
  planets,
  ascendant,
  cusps,
  positions,
  speeds,
  aspects,
  isDayBirth: dtLocal.hour >= 6 && dtLocal.hour < 18,
  houses: planetHouses,
  houseLords: getHouseLords(ascSign),
  houseAspects: {},
  declinations,
  dateStr: String(date),
  timeStr: String(time),
  sunriseISO,
  sunsetISO,
  jd_ut,
  localTimeHours: dtLocal.hour + dtLocal.minute / 60 + dtLocal.second / 3600,

};

console.log("SPEEDS CHECK:", JSON.stringify(speeds).slice(0, 300));

// --- DIAGNOSTIC COMPUTE SHADBALA ---
let shadbala: any = {};
let shadbalaTotals: Record<string, number> = {};

try {
  console.log("DIAGNOSTIC: Attempting computeShadbala with shadInput keys:", Object.keys(shadInput));
  
  const sb = computeShadbala(shadInput);
  
  // This will tell us if the engine is actually returning data
  if (sb && typeof sb === "object" && Object.keys(sb).length > 0) {
    console.log("DIAGNOSTIC: Math engine returned data for:", Object.keys(sb));
    shadbala = sb;
    
    // Fill the totals for your interpretation section
    for (const planet of Object.keys(shadbala)) {
      const p = shadbala[planet];
      if (p && typeof p.total === "number") {
        shadbalaTotals[planet] = p.total;
      }
    }
  } else {
    console.warn("DIAGNOSTIC: Math engine returned EMPTY object.");
    // This will force a row to appear so we know the UI works
    shadbala = {
      "SYSTEM_CHECK": { sthana: 1.1, dig: 2.2, kala: 3.3, chesta: 4.4, naisargika: 5.5, drik: 6.6, total: 23.1, rupas: 0.38 }
    };
  }
} catch (e: any) {
  console.error("DIAGNOSTIC: Math engine CRASHED with error:", e.message);
  // This will show the error message directly in your table
  shadbala = {
  ENGINE_ERROR: {
    sthana: 0,
    dig: 0,
    kala: 0,
    chesta: 0,
    naisargika: 0,
    drik: 0,
    total: 0,
    rupas: 0,
    ERROR_MSG: String(e?.message ?? e)
  }
};
}
// --- BHAVA BALA (SAFE) ---
let bhavabala: any = {};
try {
  const bb = computeBhavabala({
  ...shadInput,
  positions: positions ?? {},
  cusps: cusps ?? [],
});
  bhavabala = bb && typeof bb === "object" ? bb : {};
} catch (e) {
  console.error("BHAVA BALA ERROR:", e);
  bhavabala = {};
}

  

    // --- 2. PREPARE SAFE DATA ---
    const safePositions = positions && typeof positions === "object" ? positions : {};
    const safeSpeeds = speeds && typeof speeds === "object" ? speeds : {};
    const safeCusps = Array.isArray(cusps) ? cusps : [];
    const safeAspects = aspects && typeof aspects === "object" ? aspects : {};

    // --- FINAL RESPONSE (MATCHED TO ShadbalaSection.tsx) ---
    return NextResponse.json({
      engine: engineUsed,
      jd_ut,
      lstHours,
      timezone,
      ascendant,
      cusps: safeCusps,
      positions: safePositions,
      speeds: safeSpeeds,
      // We send 'shadbala' as a flat object so Object.keys(data) works in the UI
      shadbala: shadbala || {}, 
      bhavabala: bhavabala || {},
      d9Ascendant,
      d9Cusps,
      d9Positions,
      sunriseISO,
      sunsetISO,
      nakTable,
      dasha,
      aspects: safeAspects
    });

  } catch (err: any) {
    console.error("CHART ROUTE ERROR:", err);
    return NextResponse.json(
      {
        error: err?.message ?? String(err),
        stack: err?.stack ?? "no stack"
      },
      { status: 500 }
    );
  }
}