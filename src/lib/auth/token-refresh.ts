/**
 * Pembaruan token akses Authentik (refresh token grant) untuk callback `jwt` Auth.js.
 *
 * Seluruh fungsi di sini murni terhadap waktu dan jaringan: `now` dan `fetchFn`
 * diterima sebagai parameter sehingga dapat diuji tanpa jaringan. Public client
 * (PKCE) — permintaan refresh TIDAK mengirim `client_secret`.
 *
 * Prasyarat di luar repo: provider Authentik harus mengeluarkan refresh token
 * (scope `offline_access`). Tanpanya sesi jatuh ke jalur `RefreshTokenError`
 * dan pengguna dialihkan ke login begitu token akses kedaluwarsa.
 */

/** Detik sebelum `expiresAt` ketika token sudah dianggap perlu diperbarui. */
export const AMBANG_PERBARUI_DETIK = 60;

/** Penanda kegagalan pembaruan token pada JWT/sesi. */
export const GALAT_REFRESH = "RefreshTokenError" as const;

/** Bagian JWT yang relevan untuk pembaruan token. */
export interface TokenAuth {
  accessToken?: string;
  refreshToken?: string;
  /** Detik epoch kedaluwarsa token akses. */
  expiresAt?: number;
  error?: typeof GALAT_REFRESH;
}

/** Dependensi yang disuntikkan agar fungsi dapat diuji. */
export interface DependensiRefresh {
  /** Waktu sekarang dalam detik epoch. */
  now: number;
  fetchFn: typeof fetch;
  /** URL issuer OIDC (`AUTHENTIK_ISSUER`). */
  issuer: string;
  clientId: string;
}

/**
 * Tentukan apakah token akses perlu diperbarui.
 *
 * @param token - JWT saat ini.
 * @param now - Detik epoch sekarang.
 * @returns `true` bila `expiresAt` sudah terlampaui atau tinggal kurang dari
 *   {@link AMBANG_PERBARUI_DETIK} detik. Token tanpa `expiresAt` tidak diperbarui
 *   (tidak ada dasar penilaian) dan token ber-`error` tidak dicoba lagi.
 */
export function perluDiperbarui(token: TokenAuth, now: number): boolean {
  if (token.error || token.expiresAt === undefined) return false;
  return now >= token.expiresAt - AMBANG_PERBARUI_DETIK;
}

/**
 * Perbarui token bila perlu.
 *
 * Tidak memutasi argumen. Bila belum mendekati kedaluwarsa, mengembalikan token
 * yang sama tanpa panggilan jaringan. Bila kedaluwarsa tanpa refresh token, atau
 * refresh gagal (non-2xx, galat jaringan, respons tak lengkap), mengembalikan
 * token dengan `error = "RefreshTokenError"`. Refresh token lama dipertahankan
 * bila server tidak merotasinya.
 *
 * @param token - JWT saat ini.
 * @param dep - Dependensi waktu, fetch, issuer, dan client id.
 * @returns JWT baru (atau token semula bila tak perlu diperbarui).
 */
export async function perbaruiTokenBilaPerlu(
  token: TokenAuth,
  dep: DependensiRefresh,
): Promise<TokenAuth> {
  if (!perluDiperbarui(token, dep.now)) return token;
  if (!token.refreshToken) return { ...token, error: GALAT_REFRESH };

  try {
    const issuer = dep.issuer.replace(/\/+$/, "");
    const disc = await dep.fetchFn(`${issuer}/.well-known/openid-configuration`);
    if (!disc.ok) return { ...token, error: GALAT_REFRESH };
    const { token_endpoint } = (await disc.json()) as { token_endpoint?: string };
    if (!token_endpoint) return { ...token, error: GALAT_REFRESH };

    const res = await dep.fetchFn(token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: dep.clientId,
        refresh_token: token.refreshToken,
      }),
    });
    if (!res.ok) return { ...token, error: GALAT_REFRESH };

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };
    if (!data.access_token || typeof data.expires_in !== "number") {
      return { ...token, error: GALAT_REFRESH };
    }
    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: dep.now + data.expires_in,
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: GALAT_REFRESH };
  }
}

/**
 * Keputusan middleware: apakah sesi boleh melewati proteksi route.
 *
 * @param session - Sesi Auth.js atau `null`.
 * @returns `false` bila sesi kosong atau bertanda `error` (pengguna dialihkan ke login).
 */
export function sesiDiizinkan(session: { error?: string } | null | undefined): boolean {
  return !!session && !session.error;
}
