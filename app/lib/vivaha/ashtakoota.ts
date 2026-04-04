// =============================================
// app/lib/vivaha/ashtakoota.ts
// Ashta Koota (Guna Milan) calculation engine
// North Indian marriage compatibility
// =============================================

import {
  NAK_GANA, GANA_NAME, NAK_YONI, YONI_ENEMIES,
  NAK_NADI, NADI_NAME, RASI_LORD, RASI_VARNA, VARNA_NAME,
  VASHYA_CAT, VASHYA_SCORE, PERM_FRIENDS, PERM_ENEMIES
} from './tables';

import { permRel } from './porutham';

// =============================================
// KOOTA RESULT TYPE
// =============================================

export interface KootaResult {
  name: string;
  maxPoints: number;
  points: number;
  result: string;
  reason: string;
  dosha?: string;
}

// =============================================
// YONI SCORE MAP (built once)
// =============================================

const ALL_YONIS = [
  "Horse","Elephant","Goat","Snake","Dog","Cat",
  "Rat","Cow","Buffalo","Tiger","Deer","Monkey","Mongoose","Lion"
];

const YONI_SCORE_MAP: Record<string,Record<string,number>> = {};
ALL_YONIS.forEach(y1 => {
  YONI_SCORE_MAP[y1] = {};
  ALL_YONIS.forEach(y2 => {
    if (y1===y2) YONI_SCORE_MAP[y1][y2]=4;
    else if (YONI_ENEMIES[y1]===y2 || YONI_ENEMIES[y2]===y1) YONI_SCORE_MAP[y1][y2]=0;
    else YONI_SCORE_MAP[y1][y2]=2;
  });
});

// =============================================
// EIGHT KOOTA CALCULATIONS
// =============================================

// 1. Varna — 1 point
export function calcVarna(gRasi: number, bRasi: number): KootaResult {
  const gV=RASI_VARNA[gRasi], bV=RASI_VARNA[bRasi];
  const points = bV <= gV ? 1 : 0;
  return {
    name: "Varna", maxPoints: 1, points,
    result: points===1 ? "Match" : "No Match",
    reason: `Girl: ${VARNA_NAME[gV]}, Boy: ${VARNA_NAME[bV]}`
  };
}

// 2. Vashya — 2 points
export function calcVashya(gRasi: number, bRasi: number): KootaResult {
  const gC=VASHYA_CAT[gRasi], bC=VASHYA_CAT[bRasi];
  const points = VASHYA_SCORE[gC]?.[bC] ?? 0;
  return {
    name: "Vashya", maxPoints: 2, points,
    result: points>=2?"Excellent":points>=1?"Good":points>0?"Moderate":"Poor",
    reason: `Girl: ${gC}, Boy: ${bC}`
  };
}

// 3. Tara — 3 points
export function calcTara(gNak: number, bNak: number): KootaResult {
  const taraFromG = ((bNak - gNak + 27) % 27) + 1;
  const taraFromB = ((gNak - bNak + 27) % 27) + 1;
  const bad = [3,5,7];
  const gBad = bad.includes(((taraFromG-1)%9)+1);
  const bBad = bad.includes(((taraFromB-1)%9)+1);
  let points = 3;
  if (gBad && bBad) points=0;
  else if (gBad || bBad) points=1.5;
  return {
    name: "Tara (Dina)", maxPoints: 3, points,
    result: points===3?"Excellent":points===1.5?"Moderate":"Poor",
    reason: `Distance G→B: ${taraFromG}, B→G: ${taraFromB}`
  };
}

// 4. Yoni — 4 points
export function calcYoniKoota(gNak: number, bNak: number): KootaResult {
  const gY=NAK_YONI[gNak], bY=NAK_YONI[bNak];
  const points = YONI_SCORE_MAP[gY]?.[bY] ?? 2;
  return {
    name: "Yoni", maxPoints: 4, points,
    result: points===4?"Excellent":points===2?"Moderate":"Poor",
    reason: `Girl: ${gY}, Boy: ${bY}`
  };
}

// 5. Graha Maitri — 5 points
export function calcGrahaMaitri(
  gRasi: number, bRasi: number,
  gPositions: Record<string,number>,
  bPositions: Record<string,number>
): KootaResult {
  const gLord=RASI_LORD[gRasi], bLord=RASI_LORD[bRasi];
  let points=0, result="", reason="";
  if (gLord===bLord) {
    points=5; result="Excellent"; reason=`Same lord: ${gLord}`;
  } else {
    const r1=permRel(gLord,bLord);
    const r2=permRel(bLord,gLord);
    const avg=(r1+r2)/2;
    if (avg>=1)   { points=5; result="Excellent"; }
    else if (avg===0.5) { points=4; result="Good"; }
    else if (avg===0)   { points=3; result="Neutral"; }
    else if (avg===-0.5){ points=0.5; result="Poor"; }
    else                { points=0; result="Very Poor"; }
    reason=`${gLord} & ${bLord}`;
  }
  return { name:"Graha Maitri", maxPoints:5, points, result, reason };
}

// 6. Gana — 6 points
const GANA_SCORE: number[][] = [
  [6,5,1],  // Deva vs Deva, Manushya, Rakshasa
  [5,6,0],  // Manushya vs Deva, Manushya, Rakshasa
  [1,0,6],  // Rakshasa vs Deva, Manushya, Rakshasa
];

export function calcGanaKoota(gNak: number, bNak: number): KootaResult {
  const gG=NAK_GANA[gNak], bG=NAK_GANA[bNak];
  const points=GANA_SCORE[gG][bG];
  const dosha = points===0 ? "Gana Dosha" : undefined;
  return {
    name: "Gana", maxPoints: 6, points,
    result: points===6?"Excellent":points>=4?"Good":points>=1?"Poor":"Gana Dosha",
    reason: `Girl: ${GANA_NAME[gG]}, Boy: ${GANA_NAME[bG]}`,
    dosha
  };
}

// 7. Bhakoot — 7 points
export function calcBhakoot(gRasi: number, bRasi: number): KootaResult {
  const dist1=((bRasi-gRasi+12)%12)+1;
  const dist2=((gRasi-bRasi+12)%12)+1;
  const isBad=[
    [2,12],[12,2],[5,9],[9,5],[6,8],[8,6]
  ].some(([a,b])=>dist1===a&&dist2===b);

  // Bhakoot Dosha cancellation check
  const gLord=RASI_LORD[gRasi], bLord=RASI_LORD[bRasi];
  const cancelled = isBad && (gLord===bLord || permRel(gLord,bLord)===1);

  const points = !isBad || cancelled ? 7 : 0;
  const dosha = isBad && !cancelled ? "Bhakoot Dosha" : undefined;

  return {
    name: "Bhakoot (Rasi)", maxPoints: 7, points,
    result: !isBad?"Excellent":cancelled?"Dosha Cancelled":"Bhakoot Dosha",
    reason: `Rasi distance: ${dist1}/${dist2}${cancelled?" — dosha cancelled by friendly lords":""}`,
    dosha
  };
}

// 8. Nadi — 8 points
export function calcNadi(gNak: number, bNak: number): KootaResult {
  const gN=NAK_NADI[gNak], bN=NAK_NADI[bNak];
  const isDosha=gN===bN;

  // Nadi Dosha cancellation: different Rasi OR different Nakshatra
  // (will be checked in calling code if Rasi data available)
  const points=isDosha?0:8;
  const dosha = isDosha ? "Nadi Dosha" : undefined;

  return {
    name: "Nadi", maxPoints: 8, points,
    result: isDosha?"Nadi Dosha!":"Excellent",
    reason: `Girl: ${NADI_NAME[gN]}, Boy: ${NADI_NAME[bN]} — ${isDosha?"same Nadi (dosha)":"different Nadi"}`,
    dosha
  };
}

// =============================================
// MAIN FUNCTION — Calculate all 8 Kootas
// =============================================

export function calcAshtaKoota(
  gNak: number, gRasi: number,
  bNak: number, bRasi: number,
  gPositions: Record<string,number>,
  bPositions: Record<string,number>
): KootaResult[] {
  return [
    calcVarna(gRasi, bRasi),
    calcVashya(gRasi, bRasi),
    calcTara(gNak, bNak),
    calcYoniKoota(gNak, bNak),
    calcGrahaMaitri(gRasi, bRasi, gPositions, bPositions),
    calcGanaKoota(gNak, bNak),
    calcBhakoot(gRasi, bRasi),
    calcNadi(gNak, bNak),
  ];
}

// =============================================
// SCORE INTERPRETATION
// =============================================

export function interpretAshtaKoota(total: number): string {
  if (total >= 33) return "Excellent match — rare and highly auspicious";
  if (total >= 30) return "Very good match — highly compatible";
  if (total >= 25) return "Good match — strong foundation";
  if (total >= 21) return "Acceptable match — check specific doshas";
  if (total >= 18) return "Below average — requires effort and understanding";
  return "Not recommended — fundamental incompatibilities";
}
