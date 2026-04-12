"use client";

import React, { useState } from 'react';
import { NAK_NAMES, RASI_NAMES } from '@/app/lib/vivaha/tables';
import { calcAllPorutham, PoruthamResult } from '@/app/lib/vivaha/porutham';
import { calcAshtaKoota, interpretAshtaKoota, KootaResult } from '@/app/lib/vivaha/ashtakoota';
import { checkMangalDosha, checkDasaSandhi, checkPapasamya, MangalResult, DasaSandhiResult, PapasamyaResult } from '@/app/lib/vivaha/dosha';
import SouthIndianChart from '@/components/SouthIndianChart';
import VivahChart from '@/app/lib/vivaha/VivahChart';
import NavBar from '@/components/NavBar';
// Load saved profiles from localStorage
function getSavedProfiles(): typeof initialState[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('vivahaProfiles') || '[]'); }
  catch { return []; }
}
function saveProfileToStorage(p: typeof initialState) {
  if (!p.name.trim() || typeof window === 'undefined') return;
  const existing = getSavedProfiles();
  const filtered = existing.filter(x => x.name.toLowerCase() !== p.name.toLowerCase());
  filtered.push(p);
  localStorage.setItem('vivahaProfiles', JSON.stringify(filtered));
}






// --- HELPERS ---
const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);
const pad2 = (num: number) => num.toString().padStart(2, '0');

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India)' },
  { value: 'America/New_York', label: 'America/New_York (US Eastern)' },
  { value: 'America/Chicago', label: 'America/Chicago (US Central)' },
  { value: 'America/Denver', label: 'America/Denver (US Mountain)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific)' },
  { value: 'America/Toronto', label: 'America/Toronto (Canada Eastern)' },
  { value: 'America/Winnipeg', label: 'America/Winnipeg (Canada Central)' },
  { value: 'America/Vancouver', label: 'America/Vancouver (Canada Pacific)' },
  { value: 'America/Halifax', label: 'America/Halifax (Canada Atlantic)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'Europe/London (UK)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (France)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (Germany)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UAE)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney' },
];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const initialState = {
  name:'', place:'', lat:'', lon:'', tz:'Asia/Kolkata',
  day:'', month:'', year:'', hour:'', min:'', ampm:''
};

// =============================================
// MAIN COMPONENT
// =============================================

export default function VivahaPage() {
  const [girl, setGirl] = useState({ ...initialState });
  const [boy, setBoy] = useState({ ...initialState });
  const [system, setSystem] = useState('South Indian (Dasa Porutham)');
  const [girlSuggestions, setGirlSuggestions] = useState<any[]>([]);
  const [boySuggestions, setBoySuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [profiles, setProfiles] = React.useState<typeof initialState[]>([]);
  React.useEffect(() => { setProfiles(getSavedProfiles()); }, []);
  


  const handleReset = () => {
    setGirl({ ...initialState });
    setBoy({ ...initialState });
    setResults(null);
    setError(null);
  };

  function buildDateStr(p: typeof initialState) {
    if (!p.year || !p.month || !p.day) return '';
    return `${p.year}-${pad2(Number(p.month))}-${pad2(Number(p.day))}`;
  }

  function buildTimeStr(p: typeof initialState) {
    if (!p.hour || !p.min || !p.ampm) return '';
    let h = Number(p.hour);
    if (p.ampm === 'AM') h = h === 12 ? 0 : h;
    if (p.ampm === 'PM') h = h === 12 ? 12 : h + 12;
    return `${pad2(h)}:${pad2(Number(p.min))}:00`;
  }

  const handlePlaceSearch = async (type: 'girl' | 'boy', value: string) => {
    const setter = type === 'girl' ? setGirl : setBoy;
    const sugSetter = type === 'girl' ? setGirlSuggestions : setBoySuggestions;
    setter(prev => ({ ...prev, place: value }));
    if (value.length < 3) { sugSetter([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=6&countrycodes=in,us,gb,sg,au,ca,nz,ae,my`
      );
      const data = await res.json();
      sugSetter(data);
    } catch { sugSetter([]); }
  };

  const handleSelectPlace = (type: 'girl' | 'boy', item: any) => {
    const setter = type === 'girl' ? setGirl : setBoy;
    const sugSetter = type === 'girl' ? setGirlSuggestions : setBoySuggestions;
    setter(prev => ({ ...prev, place: item.display_name, lat: item.lat, lon: item.lon }));
    sugSetter([]);
  };

 



  const handleCheckPorutham = async () => {
    setError(null); setResults(null);
    const gDateStr = buildDateStr(girl), gTimeStr = buildTimeStr(girl);
    const bDateStr = buildDateStr(boy), bTimeStr = buildTimeStr(boy);

    if (!girl.name.trim()) { setError("Please enter Girl's name"); return; }
    if (!boy.name.trim()) { setError("Please enter Boy's name"); return; }
    if (!girl.lat || !girl.lon) { setError("Please select or enter Girl's birth place coordinates"); return; }
    if (!boy.lat || !boy.lon) { setError("Please select or enter Boy's birth place coordinates"); return; }
    if (!gDateStr) { setError("Please complete Girl's birth date"); return; }
    if (!gTimeStr) { setError("Please complete Girl's birth time"); return; }
    if (!bDateStr) { setError("Please complete Boy's birth date"); return; }
    if (!bTimeStr) { setError("Please complete Boy's birth time"); return; }

    setLoading(true);
    try {
      const [girlRes, boyRes] = await Promise.all([
        fetch('/api/chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: gDateStr, time: gTimeStr, timezone: girl.tz, lat: Number(girl.lat), lon: Number(girl.lon) }),
        }),
        fetch('/api/chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: bDateStr, time: bTimeStr, timezone: boy.tz, lat: Number(boy.lat), lon: Number(boy.lon) }),
        }),
      ]);

      const girlData = await girlRes.json();
      const boyData = await boyRes.json();

      if (!girlRes.ok) throw new Error(girlData.error || "Failed to compute Girl's chart");
      if (!boyRes.ok) throw new Error(boyData.error || "Failed to compute Boy's chart");

      const girlMoon = girlData.nakTable?.find((r: any) => r.body === "Moon");
      const boyMoon = boyData.nakTable?.find((r: any) => r.body === "Moon");
      if (!girlMoon) throw new Error("Could not determine Girl's Moon nakshatra");
      if (!boyMoon) throw new Error("Could not determine Boy's Moon nakshatra");

      const gNakIdx = NAK_NAMES.indexOf(girlMoon.nakshatra);
      const bNakIdx = NAK_NAMES.indexOf(boyMoon.nakshatra);
      const gRasiIdx = RASI_NAMES.indexOf(girlMoon.sign);
      const bRasiIdx = RASI_NAMES.indexOf(boyMoon.sign);

      if (gNakIdx === -1) throw new Error(`Unknown nakshatra: ${girlMoon.nakshatra}`);
      if (bNakIdx === -1) throw new Error(`Unknown nakshatra: ${boyMoon.nakshatra}`);

      const gPositions = girlData.positions || {};
      const bPositions = boyData.positions || {};

      const poruthams = calcAllPorutham(gNakIdx, gRasiIdx, bNakIdx, bRasiIdx, gPositions, bPositions);
      const kootas = calcAshtaKoota(gNakIdx, gRasiIdx, bNakIdx, bRasiIdx, gPositions, bPositions);
      const girlMangal = checkMangalDosha(gPositions, girlData.ascendant);
      const boyMangal = checkMangalDosha(bPositions, boyData.ascendant);
      const dasaSandhi = checkDasaSandhi(girlData.dasha, boyData.dasha);
      const papasamya = checkPapasamya(gPositions, girlData.ascendant, bPositions, boyData.ascendant);
  const keep = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Rahu","Ketu"];
  const filterPos = (pos: Record<string,number>) => 
  Object.fromEntries(Object.entries(pos || {}).filter(([k]) => keep.includes(k)));

   

setResults({
  girl: { name: girl.name, nakshatra: girlMoon.nakshatra, pada: girlMoon.pada, rasi: girlMoon.sign,
    ascendant: girlData.ascendant, positions: girlData.positions, 
    d9Positions: girlData.d9Positions, speeds: girlData.speeds },
  boy:  { name: boy.name,  nakshatra: boyMoon.nakshatra,  pada: boyMoon.pada,  rasi: boyMoon.sign,
    ascendant: boyData.ascendant, positions: boyData.positions,
    d9Positions: boyData.d9Positions, speeds: boyData.speeds },
  poruthams, kootas, girlMangal, boyMangal, dasaSandhi, papasamya,
});
      saveProfileToStorage(girl);
      saveProfileToStorage(boy);
      setProfiles(getSavedProfiles());


      setTimeout(() => {
        const el = document.getElementById('porutham-results');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // RENDER HELPERS
  // =============================================

  const resultColor = (r: string) =>
    r === "Uttamam" ? "#16a34a" : r === "Madhyam" ? "#d97706" : "#dc2626";
  const resultBg = (r: string) =>
    r === "Uttamam" ? "#f0fdf4" : r === "Madhyam" ? "#fffbeb" : "#fef2f2";

  const isSouthIndian = system.includes('South');

  const renderLocationBlock = (type: 'girl' | 'boy') => {
    const person = type === 'girl' ? girl : boy;
    const suggestions = type === 'girl' ? girlSuggestions : boySuggestions;
    const setter = type === 'girl' ? setGirl : setBoy;
    return (
      <div style={{ marginBottom: '15px', position: 'relative' }}>
        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Location</label>
<div style={{ fontSize:'11px', color:'#888', marginBottom:'4px' }}>Type city name and click 🔍 Search. You may edit the result for cleaner report display.</div>
        <input
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          autoComplete="off" placeholder="Type city name..."
          value={person.place}
          onChange={(e) => setter(prev => ({ ...prev, place: e.target.value }))}
        />
        <button
          type="button"
          onClick={() => handlePlaceSearch(type, person.place)}
          style={{ marginTop:'4px', padding:'6px 12px', backgroundColor:'#ED7348', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px' }}>
          🔍 Search
        </button>
        


        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', zIndex: 999, backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', width: '100%', maxHeight: '180px', overflowY: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            {suggestions.map((item, i) => (
              <div key={i} onClick={() => handleSelectPlace(type, item)}
                style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid #f0f0f0' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f1e3')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}>
                {item.display_name}
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
          Lat: {person.lat || '--'} / Lon: {person.lon || '--'}
        </div>
        {(!person.lat || !person.lon) && (
          <div style={{ marginTop: '6px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
              If city not found, enter coordinates manually
              (visit <a href="https://geocode-latlong.net" target="_blank" rel="noreferrer" style={{ color: '#ED7348' }}>geocode-latlong.net</a>):
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                placeholder="Latitude (e.g. 16.7488)"
                style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
                onBlur={(e) => setter(prev => ({ ...prev, lat: e.target.value }))}
              />
              <input
                placeholder="Longitude (e.g. 77.9864)"
                style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
                onBlur={(e) => setter(prev => ({ ...prev, lon: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const shortPlace = (place: string) => {
    if (!place) return '—';
    const parts = place.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0 && !/^\d+$/.test(p) && !p.includes('Township') && !p.includes('County') && !p.includes('Borough') && !p.includes('District') && !p.includes('மாவட்டம்'));
    if (parts.length === 0) return place.split(',')[0].trim();
    return parts.slice(0, 2).join(', ');
  };

  const getSign = (deg: number) => {
    const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    return SIGNS[Math.floor(((deg % 360) + 360) % 360 / 30)];
  };



  // =============================================
  // RENDER
  // =============================================

  
    return (
    <>
    <NavBar />
     <div style={{ backgroundColor: '#EFE9D5', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', backgroundColor: '#F5F1E3', padding: '30px', borderRadius: '4px', border: '1px solid #dcd4b8', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>

        <h2 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#c0392b' }}>❤</span> Chandra Prabha — Vivaha Porutham
        </h2>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Choose System</label>
          <select style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}
            value={system} onChange={(e) => setSystem(e.target.value)}>
            <option>South Indian (Dasa Porutham)</option>
            <option>North Indian (Ashta Koota)</option>
          </select>
        </div>

        {/* FORM */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', position: 'relative', borderBottom: '1px solid #dcd4b8', paddingBottom: '30px' }}>
          <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '30px', width: '1px', backgroundColor: '#dcd4b8' }}></div>

          {/* GIRL */}
          <div style={{ flex: '1', minWidth: '280px', paddingRight: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>♀ Girl's Birth Details</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Girl Name</label>
              <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
                <span style={{ padding: '8px 12px', background: '#f0f0f0', borderRight: '1px solid #ccc', color: '#666' }}>👤</span>
                <input style={{ flex: 1, padding: '8px', border: 'none', outline: 'none' }}
                  placeholder="Enter girl name" value={girl.name}
                  onChange={(e) => setGirl({ ...girl, name: e.target.value })} />
              </div>
            </div>

            {renderLocationBlock('girl')}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Timezone</label>
              <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                value={girl.tz} onChange={(e) => setGirl({ ...girl, tz: e.target.value })}>
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Birth Date</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '8px' }} value={girl.year} onChange={(e) => setGirl({ ...girl, year: e.target.value })}>
                  <option value="">YYYY</option>{range(1900, 2050).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select style={{ flex: 1, padding: '8px' }} value={girl.month} onChange={(e) => setGirl({ ...girl, month: e.target.value })}>
                  <option value="">MMM</option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select style={{ flex: 1, padding: '8px' }} value={girl.day} onChange={(e) => setGirl({ ...girl, day: e.target.value })}>
                  <option value="">DD</option>{range(1, 31).map(d => <option key={d} value={d}>{pad2(d)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Birth Time</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '8px' }} value={girl.hour} onChange={(e) => setGirl({ ...girl, hour: e.target.value })}>
                  <option value="">HH</option>{range(1, 12).map(h => <option key={h} value={h}>{pad2(h)}</option>)}
                </select>
                <select style={{ flex: 1, padding: '8px' }} value={girl.min} onChange={(e) => setGirl({ ...girl, min: e.target.value })}>
                  <option value="">MM</option>{range(0, 59).map(m => <option key={m} value={m}>{pad2(m)}</option>)}
                </select>
                <select style={{ flex: 1, padding: '8px' }} value={girl.ampm} onChange={(e) => setGirl({ ...girl, ampm: e.target.value })}>
                  <option value="">AM/PM</option><option value="AM">AM</option><option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* BOY */}
          <div style={{ flex: '1', minWidth: '280px', paddingLeft: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>♂ Boy's Birth Details</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Boy Name</label>
              <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
                <span style={{ padding: '8px 12px', background: '#f0f0f0', borderRight: '1px solid #ccc', color: '#666' }}>👤</span>
                <input style={{ flex: 1, padding: '8px', border: 'none', outline: 'none' }}
                  placeholder="Enter boy name" value={boy.name}
                  onChange={(e) => setBoy({ ...boy, name: e.target.value })} />
              </div>
            </div>

            {renderLocationBlock('boy')}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Timezone</label>
              <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                value={boy.tz} onChange={(e) => setBoy({ ...boy, tz: e.target.value })}>
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Birth Date</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '8px' }} value={boy.year} onChange={(e) => setBoy({ ...boy, year: e.target.value })}>
                  <option value="">YYYY</option>{range(1900, 2050).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select style={{ flex: 1, padding: '8px' }} value={boy.month} onChange={(e) => setBoy({ ...boy, month: e.target.value })}>
                  <option value="">MMM</option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select style={{ flex: 1, padding: '8px' }} value={boy.day} onChange={(e) => setBoy({ ...boy, day: e.target.value })}>
                  <option value="">DD</option>{range(1, 31).map(d => <option key={d} value={d}>{pad2(d)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Birth Time</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '8px' }} value={boy.hour} onChange={(e) => setBoy({ ...boy, hour: e.target.value })}>
                  <option value="">HH</option>{range(1, 12).map(h => <option key={h} value={h}>{pad2(h)}</option>)}
                </select>
                <select style={{ flex: 1, padding: '8px' }} value={boy.min} onChange={(e) => setBoy({ ...boy, min: e.target.value })}>
                  <option value="">MM</option>{range(0, 59).map(m => <option key={m} value={m}>{pad2(m)}</option>)}
                </select>
                <select style={{ flex: 1, padding: '8px' }} value={boy.ampm} onChange={(e) => setBoy({ ...boy, ampm: e.target.value })}>
                  <option value="">AM/PM</option><option value="AM">AM</option><option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ margin: '20px 0', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', color: '#dc2626', fontSize: '14px' }}>
            ⚠ {error}
          </div>
        )}

        {/* BUTTONS */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={handleCheckPorutham} disabled={loading}
            style={{ backgroundColor: loading ? '#ccc' : '#ED7348', color: 'white', border: 'none', padding: '14px 45px', fontSize: '15px', fontWeight: 'bold', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', marginRight: '15px' }}>
            {loading ? 'Computing...' : 'CHECK PORUTHAM'}
          </button>
          <button onClick={handleReset}
            style={{ backgroundColor: '#fff', color: '#666', border: '1px solid #ccc', padding: '14px 45px', fontSize: '15px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>
            RESET FORM
          </button>
        </div>

        {/* RESULTS */}
        {results && (
          <div id="porutham-results" style={{ marginTop: '40px' }}>

            {/* HEADER */}
            <div style={{ backgroundColor: '#f5f1e3', color: '#2c1810', padding: '20px', borderRadius: '4px', marginBottom: '24px', textAlign: 'center', border: '2px solid #2c1810' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                {results.girl.name} ❤ {results.boy.name}
              </div>
              <div style={{ fontSize: '12px', textAlign: 'left', display: 'inline-block', width: '100%' }}>
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
    <thead>
      <tr style={{ backgroundColor: '#2c1810', color: '#f5f1e3' }}>
        <th style={{ padding: '6px 10px', textAlign: 'left' }}>Detail</th>
        <th style={{ padding: '6px 10px', textAlign: 'left' }}>♀ {results.girl.name}</th>
        <th style={{ padding: '6px 10px', textAlign: 'left' }}>♂ {results.boy.name}</th>
      </tr>
    </thead>
    <tbody>
      <tr style={{ backgroundColor: '#faf8f2' }}>
        <td style={{ padding: '5px 10px', fontWeight: 'bold' }}>Place</td>
        <td style={{ padding: '5px 10px' }}>{shortPlace(girl.place)}</td>
        <td style={{ padding: '5px 10px' }}>{shortPlace(boy.place)}</td>
      </tr>
      <tr style={{ backgroundColor: '#f5f1e3' }}>
        <td style={{ padding: '5px 10px', fontWeight: 'bold' }}>Date & Time</td>
        <td style={{ padding: '5px 10px' }}>{buildDateStr(girl)} {buildTimeStr(girl)} {girl.ampm}</td>
        <td style={{ padding: '5px 10px' }}>{buildDateStr(boy)} {buildTimeStr(boy)} {boy.ampm}</td>
      </tr>
      <tr style={{ backgroundColor: '#faf8f2' }}>
        <td style={{ padding: '5px 10px', fontWeight: 'bold' }}>Lagna</td>
        <td style={{ padding: '5px 10px' }}>{getSign(results.girl.ascendant)}</td>
        <td style={{ padding: '5px 10px' }}>{getSign(results.boy.ascendant)}</td>
      </tr>
      <tr style={{ backgroundColor: '#f5f1e3' }}>
        <td style={{ padding: '5px 10px', fontWeight: 'bold' }}>Rasi</td>
        <td style={{ padding: '5px 10px' }}>{results.girl.rasi}</td>
        <td style={{ padding: '5px 10px' }}>{results.boy.rasi}</td>
      </tr>
      <tr style={{ backgroundColor: '#faf8f2' }}>
        <td style={{ padding: '5px 10px', fontWeight: 'bold' }}>Star — Pada</td>
        <td style={{ padding: '5px 10px' }}>{results.girl.nakshatra} — {results.girl.pada}</td>
        <td style={{ padding: '5px 10px' }}>{results.boy.nakshatra} — {results.boy.pada}</td>
      </tr>
    </tbody>
  </table>
</div>
             {isSouthIndian ? (
                <div style={{ marginTop: '12px', fontSize: '22px', fontWeight: '900' }}>
                  {(() => {
                    const matches = results.poruthams.filter((p: PoruthamResult) => p.result !== "No Match").length;
                    const color = matches >= 8 ? '#16a34a' : matches >= 6 ? '#d97706' : '#dc2626';
                    return <span style={{ color }}>{matches} / 10 Poruthams Match</span>;
                  })()}
                </div>
              ) : (
                <div style={{ marginTop: '12px', fontSize: '22px', fontWeight: '900' }}>
                  {(() => {
                    const total = results.kootas.reduce((s: number, k: KootaResult) => s + k.points, 0);
                    const color = total >= 25 ? '#16a34a' : total >= 18 ? '#d97706' : '#dc2626';
                    return <span style={{ color }}>{total.toFixed(1)} / 36 Guna Milan</span>;
                  })()}
                </div>
              )}
            </div>
         {isSouthIndian && (
  <>
    <h3 style={{ fontSize:'18px', fontWeight:'bold', marginBottom:'16px', borderBottom:'2px solid #dcd4b8', paddingBottom:'8px' }}>
      Birth Charts
    </h3>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'32px' }}>
      <VivahChart title={`♀ ${results.girl.name} — Rasi (D1)`} ascDeg={results.girl.ascendant} positions={results.girl.positions} mode="sign" />
      <VivahChart title={`♀ ${results.girl.name} — Navamsa (D9)`} ascDeg={results.girl.ascendant} positions={results.girl.d9Positions} mode="sign" />
      <VivahChart title={`♂ ${results.boy.name} — Rasi (D1)`} ascDeg={results.boy.ascendant} positions={results.boy.positions} mode="sign" />
      <VivahChart title={`♂ ${results.boy.name} — Navamsa (D9)`} ascDeg={results.boy.ascendant} positions={results.boy.d9Positions} mode="sign" />
    </div>
  </>
)}
            

{/* SOUTH INDIAN — TEN PORUTHAM */}

            {/* SOUTH INDIAN — TEN PORUTHAM */}
            {isSouthIndian && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #dcd4b8', paddingBottom: '8px' }}>
                  Ten Porutham Results
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2c1810', color: '#f5f1e3' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Porutham</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Focus</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Result</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.poruthams.map((p: PoruthamResult, i: number) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#faf8f2' : '#f5f1e3', borderBottom: '1px solid #e8e2d0' }}>
                          <td style={{ padding: '10px 12px', color: '#888' }}>{i + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>
                            {p.name}<br />
                            <span style={{ fontSize: '11px', color: '#888', fontWeight: 'normal' }}>{p.tamil}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#666', fontSize: '12px' }}>{p.importance}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{ backgroundColor: resultBg(p.result), color: resultColor(p.result), padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', border: `1px solid ${resultColor(p.result)}` }}>
                              {p.result}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#555', fontSize: '12px' }}>{p.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* NORTH INDIAN — ASHTA KOOTA */}
            {!isSouthIndian && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #dcd4b8', paddingBottom: '8px' }}>
                  Ashta Koota — Guna Milan
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2c1810', color: '#f5f1e3' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Koota</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Points</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Max</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Result</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.kootas.map((k: KootaResult, i: number) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#faf8f2' : '#f5f1e3', borderBottom: '1px solid #e8e2d0' }}>
                          <td style={{ padding: '10px 12px', color: '#888' }}>{i + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>
                            {k.name}
                            {k.dosha && <span style={{ color: '#dc2626', fontSize: '11px', display: 'block' }}>⚠ {k.dosha}</span>}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: k.points === 0 ? '#dc2626' : k.points >= k.maxPoints * 0.7 ? '#16a34a' : '#d97706' }}>
                            {k.points}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#888' }}>{k.maxPoints}</td>
                          <td style={{ padding: '10px 12px', fontSize: '12px' }}>{k.result}</td>
                          <td style={{ padding: '10px 12px', color: '#555', fontSize: '12px' }}>{k.reason}</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#2c1810', color: '#f5f1e3', fontWeight: 'bold' }}>
                        <td colSpan={2} style={{ padding: '10px 12px' }}>Total</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {results.kootas.reduce((s: number, k: KootaResult) => s + k.points, 0).toFixed(1)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>36</td>
                        <td colSpan={2} style={{ padding: '10px 12px' }}>
                          {interpretAshtaKoota(results.kootas.reduce((s: number, k: KootaResult) => s + k.points, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* DOSHA SECTION */}
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '32px 0 16px', borderBottom: '2px solid #dcd4b8', paddingBottom: '8px' }}>
              Dosha Analysis
            </h3>

            {/* Mangal Dosha */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              {[
                { label: `${results.girl.name} — Mangal Dosha`, data: results.girlMangal as MangalResult },
                { label: `${results.boy.name} — Mangal Dosha`, data: results.boyMangal as MangalResult },
              ].map(({ label, data }, i) => (
                <div key={i} style={{ flex: '1', minWidth: '240px', padding: '16px', backgroundColor: data.isManglik && !data.cancelled ? '#fef2f2' : '#f0fdf4', border: `1px solid ${data.isManglik && !data.cancelled ? '#fca5a5' : '#86efac'}`, borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                    {data.isManglik
                      ? <span style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠ Manglik {data.cancelled ? '(Cancelled)' : ''}</span>
                      : <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Not Manglik</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#555' }}>{data.reason}</div>
                  {data.cancellationReasons?.length > 1 && (
                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
                      {data.cancellationReasons.slice(1).map((r: string, i: number) => <div key={i}>✓ {r}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {results.girlMangal.isManglik && results.boyMangal.isManglik && (
              <div style={{ padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                <strong>Note:</strong> Both are Manglik — this mutually cancels the Mangal Dosha effect.
              </div>
            )}

            {/* Dasa Sandhi */}
            <div style={{ padding: '16px', backgroundColor: results.dasaSandhi.isSatisfactory ? '#f0fdf4' : '#fef2f2', border: `1px solid ${results.dasaSandhi.isSatisfactory ? '#86efac' : '#fca5a5'}`, borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>Dasa Sandhi Check</div>
              <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                {results.dasaSandhi.isSatisfactory
                  ? <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Satisfactory</span>
                  : <span style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠ Not Satisfactory</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#555' }}>
                Girl: {results.dasaSandhi.girlDasha} Dasha ends {results.dasaSandhi.girlDashaEnd} &nbsp;|&nbsp;
                Boy: {results.dasaSandhi.boyDasha} Dasha ends {results.dasaSandhi.boyDashaEnd}
              </div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{results.dasaSandhi.reason}</div>
            </div>

            {/* Papasamya */}
            <div style={{ padding: '16px', backgroundColor: results.papasamya.isSatisfactory ? '#f0fdf4' : '#fef2f2', border: `1px solid ${results.papasamya.isSatisfactory ? '#86efac' : '#fca5a5'}`, borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Papasamya — Balance of Malefic Influences</div>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                {results.papasamya.isSatisfactory
                  ? <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ {results.papasamya.verdict}</span>
                  : <span style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠ {results.papasamya.verdict}</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {[
                  { label: results.girl.name, rows: results.papasamya.girlTable, total: results.papasamya.girlPapa },
                  { label: results.boy.name, rows: results.papasamya.boyTable, total: results.papasamya.boyPapa },
                ].map(({ label, rows, total }, idx) => (
                  <div key={idx} style={{ flex: '1', minWidth: '240px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>{label} — Papa Points: {total}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#2c1810', color: '#f5f1e3' }}>
                          <th style={{ padding: '4px 6px', textAlign: 'left' }}>Planet</th>
                          <th style={{ padding: '4px 6px', textAlign: 'center' }}>Lagna</th>
                          <th style={{ padding: '4px 6px', textAlign: 'center' }}>Moon</th>
                          <th style={{ padding: '4px 6px', textAlign: 'center' }}>Venus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r: any, i: number) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#faf8f2' : '#f5f1e3' }}>
                            <td style={{ padding: '4px 6px' }}>{r.planet}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'center' }}>H{r.fromLagna} ({r.fromLagnaPapa})</td>
                            <td style={{ padding: '4px 6px', textAlign: 'center' }}>H{r.fromMoon} ({r.fromMoonPapa})</td>
                            <td style={{ padding: '4px 6px', textAlign: 'center' }}>H{r.fromVenus} ({r.fromVenusPapa})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>

            {/* OVERALL VERDICT */}
            {(() => {
              let verdict = "", verdictColor = "", verdictBg = "";
              if (isSouthIndian) {
                const matches = results.poruthams.filter((p: PoruthamResult) => p.result !== "No Match").length;
                const rajju = results.poruthams.find((p: PoruthamResult) => p.name === "Rajju Porutham");
                const rajjuOk = rajju?.result !== "No Match";
                if (!rajjuOk) { verdict = "⚠ Rajju Dosha present — marriage not recommended without expert consultation"; verdictColor = "#dc2626"; verdictBg = "#fef2f2"; }
                else if (matches >= 8) { verdict = "✓ Excellent match — highly compatible"; verdictColor = "#16a34a"; verdictBg = "#f0fdf4"; }
                else if (matches >= 6) { verdict = "✓ Good match — compatible with minor considerations"; verdictColor = "#16a34a"; verdictBg = "#f0fdf4"; }
                else { verdict = "⚠ Moderate match — consult an expert astrologer"; verdictColor = "#d97706"; verdictBg = "#fffbeb"; }
              } else {
                const total = results.kootas.reduce((s: number, k: KootaResult) => s + k.points, 0);
                const nadiDosha = results.kootas.find((k: KootaResult) => k.name === "Nadi")?.points === 0;
                if (nadiDosha) { verdict = "⚠ Nadi Dosha present — consult an expert astrologer"; verdictColor = "#dc2626"; verdictBg = "#fef2f2"; }
                else if (total >= 32) { verdict = "✓ Excellent match — highly compatible"; verdictColor = "#16a34a"; verdictBg = "#f0fdf4"; }
                else if (total >= 24) { verdict = "✓ Good match — compatible"; verdictColor = "#16a34a"; verdictBg = "#f0fdf4"; }
                else if (total >= 18) { verdict = "⚠ Average match — proceed with caution"; verdictColor = "#d97706"; verdictBg = "#fffbeb"; }
                else { verdict = "⚠ Poor match — not recommended"; verdictColor = "#dc2626"; verdictBg = "#fef2f2"; }
              }
              return (
                <div style={{ padding: '20px', backgroundColor: verdictBg, border: `2px solid ${verdictColor}`, borderRadius: '4px', textAlign: 'center', marginTop: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: verdictColor }}>{verdict}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    This is a preliminary analysis. Always consult a qualified Vedic astrologer for final guidance.
                  </div>
                </div>
              );
            })()}

          </div>
        )}
      </div>
    </div>
    </>
  );
}
