🌍 GeoSite PLN IoT — GeoMap Bangunan Cerdas

Platform WebGIS dan Internet of Things (IoT) untuk Pemetaan Bangunan, Validasi Koordinat Pelanggan, dan Monitoring Infrastruktur PLN.

GeoSite PLN IoT merupakan aplikasi pemetaan digital berbasis web yang dirancang untuk mengintegrasikan data bangunan, titik koordinat ID Pelanggan PLN, dan perangkat IoT dalam satu platform terpusat. Sistem ini mendukung visualisasi jutaan poligon bangunan, pencocokan koordinat pelanggan secara otomatis, serta pemantauan data perangkat lapangan secara real-time apabila terhubung dengan perangkat dan infrastruktur IoT yang sesuai.

Dengan menggabungkan teknologi WebGIS, Python, SQLite, Leaflet.js, dan protokol komunikasi IoT, GeoSite PLN IoT membantu meningkatkan akurasi pemetaan, efisiensi validasi data, dan kemudahan pemantauan infrastruktur kelistrikan.

✨ Fitur Utama
🚀 1. High-Performance Geospatial Mapping
Dirancang untuk memvisualisasikan jutaan data poligon bangunan melalui teknik rendering bertahap (asynchronous chunk rendering).
Optimasi pemuatan data agar penggunaan memori browser lebih efisien.
Mendukung navigasi peta, pencarian lokasi, zoom, dan identifikasi bangunan.
Menggunakan Leaflet.js dengan OpenStreetMap sebagai peta dasar.
🎯 2. Smart Customer Matching
Mendukung impor data pelanggan dari file Excel (.xlsx) dan CSV.
Mengidentifikasi bangunan berdasarkan koordinat LATITUDE dan LONGITUDE.
Menggunakan algoritma Point-in-Polygon untuk mencocokkan titik koordinat dengan tapak bangunan.
Mendukung toleransi posisi GPS sekitar 15 meter yang dapat disesuaikan.
Menyediakan hasil pencocokan untuk membantu validasi lokasi pelanggan di lapangan.
📡 3. Integrasi Internet of Things (IoT)
Mendukung pengembangan integrasi perangkat IoT untuk mengirimkan data koordinat, status perangkat, dan informasi sensor.
Memungkinkan pengiriman data melalui protokol MQTT atau HTTP API.
Menyediakan rancangan integrasi dengan gateway IoT untuk menghubungkan perangkat lapangan ke server.
Mendukung pemantauan waktu pengiriman data terakhir, status koneksi, dan kondisi perangkat apabila data tersebut tersedia.
Memungkinkan integrasi dengan perangkat GPS, sensor, atau perangkat monitoring infrastruktur sesuai kebutuhan operasional.

Catatan: Fitur monitoring real-time memerlukan perangkat IoT, koneksi komunikasi, serta layanan backend penerima data. Fitur tersebut tidak otomatis aktif hanya dengan menjalankan aplikasi WebGIS.

🎨 4. Visualisasi Status Bangunan dan Pelanggan
🟪 Ungu — Bangunan Belum Teridentifikasi: Bangunan yang belum memiliki data pelanggan hasil pencocokan.
🟦 Biru — Bangunan Teridentifikasi: Bangunan yang cocok dengan satu atau lebih titik pelanggan.
🟩 Hijau — Koordinat Valid: Titik pelanggan yang berhasil dicocokkan dengan bangunan.
🟥 Merah — Perlu Verifikasi: Titik pelanggan yang tidak ditemukan pada bangunan dalam batas toleransi.
🟧 Oranye — Status Perangkat IoT Perlu Diperiksa: Status tambahan apabila tersedia data perangkat dan aturan pemantauan yang sesuai.

Warna pada peta digunakan sebagai indikator visual untuk membantu operator mengidentifikasi kondisi data dan menentukan lokasi yang memerlukan pemeriksaan lebih lanjut.

🛰️ 5. Dashboard dan Monitoring Lapangan
Panel informasi bangunan dan data pelanggan.
Minimap untuk membantu pemeriksaan lokasi secara lebih detail.
Informasi koordinat geografis dan hasil pencocokan.
Ringkasan jumlah titik valid, tidak cocok, dan bangunan teridentifikasi.
Pengembangan dashboard status perangkat IoT, waktu pembaruan terakhir, serta riwayat pengiriman data.
🗄️ 6. Database Lokal dan Arsitektur Mandiri
Menggunakan SQLite untuk penyimpanan data lokal.
Backend Python untuk memproses data dan menyediakan layanan aplikasi.
Tidak memerlukan API key untuk peta dasar OpenStreetMap.
Dapat dikembangkan menggunakan basis data spasial atau layanan penyimpanan terpisah untuk mendukung kebutuhan data berskala besar.
🛠️ Persyaratan Sistem

Pastikan komputer memiliki komponen berikut:

Python 3.8 atau lebih baru.
Library Python: pandas dan openpyxl.
Database bangunan buildings.db.
Browser modern seperti Google Chrome, Microsoft Edge, atau Mozilla Firefox.
Koneksi jaringan apabila menggunakan layanan peta eksternal atau komunikasi dengan perangkat IoT.

Untuk implementasi IoT, komponen tambahan yang dapat digunakan meliputi:

Broker MQTT, seperti Eclipse Mosquitto.
Gateway atau perangkat IoT yang mendukung MQTT atau HTTP.
Backend penerima data perangkat.
Perangkat GPS atau sensor sesuai kebutuhan pemantauan.
🚀 Panduan Instalasi
1. Unduh repository
git clone https://github.com/rizkipr05/geosite-pln.git
cd geosite-pln

2. Siapkan database bangunan

Letakkan file database bangunan pada lokasi berikut:

geosite-pln/
├── data/
│   └── buildings.db
├── geoserver.py
├── config.js
└── ...


Pastikan struktur tabel dan format data di dalam buildings.db sesuai dengan kebutuhan aplikasi.

3. Instal dependensi
python -m pip install pandas openpyxl

4. Jalankan server lokal
python geoserver.py


Buka browser dan akses:

http://localhost:8080


Alamat tersebut digunakan untuk mengakses aplikasi pada komputer yang menjalankan server. Untuk mengaksesnya dari perangkat lain, diperlukan konfigurasi jaringan dan keamanan yang sesuai.

📂 Penggunaan Data Pelanggan
Buka aplikasi GeoSite PLN IoT.
Pilih menu Upload Excel/CSV.
Unggah file yang memiliki kolom LATITUDE dan LONGITUDE.
Sistem memproses titik koordinat dan mencocokkannya dengan poligon bangunan.
Periksa hasil pencocokan melalui warna bangunan dan titik koordinat.
Pilih bangunan untuk melihat informasi pelanggan serta detail lokasi yang tersedia.

Toleransi GPS sekitar 15 meter merupakan parameter awal yang perlu disesuaikan dengan ketelitian data, kondisi lapangan, dan metode pencocokan. Titik yang berada dalam radius toleransi belum tentu secara fisik berada di atap bangunan, sehingga hasilnya sebaiknya diperlakukan sebagai indikasi untuk verifikasi.

⚙️ Konfigurasi Peta

Pengaturan awal peta dapat disesuaikan melalui config.js.

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


Nilai warna dan koordinat dapat disesuaikan dengan kebutuhan operasional.

📡 Rancangan Arsitektur IoT

Alur integrasi sistem yang dapat dikembangkan:

Perangkat lapangan: GPS, sensor, atau perangkat monitoring mengumpulkan data.
Komunikasi IoT: Data dikirim melalui MQTT atau HTTP menggunakan gateway atau koneksi jaringan yang sesuai.
Backend IoT: Server menerima, memvalidasi, dan mengolah data perangkat.
Penyimpanan data: Informasi perangkat dan riwayat pengiriman disimpan dalam basis data.
Mesin geospasial: Koordinat perangkat atau pelanggan dicocokkan dengan data bangunan.
Dashboard WebGIS: Operator melihat lokasi, status data, dan kondisi perangkat melalui peta interaktif.

Arsitektur ini memungkinkan pengembangan dari aplikasi pemetaan statis menjadi sistem pemantauan lapangan yang terintegrasi.

🔐 Keamanan dan Keandalan
Validasi format dan isi file sebelum data diproses.
Autentikasi perangkat IoT sebelum menerima data.
Gunakan TLS untuk komunikasi jaringan yang mendukungnya.
Batasi akses ke data pelanggan dan koordinat sensitif.
Sediakan pencatatan aktivitas serta waktu pembaruan data.
Terapkan pemrosesan bertahap, pembatasan ukuran data, dan optimasi kueri untuk mengurangi risiko kelebihan beban.
🎯 Tujuan Pengembangan

GeoSite PLN IoT dirancang sebagai fondasi sistem informasi geografis yang dapat dikembangkan untuk mendukung:

Validasi dan pemutakhiran koordinat pelanggan PLN.
Identifikasi bangunan berdasarkan lokasi geografis.
Monitoring perangkat IoT dan infrastruktur lapangan.
Integrasi data spasial dengan sistem informasi operasional.
Pengambilan keputusan berbasis data lokasi yang lebih akurat.

GeoSite PLN IoT — Satu Peta, Data Terintegrasi, Monitoring Lebih Cerdas.

Dikembangkan untuk mendukung transformasi digital pemetaan dan monitoring infrastruktur berbasis IoT.
