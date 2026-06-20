/**
 * Klien API bertipe penuh dari kontrak OpenAPI backend.
 *
 * Gunakan `api` untuk semua pemanggilan backend — path, query, body, dan response
 * ter-cek TypeScript dari schema.ts yang digenerate oleh `npm run gen:api`.
 *
 * Middleware: menyisipkan `Authorization: Bearer <token>` dari sesi Auth.js.
 * Di Server Component/Action gunakan `auth()` untuk mengambil token;
 * di Client Component gunakan `useSession()`.
 */

import createClient from "openapi-fetch";
import type { paths } from "@/lib/api/schema";
import { config } from "@/lib/config";

export const api = createClient<paths>({ baseUrl: config.apiBaseUrl });

/** Middleware Bearer untuk pemanggilan dari sisi server. */
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
