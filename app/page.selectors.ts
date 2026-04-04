import { dateValue, durumScore } from "./page.helpers";
import type { Odeme, SortDirection, SortKey, StatusFilter } from "./page.shared";

export type SummaryStats = {
  toplam: number;
  odenen: number;
  tumOdeme: number;
  tumFatura: number;
  kalan: number;
  tahsilatYuzdesi: number;
};

export type HomeProjectStat = {
  tab: string;
  kayit: number;
  odenen: number;
  fatura: number;
  toplam: number;
  oran: number;
};

export const sortProjectRows = (
  rows: Odeme[],
  sortKey: SortKey,
  sortDirection: SortDirection
) => {
  if (sortKey === "manual") {
    return [...rows].sort((a, b) => {
      const sa = a.sira ?? 999999;
      const sb = b.sira ?? 999999;
      if (sa !== sb) return sa - sb;
      return a.id - b.id;
    });
  }

  return [...rows].sort((a, b) => {
    let r = 0;
    if (sortKey === "proje") r = (a.proje || "").localeCompare(b.proje || "", "tr");
    if (sortKey === "durum") r = durumScore(a) - durumScore(b);
    if (sortKey === "fatura_tarihi") r = dateValue(a.fatura_tarihi) - dateValue(b.fatura_tarihi);
    if (sortKey === "tutar") r = Number(a.tutar || 0) - Number(b.tutar || 0);
    return sortDirection === "asc" ? r : -r;
  });
};

export const filterRows = (
  rows: Odeme[],
  {
    searchTerm,
    statusFilter,
    dateFrom,
    dateTo,
  }: {
    searchTerm: string;
    statusFilter: StatusFilter;
    dateFrom: string;
    dateTo: string;
  }
) =>
  rows.filter((row) => {
    const q = searchTerm.trim().toLowerCase();
    const projeValue = (row.proje || "").toLowerCase();
    const grupValue = (row.grup || "").toLowerCase();

    const matchSearch = !q || projeValue.includes(q) || grupValue.includes(q);

    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "paid"
          ? Boolean(row.odendi)
          : statusFilter === "invoiced"
            ? Boolean(!row.odendi && row.fatura_kesildi)
            : Boolean(!row.odendi && !row.fatura_kesildi);

    const rowDate = dateValue(row.fatura_tarihi);
    const fromDate = dateFrom ? new Date(dateFrom).getTime() : null;
    const toDate = dateTo ? new Date(dateTo).getTime() : null;

    const matchFrom = fromDate === null ? true : rowDate >= fromDate;
    const matchTo = toDate === null ? true : rowDate <= toDate;

    return matchSearch && matchStatus && matchFrom && matchTo;
  });

export const summarizeRows = (rows: Odeme[]): SummaryStats => {
  const toplam = rows.reduce((sum, x) => sum + Number(x.tutar || 0), 0);
  const tumOdeme = rows.filter((x) => x.odendi).length;
  const tumFatura = rows.filter((x) => !x.odendi && x.fatura_kesildi).length;
  const odenen = rows
    .filter((x) => x.odendi)
    .reduce((sum, x) => sum + Number(x.tutar || 0), 0);
  const kalan = toplam - odenen;
  const tahsilatYuzdesi = toplam > 0 ? Math.round((odenen / toplam) * 100) : 0;

  return {
    toplam,
    odenen,
    tumOdeme,
    tumFatura,
    kalan,
    tahsilatYuzdesi,
  };
};

export const buildHomeProjectStats = (
  tabs: string[],
  rows: Odeme[]
): HomeProjectStat[] =>
  tabs
    .map((tab) => {
      const tabRows = rows.filter((x) => (x.grup || "") === tab);
      const toplam = tabRows.reduce((sum, x) => sum + Number(x.tutar || 0), 0);
      const odenen = tabRows
        .filter((x) => x.odendi)
        .reduce((sum, x) => sum + Number(x.tutar || 0), 0);

      return {
        tab,
        kayit: tabRows.length,
        odenen: tabRows.filter((x) => x.odendi).length,
        fatura: tabRows.filter((x) => !x.odendi && x.fatura_kesildi).length,
        toplam,
        oran: toplam > 0 ? Math.round((odenen / toplam) * 100) : 0,
      };
    })
    .filter((item) => item.kayit > 0)
    .sort((a, b) => b.toplam - a.toplam);
