# 🌍 GeoSite PLN (GeoMap Bangunan)

Sebuah aplikasi pemetaan interaktif (*Web-based GIS*) super cepat yang dirancang untuk merender **jutaan data bangunan** tanpa membuat *browser crash*. Aplikasi ini dikhususkan untuk mencocokkan titik koordinat ID Pelanggan PLN dari file Excel ke data tapak bangunan sesungguhnya di lapangan secara presisi.

![GeoSite PLN UI](https://img.shields.io/badge/UI-Interactive-blue)
![Python Backend](https://img.shields.io/badge/Backend-Python_3-yellow)
![Leaflet.js](https://img.shields.io/badge/Map-Leaflet.js-brightgreen)

## ✨ Fitur Utama

- 🚀 **High-Performance Rendering**: Mampu menangani hingga **6.5+ Juta** poligon bangunan menggunakan teknik *chunk rendering* asinkron.
- 🎯 **Smart Data Matching (Point-in-Polygon)**: Unggah file `.xlsx` atau `.csv` ID Pelanggan, sistem akan otomatis mencocokkan titik tersebut ke atap bangunan.
- 📏 **Auto-Tolerance GPS**: Algoritma toleransi otomatis sebesar ~15 meter. Jika koordinat GPS sedikit meleset dari atap, sistem tetap akan mengenalinya dan menandai bangunan sebagai **Atap Terisi**.
- 🎨 **Dynamic Color Coding**:
  - 🟪 **Ungu (Data Normal)**: Atap Kosong / Tanpa Pelanggan.
  - 🟦 **Biru (Atap Terisi)**: Atap yang memiliki ID Pelanggan.
  - 🟩 **Titik Hijau**: ID Pelanggan yang sesuai (berada di atap).
  - 🟥 **Titik Merah**: ID Pelanggan melenceng / tidak ada atap di sekitarnya.
- 📡 **Server Mandiri (No API Key)**: Menggunakan database SQLite lokal (`.db`) dan tidak membutuhkan API Key khusus untuk peta (hanya base layer OSM).
- 📱 **Sidebar & Minimap Integrasi**: Panel detail super lengkap dengan minimap citra satelit langsung.

---

## 🛠️ Persyaratan Sistem (Prerequisites)

Sebelum menjalankan aplikasi, pastikan komputer Anda telah terinstal:
- **Python 3.8 atau lebih baru** (disarankan Python 3.13)
- Library Python: `pandas`, `openpyxl`, (dan bawaan standar `sqlite3`, `http.server`, `json`)
- Browser Modern (Google Chrome / Microsoft Edge / Mozilla Firefox)

---

## 🚀 Panduan Instalasi (Installation)

1. **Clone (Unduh) Repository ini** ke komputer Anda:
   ```bash
   git clone https://github.com/rizkipr05/geosite-pln.git
   cd geosite-pln
   ```

2. **Siapkan Database Bangunan**:
   Pastikan Anda memiliki file `buildings.db` (database SQLite berisi data bangunan).
   Letakkan file tersebut ke dalam folder `data/` sehingga path-nya menjadi:
   `geosite-pln/data/buildings.db`
   *(Catatan: File DB sangat besar sehingga tidak disertakan di GitHub ini)*.

3. **Instal Library yang Dibutuhkan**:
   Buka terminal di folder project, lalu jalankan:
   ```bash
   pip install pandas openpyxl
   ```

---

## 💻 Cara Menjalankan Aplikasi

1. Buka Terminal / Command Prompt / PowerShell di dalam folder `geosite-pln`.
2. Jalankan server lokal Python dengan perintah berikut:
   ```bash
   python geoserver.py
   ```
3. Server akan langsung menyala! Buka browser favorit Anda dan akses URL:
   👉 **http://localhost:8080**
4. Peta akan termuat otomatis sesuai koordinat awal yang ada di `config.js`.

---

## 📂 Cara Penggunaan Fitur Pencocokan Data (Excel)

1. Klik tombol **`[+] Upload Excel/CSV`** di pojok kanan atas aplikasi web.
2. Pilih file Excel Anda (misalnya `MINTA KOORDINAT GARDU.xlsx`).
   *(Pastikan file Anda setidaknya memiliki kolom bernama `LATITUDE` dan `LONGITUDE`)*.
3. Aplikasi akan langsung memetakan titik-titik tersebut. Titik yang jatuh di atas bangunan (dengan toleransi GPS ~15m) akan otomatis mewarnai atap menjadi **Biru**.
4. Klik pada atap berwarna Biru untuk melihat Detail Pelanggan beserta *Minimap* Satelit.

---

## ⚙️ Penyesuaian Lanjutan (*Customization*)

Jika Anda ingin mengubah tampilan warna, koordinat awal peta, atau tingkat *zoom*, Anda cukup mengedit file **`config.js`**:
```javascript
const CONFIG = {
  DEFAULT_CENTER: { lat: -2.5489, lng: 118.0149 },
  DEFAULT_ZOOM: 5,
  BUILDING_STYLE: { fillColor: "#6366f1", ... },          // Atap Kosong (Ungu)
  BUILDING_MATCHED_STYLE: { fillColor: "#3b82f6", ... },  // Atap Terisi (Biru)
};
```

---
Dibuat dengan ❤️ untuk kemudahan pemetaan digital.
