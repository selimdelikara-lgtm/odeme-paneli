import { describe, expect, it } from "vitest";
import { buildHomeProjectStats, filterRows, sortProjectRows, summarizeRows } from "./page.selectors";
import type { Odeme } from "./page.shared";

const rows: Odeme[] = [
  {
    id: 1,
    proje: "A",
    grup: "Tab 1",
    tutar: 1000,
    odendi: true,
    fatura_kesildi: true,
    fatura_tarihi: "2026-01-10",
    kdvli: false,
    sira: 2,
  },
  {
    id: 2,
    proje: "B",
    grup: "Tab 1",
    tutar: 500,
    odendi: false,
    fatura_kesildi: true,
    fatura_tarihi: "2026-02-10",
    kdvli: false,
    sira: 1,
  },
  {
    id: 3,
    proje: "C",
    grup: "Tab 2",
    tutar: 250,
    odendi: false,
    fatura_kesildi: false,
    fatura_tarihi: null,
    kdvli: false,
    sira: 3,
  },
];

describe("page.selectors", () => {
  it("sorts manual rows by sira then id", () => {
    const result = sortProjectRows(rows, "manual", "asc");
    expect(result.map((row) => row.id)).toEqual([2, 1, 3]);
  });

  it("filters rows by search and status", () => {
    const result = filterRows(rows, {
      searchTerm: "tab 1",
      statusFilter: "invoiced",
      dateFrom: "",
      dateTo: "",
    });
    expect(result.map((row) => row.id)).toEqual([2]);
  });

  it("summarizes totals correctly", () => {
    expect(summarizeRows(rows)).toEqual({
      toplam: 1750,
      odenen: 1000,
      tumOdeme: 1,
      tumFatura: 1,
      kalan: 750,
      tahsilatYuzdesi: 57,
    });
  });

  it("builds home project stats ordered by toplam", () => {
    const result = buildHomeProjectStats(["Tab 1", "Tab 2"], rows);
    expect(result.map((item) => item.tab)).toEqual(["Tab 1", "Tab 2"]);
    expect(result[0]).toMatchObject({
      kayit: 2,
      odenen: 1,
      fatura: 1,
      toplam: 1500,
      oran: 67,
    });
  });
});
