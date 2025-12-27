import { generateSummary, generateInterpretation } from "./interpretation";

// Example chart data (replace with real values when ready)
const sampleChart = {
  ascendant: 95, // Cancer rising
  positions: {
    Sun: 10,
    Moon: 190,   // Libra
    Mars: 190,   // Libra
    Mercury: 12,
    Jupiter: 95, // Cancer
    Venus: 355,
    Saturn: 300,
  },
};

const summary = generateSummary(sampleChart);
console.log("Summary JSON:\n", JSON.stringify(summary, null, 2));

const interpretationText = generateInterpretation(summary);
console.log("\nInterpretation Text:\n", interpretationText);