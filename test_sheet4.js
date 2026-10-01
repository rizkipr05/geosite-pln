const XLSX = require("xlsx");
var rows = [];
rows.push({ a: 1, b: 2 });
rows.push({ c: 3, a: 5 });
rows.push({ b: 6, c: 7, d: 8 });
var ws = XLSX.utils.json_to_sheet(rows);
console.log(XLSX.utils.sheet_to_csv(ws));
