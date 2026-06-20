#!/bin/sh
# Backup konfigurasi runtime web app (file .env.local).
# Pakai: ./scripts/backup-config.sh [output_dir]
#
# File output: <output_dir>/config_<YYYYMMDD_HHMMSS>.env.local
#
# PERINGATAN: File output mengandung secret (AUTH_SECRET, AUTHENTIK_*).
# Simpan di lokasi aman (password manager / secret vault), BUKAN di repositori.

set -eu

OUTPUT_DIR="${1:-backups}"
mkdir -p "$OUTPUT_DIR"

if [ ! -f ".env.local" ]; then
    printf 'Error: .env.local tidak ditemukan di direktori saat ini.\n' >&2
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEST="${OUTPUT_DIR}/config_${TIMESTAMP}.env.local"

cp ".env.local" "$DEST"
chmod 600 "$DEST"

printf 'Backup konfigurasi ke %s\n' "$DEST"
printf 'PERINGATAN: File ini mengandung secret — simpan di lokasi aman.\n'
