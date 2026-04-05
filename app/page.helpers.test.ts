import { describe, expect, it } from "vitest";
import {
  dateValue,
  durumScore,
  isHomeProjectColumnKey,
  isProjectColumnKey,
  sanitizeFileName,
  shortDate,
  shortDateTime,
} from "./page.helpers";

describe("page.helpers", () => {
  it("sanitizes filenames", () => {
    expect(sanitizeFileName("fatura örnek?.pdf")).toBe("fatura--rnek-.pdf");
  });

  it("recognizes valid column keys", () => {
    expect(isProjectColumnKey("proje")).toBe(true);
    expect(isProjectColumnKey("x")).toBe(false);
    expect(isHomeProjectColumnKey("toplam")).toBe(true);
    expect(isHomeProjectColumnKey("x")).toBe(false);
  });

  it("handles short date fallbacks", () => {
    expect(shortDate(null)).toBe("—");
    expect(shortDateTime(null)).toBe("—");
    expect(dateValue(null)).toBe(0);
  });

  it("computes durum score", () => {
    expect(durumScore({ odendi: true, fatura_kesildi: true } as never)).toBe(2);
    expect(durumScore({ odendi: false, fatura_kesildi: true } as never)).toBe(1);
    expect(durumScore({ odendi: false, fatura_kesildi: false } as never)).toBe(0);
  });
});
