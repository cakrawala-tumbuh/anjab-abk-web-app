import { NextResponse } from "next/server";
import pkg from "../../../../package.json";

/** Dibaca saat runtime (bukan saat build) agar `APP_BUILD_COMMIT` dari env container terbaca. */
export const dynamic = "force-dynamic";

/** Bentuk respons `GET /api/version`. */
export interface VersiWeb {
  /** Versi aplikasi web dari `package.json`. */
  version: string;
  /** SHA commit build dari env server `APP_BUILD_COMMIT`; `unknown` bila tidak diset. */
  commit: string;
}

/**
 * Melaporkan versi dan commit build web app yang sedang berjalan.
 *
 * Endpoint publik: dikecualikan dari proteksi login di `src/middleware.ts`, tidak
 * memanggil backend, dan tidak memuat data sesi.
 *
 * @returns Respons JSON 200 berisi {@link VersiWeb}.
 */
export function GET(): NextResponse<VersiWeb> {
  const commit = process.env.APP_BUILD_COMMIT?.trim() || "unknown";
  return NextResponse.json({ version: pkg.version, commit });
}
