#!/bin/sh
# Ganti placeholder NEXT_PUBLIC_* di bundle statis dengan nilai env var runtime.
# Dijalankan sekali sebelum Node.js dimulai; aman dijalankan berulang (idempoten).

set -e

PLACEHOLDER="__NEXT_PUBLIC_API_BASE_URL__"
ACTUAL="${NEXT_PUBLIC_API_BASE_URL:-}"

if [ -n "${ACTUAL}" ] && [ "${ACTUAL}" != "${PLACEHOLDER}" ]; then
  find /app/.next/static -type f -name "*.js" \
    -exec sed -i "s|${PLACEHOLDER}|${ACTUAL}|g" {} \;
fi

exec "$@"
