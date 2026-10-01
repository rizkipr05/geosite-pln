import re

with open('app.js', 'r') as f:
    content = f.read()

old_sel = '''    state.allLayers.forEach(function(l) {
      if (!state.layerGroup.hasLayer(l)) return;
      var latlng;
      if (l instanceof L.Marker || l instanceof L.CircleMarker) latlng = l.getLatLng();
      else if (l.getBounds) latlng = l.getBounds().getCenter();
      
      if (latlng && bounds.contains(latlng)) {
        l.setStyle(sSelected());
        state.multiSelectedLayers.push(l);
      }
    });'''

new_sel = '''    state.allLayers.forEach(function(l) {
      // Allow selection for BOTH server polygons and uploaded points
      if (!state.layerGroup.hasLayer(l) && !state.uploadLayerGroup.hasLayer(l)) return;
      
      var latlng;
      if (l instanceof L.Marker || l instanceof L.CircleMarker) latlng = l.getLatLng();
      else if (l.getBounds) latlng = l.getBounds().getCenter();
      
      if (latlng && bounds.contains(latlng)) {
        l.setStyle(sSelected());
        state.multiSelectedLayers.push(l);
      }
    });'''

content = content.replace(old_sel, new_sel)

with open('app.js', 'w') as f:
    f.write(content)

print("Patched selection logic!")
