// AVK PINDA CALCULATOR
// This file does NOT modify the AVK engine.
// It simply reads the AVK table and produces
// Rasi Pinda, Graha Pinda and Sodhya Pinda.

export function computeAvkPindas(ekaTable: any, pSigns: any) {

  const rasiMult = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];

  const grahaMult: any = {
    SUN: 5,
    MOON: 5,
    MARS: 8,
    MERCURY: 5,
    JUPITER: 10,
    VENUS: 7,
    SATURN: 5
  };

  const planets = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN"];

  const rasiPinda: any = {};
  const grahaPinda: any = {};
  const sodhyaPinda: any = {};

  planets.forEach((p) => {

    // Rasi Pinda
    const rp = ekaTable[p].reduce(
      (sum: number, v: number, i: number) => sum + v * rasiMult[i],
      0
    );

    // Graha Pinda
    let gp = 0;

    planets.forEach((pl) => {
      const signIndex = pSigns[pl] ?? 0;
      const pts = ekaTable[p][signIndex] ?? 0;
      gp += pts * (grahaMult[pl] || 0);
    });

    rasiPinda[p] = rp;
    grahaPinda[p] = gp;
    sodhyaPinda[p] = rp + gp;
  });

  return { rasiPinda, grahaPinda, sodhyaPinda };
}