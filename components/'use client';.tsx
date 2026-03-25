'use client';

import React from 'react';

export default function OnePageReport({ data }: any) {
  if (!data) return null;

  const {
    name,
    birthDetails,
    planets,
    lagna,
    rasi,
    nakshatra,
    dasha
  } = data;

  return (
    <div style={{ padding: 20, fontFamily: 'serif' }}>
      
      {/* HEADER */}
      <h2 style={{ textAlign: 'center' }}>
        Chandra Prabha – One Page Horoscope
      </h2>

      {/* SECTION 1: BIRTH DETAILS */}
      <div style={{ marginTop: 20 }}>
        <h3>Birth Details</h3>
        <p>Name: {name}</p>
        <p>Date: {birthDetails?.date}</p>
        <p>Time: {birthDetails?.time}</p>
        <p>Place: {birthDetails?.place}</p>
        <p>Latitude: {birthDetails?.lat}</p>
        <p>Longitude: {birthDetails?.lon}</p>
        <p>Timezone: {birthDetails?.timezone}</p>
      </div>

      {/* SECTION 2: IDENTITY */}
      <div style={{ marginTop: 20 }}>
        <h3>Key Identity</h3>
        <p>Lagna: {lagna}</p>
        <p>Rasi: {rasi}</p>
        <p>Nakshatra: {nakshatra}</p>
      </div>

      {/* SECTION 3: PLANETS */}
      <div style={{ marginTop: 20 }}>
        <h3>Planetary Positions</h3>
        <table border={1} cellPadding={5}>
          <thead>
            <tr>
              <th>Planet</th>
              <th>Sign</th>
              <th>Degree</th>
              <th>Nakshatra</th>
            </tr>
          </thead>
          <tbody>
            {planets?.map((p: any, i: number) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td>{p.sign}</td>
                <td>{p.degree}</td>
                <td>{p.nakshatra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECTION 4: DASA */}
      <div style={{ marginTop: 20 }}>
        <h3>Current Dasa</h3>
        <p>Mahadasa: {dasha?.maha}</p>
        <p>Bhukti: {dasha?.bhukti}</p>
      </div>

    </div>
  );
}