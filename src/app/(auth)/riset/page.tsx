import { redirect } from "next/navigation";

/** `/riset` tidak punya halaman sendiri: langsung ke daftar protokol. */
export default function RisetPage(): never {
  redirect("/riset/protokol");
}
