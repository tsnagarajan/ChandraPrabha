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
  Sun:'Sun', Moon:'Moo', Mercury:'Mer', Venus:'Ven', Mars:'Mar',
  Jupiter:'Jup', Saturn:'Sat', Rahu:'Rah', Ketu:'Ket'
};


function norm360(x: number){ return (((x % 360) + 360) % 360); }
interface VivahChartProps {
  title: string;
  ascDeg: number;
  positions: Record<string, number>;
  speeds?: Record<string, number>; // Add this line
  mode?: 'sign' | 'bhava';
}

type Box = { sign: number; label: string; planets: string[]; };

export default function VivahChart({ title, ascDeg, positions, speeds, mode = 'sign' }: VivahChartProps)  {
  const CELL = 80;
  const TOTAL = CELL * 4;

  const boxes: Box[] = Array.from({length:12}).map((_,i)=>({ sign:i, label:'', planets:[] }));
  const ascSign = Math.floor(norm360(ascDeg)/30);

  if (mode === 'sign') {
    boxes.forEach(b => { b.label = SIGN_ABBR[b.sign]; });
    Object.entries(positions).forEach(([name, deg]) => {
      const s = Math.floor(norm360(deg) / 30);
      if (PLANET_ABBR[name]) {
        // Adding the Retrograde check for Rasi mode
        const isRetro = speeds && speeds[name] < 0 && name !== 'Rahu' && name !== 'Ketu';
        const label = isRetro ? `${PLANET_ABBR[name]}(R)` : PLANET_ABBR[name];
        boxes[s].planets.push(label);
      }
    });
    boxes[ascSign].planets.unshift('ASC');
  } else {
    boxes.forEach(b => { b.label = `H${((b.sign - ascSign + 12) % 12) + 1}`; });
    Object.entries(positions).forEach(([name, deg]) => {
      const s = Math.floor(norm360(deg) / 30);
      if (PLANET_ABBR[name]) {
        // Adding the Retrograde check for Bhava mode
        const isRetro = speeds && speeds[name] < 0 && name !== 'Rahu' && name !== 'Ketu';
        const label = isRetro ? `${PLANET_ABBR[name]}(R)` : PLANET_ABBR[name];
        boxes[s].planets.push(label);
      }
    });
    const h1 = boxes.findIndex(bb => bb.label === 'H1');
    if (h1 >= 0) boxes[h1].planets.unshift('ASC');
  }

  const grid: (Box|null)[][] = Array.from({length:4}).map(()=>Array(4).fill(null));
  SOUTH_LAYOUT.forEach(({sign,row,col}) => { grid[row][col] = boxes[sign]; });

  return (
    <div className="vivah-chart-wrap">
      <style jsx>{`
        .vivah-chart-wrap {
          font-family: Georgia, 'Times New Roman', serif;
          display: block;
          width: 100%;
        }
        .vivah-chart-title {
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #2c1810;
        }
        .vivah-grid {
          display: grid;
          grid-template-columns: repeat(4, ${CELL}px);
          grid-template-rows: repeat(4, ${CELL}px);
          gap: 0;
          border: 2px solid #333;
          width: ${TOTAL}px;
        }
        .vivah-cell {
          position: relative;
          background: #fff;
          padding: 4px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          border-right: 1px solid #333;
          border-bottom: 1px solid #333;
          overflow: hidden;
        }
        
        .vivah-cell-center {
          background: #f5f5f5;
        }
        .vivah-sign {
          font-size: 11px;
          font-weight: 700;
          color: #666;
          margin-bottom: 2px;
          line-height: 1;
        }
        .vivah-planets {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          flex: 1;
        }
        .vivah-planet {
          font-size: 12px;
          font-weight: 700;
          color: #111;
          line-height: 1.2;
          white-space: nowrap;
        }
        .vivah-planet-asc {
          color: #b91c1c;
          font-weight: 900;
        }
        .vivah-footer {
          text-align: center;
          font-size: 10px;
          color: #666;
          margin-top: 4px;
        }
      `}</style>

      <div className="vivah-chart-title">{title}</div>
      <div className="vivah-grid">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isCenter = (r===1||r===2) && (c===1||c===2);
            return (
              <div
                key={`${r}-${c}`}
                className={`vivah-cell${isCenter ? ' vivah-cell-center' : ''}`}
              >
                {cell && !isCenter && (
                  <>
                    <div className="vivah-sign">{cell.label}</div>
                    <div className="vivah-planets">
                      {cell.planets.map((p, i) => (
                        <span
                          key={i}
                          className={`vivah-planet${p === 'ASC' ? ' vivah-planet-asc' : ''}`}
                        >
                          {p}
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
