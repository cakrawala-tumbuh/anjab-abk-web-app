/**
 * Klien API bertipe penuh dari kontrak OpenAPI backend.
 *
 * `withServerAuth(accessToken)` adalah SATU-SATUNYA pintu ke backend — path, query,
 * body, dan response ter-cek TypeScript dari schema.ts yang digenerate oleh
 * `npm run gen:api`, dan `Authorization: Bearer <token>` selalu tersisip.
 *
 * Token diambil dari sesi Auth.js: di Server Component/Action lewat `auth()`,
 * di Client Component lewat prop `accessToken` yang diteruskan Server Component
 * induknya (atau `useSession()`).
 *
 * Klien TANPA autentikasi sengaja TIDAK disediakan: seluruh endpoint backend —
 * termasuk endpoint BACA — menuntut Bearer token. Panggilan tanpa token akan
 * dijawab 401, dan pernah lolos ke produksi sebagai kegagalan senyap.
 */

import createClient from "openapi-fetch";
import type { paths } from "@/lib/api/schema";
import { config } from "@/lib/config";

/**
 * Klien backend dengan middleware Bearer.
 *
 * Base URL: `apiBaseUrlInternal` di sisi server (nama service Docker), otomatis
 * jatuh ke `apiBaseUrl` publik saat dipakai dari browser (env non-`NEXT_PUBLIC_`
 * tidak ter-inline ke bundle klien).
 */
export function withServerAuth(accessToken: string | undefined) {
  const client = createClient<paths>({ baseUrl: config.apiBaseUrlInternal });
  if (accessToken) {
    client.use({
      onRequest({ request }) {
        request.headers.set("Authorization", `Bearer ${accessToken}`);
        return request;
      },
    });
  }
  return client;
}
