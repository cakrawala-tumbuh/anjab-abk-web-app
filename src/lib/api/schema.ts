// BOOTSTRAP PLACEHOLDER — jangan edit manual.
// Setelah openapi.json backend tersedia di openapi/openapi.json, jalankan:
//   npm run gen:api
// untuk menimpa file ini dengan tipe lengkap yang digenerate oleh openapi-typescript.
//
// Lihat openapi/README.md untuk cara mendapatkan openapi.json.

export type paths = {
  // ── Core: Jenjang Pendidikan ──────────────────────────────────────────────
  "/api/v1/jenjang-pendidikan": {
    get: {
      parameters: { query?: { limit?: number; offset?: number } };
      responses: {
        200: {
          content: {
            "application/json": {
              items: JenjangPendidikanRead[];
              total: number;
              limit: number;
              offset: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: { content: { "application/json": JenjangPendidikanCreate } };
      responses: {
        201: { content: { "application/json": JenjangPendidikanRead } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/jenjang-pendidikan/{id}": {
    get: {
      parameters: { path: { id: string } };
      responses: {
        200: { content: { "application/json": JenjangPendidikanRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    patch: {
      parameters: { path: { id: string } };
      requestBody: { content: { "application/json": JenjangPendidikanUpdate } };
      responses: {
        200: { content: { "application/json": JenjangPendidikanRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };

  // ── Core: Sekolah ─────────────────────────────────────────────────────────
  "/api/v1/sekolah": {
    get: {
      parameters: { query?: { limit?: number; offset?: number } };
      responses: {
        200: {
          content: {
            "application/json": {
              items: SekolahRead[];
              total: number;
              limit: number;
              offset: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: { content: { "application/json": SekolahCreate } };
      responses: {
        201: { content: { "application/json": SekolahRead } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/sekolah/{id}": {
    get: {
      parameters: { path: { id: string } };
      responses: {
        200: { content: { "application/json": SekolahRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    patch: {
      parameters: { path: { id: string } };
      requestBody: { content: { "application/json": SekolahUpdate } };
      responses: {
        200: { content: { "application/json": SekolahRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };

  // ── Anjab: Jabatan ────────────────────────────────────────────────────────
  "/api/v1/jabatan": {
    get: {
      parameters: { query?: { limit?: number; offset?: number } };
      responses: {
        200: {
          content: {
            "application/json": {
              items: JabatanRead[];
              total: number;
              limit: number;
              offset: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: { content: { "application/json": JabatanCreate } };
      responses: {
        201: { content: { "application/json": JabatanRead } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/jabatan/{id}": {
    get: {
      parameters: { path: { id: string } };
      responses: {
        200: { content: { "application/json": JabatanRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    patch: {
      parameters: { path: { id: string } };
      requestBody: { content: { "application/json": JabatanUpdate } };
      responses: {
        200: { content: { "application/json": JabatanRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };

  // ── Core: Mata Pelajaran ──────────────────────────────────────────────────
  "/api/v1/mata-pelajaran": {
    get: {
      parameters: { query?: { limit?: number; offset?: number } };
      responses: {
        200: {
          content: {
            "application/json": {
              items: MataPelajaranRead[];
              total: number;
              limit: number;
              offset: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: { content: { "application/json": MataPelajaranCreate } };
      responses: {
        201: { content: { "application/json": MataPelajaranRead } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/mata-pelajaran/{id}": {
    get: {
      parameters: { path: { id: string } };
      responses: {
        200: { content: { "application/json": MataPelajaranRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    patch: {
      parameters: { path: { id: string } };
      requestBody: { content: { "application/json": MataPelajaranUpdate } };
      responses: {
        200: { content: { "application/json": MataPelajaranRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };

  // ── Core: Partisipan ──────────────────────────────────────────────────────
  "/api/v1/partisipan": {
    get: {
      parameters: {
        query?: { limit?: number; offset?: number };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              items: PartisipanRead[];
              total: number;
              limit: number;
              offset: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          "application/json": PartisipanCreate;
        };
      };
      responses: {
        201: {
          content: {
            "application/json": PartisipanRead;
          };
        };
        409: {
          content: {
            "application/json": ErrorEnvelope;
          };
        };
      };
    };
  };

  // ── Core: Partisipan (detail + update) ───────────────────────────────────
  "/api/v1/partisipan/{id}": {
    get: {
      parameters: { path: { id: string } };
      responses: {
        200: { content: { "application/json": PartisipanRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    patch: {
      parameters: { path: { id: string } };
      requestBody: { content: { "application/json": PartisipanUpdate } };
      responses: {
        200: { content: { "application/json": PartisipanRead } };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };

  // ── DCS: Sesi ─────────────────────────────────────────────────────────────
  "/api/v1/dcs/sesi": {
    get: {
      parameters: { query?: { limit?: number; offset?: number } };
      responses: {
        200: {
          content: {
            "application/json": {
              items: DcsSesiRead[];
              total: number;
              limit: number;
              offset: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: { content: { "application/json": DcsSesiCreate } };
      responses: {
        201: { content: { "application/json": DcsSesiRead } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/dcs/sesi/{sesi_id}": {
    get: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": DcsSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    patch: {
      parameters: { path: { sesi_id: string } };
      requestBody: { content: { "application/json": DcsSesiUpdate } };
      responses: {
        200: { content: { "application/json": DcsSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { sesi_id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/dcs/sesi/{sesi_id}/buka": {
    post: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": DcsSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/dcs/sesi/{sesi_id}/tutup": {
    post: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": DcsSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/dcs/sesi/{sesi_id}/responden": {
    get: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": DcsRespondenRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    post: {
      parameters: { path: { sesi_id: string } };
      requestBody: { content: { "application/json": DcsRespondenCreate } };
      responses: {
        201: { content: { "application/json": DcsRespondenRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/dcs/sesi/responden/{responden_id}": {
    get: {
      parameters: { path: { responden_id: string } };
      responses: {
        200: { content: { "application/json": DcsRespondenRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { responden_id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };

  // ── WCP: Sesi ─────────────────────────────────────────────────────────────
  "/api/v1/wcp/sesi": {
    get: {
      parameters: { query?: { limit?: number; offset?: number } };
      responses: {
        200: {
          content: {
            "application/json": {
              items: WcpSesiRead[];
              total: number;
              limit: number;
              offset: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: { content: { "application/json": WcpSesiCreate } };
      responses: {
        201: { content: { "application/json": WcpSesiRead } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/wcp/sesi/{sesi_id}": {
    get: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": WcpSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    patch: {
      parameters: { path: { sesi_id: string } };
      requestBody: { content: { "application/json": WcpSesiUpdate } };
      responses: {
        200: { content: { "application/json": WcpSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { sesi_id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/wcp/sesi/{sesi_id}/buka": {
    post: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": WcpSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/wcp/sesi/{sesi_id}/tutup": {
    post: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": WcpSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/wcp/sesi/{sesi_id}/responden": {
    get: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": WcpRespondenRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    post: {
      parameters: { path: { sesi_id: string } };
      requestBody: { content: { "application/json": WcpRespondenCreate } };
      responses: {
        201: { content: { "application/json": WcpRespondenRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/wcp/sesi/responden/{responden_id}": {
    get: {
      parameters: { path: { responden_id: string } };
      responses: {
        200: { content: { "application/json": WcpRespondenRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    delete: {
      parameters: { path: { responden_id: string } };
      responses: {
        204: { content: never };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };

  // ── DCS: Master Data (Sub-Skala & Item) ───────────────────────────────────
  "/api/v1/dcs/sub-skala": {
    get: {
      responses: {
        200: { content: { "application/json": DcsSubSkalaRead[] } };
      };
    };
  };
  "/api/v1/dcs/sub-skala/{kode}": {
    get: {
      parameters: { path: { kode: string } };
      responses: {
        200: { content: { "application/json": DcsSubSkalaWithItemsRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/dcs/sub-skala/items/{item_id}": {
    patch: {
      parameters: { path: { item_id: string } };
      requestBody: { content: { "application/json": DcsItemUpdate } };
      responses: {
        200: { content: { "application/json": DcsItemRead } };
        401: { content: { "application/json": ErrorEnvelope } };
        403: { content: { "application/json": ErrorEnvelope } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };

  // ── WCP: Master Data (Dimensi & Item) ─────────────────────────────────────
  "/api/v1/wcp/dimensi": {
    get: {
      responses: {
        200: { content: { "application/json": WcpDimensiRead[] } };
      };
    };
  };
  "/api/v1/wcp/dimensi/{kode}": {
    get: {
      parameters: { path: { kode: string } };
      responses: {
        200: { content: { "application/json": WcpDimensiWithItemsRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/wcp/dimensi/items/{item_id}": {
    patch: {
      parameters: { path: { item_id: string } };
      requestBody: { content: { "application/json": WcpItemUpdate } };
      responses: {
        200: { content: { "application/json": WcpItemRead } };
        401: { content: { "application/json": ErrorEnvelope } };
        403: { content: { "application/json": ErrorEnvelope } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
};

// ── Tipe domain ───────────────────────────────────────────────────────────────

export type JenisJabatan = "struktural" | "fungsional" | "teknisi";
export type KelompokMatpel = "umum" | "peminatan" | "muatan_lokal" | "kejuruan";

// Jenjang Pendidikan
export interface JenjangPendidikanCreate {
  kode: string;
  nama: string;
  urutan?: number;
  aktif?: boolean;
}

export interface JenjangPendidikanUpdate {
  kode?: string;
  nama?: string;
  urutan?: number;
  aktif?: boolean;
}

export interface JenjangPendidikanRead {
  id: string;
  kode: string;
  nama: string;
  urutan: number;
  aktif: boolean;
}

// Sekolah
export interface SekolahCreate {
  nama: string;
  npsn?: string | null;
  jenjang_pendidikan_id: string;
  kota?: string | null;
  provinsi?: string | null;
  aktif?: boolean;
}

export interface SekolahUpdate {
  nama?: string;
  npsn?: string | null;
  jenjang_pendidikan_id?: string;
  kota?: string | null;
  provinsi?: string | null;
  aktif?: boolean;
}

export interface SekolahRead {
  id: string;
  nama: string;
  npsn: string | null;
  jenjang_pendidikan_id: string;
  kota: string | null;
  provinsi: string | null;
  aktif: boolean;
  created_at: string;
}

// Jabatan
export interface JabatanCreate {
  kode: string;
  nama: string;
  jenis: JenisJabatan;
  unit_kerja_id?: string | null;
  deskripsi?: string | null;
  aktif?: boolean;
}

export interface JabatanUpdate {
  kode?: string;
  nama?: string;
  jenis?: JenisJabatan;
  unit_kerja_id?: string | null;
  deskripsi?: string | null;
  aktif?: boolean;
}

export interface JabatanRead {
  id: string;
  kode: string;
  nama: string;
  jenis: JenisJabatan;
  unit_kerja_id: string | null;
  deskripsi: string | null;
  aktif: boolean;
  created_at: string;
}

// Mata Pelajaran
export interface MataPelajaranCreate {
  kode: string;
  nama: string;
  kelompok: KelompokMatpel;
  deskripsi?: string | null;
  aktif?: boolean;
}

export interface MataPelajaranUpdate {
  kode?: string;
  nama?: string;
  kelompok?: KelompokMatpel;
  deskripsi?: string | null;
  aktif?: boolean;
}

export interface MataPelajaranRead {
  id: string;
  kode: string;
  nama: string;
  kelompok: KelompokMatpel;
  deskripsi: string | null;
  aktif: boolean;
}

// Partisipan
export interface PartisipanUpdate {
  nama?: string;
  email?: string;
  sekolah_id?: string;
  jabatan_utama_id?: string;
  jabatan_tambahan_ids?: string[];
  masa_kerja_tahun?: number;
  masa_kerja_bulan?: number;
  mata_pelajaran_utama_id?: string | null;
  aktif?: boolean;
}

export interface PartisipanCreate {
  nama: string;
  email: string;
  sekolah_id: string;
  jabatan_utama_id: string;
  jabatan_tambahan_ids?: string[];
  masa_kerja_tahun: number;
  masa_kerja_bulan?: number;
  mata_pelajaran_utama_id?: string;
  aktif?: boolean;
}

export interface PartisipanRead {
  id: string;
  nama: string;
  email: string;
  authentik_user_id: string | null;
  sekolah_id: string;
  jabatan_utama_id: string;
  jabatan_tambahan_ids: string[];
  masa_kerja_tahun: number;
  masa_kerja_bulan: number;
  mata_pelajaran_utama_id: string | null;
  aktif: boolean;
  created_at: string;
}

// DCS — Demand-Control-Support (master data instrumen)
export type DcsArahItem = "F" | "UF";

export interface DcsSubSkalaRead {
  id: string;
  kode: string;
  nama: string;
  urutan: number;
}

export interface DcsItemRead {
  id: string;
  item_id: string;
  subskala_kode: string;
  sub_dimensi: string;
  pernyataan: string;
  arah: DcsArahItem;
  urutan: number;
}

export interface DcsSubSkalaWithItemsRead extends DcsSubSkalaRead {
  items: DcsItemRead[];
}

export interface DcsItemUpdate {
  pernyataan?: string;
  arah?: DcsArahItem;
  urutan?: number;
}

// WCP — Workplace Climate Profile (master data instrumen)
export type WcpReverseType = "NONE" | "R" | "UF" | "R_STAR";

export interface WcpDimensiRead {
  id: string;
  kode: string;
  nama: string;
  urutan: number;
  is_risk: boolean;
}

export interface WcpItemRead {
  id: string;
  item_id: string;
  dimensi_kode: string;
  indikator_kode: string;
  indikator_label: string;
  pernyataan: string;
  reverse_type: WcpReverseType;
  urutan: number;
}

export interface WcpDimensiWithItemsRead extends WcpDimensiRead {
  items: WcpItemRead[];
}

export interface WcpItemUpdate {
  pernyataan?: string;
  reverse_type?: WcpReverseType;
  urutan?: number;
}

// DCS — Sesi & Responden
export type StatusSesiDcs = "DRAFT" | "OPEN" | "CLOSED" | "ANALYZED";

export interface DcsSesiCreate {
  jabatan_id: string;
  periode: string;
  min_responden?: number;
  max_responden?: number;
  catatan?: string | null;
}

export interface DcsSesiUpdate {
  periode?: string;
  min_responden?: number;
  max_responden?: number;
  catatan?: string | null;
}

export interface DcsSesiRead {
  id: string;
  jabatan_id: string;
  periode: string;
  status: StatusSesiDcs;
  min_responden: number;
  max_responden: number;
  catatan: string | null;
  created_at: string;
}

export interface DcsRespondenCreate {
  nama?: string | null;
  jabatan_label: string;
}

export interface DcsRespondenRead {
  id: string;
  sesi_id: string;
  nama: string | null;
  jabatan_label: string;
  sudah_submit: boolean;
  submitted_at: string | null;
  created_at: string;
}

// WCP — Sesi & Responden
export type StatusSesiWcp = "DRAFT" | "OPEN" | "CLOSED" | "ANALYZED";

export interface WcpSesiCreate {
  jabatan_id: string;
  periode: string;
  min_responden?: number;
  max_responden?: number;
  catatan?: string | null;
}

export interface WcpSesiUpdate {
  periode?: string;
  min_responden?: number;
  max_responden?: number;
  catatan?: string | null;
}

export interface WcpSesiRead {
  id: string;
  jabatan_id: string;
  periode: string;
  status: StatusSesiWcp;
  min_responden: number;
  max_responden: number;
  catatan: string | null;
  created_at: string;
}

export interface WcpRespondenCreate {
  nama?: string | null;
  jabatan_label: string;
}

export interface WcpRespondenRead {
  id: string;
  sesi_id: string;
  nama: string | null;
  jabatan_label: string;
  sudah_submit: boolean;
  submitted_at: string | null;
  created_at: string;
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type components = {};
