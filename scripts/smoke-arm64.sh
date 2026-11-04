#!/bin/sh
# Uji asap image runtime linux/arm64: bangun Dockerfile utama untuk arm64, jalankan
# container dengan entrypoint normal, pastikan arsitektur aarch64 dan GET /api/version
# menjawab 200 dalam 60 detik. Container dan image dibersihkan di akhir (trap EXIT);
# tidak ada berkas yang ditulis ke folder project.
# Pakai: ./scripts/smoke-arm64.sh   (dipanggil oleh `make test-arm64`)
set -eu

IMAGE="${ARM64_IMAGE:-anjab-abk-web-app-arm64-smoke}"
NAME="${IMAGE}-$$"
BATAS_DETIK=60

bersihkan() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker rmi -f "$IMAGE" >/dev/null 2>&1 || true
}
trap bersihkan EXIT

docker buildx build --platform linux/arm64 --load -t "$IMAGE" .

# Entrypoint normal (docker-entrypoint.sh) -> `node server.js`. Tidak ada env wajib:
# NEXT_PUBLIC_* bersifat opsional, tanpa port dipublikasikan (probe lewat docker exec).
docker run -d --name "$NAME" --platform linux/arm64 "$IMAGE" >/dev/null

arsitektur="$(docker exec "$NAME" uname -m)"
echo "uname -m: $arsitektur"
if [ "$arsitektur" != "aarch64" ]; then
  echo "GAGAL: arsitektur container '$arsitektur', diharapkan aarch64" >&2
  exit 1
fi

mulai="$(date +%s)"
while :; do
  if hasil="$(docker exec "$NAME" node -e "fetch('http://127.0.0.1:3000/api/version').then(async r=>{console.log(r.status+' '+await r.text());process.exit(r.status===200?0:1)}).catch(()=>process.exit(1))" 2>/dev/null)"; then
    echo "GET /api/version: $hasil"
    exit 0
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' "$NAME")" != "true" ]; then
    echo "GAGAL: container berhenti sebelum /api/version menjawab" >&2
    docker logs "$NAME" >&2 || true
    exit 1
  fi
  if [ $(( $(date +%s) - mulai )) -ge "$BATAS_DETIK" ]; then
    echo "GAGAL: GET /api/version tidak 200 dalam ${BATAS_DETIK} detik" >&2
    docker logs "$NAME" >&2 || true
    exit 1
  fi
  sleep 2
done
