"use client";
import * as React from "react";
import {
  GraduationCap, Loader2, ArrowRight, CalendarCheck, Award, CalendarDays, BookOpen, Bus,
  Wallet, Receipt, Bell, MessageCircle, FileText, Home, LogOut, WifiOff, Send, Plus, ChevronLeft,
} from "lucide-react";

/* ---------------- types ---------------- */
type Overview = {
  student: { id: string; name: string; studentId: string; photo: string | null; class: string | null; section: string | null; roll: string | null; guardian: string | null };
  attendance: { summary: Record<string, number>; totalDays: number; rate: number | null };
  results: { id: string; marks: number; totalMarks: number; grade: string | null; exam?: { name: string } | null; subject?: { name: string } | null }[];
  gpa: { exam: string | null; gpa: number; grade: string } | null;
  invoices: { id: string; invoiceNo: string; total: number; paidTotal: number; status: string; dueDate: string }[];
  outstanding: number;
  payments: { id: string; amount: number; method: string; status: string; gatewayRef: string | null; createdAt: string; invoice?: { invoiceNo: string } | null }[];
  transport: { id: string; route?: { name: string } | null; stop?: { name: string } | null }[];
  notices: { id: string; title: string; content: string; pinned: boolean; createdAt: string }[];
  routine: { id: string; day: string; startTime: string; endTime: string; room: string | null; subject?: { name: string } | null; teacher?: { fullName: string } | null }[];
  homework: { id: string; title: string; details: string; dueDate: string; subject?: { name: string } | null }[];
  messages: { id: string; sender: string; body: string; createdAt: string; teacher?: { fullName: string } | null }[];
  leaves: { id: string; fromDate: string; toDate: string; reason: string; status: string }[];
};

const TOKEN_KEY = "gw_portal_token";
const taka = (n: number) => `৳${(n ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

async function api<T>(url: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = opts;
  const res = await fetch(url, { ...rest, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(rest.headers || {}) } });
  let json: { success?: boolean; data?: T; error?: string } | null = null;
  try { json = await res.json(); } catch { /* non-JSON (e.g. HTML error page) */ }
  if (!res.ok || !json || !json.success) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json.data as T;
}

/* ---------------- root ---------------- */
export default function PortalPage() {
  const [token, setToken] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    try { setToken(localStorage.getItem(TOKEN_KEY)); } catch { /* ignore */ }
    setReady(true);
  }, []);
  const onLogin = (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } setToken(t); };
  const onLogout = () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } setToken(null); };

  if (!ready) return <div className="flex min-h-[100dvh] items-center justify-center text-[#86868b]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!token) return <Login onLogin={onLogin} />;
  return <PortalHome token={token} onLogout={onLogout} onExpired={onLogout} />;
}

/* ---------------- login ---------------- */
function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const [studentId, setStudentId] = React.useState("");
  const [factor, setFactor] = React.useState("");
  const [mode, setMode] = React.useState<"phone" | "dob">("phone");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!studentId.trim() || !factor.trim()) { setError("Enter student ID and verification."); return; }
    setLoading(true);
    try {
      const body = mode === "phone" ? { studentId: studentId.trim(), phone: factor.trim() } : { studentId: studentId.trim(), dob: factor.trim() };
      const d = await api<{ token: string }>("/api/portal/login", { method: "POST", body: JSON.stringify(body) });
      onLogin(d.token);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#0f766e] text-white shadow-lg">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight">Parent Portal</h1>
        <p className="mt-1 text-[15px] text-[#86868b]">Sign in to follow your child&apos;s progress.</p>
      </div>

      <div className="rounded-[22px] bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:bg-[#1c1c1e]">
        <label className="block text-[13px] font-medium text-[#86868b]">Student ID</label>
        <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. STU-3001"
          className="mt-1.5 w-full rounded-xl border-0 bg-[#f5f5f7] px-4 py-3.5 text-[16px] outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-[#0f766e] dark:bg-[#2c2c2e]" />
        <div className="mt-4 flex rounded-xl bg-[#f5f5f7] p-1 dark:bg-[#2c2c2e]">
          {(["phone", "dob"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setFactor(""); }}
              className={`flex-1 rounded-lg py-2 text-[14px] font-medium transition ${mode === m ? "bg-white text-[#1d1d1f] shadow-sm dark:bg-[#3a3a3c] dark:text-white" : "text-[#86868b]"}`}>
              {m === "phone" ? "Phone" : "Date of birth"}
            </button>
          ))}
        </div>
        <input value={factor} onChange={(e) => setFactor(e.target.value)} type={mode === "dob" ? "date" : "tel"}
          placeholder={mode === "phone" ? "Registered phone" : ""} onKeyDown={(e) => e.key === "Enter" && submit()}
          className="mt-3 w-full rounded-xl border-0 bg-[#f5f5f7] px-4 py-3.5 text-[16px] outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-[#0f766e] dark:bg-[#2c2c2e]" />
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-600 dark:bg-red-950/40">{error}</p>}
        <button onClick={submit} disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f766e] py-3.5 text-[16px] font-medium text-white transition hover:bg-[#0b5d56] disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
      <p className="mt-4 text-center text-[12px] text-[#a1a1a6]">Demo: STU-3001 · phone 01700000000</p>
    </div>
  );
}

/* ---------------- portal home ---------------- */
const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "academics", label: "Academics", icon: Award },
  { id: "school", label: "School", icon: CalendarDays },
  { id: "fees", label: "Fees", icon: Wallet },
  { id: "more", label: "More", icon: MessageCircle },
] as const;

function PortalHome({ token, onLogout, onExpired }: { token: string; onLogout: () => void; onExpired: () => void }) {
  const [data, setData] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<(typeof TABS)[number]["id"]>("home");
  const [offline, setOffline] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api<Overview>("/api/portal/overview", { token });
      setData(d); setOffline(false);
    } catch (e) {
      const msg = (e as Error).message || "";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("sign in")) { onExpired(); return; }
      // Distinguish a genuine network failure from a server/API error. A thrown
      // TypeError from fetch (or navigator.onLine === false) means truly offline;
      // anything else is a real error we should show, not a false "offline".
      const isNetwork = !navigator.onLine || e instanceof TypeError;
      setOffline(isNetwork);
      if (!isNetwork) setError(msg || "Something went wrong loading the portal.");
    } finally { setLoading(false); }
  }, [token, onExpired]);
  React.useEffect(() => { load(); }, [load]);

  if (loading && !data) return <div className="flex min-h-[100dvh] items-center justify-center text-[#86868b]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <WifiOff className="h-10 w-10 text-[#86868b]" />
      <p className="text-[16px] font-medium">{offline ? "You're offline" : "Couldn't load the portal"}</p>
      <p className="text-[14px] text-[#86868b]">
        {offline ? "Connect to the internet to load the portal for the first time." : (error ?? "Please try again in a moment.")}
      </p>
      <button onClick={load} className="mt-2 rounded-xl bg-[#0f766e] px-5 py-2.5 text-[15px] font-medium text-white">Retry</button>
      <button onClick={onLogout} className="text-[13px] text-[#86868b] underline">Sign in again</button>
    </div>
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col pb-24">
      {/* header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-[#f5f5f7]/80 px-5 pb-3 pt-5 backdrop-blur-xl dark:bg-black/70">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f766e] text-[17px] font-semibold text-white">
          {data.student.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-[17px] font-semibold leading-tight">{data.student.name}</div>
          <div className="truncate text-[13px] text-[#86868b]">{data.student.class ?? "—"}{data.student.section ? ` · ${data.student.section}` : ""} · {data.student.studentId}</div>
        </div>
        <button onClick={onLogout} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#86868b] dark:bg-[#1c1c1e]"><LogOut className="h-4 w-4" /></button>
      </header>

      {offline && (
        <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-700 dark:bg-amber-950/40">
          <WifiOff className="h-3.5 w-3.5" /> Offline — showing your last saved data.
        </div>
      )}

      <main className="flex-1 px-5">
        {tab === "home" && <HomeTab data={data} go={setTab} />}
        {tab === "academics" && <AcademicsTab data={data} token={token} />}
        {tab === "school" && <SchoolTab data={data} />}
        {tab === "fees" && <FeesTab data={data} />}
        {tab === "more" && <MoreTab data={data} token={token} onReload={load} />}
      </main>

      {/* bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md items-center justify-around border-t border-black/[0.06] bg-white/90 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c1e]/90">
        {TABS.map((tb) => { const Icon = tb.icon; const active = tab === tb.id; return (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex flex-1 flex-col items-center gap-0.5 py-1 ${active ? "text-[#0f766e]" : "text-[#86868b]"}`}>
            <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
            <span className="text-[10px] font-medium">{tb.label}</span>
          </button>
        ); })}
      </nav>
    </div>
  );
}

/* ---------------- cards + tabs ---------------- */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[18px] bg-white p-4 shadow-[0_1px_10px_rgba(0,0,0,0.04)] dark:bg-[#1c1c1e] ${className}`}>{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-5 px-1 text-[13px] font-semibold uppercase tracking-wide text-[#86868b]">{children}</h2>;
}

function HomeTab({ data, go }: { data: Overview; go: (t: (typeof TABS)[number]["id"]) => void }) {
  const stats = [
    { label: "Attendance", value: data.attendance.rate !== null ? `${data.attendance.rate}%` : "—", icon: CalendarCheck, tab: "academics" as const },
    { label: "Latest GPA", value: data.gpa ? data.gpa.gpa.toFixed(2) : "—", icon: Award, tab: "academics" as const },
    { label: "Fees due", value: taka(data.outstanding), icon: Wallet, tab: "fees" as const },
    { label: "Homework", value: String(data.homework.length), icon: BookOpen, tab: "school" as const },
  ];
  return (
    <div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {stats.map((s) => { const Icon = s.icon; return (
          <button key={s.label} onClick={() => go(s.tab)} className="text-left">
            <Card>
              <Icon className="h-5 w-5 text-[#0f766e]" />
              <div className="mt-2 text-[22px] font-semibold tabular-nums leading-none">{s.value}</div>
              <div className="mt-1 text-[13px] text-[#86868b]">{s.label}</div>
            </Card>
          </button>
        ); })}
      </div>

      <SectionTitle>Notice board</SectionTitle>
      <div className="space-y-2">
        {data.notices.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">No notices.</p></Card> :
          data.notices.slice(0, 4).map((n) => (
            <Card key={n.id}>
              <div className="flex items-center gap-2">{n.pinned && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">PINNED</span>}<span className="text-[15px] font-medium">{n.title}</span></div>
              <p className="mt-1 line-clamp-2 text-[13px] text-[#86868b]">{n.content}</p>
              <div className="mt-1 text-[11px] text-[#a1a1a6]">{fmtDate(n.createdAt)}</div>
            </Card>
          ))}
      </div>
    </div>
  );
}

function AcademicsTab({ data, token }: { data: Overview; token: string }) {
  return (
    <div>
      <SectionTitle>Attendance</SectionTitle>
      <Card>
        <div className="flex items-end justify-between">
          <div className="text-[34px] font-semibold tabular-nums leading-none">{data.attendance.rate !== null ? `${data.attendance.rate}%` : "—"}</div>
          <div className="text-right text-[13px] text-[#86868b]">
            <div>Present {data.attendance.summary.PRESENT ?? 0}</div>
            <div>Absent {data.attendance.summary.ABSENT ?? 0}</div>
            <div>Late {data.attendance.summary.LATE ?? 0}</div>
          </div>
        </div>
      </Card>

      <SectionTitle>Exam results</SectionTitle>
      {data.gpa && (
        <Card className="mb-2">
          <div className="flex items-center justify-between">
            <div><div className="text-[13px] text-[#86868b]">{data.gpa.exam ?? "Latest exam"}</div><div className="text-[24px] font-semibold tabular-nums">GPA {data.gpa.gpa.toFixed(2)}</div></div>
            <span className="rounded-full bg-[#0f766e]/10 px-3 py-1 text-[15px] font-semibold text-[#0f766e]">{data.gpa.grade}</span>
          </div>
        </Card>
      )}
      {data.results.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">No results yet.</p></Card> :
        <Card className="p-0">
          <div className="divide-y divide-black/[0.06] dark:divide-white/10">
            {data.results.slice(0, 15).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <div><div className="text-[14px] font-medium">{r.subject?.name ?? "—"}</div><div className="text-[11px] text-[#a1a1a6]">{r.exam?.name ?? ""}</div></div>
                <div className="text-right"><span className="tabular-nums text-[14px]">{r.marks}/{r.totalMarks}</span>{r.grade && <span className="ml-2 text-[12px] font-semibold text-[#0f766e]">{r.grade}</span>}</div>
              </div>
            ))}
          </div>
        </Card>}

      <div className="mt-5">
        <a href={`/api/portal/report-card?token=${encodeURIComponent(token)}`} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0f766e] py-3.5 text-[15px] font-medium text-white">
          <FileText className="h-4 w-4" /> Download report card
        </a>
      </div>
    </div>
  );
}

function SchoolTab({ data }: { data: Overview }) {
  const byDay = DAYS.map((d) => ({ day: d, slots: data.routine.filter((r) => r.day === d).sort((a, b) => a.startTime.localeCompare(b.startTime)) })).filter((x) => x.slots.length);
  return (
    <div>
      <SectionTitle>Class routine</SectionTitle>
      {byDay.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">No routine published.</p></Card> :
        <div className="space-y-3">
          {byDay.map((d) => (
            <Card key={d.day}>
              <div className="mb-2 text-[13px] font-semibold capitalize">{d.day.toLowerCase()}</div>
              <div className="space-y-1.5">
                {d.slots.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 text-[13px]">
                    <span className="w-24 shrink-0 tabular-nums text-[#86868b]">{s.startTime}–{s.endTime}</span>
                    <span className="flex-1 font-medium">{s.subject?.name ?? "—"}</span>
                    <span className="text-[11px] text-[#a1a1a6]">{s.room ?? ""}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>}

      <SectionTitle>Homework</SectionTitle>
      {data.homework.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">No homework assigned.</p></Card> :
        <div className="space-y-2">
          {data.homework.slice(0, 12).map((h) => (
            <Card key={h.id}>
              <div className="flex items-center justify-between"><span className="text-[15px] font-medium">{h.title}</span><span className="text-[11px] text-[#a1a1a6]">due {fmtDate(h.dueDate)}</span></div>
              <div className="text-[12px] text-[#0f766e]">{h.subject?.name ?? ""}</div>
              <p className="mt-1 text-[13px] text-[#86868b]">{h.details}</p>
            </Card>
          ))}
        </div>}

      <SectionTitle>Transport</SectionTitle>
      {data.transport.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">Not assigned to transport.</p></Card> :
        data.transport.map((t) => (
          <Card key={t.id}><div className="flex items-center gap-2 text-[14px]"><Bus className="h-4 w-4 text-[#0f766e]" /> {t.route?.name ?? "—"}{t.stop ? ` · ${t.stop.name}` : ""}</div></Card>
        ))}
    </div>
  );
}

function FeesTab({ data }: { data: Overview }) {
  const statusColor = (s: string) => s === "PAID" ? "text-[#0f766e]" : s === "OVERDUE" ? "text-red-600" : "text-amber-600";
  return (
    <div>
      <SectionTitle>Fee due</SectionTitle>
      <Card>
        <div className="text-[13px] text-[#86868b]">Total outstanding</div>
        <div className={`text-[32px] font-semibold tabular-nums ${data.outstanding > 0 ? "text-red-600" : "text-[#0f766e]"}`}>{taka(data.outstanding)}</div>
        {data.outstanding > 0 && <a href="/pay" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#0f766e] py-3 text-[15px] font-medium text-white">Pay now <ArrowRight className="h-4 w-4" /></a>}
      </Card>

      <SectionTitle>Invoices</SectionTitle>
      {data.invoices.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">No invoices.</p></Card> :
        <Card className="p-0"><div className="divide-y divide-black/[0.06] dark:divide-white/10">
          {data.invoices.map((i) => (
            <div key={i.id} className="flex items-center justify-between px-4 py-2.5">
              <div><div className="text-[14px] font-medium tabular-nums">{i.invoiceNo}</div><div className="text-[11px] text-[#a1a1a6]">due {fmtDate(i.dueDate)}</div></div>
              <div className="text-right"><div className="tabular-nums text-[14px]">{taka(i.total - i.paidTotal)}</div><div className={`text-[11px] font-semibold ${statusColor(i.status)}`}>{i.status}</div></div>
            </div>
          ))}
        </div></Card>}

      <SectionTitle>Payment history</SectionTitle>
      {data.payments.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">No payments yet.</p></Card> :
        <Card className="p-0"><div className="divide-y divide-black/[0.06] dark:divide-white/10">
          {data.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-[#86868b]" /><div><div className="text-[14px] font-medium tabular-nums">{taka(p.amount)}</div><div className="text-[11px] text-[#a1a1a6]">{p.method} · {fmtDate(p.createdAt)}</div></div></div>
              <a href={`/api/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-[#0f766e]">Receipt</a>
            </div>
          ))}
        </div></Card>}
    </div>
  );
}

function MoreTab({ data, token, onReload }: { data: Overview; token: string; onReload: () => void }) {
  const [view, setView] = React.useState<"menu" | "messages" | "leave">("menu");
  if (view === "messages") return <Messages data={data} token={token} back={() => setView("menu")} onSent={onReload} />;
  if (view === "leave") return <Leave data={data} token={token} back={() => setView("menu")} onSubmitted={onReload} />;
  return (
    <div>
      <SectionTitle>Communication</SectionTitle>
      <div className="space-y-2">
        <button onClick={() => setView("messages")} className="w-full text-left"><Card><div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-[#0f766e]" /><div className="flex-1"><div className="text-[15px] font-medium">Teacher messages</div><div className="text-[12px] text-[#86868b]">{data.messages.length} message{data.messages.length === 1 ? "" : "s"}</div></div><ArrowRight className="h-4 w-4 text-[#c7c7cc]" /></div></Card></button>
        <button onClick={() => setView("leave")} className="w-full text-left"><Card><div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-[#0f766e]" /><div className="flex-1"><div className="text-[15px] font-medium">Leave requests</div><div className="text-[12px] text-[#86868b]">{data.leaves.length} request{data.leaves.length === 1 ? "" : "s"}</div></div><ArrowRight className="h-4 w-4 text-[#c7c7cc]" /></div></Card></button>
      </div>
    </div>
  );
}

function Messages({ data, token, back, onSent }: { data: Overview; token: string; back: () => void; onSent: () => void }) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await api("/api/portal/messages", { method: "POST", token, body: JSON.stringify({ body: text.trim() }) }); setText(""); onSent(); }
    catch { /* ignore */ } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-[70dvh] flex-col">
      <button onClick={back} className="mb-2 mt-3 flex items-center gap-1 text-[15px] text-[#0f766e]"><ChevronLeft className="h-4 w-4" /> Back</button>
      <div className="flex-1 space-y-2">
        {data.messages.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">No messages yet. Start a conversation with the class teacher.</p></Card> :
          data.messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "PARENT" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] ${m.sender === "PARENT" ? "bg-[#0f766e] text-white" : "bg-white dark:bg-[#1c1c1e]"}`}>
                {m.sender !== "PARENT" && <div className="text-[11px] font-semibold text-[#86868b]">{m.teacher?.fullName ?? m.sender}</div>}
                <div>{m.body}</div>
              </div>
            </div>
          ))}
      </div>
      <div className="sticky bottom-20 mt-3 flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message the teacher…"
          className="flex-1 rounded-full border-0 bg-white px-4 py-3 text-[15px] outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-[#0f766e] dark:bg-[#1c1c1e]" />
        <button onClick={send} disabled={busy} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f766e] text-white disabled:opacity-60"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function Leave({ data, token, back, onSubmitted }: { data: Overview; token: string; back: () => void; onSubmitted: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const submit = async () => {
    setError(null);
    if (!from || !to || !reason.trim()) { setError("Fill in all fields."); return; }
    setBusy(true);
    try { await api("/api/portal/leave", { method: "POST", token, body: JSON.stringify({ fromDate: from, toDate: to, reason: reason.trim() }) }); setOpen(false); setFrom(""); setTo(""); setReason(""); onSubmitted(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const color = (s: string) => s === "APPROVED" ? "text-[#0f766e]" : s === "REJECTED" ? "text-red-600" : "text-amber-600";
  return (
    <div>
      <button onClick={back} className="mb-2 mt-3 flex items-center gap-1 text-[15px] text-[#0f766e]"><ChevronLeft className="h-4 w-4" /> Back</button>
      <button onClick={() => setOpen(true)} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f766e] py-3 text-[15px] font-medium text-white"><Plus className="h-4 w-4" /> New leave request</button>
      {open && (
        <Card className="mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[12px] text-[#86868b]">From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-lg bg-[#f5f5f7] px-3 py-2 text-[14px] outline-none dark:bg-[#2c2c2e]" /></div>
            <div><label className="text-[12px] text-[#86868b]">To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-lg bg-[#f5f5f7] px-3 py-2 text-[14px] outline-none dark:bg-[#2c2c2e]" /></div>
          </div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" rows={3} className="mt-2 w-full rounded-lg bg-[#f5f5f7] px-3 py-2 text-[14px] outline-none dark:bg-[#2c2c2e]" />
          {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-[#f5f5f7] py-2.5 text-[14px] font-medium dark:bg-[#2c2c2e]">Cancel</button>
            <button onClick={submit} disabled={busy} className="flex-1 rounded-lg bg-[#0f766e] py-2.5 text-[14px] font-medium text-white disabled:opacity-60">{busy ? "Submitting…" : "Submit"}</button>
          </div>
        </Card>
      )}
      {data.leaves.length === 0 ? <Card><p className="text-[14px] text-[#86868b]">No leave requests.</p></Card> :
        <div className="space-y-2">
          {data.leaves.map((l) => (
            <Card key={l.id}>
              <div className="flex items-center justify-between"><span className="text-[14px] font-medium">{fmtDate(l.fromDate)} – {fmtDate(l.toDate)}</span><span className={`text-[12px] font-semibold ${color(l.status)}`}>{l.status}</span></div>
              <p className="mt-1 text-[13px] text-[#86868b]">{l.reason}</p>
            </Card>
          ))}
        </div>}
    </div>
  );
}
