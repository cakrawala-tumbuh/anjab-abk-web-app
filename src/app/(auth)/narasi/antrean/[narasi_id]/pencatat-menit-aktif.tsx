"use client";

import { useMenitAktif } from "@/lib/use-menit-aktif";

/**
 * Pemasang {@link useMenitAktif} pada layar tinjauan narasi (tidak merender apa pun).
 *
 * @param props.narasiId - Id kasus yang sedang ditinjau.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function PencatatMenitAktif({
  narasiId,
  accessToken,
}: {
  narasiId: string;
  accessToken: string | undefined;
}) {
  useMenitAktif(narasiId, accessToken);
  return null;
}
