// =============================================
// app/lib/vivaha/compatibility.ts
// Chart Compatibility Analysis
// 7th house, Venus, Jupiter, Lagna synastry
// South Indian Vedic Astrology
// =============================================

import { RASI_LORD, PERM_FRIENDS, PERM_ENEMIES } from './tables';

const RASI_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

const PLANET_NAMES = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Rahu","Ketu"];

const BENEFICS = ["Jupiter","Venus","Mercury","Moon"];
const MALEFICS = ["Sun","Mars","Saturn","Rahu","Ketu"];

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function getSign(deg: number): number {
  return Math.floor(norm360(deg) / 30);
}

function getHouseFromAsc(planetDeg: number, ascDeg: number): number {
  const planetSign = getSign(planetDeg);
  const ascSign = getSign(ascDeg);
  return ((planetSign - ascSign + 12) % 12) + 1;
}

function permRel(p1: string, p2: string): "Friend" | "Neutral" | "Enemy" {
  if (PERM_FRIENDS[p1]?.includes(p2)) return "Friend";
  if (PERM_ENEMIES[p1]?.includes(p2)) return "Enemy";
  return "Neutral";
}

// Exaltation signs
const EXALTATION: Record<string, number> = {
  Sun: 0, Moon: 1, Mercury: 5, Venus: 11,
  Mars: 9, Jupiter: 3, Saturn: 6
};

// Debilitation signs
const DEBILITATION: Record<string, number> = {
  Sun: 6, Moon: 7, Mercury: 11, Venus: 5,
  Mars: 3, Jupiter: 9, Saturn: 0
};

// Own signs
const OWN_SIGNS: Record<string, number[]> = {
  Sun: [4], Moon: [3], Mercury: [2, 5], Venus: [1, 6],
  Mars: [0, 7], Jupiter: [8, 11], Saturn: [9, 10]
};

function getPlanetStrength(planet: string, deg: number): string {
  const sign = getSign(deg);
  if (OWN_SIGNS[planet]?.includes(sign)) return "Own sign";
  if (EXALTATION[planet] === sign) return "Exalted";
  if (DEBILITATION[planet] === sign) return "Debilitated";
  return "Normal";
}

// =============================================
// ANALYSIS RESULT TYPE
// =============================================

export interface CompatibilityFactor {
  title: string;
  status: "Good" | "Caution" | "Concern";
  detail: string;
}

export interface ChartCompatibilityResult {
  girlFactors: CompatibilityFactor[];
  boyFactors: CompatibilityFactor[];
  synastryfactors: CompatibilityFactor[];
  overallRemark: string;
  overallStatus: "Favorable" | "Mixed" | "Needs Attention";
}

// =============================================
// INDIVIDUAL CHART ANALYSIS
// =============================================

function analyzeChart(
  name: string,
  positions: Record<string, number>,
  ascendant: number,
  gender: 'girl' | 'boy'
): CompatibilityFactor[] {
  const factors: CompatibilityFactor[] = [];
  const ascSign = getSign(ascendant);
  const seventhSign = (ascSign + 6) % 12;
  const seventhLord = RASI_LORD[seventhSign];

  // 1. Planets in 7th house
  const planetsIn7th: string[] = [];
  const beneficsIn7th: string[] = [];
  const maleficsIn7th: string[] = [];

  for (const planet of PLANET_NAMES) {
    const pos = positions[planet];
    if (pos === undefined) continue;
    const house = getHouseFromAsc(pos, ascendant);
    if (house === 7) {
      planetsIn7th.push(planet);
      if (BENEFICS.includes(planet)) beneficsIn7th.push(planet);
      if (MALEFICS.includes(planet)) maleficsIn7th.push(planet);
    }
  }

  if (planetsIn7th.length === 0) {
    factors.push({
      title: "7th House",
      status: "Good",
      detail: "No planets in 7th house — unobstructed married life"
    });
  } else if (beneficsIn7th.length > 0 && maleficsIn7th.length === 0) {
    factors.push({
      title: "7th House",
      status: "Good",
      detail: `Benefic(s) in 7th: ${beneficsIn7th.join(", ")} — harmonious marriage`
    });
  } else if (maleficsIn7th.length > 0) {
    factors.push({
      title: "7th House",
      status: maleficsIn7th.includes("Mars") || maleficsIn7th.includes("Saturn") ? "Concern" : "Caution",
      detail: `Malefic(s) in 7th: ${maleficsIn7th.join(", ")} — needs careful assessment`
    });
  }

  // 2. 7th Lord strength and position
  const seventhLordPos = positions[seventhLord];
  if (seventhLordPos !== undefined) {
    const seventhLordHouse = getHouseFromAsc(seventhLordPos, ascendant);
    const strength = getPlanetStrength(seventhLord, seventhLordPos);
    const favorableHouses = [1, 2, 4, 5, 7, 9, 10, 11];
    const unfavorableHouses = [6, 8, 12];

    if (strength === "Exalted" || strength === "Own sign") {
      factors.push({
        title: "7th Lord",
        status: "Good",
        detail: `${seventhLord} (7th lord) is ${strength} in house ${seventhLordHouse} — strong marriage prospects`
      });
    } else if (unfavorableHouses.includes(seventhLordHouse)) {
      factors.push({
        title: "7th Lord",
        status: "Concern",
        detail: `${seventhLord} (7th lord) in house ${seventhLordHouse} — challenges in marriage`
      });
    } else if (favorableHouses.includes(seventhLordHouse)) {
      factors.push({
        title: "7th Lord",
        status: "Good",
        detail: `${seventhLord} (7th lord) in house ${seventhLordHouse} — favorable for marriage`
      });
    } else {
      factors.push({
        title: "7th Lord",
        status: "Caution",
        detail: `${seventhLord} (7th lord) in house ${seventhLordHouse} — moderate`
      });
    }
  }

  // 3. Venus condition (Kalatra Karaka)
  const venusPos = positions["Venus"];
  if (venusPos !== undefined) {
    const venusHouse = getHouseFromAsc(venusPos, ascendant);
    const venusStrength = getPlanetStrength("Venus", venusPos);
    const goodVenusHouses = [1, 2, 4, 5, 7, 9, 10, 11];

    if (venusStrength === "Exalted" || venusStrength === "Own sign") {
      factors.push({
        title: "Venus (Kalatra Karaka)",
        status: "Good",
        detail: `Venus ${venusStrength} in house ${venusHouse} — excellent for love and harmony`
      });
    } else if (goodVenusHouses.includes(venusHouse)) {
      factors.push({
        title: "Venus (Kalatra Karaka)",
        status: "Good",
        detail: `Venus in house ${venusHouse} — favorable for harmonious marriage`
      });
    } else {
      factors.push({
        title: "Venus (Kalatra Karaka)",
        status: "Caution",
        detail: `Venus in house ${venusHouse} — some challenges in harmony`
      });
    }
  }

  // 4. Jupiter (especially important for girl's chart)
  const jupPos = positions["Jupiter"];
  if (jupPos !== undefined) {
    const jupHouse = getHouseFromAsc(jupPos, ascendant);
    const jupStrength = getPlanetStrength("Jupiter", jupPos);

    if (gender === 'girl') {
      if (jupStrength === "Exalted" || jupStrength === "Own sign") {
        factors.push({
          title: "Jupiter (Putra Karaka)",
          status: "Good",
          detail: `Jupiter ${jupStrength} in house ${jupHouse} — excellent protection and blessings`
        });
      } else if ([1,2,4,5,7,9,10,11].includes(jupHouse)) {
        factors.push({
          title: "Jupiter (Putra Karaka)",
          status: "Good",
          detail: `Jupiter in house ${jupHouse} — blesses marriage and children`
        });
      } else {
        factors.push({
          title: "Jupiter (Putra Karaka)",
          status: "Caution",
          detail: `Jupiter in house ${jupHouse} — moderate influence on marriage`
        });
      }
    }
  }

  // 5. Lagna lord strength
  const lagnaLord = RASI_LORD[ascSign];
  const lagnaLordPos = positions[lagnaLord];
  if (lagnaLordPos !== undefined) {
    const lagnaLordHouse = getHouseFromAsc(lagnaLordPos, ascendant);
    const lagnaLordStrength = getPlanetStrength(lagnaLord, lagnaLordPos);

    if (lagnaLordStrength === "Exalted" || lagnaLordStrength === "Own sign") {
      factors.push({
        title: "Lagna Lord",
        status: "Good",
        detail: `${lagnaLord} (Lagna lord) ${lagnaLordStrength} in house ${lagnaLordHouse} — strong personality`
      });
    } else if ([6,8,12].includes(lagnaLordHouse)) {
      factors.push({
        title: "Lagna Lord",
        status: "Caution",
        detail: `${lagnaLord} (Lagna lord) in house ${lagnaLordHouse} — some challenges`
      });
    } else {
      factors.push({
        title: "Lagna Lord",
        status: "Good",
        detail: `${lagnaLord} (Lagna lord) in house ${lagnaLordHouse} — stable personality`
      });
    }
  }

  return factors;
}

// =============================================
// SYNASTRY ANALYSIS
// =============================================

function analyzeSynastry(
  girlPositions: Record<string, number>,
  girlAscendant: number,
  boyPositions: Record<string, number>,
  boyAscendant: number
): CompatibilityFactor[] {
  const factors: CompatibilityFactor[] = [];
  const girlAscSign = getSign(girlAscendant);
  const boyAscSign = getSign(boyAscendant);

  // 1. Lagna compatibility
  const lagnaDistance = ((boyAscSign - girlAscSign + 12) % 12) + 1;
  const friendlyLagna = [1,3,5,7,9,11].includes(lagnaDistance);
  const tenseLagna = [2,6,8,12].includes(lagnaDistance);

  if (friendlyLagna) {
    factors.push({
      title: "Lagna Compatibility",
      status: "Good",
      detail: `Girl's Lagna (${RASI_NAMES[girlAscSign]}) and Boy's Lagna (${RASI_NAMES[boyAscSign]}) are ${lagnaDistance}th from each other — harmonious`
    });
  } else if (tenseLagna) {
    factors.push({
      title: "Lagna Compatibility",
      status: "Concern",
      detail: `Girl's Lagna (${RASI_NAMES[girlAscSign]}) and Boy's Lagna (${RASI_NAMES[boyAscSign]}) are ${lagnaDistance}th from each other — friction possible`
    });
  } else {
    factors.push({
      title: "Lagna Compatibility",
      status: "Caution",
      detail: `Girl's Lagna (${RASI_NAMES[girlAscSign]}) and Boy's Lagna (${RASI_NAMES[boyAscSign]}) are ${lagnaDistance}th from each other — moderate`
    });
  }

  // 2. Lagna lord friendship
  const girlLagnaLord = RASI_LORD[girlAscSign];
  const boyLagnaLord = RASI_LORD[boyAscSign];
  const lordRel = permRel(girlLagnaLord, boyLagnaLord);

  if (girlLagnaLord === boyLagnaLord || lordRel === "Friend") {
    factors.push({
      title: "Lagna Lord Relationship",
      status: "Good",
      detail: `${girlLagnaLord} (Girl's Lagna lord) and ${boyLagnaLord} (Boy's Lagna lord) are ${girlLagnaLord === boyLagnaLord ? "same" : "friends"} — excellent mutual understanding`
    });
  } else if (lordRel === "Enemy") {
    factors.push({
      title: "Lagna Lord Relationship",
      status: "Concern",
      detail: `${girlLagnaLord} and ${boyLagnaLord} are enemies — fundamental differences in temperament`
    });
  } else {
    factors.push({
      title: "Lagna Lord Relationship",
      status: "Caution",
      detail: `${girlLagnaLord} and ${boyLagnaLord} are neutral — moderate compatibility`
    });
  }

  // 3. Boy's planets in Girl's 7th house
  const girlSeventhSign = (girlAscSign + 6) % 12;
  const boyPlanetsInGirl7th: string[] = [];
  for (const planet of PLANET_NAMES) {
    const pos = boyPositions[planet];
    if (pos === undefined) continue;
    if (getSign(pos) === girlSeventhSign) {
      boyPlanetsInGirl7th.push(planet);
    }
  }

  if (boyPlanetsInGirl7th.length > 0) {
    const hasBenefics = boyPlanetsInGirl7th.some(p => BENEFICS.includes(p));
    const hasMalefics = boyPlanetsInGirl7th.some(p => MALEFICS.includes(p));
    factors.push({
      title: "Boy's Influence on Girl's 7th House",
      status: hasBenefics && !hasMalefics ? "Good" : hasMalefics ? "Caution" : "Good",
      detail: `Boy's planets in Girl's 7th house: ${boyPlanetsInGirl7th.join(", ")} — ${hasBenefics ? "strong attraction" : "significant influence"}`
    });
  }

  // 4. Venus-Jupiter mutual aspect
  const girlVenus = girlPositions["Venus"];
  const boyJupiter = boyPositions["Jupiter"];
  const girlJupiter = girlPositions["Jupiter"];
  const boyVenus = boyPositions["Venus"];

  if (girlVenus !== undefined && boyJupiter !== undefined) {
    const venJupDist = Math.abs(getSign(girlVenus) - getSign(boyJupiter));
    const normalized = Math.min(venJupDist, 12 - venJupDist);
    if (normalized <= 1) {
      factors.push({
        title: "Venus-Jupiter Connection",
        status: "Good",
        detail: "Girl's Venus and Boy's Jupiter are conjunct/closely placed — loving and prosperous marriage"
      });
    }
  }

  // 5. Moon compatibility
  const girlMoon = girlPositions["Moon"];
  const boyMoon = boyPositions["Moon"];
  if (girlMoon !== undefined && boyMoon !== undefined) {
    const girlMoonSign = getSign(girlMoon);
    const boyMoonSign = getSign(boyMoon);
    const moonDist = ((boyMoonSign - girlMoonSign + 12) % 12) + 1;
    const goodMoon = [1,3,5,7,9,11].includes(moonDist);

    factors.push({
      title: "Moon Sign Compatibility",
      status: goodMoon ? "Good" : "Caution",
      detail: `Girl's Moon (${RASI_NAMES[girlMoonSign]}) and Boy's Moon (${RASI_NAMES[boyMoonSign]}) are ${moonDist}th from each other — ${goodMoon ? "emotionally compatible" : "some emotional differences"}`
    });
  }

  return factors;
}

// =============================================
// MAIN FUNCTION
// =============================================

export function analyzeCompatibility(
  girlPositions: Record<string, number>,
  girlAscendant: number,
  boyPositions: Record<string, number>,
  boyAscendant: number
): ChartCompatibilityResult {
  const girlFactors = analyzeChart("Girl", girlPositions, girlAscendant, 'girl');
  const boyFactors = analyzeChart("Boy", boyPositions, boyAscendant, 'boy');
  const synastryfactors = analyzeSynastry(girlPositions, girlAscendant, boyPositions, boyAscendant);

  // Overall assessment
  const allFactors = [...girlFactors, ...boyFactors, ...synastryfactors];
  const concerns = allFactors.filter(f => f.status === "Concern").length;
  const cautions = allFactors.filter(f => f.status === "Caution").length;
  const goods = allFactors.filter(f => f.status === "Good").length;

  let overallStatus: "Favorable" | "Mixed" | "Needs Attention";
  let overallRemark: string;
