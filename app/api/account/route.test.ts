import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      admin: {
        deleteUser: vi.fn(),
      },
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
        list: vi.fn().mockResolvedValue({ data: [] }),
      })),
    },
  })),
}));

vi.mock("../_lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ ok: true, retryAfterMs: 0 })),
}));

describe("/api/account", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    vi.resetModules();
  });

  it("returns 401 without authorization header", async () => {
    const { DELETE } = await import("./route");
    const response = await DELETE(new Request("http://localhost/api/account", { method: "DELETE" }));
    expect(response.status).toBe(401);
  });
});
