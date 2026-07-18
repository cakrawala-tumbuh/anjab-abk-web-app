#!/bin/sh
# Ganti placeholder NEXT_PUBLIC_* di bundle statis dengan nilai env var runtime.
# Dijalankan sekali sebelum Node.js dimulai; aman dijalankan berulang (idempoten).

set -e

replace_placeholder() {
  placeholder="$1"
  actual="$2"
  find /app/.next/static -type f -name "*.js" \
    -exec sed -i "s|${placeholder}|${actual}|g" {} \;
}

# API_BASE_URL — wajib; hanya diganti bila env runtime benar-benar di-set (placeholder
# dibiarkan apa adanya kalau tidak, sama seperti perilaku sebelumnya).
API_BASE_URL_PLACEHOLDER="__NEXT_PUBLIC_API_BASE_URL__"
API_BASE_URL_ACTUAL="${NEXT_PUBLIC_API_BASE_URL:-}"
if [ -n "${API_BASE_URL_ACTUAL}" ] && [ "${API_BASE_URL_ACTUAL}" != "${API_BASE_URL_PLACEHOLDER}" ]; then
  replace_placeholder "${API_BASE_URL_PLACEHOLDER}" "${API_BASE_URL_ACTUAL}"
fi

# Widget Chatwoot — OPSIONAL. Placeholder SELALU diganti (dengan string kosong bila env
# runtime tidak di-set), supaya token literal "__NEXT_PUBLIC_CHATWOOT_..._" tidak pernah
# lolos ke bundle sebagai nilai truthy palsu — fitur harus mati diam bila tidak dikonfigurasi.
replace_placeholder "__NEXT_PUBLIC_CHATWOOT_BASE_URL__" "${NEXT_PUBLIC_CHATWOOT_BASE_URL:-}"
replace_placeholder "__NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN__" "${NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN:-}"

exec "$@"
