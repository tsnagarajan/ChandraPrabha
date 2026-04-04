// =============================================
// app/lib/vivaha/dosha.ts
// Dosha calculations for Vivaha Porutham
// Mangal Dosha, Dasa Sandhi, Papasamya
// =============================================

import { PAPA_HOUSES, PAPA_PLANETS } from './tables';

// =============================================
// HELPER — Get house number of a planet
// from a reference point
// =============================================

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function getHouseFrom(planetLon: number, refLon: number): number {
  const planetSign = Math.floor(norm360(planetLon) / 30);
  const refSign = Math.floor(norm360(refLon) / 30);
  return ((planetSign - refSign + 12) % 12) + 1;
}

// =============================================
// MANGAL DOSHA
// =============================================

export interface MangalResult {
  isManglik: boolean;
  house: number;
  cancelled: boolean;
  reason: string;
  cancellationReasons: string[];
}

export function checkMangalDosha(
  positions: Record<string, number>,
  ascendant: number
): MangalResult {
  const marsLon = positions["Mars"];
  if (marsLon === undefined) {
    return { isManglik:false, house:0, cancelled:false, reason:"Mars position unavailable", cancellationReasons:[] };
  }

  const ascSign = Math.floor(norm360(ascendant) / 30);
  const marsSign = Math.floor(norm360(marsLon) / 30);
  const house = ((marsSign - ascSign + 12) % 12) + 1;
  const isManglik = [1,2,4,7,8,12].includes(house);

  const cancellationReasons: string[] = [];

  if (!isManglik) {
    return { isManglik, house, cancelled:false, reason:`Mars in house ${house} — not Manglik`, cancellationReasons };
  }

  // Check cancellation rules
  // 1. Mars in own sign (Aries=0, Scorpio=7)
  if (marsSign === 0 || marsSign === 7) {
    cancellationReasons.push(`Mars in own sign (${marsSign===0?'Aries':'Scorpio'}) cancels dosha`);
  }

  // 2. Mars exalted in Capricorn (9)
  if (marsSign === 9) {
    cancellationReasons.push(`Mars exalted in Capricorn — dosha reduced`);
  }

  // 3. Mars debilitated in Cancer (3)
  if (marsSign === 3) {
    cancellationReasons.push(`Mars debilitated in Cancer — dosha cancelled`);
  }

  // 4. Jupiter aspecting Mars (Jupiter in 5th or 9th from Mars)
  const jupLon = positions["Jupiter"];
  if (jupLon !== undefined) {
    const jupSign = Math.floor(norm360(jupLon) / 30);
    const jupFromMars = ((jupSign - marsSign + 12) % 12) + 1;
    if ([5,9].includes(jupFromMars)) {
      cancellationReasons.push(`Jupiter aspecting Mars — dosha cancelled`);
    }
  }

  // 5. Mars with or aspected by Venus
  const venLon = positions["Venus"];
  if (venLon !== undefined) {
    const venSign = Math.floor(norm360(venLon) / 30);
    const venFromMars = ((venSign - marsSign + 12) % 12) + 1;
    if (venSign === marsSign || venFromMars === 7) {
      cancellationReasons.push(`Venus conjunct or opposite Mars — dosha reduced`);
    }
  }

  const cancelled = cancellationReasons.length > 0;
  const reason = cancelled
    ? `Mars in house ${house} — Manglik (${cancellationReasons[0]})`
    : `Mars in house ${house} from Lagna`;

  return { isManglik, house, cancelled, reason, cancellationReasons };
}

// =============================================
// DASA SANDHI CHECK
// =============================================

export interface DasaSandhiResult {
  isSatisfactory: boolean;
  reason: string;
  girlDasha: string;
  boyDasha: string;
  girlDashaEnd: string;
  boyDashaEnd: string;
  gapMonths: number;
}

export function checkDasaSandhi(
  girlDasha: any[],
  boyDasha: any[]
): DasaSandhiResult {
  if (!girlDasha?.length || !boyDasha?.length) {
    return {
      isSatisfactory: true,
      reason: "Dasha data unavailable",
      girlDasha: "—", boyDasha: "—",
      girlDashaEnd: "—", boyDashaEnd: "—",
      gapMonths: 0
    };
  }

  const now = new Date();

  const girlCurrent = girlDasha.find((d: any) =>
    new Date(d.startISO) <= now && now < new Date(d.endISO)
  );
  const boyCurrent = boyDasha.find((d: any) =>
    new Date(d.startISO) <= now && now < new Date(d.endISO)
  );

  if (!girlCurrent || !boyCurrent) {
    return {
      isSatisfactory: true,
      reason: "Could not determine current dasha",
      girlDasha: "—", boyDasha: "—",
      girlDashaEnd: "—", boyDashaEnd: "—",
      gapMonths: 0
    };
  }

  const girlEnd = new Date(girlCurrent.endISO);
  const boyEnd = new Date(boyCurrent.endISO);
  const diffMs = Math.abs(girlEnd.getTime() - boyEnd.getTime());
  const gapMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  const isSatisfactory = gapMonths >= 18;

  return {
    isSatisfactory,
    reason: isSatisfactory
      ? `Dasha gap is ${gapMonths} months — satisfactory (need >18 months)`
      : `Dasha gap is only ${gapMonths} months — Dasa Sandhi Dosha risk`,
    girlDasha: girlCurrent.lord,
    boyDasha: boyCurrent.lord,
    girlDashaEnd: girlEnd.toLocaleDateString(),
    boyDashaEnd: boyEnd.toLocaleDateString(),
    gapMonths
  };
}

// =============================================
// PAPASAMYA — Balance of Malefic Influences
// =============================================

export interface PapasamyaResult {
  girlPapa: number;
  boyPapa: number;
  girlTable: PapaRow[];
  boyTable: PapaRow[];
  verdict: string;
  isSatisfactory: boolean;
}

export interface PapaRow {
  planet: string;
  fromLagna: number;
  fromLagnaPapa: number;
  fromMoon: number;
  fromMoonPapa: number;
  fromVenus: number;
  fromVenusPapa: number;
}

function calcPapaPoints(
  positions: Record<string, number>,
  ascendant: number
): { total: number; rows: PapaRow[] } {
  const moonLon = positions["Moon"] ?? ascendant;
  const venusLon = positions["Venus"] ?? ascendant;

  let total = 0;
  const rows: PapaRow[] = [];

  for (const planet of PAPA_PLANETS) {
    const pLon = positions[planet];
    if (pLon === undefined) continue;

    const fromLagna = getHouseFrom(pLon, ascendant);
    const fromMoon = getHouseFrom(pLon, moonLon);
    const fromVenus = getHouseFrom(pLon, venusLon);

    const fromLagnaPapa = PAPA_HOUSES.includes(fromLagna) ? 1 : 0;
    const fromMoonPapa = PAPA_HOUSES.includes(fromMoon) ? 1 : 0;
    const fromVenusPapa = PAPA_HOUSES.includes(fromVenus) ? 1 : 0;

    total += fromLagnaPapa + fromMoonPapa + fromVenusPapa;

    rows.push({
      planet,
      fromLagna, fromLagnaPapa,
      fromMoon, fromMoonPapa,
      fromVenus, fromVenusPapa
    });
  }

  return { total, rows };
}

export function checkPapasamya(
  girlPositions: Record<string, number>,
  girlAscendant: number,
  boyPositions: Record<string, number>,
  boyAscendant: number
): PapasamyaResult {
  const girl = calcPapaPoints(girlPositions, girlAscendant);
  const boy = calcPapaPoints(boyPositions, boyAscendant);

  let verdict: string;
  let isSatisfactory: boolean;

  const diff = Math.abs(girl.total - boy.total);

  if (diff <= 1) {
    verdict = "Papasamya is balanced — Satisfactory";
    isSatisfactory = true;
  } else if (boy.total > girl.total) {
    verdict = `Boy has more Papa points (${boy.total}) than Girl (${girl.total}) — Excellent (boy protects girl)`;
    isSatisfactory = true;
  } else {
    verdict = `Girl has more Papa points (${girl.total}) than Boy (${boy.total}) — Not Satisfactory`;
    isSatisfactory = false;
  }

  return {
    girlPapa: girl.total,
    boyPapa: boy.total,
    girlTable: girl.rows,
    boyTable: boy.rows,
    verdict,
    isSatisfactory
  };
}
