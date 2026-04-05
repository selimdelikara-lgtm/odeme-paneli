import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  })),
}));

vi.mock("../../_lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ ok: true, retryAfterMs: 0 })),
}));

describe("/api/odemeler/manage", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    vi.resetModules();
  });

  it("returns 401 without authorization header", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/odemeler/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_record", id: 1 }),
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 for missing action", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/odemeler/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });
});
