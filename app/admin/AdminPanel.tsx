"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  CreditCard,
  Download,
  FileText,
  Gauge,
  LogOut,
  Mail,
  MessageSquare,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

type Tab = "overview" | "users" | "payments" | "messages" | "traffic" | "logs" | "settings";
type ApiState<T> = { loading: boolean; error: string; data: T | null };

type OverviewData = {
  metrics: Record<string, number>;
  recentPayments: Array<Record<string, unknown>>;
  recentUsers: Array<Record<string, unknown>>;
  recentAuditLogs: Array<Record<string, unknown>>;
  charts: Record<string, Array<{ label: string; count: number }>>;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
  lastSignInAt: string | null;
  isActive: boolean;
  statusNote: string;
};

type PaymentRow = {
  id: number;
  user_id: string;
  proje: string | null;
  grup: string | null;
  tutar: number | null;
  odendi: boolean | null;
  fatura_kesildi: boolean | null;
  fatura_tarihi: string | null;
};

type PaymentsData = {
  items: PaymentRow[];
  totals: { totalAmount: number; paidAmount: number; pendingAmount: number };
  total: number;
};

type ContactStatus = "new" | "reviewed" | "resolved" | "archived";
type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};
type ContactReply = {
  id: string;
  email: string;
  subject: string;
  message: string;
  provider: string;
  provider_id: string | null;
  created_at: string;
};

const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Genel Bakış", icon: <Gauge size={18} /> },
  { id: "users", label: "Kullanıcılar", icon: <Users size={18} /> },
  { id: "payments", label: "Ödemeler", icon: <CreditCard size={18} /> },
  { id: "messages", label: "Mesajlar", icon: <MessageSquare size={18} /> },
  { id: "traffic", label: "Trafik", icon: <BarChart3 size={18} /> },
  { id: "logs", label: "Loglar", icon: <FileText size={18} /> },
  { id: "settings", label: "Ayarlar", icon: <Settings size={18} /> },
];

const currency = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value || 0);

const date = (value: unknown) => (value ? new Date(String(value)).toLocaleString("tr-TR") : "-");
const formatLogChanges = (value: unknown) => {
  if (!value || typeof value !== "object") return "-";
  const changes = (value as { changes?: unknown }).changes;
  if (!Array.isArray(changes) || !changes.length) return "-";
  return changes
    .map((item) => {
      const change = item as { field?: unknown; old?: unknown; next?: unknown };
      return `${String(change.field)}: ${String(change.old ?? "-")} -> ${String(change.next ?? "-")}`;
    })
    .join(" · ");
};

function useApi<T>(url: string, active = true): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ loading: true, error: "", data: null });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setState((current) => ({ ...current, loading: true, error: "" }));
    });
    fetch(url, { credentials: "same-origin" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error || "Veri alınamadı.");
        return payload as T;
      })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: "", data });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error: error.message, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [url, active]);

  return state;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-card metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="admin-empty">{text}</div>;
}

function Overview() {
  const state = useApi<OverviewData>("/api/admin/overview");
  const metrics = state.data?.metrics;

  if (state.loading) return <EmptyState text="Dashboard yükleniyor..." />;
  if (state.error) return <EmptyState text={state.error} />;
  if (!state.data || !metrics) return <EmptyState text="Dashboard verisi yok." />;

  return (
    <section className="admin-stack">
      <div className="metrics-grid">
        <MetricCard label="Toplam kullanıcı" value={metrics.totalUsers} />
        <MetricCard label="Bugünkü ziyaret" value={metrics.visitsToday} />
        <MetricCard label="Haftalık ziyaret" value={metrics.visitsWeek} />
        <MetricCard label="Aylık ziyaret" value={metrics.visitsMonth} />
        <MetricCard label="Toplam ödeme" value={metrics.totalPayments} />
        <MetricCard label="Ödenen tutar" value={currency(metrics.paidTotal)} />
        <MetricCard label="Bekleyen tutar" value={currency(metrics.pendingTotal)} />
        <MetricCard label="Uyarı" value={metrics.warningCount} />
      </div>
      <div className="admin-grid two">
        <Chart title="Günlük trafik" items={state.data.charts.dailyTraffic || []} />
        <Chart title="Ödeme durumu" items={state.data.charts.paymentStatus || []} />
      </div>
      <div className="admin-grid three">
        <SimpleList title="Son ödemeler" items={state.data.recentPayments} primary="proje" secondary="tutar" />
        <SimpleList title="Son giriş yapanlar" items={state.data.recentUsers} primary="email" secondary="lastSignInAt" />
        <SimpleList title="Son admin işlemleri" items={state.data.recentAuditLogs} primary="action" secondary="created_at" />
      </div>
    </section>
  );
}

function Chart({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="admin-card">
      <h2>{title}</h2>
      {total === 0 ? (
        <EmptyState text="Bu grafik için henüz veri yok." />
      ) : (
        <div className="bars">
          {items.map((item) => (
            <div className="bar-row" key={item.label}>
              <span>{item.label}</span>
              <div><i style={{ width: `${Math.max(5, (item.count / max) * 100)}%` }} /></div>
              <b>{item.count}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SimpleList({
  title,
  items,
  primary,
  secondary,
}: {
  title: string;
  items: Array<Record<string, unknown>>;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="admin-card">
      <h2>{title}</h2>
      <div className="simple-list">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${primary}-${index}`}>
              <strong>{String(item[primary] || "-")}</strong>
              <span>{secondary === "tutar" ? currency(Number(item[secondary] || 0)) : date(item[secondary])}</span>
            </div>
          ))
        ) : (
          <EmptyState text="Kayıt yok." />
        )}
      </div>
    </div>
  );
}

function UsersView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useApi<{ items: UserRow[] }>(
    `/api/admin/users?q=${encodeURIComponent(query)}&status=${status}&r=${refreshKey}`
  );
  const detail = useApi<{ user: UserRow; payments: PaymentRow[]; activities: Array<Record<string, unknown>> }>(
    selected ? `/api/admin/users/${selected}` : "/api/admin/users/none",
    Boolean(selected)
  );

  async function toggleUser(user: UserRow) {
    if (!window.confirm(`${user.email} kullanıcısının durumu değiştirilsin mi?`)) return;
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive, note: !user.isActive ? "" : "Admin panelinden pasifleştirildi" }),
    });
    setRefreshKey((value) => value + 1);
  }

  return (
    <section className="admin-stack">
      <div className="toolbar">
        <label><Search size={16} /><input placeholder="Kullanıcı ara" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
        <a className="admin-button secondary" href="/api/admin/export?type=users"><Download size={16} /> CSV</a>
      </div>
      <div className="admin-grid split">
        <div className="admin-card table-card">
          <h2>Kullanıcılar</h2>
          {state.loading ? <EmptyState text="Kullanıcılar yükleniyor..." /> : null}
          {state.error ? <EmptyState text={state.error} /> : null}
          <table>
            <thead><tr><th>E-posta</th><th>Telefon</th><th>Durum</th><th>Kayıt</th><th /></tr></thead>
            <tbody>
              {(state.data?.items || []).map((user) => (
                <tr key={user.id}>
                  <td>{user.email || "-"}</td>
                  <td>{user.phone || "-"}</td>
                  <td><span className={user.isActive ? "badge ok" : "badge warn"}>{user.isActive ? "Aktif" : "Pasif"}</span></td>
                  <td>{date(user.createdAt)}</td>
                  <td className="actions">
                    <button onClick={() => setSelected(user.id)}>Detay</button>
                    <button onClick={() => void toggleUser(user)}>{user.isActive ? "Pasifleştir" : "Aktifleştir"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-card">
          <h2>Kullanıcı Detayı</h2>
          {!selected ? <EmptyState text="Detay için kullanıcı seç." /> : null}
          {detail.loading && selected ? <EmptyState text="Detay yükleniyor..." /> : null}
          {detail.data ? (
            <div className="detail-stack">
              <p><b>E-posta:</b> {detail.data.user.email}</p>
              <p><b>Son giriş:</b> {date(detail.data.user.lastSignInAt)}</p>
              <p><b>Ödeme kaydı:</b> {detail.data.payments.length}</p>
              <h3>Son aktiviteler</h3>
              {detail.data.activities.slice(0, 5).map((item) => (
                <p key={String(item.id)}>{String(item.title || item.action)} · {date(item.created_at)}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PaymentsView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useApi<PaymentsData>(
    `/api/admin/payments?q=${encodeURIComponent(query)}&status=${status}&r=${refreshKey}`
  );

  async function savePayment() {
    if (!editing) return;
    if (!window.confirm("Bu ödeme kaydı güncellensin mi?")) return;
    const response = await fetch(`/api/admin/payments/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!response.ok) {
      window.alert("Ödeme güncellenemedi.");
      return;
    }
    setEditing(null);
    setRefreshKey((value) => value + 1);
  }

  return (
    <section className="admin-stack">
      <div className="toolbar">
        <label><Search size={16} /><input placeholder="Proje veya müşteri ara" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tüm kayıtlar</option>
          <option value="paid">Ödeme alındı</option>
          <option value="pending">Bekliyor</option>
          <option value="invoiced">Fatura kesildi</option>
          <option value="not_invoiced">Fatura kesilmedi</option>
        </select>
        <a className="admin-button secondary" href={`/api/admin/export?type=payments&status=${status}`}><Download size={16} /> CSV</a>
      </div>
      <div className="metrics-grid compact">
        <MetricCard label="Toplam" value={currency(state.data?.totals.totalAmount || 0)} />
        <MetricCard label="Ödenen" value={currency(state.data?.totals.paidAmount || 0)} />
        <MetricCard label="Bekleyen" value={currency(state.data?.totals.pendingAmount || 0)} />
        <MetricCard label="Kayıt" value={state.data?.total || 0} />
      </div>
      <div className="admin-card table-card">
        <h2>Ödeme kayıtları</h2>
        {state.loading ? <EmptyState text="Ödemeler yükleniyor..." /> : null}
        <table>
          <thead><tr><th>Proje</th><th>Müşteri/Sekme</th><th>Tutar</th><th>Durum</th><th>Fatura</th><th>Tarih</th><th /></tr></thead>
          <tbody>
            {(state.data?.items || []).map((item) => (
              <tr key={item.id}>
                <td>{item.proje || "-"}</td>
                <td>{item.grup || "-"}</td>
                <td>{currency(Number(item.tutar || 0))}</td>
                <td><span className={item.odendi ? "badge ok" : "badge warn"}>{item.odendi ? "Ödendi" : "Bekliyor"}</span></td>
                <td><span className={item.fatura_kesildi ? "badge ok" : "badge neutral"}>{item.fatura_kesildi ? "Kesildi" : "Kesilmedi"}</span></td>
                <td>{item.fatura_tarihi || "-"}</td>
                <td className="actions"><button onClick={() => setEditing(item)}>Düzenle</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal">
            <h2>Ödeme düzenle</h2>
            <label>Proje<input value={editing.proje || ""} onChange={(e) => setEditing({ ...editing, proje: e.target.value })} /></label>
            <label>Müşteri/Sekme<input value={editing.grup || ""} onChange={(e) => setEditing({ ...editing, grup: e.target.value })} /></label>
            <label>Tutar<input type="number" value={editing.tutar || 0} onChange={(e) => setEditing({ ...editing, tutar: Number(e.target.value) })} /></label>
            <label>Tarih<input type="date" value={editing.fatura_tarihi || ""} onChange={(e) => setEditing({ ...editing, fatura_tarihi: e.target.value || null })} /></label>
            <label className="check"><input type="checkbox" checked={Boolean(editing.odendi)} onChange={(e) => setEditing({ ...editing, odendi: e.target.checked })} /> Ödeme alındı</label>
            <label className="check"><input type="checkbox" checked={Boolean(editing.fatura_kesildi)} onChange={(e) => setEditing({ ...editing, fatura_kesildi: e.target.checked })} /> Fatura kesildi</label>
            <div className="modal-actions">
              <button className="admin-button secondary" onClick={() => setEditing(null)}>Vazgeç</button>
              <button className="admin-button" onClick={() => void savePayment()}><Save size={16} /> Kaydet</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MessagesView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyStatus, setReplyStatus] = useState("");
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useApi<{ items: ContactMessage[]; total: number }>(
    `/api/admin/messages?q=${encodeURIComponent(query)}&status=${status}&r=${refreshKey}`
  );

  async function openMessage(message: ContactMessage) {
    const response = await fetch(`/api/admin/messages/${message.id}`);
    const payload = (await response.json().catch(() => ({}))) as { item?: ContactMessage; replies?: ContactReply[] };
    const next = payload.item || message;
    setSelected(next);
    setAdminNote(next.admin_note || "");
    setReplyText(`Merhaba ${next.name},\n\n`);
    setReplyStatus("");
    setReplies(payload.replies || []);
  }

  async function saveMessage(nextStatus?: ContactStatus) {
    if (!selected) return;
    const response = await fetch(`/api/admin/messages/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus || selected.status,
        adminNote,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { item?: ContactMessage; error?: string };
    if (!response.ok || !payload.item) {
      window.alert(payload.error || "Mesaj güncellenemedi.");
      return;
    }
    setSelected(payload.item);
    setAdminNote(payload.item.admin_note || "");
    setRefreshKey((value) => value + 1);
  }

  async function copyEmail(email: string) {
    if (!navigator.clipboard) {
      window.prompt("E-posta adresi", email);
      return;
    }
    await navigator.clipboard.writeText(email);
    window.alert("E-posta kopyalandı.");
  }

  async function sendReply() {
    if (!selected) return;
    const message = replyText.trim();
    if (message.length < 2) {
      window.alert("Cevap metni boş olamaz.");
      return;
    }
    setReplySending(true);
    try {
      const response = await fetch(`/api/admin/messages/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        window.alert(payload.error || "E-posta gönderilemedi.");
        return;
      }
      setReplyStatus("Cevap e-postası gönderildi.");
      setReplyText("");
      await openMessage({ ...selected, status: selected.status === "new" ? "reviewed" : selected.status });
      setRefreshKey((value) => value + 1);
    } finally {
      setReplySending(false);
    }
  }

  return (
    <section className="admin-stack">
      <div className="toolbar">
        <label><Search size={16} /><input placeholder="Mesaj ara" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tüm durumlar</option>
          <option value="new">Yeni</option>
          <option value="reviewed">İncelendi</option>
          <option value="resolved">Çözüldü</option>
          <option value="archived">Arşivlendi</option>
        </select>
      </div>
      <div className="admin-grid split">
        <div className="admin-card table-card">
          <h2>Gelen mesajlar</h2>
          {state.loading ? <EmptyState text="Mesajlar yükleniyor..." /> : null}
          {state.error ? <EmptyState text={state.error} /> : null}
          {!state.loading && !state.data?.items.length ? <EmptyState text="Henüz mesaj yok." /> : null}
          <table>
            <thead><tr><th>Gönderen</th><th>E-posta</th><th>Konu</th><th>Ön izleme</th><th>Durum</th><th>Tarih</th><th /></tr></thead>
            <tbody>
              {(state.data?.items || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.subject}</td>
                  <td>{item.message.slice(0, 90)}{item.message.length > 90 ? "..." : ""}</td>
                  <td><span className={`badge ${item.status === "new" ? "warn" : item.status === "resolved" ? "ok" : "neutral"}`}>{item.status}</span></td>
                  <td>{date(item.created_at)}</td>
                  <td className="actions">
                    <button onClick={() => void openMessage(item)}>Detay</button>
                    <button onClick={() => void copyEmail(item.email)}>E-posta</button>
                    <button onClick={() => void openMessage(item)}>Cevapla</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-card">
          <h2>Mesaj Detayı</h2>
          {!selected ? <EmptyState text="Okumak için bir mesaj seç." /> : null}
          {selected ? (
            <div className="detail-stack">
              <p><b>Gönderen:</b> {selected.name}</p>
              <p><b>E-posta:</b> {selected.email}</p>
              <p><b>Konu:</b> {selected.subject}</p>
              <p><b>Tarih:</b> {date(selected.created_at)}</p>
              <div className="admin-inline-actions">
                <button type="button" onClick={() => void copyEmail(selected.email)}>E-postayı kopyala</button>
              </div>
              <div className="admin-message-body">{selected.message}</div>
              <label className="admin-field">
                Durum
                <select
                  value={selected.status}
                  onChange={(event) => {
                    const nextStatus = event.target.value as ContactStatus;
                    setSelected({ ...selected, status: nextStatus });
                    void saveMessage(nextStatus);
                  }}
                >
                  <option value="new">new</option>
                  <option value="reviewed">reviewed</option>
                  <option value="resolved">resolved</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label className="admin-field">
                Admin notu
                <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} rows={5} />
              </label>
              <button className="admin-button" onClick={() => void saveMessage()}><Save size={16} /> Notu kaydet</button>
              <div className="reply-box">
                <h3>Cevap gönder</h3>
                <p className="muted">Kısa, kişisel ve linksiz cevaplar gelen kutusuna düşme ihtimalini artırır.</p>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows={8}
                  placeholder="Mesaja vereceğiniz cevabı yazın."
                />
                <button className="admin-button" disabled={replySending} onClick={() => void sendReply()}>
                  <Mail size={16} /> {replySending ? "Gönderiliyor..." : "Cevabı gönder"}
                </button>
                {replyStatus ? <p className="admin-success">{replyStatus}</p> : null}
              </div>
              <div className="reply-history">
                <h3>Cevap geçmişi</h3>
                {!replies.length ? <p className="muted">Bu mesaja henüz panelden cevap gönderilmedi.</p> : null}
                {replies.map((reply) => (
                  <div key={reply.id} className="reply-history-item">
                    <strong>{date(reply.created_at)}</strong>
                    <span>{reply.subject}</span>
                    <p>{reply.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TrafficView() {
  const state = useApi<{
    totals: Record<string, number>;
    topPages: Array<{ label: string; count: number }>;
    referrers: Array<{ label: string; count: number }>;
    devices: Array<{ label: string; count: number }>;
    browsers: Array<{ label: string; count: number }>;
    recent: Array<Record<string, unknown>>;
  }>("/api/admin/traffic");
  if (state.loading) return <EmptyState text="Trafik verileri yükleniyor..." />;
  if (!state.data) return <EmptyState text={state.error || "Trafik verisi yok."} />;
  const hasTraffic = state.data.totals.monthly > 0;
  return (
    <section className="admin-stack">
      <div className="metrics-grid compact">
        <MetricCard label="Günlük" value={state.data.totals.daily} />
        <MetricCard label="Haftalık" value={state.data.totals.weekly} />
        <MetricCard label="Aylık" value={state.data.totals.monthly} />
      </div>
      {!hasTraffic ? (
        <EmptyState text="Henüz trafik kaydı yok. Normal site sayfaları ziyaret edildikçe burada görünür; admin sayfaları bilinçli olarak sayılmaz." />
      ) : null}
      <div className="admin-grid two">
        <Chart title="En çok ziyaret edilen sayfalar" items={state.data.topPages} />
        <Chart title="Cihaz türü" items={state.data.devices} />
        <Chart title="Kaynaklar" items={state.data.referrers} />
        <Chart title="Tarayıcılar" items={state.data.browsers} />
      </div>
    </section>
  );
}

function LogsView() {
  const [query, setQuery] = useState("");
  const state = useApi<{ items: Array<Record<string, unknown>>; total: number }>(
    `/api/admin/logs?q=${encodeURIComponent(query)}`
  );
  return (
    <section className="admin-stack">
      <div className="toolbar">
        <label><Search size={16} /><input placeholder="Log ara" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      </div>
      <div className="admin-card table-card">
        <h2>Audit logları</h2>
        {state.loading ? <EmptyState text="Loglar yükleniyor..." /> : null}
        <table>
          <thead><tr><th>İşlem</th><th>Varlık</th><th>Kayıt</th><th>Değişen alanlar</th><th>Zaman</th></tr></thead>
          <tbody>
            {(state.data?.items || []).map((item) => (
              <tr key={String(item.id)}>
                <td>{String(item.action || "-")}</td>
                <td>{String(item.entity_type || "-")}</td>
                <td>{String(item.entity_id || "-")}</td>
                <td>{formatLogChanges(item.new_value)}</td>
                <td>{date(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SettingsView({ adminEmail }: { adminEmail: string }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [message, setMessage] = useState("");
  const state = useApi<{ items: Array<{ key: string; value: Record<string, unknown> }>; system: Record<string, unknown> }>("/api/admin/settings");

  useEffect(() => {
    const maintenance = state.data?.items.find((item) => item.key === "maintenance_mode")?.value;
    if (maintenance) {
      queueMicrotask(() => {
        setMaintenanceMode(Boolean(maintenance.enabled));
        setMessage(String(maintenance.message || ""));
      });
    }
  }, [state.data]);

  async function save() {
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenanceMode, maintenanceMessage: message, exportFormat: "csv" }),
    });
    window.alert(response.ok ? "Ayarlar kaydedildi." : "Ayarlar kaydedilemedi.");
  }

  return (
    <section className="admin-grid two">
      <div className="admin-card settings-card">
        <h2>Site ayarları</h2>
        <label className="check"><input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} /> Bakım modu</label>
        <label>Bakım mesajı<textarea value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <button className="admin-button" onClick={() => void save()}><Save size={16} /> Kaydet</button>
      </div>
      <div className="admin-card">
        <h2>Sistem durumu</h2>
        <p><b>Admin:</b> {adminEmail}</p>
        <p><b>Ortam:</b> {String(state.data?.system.env || "-")}</p>
        <p><b>Supabase:</b> {state.data?.system.supabaseConfigured ? "Bağlı" : "Eksik"}</p>
        <p className="muted">TODO: Bildirim ayarları ve gelişmiş export formatları ileriki sürüme ayrıldı.</p>
      </div>
    </section>
  );
}

export default function AdminPanel({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const title = useMemo(() => tabs.find((item) => item.id === tab)?.label || "Admin", [tab]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><ShieldCheck size={22} /><span>Ödedimi Admin</span></div>
        <nav>
          {tabs.map((item) => (
            <button className={tab === item.id ? "active" : ""} key={item.id} onClick={() => setTab(item.id)}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <section className="admin-main">
        <header className="admin-header">
          <div><p>Kontrol paneli</p><h1>{title}</h1></div>
          <div className="admin-header-actions"><span>{adminEmail}</span><button onClick={() => void logout()}><LogOut size={16} /> Çıkış</button></div>
        </header>
        {tab === "overview" ? <Overview /> : null}
        {tab === "users" ? <UsersView /> : null}
        {tab === "payments" ? <PaymentsView /> : null}
        {tab === "messages" ? <MessagesView /> : null}
        {tab === "traffic" ? <TrafficView /> : null}
        {tab === "logs" ? <LogsView /> : null}
        {tab === "settings" ? <SettingsView adminEmail={adminEmail} /> : null}
      </section>
      <style jsx global>{`
        body { margin: 0; background: #f5f8fc; color: #172033; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        button, input, select, textarea { font: inherit; }
        .admin-shell { min-height: 100vh; display: grid; grid-template-columns: 248px 1fr; }
        .admin-sidebar { background: #10213f; color: #fff; padding: 20px; display: flex; flex-direction: column; gap: 24px; }
        .admin-brand { display: flex; align-items: center; gap: 10px; font-weight: 900; }
        .admin-sidebar nav { display: grid; gap: 6px; }
        .admin-sidebar button { display: flex; align-items: center; gap: 10px; border: 0; border-radius: 8px; padding: 12px; background: transparent; color: #dbeafe; cursor: pointer; text-align: left; }
        .admin-sidebar button.active, .admin-sidebar button:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .admin-main { min-width: 0; padding: 24px; }
        .admin-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 22px; }
        .admin-header p { margin: 0; color: #64748b; font-weight: 700; font-size: 13px; }
        .admin-header h1 { margin: 4px 0 0; font-size: 28px; }
        .admin-header-actions { display: flex; align-items: center; gap: 12px; color: #64748b; font-size: 14px; }
        .admin-header-actions button, .actions button, .actions a, .admin-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; border: 0; border-radius: 8px; padding: 0 12px; background: #1d4ed8; color: #fff; cursor: pointer; font-weight: 800; text-decoration: none; }
        .actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .actions button, .actions a, .admin-button.secondary { background: #eaf1ff; color: #1d4ed8; }
        .admin-inline-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .admin-inline-actions button { display: inline-flex; align-items: center; justify-content: center; min-height: 36px; border: 0; border-radius: 8px; padding: 0 12px; background: #f1f5f9; color: #334155; cursor: pointer; font-weight: 800; }
        .admin-stack { display: grid; gap: 16px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .metrics-grid.compact { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .admin-grid { display: grid; gap: 16px; }
        .admin-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .admin-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .admin-grid.split { grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr); align-items: start; }
        .admin-card { background: #fff; border: 1px solid #dce7f5; border-radius: 8px; padding: 16px; box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05); min-width: 0; }
        .admin-card h2 { margin: 0 0 14px; font-size: 17px; }
        .metric-card span { color: #64748b; font-size: 13px; font-weight: 800; }
        .metric-card strong { display: block; margin-top: 8px; font-size: 24px; letter-spacing: 0; overflow-wrap: anywhere; }
        .toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .toolbar label { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 12px; border: 1px solid #cbd8ea; border-radius: 8px; background: #fff; }
        .toolbar input, .toolbar select, select { border: 0; outline: 0; background: transparent; }
        .toolbar select { min-height: 40px; border: 1px solid #cbd8ea; border-radius: 8px; padding: 0 12px; background: #fff; }
        .table-card { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 760px; }
        th, td { padding: 11px 10px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 13px; vertical-align: middle; }
        th { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0; }
        .badge { display: inline-flex; align-items: center; min-height: 24px; border-radius: 999px; padding: 0 9px; font-size: 12px; font-weight: 900; }
        .badge.ok { background: #dcfce7; color: #166534; }
        .badge.warn { background: #fef3c7; color: #92400e; }
        .badge.neutral { background: #e5e7eb; color: #374151; }
        .admin-empty { border: 1px dashed #cbd8ea; border-radius: 8px; padding: 18px; color: #64748b; background: #f8fbff; }
        .bars { display: grid; gap: 10px; }
        .bar-row { display: grid; grid-template-columns: 82px 1fr 36px; gap: 10px; align-items: center; font-size: 13px; }
        .bar-row div { height: 10px; background: #eaf1ff; border-radius: 999px; overflow: hidden; }
        .bar-row i { display: block; height: 100%; background: #1d4ed8; border-radius: inherit; }
        .simple-list, .detail-stack { display: grid; gap: 10px; }
        .simple-list div { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #edf2f7; padding-bottom: 10px; }
        .simple-list span, .muted { color: #64748b; }
        .admin-message-body { white-space: pre-wrap; border: 1px solid #dce7f5; border-radius: 8px; padding: 12px; background: #f8fbff; color: #334155; line-height: 1.6; }
        .admin-field { display: grid; gap: 8px; color: #64748b; font-size: 13px; font-weight: 800; }
        .admin-field select, .admin-field textarea { border: 1px solid #cbd8ea; border-radius: 8px; padding: 10px; font: inherit; background: #fff; color: #172033; }
        .admin-field textarea { resize: vertical; }
        .reply-box { display: grid; gap: 10px; margin-top: 4px; border-top: 1px solid #edf2f7; padding-top: 14px; }
        .reply-box h3 { margin: 0; font-size: 15px; }
        .reply-box textarea { width: 100%; border: 1px solid #cbd8ea; border-radius: 8px; padding: 10px; font: inherit; background: #fff; color: #172033; resize: vertical; line-height: 1.55; }
        .reply-box button:disabled { opacity: 0.65; cursor: wait; }
        .admin-success { margin: 0; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; background: #f0fdf4; color: #166534; font-size: 13px; font-weight: 850; }
        .reply-history { display: grid; gap: 10px; border-top: 1px solid #edf2f7; padding-top: 14px; }
        .reply-history h3 { margin: 0; font-size: 15px; }
        .reply-history-item { display: grid; gap: 6px; border: 1px solid #dce7f5; border-radius: 8px; padding: 11px; background: #fbfdff; }
        .reply-history-item strong { font-size: 12px; color: #64748b; }
        .reply-history-item span { font-weight: 850; }
        .reply-history-item p { margin: 0; white-space: pre-wrap; color: #334155; line-height: 1.55; }
        .modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(15, 23, 42, 0.38); z-index: 20; }
        .modal { width: min(100%, 520px); display: grid; gap: 12px; background: #fff; border-radius: 8px; padding: 18px; }
        .modal label, .settings-card label { display: grid; gap: 7px; font-size: 13px; font-weight: 800; color: #64748b; }
        .modal input, .settings-card textarea { min-height: 40px; border: 1px solid #cbd8ea; border-radius: 8px; padding: 0 10px; }
        .settings-card textarea { min-height: 96px; padding: 10px; resize: vertical; }
        .check { display: flex !important; grid-template-columns: auto 1fr; flex-direction: row; align-items: center; }
        .check input { width: 18px; height: 18px; min-height: auto; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        @media (max-width: 980px) {
          .admin-shell { grid-template-columns: 1fr; }
          .admin-sidebar { position: sticky; top: 0; z-index: 10; padding: 12px; }
          .admin-sidebar nav { display: flex; overflow-x: auto; }
          .admin-sidebar button { flex: 0 0 auto; }
          .metrics-grid, .metrics-grid.compact, .admin-grid.two, .admin-grid.three, .admin-grid.split { grid-template-columns: 1fr; }
          .admin-header { align-items: flex-start; flex-direction: column; }
          .admin-main { padding: 16px; }
        }
      `}</style>
    </main>
  );
}
