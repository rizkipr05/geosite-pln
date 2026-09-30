import sqlite3
import pandas as pd
import os
import sys

EXCEL_PATH = "data/MINTA KOORDINAT GARDU.xlsx"
DB_PATH = "data/gardu.db"

def main():
    if not os.path.exists(EXCEL_PATH):
        print(f"ERROR: File tidak ditemukan: {EXCEL_PATH}")
        sys.exit(1)

    print(f"Membaca Excel: {EXCEL_PATH}...")
    try:
        df = pd.read_excel(EXCEL_PATH)
    except Exception as e:
        print(f"Gagal membaca Excel: {e}")
        sys.exit(1)
    
    if 'LATITUDE' not in df.columns or 'LONGITUDE' not in df.columns:
        print("ERROR: Kolom LATITUDE dan LONGITUDE tidak ditemukan!")
        print(f"Kolom yang tersedia: {df.columns.tolist()}")
        sys.exit(1)
        
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        
    conn = sqlite3.connect(DB_PATH)
    
    conn.execute("""
        CREATE TABLE gardu (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lat REAL,
            lng REAL,
            no_gardu TEXT,
            kva REAL,
            lokasi TEXT,
            penyulang TEXT
        )
    """)
    
    batch = []
    skipped = 0
    
    for idx, row in df.iterrows():
        try:
            lat = float(row['LATITUDE'])
            lng = float(row['LONGITUDE'])
        except:
            skipped += 1
            continue
            
        if pd.isna(lat) or pd.isna(lng):
            skipped += 1
            continue
            
        no_gardu = str(row['NO GARDU']) if not pd.isna(row['NO GARDU']) else None
        kva = float(row['KVA']) if not pd.isna(row['KVA']) else None
        lokasi = str(row['LOKASI']) if not pd.isna(row['LOKASI']) else None
        penyulang = str(row['PENYULANG']) if not pd.isna(row['PENYULANG']) else None
        
        batch.append((lat, lng, no_gardu, kva, lokasi, penyulang))
        
    conn.executemany("INSERT INTO gardu (lat, lng, no_gardu, kva, lokasi, penyulang) VALUES (?, ?, ?, ?, ?, ?)", batch)
    
    conn.execute("CREATE INDEX idx_lat_lng ON gardu(lat, lng)")
    conn.commit()
    conn.close()
    
    print(f"Selesai! {len(batch)} gardu tersimpan di {DB_PATH}.")
    if skipped > 0:
        print(f"PERINGATAN: {skipped} baris dilewati (koordinat tidak valid).")

if __name__ == "__main__":
    main()
