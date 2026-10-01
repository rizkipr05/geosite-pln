with open('app.js', 'r') as f:
    content = f.read()

# ── Fix 1: Point click handler – resolve coords from multiple possible column names ──
old_click_coord = "            var lat=l._props.latitude || e.latlng.lat, lng=l._props.longitude || e.latlng.lng;"
new_click_coord = """            var latlng_click = l.getLatLng();
            var lat = parseFloat(l._props.latitude || l._props.KOORDINAT_X || latlng_click.lat);
            var lng = parseFloat(l._props.longitude || l._props.KOORDINAT_Y || latlng_click.lng);"""
content = content.replace(old_click_coord, new_click_coord)

# ── Fix 2: recalculatePipColors – also update _props.Status_Bangunan and the matched point on the roof ──
old_recalc = """  state.uploadLayerGroup.eachLayer(function(layer) {
    if (layer instanceof L.CircleMarker) {
      var pt = layer.getLatLng();
      var vpMatch = checkPointInPolygon(pt, visiblePolygons);
      var insideBox = false;
      
      if (vpMatch) {
        insideBox = true;
        vpMatch.layer._isMatched = true;
        if (state.selectedLayer !== vpMatch.layer) vpMatch.layer.setStyle(sMatched());
      }
      
      var defaultColor = insideBox ? \"#10b981\" : \"#ef4444\";
      var borderCol    = insideBox ? \"#059669\" : \"#b91c1c\";
      var hoverCol     = insideBox ? \"#34d399\" : \"#f87171\";
      
      layer.setStyle({ fillColor: defaultColor, color: borderCol });
      layer._defaultColor = defaultColor;
      layer._hoverColor = hoverCol;
    }
  });"""

new_recalc = """  state.uploadLayerGroup.eachLayer(function(layer) {
    if (layer instanceof L.CircleMarker) {
      var pt = layer.getLatLng();
      var vpMatch = checkPointInPolygon(pt, visiblePolygons);
      var insideBox = !!vpMatch;
      
      if (vpMatch) {
        vpMatch.layer._isMatched = true;
        if (state.selectedLayer !== vpMatch.layer) vpMatch.layer.setStyle(sMatched());
        
        // Update _props so Status_Bangunan is correct for export and display
        if (layer._props) {
          layer._props['Status_Bangunan'] = 'Dalam Kotak Bangunan';
          // Snap layer position to center of matched polygon
          var center = vpMatch.layer.getBounds().getCenter();
          layer.setLatLng(center);
        }
        // Store point props on the roof polygon for export
        vpMatch.layer._props = vpMatch.layer._props || {};
        vpMatch.layer._props['Status_Atap'] = 'Ada Pelanggan';
        vpMatch.layer._matchedPointProps = Object.assign({}, layer._props);
      } else {
        if (layer._props) {
          layer._props['Status_Bangunan'] = 'Di Luar Bangunan';
        }
      }
      
      var defaultColor = insideBox ? \"#10b981\" : \"#ef4444\";
      var borderCol    = insideBox ? \"#059669\" : \"#b91c1c\";
      var hoverCol     = insideBox ? \"#34d399\" : \"#f87171\";
      
      layer.setStyle({ fillColor: defaultColor, color: borderCol });
      layer._defaultColor = defaultColor;
      layer._hoverColor = hoverCol;
    }
  });"""
content = content.replace(old_recalc, new_recalc)

# ── Fix 3: showDetail – detect lat/lng column names automatically ──
old_showDetail_body = """  var keys = Object.keys(props), html = \"\";
  for (var k = 0; k < keys.length; k++) {
    var key=keys[k], val=props[key];
    var disp = (val===null||val===undefined) ? \"<em style='opacity:.4'>null</em>\" : escHtml(String(val));
    html += \"<div class='detail-row'><div class='detail-key'>\"+escHtml(key)+\"</div><div class='detail-val'>\"+disp+\"</div></div>\";
  }"""
new_showDetail_body = """  // Auto-detect lat/lng columns if not passed explicitly
  var keys = Object.keys(props), html = \"\";
  for (var k = 0; k < keys.length; k++) {
    var key=keys[k], val=props[key];
    // For lat/lng columns, show cleaned numeric value
    var lowKey = key.toLowerCase();
    if ((lowKey.indexOf('koordinat') !== -1 || lowKey === 'latitude' || lowKey === 'longitude') && val !== null && val !== undefined) {
      var numVal = parseFloat(val);
      val = isFinite(numVal) ? numVal.toFixed(7) : val;
    }
    var disp = (val===null||val===undefined||val===\"\") ? \"<em style='opacity:.4'>—</em>\" : escHtml(String(val));
    html += \"<div class='detail-row'><div class='detail-key'>\"+escHtml(key)+\"</div><div class='detail-val'>\"+disp+\"</div></div>\";
  }"""
content = content.replace(old_showDetail_body, new_showDetail_body)

with open('app.js', 'w') as f:
    f.write(content)

print("All 3 fixes applied!")
