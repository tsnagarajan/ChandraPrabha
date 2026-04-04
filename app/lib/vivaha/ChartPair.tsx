'use client';

import React from 'react';
import SouthIndianChart from '@/components/SouthIndianChart';

interface ChartPairProps {
  name: string;
  ascDeg: number;
  d1Positions: Record<string, number>;
  d9Positions: Record<string, number>;
  gender: 'girl' | 'boy';
}

export default function ChartPair({ name, ascDeg, d1Positions, d9Positions, gender }: ChartPairProps) {
  const symbol = gender === 'girl' ? '♀' : '♂';
  return (
    <div className="chartpair-wrap">
      <style jsx>{`
        .chartpair-wrap {
          font-family: Georgia, 'Times New Roman', serif;
          color: #111827;
          background: white;
          padding: 10px;
        }
        .chartpair-name {
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #2c1810;
        }
        .charts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: start;
        margin-top: 12px;
    }
        }
        .chart-box {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  overflow: auto;
  background: #fff;
}
        }
        @media (max-width: 600px) {
          .chart-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="chartpair-name">{symbol} {name}</div>
      <div className="charts-grid">
        <div className="chart-box">
          <SouthIndianChart
            title="Rāśi (D1)"
            mode="sign"
            ascDeg={ascDeg}
            positions={d1Positions}
            retroSet={new Set()}
          />
        </div>
        <div className="chart-box">
          <SouthIndianChart
            title="Navāṁśa (D9)"
            mode="sign"
            ascDeg={ascDeg}
            positions={d9Positions}
            retroSet={new Set()}
          />
        </div>
      </div>
    </div>
  );
}
