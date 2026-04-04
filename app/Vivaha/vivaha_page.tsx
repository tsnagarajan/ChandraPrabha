"use client";

import React, { useState } from 'react';

// --- HELPERS ---
const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
const pad2 = (num: number) => num.toString().padStart(2, '0');

const TIMEZONES = [
  'Asia/Kolkata', 'America/Chicago', 'America/New_York', 'America/Los_Angeles',
  'America/Denver', 'UTC', 'Europe/London', 'Asia/Singapore', 'Australia/Sydney'
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const initialState = {
  name: '', place: '', lat: '', lon: '', tz: 'Asia/Kolkata',
  day: '', month: '', year: '', hour: '', min: '', ampm: ''
};

// =============================================
// NAKSHATRA & RASI DATA
// =============================================

const NAK_NAMES = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
];

const RASI_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// Gana: 0=Deva, 1=Manushya, 2=Rakshasa
const NAK_GANA = [
  0,1,2,2,0,1,0,0,2,
  2,1,1,0,2,0,2,0,2,
  2,1,1,0,1,2,1,2,0
];
const GANA_NAME = ["Deva","Manushya","Rakshasa"];

// Yoni
const NAK_YONI = [
  "Horse","Elephant","Goat","Snake","Snake","Dog","Cat","Goat","Cat",
  "Rat","Rat","Cow","Buffalo","Tiger","Buffalo","Tiger","Deer","Deer",
  "Dog","Monkey","Mongoose","Monkey","Lion","Horse","Lion","Cow","Elephant"
];

const NAK_YONI_GENDER = [
  "M","M","F","M","F","M","F","M","M","M","F","M","F","M","M","F","F","M","F","M","F","F","F","F","M","F","F"
];

const YONI_ENEMIES: Record<string, string> = {
  "Cow":"Tiger","Tiger":"Cow",
  "Elephant":"Lion","Lion":"Elephant",
  "Horse":"Buffalo","Buffalo":"Horse",
  "Dog":"Deer","Deer":"Dog",
  "Rat":"Cat","Cat":"Rat",
  "Goat":"Monkey","Monkey":"Goat",
  "Snake":"Mongoose","Mongoose":"Snake"
};

// Rajju
const NAK_RAJJU = [
  "Patha",   // 0  Ashwini
  "Patha",   // 1  Bharani
  "Siro",    // 2  Krittika
  "Siro",    // 3  Rohini
  "Siro",    // 4  Mrigashira
  "Kanda",   // 5  Ardra
  "Kanda",   // 6  Punarvasu
  "Kanda",   // 7  Pushya
  "Kanda",   // 8  Ashlesha
  "Thodia",  // 9  Magha
  "Thodia",  // 10 Purva Phalguni
  "Thodia",  // 11 Uttara Phalguni
  "Uthara",  // 12 Hasta
  "Kanda",   // 13 Chitra
  "Uthara",  // 14 Swati
  "Thodia",  // 15 Vishakha
  "Kanda",   // 16 Anuradha
  "Thodia",  // 17 Jyeshtha
  "Thodia",  // 18 Mula
  "Thodia",  // 19 Purva Ashadha
  "Kanda",   // 20 Uttara Ashadha
  "Kanda",   // 21 Shravana
  "Siro",    // 22 Dhanishta
  "Siro",    // 23 Shatabhisha
  "Siro",    // 24 Purva Bhadrapada
  "Patha",   // 25 Uttara Bhadrapada
  "Patha",   // 26 Revati
];

// Vedha pairs (0-indexed)
const VEDHA_PAIRS: [number,number][] = [
  [0,17],[1,16],[2,15],[3,14],[5,21],[6,20],
  [7,19],[8,18],[9,26],[10,20],[11,19],[12,23]
];

// Rasi lord
const RASI_LORD = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"
];

// Permanent relationships
const PERM_FRIENDS: Record<string, string[]> = {
  "Sun":     ["Moon","Mars","Jupiter"],
  "Moon":    ["Sun","Mercury"],
  "Mars":    ["Sun","Moon","Jupiter"],
  "Mercury": ["Sun","Venus"],
  "Jupiter": ["Sun","Moon","Mars"],
  "Venus":   ["Mercury","Saturn"],
  "Saturn":  ["Mercury","Venus"],
};
const PERM_ENEMIES: Record<string, string[]> = {
  "Sun":     ["Venus","Saturn"],
  "Moon":    [],
  "Mars":    ["Mercury"],
  "Mercury": ["Moon"],
  "Jupiter": ["Mercury","Venus"],
  "Venus":   ["Sun","Moon"],
  "Saturn":  ["Sun","Moon","Mars"],
};

// Permanent relationship score: 1=Friend, 0=Neutral, -1=Enemy
function permRel(p1: string, p2: string): number {
  if (PERM_FRIENDS[p1]?.includes(p2)) return 1;
  if (PERM_ENEMIES[p1]?.includes(p2)) return -1;
  return 0;
}

// Temporary relationship: planet in 2,3,4,10,11,12 from another = friend
function tempRel(p1Lon: number, p2Lon: number): number {
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const p1Sign = Math.floor(norm(p1Lon) / 30);
  const p2Sign = Math.floor(norm(p2Lon) / 30);
  const dist = ((p2Sign - p1Sign + 12) % 12) + 1;
  return [2,3,4,10,11,12].includes(dist) ? 1 : -1;
}

// Panchadha Maitri (compound relationship)
function compoundRel(p1: string, p2: string, p1Lon: number, p2Lon: number): "Adhi Mitra"|"Mitra"|"Sama"|"Shatru"|"Adhi Shatru" {
  const perm = permRel(p1, p2);
  const temp = tempRel(p1Lon, p2Lon);
  const sum = perm + temp;
  if (sum >= 2) return "Adhi Mitra";
  if (sum === 1) return "Mitra";
  if (sum === 0) return "Sama";
  if (sum === -1) return "Shatru";
  return "Adhi Shatru";
}

function compoundRelScore(rel: string): number {
  if (rel === "Adhi Mitra") return 2;
  if (rel === "Mitra") return 1;
  if (rel === "Sama") return 0;
  if (rel === "Shatru") return -1;
  return -2;
}

// Vasiya
const VASIYA_MAP: Record<number, number[]> = {
  0:[4,7], 1:[3,6], 2:[5], 3:[7,8], 4:[9], 5:[1,11],
  6:[6], 7:[3,5], 8:[11], 9:[4], 10:[11], 11:[9]
};

// =============================================
// SOUTH INDIAN — TEN PORUTHAM ENGINE
// =============================================

interface PoruthamResult {
  name: string;
  tamil: string;
  result: "Uttamam" | "Madhyam" | "No Match";
  reason: string;
  importance: string;
}

function calcDinam(gNak: number, bNak: number): PoruthamResult {
  const count = ((bNak - gNak + 27) % 27) + 1;
  const uttamam = [2,4,6,8,9,11,13,15,18,20,22,26,27];
  const noMatch = [1,3,5,7,10,12,14,16,17,19,21,23,24,25];
  const result = uttamam.includes(count) ? "Uttamam" : noMatch.includes(count) ? "No Match" : "Madhyam";
  const suffix = count===1?'st':count===2?'nd':count===3?'rd':'th';
  return { name:"Dina Porutham", tamil:"தின பொருத்தம்", result,
    reason:`Boy's star falls as ${count}${suffix} from Girl's star`, importance:"Health & Longevity" };
}

function calcGanam(gNak: number, bNak: number): PoruthamResult {
  const gG = NAK_GANA[gNak], bG = NAK_GANA[bNak];
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (gG === bG) { result="Uttamam"; reason=`Both ${GANA_NAME[gG]} Gana`; }
  else if (gG===0 && bG===1) { result="Uttamam"; reason="Girl Deva, Boy Manushya — compatible"; }
  else if (gG===1 && bG===0) { result="Madhyam"; reason="Girl Manushya, Boy Deva — moderate"; }
  else { result="No Match"; reason=`${GANA_NAME[gG]} & ${GANA_NAME[bG]} — incompatible`; }
  return { name:"Gana Porutham", tamil:"கண பொருத்தம்", result, reason, importance:"Temperament" };
}

function calcMahendra(gNak: number, bNak: number): PoruthamResult {
  const count = ((bNak - gNak + 27) % 27) + 1;
  const good = [4,7,10,13,16,19,22,25];
  const result = good.includes(count) ? "Uttamam" : "No Match";
  const suffix = count===1?'st':count===2?'nd':count===3?'rd':'th';
  return { name:"Mahendra Porutham", tamil:"மஹேந்திர பொருத்தம்", result,
    reason:`Boy's star is ${count}${suffix} from Girl's`, importance:"Children & Prosperity" };
}

function calcStreeDheergam(gNak: number, bNak: number): PoruthamResult {
  const count = ((bNak - gNak + 27) % 27) + 1;
  const result = count > 13 ? "Uttamam" : count >= 7 ? "Madhyam" : "No Match";
  return { name:"Stree Dheergam", tamil:"ஸ்த்ரீ தீர்க்க பொருத்தம்", result,
    reason:`Boy's star is ${count} from Girl's (need >13 for Uttamam)`, importance:"Wife's Prosperity" };
}

function calcYoni(gNak: number, bNak: number): PoruthamResult {
  const gY=NAK_YONI[gNak], bY=NAK_YONI[bNak];
  const gGender=NAK_YONI_GENDER[gNak], bGender=NAK_YONI_GENDER[bNak];
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (gY===bY) { result="Uttamam"; reason=`Both ${gY} Yoni`; }
  else if (YONI_ENEMIES[gY]===bY) { result="No Match"; reason=`${gY} and ${bY} are enemy Yonis`; }
  else if (bGender==="M" && gGender==="F") { result="Uttamam"; reason=`Male Yoni (${bY}) + Female Yoni (${gY})`; }
  else if (bGender==="M" && gGender==="M") { result="Madhyam"; reason=`Both Male Yoni (${bY}, ${gY})`; }
  else { result="Madhyam"; reason=`${bY} and ${gY} — moderate`; }
  return { name:"Yoni Porutham", tamil:"யோனி பொருத்தம்", result, reason, importance:"Physical Compatibility" };
}

function calcRasi(gRasi: number, bRasi: number): PoruthamResult {
  const count = ((bRasi - gRasi + 12) % 12) + 1;
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (count===1||count===7) { result="Uttamam"; reason=`Boy's Rasi is ${count}th from Girl's — excellent`; }
  else if (count===3||count===4) { result="Madhyam"; reason=`Boy's Rasi is ${count}th — moderate`; }
  else if ([2,5,6,8,12].includes(count)) { result="No Match"; reason=`Boy's Rasi is ${count}th — unfavourable`; }
  else { result="Uttamam"; reason=`Boy's Rasi is ${count}th from Girl's`; }
  return { name:"Rasi Porutham", tamil:"ராசி பொருத்தம்", result, reason, importance:"General Prosperity" };
}

function calcRasiathipathi(gRasi: number, bRasi: number, gPositions: Record<string,number>, bPositions: Record<string,number>): PoruthamResult {
  const gLord = RASI_LORD[gRasi];
  const bLord = RASI_LORD[bRasi];
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (gLord===bLord) {
    result="Uttamam"; reason=`Same Rasi lord: ${gLord}`;
  } else {
    // Use compound relationship if positions available
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

function calcVasiyam(gRasi: number, bRasi: number): PoruthamResult {
  const bVasiyaToG = VASIYA_MAP[gRasi]?.includes(bRasi);
  const gVasiyaToB = VASIYA_MAP[bRasi]?.includes(gRasi);
  let result: "Uttamam"|"Madhyam"|"No Match", reason: string;
  if (bVasiyaToG) { result="Uttamam"; reason=`Boy's Rasi (${RASI_NAMES[bRasi]}) is Vasiya to Girl's (${RASI_NAMES[gRasi]})`; }
  else if (gVasiyaToB) { result="Madhyam"; reason=`Girl's Rasi is Vasiya to Boy's — moderate`; }
  else { result="No Match"; reason=`No Vasiya relation between ${RASI_NAMES[gRasi]} and ${RASI_NAMES[bRasi]}`; }
  return { name:"Vasiyam", tamil:"வசிய பொருத்தம்", result, reason, importance:"Mutual Attraction" };
}

function calcRajju(gNak: number, bNak: number): PoruthamResult {
  const gR=NAK_RAJJU[gNak], bR=NAK_RAJJU[bNak];
  if (gR!==bR) {
    return { name:"Rajju Porutham", tamil:"ரஜ்ஜு பொருத்தம்", result:"Uttamam",
      reason:`Girl: ${gR} Rajju, Boy: ${bR} Rajju — different, no dosha`, importance:"Most Important" };
  }
  const effects: Record<string,string> = {
    "Siro":"Husband's longevity affected","Kanda":"Wife's longevity affected",
    "Uthara":"Children (Putra Dosha)","Thodia":"Loss of property","Patha":"Dangers from travel"
  };
  return { name:"Rajju Porutham", tamil:"ரஜ்ஜு பொருத்தம்", result:"No Match",
    reason:`Both in ${gR} Rajju — Rajju Dosha! ${effects[gR]||''}`, importance:"Most Important" };
}

function calcVedhai(gNak: number, bNak: number): PoruthamResult {
  const isVedha = VEDHA_PAIRS.some(([a,b]) => (a===gNak&&b===bNak)||(b===gNak&&a===bNak));
  return { name:"Vedhai Porutham", tamil:"வேதை பொருத்தம்",
    result: isVedha ? "No Match" : "Uttamam",
    reason: isVedha ? `${NAK_NAMES[gNak]} and ${NAK_NAMES[bNak]} are Vedha pairs`
                    : `No Vedha between ${NAK_NAMES[gNak]} and ${NAK_NAMES[bNak]}`,
    importance:"Warding off Misfortune" };
}

function calcAllPorutham(gNak: number, gRasi: number, bNak: number, bRasi: number,
  gPositions: Record<string,number>, bPositions: Record<string,number>): PoruthamResult[] {
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

// =============================================
// NORTH INDIAN — ASHTA KOOTA ENGINE
// =============================================

interface KootaResult {
  name: string;
  maxPoints: number;
  points: number;
  result: string;
  reason: string;
}

// Varna
const RASI_VARNA = [2,3,1,0,2,3,1,0,2,3,1,0]; // 0=Brahmin,1=Kshatriya,2=Vaishya,3=Shudra
const VARNA_NAME = ["Brahmin","Kshatriya","Vaishya","Shudra"];

function calcVarna(gRasi: number, bRasi: number): KootaResult {
  const gV=RASI_VARNA[gRasi], bV=RASI_VARNA[bRasi];
  const points = bV <= gV ? 1 : 0;
  return { name:"Varna", maxPoints:1, points,
    result: points===1?"Match":"No Match",
    reason:`Girl: ${VARNA_NAME[gV]}, Boy: ${VARNA_NAME[bV]}` };
}

// Vashya categories
const VASHYA_CAT: Record<number,string> = {
  0:"Chatushpad",1:"Chatushpad",2:"Dwipad",3:"Jalachar",4:"Vanchar",
  5:"Dwipad",6:"Dwipad",7:"Keet",8:"Dwipad",9:"Jalachar",10:"Dwipad",11:"Jalachar"
};
const VASHYA_SCORE: Record<string,Record<string,number>> = {
  "Chatushpad":{"Chatushpad":2,"Jalachar":0,"Vanchar":2,"Keet":0,"Dwipad":0},
  "Jalachar":{"Chatushpad":1,"Jalachar":2,"Vanchar":0,"Keet":1,"Dwipad":1},
  "Vanchar":{"Chatushpad":1,"Jalachar":0,"Vanchar":2,"Keet":0,"Dwipad":0},
  "Keet":{"Chatushpad":0,"Jalachar":1,"Vanchar":0,"Keet":2,"Dwipad":1},
  "Dwipad":{"Chatushpad":1,"Jalachar":1,"Vanchar":1,"Keet":0,"Dwipad":2},
};

function calcVashya(gRasi: number, bRasi: number): KootaResult {
  const gC=VASHYA_CAT[gRasi], bC=VASHYA_CAT[bRasi];
  const points = VASHYA_SCORE[gC]?.[bC] ?? 0;
  return { name:"Vashya", maxPoints:2, points,
    result: points>=2?"Excellent":points>=1?"Good":"Poor",
    reason:`Girl: ${gC}, Boy: ${bC}` };
}

// Tara
function calcTara(gNak: number, bNak: number): KootaResult {
  const taraFromG = ((bNak - gNak + 27) % 27) + 1;
  const taraFromB = ((gNak - bNak + 27) % 27) + 1;
  const bad = [3,5,7];
  const gBad = bad.includes(((taraFromG-1)%9)+1);
  const bBad = bad.includes(((taraFromB-1)%9)+1);
  let points = 3;
  if (gBad && bBad) points=0;
  else if (gBad || bBad) points=1.5;
  return { name:"Tara (Dina)", maxPoints:3, points,
    result: points===3?"Excellent":points===1.5?"Moderate":"Poor",
    reason:`Distance G→B: ${taraFromG}, B→G: ${taraFromB}` };
}

// Yoni for Ashta Koota
const YONI_SCORE_MAP: Record<string,Record<string,number>> = {};
const ALL_YONIS = ["Horse","Elephant","Goat","Snake","Dog","Cat","Rat","Cow","Buffalo","Tiger","Deer","Monkey","Mongoose","Lion"];
ALL_YONIS.forEach(y1 => {
  YONI_SCORE_MAP[y1] = {};
  ALL_YONIS.forEach(y2 => {
    if (y1===y2) YONI_SCORE_MAP[y1][y2]=4;
    else if (YONI_ENEMIES[y1]===y2) YONI_SCORE_MAP[y1][y2]=0;
    else YONI_SCORE_MAP[y1][y2]=2;
  });
});

function calcYoniKoota(gNak: number, bNak: number): KootaResult {
  const gY=NAK_YONI[gNak], bY=NAK_YONI[bNak];
  const points = YONI_SCORE_MAP[gY]?.[bY] ?? 2;
  return { name:"Yoni", maxPoints:4, points,
    result: points===4?"Excellent":points===2?"Moderate":"Poor",
    reason:`Girl: ${gY}, Boy: ${bY}` };
}

// Graha Maitri using compound relationships
function calcGrahaMaitri(gRasi: number, bRasi: number,
  gPositions: Record<string,number>, bPositions: Record<string,number>): KootaResult {
  const gLord=RASI_LORD[gRasi], bLord=RASI_LORD[bRasi];
  let points=0, result="", reason="";
  if (gLord===bLord) {
    points=5; result="Excellent"; reason=`Same lord: ${gLord}`;
  } else {
    const gLon=gPositions[gLord]??0, bLon=bPositions[bLord]??0;
    const rel1=compoundRel(gLord,bLord,gLon,bLon);
    const rel2=compoundRel(bLord,gLord,bLon,gLon);
    const score=(compoundRelScore(rel1)+compoundRelScore(rel2));
    if (score>=3) { points=5; result="Excellent"; }
    else if (score>=1) { points=4; result="Good"; }
    else if (score===0) { points=3; result="Neutral"; }
    else if (score>=-2) { points=1; result="Poor"; }
    else { points=0; result="Very Poor"; }
    reason=`${gLord}(${rel1}) & ${bLord}(${rel2})`;
  }
  return { name:"Graha Maitri", maxPoints:5, points, result, reason };
}

// Gana Koota
const GANA_SCORE: number[][] = [[6,5,1],[5,6,0],[1,0,6]];
function calcGanaKoota(gNak: number, bNak: number): KootaResult {
  const gG=NAK_GANA[gNak], bG=NAK_GANA[bNak];
  const points=GANA_SCORE[gG][bG];
  return { name:"Gana", maxPoints:6, points,
    result: points===6?"Excellent":points>=4?"Good":points>=1?"Poor":"Very Poor",
    reason:`Girl: ${GANA_NAME[gG]}, Boy: ${GANA_NAME[bG]}` };
}

// Bhakoot
function calcBhakoot(gRasi: number, bRasi: number): KootaResult {
  const dist1=((bRasi-gRasi+12)%12)+1;
  const dist2=((gRasi-bRasi+12)%12)+1;
  const bad=[[2,12],[5,9],[6,8]];
  const isBad=bad.some(([a,b])=>(dist1===a&&dist2===b)||(dist1===b&&dist2===a));
  const points=isBad?0:7;
  return { name:"Bhakoot (Rasi)", maxPoints:7, points,
    result: points===7?"Excellent":"Poor",
    reason:`Rasi distance: ${dist1}/${dist2} — ${isBad?"inauspicious":"auspicious"}` };
}

// Nadi
const NAK_NADI = [
  0,1,2,2,0,1,0,0,2, // Aadi=0, Madhya=1, Antya=2
  2,1,1,0,1,0,2,0,2,
  2,1,1,0,1,2,1,2,0
];
const NADI_NAME=["Aadi","Madhya","Antya"];

function calcNadi(gNak: number, bNak: number): KootaResult {
  const gN=NAK_NADI[gNak], bN=NAK_NADI[bNak];
  const isDosha=gN===bN;
  const points=isDosha?0:8;
  return { name:"Nadi", maxPoints:8, points,
    result: isDosha?"Nadi Dosha!":"Excellent",
    reason:`Girl: ${NADI_NAME[gN]}, Boy: ${NADI_NAME[bN]} — ${isDosha?"same Nadi (dosha)":"different Nadi"}` };
}

function calcAshtaKoota(gNak: number, gRasi: number, bNak: number, bRasi: number,
  gPositions: Record<string,number>, bPositions: Record<string,number>): KootaResult[] {
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
// DOSHA CHECKS
// =============================================

function checkMangalDosha(positions: Record<string,number>, ascendant: number) {
  const marsLon=positions["Mars"];
  if (marsLon===undefined) return { isManglik:false, house:0, cancelled:false, reason:"Mars position unavailable" };
  const ascSign=Math.floor(((ascendant%360)+360)%360/30);
  const marsSign=Math.floor(((marsLon%360)+360)%360/30);
  const house=((marsSign-ascSign+12)%12)+1;
  const isManglik=[1,2,4,7,8,12].includes(house);
  const marsRasi=marsSign;
  let cancelled=false, reason="";
  if (!isManglik) { reason=`Mars in house ${house} — not Manglik`; }
  else if (marsRasi===3) { cancelled=true; reason=`Mars debilitated in Cancer (house ${house}) — dosha cancelled`; }
  else if (marsRasi===9) { cancelled=true; reason=`Mars exalted in Capricorn (house ${house}) — dosha reduced`; }
  else if (marsRasi===0||marsRasi===7) { cancelled=true; reason=`Mars in own sign (house ${house}) — dosha cancelled`; }
  else { reason=`Mars in house ${house} from Lagna`; }
  return { isManglik, house, cancelled, reason };
}

function checkDasaSandhi(girlDasha: any[], boyDasha: any[]) {
  if (!girlDasha?.length||!boyDasha?.length) return { isSatisfactory:true, reason:"Dasha data unavailable" };
  const now=new Date();
  const girlCurrent=girlDasha.find((d:any)=>new Date(d.startISO)<=now&&now<new Date(d.endISO));
  const boyCurrent=boyDasha.find((d:any)=>new Date(d.startISO)<=now&&now<new Date(d.endISO));
  if (!girlCurrent||!boyCurrent) return { isSatisfactory:true, reason:"Could not determine current dasha" };
  const girlEnd=new Date(girlCurrent.endISO);
  const boyEnd=new Date(boyCurrent.endISO);
  const diffMonths=Math.abs(girlEnd.getTime()-boyEnd.getTime())/(1000*60*60*24*30);
  const isSatisfactory=diffMonths>=18;
  return { isSatisfactory,
    reason:`Girl's ${girlCurrent.lord} Dasha ends: ${girlEnd.toLocaleDateString()}, Boy's ${boyCurrent.lord} Dasha ends: ${boyEnd.toLocaleDateString()} — gap: ${Math.floor(diffMonths)} months (need >18)` };
}

// =============================================
// MAIN COMPONENT
// =============================================

export default function VivahaPage() {
  const [girl, setGirl] = useState({ ...initialState });
  const [boy, setBoy] = useState({ ...initialState });
  const [system, setSystem] = useState('South Indian (Dasa Porutham)');
  const [girlSuggestions, setGirlSuggestions] = useState<any[]>([]);
  const [boySuggestions, setBoySuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);

  const handleReset = () => {
    setGirl({ ...initialState });
    setBoy({ ...initialState });
    setResults(null);
    setError(null);
  };

  function buildDateStr(p: typeof initialState) {
    if (!p.year||!p.month||!p.day) return '';
    return `${p.year}-${pad2(Number(p.month))}-${pad2(Number(p.day))}`;
  }

  function buildTimeStr(p: typeof initialState) {
    if (!p.hour||!p.min||!p.ampm) return '';
    let h=Number(p.hour);
    if (p.ampm==='AM') h=h===12?0:h;
    if (p.ampm==='PM') h=h===12?12:h+12;
    return `${pad2(h)}:${pad2(Number(p.min))}:00`;
  }

  const handlePlaceSearch = async (type: 'girl'|'boy', value: string) => {
    const setter=type==='girl'?setGirl:setBoy;
    const sugSetter=type==='girl'?setGirlSuggestions:setBoySuggestions;
    setter(prev=>({...prev, place:value}));
    if (value.length<3) { sugSetter([]); return; }
    try {
      const res=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=6&countrycodes=in,us,gb,sg,au`);
      const data=await res.json();
      sugSetter(data);
    } catch { sugSetter([]); }
  };

  const handleSelectPlace = (type: 'girl'|'boy', item: any) => {
    const setter=type==='girl'?setGirl:setBoy;
    const sugSetter=type==='girl'?setGirlSuggestions:setBoySuggestions;
    setter(prev=>({...prev, place:item.display_name, lat:item.lat, lon:item.lon}));
    sugSetter([]);
  };

  const handleCheckPorutham = async () => {
    setError(null); setResults(null);
    const gDateStr=buildDateStr(girl), gTimeStr=buildTimeStr(girl);
    const bDateStr=buildDateStr(boy), bTimeStr=buildTimeStr(boy);
    if (!girl.name.trim()) { setError("Please enter Girl's name"); return; }
    if (!boy.name.trim()) { setError("Please enter Boy's name"); return; }
    if (!girl.lat||!girl.lon) { setError("Please select or enter Girl's birth place coordinates"); return; }
    if (!boy.lat||!boy.lon) { setError("Please select or enter Boy's birth place coordinates"); return; }
    if (!gDateStr) { setError("Please complete Girl's birth date"); return; }
    if (!gTimeStr) { setError("Please complete Girl's birth time"); return; }
    if (!bDateStr) { setError("Please complete Boy's birth date"); return; }
    if (!bTimeStr) { setError("Please complete Boy's birth time"); return; }
    setLoading(true);
    try {
      const [girlRes, boyRes] = await Promise.all([
        fetch('/api/chart', { method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ date:gDateStr, time:gTimeStr, timezone:girl.tz, lat:Number(girl.lat), lon:Number(girl.lon) }) }),
        fetch('/api/chart', { method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ date:bDateStr, time:bTimeStr, timezone:boy.tz, lat:Number(boy.lat), lon:Number(boy.lon) }) }),
      ]);
      const girlData=await girlRes.json();
      const boyData=await boyRes.json();
      if (!girlRes.ok) throw new Error(girlData.error||"Failed to compute Girl's chart");
      if (!boyRes.ok) throw new Error(boyData.error||"Failed to compute Boy's chart");

      const girlMoon=girlData.nakTable?.find((r:any)=>r.body==="Moon");
      const boyMoon=boyData.nakTable?.find((r:any)=>r.body==="Moon");
      if (!girlMoon) throw new Error("Could not determine Girl's Moon nakshatra");
      if (!boyMoon) throw new Error("Could not determine Boy's Moon nakshatra");

      const gNakIdx=NAK_NAMES.indexOf(girlMoon.nakshatra);
      const bNakIdx=NAK_NAMES.indexOf(boyMoon.nakshatra);
      const gRasiIdx=RASI_NAMES.indexOf(girlMoon.sign);
      const bRasiIdx=RASI_NAMES.indexOf(boyMoon.sign);
      if (gNakIdx===-1) throw new Error(`Unknown nakshatra: ${girlMoon.nakshatra}`);
      if (bNakIdx===-1) throw new Error(`Unknown nakshatra: ${boyMoon.nakshatra}`);

      const gPositions=girlData.positions||{};
      const bPositions=boyData.positions||{};

      const poruthams=calcAllPorutham(gNakIdx,gRasiIdx,bNakIdx,bRasiIdx,gPositions,bPositions);
      const kootas=calcAshtaKoota(gNakIdx,gRasiIdx,bNakIdx,bRasiIdx,gPositions,bPositions);
      const girlMangal=checkMangalDosha(gPositions,girlData.ascendant);
      const boyMangal=checkMangalDosha(bPositions,boyData.ascendant);
      const dasaSandhi=checkDasaSandhi(girlData.dasha,boyData.dasha);

      setResults({
        girl:{ name:girl.name, nakshatra:girlMoon.nakshatra, pada:girlMoon.pada, rasi:girlMoon.sign },
        boy:{ name:boy.name, nakshatra:boyMoon.nakshatra, pada:boyMoon.pada, rasi:boyMoon.sign },
        poruthams, kootas, girlMangal, boyMangal, dasaSandhi,
      });

      setTimeout(()=>{ const el=document.getElementById('porutham-results'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); },300);
    } catch(e:any) {
      setError(e?.message||String(e));
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // RENDER HELPERS
  // =============================================

  const resultColor=(r:string)=>r==="Uttamam"?"#16a34a":r==="Madhyam"?"#d97706":"#dc2626";
  const resultBg=(r:string)=>r==="Uttamam"?"#f0fdf4":r==="Madhyam"?"#fffbeb":"#fef2f2";

  const isSouthIndian=system.includes('South');

  // Shared location block renderer
  const renderLocationBlock = (type: 'girl'|'boy') => {
    const person=type==='girl'?girl:boy;
    const suggestions=type==='girl'?girlSuggestions:boySuggestions;
    const setter=type==='girl'?setGirl:setBoy;
    return (
      <div style={{ marginBottom:'15px', position:'relative' }}>
        <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Location</label>
        <input
          style={{ width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px', boxSizing:'border-box' }}
          autoComplete="off" placeholder="Type city name..."
          value={person.place}
          onChange={(e)=>handlePlaceSearch(type,e.target.value)}
        />
        {suggestions.length>0 && (
          <div style={{ position:'absolute', zIndex:999, backgroundColor:'#fff', border:'1px solid #ccc', borderRadius:'4px', width:'100%', maxHeight:'180px', overflowY:'auto', boxShadow:'0 4px 8px rgba(0,0,0,0.1)' }}>
            {suggestions.map((item,i)=>(
              <div key={i} onClick={()=>handleSelectPlace(type,item)}
                style={{ padding:'8px 10px', cursor:'pointer', fontSize:'12px', borderBottom:'1px solid #f0f0f0' }}
                onMouseEnter={e=>(e.currentTarget.style.backgroundColor='#f5f1e3')}
                onMouseLeave={e=>(e.currentTarget.style.backgroundColor='#fff')}>
                {item.display_name}
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize:'11px', color:'#888', marginTop:'4px' }}>
          Lat: {person.lat||'--'} / Lon: {person.lon||'--'}
        </div>
        {!person.lat && (
          <div style={{ marginTop:'6px' }}>
            <div style={{ fontSize:'11px', color:'#666', marginBottom:'4px' }}>Or enter coordinates manually:</div>
            <div style={{ display:'flex', gap:'5px' }}>
              <input placeholder="Latitude (e.g. 16.7488)"
                style={{ flex:1, padding:'6px', border:'1px solid #ccc', borderRadius:'4px', fontSize:'12px' }}
                onChange={(e)=>setter(prev=>({...prev, lat:e.target.value, lon:prev.lon}))}



onChange={(e)=>setter(prev=>({...prev, lon:e.target.value}))} />
              <input placeholder="Longitude (e.g. 77.9864)"
                style={{ flex:1, padding:'6px', border:'1px solid #ccc', borderRadius:'4px', fontSize:'12px' }} />
                onChange={(e)=>setter(prev=>({...prev, lat:e.target.value}))} onBlur={(e)=>setter(prev=>({...prev, lat:e.target.value}))} />
            </div>
          </div>
        )}
      </div>
    );
  };

  // =============================================
  // RENDER
  // =============================================

  return (
    <div style={{ backgroundColor:'#EFE9D5', minHeight:'100vh', padding:'40px 20px', fontFamily:'sans-serif', color:'#333' }}>
      <div style={{ maxWidth:'850px', margin:'0 auto', backgroundColor:'#F5F1E3', padding:'30px', borderRadius:'4px', border:'1px solid #dcd4b8', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>

        <h2 style={{ fontSize:'26px', fontWeight:'bold', marginBottom:'25px', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{color:'#c0392b'}}>❤</span> Chandra Prabha — Vivaha Porutham
        </h2>

        <div style={{ marginBottom:'30px' }}>
          <label style={{ fontWeight:'bold', fontSize:'14px', display:'block', marginBottom:'8px' }}>Choose System</label>
          <select style={{ width:'100%', padding:'10px', borderRadius:'4px', border:'1px solid #ccc', backgroundColor:'#fff' }}
            value={system} onChange={(e)=>setSystem(e.target.value)}>
            <option>South Indian (Dasa Porutham)</option>
            <option>North Indian (Ashta Koota)</option>
          </select>
        </div>

        {/* FORM */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0', position:'relative', borderBottom:'1px solid #dcd4b8', paddingBottom:'30px' }}>
          <div style={{ position:'absolute', left:'50%', top:'0', bottom:'30px', width:'1px', backgroundColor:'#dcd4b8' }}></div>

          {/* GIRL */}
          <div style={{ flex:'1', minWidth:'280px', paddingRight:'40px' }}>
            <h3 style={{ fontSize:'18px', fontWeight:'bold', marginBottom:'20px' }}>♀ Girl's Birth Details</h3>

            <div style={{ marginBottom:'15px' }}>
              <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Girl Name</label>
              <div style={{ display:'flex', border:'1px solid #ccc', borderRadius:'4px', backgroundColor:'#fff' }}>
                <span style={{ padding:'8px 12px', background:'#f0f0f0', borderRight:'1px solid #ccc', color:'#666' }}>👤</span>
                <input style={{ flex:1, padding:'8px', border:'none', outline:'none' }} placeholder="Enter girl name"
                  value={girl.name} onChange={(e)=>setGirl({...girl, name:e.target.value})} />
              </div>
            </div>

            {renderLocationBlock('girl')}

            <div style={{ marginBottom:'15px' }}>
              <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Timezone</label>
              <select style={{ width:'100%', padding:'8px', borderRadius:'4px', border:'1px solid #ccc' }}
                value={girl.tz} onChange={(e)=>setGirl({...girl, tz:e.target.value})}>
                {TIMEZONES.map(tz=><option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:'15px' }}>
              <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Birth Date</label>
              <div style={{ display:'flex', gap:'5px' }}>
                <select style={{ flex:1, padding:'8px' }} value={girl.year} onChange={(e)=>setGirl({...girl, year:e.target.value})}>
                  <option value="">YYYY</option>{range(1900,2050).map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <select style={{ flex:1, padding:'8px' }} value={girl.month} onChange={(e)=>setGirl({...girl, month:e.target.value})}>
                  <option value="">MMM</option>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                </select>
                <select style={{ flex:1, padding:'8px' }} value={girl.day} onChange={(e)=>setGirl({...girl, day:e.target.value})}>
                  <option value="">DD</option>{range(1,31).map(d=><option key={d} value={d}>{pad2(d)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom:'15px' }}>
              <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Birth Time</label>
              <div style={{ display:'flex', gap:'5px' }}>
                <select style={{ flex:1, padding:'8px' }} value={girl.hour} onChange={(e)=>setGirl({...girl, hour:e.target.value})}>
                  <option value="">HH</option>{range(1,12).map(h=><option key={h} value={h}>{pad2(h)}</option>)}
                </select>
                <select style={{ flex:1, padding:'8px' }} value={girl.min} onChange={(e)=>setGirl({...girl, min:e.target.value})}>
                  <option value="">MM</option>{range(0,59).map(m=><option key={m} value={m}>{pad2(m)}</option>)}
                </select>
                <select style={{ flex:1, padding:'8px' }} value={girl.ampm} onChange={(e)=>setGirl({...girl, ampm:e.target.value})}>
                  <option value="">AM/PM</option><option value="AM">AM</option><option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* BOY */}
          <div style={{ flex:'1', minWidth:'280px', paddingLeft:'40px' }}>
            <h3 style={{ fontSize:'18px', fontWeight:'bold', marginBottom:'20px' }}>♂ Boy's Birth Details</h3>

            <div style={{ marginBottom:'15px' }}>
              <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Boy Name</label>
              <div style={{ display:'flex', border:'1px solid #ccc', borderRadius:'4px', backgroundColor:'#fff' }}>
                <span style={{ padding:'8px 12px', background:'#f0f0f0', borderRight:'1px solid #ccc', color:'#666' }}>👤</span>
                <input style={{ flex:1, padding:'8px', border:'none', outline:'none' }} placeholder="Enter boy name"
                  value={boy.name} onChange={(e)=>setBoy({...boy, name:e.target.value})} />
              </div>
            </div>

            {renderLocationBlock('boy')}

            <div style={{ marginBottom:'15px' }}>
              <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Timezone</label>
              <select style={{ width:'100%', padding:'8px', borderRadius:'4px', border:'1px solid #ccc' }}
                value={boy.tz} onChange={(e)=>setBoy({...boy, tz:e.target.value})}>
                {TIMEZONES.map(tz=><option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:'15px' }}>
              <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Birth Date</label>
              <div style={{ display:'flex', gap:'5px' }}>
                <select style={{ flex:1, padding:'8px' }} value={boy.year} onChange={(e)=>setBoy({...boy, year:e.target.value})}>
                  <option value="">YYYY</option>{range(1900,2050).map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <select style={{ flex:1, padding:'8px' }} value={boy.month} onChange={(e)=>setBoy({...boy, month:e.target.value})}>
                  <option value="">MMM</option>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                </select>
                <select style={{ flex:1, padding:'8px' }} value={boy.day} onChange={(e)=>setBoy({...boy, day:e.target.value})}>
                  <option value="">DD</option>{range(1,31).map(d=><option key={d} value={d}>{pad2(d)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom:'15px' }}>
              <label style={{ fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'4px' }}>Birth Time</label>
              <div style={{ display:'flex', gap:'5px' }}>
                <select style={{ flex:1, padding:'8px' }} value={boy.hour} onChange={(e)=>setBoy({...boy, hour:e.target.value})}>
                  <option value="">HH</option>{range(1,12).map(h=><option key={h} value={h}>{pad2(h)}</option>)}
                </select>
                <select style={{ flex:1, padding:'8px' }} value={boy.min} onChange={(e)=>setBoy({...boy, min:e.target.value})}>
                  <option value="">MM</option>{range(0,59).map(m=><option key={m} value={m}>{pad2(m)}</option>)}
                </select>
                <select style={{ flex:1, padding:'8px' }} value={boy.ampm} onChange={(e)=>setBoy({...boy, ampm:e.target.value})}>
                  <option value="">AM/PM</option><option value="AM">AM</option><option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ margin:'20px 0', padding:'12px 16px', backgroundColor:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'4px', color:'#dc2626', fontSize:'14px' }}>
            ⚠ {error}
          </div>
        )}

        {/* BUTTONS */}
        <div style={{ textAlign:'center', marginTop:'30px' }}>
          <button onClick={handleCheckPorutham} disabled={loading}
            style={{ backgroundColor:loading?'#ccc':'#ED7348', color:'white', border:'none', padding:'14px 45px', fontSize:'15px', fontWeight:'bold', borderRadius:'4px', cursor:loading?'not-allowed':'pointer', marginRight:'15px' }}>
            {loading?'Computing...':'CHECK PORUTHAM'}
          </button>
          <button onClick={handleReset}
            style={{ backgroundColor:'#fff', color:'#666', border:'1px solid #ccc', padding:'14px 45px', fontSize:'15px', fontWeight:'bold', borderRadius:'4px', cursor:'pointer' }}>
            RESET FORM
          </button>
        </div>

        {/* RESULTS */}
        {results && (
          <div id="porutham-results" style={{ marginTop:'40px' }}>

            {/* HEADER */}
            <div style={{ backgroundColor:'#2c1810', color:'#f5f1e3', padding:'20px', borderRadius:'4px', marginBottom:'24px', textAlign:'center' }}>
              <div style={{ fontSize:'20px', fontWeight:'bold', marginBottom:'8px' }}>
                {results.girl.name} ❤ {results.boy.name}
              </div>
              <div style={{ fontSize:'13px', opacity:0.85 }}>
                Girl: {results.girl.nakshatra} Pada {results.girl.pada} — {results.girl.rasi} &nbsp;|&nbsp;
                Boy: {results.boy.nakshatra} Pada {results.boy.pada} — {results.boy.rasi}
              </div>
              {isSouthIndian ? (
                <div style={{ marginTop:'12px', fontSize:'22px', fontWeight:'bold' }}>
                  {(()=>{
                    const matches=results.poruthams.filter((p:PoruthamResult)=>p.result!=="No Match").length;
                    const color=matches>=8?'#4ade80':matches>=6?'#fbbf24':'#f87171';
                    return <span style={{color}}>{matches} / 10 Poruthams Match</span>;
                  })()}
                </div>
              ) : (
                <div style={{ marginTop:'12px', fontSize:'22px', fontWeight:'bold' }}>
                  {(()=>{
                    const total=results.kootas.reduce((s:number,k:KootaResult)=>s+k.points,0);
                    const color=total>=24?'#4ade80':total>=18?'#fbbf24':'#f87171';
                    return <span style={{color}}>{total.toFixed(1)} / 36 Guna Milan</span>;
                  })()}
                </div>
              )}
            </div>

            {/* SOUTH INDIAN RESULTS */}
            {isSouthIndian && (
              <>
                <h3 style={{ fontSize:'18px', fontWeight:'bold', marginBottom:'16px', borderBottom:'2px solid #dcd4b8', paddingBottom:'8px' }}>
                  Ten Porutham Results
                </h3>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <thead>
                      <tr style={{ backgroundColor:'#2c1810', color:'#f5f1e3' }}>
                        <th style={{ padding:'10px 12px', textAlign:'left' }}>#</th>
                        <th style={{ padding:'10px 12px', textAlign:'left' }}>Porutham</th>
                        <th style={{ padding:'10px 12px', textAlign:'left' }}>Focus</th>
                        <th style={{ padding:'10px 12px', textAlign:'center' }}>Result</th>
                        <th style={{ padding:'10px 12px', textAlign:'left' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.poruthams.map((p:PoruthamResult,i:number)=>(
                        <tr key={i} style={{ backgroundColor:i%2===0?'#faf8f2':'#f5f1e3', borderBottom:'1px solid #e8e2d0' }}>
                          <td style={{ padding:'10px 12px', color:'#888' }}>{i+1}</td>
                          <td style={{ padding:'10px 12px', fontWeight:'bold' }}>
                            {p.name}<br/>
                            <span style={{ fontSize:'11px', color:'#888', fontWeight:'normal' }}>{p.tamil}</span>
                          </td>
                          <td style={{ padding:'10px 12px', color:'#666', fontSize:'12px' }}>{p.importance}</td>
                          <td style={{ padding:'10px 12px', textAlign:'center' }}>
                            <span style={{ backgroundColor:resultBg(p.result), color:resultColor(p.result), padding:'3px 10px', borderRadius:'12px', fontWeight:'bold', fontSize:'12px', border:`1px solid ${resultColor(p.result)}` }}>
                              {p.result}
                            </span>
                          </td>
                          <td style={{ padding:'10px 12px', color:'#555', fontSize:'12px' }}>{p.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* NORTH INDIAN RESULTS */}
            {!isSouthIndian && (
              <>
                <h3 style={{ fontSize:'18px', fontWeight:'bold', marginBottom:'16px', borderBottom:'2px solid #dcd4b8', paddingBottom:'8px' }}>
                  Ashta Koota — Guna Milan
                </h3>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <thead>
                      <tr style={{ backgroundColor:'#2c1810', color:'#f5f1e3' }}>
                        <th style={{ padding:'10px 12px', textAlign:'left' }}>#</th>
                        <th style={{ padding:'10px 12px', textAlign:'left' }}>Koota</th>
                        <th style={{ padding:'10px 12px', textAlign:'center' }}>Points</th>
                        <th style={{ padding:'10px 12px', textAlign:'center' }}>Max</th>
                        <th style={{ padding:'10px 12px', textAlign:'left' }}>Result</th>
                        <th style={{ padding:'10px 12px', textAlign:'left' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.kootas.map((k:KootaResult,i:number)=>(
                        <tr key={i} style={{ backgroundColor:i%2===0?'#faf8f2':'#f5f1e3', borderBottom:'1px solid #e8e2d0' }}>
                          <td style={{ padding:'10px 12px', color:'#888' }}>{i+1}</td>
                          <td style={{ padding:'10px 12px', fontWeight:'bold' }}>{k.name}</td>
                          <td style={{ padding:'10px 12px', textAlign:'center', fontWeight:'bold',
                            color:k.points===0?'#dc2626':k.points>=k.maxPoints*0.7?'#16a34a':'#d97706' }}>
                            {k.points}
                          </td>
                          <td style={{ padding:'10px 12px', textAlign:'center', color:'#888' }}>{k.maxPoints}</td>
                          <td style={{ padding:'10px 12px', fontSize:'12px' }}>{k.result}</td>
                          <td style={{ padding:'10px 12px', color:'#555', fontSize:'12px' }}>{k.reason}</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor:'#2c1810', color:'#f5f1e3', fontWeight:'bold' }}>
                        <td colSpan={2} style={{ padding:'10px 12px' }}>Total</td>
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>
                          {results.kootas.reduce((s:number,k:KootaResult)=>s+k.points,0).toFixed(1)}
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>36</td>
                        <td colSpan={2} style={{ padding:'10px 12px' }}>
                          {(()=>{
                            const t=results.kootas.reduce((s:number,k:KootaResult)=>s+k.points,0);
                            return t>=32?"Excellent match":t>=24?"Good match":t>=18?"Average match":"Poor match";
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* DOSHA SECTION */}
            <h3 style={{ fontSize:'18px', fontWeight:'bold', margin:'32px 0 16px', borderBottom:'2px solid #dcd4b8', paddingBottom:'8px' }}>
              Dosha Analysis
            </h3>

            <div style={{ display:'flex', flexWrap:'wrap', gap:'16px', marginBottom:'16px' }}>
              {[
                { label:`${results.girl.name} — Mangal Dosha`, data:results.girlMangal },
                { label:`${results.boy.name} — Mangal Dosha`, data:results.boyMangal },
              ].map(({label,data},i)=>(
                <div key={i} style={{ flex:'1', minWidth:'240px', padding:'16px',
                  backgroundColor:data.isManglik&&!data.cancelled?'#fef2f2':'#f0fdf4',
                  border:`1px solid ${data.isManglik&&!data.cancelled?'#fca5a5':'#86efac'}`, borderRadius:'4px' }}>
                  <div style={{ fontWeight:'bold', fontSize:'14px', marginBottom:'6px' }}>{label}</div>
                  <div style={{ fontSize:'13px', marginBottom:'4px' }}>
                    {data.isManglik
                      ? <span style={{ color:'#dc2626', fontWeight:'bold' }}>⚠ Manglik {data.cancelled?'(Cancelled)':''}</span>
                      : <span style={{ color:'#16a34a', fontWeight:'bold' }}>✓ Not Manglik</span>}
                  </div>
                  <div style={{ fontSize:'12px', color:'#555' }}>{data.reason}</div>
                </div>
              ))}
            </div>

            {results.girlMangal.isManglik && results.boyMangal.isManglik && (
              <div style={{ padding:'12px 16px', backgroundColor:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'4px', fontSize:'13px', marginBottom:'16px' }}>
                <strong>Note:</strong> Both are Manglik — this mutually cancels the Mangal Dosha effect.
              </div>
            )}

            <div style={{ padding:'16px', backgroundColor:results.dasaSandhi.isSatisfactory?'#f0fdf4':'#fef2f2',
              border:`1px solid ${results.dasaSandhi.isSatisfactory?'#86efac':'#fca5a5'}`, borderRadius:'4px', marginBottom:'16px' }}>
              <div style={{ fontWeight:'bold', fontSize:'14px', marginBottom:'6px' }}>Dasa Sandhi Check</div>
              <div style={{ fontSize:'13px', marginBottom:'4px' }}>
                {results.dasaSandhi.isSatisfactory
                  ? <span style={{ color:'#16a34a', fontWeight:'bold' }}>✓ Satisfactory</span>
                  : <span style={{ color:'#dc2626', fontWeight:'bold' }}>⚠ Not Satisfactory</span>}
              </div>
              <div style={{ fontSize:'12px', color:'#555' }}>{results.dasaSandhi.reason}</div>
            </div>

            {/* OVERALL VERDICT */}
            {(()=>{
              let verdict="", verdictColor="", verdictBg="";
              if (isSouthIndian) {
                const matches=results.poruthams.filter((p:PoruthamResult)=>p.result!=="No Match").length;
                const rajju=results.poruthams.find((p:PoruthamResult)=>p.name==="Rajju Porutham");
                const rajjuOk=rajju?.result!=="No Match";
                if (!rajjuOk) { verdict="⚠ Rajju Dosha present — marriage not recommended without expert consultation"; verdictColor="#dc2626"; verdictBg="#fef2f2"; }
                else if (matches>=8) { verdict="✓ Excellent match — highly compatible"; verdictColor="#16a34a"; verdictBg="#f0fdf4"; }
                else if (matches>=6) { verdict="✓ Good match — compatible with minor considerations"; verdictColor="#16a34a"; verdictBg="#f0fdf4"; }
                else { verdict="⚠ Moderate match — consult an expert astrologer"; verdictColor="#d97706"; verdictBg="#fffbeb"; }
              } else {
                const total=results.kootas.reduce((s:number,k:KootaResult)=>s+k.points,0);
                const nadiDosha=results.kootas.find((k:KootaResult)=>k.name==="Nadi")?.points===0;
                if (nadiDosha) { verdict="⚠ Nadi Dosha present — consult an expert astrologer"; verdictColor="#dc2626"; verdictBg="#fef2f2"; }
                else if (total>=32) { verdict="✓ Excellent match — highly compatible"; verdictColor="#16a34a"; verdictBg="#f0fdf4"; }
                else if (total>=24) { verdict="✓ Good match — compatible"; verdictColor="#16a34a"; verdictBg="#f0fdf4"; }
                else if (total>=18) { verdict="⚠ Average match — proceed with caution"; verdictColor="#d97706"; verdictBg="#fffbeb"; }
                else { verdict="⚠ Poor match — not recommended"; verdictColor="#dc2626"; verdictBg="#fef2f2"; }
              }
              return (
                <div style={{ padding:'20px', backgroundColor:verdictBg, border:`2px solid ${verdictColor}`, borderRadius:'4px', textAlign:'center', marginTop:'8px' }}>
                  <div style={{ fontSize:'16px', fontWeight:'bold', color:verdictColor }}>{verdict}</div>
                  <div style={{ fontSize:'12px', color:'#666', marginTop:'8px' }}>
                    This is a preliminary analysis. Always consult a qualified Vedic astrologer for final guidance.
                  </div>
                </div>
              );
            })()}

          </div>
        )}
      </div>
    </div>
  );
}
