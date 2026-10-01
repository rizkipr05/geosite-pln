const XLSX = require("xlsx");
var rows = [];
rows.push({ a: 1, b: 2 });
rows.push({ c: 3, d: 4, a: 5 });
var ws = XLSX.utils.json_to_sheet(rows);
console.log(XLSX.utils.sheet_to_csv(ws));
