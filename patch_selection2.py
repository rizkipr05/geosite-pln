import re

with open('app.js', 'r') as f:
    content = f.read()

# Fix clearMultiSelection
old_clear = '''  state.multiSelectedLayers.forEach(function(l) {
    if (l !== state.selectedLayer) l.setStyle(l._isMatched ? sMatched() : sDefault());
  });'''

new_clear = '''  state.multiSelectedLayers.forEach(function(l) {
    if (l !== state.selectedLayer) {
        if (l instanceof L.CircleMarker) {
            l.setStyle({fillColor: l._defaultColor || "#3b82f6", color:"#fff", weight:1});
        } else {
            l.setStyle(l._isMatched ? sMatched() : sDefault());
        }
    }
  });'''
content = content.replace(old_clear, new_clear)

# Fix selection styling
old_sel_style = '''      if (latlng && bounds.contains(latlng)) {
        l.setStyle(sSelected());
        state.multiSelectedLayers.push(l);
      }'''

new_sel_style = '''      if (latlng && bounds.contains(latlng)) {
        if (l instanceof L.CircleMarker) {
            l.setStyle({fillColor: "#f59e0b", color:"#fff", weight:2});
        } else {
            l.setStyle(sSelected());
        }
        state.multiSelectedLayers.push(l);
      }'''
content = content.replace(old_sel_style, new_sel_style)

with open('app.js', 'w') as f:
    f.write(content)

print("Patched selection styling!")
