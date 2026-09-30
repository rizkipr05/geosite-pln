"""
convert_to_db.py
================
Konversi CSV bangunan ke SQLite (cukup jalankan SEKALI).
Setelah selesai, jalankan geoserver.py sebagai server.

Cara pakai:
    python convert_to_db.py
"""

import sqlite3
import csv
import os
import time
import sys

CSV_PATH = "data/2e5_buildings.csv"
DB_PATH  = "data/buildings.db"

def main():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: File tidak ditemukan: {CSV_PATH}")
        sys.exit(1)

    # Cek apakah DB sudah ada
    if os.path.exists(DB_PATH):
        ans = input(f"Database '{DB_PATH}' sudah ada. Timpa? (y/N): ").strip().lower()
        if ans != 'y':
            print("Dibatalkan.")
            sys.exit(0)
        os.remove(DB_PATH)

    print(f"Membaca: {CSV_PATH}")
    file_size = os.path.getsize(CSV_PATH)
    print(f"Ukuran file: {file_size / 1024 / 1024 / 1024:.2f} GB")
    print()

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA cache_size = 100000")

    conn.execute("""
        CREATE TABLE buildings (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            lat        REAL    NOT NULL,
            lng        REAL    NOT NULL,
            area       REAL,
            confidence REAL,
            geometry   TEXT,
            plus_code  TEXT
        )
    """)

    BATCH = 50_000
    batch = []
    total = 0
    skipped = 0
    start = time.time()

    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        print(f"Headers: {headers}\n")

        for row in reader:
            try:
                lat  = float(row['latitude'])
                lng  = float(row['longitude'])
            except (ValueError, TypeError, KeyError):
                skipped += 1
                continue

            try: area = float(row['area_in_meters'])
            except: area = None
            try: conf = float(row['confidence'])
            except: conf = None
            geom = (row.get('geometry') or '').strip() or None
            plus = (row.get('full_plus_code') or '').strip() or None

            batch.append((lat, lng, area, conf, geom, plus))
            total += 1

            if len(batch) >= BATCH:
                conn.executemany(
                    "INSERT INTO buildings(lat,lng,area,confidence,geometry,plus_code) VALUES(?,?,?,?,?,?)",
                    batch
                )
                conn.commit()
                batch.clear()

                elapsed = time.time() - start
                rate = total / elapsed if elapsed > 0 else 0
                print(f"\r  {total:>10,} baris | {rate:,.0f} baris/dtk | {elapsed:.0f}s", end='', flush=True)

    # Flush sisa
    if batch:
        conn.executemany(
            "INSERT INTO buildings(lat,lng,area,confidence,geometry,plus_code) VALUES(?,?,?,?,?,?)",
            batch
        )
        conn.commit()

    elapsed = time.time() - start
    print(f"\r  {total:>10,} baris selesai dalam {elapsed:.1f} detik        ")
    print(f"  {skipped:,} baris dilewati")
    print()

    # Buat spatial index
    print("Membuat index spasial (lat, lng)...")
    conn.execute("CREATE INDEX idx_lat_lng ON buildings(lat, lng)")
    conn.commit()

    print("Membuat index area...")
    conn.execute("CREATE INDEX idx_area ON buildings(area)")
    conn.commit()

    conn.close()

    db_size = os.path.getsize(DB_PATH) / 1024 / 1024
    print(f"\n✅ Selesai! {total:,} bangunan tersimpan")
    print(f"   Database: {DB_PATH} ({db_size:.0f} MB)")
    print()
    print("Langkah berikutnya:")
    print("  python geoserver.py")

if __name__ == "__main__":
    main()
