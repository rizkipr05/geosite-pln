const XLSX = require("xlsx");
var rows = [];
rows.push({ latitude: -5.1, longitude: 104.9, area_m2: 100, confidence: 0.9, plus_code: null, Status_Atap: "Tidak Ada Pelanggan" });
rows.push({ latitude: -5.2, longitude: 104.8, area_m2: 200, confidence: 0.8, plus_code: null, Status_Atap: "Ada Pelanggan" });

var ws = XLSX.utils.json_to_sheet(rows);
var wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Data");
XLSX.writeFile(wb, "test_out.xlsx");
console.log("Written!");
