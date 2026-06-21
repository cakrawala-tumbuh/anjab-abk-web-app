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

  // ── DCS & WCP: Jawaban & Kuesioner ────────────────────────────────────────
  "/api/v1/dcs/sesi/responden/{responden_id}/jawaban": {
    get: {
      parameters: { path: { responden_id: string } };
      responses: {
        200: { content: { "application/json": DcsJawabanRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    post: {
      parameters: { path: { responden_id: string } };
      requestBody: { content: { "application/json": DcsJawabanBulkCreate } };
      responses: {
        201: { content: { "application/json": DcsJawabanRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/wcp/sesi/responden/{responden_id}/jawaban": {
    get: {
      parameters: { path: { responden_id: string } };
      responses: {
        200: { content: { "application/json": WcpJawabanRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    post: {
      parameters: { path: { responden_id: string } };
      requestBody: { content: { "application/json": WcpJawabanBulkCreate } };
      responses: {
        201: { content: { "application/json": WcpJawabanRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/dcs/kuesioner/saya": {
    get: {
      responses: {
        200: { content: { "application/json": DcsKuesionerItemRead[] } };
      };
    };
  };
  "/api/v1/wcp/kuesioner/saya": {
    get: {
      responses: {
        200: { content: { "application/json": WcpKuesionerItemRead[] } };
      };
    };
  };
  "/api/v1/task-inventory/kuesioner/saya": {
    get: {
      responses: {
        200: { content: { "application/json": TiKuesionerItemRead[] } };
      };
    };
  };

  // ── Task Inventory: Catalog (master data) ─────────────────────────────────
  "/api/v1/task-inventory/catalog/kombinasi": {
    get: {
      responses: {
        200: { content: { "application/json": TiKombinasiRead[] } };
      };
    };
  };
  "/api/v1/task-inventory/catalog": {
    get: {
      parameters: { query: { unit: string; kategori_jabatan: string } };
      responses: {
        200: { content: { "application/json": TiCatalogRead[] } };
      };
    };
  };

  // ── Task Inventory: Sesi ──────────────────────────────────────────────────
  "/api/v1/task-inventory/sesi": {
    get: {
      parameters: { query?: { limit?: number; offset?: number } };
      responses: {
        200: {
          content: {
            "application/json": {
              items: TiSesiRead[];
              total: number;
              limit: number;
              offset: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: { content: { "application/json": TiSesiCreate } };
      responses: {
        201: { content: { "application/json": TiSesiRead } };
        409: { content: { "application/json": ErrorEnvelope } };
        422: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/{sesi_id}": {
    get: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": TiSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    patch: {
      parameters: { path: { sesi_id: string } };
      requestBody: { content: { "application/json": TiSesiUpdate } };
      responses: {
        200: { content: { "application/json": TiSesiRead } };
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
  "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap1": {
    post: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": TiSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap2": {
    post: {
      parameters: { path: { sesi_id: string }; query?: { paksa?: boolean } };
      responses: {
        200: { content: { "application/json": TiSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
        422: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/{sesi_id}/tutup": {
    post: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": TiSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/{sesi_id}/task-terpilih": {
    get: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": TiTaskTerpilihRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
        422: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/{sesi_id}/analisis": {
    post: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": TiHasilSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
        422: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/{sesi_id}/hasil": {
    get: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": TiHasilSesiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
        422: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/{sesi_id}/responden": {
    get: {
      parameters: { path: { sesi_id: string } };
      responses: {
        200: { content: { "application/json": TiRespondenRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    post: {
      parameters: { path: { sesi_id: string } };
      requestBody: { content: { "application/json": TiRespondenCreate } };
      responses: {
        201: { content: { "application/json": TiRespondenRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/responden/{responden_id}": {
    get: {
      parameters: { path: { responden_id: string } };
      responses: {
        200: { content: { "application/json": TiRespondenRead } };
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
  "/api/v1/task-inventory/sesi/responden/{responden_id}/seleksi": {
    get: {
      parameters: { path: { responden_id: string } };
      responses: {
        200: { content: { "application/json": TiSeleksiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    post: {
      parameters: { path: { responden_id: string } };
      requestBody: { content: { "application/json": TiSeleksiSubmit } };
      responses: {
        201: { content: { "application/json": TiSeleksiRead } };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
        422: { content: { "application/json": ErrorEnvelope } };
      };
    };
  };
  "/api/v1/task-inventory/sesi/responden/{responden_id}/detail": {
    get: {
      parameters: { path: { responden_id: string } };
      responses: {
        200: { content: { "application/json": TiDetailRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
      };
    };
    post: {
      parameters: { path: { responden_id: string } };
      requestBody: { content: { "application/json": TiDetailSubmit } };
      responses: {
        201: { content: { "application/json": TiDetailRead[] } };
        404: { content: { "application/json": ErrorEnvelope } };
        409: { content: { "application/json": ErrorEnvelope } };
        422: { content: { "application/json": ErrorEnvelope } };
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

// ── DCS & WCP — Jawaban & Kuesioner ─────────────────────────────────────────

export interface DcsJawabanItem {
  item_id: string;
  skor_raw: number;
}

export interface DcsJawabanBulkCreate {
  jawaban: DcsJawabanItem[];
}

export interface DcsJawabanRead {
  id: string;
  responden_id: string;
  item_id: string;
  skor_raw: number;
}

export interface WcpJawabanItem {
  item_id: string;
  skor_raw: number;
}

export interface WcpJawabanBulkCreate {
  jawaban: WcpJawabanItem[];
}

export interface WcpJawabanRead {
  id: string;
  responden_id: string;
  item_id: string;
  skor_raw: number;
}

export interface DcsKuesionerItemRead {
  id: string;
  sesi_id: string;
  jabatan_label: string;
  sudah_submit: boolean;
  submitted_at: string | null;
  created_at: string;
  sesi_status: string;
  sesi_periode: string;
  sesi_jabatan_id: string;
}

export interface WcpKuesionerItemRead {
  id: string;
  sesi_id: string;
  jabatan_label: string;
  sudah_submit: boolean;
  submitted_at: string | null;
  created_at: string;
  sesi_status: string;
  sesi_periode: string;
  sesi_jabatan_id: string;
}

// ── Task Inventory — Inventori Tugas (CalHR 5-komponen, 2 tahap) ────────────

export interface TiKuesionerItemRead {
  id: string;
  sesi_id: string;
  tahap1_submit: boolean;
  tahap1_submitted_at: string | null;
  tahap2_submit: boolean;
  tahap2_submitted_at: string | null;
  created_at: string;
  sesi_status: string;
  sesi_unit: string;
  sesi_kategori_jabatan: string;
  sesi_periode: string;
}

export type TiStatusSesi = "DRAFT" | "TAHAP1" | "TAHAP2" | "CLOSED" | "ANALYZED";
export type TiSumberBukti = "Formal" | "Aktual" | "Keduanya";
export type TiKondisi = "Baseline" | "Peak" | "Both";
export type TiAiMode = "Human-led" | "Co-Pilot" | "AI-assisted";
export type TiVaType = "VA-Core" | "VA-Enable" | "NVA-Residual";

export interface TiKombinasiRead {
  unit: string;
  kategori_jabatan: string;
  jumlah_task: number;
}

export interface TiCatalogRead {
  kode: string;
  unit: string;
  kategori_jabatan: string;
  tugas_pokok: string;
  detil_tugas: string;
  uraian_tugas: string;
  urutan: number;
}

export interface TiSesiCreate {
  unit: string;
  kategori_jabatan: string;
  periode: string;
  min_responden?: number;
  max_responden?: number;
  catatan?: string | null;
}

export interface TiSesiUpdate {
  periode?: string;
  min_responden?: number;
  max_responden?: number;
  catatan?: string | null;
}

export interface TiSesiRead {
  id: string;
  unit: string;
  kategori_jabatan: string;
  periode: string;
  status: TiStatusSesi;
  min_responden: number;
  max_responden: number;
  jumlah_task_terpilih: number | null;
  catatan: string | null;
  created_at: string;
}

export interface TiRespondenCreate {
  nama?: string | null;
  partisipan_id?: string | null;
}

export interface TiRespondenRead {
  id: string;
  sesi_id: string;
  nama: string | null;
  partisipan_id: string | null;
  tahap1_submit: boolean;
  tahap1_submitted_at: string | null;
  tahap2_submit: boolean;
  tahap2_submitted_at: string | null;
  created_at: string;
}

export interface TiSeleksiSubmit {
  task_kode: string[];
}

export interface TiSeleksiRead {
  responden_id: string;
  sesi_id: string;
  task_kode: string[];
  submitted_at: string | null;
}

export interface TiDetailItem {
  task_kode: string;
  sumber_bukti: TiSumberBukti;
  kondisi: TiKondisi;
  frekuensi_teks: string;
  durasi_per_kali: number;
  jam_per_minggu: number;
  peak4w_hours?: number;
  ai_mode: TiAiMode;
  va_type: TiVaType;
  dcs_flag?: boolean;
  catatan?: string | null;
}

export interface TiDetailSubmit {
  detail: TiDetailItem[];
}

export interface TiDetailRead {
  id: string;
  responden_id: string;
  sesi_id: string;
  task_kode: string;
  sumber_bukti: TiSumberBukti;
  kondisi: TiKondisi;
  frekuensi_teks: string;
  durasi_per_kali: number;
  jam_per_minggu: number;
  peak4w_hours: number;
  ai_mode: TiAiMode;
  va_type: TiVaType;
  dcs_flag: boolean;
  catatan: string | null;
}

export interface TiTaskTerpilihRead {
  kode: string;
  tugas_pokok: string;
  detil_tugas: string;
  uraian_tugas: string;
  n_relevan: number;
  pct_relevan: number;
}

export interface TiHasilTaskRead {
  kode: string;
  tugas_pokok: string;
  detil_tugas: string;
  uraian_tugas: string;
  n_relevan: number;
  pct_relevan: number;
  n_detail: number;
  jam_per_minggu_mean: number;
  jam_per_tahun_mean: number;
  durasi_per_kali_mean: number;
  peak4w_hours_mean: number;
  ai_mode_dist: Record<string, number>;
  va_type_dist: Record<string, number>;
  dcs_flag_count: number;
}

export interface TiHasilSesiRead {
  sesi_id: string;
  unit: string;
  kategori_jabatan: string;
  periode: string;
  n_responden_tahap1: number;
  n_responden_tahap2: number;
  jumlah_task_terpilih: number;
  total_jam_per_minggu: number;
  total_jam_per_tahun: number;
  tasks: TiHasilTaskRead[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type components = {};
