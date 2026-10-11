🌍 GeoSite PLN IoT — GeoMap Bangunan Cerdas

Platform WebGIS dan Internet of Things (IoT) untuk Pemetaan Bangunan, Validasi Koordinat Pelanggan, dan Monitoring Infrastruktur PLN.

GeoSite PLN IoT adalah aplikasi pemetaan digital berbasis web yang dirancang untuk mengintegrasikan data bangunan, koordinat ID Pelanggan PLN, dan perangkat IoT dalam satu platform terpusat.

Sistem ini mendukung visualisasi jutaan poligon bangunan, pencocokan koordinat pelanggan secara otomatis, serta pengembangan pemantauan perangkat lapangan secara real-time melalui integrasi IoT.

Dengan menggabungkan teknologi WebGIS, Python, SQLite, Leaflet.js, dan protokol komunikasi IoT, GeoSite PLN IoT membantu meningkatkan akurasi pemetaan, efisiensi validasi data, dan kemudahan pemantauan infrastruktur kelistrikan.

!GeoSite PLN UI !Python Backend !Map Engine !IoT Integration !Database

✨ Fitur Utama
🚀 1. High-Performance Geospatial Mapping
Dirancang untuk memvisualisasikan jutaan poligon bangunan menggunakan teknik asynchronous chunk rendering.
Mengoptimalkan pemuatan data untuk mengurangi penggunaan memori browser.
Mendukung navigasi peta, zoom, pencarian lokasi, dan identifikasi bangunan.
Menggunakan Leaflet.js dengan OpenStreetMap sebagai peta dasar.
🎯 2. Smart Customer Matching
Mendukung impor data pelanggan dari file Excel (.xlsx) dan CSV.
Membaca koordinat pelanggan melalui kolom LATITUDE dan LONGITUDE.
Menggunakan algoritma Point-in-Polygon untuk mencocokkan titik koordinat dengan tapak bangunan.
Mendukung toleransi GPS sekitar 15 meter yang dapat disesuaikan.
Menampilkan hasil pencocokan untuk membantu proses validasi lokasi pelanggan.
📡 3. Internet of Things (IoT) Integration
Mendukung pengembangan integrasi perangkat IoT untuk mengirimkan data koordinat, sensor, dan status perangkat.
Mendukung rancangan komunikasi menggunakan protokol MQTT atau HTTP API.
Memungkinkan integrasi perangkat GPS, sensor, dan perangkat monitoring infrastruktur.
Menyediakan fondasi pemantauan status koneksi perangkat dan waktu pembaruan data terakhir.
Memungkinkan pengiriman data otomatis dari perangkat lapangan menuju server.

Catatan: Fitur monitoring real-time memerlukan perangkat IoT, koneksi komunikasi, backend penerima data, dan konfigurasi tambahan. Fitur tersebut tidak otomatis aktif hanya dengan menjalankan aplikasi WebGIS.

🎨 4. Dynamic Color Coding
Warna	Keterangan
🟪 Ungu	Bangunan belum teridentifikasi memiliki data pelanggan yang cocok
🟦 Biru	Bangunan yang cocok dengan satu atau lebih titik pelanggan
🟩 Hijau	Titik koordinat pelanggan yang berhasil dicocokkan
🟥 Merah	Titik koordinat yang tidak cocok atau perlu diverifikasi
🟧 Oranye	Status perangkat IoT yang memerlukan pemeriksaan, jika integrasi tersedia

Visualisasi warna membantu operator mengidentifikasi kondisi data dan menentukan lokasi yang memerlukan pemeriksaan lebih lanjut.

🛰️ 5. Dashboard dan Monitoring Lapangan
Panel detail bangunan dan informasi pelanggan.
Minimap untuk pemeriksaan lokasi secara lebih terperinci.
Informasi koordinat geografis dan hasil pencocokan.
Ringkasan jumlah titik valid, titik tidak cocok, dan bangunan teridentifikasi.
Pengembangan dashboard monitoring perangkat IoT.
Informasi waktu pembaruan terakhir dan riwayat data perangkat apabila tersedia.
🗄️ 6. Database Lokal dan Server Mandiri
Menggunakan SQLite untuk penyimpanan data lokal.
Menggunakan Python sebagai backend aplikasi.
Tidak memerlukan API key khusus untuk peta dasar OpenStreetMap.
Dapat dikembangkan dengan basis data spasial untuk kebutuhan pemrosesan data berukuran besar.
🛠️ Persyaratan Sistem

Sebelum menjalankan aplikasi, pastikan komputer telah memiliki:

Python 3.8 atau lebih baru.
Library Python pandas dan openpyxl.
Database bangunan buildings.db.
Browser modern seperti Google Chrome, Microsoft Edge, atau Mozilla Firefox.
Koneksi internet apabila menggunakan layanan peta eksternal atau komunikasi IoT melalui jaringan.

Untuk implementasi IoT, komponen tambahan yang dapat digunakan meliputi:

MQTT broker, seperti Eclipse Mosquitto.
Perangkat IoT atau gateway yang mendukung MQTT atau HTTP.
Backend penerima dan pengolah data perangkat.
Perangkat GPS atau sensor sesuai kebutuhan monitoring.
🚀 Panduan Instalasi
1. Clone Repository

Unduh repository dari GitHub menggunakan perintah berikut:

git clone https://github.com/rizkipr05/geosite-pln.git
cd geosite-pln

2. Siapkan Database Bangunan

Pastikan file database buildings.db tersedia dan letakkan di dalam folder data/.

Struktur direktori yang diharapkan:

geosite-pln/
├── data/
│   └── buildings.db
├── geoserver.py
├── config.js
└── ...


Catatan: File database bangunan tidak disertakan dalam repository karena ukurannya yang besar. Pastikan struktur tabel dan format datanya sesuai dengan kebutuhan aplikasi.

3. Instal Library Python

Jalankan perintah berikut di terminal:

python -m pip install pandas openpyxl

4. Jalankan Server

Pastikan terminal berada di dalam folder project, kemudian jalankan:

python geoserver.py


Setelah server berjalan, buka browser dan akses alamat berikut:

http://localhost:8080

Alamat tersebut digunakan untuk mengakses aplikasi pada komputer yang menjalankan server.

📂 Panduan Penggunaan Data Pelanggan
Buka aplikasi GeoSite PLN IoT melalui browser.
Klik tombol Upload Excel/CSV.
Pilih file Excel atau CSV yang berisi koordinat pelanggan.
Pastikan file memiliki kolom LATITUDE dan LONGITUDE.
Tunggu hingga proses pencocokan koordinat selesai.
Periksa hasil pencocokan melalui warna bangunan dan titik koordinat.
Klik bangunan yang teridentifikasi untuk melihat detail pelanggan dan informasi lokasi yang tersedia.

Toleransi GPS sekitar 15 meter merupakan nilai awal yang dapat disesuaikan dengan ketelitian koordinat dan kondisi lapangan. Hasil pencocokan tetap perlu diverifikasi karena titik yang berada dekat bangunan belum tentu secara fisik berada di atap bangunan tersebut.

⚙️ Konfigurasi Peta

Pengaturan koordinat awal, zoom, dan warna bangunan dapat disesuaikan melalui file config.js.

Contoh konfigurasi:

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


Keterangan:

DEFAULT_CENTER: menentukan koordinat awal peta.
DEFAULT_ZOOM: menentukan tingkat zoom awal.
BUILDING_STYLE: menentukan warna bangunan yang belum teridentifikasi.
BUILDING_MATCHED_STYLE: menentukan warna bangunan yang cocok dengan data pelanggan.

Sesuaikan konfigurasi dengan struktur kode yang digunakan dalam repository.

📡 Arsitektur Integrasi IoT

GeoSite PLN IoT dapat dikembangkan dengan alur komunikasi sebagai berikut:

Perangkat Lapangan: GPS, sensor, atau perangkat monitoring mengumpulkan data.
Komunikasi IoT: Data dikirim menggunakan MQTT atau HTTP melalui koneksi jaringan yang tersedia.
Backend IoT: Server menerima, memvalidasi, dan memproses data perangkat.
Database: Data koordinat, status perangkat, dan riwayat pengiriman disimpan.
Pemrosesan Geospasial: Sistem mencocokkan koordinat dengan data bangunan.
Dashboard WebGIS: Operator melihat lokasi, hasil pencocokan, dan status perangkat melalui peta interaktif.

Arsitektur tersebut memungkinkan pengembangan dari aplikasi pemetaan berbasis data statis menjadi sistem pemantauan lapangan yang terintegrasi.

🔐 Keamanan dan Keandalan Sistem
Validasi format dan isi file sebelum pemrosesan.
Terapkan autentikasi perangkat IoT sebelum menerima data.
Gunakan koneksi terenkripsi seperti TLS jika didukung oleh infrastruktur.
Batasi akses terhadap data pelanggan dan koordinat sensitif.
Catat aktivitas sistem dan waktu pembaruan data.
Optimalkan kueri database serta pemrosesan data bertahap.
Terapkan pembatasan ukuran file dan validasi input untuk menjaga stabilitas server.
🎯 Tujuan Pengembangan

GeoSite PLN IoT dikembangkan sebagai fondasi sistem informasi geografis yang mendukung:

Validasi dan pemutakhiran koordinat pelanggan PLN.
Identifikasi bangunan berdasarkan lokasi geografis.
Monitoring perangkat IoT dan infrastruktur lapangan.
Integrasi data spasial dengan sistem informasi operasional.
Peningkatan efisiensi pemeriksaan dan verifikasi lokasi.
Pengambilan keputusan berbasis data geografis.
🔮 Pengembangan Selanjutnya

Beberapa pengembangan yang dapat dipertimbangkan:

Integrasi MQTT untuk komunikasi data perangkat secara real-time.
Dashboard status perangkat IoT dan pemantauan konektivitas.
Pembaruan posisi perangkat secara otomatis.
Riwayat pergerakan dan pengiriman data perangkat.
Notifikasi ketika perangkat tidak mengirimkan data sesuai interval yang ditentukan.
Optimasi database untuk pemrosesan jutaan data bangunan.
Sistem autentikasi pengguna dan pengaturan hak akses.

Fitur-fitur tersebut memerlukan implementasi backend, konfigurasi database, dan integrasi perangkat yang sesuai.

❤️ Penutup

GeoSite PLN IoT menggabungkan teknologi WebGIS, pemrosesan data geospasial, dan konsep Internet of Things untuk mendukung pemetaan bangunan serta validasi koordinat pelanggan secara lebih terstruktur.

Dengan pengembangan integrasi IoT yang tepat, platform ini berpotensi menjadi sistem pendukung monitoring infrastruktur dan pengelolaan data geografis yang lebih efisien.

GeoSite PLN IoT — Satu Peta, Data Terintegrasi, Monitoring Lebih Cerdas.

Dibuat dengan ❤️ untuk mendukung transformasi digital pemetaan dan monitoring infrastruktur berbasis IoT.
