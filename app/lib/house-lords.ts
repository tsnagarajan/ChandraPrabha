export function getHouseLords(ascSign: number) {
  // Classical Parāśara house lord mapping by sign
  const signLords = {
    1: "Mars",
    2: "Venus",
    3: "Mercury",
    4: "Moon",
    5: "Sun",
    6: "Mercury",
    7: "Venus",
    8: "Mars",
    9: "Jupiter",
    10: "Saturn",
    11: "Saturn",
    12: "Jupiter"
  };

  const houseLords: Record<number, string> = {};

  for (let house = 1; house <= 12; house++) {
    const sign = ((ascSign + house - 2) % 12) + 1;
    houseLords[house] = signLords[sign];
  }

  return houseLords;
}
