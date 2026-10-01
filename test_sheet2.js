const XLSX = require("xlsx");
var rows = [];
// simulate uploaded point
rows.push({ latitude: -5.1, longitude: 104.9, Status_Bangunan: "Dalam Kotak Bangunan", Jenis_Data: "Data Pelanggan" });
// simulate server polygon
rows.push({ latitude: -5.2, longitude: 104.8, area_m2: 200, confidence: 0.8, plus_code: null, Status_Atap: "Tidak Ada Pelanggan", Jenis_Data: "Atap Bangunan (Server)" });

var ws = XLSX.utils.json_to_sheet(rows);
var wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Data");
XLSX.writeFile(wb, "test_out2.xlsx");
console.log("Written!");
