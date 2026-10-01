import re

with open('app.js', 'r') as f:
    content = f.read()

# 1. Store matched point properties
old_match = '''          vpMatch.layer._props = vpMatch.layer._props || {};
          vpMatch.layer._props['Status_Atap'] = 'Ada Pelanggan';
          
          // Copy some useful fields from point to the roof for context
          var idKeys = ['id_pelanggan', 'id pelanggan', 'id'];
          var foundId = '';
          for (var key in feat.properties) {
             if (idKeys.indexOf(key.toLowerCase()) !== -1) {
                 foundId = feat.properties[key];
                 break;
             }
          }
          vpMatch.layer._props['ID_Pelanggan_Excel'] = foundId;'''

new_match = '''          vpMatch.layer._props = vpMatch.layer._props || {};
          vpMatch.layer._props['Status_Atap'] = 'Ada Pelanggan';
          vpMatch.layer._matchedPointProps = Object.assign({}, feat.properties);
'''

content = content.replace(old_match, new_match)

# 2. Fix the export logic
old_export = '''      var rows = [];
      var targetLayers = state.multiSelectedLayers.length > 0 ? state.multiSelectedLayers : state.allLayers;
      
      targetLayers.forEach(function(layer) {
        var r = Object.assign({}, layer._props);
        rows.push(r);
      });
      if (rows.length === 0) {'''

new_export = '''      var rows = [];
      var targetLayers = state.multiSelectedLayers.length > 0 ? state.multiSelectedLayers : state.allLayers;
      
      // Collect all keys from uploaded Excel
      var excelKeys = [];
      state.uploadLayerGroup.eachLayer(function(layer) {
          if (layer._props) {
              for (var k in layer._props) {
                  if (excelKeys.indexOf(k) === -1 && k !== 'Status_Bangunan' && k !== 'Jenis_Data') {
                      excelKeys.push(k);
                  }
              }
          }
      });
      
      var exportingSelection = state.multiSelectedLayers.length > 0;
      
      // 1. Export Server Polygons (Atap)
      targetLayers.forEach(function(layer) {
         if (layer instanceof L.Polygon) {
             var r = {};
             var ptProps = layer._matchedPointProps || {};
             
             // Put Excel keys first
             excelKeys.forEach(function(k) {
                 r[k] = ptProps[k] !== undefined ? ptProps[k] : '';
             });
             
             // Server attributes
             r['KOORDINAT_X_BANGUNAN'] = layer._props ? layer._props.longitude : '';
             r['KOORDINAT_Y_BANGUNAN'] = layer._props ? layer._props.latitude : '';
             r['LUAS_BANGUNAN_M2'] = layer._props ? layer._props.area_m2 : '';
             
             if (layer._isMatched) {
                 r['Status_Bangunan'] = 'Dalam Kotak Bangunan';
                 r['Status_Atap'] = 'Ada Pelanggan';
             } else {
                 r['Status_Bangunan'] = '';
                 r['Status_Atap'] = 'Tidak Ada Pelanggan';
             }
             rows.push(r);
         }
      });
      
      // 2. Export Points that are outside (only if not doing a specific selection of just polygons)
      targetLayers.forEach(function(layer) {
         if (layer instanceof L.CircleMarker) {
             if (layer._props && layer._props['Status_Bangunan'] === 'Di Luar Bangunan') {
                 var r = {};
                 excelKeys.forEach(function(k) {
                     r[k] = layer._props[k] !== undefined ? layer._props[k] : '';
                 });
                 r['KOORDINAT_X_BANGUNAN'] = '';
                 r['KOORDINAT_Y_BANGUNAN'] = '';
                 r['LUAS_BANGUNAN_M2'] = '';
                 r['Status_Bangunan'] = 'Di Luar Bangunan';
                 r['Status_Atap'] = '';
                 rows.push(r);
             }
         }
      });
      
      if (rows.length === 0) {'''

content = content.replace(old_export, new_export)

with open('app.js', 'w') as f:
    f.write(content)
print("Patched!")
