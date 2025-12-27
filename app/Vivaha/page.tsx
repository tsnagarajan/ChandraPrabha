"use client";

import React, { useState } from 'react';

// --- HELPERS ---
const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
const pad2 = (num: number) => num.toString().padStart(2, '0');

const TIMEZONES = [
  'Asia/Kolkata', 'America/Chicago', 'America/New_York', 'America/Los_Angeles',
  'America/Denver', 'UTC', 'Europe/London', 'Asia/Singapore', 'Australia/Sydney'
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const initialState = {
  name: '', place: '', lat: '', lon: '', tz: 'Asia/Kolkata',
  day: '', month: '', year: '', hour: '', min: '', ampm: ''
};

export default function VivahaPage() {
  const [girl, setGirl] = useState({ ...initialState });
  const [boy, setBoy] = useState({ ...initialState });
  const [system, setSystem] = useState('South Indian (Dasa Porutham)');

  const handleReset = () => {
    setGirl({ ...initialState });
    setBoy({ ...initialState });
  };

  const handleGeocode = async (type: 'girl' | 'boy') => {
    const person = type === 'girl' ? girl : boy;
    if (!person.place) return alert("Please enter a city name");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(person.place)}`);
      const data = await res.json();
      if (data.length > 0) {
        const update = { lat: data[0].lat, lon: data[0].lon };
        type === 'girl' ? setGirl(prev => ({ ...prev, ...update })) : setBoy(prev => ({ ...prev, ...update }));
      }
    } catch (err) {
      alert("Error finding location");
    }
  };

  return (
    <div style={{ backgroundColor: '#EFE9D5', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', backgroundColor: '#F5F1E3', padding: '30px', borderRadius: '4px', border: '1px solid #dcd4b8', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        
        <h2 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{color: '#333'}}>❤</span> Horoscope Matching
        </h2>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Choose System</label>
          <select 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }} 
            value={system} 
            onChange={(e)=>setSystem(e.target.value)}
          >
            <option>South Indian (Dasa Porutham)</option>
            <option>North Indian (Ashta Koota)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0', position: 'relative', borderBottom: '1px solid #dcd4b8', paddingBottom: '30px' }}>
          {/* Vertical Divider */}
          <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '30px', width: '1px', backgroundColor: '#dcd4b8' }}></div>

          {/* GIRL SECTION */}
          <div style={{ flex: '1', paddingRight: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               ♀ Girl's Birth Details
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Girl Name</label>
              <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
                <span style={{ padding: '8px 12px', background: '#f0f0f0', borderRight: '1px solid #ccc', color: '#666' }}>👤</span>
                <input style={{ flex: 1, padding: '8px', border: 'none', outline: 'none' }} placeholder="Enter girl name" value={girl.name} onChange={(e)=>setGirl({...girl, name:e.target.value})} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Location</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Search Place..." value={girl.place} onChange={(e)=>setGirl({...girl, place:e.target.value})} />
                <button onClick={()=>handleGeocode('girl')} style={{ padding: '0 12px', background: '#999', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Find</button>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Lat: {girl.lat || '--'} / Lon: {girl.lon || '--'}</div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Timezone</label>
              <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} value={girl.tz} onChange={(e)=>setGirl({...girl, tz:e.target.value})}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Birth Date</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '8px' }} value={girl.year} onChange={(e)=>setGirl({...girl, year:e.target.value})}><option value="">YYYY</option>{range(1980,2050).map(y=><option key={y} value={y}>{y}</option>)}</select>
                <select style={{ flex: 1, padding: '8px' }} value={girl.month} onChange={(e)=>setGirl({...girl, month:e.target.value})}><option value="">MMM</option>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select>
                <select style={{ flex: 1, padding: '8px' }} value={girl.day} onChange={(e)=>setGirl({...girl, day:e.target.value})}><option value="">DD</option>{range(1,31).map(d=><option key={d} value={d}>{pad2(d)}</option>)}</select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Birth Time</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '8px' }} value={girl.hour} onChange={(e)=>setGirl({...girl, hour:e.target.value})}><option value="">HH</option>{range(1,12).map(h=><option key={h} value={h}>{pad2(h)}</option>)}</select>
                <select style={{ flex: 1, padding: '8px' }} value={girl.min} onChange={(e)=>setGirl({...girl, min:e.target.value})}><option value="">MM</option>{range(0,59).map(m=><option key={m} value={m}>{pad2(m)}</option>)}</select>
                <select style={{ flex: 1, padding: '8px' }} value={girl.ampm} onChange={(e)=>setGirl({...girl, ampm:e.target.value})}><option value="">AM/PM</option><option value="AM">AM</option><option value="PM">PM</option></select>
              </div>
            </div>
          </div>

          {/* BOY SECTION */}
          <div style={{ flex: '1', paddingLeft: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               ♂ Boy's Birth Details
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Boy Name</label>
              <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
                <span style={{ padding: '8px 12px', background: '#f0f0f0', borderRight: '1px solid #ccc', color: '#666' }}>👤</span>
                <input style={{ flex: 1, padding: '8px', border: 'none', outline: 'none' }} placeholder="Enter boy name" value={boy.name} onChange={(e)=>setBoy({...boy, name:e.target.value})} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Location</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Search Place..." value={boy.place} onChange={(e)=>setBoy({...boy, place:e.target.value})} />
                <button onClick={()=>handleGeocode('boy')} style={{ padding: '0 12px', background: '#999', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Find</button>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Lat: {boy.lat || '--'} / Lon: {boy.lon || '--'}</div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Timezone</label>
              <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} value={boy.tz} onChange={(e)=>setBoy({...boy, tz:e.target.value})}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Birth Date</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '8px' }} value={boy.year} onChange={(e)=>setBoy({...boy, year:e.target.value})}><option value="">YYYY</option>{range(1980,2050).map(y=><option key={y} value={y}>{y}</option>)}</select>
                <select style={{ flex: 1, padding: '8px' }} value={boy.month} onChange={(e)=>setBoy({...boy, month:e.target.value})}><option value="">MMM</option>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select>
                <select style={{ flex: 1, padding: '8px' }} value={boy.day} onChange={(e)=>setBoy({...boy, day:e.target.value})}><option value="">DD</option>{range(1,31).map(d=><option key={d} value={d}>{pad2(d)}</option>)}</select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Birth Time</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '8px' }} value={boy.hour} onChange={(e)=>setBoy({...boy, hour:e.target.value})}><option value="">HH</option>{range(1,12).map(h=><option key={h} value={h}>{pad2(h)}</option>)}</select>
                <select style={{ flex: 1, padding: '8px' }} value={boy.min} onChange={(e)=>setBoy({...boy, min:e.target.value})}><option value="">MM</option>{range(0,59).map(m=><option key={m} value={m}>{pad2(m)}</option>)}</select>
                <select style={{ flex: 1, padding: '8px' }} value={boy.ampm} onChange={(e)=>setBoy({...boy, ampm:e.target.value})}><option value="">AM/PM</option><option value="AM">AM</option><option value="PM">PM</option></select>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button style={{ backgroundColor: '#ED7348', color: 'white', border: 'none', padding: '14px 45px', fontSize: '15px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', marginRight: '15px' }}>
            CHECK PORUTHAM
          </button>
          <button onClick={handleReset} style={{ backgroundColor: '#fff', color: '#666', border: '1px solid #ccc', padding: '14px 45px', fontSize: '15px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>
            RESET FORM
          </button>
        </div>

      </div>
    </div>
  );
}