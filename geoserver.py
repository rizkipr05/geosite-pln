"""
geoserver.py
============
Server peta bangunan dengan API spatial query.
Menggantikan 'python -m http.server 8080'.

Cara pakai:
    python geoserver.py

Fitur:
  - Serve file statis (index.html, app.js, style.css, dll)
  - API endpoint /api/buildings?bbox=minLng,minLat,maxLng,maxLat&zoom=N&limit=N
  - API endpoint /api/stats  -> total count
"""

import sqlite3
import json
import os
import re
import math
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DB_PATH = "data/buildings.db"
PORT = 8080

# ── Batas fitur per request berdasarkan zoom ──────────────────
def limit_for_zoom(zoom):
    if zoom >= 16: return 2000
    if zoom >= 14: return 3000
    if zoom >= 12: return 5000
    if zoom >= 10: return 3000
    return 1000

# ── Parse WKT POLYGON untuk response ─────────────────────────
def parse_wkt_polygon(wkt):
    if not wkt:
        return None
    m = re.match(r'POLYGON\s*\(\(([^)]+)\)\)', wkt, re.IGNORECASE)
    if not m:
        return None
    coords = []
    for pair in m.group(1).split(','):
        parts = pair.strip().split()
        if len(parts) >= 2:
            try:
                lng, lat = float(parts[0]), float(parts[1])
                coords.append([lng, lat])
            except ValueError:
                pass
    return coords if len(coords) >= 3 else None


class GeoServer(SimpleHTTPRequestHandler):

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/buildings':
            self.handle_buildings(parsed)
        elif path == '/api/stats':
            self.handle_stats()
        else:
            # Serve static files
            super().do_GET()

    def handle_stats(self):
        """Return total building count."""
        if not os.path.exists(DB_PATH):
            self.json_error(503, "Database belum dibuat. Jalankan: python convert_gardu.py")
            return

        conn = sqlite3.connect(DB_PATH)
        try:
            row = conn.execute("SELECT COUNT(*) FROM buildings").fetchone()
            total = row[0] if row else 0
        finally:
            conn.close()

        self.send_json({"total": total, "db": DB_PATH})

    def handle_buildings(self, parsed):
        """Return buildings within a bounding box."""
        if not os.path.exists(DB_PATH):
            self.json_error(503, "Database belum dibuat. Jalankan: python convert_gardu.py")
            return

        params = parse_qs(parsed.query)

        try:
            bbox_str = params.get('bbox', [''])[0]
            parts = [float(x) for x in bbox_str.split(',')]
            min_lng, min_lat, max_lng, max_lat = parts[0], parts[1], parts[2], parts[3]
        except Exception:
            self.json_error(400, "Parameter bbox tidak valid. Format: minLng,minLat,maxLng,maxLat")
            return

        try:
            zoom = int(params.get('zoom', ['12'])[0])
        except:
            zoom = 12

        try:
            limit = int(params.get('limit', [str(limit_for_zoom(zoom))])[0])
            limit = min(limit, 10000)  # cap at 10k
        except:
            limit = limit_for_zoom(zoom)

        use_polygon = zoom >= 15  # Show polygons only at high zoom

        t0 = time.time()
        conn = sqlite3.connect(DB_PATH)
        try:
            rows = conn.execute(
                """SELECT lat, lng, area, confidence, geometry, plus_code
                   FROM buildings
                   WHERE lat BETWEEN ? AND ?
                     AND lng BETWEEN ? AND ?
                   LIMIT ?""",
                (min_lat, max_lat, min_lng, max_lng, limit)
            ).fetchall()
        finally:
            conn.close()

        features = []
        for row in rows:
            lat, lng, area, conf, geom_wkt, plus = row

            # Choose geometry: polygon at high zoom, point otherwise
            geometry = None
            if use_polygon and geom_wkt:
                poly_coords = parse_wkt_polygon(geom_wkt)
                if poly_coords:
                    geometry = {"type": "Polygon", "coordinates": [poly_coords]}

            if geometry is None:
                geometry = {"type": "Point", "coordinates": [lng, lat]}

            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "latitude":   lat,
                    "longitude":  lng,
                    "area_m2":    round(area, 2) if area is not None else None,
                    "confidence": round(conf, 4) if conf is not None else None,
                    "plus_code":  plus,
                }
            })

        elapsed_ms = int((time.time() - t0) * 1000)

        result = {
            "type":     "FeatureCollection",
            "features": features,
            "meta": {
                "count":      len(features),
                "limit":      limit,
                "zoom":       zoom,
                "bbox":       [min_lng, min_lat, max_lng, max_lat],
                "elapsed_ms": elapsed_ms,
                "truncated":  len(features) >= limit,
            }
        }

        self.send_json(result)

    def send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def json_error(self, code, msg):
        body = json.dumps({"error": msg}).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(body)




if __name__ == '__main__':
    print("=" * 55)
    print("  GeoMap Bangunan Server")
    print("=" * 55)

    if not os.path.exists(DB_PATH):
        print(f"\nPERINGATAN: Database tidak ditemukan: {DB_PATH}")
        print("   Jalankan dulu: python convert_to_db.py\n")
        print("   (Server tetap jalan, tapi API akan error sampai DB dibuat)")
    else:
        conn = sqlite3.connect(DB_PATH)
        count = conn.execute("SELECT COUNT(*) FROM buildings").fetchone()[0]
        conn.close()
        print(f"\nOK! Database: {DB_PATH}")
        print(f"   Total bangunan: {count:,}")

    print(f"\nServer berjalan. Buka browser: http://localhost:{PORT}")
    print("   Ctrl+C untuk stop\n")

    try:
        HTTPServer(('', PORT), GeoServer).serve_forever()
    except KeyboardInterrupt:
        print("\nServer dihentikan.")
