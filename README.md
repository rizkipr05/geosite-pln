# 🌍 GeoSite PLN IoT — Sistem WebGIS & Monitoring Infrastruktur Cerdas

Platform WebGIS dan **Internet of Things (IoT)** untuk Pemetaan Bangunan Cerdas, Validasi Koordinat ID Pelanggan, Integrasi Telemetri Sensor, dan Monitoring Aset Kelistrikan PLN (Smart Grid & Gardu Distribusi).

---

## 📌 Daftar Isi
- [Tentang GeoSite PLN IoT](#-tentang-geosite-pln-iot)
- [Arsitektur Sistem IoT & Smart Grid](#-arsitektur-sistem-iot--smart-grid)
- [Fitur Utama](#-fitur-utama)
- [Skema Kodifikasi Warna Visual](#-skema-kodifikasi-warna-visual)
- [Spesifikasi Protokol & Payload Data IoT](#-spesifikasi-protokol--payload-data-iot)
- [Struktur Direktori](#-struktur-direktori)
- [Persyaratan Sistem & Komponen IoT](#-persyaratan-sistem--komponen-iot)
- [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
- [Panduan Pengolahan Data Pelanggan & Perangkat](#-panduan-pengolahan-data-pelanggan--perangkat)
- [Konfigurasi Sistem](#-konfigurasi-sistem)
- [Format Ekspor Data](#-format-ekspor-data)
- [Keamanan & Skalabilitas IoT](#-keamanan--skalabilitas-iot)
- [Roadmap Pengembangan IoT Smart Grid](#-roadmap-pengembangan-iot-smart-grid)

---

## 💡 Tentang GeoSite PLN IoT

Dalam era transformasi digital ketenagalistrikan menuju **Smart Grid** dan **AMI (Advanced Metering Infrastructure)**, integrasi perangkat pintar (*smart meters*, sensor gardu, logger GPS) menghasilkan data telemetri yang sangat masif. Namun, data telemetri numerik sering kali kehilangan nilai optimalnya jika tidak terpetakan secara presisi pada koordinat fisik bangunannya.

**GeoSite PLN IoT** hadir sebagai jembatan antara **dunia fisik (Internet of Things)** dan **analisis geospasial (WebGIS)**:
1. **Mengintegrasikan Jutaan Tapak Bangunan (*Building Footprints*)**: Memanfaatkan data spasial poligon riil dengan teknik rendering bertahap (*chunk rendering*) yang sangat efisien.
2. **Validasi & Penyelarasan Koordinat Sensor Lapangan**: Menghubungkan titik koordinat perangkat IoT dan ID Pelanggan dengan tapak bangunan menggunakan algoritma *Point-in-Polygon* serta toleransi offset GPS lapangan ($\pm 15 - 30\text{ m}$).
3. **Monitoring Aset Infrastruktur Terpusat**: Memetakan persebaran aset Gardu Distribusi PLN (kapasitas kVA, penyulang, lokasi) dan status sambungan ke bangunan pelanggan.

---

## 🏗️ Arsitektur Sistem IoT & Smart Grid

Alur integrasi arsitektur sistem dari perangkat lapangan hingga visualisasi peta interaktif:

```mermaid
graph TD
    subgraph Layer Persepsi Lapangan (IoT Devices & Survey)
        D1[Smart kWh Meter / AMI<br/>Sensor Tegangan & Arus] -->|Koneksi NBIoT/4G/LoRa| GW[IoT Gateway Lapangan]
        D2[Sensor Gardu Distribusi<br/>kVA, Suhu Trafo, Status] -->|Modbus / Serial| GW
        D3[Perangkat GPS Surveyor<br/>Koordinat Pelanggan Lapangan] -->|Log Excel/CSV| FS[File Survei & Aset]
    end

    subgraph Layer Jaringan & Komunikasi (Broker / Ingestion)
        GW -->|Protokol MQTT / MQTTS| BRK[MQTT Broker<br/>Eclipse Mosquitto / EMQX]
        GW -->|HTTP REST API| API[API Ingestion Gateway]
    end

    subgraph Layer Penyimpanan & Geoserver (Backend)
        BRK --> BE[Python Backend Processor]
        API --> BE
        FS -->|convert_to_db.py / convert_gardu.py| DB[(SQLite Spatial DB<br/>buildings.db & gardu.db)]
        BE --> DB
        DB --> GS[geoserver.py<br/>Spatial Query Engine BBox API]
    end

    subgraph Layer Presentasi & Monitoring (WebGIS Frontend)
        GS -->|Viewport BBox JSON| UI[WebGIS Dashboard<br/>Leaflet.js + Esri Satellite]
        UI --> MTR[Real-time Monitoring & Inspector]
        UI --> PIP[Point-in-Polygon Engine<br/>Customer & Device Snapping]
        UI --> EXP[Ekspor Data Validasi .xlsx/.csv]
    end
```

---

## ✨ Fitur Utama

- 📡 **Integrasi Konsep Internet of Things (IoT)**
  - Dirancang untuk menerima data perangkat lapangan: ID perangkat, koordinat posisi, waktu pembaruan (*timestamp*), dan telemetri daya.
  - Kompatibel dengan model komunikasi berbasis protokol **MQTT** maupun **HTTP REST API**.
- 🚀 **High-Performance Spatial Mapping (BBox Chunk Query)**
  - Mampu menampilkan visualisasi ratusan ribu hingga jutaan poligon bangunan tanpa degradasi performa browser.
  - Kueri spasial adaptif berbasis batas pandang (*Bounding Box*) dengan limit fitur dinamis per tingkat zoom (1.000 hingga 5.000 poligon).
  - SQLite backend teroptimasi menggunakan mode *WAL (Write-Ahead Logging)* dan pengindeksan koordinat spasial.
- 🎯 **Smart Device & Customer Matching (Point-in-Polygon)**
  - Memverifikasi apakah koordinat perangkat IoT atau pelanggan berada tepat pada atap/tapak bangunan (*roof footprint*).
  - Dilengkapi perhitungan toleransi deviasi posisi GPS ($\approx 30\text{ meter}$) berbasis algoritma jarak ortogonal terpendek ke segmen poligon (*point-to-segment distance*).
  - Otomatis melakukan *centroid snapping* (menarik posisi titik ke titik pusat atap) untuk merapikan persebaran data.
- ⚡ **Monitoring Gardu Distribusi PLN**
  - Penyimpanan dan visualisasi data gardu distribusi terintegrasi (`gardu.db`): Nomor Gardu, Daya Trafo (kVA), Nama Penyulang, dan Titik Lokasi Fisik.
- 🗺️ **Pilihan Lapisan Peta Dasar (Basemap Ganda)**
  - **OpenStreetMap (OSM)**: Untuk analisis jaringan jalan dan toponimi.
  - **Esri World Imagery (Citra Satelit)**: Untuk verifikasi visual langsung tapak atap bangunan dan lingkungan fisik perangkat tanpa perlu API key khusus.
- 📊 **Panel Kontrol Statistik & Inspeksi Real-Time**
  - Kartu statistik: Total bangunan tersimpan, jumlah bangunan yang sedang terlihat (*visible*), dan objek terpilih (*selected*).
  - Panel rincian informasi bangunan: Luas atap ($m^2$), Plus Code, status perangkat terpasang, dan ID Pelanggan.

---

## 🎨 Skema Kodifikasi Warna Visual

Indikator visual tematik dirancang untuk mempercepat identifikasi status koneksi perangkat dan validitas data di peta:

| Indikator | Warna | Status Operasional | Deskripsi Teknis |
| :---: | :--- | :--- | :--- |
| 🟪 | **Ungu** (`#6366f1`) | **Bangunan Standar (Unmatched)** | Tapak bangunan belum terpasang perangkat IoT atau belum ada data pelanggan yang cocok. |
| 🟦 | **Biru** (`#3b82f6`) | **Bangunan Aktif (Matched)** | Tapak bangunan yang memiliki satu atau lebih perangkat IoT / pelanggan valid di dalamnya. |
| 🟧 | **Oranye** (`#f59e0b`) | **Objek Terpilih (Selected)** | Poligon bangunan atau perangkat yang sedang aktif diinspeksi oleh operator. |
| 🟩 | **Titik Hijau** (`#10b981`) | **Perangkat / Titik Valid** | Titik koordinat berada tepat di dalam tapak bangunan atau dalam batas toleransi radius atap. |
| 🟥 | **Titik Merah** (`#ef4444`) | **Perangkat Perlu Verifikasi** | Titik koordinat berada di luar tapak bangunan (indikasi GPS melenceng, perangkat dipindahkan, atau perlu survei ulang). |

---

## 📡 Spesifikasi Protokol & Payload Data IoT

Sistem dirancang untuk mendukung integrasi data perangkat IoT menggunakan struktur JSON standar:

### Contoh Payload Telemetri Perangkat IoT (MQTT / HTTP)
```json
{
  "device_id": "PLN-SMART-METER-08921",
  "customer_id": "542100876543",
  "device_type": "AMI_METER",
  "timestamp": 1728637200,
  "location": {
    "latitude": -6.214620,
    "longitude": 106.845130,
    "gps_accuracy_meters": 4.8
  },
  "measurements": {
    "voltage_v": 221.5,
    "current_a": 12.4,
    "power_factor": 0.96,
    "active_power_kw": 2.63,
    "energy_kwh": 1420.8
  },
  "status": {
    "tamper_alert": false,
    "relay_state": "CONNECTED",
    "signal_quality_csq": 28
  }
}
```

### Topik MQTT yang Direkomendasikan
- Publikasi Data Telemetri: `pln/iot/telemetry/{device_type}/{device_id}`
- Status Perangkat & LWT (*Last Will & Testament*): `pln/iot/status/{device_id}`
- Perintah Kontrol Relay / Pembacaan Jarak Jauh: `pln/iot/command/{device_id}`

---

## 📁 Struktur Direktori

```text
geosite-pln/
├── data/                             # Folder penyimpanan data lokal (diabaikan dari Git)
│   ├── buildings.db                  # Database SQLite tapak bangunan (WKT & spatial index)
│   ├── gardu.db                      # Database SQLite data gardu distribusi PLN
│   ├── 2e5_buildings.csv             # Sumber dataset mentah bangunan (opsional)
│   └── MINTA KOORDINAT GARDU.xlsx    # Data survei & gardu distribusi PLN (opsional)
├── app.js                            # Logika WebGIS, spatial matching, dan rendering
├── config.js                         # Konfigurasi koordinat peta, zoom level, & warna
├── convert_gardu.py                  # Skrip konversi Excel data gardu ke SQLite
├── convert_to_db.py                  # Skrip ETL konversi CSV jutaan bangunan ke SQLite
├── geoserver.py                      # Server backend Python dengan API spatial query
├── index.html                        # Tampilan dashboard WebGIS responsif
├── style.css                         # Desain antarmuka modern tema gelap
├── package.json                      # Konfigurasi dependensi modul Excel (xlsx)
└── README.md                         # Dokumentasi lengkap sistem
```

---

## 🛠️ Persyaratan Sistem & Komponen IoT

### 1. Komponen Perangkat Lunak WebGIS
- **Python**: Versi 3.8 atau lebih baru.
- **Pustaka Python**:
  - `pandas` (analisis & manipulasi data tabular)
  - `openpyxl` (pemrosesan lembar kerja Excel)
- **Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari modern.

### 2. Komponen Pendukung Implementasi IoT (Opsional)
- **MQTT Broker**: Eclipse Mosquitto, EMQX, atau HiveMQ.
- **Perangkat Keras IoT**: ESP32, Raspberry Pi, Gateway Modbus, atau modul modem seluler (4G LTE / NB-IoT).
- **Sensor Lapangan**: Trafo Arus (CT), Sensor Tegangan (PT), Modul GPS (NEO-6M / NEO-M8N).

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Clone Repository
```bash
git clone https://github.com/rizkipr05/geosite-pln.git
cd geosite-pln
```

### 2. Instal Dependensi Python
```bash
python -m pip install pandas openpyxl
```

### 3. Persiapan Database Spasial

#### A. Database Bangunan (`data/buildings.db`)
Jika memiliki file dataset bangunan skala besar (misalnya `data/2e5_buildings.csv`):
```bash
python convert_to_db.py
```
> *Catatan*: Skrip ini menggunakan batching 50.000 baris dengan mode SQLite WAL untuk konversi jutaan baris data secara efisien.

#### B. Database Gardu Distribusi (`data/gardu.db`)
Jika memiliki data Excel gardu PLN (`data/MINTA KOORDINAT GARDU.xlsx`):
```bash
python convert_gardu.py
```

### 4. Menjalankan Server Lokal
Jalankan server backend:
```bash
python geoserver.py
```
Server akan aktif melayani request statis dan API spasial pada port `8080`.

### 5. Akses Dashboard WebGIS
Buka browser dan kunjungi:
```text
http://localhost:8080
```

---

## 📂 Panduan Pengolahan Data Pelanggan & Perangkat

1. **Format File Input**: Siapkan file survei atau log perangkat dalam format Excel (`.xlsx`), CSV, atau GeoJSON dengan kolom:
   - Kolom Koordinat: `LATITUDE` dan `LONGITUDE` (atau `KOORDINAT_X` dan `KOORDINAT_Y`).
   - Kolom Identitas: `ID_PELANGGAN`, `NAMA`, `TARIF`, `DAYA`, dsb.
2. **Unggah File**: Buka antarmuka GeoSite PLN IoT, lalu seret (*drag and drop*) file ke panel **Dataset** di sidebar kiri.
3. **Pencocokan Geospasial Otomatis**:
   - Sistem akan memproses titik koordinat secara langsung terhadap batas poligon bangunan yang terlihat pada layar.
   - Titik yang tepat berada di atap/radius toleransi berubah menjadi **Hijau** dan tapak bangunan menjadi **Biru**.
   - Titik yang tidak menemukan bangunan dalam radius toleransi ditandai **Merah**.
4. **Inspeksi Citra Satelit**: Aktifkan lapisan **Esri Satellite** untuk melakukan *ground check* visual kondisi fisik atap bangunan dan jaringan instalasi kabel.
5. **Ekspor Hasil**: Klik tombol **Export Data** untuk mengunduh laporan hasil verifikasi geospasial dalam format `.xlsx`.

---

## ⚙️ Konfigurasi Sistem

Pengaturan awal peta dan visualisasi dapat disesuaikan melalui file [`config.js`](file:///home/rizky/Documents/geosite-pln/config.js):

```javascript
const CONFIG = {
  // Koordinat pusat peta awal (Indonesia)
  DEFAULT_CENTER: { lat: -2.5489, lng: 118.0149 },
  DEFAULT_ZOOM: 5,

  // Gaya visual bangunan belum teridentifikasi
  BUILDING_STYLE: {
    fillColor: "#6366f1",
    fillOpacity: 0.45,
    color: "#4f46e5",
    weight: 1.5,
  },

  // Gaya visual bangunan yang cocok dengan perangkat/pelanggan
  BUILDING_MATCHED_STYLE: {
    fillColor: "#3b82f6",
    fillOpacity: 0.65,
    color: "#2563eb",
    weight: 2,
  },

  // Gaya visual saat bangunan dipilih
  BUILDING_SELECTED_STYLE: {
    fillColor: "#f59e0b",
    fillOpacity: 0.7,
    color: "#d97706",
    weight: 3,
  },

  APP_TITLE: "GeoMap Bangunan — IoT Monitoring",
};
```

---

## 📊 Format Ekspor Data

Laporan hasil pemetaan yang diekspor menyertakan atribut spasial dan operasional:

| Nama Kolom | Nilai / Format | Penjelasan |
| :--- | :--- | :--- |
| `Status_Bangunan` | `Dalam Kotak Bangunan` / `Di Luar Bangunan` | Status keberadaan perangkat terhadap tapak bangunan |
| `Status_Atap` | `Ada Pelanggan` / `Tidak Ada Pelanggan` | Status okupansi tapak bangunan oleh ID pelanggan |
| `latitude` / `longitude` | Desimal Derajat (WGS84) | Koordinat posisi titik perangkat / survei asli |
| `Center_Lat` / `Center_Lng` | Desimal Derajat (WGS84) | Titik pusat (*centroid*) atap bangunan hasil *snapping* |
| `Luas_Bangunan_m2` | Angka numerik ($m^2$) | Estimasi luas tapak atap bangunan |
| `Plus_Code` | String alfanumerik | Kode lokasi global unik (*Open Location Code*) |
| Atribut Pelanggan | Sesuai data input | ID Pelanggan, Tarif, Daya, No Gardu, Penyulang, dll. |

---

## 🔐 Keamanan & Skalabilitas IoT

1. **Integritas & Validasi Input**: Memfilter struktur file dan koordinat sebelum diproses guna mencegah kesalahan eksekusi.
2. **Koneksi Terenkripsi**: Implementasi protokol MQTTS (port 8883) dan HTTPS (port 443) dengan sertifikat SSL/TLS untuk transmisi data dari lapangan.
3. **Autentikasi Token Perangkat**: Penggunaan username/password unik atau sertifikat X.509 untuk setiap gateway perangkat IoT yang terhubung ke broker.
4. **Optimasi Kueri Spasial**: Pembagian pembacaan data berbasis Bounding Box (BBox) untuk menjaga konsumsi memori backend dan kelancaran browser.

---

## 🔮 Roadmap Pengembangan IoT Smart Grid

- [ ] **Koneksi Langsung MQTT Real-Time**: Integrasi WebSocket MQTT klien langsung pada antarmuka peta untuk memperbarui status daya perangkat secara *live*.
- [ ] **Deteksi Pemadaman Otomatis (*Outage Alert*)**: Indikator alarm visual saat perangkat AMI mengirimkan sinyal pemadaman (*last-gasp signal*).
- [ ] **Heatmap Densitas Beban Geospasial**: Peta panas konsumsi energi untuk analisis kelebihan beban (*overload*) pada gardu distribusi.
- [ ] **Manajemen Hak Akses Berjenjang**: Sistem autentikasi pengguna berbasis role (Surveyor, Dispatcher, Engineer, Manajer Unit).

---

<div align="center">
  <b>GeoSite PLN IoT — Satu Peta, Data Terintegrasi, Monitoring Lebih Cerdas.</b><br/>
  <i>Mendukung Transformasi Digital Pemetaan & Monitoring Infrastruktur Kelistrikan Berbasis IoT.</i>
</div>
