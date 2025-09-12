# ChandraPrabha
Chandra Prabha — Sidereal Vedic birth-chart app (Lahiri). Enter birth details to generate South-Indian charts and a clean, print-friendly multi-page report.
# Chandra Prabha — The Radiance of the Moon

Sidereal (Lahiri) Vedic astrology birth‑chart web app. Enter birth details to generate South‑Indian style charts and a clean, print‑friendly multi‑page report.

**Live demo:** [https://chandra-prabha-web-production.up.railway.app](https://chandra-prabha-web-production.up.railway.app)

---

## ✨ Features

* **Sidereal (Lahiri) accuracy** powered by Swiss Ephemeris (`swisseph`)
* **South‑Indian fixed‑sign charts** — Rāśi (D1); Navāṁśa (D9) supported
* **Concise report** with charts and key tables; designed to print to PDF
* **One‑page form** → instant output, mobile‑friendly (add to Home Screen)
* Server‑side time‑zone handling; reproducible results

---

## 🚀 Quick Start (Local)

**Requirements:** Node.js ≥ 18

```bash
# install deps
npm ci

# dev server
npm run dev

# production build & run
npm run build
npm start
```

If `swisseph` needs compiling on Linux, ensure build tools are present (e.g., `python3`, `make`, `g++`).

---

## 🧭 Usage (Step‑by‑Step)

1. **Open the app** → **Live demo** link above.
2. **Fill the form:**

   * **Name** (any text)
   * **Date** (YYYY‑MM‑DD)
   * **Time** (HH\:MM\:SS)
   * **Timezone** (e.g., `Asia/Kolkata`, `America/New_York`)
   * **Birthplace** (e.g., `Chennai, India`)
3. **Geocode the place:** Click **Geocode**.

   * If coordinates appear, click **Use** to fill Latitude/Longitude automatically.
   * **If geocode doesn’t return a result:**

     * Open **latlong.net** in a new tab.
     * Search your place (e.g., `Chennai, India`).
     * Copy the **Latitude** and **Longitude** shown there.
     * Paste them into the app’s **Lat** and **Lon** fields manually (you can skip Geocode).
4. Click **Create Chart**.
5. **View results:** Rāśi (D1), Navāṁśa (D9), and a multi‑page report.
6. **Print / Save to PDF:**

   * Use your browser’s **Print** (⌘/Ctrl+P) → **Save as PDF**.
   * For best results, enable **Background graphics** and **A4/Letter** as needed.

**Tip (iPhone/iPad):** In Safari → Share → **Add to Home Screen** to get an app‑like icon.

---

## 📝 Notes on Time & Place

* Use the **correct timezone** for the birth location/date (e.g., `Asia/Kolkata` for India; `America/Los_Angeles` for California). Daylight Saving Time is handled by the selected timezone.
* If a historical location is ambiguous or the city is missing, prefer **manual Lat/Lon** with the method above.

---

## 🔧 Deployment

* The live demo is deployed on **Railway** as a Node/Next.js app.
* To deploy your fork:

  1. Push your repo to GitHub.
  2. In Railway, create a project from GitHub and select your repo.
  3. Railway auto‑builds with `next build` and runs `next start`.
  4. A public `*.up.railway.app` URL is provided. Custom domain is optional (CNAME to the service URL).

---

## 🧰 Tech Stack

* **Next.js** (App Router), **Node.js**
* **Swiss Ephemeris** (`swisseph`) for astronomical calculations
* **Luxon** for date/time handling
* Minimal API routes: `/api/chart`, `/api/geocode`

---

## 🔒 Privacy

* Inputs are used only to compute the chart. No accounts required and no intentional data storage.

---

## ❓ Troubleshooting

* **“Not Found – The train has not arrived at the station.”** Use the correct public URL shown by your host (Railway). If you changed projects, ensure you’re opening the active service URL.
* **Geocode returns nothing:** Use the **manual Lat/Lon** method via **latlong.net** and paste into the form.
* **Timezone confusion:** Double‑check the zone string (e.g., `America/New_York` vs `America/Los_Angeles`).
* **Local build issues (Linux):** Install build tools before `npm ci` (`python3`, `make`, `g++`).

---

## 📍 Roadmap

* D2/D3 vargas (Hora, Drekkana, Daśāṁśa, etc.)
* Panchāṅga and star‑lord details
* One‑click PDF export with logo/header
* Translations (EN/Ta)

---

## 📜 Credits

* **Swiss Ephemeris** © Astrodienst AG — used under their license.

---

## 📄 License

Copyright © 2025 Raja Nagarajan. All rights reserved. (You may replace this with MIT or another license if you plan community contributions.)
