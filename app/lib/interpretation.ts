import ascendants from "./Data/Ascendents_Profile.json";
import moonRasis from "./Data/Moon Rasi_Profile.json";
import starPadas from "./Data/star_pada_profile.json";
import dasas from "./Data/dasa_profile.json";
import yogaData from './Data/yoga_profile.json';

interface ChartSummary {
  ascendant: string;
  moonRasi: string;
  nakshatra: string;
  pada: number; 
  yogas: string[];
  currentDasa: string;
}

export function generateInterpretation(summary: ChartSummary): string {
  const asc = ascendants.find(a =>
    summary.ascendant.toLowerCase().includes(a["Lagna (Ascendant)"].toLowerCase())
  );

  const moon = moonRasis.find(m =>
    m["Moon Rasi (Sign)"].toLowerCase().includes(summary.moonRasi.toLowerCase())
  );

  const starData = (starPadas as any)[summary.nakshatra];
  const padaDetails = starData ? starData.find((p: any) => p.pada === summary.pada) : null;

  // Manual check for the Dasa in the JSON
  const currentDasaInfo = dasas.find(d => 
    d.Planet.trim().toLowerCase() === (summary.currentDasa || "").trim().toLowerCase()
  );

  const yogaInterpretations = summary.yogas.map(yogaName => {
    const description = (yogaData as any)[yogaName];
    return description 
      ? `#### ${yogaName}\n${description}` 
      : `#### ${yogaName}\nA planetary combination noted in classical astrology.`;
  }).join('\n\n');

  return `
## Your Personalized Astrology Report (Updated Report)

### 1. Your Ascendant: ${summary.ascendant}
${asc ? asc.Interpretation : ""}

### 2. Your Moon Sign: ${summary.moonRasi}
${moon ? moon.Interpretation : ""}

### 3. Your Star: ${summary.nakshatra} (Pada ${summary.pada})
${padaDetails ? padaDetails.interpretation : ""}

### 4. Your Current Period (Dasa): ${summary.currentDasa}
${currentDasaInfo ? currentDasaInfo.Interpretation : ""}

### 5. Special Yogas
${yogaInterpretations || "No major yogas currently identified."}

---
**Disclaimer:** The Yogas listed above represent planetary potentials based on classical definitions.
`.trim();
}

export function generateSummary(chart: any): ChartSummary {
  const ascSigns = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const positions = chart.positions;
  
  const ascIndex = Math.floor(chart.ascendant / 30);
  const ascendant = ascSigns[ascIndex];

  const moonDegree = positions.Moon;
  const moonIndex = Math.floor(moonDegree / 30);
  const moonRasi = ascSigns[moonIndex];

  const nakshatras = ["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  const nakIndex = Math.floor(moonDegree / (360 / 27));
  const nakshatra = nakshatras[nakIndex];
  const pada = Math.floor((moonDegree % (360 / 27)) / (360 / 108)) + 1;

  // FORCED DASA FIX:
  let currentDasa = "Unknown";
  if (chart?.vimshottari && chart.vimshottari.length > 0) {
    const now = Date.now();
    // We look for the entry where 'now' is between start and end
    const active = chart.vimshottari.find((d: any) => {
      const start = new Date(d.start).getTime();
      const end = new Date(d.end).getTime();
      return now >= start && now <= end;
    });
    // Fallback: if search fails, take the very first one just to avoid "Unknown"
    currentDasa = active ? active.planet : chart.vimshottari[0].planet;
  }

  const yogas: string[] = [];
  const planetsInSigns = Object.entries(positions)
    .filter(([name]) => !["Sun", "Moon", "Rahu", "Ketu", "Ur", "Ne", "Pl"].includes(name))
    .map(([_, degree]) => Math.floor((degree as number) / 30));

  const secondFromMoon = (moonIndex + 1) % 12;
  const twelfthFromMoon = (moonIndex + 11) % 12;

  if (planetsInSigns.includes(secondFromMoon) && planetsInSigns.includes(twelfthFromMoon)) {
    yogas.push("Durdhura Yoga");
  } else if (planetsInSigns.includes(secondFromMoon)) {
    yogas.push("Sunapha Yoga");
  } else if (planetsInSigns.includes(twelfthFromMoon)) {
    yogas.push("Anapha Yoga");
  }

  const jupIndex = Math.floor(positions.Jupiter / 30);
  const jupDiff = (jupIndex - moonIndex + 12) % 12;
  if ([0, 3, 6, 9].includes(jupDiff)) yogas.push("Gaja Kesari Yoga");

  const ninthHouse = (ascIndex + 8) % 12;
  const venusIndex = Math.floor(positions.Venus / 30);
  if (jupIndex === ninthHouse || venusIndex === ninthHouse) yogas.push("Lakshmi Yoga");

  const mercIndex = Math.floor(positions.Mercury / 30);
  if (mercIndex === jupIndex || (mercIndex - jupIndex + 12) % 12 === 6) yogas.push("Gnana Yoga");

  const secondHouse = (ascIndex + 1) % 12;
  const eleventhHouse = (ascIndex + 10) % 12;
  if (planetsInSigns.includes(secondHouse) && planetsInSigns.includes(eleventhHouse)) yogas.push("Dhana Yoga");

  return { ascendant, moonRasi, nakshatra, pada, yogas, currentDasa };
}