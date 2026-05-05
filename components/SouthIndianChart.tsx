'use client';

import React from 'react';

const SIGN_ABBR = ['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];

const SOUTH_LAYOUT: Array<{sign:number,row:number,col:number}> = [
  {sign:11,row:0,col:0},
  {sign:0 ,row:0,col:1},
  {sign:1 ,row:0,col:2},
  {sign:2 ,row:0,col:3},
  {sign:10,row:1,col:0},
  {sign:3 ,row:1,col:3},
  {sign:9 ,row:2,col:0},
  {sign:4 ,row:2,col:3},
  {sign:8 ,row:3,col:0},
  {sign:7 ,row:3,col:1},
  {sign:6 ,row:3,col:2},
  {sign:5 ,row:3,col:3},
];

const PLANET_ABBR: Record<string,string> = {
  Sun:'Sun',
  Moon:'Moo',
  Mercury:'Mer',
  Venus:'Ven',
  Mars:'Mar',
  Jupiter:'Jup',
  Saturn:'Sat',
  Rahu:'Rah',
  Ketu:'Ket'
};


function norm360(x: number){ return (((x % 360) + 360) % 360); }

type Props = {
  title: string;
  mode: 'sign' | 'bhava';
  ascDeg?: number;
  positions: Record<string, number>;
  speeds?: Record<string, number>;
  retroSet?: Set<string>;
  compact?: boolean;
};

type Box = { sign: number; label: string; planets: string[]; };

export default function SouthIndianChart({ title, mode, ascDeg = 0, positions, speeds, retroSet, compact }: Props) {

  const boxes: Box[] = Array.from({length:12}).map((_,i)=>({ sign:i, label:'', planets:[] }));
  const ascSign = Math.floor(norm360(ascDeg)/30);

  if (mode === 'sign') {
    boxes.forEach(b => { b.label = SIGN_ABBR[b.sign]; });
    Object.entries(positions).forEach(([name, deg])=>{
      const s = Math.floor(norm360(deg)/30);
      

     boxes[s].planets.push(name);

    });
    boxes[ascSign].planets.unshift('ASC');
  } else {
    boxes.forEach(b => { b.label = `H${((b.sign - ascSign + 12) % 12) + 1}`; });
    Object.entries(positions).forEach(([name, deg])=>{
      const s = Math.floor(norm360(deg)/30);
      const house = ((s - ascSign + 12) % 12) + 1;
      const idx = boxes.findIndex(bb => bb.label === `H${house}`);
      if (idx >= 0) boxes[idx].planets.push(PLANET_ABBR[name] ?? name);
    });
    const h1 = boxes.findIndex(bb => bb.label === 'H1');
    if (h1 >= 0) boxes[h1].planets.unshift('ASC');
  }

  const grid: (Box|null)[][] = Array.from({length:4}).map(()=>Array(4).fill(null));
  SOUTH_LAYOUT.forEach(({sign,row,col}) => { grid[row][col] = boxes[sign]; });

  const CHIP_TO_SPEED: Record<string,string> = {
  Sun:'Su',
  Moo:'Mo',
  Mer:'Me',
  Ven:'Ve',
  Mar:'Ma',
  Jup:'Ju',
  Sat:'Sa',
  Rah:'Ra',
  Ket:'Ke'
};
const CHIP_TO_FULL: Record<string,string> = {
  Sun:'Sun',
  Moo:'Moon',
  Mer:'Mercury',
  Ven:'Venus',
  Mar:'Mars',
  Jup:'Jupiter',
  Sat:'Saturn',
  Rah:'Rahu',
  Ket:'Ketu'
};


  const isRetro = (chip: string) => {
  // Hard rule: Rahu & Ketu are never part of retro display logic
  if (chip === 'Rahu' || chip === 'Ketu') return false;

  const fullName = CHIP_TO_FULL[chip] ?? chip;

  if (retroSet) {
  if (chip === 'Rahu' || chip === 'Ketu') return false;
  return retroSet.has(chip) || retroSet.has(fullName);
}

  

  if (!speeds) return false;

  const k = CHIP_TO_SPEED[chip];
  return typeof speeds[k] === 'number' && speeds[k] < 0;
};

  const vakraNames = Array.from(new Set(
    boxes.flatMap(b=>b.planets)
      .filter(p => p!=='ASC' && p!=='Rah' && p!=='Ket' && isRetro(p))
      .map(p => CHIP_TO_FULL[p] ?? p)
  ));

  // Cell size: use CSS variable if available, else 140px
  const CELL = 'var(--cell-size, 140px)';

  return (
    <div style={{ fontFamily: 'Georgia, serif' }}>
      {title && <div style={{ fontWeight:800, marginBottom:8, fontSize:16 }}>{title}</div>}
      <div style={{
        
        display: 'grid',
        gridTemplateColumns: `repeat(4, ${CELL})`,
        gridTemplateRows: `repeat(4, ${CELL})`,
        gap: 0,
        border: '2px solid #111',
        width: `calc(4 * ${CELL} + 4px)`,
     }}
       > 

        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isCenter = (r===1||r===2) && (c===1||c===2);
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  position: 'relative',
                  borderRight: '1px solid #111',
                  borderBottom: r < 3 ? '1px solid #111' : 'none',
                  background: isCenter ? '#f9f9f9' : '#fff',
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  minHeight: 0,
                }}
              >
                {cell && !isCenter && (
                  <>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#666',
                      marginBottom: 4,
                      lineHeight: 1,
                    }}>
                      {cell.label}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      flex: 1,
                    }}>
                      {cell.planets.map((p, i) => (
                        <span key={i} style={{
                          fontSize: 11,
                          fontWeight: p === 'ASC' ? 900 : 700,
                          color: p === 'ASC' ? '#b91c1c' : '#111',
                          background: p === 'ASC' ? '#fff1f2' : 'transparent',
                          padding: '1px 3px',
                          borderRadius: 3,
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                        }}>
                          
                    {p.replace(/\s*R$/, '')}

                    





                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
      
    </div>
  );
}
