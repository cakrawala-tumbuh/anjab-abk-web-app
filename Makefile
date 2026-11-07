################################################################################
# Makefile — Automated Test (anjab-abk-web-app, Next.js/TypeScript)
#
# Prinsip:
#  - SEMUA test (lint + typecheck + unit) berjalan DI DALAM Docker.
#  - Perintah yang sama (`make test`) dipakai di LOKAL maupun di GitHub Actions.
#  - Source di-COPY ke image; TIDAK ADA artefak test yang tertulis ke folder project.
################################################################################

IMAGE_NAME ?= $(shell basename $(CURDIR))-test
DOCKERFILE ?= Dockerfile.test
DOCKER_RUN  = docker run --rm $(IMAGE_NAME)

.DEFAULT_GOAL := test
.PHONY: build lint unit test test-arm64 clean shell help \
        e2e e2e-build e2e-up _e2e _e2e-build _e2e-up e2e-down e2e-reset e2e-logs \
        backup-config restore-config backup-list

## help: tampilkan daftar target
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed -e 's/## //'

## build: bangun image test (deps + source)
build:
	docker build -f $(DOCKERFILE) -t $(IMAGE_NAME) .

## lint: jalankan eslint + prettier check + tsc --noEmit di dalam container
lint: build
	$(DOCKER_RUN) sh -c "npm run lint && npm run typecheck"

## unit: jalankan vitest di dalam container
unit: build
	$(DOCKER_RUN) npm test

## test: gate lengkap = lint + unit. Dipakai LOKAL dan CI (identik).
test: lint unit

## test-arm64: uji asap image runtime linux/arm64 (uname -m = aarch64, GET /api/version 200); terpisah dari `make test`
test-arm64:
	./scripts/smoke-arm64.sh

## clean: hapus image test
clean:
	-docker rmi $(IMAGE_NAME)

## shell: masuk ke shell container test (debugging)
shell: build
	docker run --rm -it $(IMAGE_NAME) sh

################################################################################
# Backup & Restore konfigurasi
# Web app bersifat stateless (tidak ada database lokal).
# Backup = salin .env.local ke lokasi aman.
# Rollback versi = ganti WEB_VERSION di .env deployment Docker Compose, lalu
#   docker compose up -d web
################################################################################

## backup-config: salin .env.local ke backups/ (mengandung secret — simpan aman)
backup-config:
	@./scripts/backup-config.sh backups

## restore-config: pulihkan .env.local dari BACKUP_FILE=<path>
restore-config:
	@[ -n "$(BACKUP_FILE)" ] || { echo "Pakai: make restore-config BACKUP_FILE=<path>"; exit 1; }
	@./scripts/restore-config.sh "$(BACKUP_FILE)"

## backup-list: tampilkan daftar file backup konfigurasi di backups/
backup-list:
	@ls -lht backups/config_*.env.local 2>/dev/null || echo "(belum ada file backup di backups/)"

################################################################################
# E2E — stack manual (web + backend + Authentik)
# E2E_COMPOSE selalu pakai --env-file; touch .env.e2e memastikan file ada
# sebelum docker compose dipanggil (Make expand variabel sebelum shell jalan).
################################################################################

E2E_COMPOSE     = docker compose -f compose.e2e.yml --env-file .env.e2e
E2E_IMAGE       = $(shell basename $(CURDIR))-e2e
E2E_DOCKERFILE  = Dockerfile.e2e
# Auto-detect IP host setiap kali make dipanggil.
# Urutan prioritas:
#   1. Tailscale (tailscale0) — stabil, tidak berubah meski pindah jaringan,
#      bisa dijangkau dari klien Tailscale maupun LAN yang juga pakai Tailscale.
#   2. IP utama LAN/WiFi via ip route get 1.1.1.1 — fallback saat Tailscale tidak aktif.
#   3. localhost — fallback terakhir.
HOST_IP        := $(shell ip -4 addr show dev tailscale0 2>/dev/null | awk '/inet /{sub(/\/.*/, "", $$2); print $$2; exit}')
HOST_IP        := $(or $(HOST_IP),$(shell ip route get 1.1.1.1 2>/dev/null | awk 'NR==1{for(i=1;i<=NF;i++) if($$i=="src") print $$(i+1)}'))
HOST_IP        := $(or $(strip $(HOST_IP)),localhost)
E2E_BASE_URL    = http://$(HOST_IP):9100

# E2E-NONAKTIF ypii-support#464
# E2E Playwright dinonaktifkan sementara atas perintah user (8 Nov 2026) sampai ia
# memerintahkan menyalakannya kembali. Pemulihan: hapus blok guard ini lalu ganti nama
# target internal `_e2e`, `_e2e-up`, `_e2e-build` di bawah menjadi `e2e`, `e2e-up`,
# `e2e-build` (dan kembalikan baris `## ` bantuannya). Tanpa saklar paksa, sengaja.
define E2E_NONAKTIF_PESAN
E2E Playwright dinonaktifkan sementara atas perintah user (lihat cakrawala-tumbuh/ypii-support#464).
Utang test selama nonaktif dicatat di cakrawala-tumbuh/anjab-abk-web-app#109.
Pelacak penonaktifan: cakrawala-tumbuh/anjab-abk-web-app#110. Tidak ada Docker yang dijalankan.
endef
export E2E_NONAKTIF_PESAN

## e2e: NONAKTIF sementara (ypii-support#464) - menolak berjalan
e2e:
	@echo "$$E2E_NONAKTIF_PESAN" >&2; exit 1

## e2e-up: NONAKTIF sementara (ypii-support#464) - menolak berjalan
e2e-up:
	@echo "$$E2E_NONAKTIF_PESAN" >&2; exit 1

## e2e-build: NONAKTIF sementara (ypii-support#464) - menolak berjalan
e2e-build:
	@echo "$$E2E_NONAKTIF_PESAN" >&2; exit 1

_e2e-build:
	docker build -f $(E2E_DOCKERFILE) -t $(E2E_IMAGE) .

_e2e: _e2e-up _e2e-build
	docker run --rm --network=host -e E2E_BASE_URL=$(E2E_BASE_URL) $(E2E_IMAGE); \
		EXIT=$$?; \
		$(MAKE) e2e-down; \
		exit $$EXIT

_e2e-up:
	@[ -f .env.e2e ] || { \
		printf 'POSTGRES_PASSWORD=%s\nAUTHENTIK_SECRET_KEY=%s\nAUTH_SECRET=%s\n' \
			"$$(openssl rand -hex 16)" \
			"$$(openssl rand -base64 48 | tr -d '\n/')" \
			"$$(openssl rand -base64 32 | tr -d '\n')" \
			> .env.e2e && \
		echo "[e2e] .env.e2e dibuat (secret di-generate otomatis)"; \
	}
	HOST_IP=$(HOST_IP) $(E2E_COMPOSE) up --build -d --wait
	@echo ""
	@echo "  Stack E2E siap:"
	@echo "    Web app   → http://$(HOST_IP):9100"
	@echo "    Backend   → http://$(HOST_IP):9200/docs"
	@echo "    Authentik → http://$(HOST_IP):9300"
	@echo ""
	@echo "  Test users (dibuat blueprint, tunggu ~60 dtk setelah pertama kali):"
	@echo "    admin-e2e / AdminE2e123!   (grup admin)"
	@echo "    part-e2e  / PartE2e123!    (grup partisipan)"

## e2e-down: hentikan stack E2E (volume tetap)
e2e-down:
	@touch .env.e2e
	$(E2E_COMPOSE) down

## e2e-reset: hentikan stack E2E + hapus semua volume + hapus .env.e2e
e2e-reset:
	@touch .env.e2e
	$(E2E_COMPOSE) down -v
	rm -f .env.e2e
	@echo "[e2e] Reset selesai — jalankan 'make e2e-up' untuk mulai dari awal."

## e2e-logs: ikuti log semua service E2E
e2e-logs:
	@touch .env.e2e
	$(E2E_COMPOSE) logs -f
