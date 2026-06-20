# openapi/

Tempatkan file `openapi.json` dari backend di sini, lalu jalankan `npm run gen:api`
untuk meng-generate `src/lib/api/schema.ts`.

## Cara mendapatkan openapi.json

```bash
# Di repo backend:
make export-openapi
# Atau fetch dari backend yang berjalan:
curl http://localhost:8000/openapi.json -o openapi/openapi.json
```

Kemudian:

```bash
npm run gen:api
```

File `src/lib/api/schema.ts` adalah artefak — jangan edit manual.
