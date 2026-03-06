'use client';
import React from 'react';

/** --- Local helpers & constants (self-contained) --- */
const SIGN_ABBR = ['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];

const SOUTH_LAYOUT: Array<{sign:number,row:number,col:number}> = [
  {sign:11,row:0,col:0}, // Pisces
  {sign:0 ,row:0,col:1}, // Aries
  {sign:1 ,row:0,col:2}, // Taurus
  {sign:2 ,row:0,col:3}, // Gemini
  {sign:10,row:1,col:0}, // Aquarius
  {sign:3 ,row:1,col:3}, // Cancer
  {sign:9 ,row:2,col:0}, // Capricorn
  {sign:4 ,row:2,col:3}, // Leo
  {sign:8 ,row:3,col:0}, // Sagittarius
  {sign:7 ,row:3,col:1}, // Scorpio
  {sign:6 ,row:3,col:2}, // Libra
  {sign:5 ,row:3,col:3}, // Virgo
];

const PLANET_ABBR: Record<string,string> = {
  Sun:'Sun', Moon:'Moo', Mercury:'Mer', Venus:'Ven', Mars:'Mar',
  Jupiter:'Jup', Saturn:'Sat', Rahu:'Rah', Ketu:'Ket', Uranus:'Ura', Neptune:'Nep', Pluto:'Plu'
};

function norm360(x: number){ return (((x % 360) + 360) % 360); }

type Props = {
  title: string;
  mode: 'sign' | 'bhava';
  ascDeg?: number;
  positions: Record<string, number>;
  speeds?: Record<string, number>; // Su, Mo, Me, Ve, Ma, Ju, Sa, Ur, Ne, Pl, Ra, Ke
};

type Box = {
  sign: number;
  label: string;
  planets: string[];
};

export default function SouthIndianChart({ title, mode, ascDeg = 0, positions, speeds }: Props) {

  // Build 12 boxes
  const boxes: Box[] = Array.from({length:12}).map((_,i)=>({
    sign: i,
    label: '',
    planets: [] as string[],
  }));

  const ascSign = Math.floor(norm360(ascDeg)/30);

  if (mode === 'sign') {
    boxes.forEach(b => { b.label = SIGN_ABBR[b.sign]; });
    Object.entries(positions).forEach(([name, deg])=>{
      const s = Math.floor(norm360(deg)/30);
      boxes[s].planets.push(PLANET_ABBR[name] ?? name);
    });
    boxes[ascSign].planets.unshift('ASC');
  } else {
    boxes.forEach(b => {
      const h = ((b.sign - ascSign + 12) % 12) + 1;
      b.label = `H${h}`;
    });
    Object.entries(positions).forEach(([name, deg])=>{
      const s = Math.floor(norm360(deg)/30);
      const house = ((s - ascSign + 12) % 12) + 1;
      const idx = boxes.findIndex(bb => bb.label === `H${house}`);
      if (idx >= 0) boxes[idx].planets.push(PLANET_ABBR[name] ?? name);
    });
    const idxH1 = boxes.findIndex(bb => bb.label === 'H1');
    if (idxH1 >= 0) boxes[idxH1].planets.unshift('ASC');
  }

  // Place boxes into 4×4 grid using SOUTH_LAYOUT
  const grid: (Box | null)[][] = Array.from({ length: 4 }).map(() => Array(4).fill(null));
  SOUTH_LAYOUT.forEach(({ sign, row, col }) => { grid[row][col] = boxes[sign]; });

  /** --- Vakra (Retrograde) computed from speeds --- */
  // Chip => speed key from API
  const CHIP_TO_SPEED: Record<string, string> = {
    Sun: 'Su',
    Moo: 'Mo',
    Mer: 'Me',
    Ven: 'Ve',
    Mar: 'Ma',
    Jup: 'Ju',
    Sat: 'Sa',
    Ura: 'Ur',
    Nep: 'Ne',
    Plu: 'Pl',
    Rah: 'Ra',
    Ket: 'Ke',
  };

  // Chip => full planet name (for footer)
  const CHIP_TO_FULL: Record<string, string> = {
    Sun: 'Sun',
    Moo: 'Moon',
    Mer: 'Mercury',
    Ven: 'Venus',
    Mar: 'Mars',
    Jup: 'Jupiter',
    Sat: 'Saturn',
    Ura: 'Uranus',
    Nep: 'Neptune',
    Plu: 'Pluto',
    Rah: 'Rahu',
    Ket: 'Ketu',
  };

  const isRetro = (chip: string) => {
    // never treat nodes as vakra
    if (chip === 'Rah' || chip === 'Ket') return false;

    const k = CHIP_TO_SPEED[chip];
    if (!k) return false;

    const sp = speeds?.[k];
    return typeof sp === 'number' && sp < 0;
  };

  // Vakra list derived from actual chips in chart (ignore ASC + Rah/Ket)
  const vakraNames = Array.from(
    new Set(
      boxes
        .flatMap(b => b.planets)
        .filter(p => p !== 'ASC' && p !== 'Rah' && p !== 'Ket')
        .filter(p => isRetro(p))
        .map(p => CHIP_TO_FULL[p] ?? p)
    )
  );

  return (
    <div className="card avoid-break">
      <div style={{ fontWeight: 800, marginBottom: 10, fontSize: 18 }}>{title}</div>

      <div
        className="charts-grid"
        style={{
          display:'grid',
          gridTemplateColumns:'repeat(4, var(--cell-size))',
          gridTemplateRows:'repeat(4, var(--cell-size))',
          gap:10,
          justifyContent:'center'
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="si-cell"
              style={{
                position:'relative',
                border:'2px solid #111',
                borderRadius:12,
                background:'#fff',
                padding:10,
                display:'flex',
                flexDirection:'column',
                justifyContent:'flex-start',
                alignItems:'stretch',
                overflow:'hidden'
              }}
            >
              {cell && (
                <>
                  {/* Tiny sign/house label */}
                  <div
                    className="si-label"
                    style={{
                      position:'absolute',
                      top:6,
                      left:8,
                      fontSize:11,
                      fontWeight:700,
                      opacity:.85
                    }}
                  >
                    {cell.label}
                  </div>

                  {/* Planet chips */}
                  <div
                    style={{
                      marginTop:20,
                      display:'flex',
                      flexWrap:'wrap',
                      alignItems:'flex-start',
                      gap:6,
                      width:'100%',
                      flex:1,
                      overflow:'hidden'
                    }}
                  >
                    {cell.planets.length === 0 ? (
                      <span className="si-label" style={{ fontWeight:600, opacity:.9 }}>—</span>
                    ) : (
                      cell.planets.map((p, i) => (
                        <span
                          key={i}
                          className={`si-chip ${p === 'ASC' ? 'si-chip-asc' : ''}`}
                          title={p}
                          style={{
                            fontSize: cell.planets.length >= 7 ? 10 : cell.planets.length >= 5 ? 12 : cell.planets.length >= 4 ? 14 : 16,
                            lineHeight: 1.1,
                            padding: cell.planets.length >= 5 ? '2px 6px' : '4px 8px',
                            border: '2px solid #111',
                            borderRadius: 10,
                            fontWeight: 800,
                            background: p === 'ASC' ? '#fff1f2' : '#fff',
                            color: p === 'ASC' ? '#b91c1c' : '#111',
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {p}{p !== 'ASC' && isRetro(p) ? ' R' : ''}
                        </span>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Vakra footer */}
      <div
        style={{
          marginTop: 8,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          opacity: 0.9,
        }}
      >
        {vakraNames.length > 0
          ? `Vakra (Retrograde): ${vakraNames.join(', ')}`
          : 'All planets are direct'}
      </div>
    </div>
  );
}
