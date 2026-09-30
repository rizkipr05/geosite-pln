/* ============================================================
   GEOMAP BANGUNAN — Leaflet.js
   Dual mode: Server API (all 6.5M) + File Upload (sample)
   ============================================================ */

var state = {
  map: null,
  layerGroup: null,
  uploadLayerGroup: null,
  allLayers: [],
  selectedLayer: null,
  totalCount: 0,
  serverMode: true,    // always true now, server data always loads
  loadTimer: null,
  lastBbox: null,
};

function el(id) { return document.getElementById(id); }

var DOM = {
  sidebar:         el("sidebar"),
  sidebarToggle:   el("sidebarToggle"),
  openSidebarBtn:  el("openSidebarBtn"),
  totalCount:      el("totalCount"),
  visibleCount:    el("visibleCount"),
  selectedCount:   el("selectedCount"),
  floatingCounter: el("floatingCounter"),
  floatingCount:   el("floatingCount"),
  fileDropZone:    el("fileDropZone"),
  fileInput:       el("fileInput"),
  fileInfo:        el("fileInfo"),
  fileName:        el("fileName"),
  fileMeta:        el("fileMeta"),
  filterSection:   el("filterSection"),
  searchInput:     el("searchInput"),
  detailPanel:     el("detailPanel"),
  detailBody:      el("detailBody"),
  detailClose:     el("detailClose"),
  loadingOverlay:  el("loadingOverlay"),
  loadingText:     el("loadingText"),
  toast:           el("toast"),
  btnReset:        el("btnReset"),
  serverStatus:    el("serverStatus"),
};

// ─── TILES ───────────────────────────────────────────────────
var TILES = {
  dark:      { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
               attribution: '&copy; OpenStreetMap', maxZoom: 19 },
  light:     { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
               attribution: '&copy; OpenStreetMap', maxZoom: 19 },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
               attribution: "Tiles &copy; Esri", maxZoom: 18 },
};
var currentTile = null;

// ─── UTILS ───────────────────────────────────────────────────
function showToast(msg, type, dur) {
  DOM.toast.textContent = msg;
  DOM.toast.className = "toast show " + (type || "info");
  clearTimeout(DOM.toast._t);
  DOM.toast._t = setTimeout(function() { DOM.toast.className = "toast"; }, dur || 3500);
}

function animateCounter(ref, target) {
  if (!ref) return;
  var start = parseInt(ref.textContent.replace(/\D/g, "")) || 0;
  if (start === target) { ref.textContent = target.toLocaleString("id-ID"); return; }
  var dur = Math.min(500, Math.max(100, Math.abs(target - start) * 0.1));
  var t0 = performance.now();
  (function upd(now) {
    var p = Math.min((now - t0) / dur, 1);
    ref.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3))).toLocaleString("id-ID");
    if (p < 1) requestAnimationFrame(upd);
  })(performance.now());
}

function setLoading(txt) { DOM.loadingText.textContent = txt || "Memuat..."; DOM.loadingOverlay.style.display = "flex"; }
function hideLoading() { DOM.loadingOverlay.style.display = "none"; }

function debounce(fn, ms) {
  var t;
  return function() { var a = arguments; clearTimeout(t); t = setTimeout(function() { fn.apply(null, a); }, ms); };
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function fmtSize(bytes) {
  if (bytes >= 1073741824) return (bytes/1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576)    return (bytes/1048576).toFixed(1) + " MB";
  return Math.round(bytes/1024) + " KB";
}

// ─── MAP INIT ────────────────────────────────────────────────
function initMap() {
  state.map = L.map("map", {
    center: [CONFIG.DEFAULT_CENTER.lat, CONFIG.DEFAULT_CENTER.lng],
    zoom: CONFIG.DEFAULT_ZOOM,
    preferCanvas: true,
  });
  state.layerGroup = L.layerGroup().addTo(state.map);
  state.uploadLayerGroup = L.layerGroup().addTo(state.map);
  setTile("dark");
  el("btnDark").classList.add("active");

  // Dynamic loading on pan/zoom (server mode)
  state.map.on("moveend", debounce(function() {
    if (state.serverMode) loadFromServer();
  }, 500));

  // Clear selection on map click
  state.map.on("click", function() {
    if (state.selectedLayer) {
      state.selectedLayer.setStyle(sDefault());
      state.selectedLayer = null;
      DOM.detailPanel.style.display = "none";
    }
    if (typeof clearMultiSelection === 'function') {
      clearMultiSelection();
    }
    animateCounter(DOM.selectedCount, 0);
  });

  // Check server on start
  checkServer();
}

function setTile(key) {
  if (currentTile) state.map.removeLayer(currentTile);
  var t = TILES[key];
  currentTile = L.tileLayer(t.url, { maxZoom: t.maxZoom, attribution: t.attribution });
  currentTile.addTo(state.map);
  
  // Toggle dark mode CSS filter on map container
  if (key === "dark") {
    state.map.getContainer().classList.add("dark-tiles");
  } else {
    state.map.getContainer().classList.remove("dark-tiles");
  }
}

["btnDark","btnLight","btnSatellite"].forEach(function(bid) {
  el(bid).addEventListener("click", function() {
    setTile(el(bid).dataset.tile);
    ["btnDark","btnLight","btnSatellite"].forEach(function(b) { el(b).classList.remove("active"); });
    el(bid).classList.add("active");
  });
});

// ─── SERVER MODE ─────────────────────────────────────────────
function checkServer() {
  fetch("/api/stats")
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.total) {
        state.serverMode = true;
        state.totalCount = data.total;
        animateCounter(DOM.totalCount, data.total);
        animateCounter(DOM.floatingCount, data.total);
        DOM.floatingCounter.style.display = "flex";
        if (DOM.serverStatus) {
          DOM.serverStatus.innerHTML =
            '<span class="srv-online">● Server Online — ' + data.total.toLocaleString("id-ID") + ' bangunan</span>';
        }
        // Load initial viewport
        loadFromServer();
        showToast("✅ Server terhubung! " + data.total.toLocaleString("id-ID") + " bangunan tersedia", "success", 4000);
      }
    })
    .catch(function() {
      if (DOM.serverStatus) {
        DOM.serverStatus.innerHTML = '<span class="srv-offline">● Gunakan geoserver.py untuk akses semua data</span>';
      }
    });
}

function loadFromServer() {
  if (!state.map) return;
  var bounds = state.map.getBounds();
  var zoom   = state.map.getZoom();

  var bbox = [
    bounds.getWest().toFixed(6),
    bounds.getSouth().toFixed(6),
    bounds.getEast().toFixed(6),
    bounds.getNorth().toFixed(6)
  ].join(",");

  // Avoid duplicate requests
  var key = bbox + "@" + zoom;
  if (key === state.lastBbox) return;
  state.lastBbox = key;

  DOM.loadingText.textContent = "Memuat bangunan di area ini...";
  DOM.loadingOverlay.style.display = "flex";

  fetch("/api/buildings?bbox=" + bbox + "&zoom=" + zoom)
    .then(function(r) { return r.json(); })
    .then(function(fc) {
      renderFeatures(fc.features || [], false);
      var meta = fc.meta || {};
      var txt = (meta.count || 0).toLocaleString("id-ID") + " bangunan ditampilkan";
      if (meta.truncated) txt += " (ada lebih, zoom in untuk detail)";
      animateCounter(DOM.visibleCount, meta.count || 0);
      hideLoading();
      if (meta.count > 0) showToast(txt, "info", 2500);
    })
    .catch(function(err) {
      hideLoading();
      console.error("[Server] Error:", err);
    });
}

// ─── SIDEBAR ─────────────────────────────────────────────────
DOM.sidebarToggle.addEventListener("click", function() {
  DOM.sidebar.classList.add("collapsed");
  DOM.openSidebarBtn.classList.add("visible");
  setTimeout(function() { state.map && state.map.invalidateSize(); }, 350);
});
DOM.openSidebarBtn.addEventListener("click", function() {
  DOM.sidebar.classList.remove("collapsed");
  DOM.openSidebarBtn.classList.remove("visible");
  setTimeout(function() { state.map && state.map.invalidateSize(); }, 350);
});

// ─── FILE UPLOAD (for non-server mode / small files) ─────────
DOM.fileDropZone.addEventListener("dragover", function(e) { e.preventDefault(); DOM.fileDropZone.classList.add("drag-over"); });
DOM.fileDropZone.addEventListener("dragleave", function() { DOM.fileDropZone.classList.remove("drag-over"); });
DOM.fileDropZone.addEventListener("drop", function(e) {
  e.preventDefault(); DOM.fileDropZone.classList.remove("drag-over");
  var f = e.dataTransfer.files[0]; if (f) handleFile(f);
});
DOM.fileInput.addEventListener("change", function(e) { var f = e.target.files[0]; if (f) handleFile(f); });
DOM.fileDropZone.addEventListener("click", function(e) { if (e.target.tagName !== "LABEL") DOM.fileInput.click(); });

function handleFile(file) {
  var name = file.name.toLowerCase();
  
  if (file.size > 100 * 1024 * 1024) {
    alert("❌ JANGAN UPLOAD FILE CSV INI!\n\nFile 1.6 GB (6.5 Juta data) ini terlalu besar untuk di-upload ke browser.\n\nWebsite ini SUDAH TERSAMBUNG ke server yang memuat 6.5 juta data secara otomatis.\n\nSilakan klik tombol 'Hapus' (merah) di kiri bawah untuk kembali ke mode Server Otomatis!");
    return;
  }

  if (!name.match(/\.(geojson|json|csv|xlsx)$/)) {
    showToast("Harus file .geojson, .json, .csv, atau .xlsx", "error"); return;
  }
  if (name.endsWith(".csv")) {
    readCsvSlice(file);
  } else if (name.endsWith(".xlsx")) {
    readXlsxFile(file);
  } else {
    setLoading("Membaca " + fmtSize(file.size) + "...");
    var reader = new FileReader();
    reader.onload = function(ev) {
      try { loadGeoJson(JSON.parse(ev.target.result), file); }
      catch(err) { hideLoading(); showToast("JSON tidak valid: " + err.message, "error"); }
    };
    reader.readAsText(file, "UTF-8");
  }
}

// ─── EXCEL (.XLSX) PARSER ─────────────────────────────────────
function readXlsxFile(file) {
  if (typeof XLSX === "undefined") {
    showToast("Library SheetJS belum termuat. Silakan refresh.", "error"); return;
  }
  setLoading("Membaca " + fmtSize(file.size) + " (Excel)...");
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      setLoading("Parsing data Excel...");
      setTimeout(function() {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: "array" });
        var firstSheet = workbook.SheetNames[0];
        var rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        processExcelRows(rows, file);
      }, 50);
    } catch (err) {
      hideLoading();
      showToast("Gagal membaca Excel: " + err.message, "error");
    }
  };
  reader.onerror = function() { hideLoading(); showToast("Gagal membaca file", "error"); };
  reader.readAsArrayBuffer(file);
}

function processExcelRows(rows, file) {
  if (!rows || rows.length === 0) {
    hideLoading(); showToast("Excel kosong", "error"); return;
  }
  
  var features = [];
  var skipped = 0;
  
  // Find coordinate columns dynamically
  var headers = Object.keys(rows[0]).map(function(k) { return k.toLowerCase(); });
  var latKey = null, lngKey = null, geomKey = null;
  
  for (var k = 0; k < headers.length; k++) {
    var h = headers[k];
    if (h.includes("lat") || h.includes(" y") || h === "y" || h.includes("koordinat y") || h.includes("koordinat_y")) latKey = Object.keys(rows[0])[k];
    if (h.includes("lon") || h.includes("lng") || h.includes(" x") || h === "x" || h.includes("koordinat x") || h.includes("koordinat_x")) lngKey = Object.keys(rows[0])[k];
    if (h.includes("geom") || h === "wkt") geomKey = Object.keys(rows[0])[k];
  }
  
  if (!latKey || !lngKey) {
    hideLoading();
    showToast("Kolom Latitude/Longitude tidak ditemukan di baris pertama.", "error");
    return;
  }
  
  // Auto-detect swapped coordinates (e.g., if X has Latitude and Y has Longitude)
  var testLat = parseFloat(rows[0][latKey]);
  if (Math.abs(testLat) > 90) {
    // Latitude cannot be > 90, so they must be swapped!
    var temp = latKey;
    latKey = lngKey;
    lngKey = temp;
    console.log("Koordinat otomatis ditukar (Auto-swap Lat/Lng)");
  }
  
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var lat = parseFloat(row[latKey]);
    var lng = parseFloat(row[lngKey]);
    
    if (!isFinite(lat) || !isFinite(lng)) { skipped++; continue; }
    
    // Copy all other properties
    var props = {};
    for (var key in row) {
      if (key !== latKey && key !== lngKey && key !== geomKey) {
        props[key] = row[key];
      }
    }
    
    var wktLL = geomKey && row[geomKey] ? parseWKT(String(row[geomKey])) : null;
    if (wktLL) {
      features.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [wktLL] }, properties: props });
    } else {
      features.push({ type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties: props });
    }
  }
  
  var sizeStr = fmtSize(file.size);
  DOM.fileInfo.style.display = "block";
  DOM.fileName.textContent = file.name;
  DOM.fileMeta.textContent = features.length.toLocaleString("id-ID") + " baris dari " + sizeStr +
    (skipped > 0 ? " — " + skipped + " dilewati" : "");

  if (features.length === 0) {
    hideLoading();
    showToast("0 data valid ditemukan.", "error");
    return;
  }
  renderUploadedFeatures(features, true);
}

// ─── CSV: SLICE & PARSE ──────────────────────────────────────
var SLICE_MB = 80;

function readCsvSlice(file) {
  var sliceBytes = Math.min(file.size, SLICE_MB * 1024 * 1024);
  var isPartial = file.size > sliceBytes;
  setLoading("Membaca " + fmtSize(sliceBytes) + " dari " + fmtSize(file.size) + "...");

  var blob = file.slice(0, sliceBytes);
  var reader = new FileReader();
  reader.onload = function(ev) {
    var raw = ev.target.result;
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    if (isPartial) {
      var lastNL = raw.lastIndexOf("\n");
      if (lastNL > 0) raw = raw.substring(0, lastNL);
    }
    setLoading("Parsing CSV...");
    setTimeout(function() { parseCsvText(raw, file, isPartial); }, 20);
  };
  reader.onerror = function() { hideLoading(); showToast("Gagal membaca file", "error"); };
  reader.readAsText(blob, "UTF-8");
}

function parseWKT(wkt) {
  if (!wkt) return null;
  var m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
  if (!m) return null;
  var coords = [];
  var pairs = m[1].split(",");
  for (var i = 0; i < pairs.length; i++) {
    var p = pairs[i].trim().split(/\s+/);
    if (p.length >= 2) {
      var lng = parseFloat(p[0]), lat = parseFloat(p[1]);
      if (isFinite(lat) && isFinite(lng)) coords.push([lat, lng]);
    }
  }
  return coords.length >= 3 ? coords : null;
}

function parseCsvText(text, file, isPartial) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  var lines = text.split("\n");
  if (lines.length < 2) { hideLoading(); showToast("CSV terlalu pendek", "error"); return; }

  var headers = csvSplitLine(lines[0]).map(function(h) {
    return h.replace(/^\uFEFF/, "").replace(/\r/g, "").trim().toLowerCase();
  });

  var latIdx = -1, lngIdx = -1, geomIdx = -1;
  for (var k = 0; k < headers.length; k++) {
    var h = headers[k];
    if (h.includes("lat") || h.includes(" y") || h === "y" || h.includes("koordinat y") || h.includes("koordinat_y")) latIdx = k;
    if (h.includes("lon") || h.includes("lng") || h.includes(" x") || h === "x" || h.includes("koordinat x") || h.includes("koordinat_x")) lngIdx = k;
    if (h.includes("geom") || h === "wkt") geomIdx = k;
  }

  if (latIdx === -1 || lngIdx === -1) {
    hideLoading();
    showToast("Kolom lat/lng tidak ditemukan. Headers: " + headers.slice(0,6).join(", "), "error", 8000);
    return;
  }
  
  // Auto-detect swapped coordinates
  var firstRow = csvSplitLine(lines[1]);
  if (firstRow.length > Math.max(latIdx, lngIdx)) {
    var testLatCsv = parseFloat(firstRow[latIdx]);
    if (Math.abs(testLatCsv) > 90) {
      var tmp = latIdx; latIdx = lngIdx; lngIdx = tmp;
    }
  }

  var features = [], skipped = 0, i = 1;
  var dataLines = lines.length - 1;
  setLoading("Parsing " + dataLines.toLocaleString("id-ID") + " baris...");

  function processChunk() {
    var end = Math.min(i + 8000, lines.length);
    DOM.loadingText.textContent = "Parsing " + Math.round(((i-1)/dataLines)*100) + "% — " +
      features.length.toLocaleString("id-ID") + " bangunan...";

    for (; i < end; i++) {
      var line = lines[i];
      if (!line || line.trim() === "") continue;
      var cols = csvSplitLine(line);
      if (cols.length <= Math.max(latIdx, lngIdx)) { skipped++; continue; }

      var lat = parseFloat(cols[latIdx]);
      var lng = parseFloat(cols[lngIdx]);
      if (!isFinite(lat) || !isFinite(lng)) { skipped++; continue; }

      var props = {};
      for (var colI = 0; colI < cols.length; colI++) {
        if (colI !== latIdx && colI !== lngIdx && colI !== geomIdx) {
          props[headers[colI] || "col_" + colI] = cols[colI];
        }
      }

      var wktLL = geomIdx >= 0 ? parseWKT(cols[geomIdx]) : null;
      if (wktLL) {
        features.push({ type:"Feature", geometry:{type:"Polygon", coordinates:[wktLL]}, properties:props });
      } else {
        features.push({ type:"Feature", geometry:{type:"Point", coordinates:[lng,lat]}, properties:props });
      }
    }

    if (i < lines.length) {
      setTimeout(processChunk, 0);
    } else {
      var sizeStr = fmtSize(file.size);
      DOM.fileInfo.style.display = "block";
      DOM.fileName.textContent = file.name;
      DOM.fileMeta.textContent = features.length.toLocaleString("id-ID") + " bangunan dari " + sizeStr +
        (isPartial ? " (80MB pertama)" : "") + (skipped > 0 ? " — " + skipped + " dilewati" : "");

      if (features.length === 0) {
        hideLoading();
        showToast("0 bangunan. Cek console (F12).", "error", 8000);
        return;
      }
      renderUploadedFeatures(features, true);
    }
  }
  setTimeout(processChunk, 0);
}

function csvSplitLine(line) {
  var out = [], cur = "", inQ = false;
  for (var i = 0; i < line.length; i++) {
    var c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { out.push(cur); cur = ""; }
    else { cur += c; }
  }
  out.push(cur);
  return out;
}

function loadGeoJson(data, file) {
  var fc = data.type === "Feature" ? { type:"FeatureCollection", features:[data] } : data;
  if (!fc.features) { hideLoading(); showToast("GeoJSON tidak valid","error"); return; }
  DOM.fileInfo.style.display = "block";
  DOM.fileName.textContent = file ? file.name : "data.geojson";
  DOM.fileMeta.textContent = fc.features.length.toLocaleString("id-ID") + " data • " + fmtSize(file.size);
  renderUploadedFeatures(fc.features, true);
}

// ─── RENDERER ────────────────────────────────────────────────
function sDefault() {
  return { fillColor:CONFIG.BUILDING_STYLE.fillColor, fillOpacity:CONFIG.BUILDING_STYLE.fillOpacity,
           color:CONFIG.BUILDING_STYLE.color, weight:CONFIG.BUILDING_STYLE.weight };
}
function sHover() {
  return { fillColor:CONFIG.BUILDING_HOVER_STYLE.fillColor, fillOpacity:CONFIG.BUILDING_HOVER_STYLE.fillOpacity,
           color:CONFIG.BUILDING_HOVER_STYLE.color, weight:CONFIG.BUILDING_HOVER_STYLE.weight };
}
function sSelected() {
  return { fillColor:CONFIG.BUILDING_SELECTED_STYLE.fillColor, fillOpacity:CONFIG.BUILDING_SELECTED_STYLE.fillOpacity,
           color:CONFIG.BUILDING_SELECTED_STYLE.color, weight:CONFIG.BUILDING_SELECTED_STYLE.weight };
}
function sMatched() {
  return { fillColor:CONFIG.BUILDING_MATCHED_STYLE.fillColor, fillOpacity:CONFIG.BUILDING_MATCHED_STYLE.fillOpacity,
           color:CONFIG.BUILDING_MATCHED_STYLE.color, weight:CONFIG.BUILDING_MATCHED_STYLE.weight };
}

function checkPointInPolygon(pt, visiblePolygons) {
  var tol = 0.00015; // ~15 meters tolerance
  var tolSq = tol * tol;
  var ptBounds = L.latLngBounds([pt.lat - tol, pt.lng - tol], [pt.lat + tol, pt.lng + tol]);
  
  for (var i = 0; i < visiblePolygons.length; i++) {
    var vp = visiblePolygons[i];
    if (!vp.bounds.intersects(ptBounds)) continue;
    
    var latlngs = vp.latlngs;
    var x = pt.lng, y = pt.lat;
    var inside = false;
    var minDistSq = Infinity;
    
    for (var j = 0, k = latlngs.length - 1; j < latlngs.length; k = j++) {
      var xj = latlngs[j].lng, yj = latlngs[j].lat;
      var xk = latlngs[k].lng, yk = latlngs[k].lat;
      
      // Ray-cast for strict inside
      if (((yj > y) !== (yk > y)) && (x < (xk - xj) * (y - yj) / (yk - yj) + xj)) {
        inside = !inside;
      }
      
      // Distance to segment
      var dx = xk - xj, dy = yk - yj;
      var l2 = dx * dx + dy * dy;
      var distSq;
      if (l2 === 0) {
        distSq = (x - xj) * (x - xj) + (y - yj) * (y - yj);
      } else {
        var t = Math.max(0, Math.min(1, ((x - xj) * dx + (y - yj) * dy) / l2));
        var projx = xj + t * dx;
        var projy = yj + t * dy;
        distSq = (x - projx) * (x - projx) + (y - projy) * (y - projy);
      }
      if (distSq < minDistSq) minDistSq = distSq;
    }
    
    if (inside || minDistSq <= tolSq) {
      return vp; // Matched polygon
    }
  }
  return null;
}

function recalculatePipColors() {
  if (!state.uploadLayerGroup || state.uploadLayerGroup.getLayers().length === 0) return;
  
  var visiblePolygons = [];
  state.layerGroup.eachLayer(function(l) {
    if (l instanceof L.Polygon) {
      l._isMatched = false;
      if (state.selectedLayer !== l) l.setStyle(sDefault());
      visiblePolygons.push({ layer: l, bounds: l.getBounds(), latlngs: l.getLatLngs()[0] });
    }
  });

  state.uploadLayerGroup.eachLayer(function(layer) {
    if (layer instanceof L.CircleMarker) {
      var pt = layer.getLatLng();
      var vpMatch = checkPointInPolygon(pt, visiblePolygons);
      var insideBox = false;
      
      if (vpMatch) {
        insideBox = true;
        vpMatch.layer._isMatched = true;
        if (state.selectedLayer !== vpMatch.layer) vpMatch.layer.setStyle(sMatched());
      }
      
      var defaultColor = insideBox ? "#10b981" : "#ef4444";
      var borderCol    = insideBox ? "#059669" : "#b91c1c";
      var hoverCol     = insideBox ? "#34d399" : "#f87171";
      
      layer.setStyle({ fillColor: defaultColor, color: borderCol });
      layer._defaultColor = defaultColor;
      layer._hoverColor = hoverCol;
    }
  });
}

function renderUploadedFeatures(feats, fitBounds) {
  state.uploadLayerGroup.clearLayers();
  
  DOM.btnReset.style.display = "block";
  var boundsArr = [];
  if (feats.length > 0) setLoading("Render " + feats.length.toLocaleString("id-ID") + " data upload...");
  
  var CHUNK = 1500;
  var idx = 0;
  
  // Pre-calculate visible polygons for fast intersection check
  var visiblePolygons = [];
  state.layerGroup.eachLayer(function(l) {
    if (l instanceof L.Polygon) {
      l._isMatched = false;
      if (state.selectedLayer !== l) l.setStyle(sDefault());
      visiblePolygons.push({
        layer: l,
        bounds: l.getBounds(),
        latlngs: l.getLatLngs()[0]
      });
    }
  });

  function renderChunk() {
    var end = Math.min(idx + CHUNK, feats.length);
    for (var i = idx; i < end; i++) {
      var feat = feats[i];
      if (!feat || !feat.geometry) continue;
      var layer = null;
      var c = feat.geometry.coordinates;
      
      if (feat.geometry.type === "Point") {
        var pt = L.latLng(c[1], c[0]); // c[1]=lat, c[0]=lng
        var vpMatch = checkPointInPolygon(pt, visiblePolygons);
        var insideBox = false;
        
        if (vpMatch) {
          insideBox = true;
          vpMatch.layer._isMatched = true;
          if (state.selectedLayer !== vpMatch.layer) vpMatch.layer.setStyle(sMatched());
        }
        
        var defaultColor = insideBox ? "#10b981" : "#ef4444"; // emerald vs red
        var borderCol    = insideBox ? "#059669" : "#b91c1c";
        var hoverCol     = insideBox ? "#34d399" : "#f87171";

        layer = L.circleMarker([c[1], c[0]], {
          radius: 7, fillColor: defaultColor,
          color: borderCol, weight: 2, opacity: 1, fillOpacity: 0.9,
        });
        layer._defaultColor = defaultColor;
        layer._hoverColor = hoverCol;
        boundsArr.push([c[1], c[0]]);
      } else {
        // Just in case it's a polygon
        layer = L.polygon(c[0], {fillColor:"#10b981", color:"#059669", weight:2});
        if (c[0][0]) boundsArr.push(c[0][0]);
      }
      
      if (!layer) continue;
      layer._props = feat.properties;
      
      layer.on("mouseover", (function(l){ return function(){ if(l!==state.selectedLayer) l.setStyle({fillColor: l._hoverColor || "#34d399"}); }; })(layer));
      layer.on("mouseout",  (function(l){ return function(){ if(l!==state.selectedLayer) l.setStyle({fillColor: l._defaultColor || "#10b981"}); }; })(layer));
      layer.on("click", (function(l){
        return function(e) {
          L.DomEvent.stopPropagation(e);
          if (state.selectedLayer && state.selectedLayer !== l) state.selectedLayer.setStyle(sDefault());
          if (state.selectedLayer === l) {
            state.selectedLayer = null;
            DOM.detailPanel.style.display = "none";
          } else {
            state.selectedLayer = l;
            l.setStyle(CONFIG.BUILDING_SELECTED_STYLE);
            var lat=l._props.latitude || e.latlng.lat, lng=l._props.longitude || e.latlng.lng;
            showDetail(l._props, lat, lng);
          }
        };
      })(layer));
      
      state.uploadLayerGroup.addLayer(layer);
      state.allLayers.push(layer); // Also add to allLayers so it can be exported
    }
    
    idx = end;
    if (idx < feats.length) {
      setTimeout(renderChunk, 0);
    } else {
      if (fitBounds && boundsArr.length > 0) {
        try { state.map.fitBounds(L.latLngBounds(boundsArr).pad(0.05)); } catch(e) {}
      }
      hideLoading();
      showToast("Data berhasil ditampilkan di atas peta!", "success");
    }
  }
  setTimeout(renderChunk, 50);
}

function renderFeatures(feats, fitBounds) {
  // Server mode: REPLACE server layers only
  state.layerGroup.clearLayers();
  
  // Clean allLayers from old server layers, keeping uploaded ones
  state.allLayers = state.allLayers.filter(function(l) { return state.uploadLayerGroup.hasLayer(l); });

  var CHUNK = 1500;
  var idx = 0;
  var boundsArr = [];

  function renderChunk() {
    var end = Math.min(idx + CHUNK, feats.length);
    if (feats.length > CHUNK) {
      DOM.loadingText.textContent = "Render " + Math.round((idx/feats.length)*100) + "%...";
    }

    for (var i = idx; i < end; i++) {
      var feat = feats[i];
      if (!feat || !feat.geometry) continue;
      var layer = null;

      if (feat.geometry.type === "Polygon") {
        var ll = feat.geometry.coordinates[0];
        if (!ll || ll.length < 3) continue;
        // Detect [lat,lng] vs [lng,lat] format
        var latlngs;
        if (Math.abs(ll[0][0]) > 90) {
          // GeoJSON standard [lng,lat]
          latlngs = ll.map(function(c) { return [c[1], c[0]]; });
        } else {
          // Already [lat,lng] from our CSV parser
          latlngs = ll;
        }
        layer = L.polygon(latlngs, sDefault());
        if (latlngs[0]) boundsArr.push(latlngs[0]);

      } else if (feat.geometry.type === "Point") {
        var c = feat.geometry.coordinates; // [lng,lat]
        layer = L.circleMarker([c[1], c[0]], {
          radius:5, fillColor:CONFIG.BUILDING_STYLE.fillColor,
          color:CONFIG.BUILDING_STYLE.color, weight:1, opacity:1, fillOpacity:0.8,
        });
        boundsArr.push([c[1], c[0]]);
      }

      if (!layer) continue;
      layer._props = feat.properties;

      layer._props = feat.properties;

      layer.on("mouseover", (function(l){ return function(){ if(l!==state.selectedLayer) l.setStyle(sHover()); }; })(layer));
      layer.on("mouseout",  (function(l){ return function(){ if(l!==state.selectedLayer) l.setStyle(l._isMatched ? sMatched() : sDefault()); }; })(layer));
      layer.on("click", (function(l){
        return function(e) {
          L.DomEvent.stopPropagation(e);
          if (state.selectedLayer && state.selectedLayer !== l) state.selectedLayer.setStyle(state.selectedLayer._isMatched ? sMatched() : sDefault());
          if (state.selectedLayer === l) {
            state.selectedLayer = null;
            DOM.detailPanel.style.display = "none";
            animateCounter(DOM.selectedCount, 0);
          } else {
            state.selectedLayer = l;
            l.setStyle(CONFIG.BUILDING_SELECTED_STYLE);
            var lat, lng;
            if (l._props && l._props.latitude && l._props.longitude) {
              lat = l._props.latitude; lng = l._props.longitude;
            } else {
              try { var ctr = l.getBounds().getCenter(); lat=ctr.lat; lng=ctr.lng; }
              catch(ex) { lat=e.latlng.lat; lng=e.latlng.lng; }
            }
            showDetail(l._props, lat, lng);
            animateCounter(DOM.selectedCount, 1);
          }
        };
      })(layer));

      state.layerGroup.addLayer(layer);
      state.allLayers.push(layer);
    }

    idx = end;
    if (idx < feats.length) {
      setTimeout(renderChunk, 0);
    } else {
      if (fitBounds && boundsArr.length > 0) {
        try { state.map.fitBounds(L.latLngBounds(boundsArr).pad(0.05)); } catch(e) {}
      }
      if (!state.serverMode) {
        animateCounter(DOM.totalCount, state.totalCount);
        animateCounter(DOM.floatingCount, state.totalCount);
        DOM.floatingCounter.style.display = "flex";
      }
      animateCounter(DOM.visibleCount, feats.length);
      hideLoading();
      if (!state.serverMode) {
        showToast("✅ " + state.allLayers.length.toLocaleString("id-ID") + " bangunan ditampilkan", "success", 4000);
      }
      
      if (state.uploadLayerGroup && state.uploadLayerGroup.getLayers().length > 0) {
        recalculatePipColors();
      }
    }
  }

  setTimeout(renderChunk, 50);
}

// ─── DETAIL PANEL ────────────────────────────────────────────
function showDetail(props, lat, lng) {
  props = props || {};
  var latEl = el("coordLat"), lngEl = el("coordLng");
  if (isFinite(lat) && isFinite(lng)) {
    latEl.textContent = lat.toFixed(7);
    lngEl.textContent = lng.toFixed(7);
    renderMiniMap(lat, lng);
    el("linkGmaps").href       = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng;
    el("linkStreetView").href  = "https://www.google.com/maps?layer=c&cbll=" + lat + "," + lng;
    el("linkSatellite").href   = "https://www.google.com/maps/@" + lat + "," + lng + ",18z/data=!3m1!1e3";
  } else {
    latEl.textContent = "—"; lngEl.textContent = "—";
  }
  var keys = Object.keys(props), html = "";
  for (var k = 0; k < keys.length; k++) {
    var key=keys[k], val=props[key];
    var disp = (val===null||val===undefined) ? "<em style='opacity:.4'>null</em>" : escHtml(String(val));
    html += "<div class='detail-row'><div class='detail-key'>"+escHtml(key)+"</div><div class='detail-val'>"+disp+"</div></div>";
  }
  DOM.detailBody.innerHTML = html || "<em>Tidak ada properti</em>";
  DOM.detailPanel.style.display = "block";
}

function renderMiniMap(lat, lng) {
  var zoom = 18;
  var mapEl = el("detailMiniMap");
  mapEl.innerHTML = "<div class='preview-loading'><div class='preview-spinner'></div><span>Memuat peta...</span></div>";

  function latLngToTile(lat, lng, z) {
    var n = Math.pow(2, z);
    var latRad = lat * Math.PI / 180;
    return {
      x: Math.floor((lng + 180) / 360 * n),
      y: Math.floor((1 - Math.log(Math.tan(latRad) + 1/Math.cos(latRad)) / Math.PI) / 2 * n)
    };
  }
  var tile = latLngToTile(lat, lng, zoom);
  var n = Math.pow(2, zoom);
  var W = 256, H = 256;
  var xP = ((lng + 180) / 360 * n - tile.x) * W;
  var yP = ((1 - Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI) / 2 * n - tile.y) * H;
  var cx = W + xP, cy = H + yP;
  var html = "<div style='position:relative;width:768px;height:768px;transform-origin:top left;'>";
  for (var r = -1; r <= 1; r++) {
    for (var c = -1; c <= 1; c++) {
      html += "<img src='https://mt1.google.com/vt/lyrs=s&x="+(tile.x+c)+"&y="+(tile.y+r)+"&z="+zoom+"' " +
              "style='position:absolute;left:"+(W*(c+1))+"px;top:"+(H*(r+1))+"px;width:"+W+"px;height:"+H+"px;'/>";
    }
  }
  html += "<div style='position:absolute;left:"+(cx-12)+"px;top:"+(cy-24)+"px;font-size:24px;'>📍</div></div>";
  var scale = 290 / 768;
  mapEl.innerHTML = "<div style='width:290px;height:150px;overflow:hidden;border-radius:8px;'>" +
    "<div style='transform:scale("+scale+");transform-origin:top left;'>"+html+"</div></div>";
}

function copyText(elemId) {
  var val = el(elemId).textContent;
  if (!val || val === "—") return;
  navigator.clipboard.writeText(val).then(function() {
    showToast(val + " disalin!", "success", 2000);
  }).catch(function() {
    var ta = document.createElement("textarea");
    ta.value = val; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
    showToast(val + " disalin!", "success", 2000);
  });
}

DOM.detailClose.addEventListener("click", function() {
  if (state.selectedLayer) { state.selectedLayer.setStyle(sDefault()); state.selectedLayer = null; }
  DOM.detailPanel.style.display = "none";
  animateCounter(DOM.selectedCount, 0);
});

var btnCopyData = document.getElementById("btnCopyData");
if (btnCopyData) {
  btnCopyData.addEventListener("click", function() {
    if (!state.selectedLayer || !state.selectedLayer._props) {
      showToast("Tidak ada data dipilih", "error"); return;
    }
    var props = state.selectedLayer._props;
    var text = "Data Bangunan:\n";
    for (var k in props) {
      text += "- " + k + ": " + props[k] + "\n";
    }
    navigator.clipboard.writeText(text).then(function() {
      showToast("Data bangunan berhasil disalin!", "success");
    }).catch(function() {
      showToast("Gagal menyalin data", "error");
    });
  });
}

// ─── SEARCH ──────────────────────────────────────────────────
DOM.searchInput.addEventListener("input", debounce(function() {
  var q = DOM.searchInput.value.trim().toLowerCase();
  var visible = 0;
  for (var i = 0; i < state.allLayers.length; i++) {
    var layer = state.allLayers[i];
    var props = layer._props || {};
    var match = !q;
    if (q) {
      var keys = Object.keys(props);
      for (var k = 0; k < keys.length; k++) {
        if (String(props[keys[k]]).toLowerCase().indexOf(q) !== -1 || keys[k].toLowerCase().indexOf(q) !== -1) {
          match = true; break;
        }
      }
    }
    if (match) { if (!state.layerGroup.hasLayer(layer)) state.layerGroup.addLayer(layer); visible++; }
    else        { if (state.layerGroup.hasLayer(layer)) state.layerGroup.removeLayer(layer); }
  }
  animateCounter(DOM.visibleCount, visible);
}, 400));

DOM.searchInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    var q = DOM.searchInput.value.trim();
    if (!q) return;
    setLoading("Mencari lokasi: " + q + "...");
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(q))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        hideLoading();
        if (data && data.length > 0) {
          var loc = data[0];
          var bb = loc.boundingbox; // [latMin, latMax, lonMin, lonMax]
          state.map.fitBounds([
            [parseFloat(bb[0]), parseFloat(bb[2])],
            [parseFloat(bb[1]), parseFloat(bb[3])]
          ]);
          showToast("Menuju: " + loc.display_name, "success");
        } else {
          showToast("Lokasi tidak ditemukan", "error");
        }
      })
      .catch(function(err) {
        hideLoading();
        showToast("Gagal mencari lokasi", "error");
      });
  }
});

// ─── SELECTION TOOL (BOX) ────────────────────────────────────
var selectionMode = false;
var selectionStart = null;
var selectionBox = null;
state.multiSelectedLayers = [];

var btnSelectArea = document.getElementById("btnSelectArea");
if (btnSelectArea) {
  btnSelectArea.addEventListener("click", function() {
    selectionMode = !selectionMode;
    if (selectionMode) {
      btnSelectArea.classList.add("active");
      btnSelectArea.style.background = "rgba(16,185,129,0.3)";
      state.map.dragging.disable();
      showToast("Tarik kotak di peta untuk menyeleksi data", "info");
      state.map.getContainer().style.cursor = "crosshair";
    } else {
      btnSelectArea.classList.remove("active");
      btnSelectArea.style.background = "";
      state.map.dragging.enable();
      state.map.getContainer().style.cursor = "";
      clearMultiSelection();
    }
  });
}

function clearMultiSelection() {
  if (selectionBox) { state.map.removeLayer(selectionBox); selectionBox = null; }
  state.multiSelectedLayers.forEach(function(l) {
    if (l !== state.selectedLayer) l.setStyle(l._isMatched ? sMatched() : sDefault());
  });
  state.multiSelectedLayers = [];
  animateCounter(DOM.selectedCount, state.selectedLayer ? 1 : 0);
}

function initSelectionEvents() {
  state.map.on('mousedown', function(e) {
    if (!selectionMode) return;
    clearMultiSelection();
    selectionStart = e.latlng;
    selectionBox = L.rectangle([selectionStart, selectionStart], {color: "#f59e0b", weight: 2, fillOpacity: 0.2, dashArray: "5,5"}).addTo(state.map);
  });

  state.map.on('mousemove', function(e) {
    if (!selectionMode || !selectionStart || !selectionBox) return;
    selectionBox.setBounds([selectionStart, e.latlng]);
  });

  state.map.on('mouseup', function(e) {
    if (!selectionMode || !selectionStart || !selectionBox) return;
    var bounds = selectionBox.getBounds();
    selectionStart = null;
    
    state.allLayers.forEach(function(l) {
      if (!state.layerGroup.hasLayer(l)) return;
      var latlng;
      if (l instanceof L.Marker || l instanceof L.CircleMarker) latlng = l.getLatLng();
      else if (l.getBounds) latlng = l.getBounds().getCenter();
      
      if (latlng && bounds.contains(latlng)) {
        l.setStyle(sSelected());
        state.multiSelectedLayers.push(l);
      }
    });
    
    animateCounter(DOM.selectedCount, state.multiSelectedLayers.length);
    if (state.multiSelectedLayers.length > 0) {
      showToast(state.multiSelectedLayers.length + " data dipilih. Klik Export untuk mendownload.", "success");
    } else {
      showToast("Tidak ada data di area ini", "info");
    }
    
    selectionMode = false;
    btnSelectArea.classList.remove("active");
    btnSelectArea.style.background = "";
    state.map.dragging.enable();
    state.map.getContainer().style.cursor = "";
  });
}

// ─── EXPORT EXCEL ────────────────────────────────────────────
var btnExport = document.getElementById("btnExport");
if (btnExport) {
  btnExport.addEventListener("click", function() {
    if (typeof XLSX === "undefined") {
      showToast("Library SheetJS belum termuat. Silakan refresh.", "error"); return;
    }
    if (state.allLayers.length === 0) {
      showToast("Tidak ada data untuk diexport", "error"); return;
    }
    setLoading("Menyiapkan file Excel...");
    setTimeout(function() {
      var rows = [];
      var targetLayers = state.multiSelectedLayers.length > 0 ? state.multiSelectedLayers : state.allLayers;
      
      targetLayers.forEach(function(layer) {
        if (state.layerGroup.hasLayer(layer)) {
          var r = Object.assign({}, layer._props);
          rows.push(r);
        }
      });
      if (rows.length === 0) {
        hideLoading(); showToast("Tidak ada data yang cocok untuk diexport", "error"); return;
      }
      var ws = XLSX.utils.json_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, "geomap_export.xlsx");
      hideLoading();
      showToast("Export berhasil!", "success");
    }, 100);
  });
}

// ─── RESET ───────────────────────────────────────────────────
DOM.btnReset.addEventListener("click", function() {
  state.uploadLayerGroup.clearLayers();
  // Filter out uploaded layers from allLayers
  state.allLayers = state.allLayers.filter(function(l) { return state.layerGroup.hasLayer(l); });
  
  if (state.selectedLayer && !state.layerGroup.hasLayer(state.selectedLayer)) {
    state.selectedLayer = null;
    DOM.detailPanel.style.display = "none";
  }
  if (typeof clearMultiSelection === 'function') clearMultiSelection();

  DOM.fileInfo.style.display = "none";
  DOM.btnReset.style.display = "none";
  DOM.fileInput.value = "";
  showToast("Data file dihapus", "info");
});

// ─── START ───────────────────────────────────────────────────
initMap();
initSelectionEvents();
