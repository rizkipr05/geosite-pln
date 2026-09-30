// ============================================================
//  KONFIGURASI PETA INTERAKTIF BANGUNAN (Leaflet.js)
//  Tidak perlu API Key!
// ============================================================

const CONFIG = {
  // Koordinat pusat peta saat pertama dibuka (Indonesia)
  DEFAULT_CENTER: { lat: -2.5489, lng: 118.0149 },
  DEFAULT_ZOOM: 5,

  // Path ke file GeoJSON/CSV dataset bangunan (opsional, bisa upload manual)
  GEOJSON_FILE: "./data/buildings.geojson",

  // Warna tampilan bangunan di peta
  BUILDING_STYLE: {
    fillColor: "#6366f1", // Indigo/Purple
    fillOpacity: 0.45,
    color: "#4f46e5",
    weight: 1.5,
  },
  BUILDING_HOVER_STYLE: {
    fillColor: "#a855f7",
    fillOpacity: 0.75,
    color: "#7c3aed",
    weight: 2.5,
  },
  BUILDING_MATCHED_STYLE: {
    fillColor: "#3b82f6",
    fillOpacity: 0.65,
    color: "#2563eb",
    weight: 2,
  },
  BUILDING_SELECTED_STYLE: {
    fillColor: "#f59e0b",
    fillOpacity: 0.7,
    color: "#d97706",
    weight: 3,
  },

  // Nama aplikasi
  APP_TITLE: "GeoMap Bangunan",
};

