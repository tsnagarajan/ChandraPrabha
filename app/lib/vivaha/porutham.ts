// =============================================
// app/lib/vivaha/porutham.ts
// Ten Porutham calculation engine
// South Indian marriage compatibility
// =============================================

import {
  NAK_NAMES, RASI_NAMES, NAK_GANA, GANA_NAME,
  NAK_YONI, NAK_YONI_GENDER, YONI_ENEMIES,
  NAK_RAJJU, VEDHA_PAIRS, RASI_LORD,
  VASIYA_MAP, PERM_FRIENDS, PERM_ENEMIES
} from './tables';

// =============================================
// RELATIONSHIP HELPERS
// =============================================

export function permRel(p1: string, p2: string): number {
  if (PERM_FRIENDS[p1]?.includes(p2)) return 1;
  if (PERM_ENEMIES[p1]?.includes(p2)) return -1;
  return 0;
}

export function tempRel(p1Lon: number, p2Lon: number): number {
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const p1Sign = Math.floor(norm(p1Lon) / 30);
  const p2Sign = Math.floor(norm(p2Lon) / 30);
  const dist = ((p2Sign - p1Sign + 12) % 12) + 1;
  return [2,3,4,10,11,12].includes(dist) ? 1 : -1;
}

export function compoundRel(p1: string, p2: string, p1Lon: number, p2Lon: number): string {
  const perm = permRel(p1, p2);
  const temp = tempRel(p1Lon, p2Lon);
  const sum = perm + temp;
  if (sum >= 2) return "Adhi Mitra";
  if (sum === 1) return "Mitra";
  if (sum === 0) return "Sama";
  if (sum === -1) return "Shatru";
  return "Adhi Shatru";
}

export function compoundRelScore(rel: string): number {
  if (rel === "Adhi Mitra") return 2;
  if (rel === "Mitra") return 1;
  if (rel === "Sama") return 0;
  if (rel === "Shatru") return -1;
  return -2;
}

// =============================================
// PORUTHAM RESULT TYPE
// =============================================

export interface PoruthamResult {
  name: string;
  tamil: string;
  result: "Uttamam" | "Madhyam" | "No Match";
  reason: string;
  importance: string;
}

// =============================================
// TEN PORUTHAM CALCULATIONS
// =============================================

export function calcDinam(gNak: number, bNak: number): PoruthamResult {
  const count = ((bNak - gNak + 27) % 27) + 1;
  const uttamam = [2,4,6,8,9,11,13,15,18,20,22,26,27];
  const noMatch = [1,3,5,7,10,12,14,16,17,19,21,23,24,25];
  const result = uttamam.includes(count) ? "Uttamam" : noMatch.includes(count) ? "No Match" : "Madhyam";
  const suffix = count===1?'st':count===2?'nd':count===3?'rd':'th';
  return {
    name: "Dina Porutham", tamil: "தின பொருத்தம்", result,
    reason: `Boy's star falls as ${count}${suffix} from Girl's star`,
    importance: "Health & Longevity"
  };
}

export function calcGanam(gNak: number, bNak: number): PoruthamResult {
  const gG = NAK_GANA[gNak], bG = NAK_GANA[bNak];
  const dinaCount = ((bNak - gNak + 27) % 27) + 1;
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (gG === bG) { result="Uttamam"; reason=`Both ${GANA_NAME[gG]} Gana`; }
  else if (gG===0 && bG===1) { result="Uttamam"; reason="Girl Deva, Boy Manushya — compatible"; }
  else if (gG===1 && bG===0) { result="Madhyam"; reason="Girl Manushya, Boy Deva — moderate"; }
  else if (gG===2 && bG===1 && dinaCount >= 14) { result="Madhyam"; reason=`Girl Asura, Boy Manushya — acceptable (boy's star is ${dinaCount}th from girl's)`; }
  else { result="No Match"; reason=`${GANA_NAME[gG]} & ${GANA_NAME[bG]} — incompatible`; }
  return { name:"Gana Porutham", tamil:"கண பொருத்தம்", result, reason, importance:"Temperament" };
}

export function calcMahendra(gNak: number, bNak: number): PoruthamResult {
  const count = ((bNak - gNak + 27) % 27) + 1;
  const good = [4,7,10,13,16,19,22,25];
  const result = good.includes(count) ? "Uttamam" : "No Match";
  const suffix = count===1?'st':count===2?'nd':count===3?'rd':'th';
  return {
    name: "Mahendra Porutham", tamil: "மஹேந்திர பொருத்தம்", result,
    reason: `Boy's star is ${count}${suffix} from Girl's`,
    importance: "Children & Prosperity"
  };
}

export function calcStreeDheergam(gNak: number, bNak: number): PoruthamResult {
  const count = ((bNak - gNak + 27) % 27) + 1;
  const result = count > 13 ? "Uttamam" : count >= 7 ? "Madhyam" : "No Match";
  return {
    name: "Stree Dheergam", tamil: "ஸ்த்ரீ தீர்க்க பொருத்தம்", result,
    reason: `Boy's star is ${count} from Girl's (need >13 for Uttamam)`,
    importance: "Wife's Prosperity"
  };
}

export function calcYoni(gNak: number, bNak: number): PoruthamResult {
  const gY=NAK_YONI[gNak], bY=NAK_YONI[bNak];
  const gGender=NAK_YONI_GENDER[gNak], bGender=NAK_YONI_GENDER[bNak];
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (gY===bY) { result="Uttamam"; reason=`Both ${gY} Yoni`; }
  else if (YONI_ENEMIES[gY]===bY || YONI_ENEMIES[bY]===gY) {
    result="No Match"; reason=`${gY} and ${bY} are enemy Yonis`;
  }
  else if (bGender==="M" && gGender==="F") { result="Uttamam"; reason=`Male Yoni (${bY}) + Female Yoni (${gY})`; }
  else if (bGender==="M" && gGender==="M") { result="Madhyam"; reason=`Both Male Yoni (${bY}, ${gY})`; }
  else { result="Madhyam"; reason=`${bY} and ${gY} — moderate`; }
  return { name:"Yoni Porutham", tamil:"யோனி பொருத்தம்", result, reason, importance:"Physical Compatibility" };
}

export function calcRasi(gRasi: number, bRasi: number): PoruthamResult {
  const count = ((bRasi - gRasi + 12) % 12) + 1;
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (count===1||count===7) { result="Uttamam"; reason=`Boy's Rasi is ${count}th from Girl's — excellent`; }
  else if (count===3||count===4) { result="Madhyam"; reason=`Boy's Rasi is ${count}th — moderate`; }
  else if ([2,5,6,8,12].includes(count)) { result="No Match"; reason=`Boy's Rasi is ${count}th — unfavourable`; }
  else { result="Uttamam"; reason=`Boy's Rasi is ${count}th from Girl's`; }
  return { name:"Rasi Porutham", tamil:"ராசி பொருத்தம்", result, reason, importance:"General Prosperity" };
}

export function calcRasiathipathi(
  gRasi: number, bRasi: number,
  gPositions: Record<string,number>,
  bPositions: Record<string,number>
): PoruthamResult {
  const gLord = RASI_LORD[gRasi];
  const bLord = RASI_LORD[bRasi];
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (gLord===bLord) {
    result="Uttamam"; reason=`Same Rasi lord: ${gLord}`;
  } else {
    const gLon = gPositions[gLord] ?? 0;
    const bLon = bPositions[bLord] ?? 0;
    const rel1 = compoundRel(gLord, bLord, gLon, bLon);
    const rel2 = compoundRel(bLord, gLord, bLon, gLon);
    const score = (compoundRelScore(rel1) + compoundRelScore(rel2)) / 2;
    if (score >= 1) { result="Uttamam"; reason=`${gLord} and ${bLord} are friends (${rel1}/${rel2})`; }
    else if (score >= 0) { result="Madhyam"; reason=`${gLord} and ${bLord} are neutral (${rel1}/${rel2})`; }
    else if (score >= -1) { result="Madhyam"; reason=`${gLord} and ${bLord} — one-sided enmity (${rel1}/${rel2})`; }
    else { result="No Match"; reason=`${gLord} and ${bLord} are enemies (${rel1}/${rel2})`; }
  }
  return { name:"Rasiyathipathi", tamil:"ராசியாதிபதி பொருத்தம்", result, reason, importance:"Mental Compatibility" };
}

export function calcVasiyam(gRasi: number, bRasi: number): PoruthamResult {
  const bVasiyaToG = VASIYA_MAP[gRasi]?.includes(bRasi);
  const gVasiyaToB = VASIYA_MAP[bRasi]?.includes(gRasi);
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (bVasiyaToG) { result="Uttamam"; reason=`Boy's Rasi (${RASI_NAMES[bRasi]}) is Vasiya to Girl's (${RASI_NAMES[gRasi]})`; }
  else if (gVasiyaToB) { result="Madhyam"; reason=`Girl's Rasi is Vasiya to Boy's — moderate`; }
  else { result="No Match"; reason=`No Vasiya relation between ${RASI_NAMES[gRasi]} and ${RASI_NAMES[bRasi]}`; }
  return { name:"Vasiyam", tamil:"வசிய பொருத்தம்", result, reason, importance:"Mutual Attraction" };
}

export function calcRajju(gNak: number, bNak: number): PoruthamResult {
  const gR=NAK_RAJJU[gNak], bR=NAK_RAJJU[bNak];
  if (gR!==bR) {
    return {
      name:"Rajju Porutham", tamil:"ரஜ்ஜு பொருத்தம்", result:"Uttamam",
      reason:`Girl: ${gR} Rajju, Boy: ${bR} Rajju — different, no dosha`,
      importance:"Most Important"
    };
  }
  const effects: Record<string,string> = {
    "Siro":"Husband's longevity affected",
    "Kanda":"Wife's longevity affected",
    "Uthara":"Children (Putra Dosha)",
    "Thodia":"Loss of property",
    "Patha":"Dangers from travel"
  };
  return {
    name:"Rajju Porutham", tamil:"ரஜ்ஜு பொருத்தம்", result:"No Match",
    reason:`Both in ${gR} Rajju — Rajju Dosha! ${effects[gR]||''}`,
    importance:"Most Important"
  };
}

export function calcVedhai(gNak: number, bNak: number): PoruthamResult {
  const isVedha = VEDHA_PAIRS.some(([a,b]) => (a===gNak&&b===bNak)||(b===gNak&&a===bNak));
  return {
    name:"Vedhai Porutham", tamil:"வேதை பொருத்தம்",
    result: isVedha ? "No Match" : "Uttamam",
    reason: isVedha
      ? `${NAK_NAMES[gNak]} and ${NAK_NAMES[bNak]} are Vedha pairs`
      : `No Vedha between ${NAK_NAMES[gNak]} and ${NAK_NAMES[bNak]}`,
    importance: "Warding off Misfortune"
  };
}

// =============================================
// MAIN FUNCTION — Calculate all 10 Poruthams
// =============================================

export function calcAllPorutham(
  gNak: number, gRasi: number,
  bNak: number, bRasi: number,
  gPositions: Record<string,number>,
  bPositions: Record<string,number>
): PoruthamResult[] {
  return [
    calcDinam(gNak, bNak),
    calcGanam(gNak, bNak),
    calcMahendra(gNak, bNak),
    calcStreeDheergam(gNak, bNak),
    calcYoni(gNak, bNak),
    calcRasi(gRasi, bRasi),
    calcRasiathipathi(gRasi, bRasi, gPositions, bPositions),
    calcVasiyam(gRasi, bRasi),
    calcRajju(gNak, bNak),
    calcVedhai(gNak, bNak),
  ];
}
