#!/bin/sh
# Restore konfigurasi runtime web app dari file backup.
# Pakai: ./scripts/restore-config.sh <backup_file>
#
# Menyalin <backup_file> ke .env.local di direktori saat ini.

set -eu

BACKUP_FILE="${1:?Pakai: $0 <backup_file>}"

if [ ! -f "$BACKUP_FILE" ]; then
    printf 'Error: file tidak ditemukan: %s\n' "$BACKUP_FILE" >&2
    exit 1
fi

if [ -f ".env.local" ]; then
    printf '.env.local sudah ada. Timpa? [y/N] '
    read -r CONFIRM
    case "$CONFIRM" in
        y|Y) ;;
        *) printf 'Dibatalkan.\n'; exit 0 ;;
    esac
fi

cp "$BACKUP_FILE" ".env.local"
chmod 600 ".env.local"
printf 'Konfigurasi dipulihkan dari %s ke .env.local\n' "$BACKUP_FILE"
