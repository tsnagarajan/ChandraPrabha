
    import { NextResponse } from 'next/server';

const RULES: any = {
  SUN: {
    SUN: [1, 2, 4, 7, 8, 9, 10, 11], MOON: [3, 6, 10, 11], MARS: [1, 2, 4, 7, 8, 9, 10, 11],
    MERCURY: [3, 5, 6, 9, 10, 11, 12], JUPITER: [5, 6, 9, 11], VENUS: [6, 7, 12],
    SATURN: [1, 2, 4, 7, 8, 9, 10, 11], ASC: [3, 4, 6, 10, 11, 12]
  },
  MOON: {
    SUN: [3, 6, 7, 8, 10, 11], MOON: [1, 3, 6, 7, 10, 11], MARS: [2, 3, 5, 6, 9, 10, 11],
    MERCURY: [1, 3, 4, 5, 7, 8, 10, 11], JUPITER: [1, 4, 7, 8, 10, 11, 12], VENUS: [3, 4, 5, 7, 9, 10, 11],
    SATURN: [3, 5, 6, 11], ASC: [3, 6, 10, 11]
  },
  MARS: {
    SUN: [3, 5, 6, 10, 11], MOON: [3, 6, 11], MARS: [1, 2, 4, 7, 8, 10, 11],
    MERCURY: [3, 5, 6, 11], JUPITER: [6, 10, 11, 12], VENUS: [6, 8, 11, 12],
    SATURN: [1, 4, 7, 8, 9, 10, 11], ASC: [1, 3, 6, 10, 11]
  },
  MERCURY: {
    SUN: [5, 6, 9, 11, 12], MOON: [2, 4, 6, 8, 10, 11], MARS: [1, 2, 4, 7, 8, 9, 10, 11],
    MERCURY: [1, 3, 5, 6, 9, 10, 11, 12], JUPITER: [6, 8, 11, 12], VENUS: [1, 2, 3, 4, 5, 8, 9, 11],
    SATURN: [1, 2, 4, 7, 8, 9, 10, 11], ASC: [1, 2, 4, 6, 8, 10, 11]
  },
  JUPITER: {
    SUN: [1, 2, 3, 4, 7, 8, 9, 10, 11], MOON: [2, 5, 7, 9, 11], MARS: [1, 2, 4, 7, 8, 10, 11],
    MERCURY: [1, 2, 4, 5, 6, 9, 10, 11], JUPITER: [1, 2, 3, 4, 7, 8, 10, 11], VENUS: [2, 5, 6, 9, 10, 11],
    SATURN: [3, 5, 6, 12], ASC: [1, 2, 4, 5, 6, 7, 9, 10, 11]
  },
  VENUS: {
    SUN: [8, 11, 12], MOON: [1, 2, 3, 4, 5, 8, 9, 11, 12], MARS: [3, 5, 6, 9, 11, 12],
    MERCURY: [3, 5, 6, 9, 11], JUPITER: [5, 8, 9, 10, 11], VENUS: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    SATURN: [3, 4, 5, 8, 9, 10, 11], ASC: [1, 2, 3, 4, 5, 8, 9, 11]
  },
  SATURN: {
    SUN: [1, 2, 4, 7, 8, 10, 11], MOON: [3, 6, 11], MARS: [3, 5, 6, 10, 11, 12],
    MERCURY: [6, 8, 9, 10, 11, 12], JUPITER: [5, 6, 11, 12], VENUS: [6, 11, 12],
    SATURN: [3, 5, 6, 11], ASC: [1, 3, 4, 6, 10, 11]
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body?.planets || body;

    const findDeg = (name: string) => {
      // 1. Look for the planet in the 'positions' object first
      const positions = input?.positions || {};
      
      // Map names to exactly what comes from the main chart API
      const mapping: Record<string, string> = {
        SUN: "Sun",
        MOON: "Moon",
        MARS: "Mars",
        MERCURY: "Mercury",
        JUPITER: "Jupiter",
        VENUS: "Venus",
        SATURN: "Saturn",
        ASC: "Ascendant"
      };

      const targetKey = mapping[name] || name;

      // Try the mapped name (e.g., "Sun"), then the Uppercase name ("SUN")
      const val = positions[targetKey] ?? positions[name] ?? input[targetKey] ?? input[name];

      // If we found a number, return it.
      if (typeof val === 'number') return val;

      // Special fallback for Ascendant if it's stored at the top level
      if (name === 'ASC') {
        const asc = input?.ascendant ?? input?.ASC ?? positions?.ascendant;
        if (typeof asc === 'number') return asc;
      }

      return undefined;
    };


    const pos: Record<string, number> = {
      SUN: Math.floor(((findDeg('SUN') ?? 0) / 30)),
      MOON: Math.floor(((findDeg('MOON') ?? 0) / 30)),
      MARS: Math.floor(((findDeg('MARS') ?? 0) / 30)),
      MERCURY: Math.floor(((findDeg('MERCURY') ?? 0) / 30)),
      JUPITER: Math.floor(((findDeg('JUPITER') ?? 0) / 30)),
      VENUS: Math.floor(((findDeg('VENUS') ?? 0) / 30)),
      SATURN: Math.floor(((findDeg('SATURN') ?? 0) / 30)),
      ASC: Math.floor(((findDeg('ASC') ?? 0) / 30)),
    };

    const table: Record<string, number[]> = {};
    const sarvaNoLagna = new Array(12).fill(0);        // SAV excluding Lagna-reference bindus
    const lagnaBindusPerSign = new Array(12).fill(0); // only Lagna-reference bindus

    Object.keys(RULES).forEach(pKey => {
      const points = new Array(12).fill(0);

      Object.keys(RULES[pKey]).forEach(refKey => {
        const refSign = pos[refKey];
        const offsets = RULES[pKey][refKey];

        offsets.forEach((o: number) => {
          const target = (refSign + o - 1) % 12;
          points[target] += 1;

          // split SAV into (with lagna) and (without lagna) components
          if (refKey === 'ASC') {
            lagnaBindusPerSign[target] += 1;
          } else {
            sarvaNoLagna[target] += 1;
          }
        });
      });

      table[pKey] = points;
    });

    const savWithLagna = sarvaNoLagna.map((v, i) => v + lagnaBindusPerSign[i]);

    // BAV totals per planet (sum across 12 signs)
    const bavTotals: Record<string, number> = {};
    Object.keys(table).forEach((pKey) => {
      bavTotals[pKey] = table[pKey].reduce((a, b) => a + b, 0);
    });

    const savTotal = savWithLagna.reduce((a, b) => a + b, 0);

    // Return BOTH legacy + expanded fields so frontend never breaks
    return NextResponse.json({
      table,
      bavTotals,

      // legacy field name some components might expect
      sarva: savWithLagna,

      // expanded fields (useful for AVK display)
      sarvaNoLagna,
      lagnaBindusPerSign,
      savWithLagna,
      savTotal,

      // optional debug
      pos,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: "Fail", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
