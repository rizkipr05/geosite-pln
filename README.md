🌍 GeoSite PLN IoT — GeoMap Bangunan Cerdas

Platform WebGIS dan Internet of Things (IoT) untuk Pemetaan Bangunan, Validasi Koordinat Pelanggan, dan Monitoring Infrastruktur PLN.

GeoSite PLN IoT merupakan aplikasi pemetaan digital berbasis web yang dirancang untuk mengintegrasikan data bangunan, koordinat ID Pelanggan PLN, dan perangkat IoT dalam satu platform terpusat.

!UI !Backend !Map !IoT !Database

✨ Fitur Utama
🚀 High-Performance Mapping
Mendukung visualisasi jutaan poligon bangunan.
Menggunakan teknik chunk rendering untuk mengoptimalkan pemuatan data.
Mendukung navigasi peta, zoom, dan identifikasi bangunan.
Menggunakan Leaflet.js dan OpenStreetMap.
🎯 Smart Customer Matching
Mendukung file Excel (.xlsx) dan CSV.
Membaca kolom LATITUDE dan LONGITUDE.
Menggunakan algoritma Point-in-Polygon.
Mendukung toleransi GPS sekitar 15 meter yang dapat disesuaikan.
Membantu validasi koordinat pelanggan terhadap tapak bangunan.
📡 IoT Integration
Mendukung pengembangan integrasi perangkat IoT.
Mendukung komunikasi menggunakan MQTT atau HTTP API.
Memungkinkan integrasi GPS dan sensor lapangan.
Dapat dikembangkan untuk monitoring status perangkat secara real-time.

Catatan: Monitoring real-time memerlukan perangkat IoT, koneksi jaringan, backend penerima data, dan konfigurasi tambahan.

🎨 Dynamic Color Coding
Warna	Keterangan
🟪 Ungu	Bangunan belum teridentifikasi
🟦 Biru	Bangunan cocok dengan data pelanggan
🟩 Hijau	Koordinat pelanggan cocok
🟥 Merah	Koordinat perlu diverifikasi
🟧 Oranye	Perangkat IoT perlu diperiksa
🛰️ Dashboard Monitoring
Panel detail bangunan dan pelanggan.
Minimap untuk pemeriksaan lokasi.
Informasi koordinat geografis.
Ringkasan hasil pencocokan.
Pengembangan monitoring perangkat IoT.
🗄️ Database dan Backend
SQLite untuk penyimpanan data lokal.
Python untuk backend.
OpenStreetMap sebagai peta dasar tanpa API key khusus.
Dapat dikembangkan menggunakan database spasial.
🛠️ Persyaratan Sistem
Python 3.8 atau lebih baru.
Library pandas dan openpyxl.
Database buildings.db.
Browser modern.
Koneksi internet jika menggunakan layanan peta eksternal atau komunikasi IoT.

Komponen tambahan untuk IoT:

MQTT broker, seperti Eclipse Mosquitto.
Perangkat IoT atau gateway.
Backend penerima data.
Perangkat GPS atau sensor sesuai kebutuhan.
🚀 Instalasi
1. Clone Repository
git clone https://github.com/rizkipr05/geosite-pln.git
cd geosite-pln

2. Siapkan Database

Letakkan file database pada lokasi berikut:

geosite-pln/
├── data/
│   └── buildings.db
├── geoserver.py
├── config.js
└── ...


Pastikan database tersedia dan struktur tabelnya sesuai dengan aplikasi.

3. Instal Library
python -m pip install pandas openpyxl

4. Jalankan Server
python geoserver.py


Buka browser dan akses:

http://localhost:8080

📂 Penggunaan Data Pelanggan
Buka aplikasi melalui browser.
Klik tombol Upload Excel/CSV.
Pilih file Excel atau CSV.
Pastikan terdapat kolom LATITUDE dan LONGITUDE.
Tunggu proses pencocokan koordinat.
Periksa warna bangunan dan titik pelanggan.
Klik bangunan untuk melihat detail yang tersedia.

Catatan: Toleransi GPS sekitar 15 meter merupakan nilai awal. Hasil pencocokan perlu diverifikasi karena titik yang dekat dengan bangunan belum tentu berada tepat di atapnya.

⚙️ Konfigurasi Peta

Edit file config.js untuk menyesuaikan koordinat awal, zoom, dan warna bangunan.

const CONFIG = {
  DEFAULT_CENTER: {
    lat: -2.5489,
    lng: 118.0149
  },

  DEFAULT_ZOOM: 5,

  BUILDING_STYLE: {
    fillColor: "#6366f1"
  },

  BUILDING_MATCHED_STYLE: {
    fillColor: "#3b82f6"
  }
};

📡 Arsitektur IoT

Alur pengembangan integrasi IoT:

Perangkat lapangan mengumpulkan data.
Data dikirim melalui MQTT atau HTTP.
Backend menerima dan memvalidasi data.
Database menyimpan data perangkat.
Sistem memproses koordinat secara geospasial.
Dashboard menampilkan lokasi dan status perangkat.
🔐 Keamanan Sistem
Validasi file dan input pengguna.
Gunakan autentikasi perangkat IoT.
Terapkan komunikasi terenkripsi jika tersedia.
Batasi akses terhadap data pelanggan.
Catat aktivitas dan waktu pembaruan data.
Optimalkan database dan pemrosesan bertahap.
🔮 Pengembangan Selanjutnya
Integrasi MQTT untuk komunikasi perangkat.
Dashboard monitoring real-time.
Pembaruan posisi perangkat otomatis.
Riwayat pengiriman data.
Notifikasi perangkat offline.
Optimasi pemrosesan jutaan bangunan.
Sistem autentikasi dan hak akses pengguna.

Fitur tambahan tersebut memerlukan implementasi backend dan integrasi perangkat yang sesuai.

❤️ Penutup

GeoSite PLN IoT menggabungkan teknologi WebGIS, pemrosesan geospasial, dan konsep Internet of Things untuk mendukung pemetaan bangunan serta validasi koordinat pelanggan.

GeoSite PLN IoT — Satu Peta, Data Terintegrasi, Monitoring Lebih Cerdas.
