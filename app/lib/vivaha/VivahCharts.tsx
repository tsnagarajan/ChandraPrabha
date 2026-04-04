'use client';

import React from 'react';
import SouthIndianChart from '@/components/SouthIndianChart';

interface VivahChartsProps {
  girlName: string;
  girlAscendant: number;
  girlPositions: Record<string, number>;
  girlD9Positions: Record<string, number>;
  boyName: string;
  boyAscendant: number;
  boyPositions: Record<string, number>;
  boyD9Positions: Record<string, number>;
}

export default function VivahCharts({
  girlName, girlAscendant, girlPositions, girlD9Positions,
  boyName, boyAscendant, boyPositions, boyD9Positions,
}: VivahChartsProps) {
  return (
    <div className="vivah-charts-wrap">
      <style jsx>{`
        .vivah-charts-wrap {
          font-family: Georgia, 'Times New Roman', serif;
          color: #111827;
        }
        .vivah-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .vivah-chart-box {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          overflow: hidden;
          background: #fff;
        }
        .vivah-chart-title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #2c1810;
        }
        @media (max-width: 600px) {
          .vivah-charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Girl's Charts */}
      <div className="vivah-charts-grid">
        <div>
          <div className="vivah-chart-title">♀ {girlName} — Rasi (D1)</div>
          <div className="vivah-chart-box">
            <SouthIndianChart
              title=""
              mode="sign"
              ascDeg={girlAscendant}
              positions={girlPositions}
              retroSet={new Set()}
            />
          </div>
        </div>
        <div>
          <div className="vivah-chart-title">♀ {girlName} — Navamsa (D9)</div>
          <div className="vivah-chart-box">
            <SouthIndianChart
              title=""
              mode="sign"
              ascDeg={girlAscendant}
              positions={girlD9Positions}
              retroSet={new Set()}
            />
          </div>
        </div>
      </div>

      {/* Boy's Charts */}
      <div className="vivah-charts-grid">
        <div>
          <div className="vivah-chart-title">♂ {boyName} — Rasi (D1)</div>
          <div className="vivah-chart-box">
            <SouthIndianChart
              title=""
              mode="sign"
              ascDeg={boyAscendant}
              positions={boyPositions}
              retroSet={new Set()}
            />
          </div>
        </div>
        <div>
          <div className="vivah-chart-title">♂ {boyName} — Navamsa (D9)</div>
          <div className="vivah-chart-box">
            <SouthIndianChart
              title=""
              mode="sign"
              ascDeg={boyAscendant}
              positions={boyD9Positions}
              retroSet={new Set()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
