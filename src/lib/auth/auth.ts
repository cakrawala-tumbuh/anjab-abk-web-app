/**
 * Konfigurasi Auth.js (NextAuth v5) dengan Authentik OIDC.
 *
 * Pola: Authorization Code + PKCE, public client (tanpa client_secret).
 * Token disimpan di cookie httpOnly via sesi Auth.js — TIDAK di localStorage.
 * Klaim `groups` dari Authentik diteruskan ke sesi untuk otorisasi di UI.
 *
 * Group yang dikenali:
 *   - "admin"      → akses penuh (kelola partisipan, laporan, dll.)
 *   - "partisipan" → akses terbatas (isi kuesioner, lihat hasil sendiri)
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Authentik from "next-auth/providers/authentik";
import { config } from "@/lib/config";

// ── Augmentasi tipe Auth.js ──────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      groups: string[];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    groups?: string[];
  }
}

// ── Ekspor handler, helper, dan middleware Auth.js ───────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV !== "production" || process.env.AUTH_DEBUG === "true",
  providers: [
    Authentik({
      issuer: config.auth.issuer,
      clientId: config.auth.clientId ?? "",
      // Tidak ada clientSecret — public client + PKCE
      authorization: {
        params: { scope: "openid profile email" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // Authentik menaruh klaim `groups` di profile (id_token)
      if (profile && Array.isArray((profile as Record<string, unknown>).groups)) {
        token.groups = (profile as Record<string, unknown>).groups as string[];
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.groups = token.groups ?? [];
      return session;
    },
    authorized({ auth: session }) {
      // Semua route yang diproteksi middleware butuh sesi valid
      return !!session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

// ── Helper otorisasi grup ────────────────────────────────────────────────────

/** Kembalikan true bila sesi punya grup "admin". */
export function isAdmin(session: { user?: { groups?: string[] } } | null): boolean {
  return session?.user?.groups?.includes("admin") ?? false;
}

/** Kembalikan true bila sesi punya grup "partisipan". */
export function isPartisipan(session: { user?: { groups?: string[] } } | null): boolean {
  return session?.user?.groups?.includes("partisipan") ?? false;
}
