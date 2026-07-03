"use client";
import * as React from "react";
import { GraduationCap, ShieldCheck, ArrowRight, Loader2, ChevronLeft, CheckCircle2, Building2 } from "lucide-react";

type FeeItem = { description: string; amount: number; discount: number; category: string | null; type: string };
type Invoice = { id: string; invoiceNo: string; total: number; paidTotal: number; due: number; status: string; dueDate: string; period: string | null; items: FeeItem[] };
type LookupResult = {
  token: string;
  student: { name: string; studentId: string; class: string | null; section: string | null };
  invoices: Invoice[];
  outstanding: number;
};

const GATEWAYS = [
  { id: "BKASH", label: "bKash", tint: "#e2136e" },
  { id: "NAGAD", label: "Nagad", tint: "#ec1c24" },
  { id: "ROCKET", label: "Rocket", tint: "#8c3494" },
  { id: "SSLCOMMERZ", label: "Card / Bank", tint: "#0f766e" },
] as const;

const FEE_LABEL: Record<string, string> = {
  TUITION: "Tuition", ADMISSION: "Admission", EXAM: "Exam", TRANSPORT: "Transport",
  HOSTEL: "Hostel", LIBRARY: "Library", COACHING: "Coaching", OTHER: "Other",
};

const taka = (n: number) => `৳${(n ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Request failed");
  return json.data as T;
}

export default function PayPage() {
  const [step, setStep] = React.useState<"lookup" | "fees" | "checkout">("lookup");
  const [data, setData] = React.useState<LookupResult | null>(null);
  const [selected, setSelected] = React.useState<Invoice | null>(null);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-10 sm:py-16">
      {/* Brand */}
      <header className="mb-10 flex items-center justify-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f766e] text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="text-[17px] font-semibold tracking-tight">Greenwood School</span>
      </header>

      {step === "lookup" && (
        <LookupStep onFound={(d) => {
          setData(d);
          // If there's exactly one outstanding invoice, go straight to checkout.
          if (d.invoices.length === 1) { setSelected(d.invoices[0]); setStep("checkout"); }
          else { setStep("fees"); }
        }} />
      )}
      {step === "fees" && data && (
        <FeesStep
          data={data}
          onBack={() => setStep("lookup")}
          onPay={(inv) => { setSelected(inv); setStep("checkout"); }}
        />
      )}
      {step === "checkout" && data && selected && (
        <CheckoutStep data={data} invoice={selected} onBack={() => setStep("fees")} />
      )}

      <footer className="mt-auto pt-12 text-center text-[13px] text-[#86868b]">
        <p className="flex items-center justify-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Secured payment · Greenwood International School</p>
      </footer>
    </div>
  );
}

/* ------------------------------ Step 1: Lookup ------------------------------ */
function LookupStep({ onFound }: { onFound: (d: LookupResult) => void }) {
  const [studentId, setStudentId] = React.useState("");
  const [factor, setFactor] = React.useState("");
  const [mode, setMode] = React.useState<"phone" | "dob">("phone");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!studentId.trim() || !factor.trim()) { setError("Enter your student ID and verification."); return; }
    setLoading(true);
    try {
      const body = mode === "phone" ? { studentId: studentId.trim(), phone: factor.trim() } : { studentId: studentId.trim(), dob: factor.trim() };
      const d = await post<LookupResult>("/api/public/pay/lookup", body);
      onFound(d);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <div className="mb-8 text-center">
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[40px]">Pay school fees</h1>
        <p className="mt-2 text-[17px] text-[#86868b]">Look up your outstanding balance to get started.</p>
      </div>

      <div className="rounded-[22px] bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] dark:bg-[#1c1c1e] dark:ring-white/10 sm:p-8">
        <label className="block text-[13px] font-medium text-[#86868b]">Student ID</label>
        <input
          value={studentId} onChange={(e) => setStudentId(e.target.value)}
          placeholder="e.g. STU-3001"
          className="mt-1.5 w-full rounded-xl border-0 bg-[#f5f5f7] px-4 py-3.5 text-[17px] outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-[#0f766e] dark:bg-[#2c2c2e]"
        />

        <div className="mt-5 flex rounded-xl bg-[#f5f5f7] p-1 dark:bg-[#2c2c2e]">
          {(["phone", "dob"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setFactor(""); }}
              className={`flex-1 rounded-lg py-2 text-[14px] font-medium transition ${mode === m ? "bg-white text-[#1d1d1f] shadow-sm dark:bg-[#3a3a3c] dark:text-white" : "text-[#86868b]"}`}>
              {m === "phone" ? "Phone number" : "Date of birth"}
            </button>
          ))}
        </div>
        <input
          value={factor} onChange={(e) => setFactor(e.target.value)}
          type={mode === "dob" ? "date" : "tel"}
          placeholder={mode === "phone" ? "Registered phone (last 6 digits ok)" : ""}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="mt-3 w-full rounded-xl border-0 bg-[#f5f5f7] px-4 py-3.5 text-[17px] outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-[#0f766e] dark:bg-[#2c2c2e]"
        />

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-600 dark:bg-red-950/40">{error}</p>}

        <button onClick={submit} disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f766e] py-3.5 text-[17px] font-medium text-white transition hover:bg-[#0b5d56] disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
      <p className="mt-4 text-center text-[13px] text-[#86868b]">Your information is verified before any fees are shown.</p>
      <p className="mt-2 text-center text-[12px] text-[#a1a1a6]">Demo: Student ID <span className="font-mono">STU-3001</span> · phone <span className="font-mono">01700000000</span></p>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

/* ------------------------------ Step 2: Fees ------------------------------ */
function FeesStep({ data, onBack, onPay }: { data: LookupResult; onBack: () => void; onPay: (inv: Invoice) => void }) {
  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-[15px] text-[#0f766e]"><ChevronLeft className="h-4 w-4" /> Back</button>

      <div className="rounded-[22px] bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] dark:bg-[#1c1c1e] dark:ring-white/10 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f766e]/10 text-[#0f766e] font-semibold">
            {data.student.name.charAt(0)}
          </div>
          <div>
            <div className="text-[17px] font-semibold">{data.student.name}</div>
            <div className="text-[14px] text-[#86868b]">{data.student.studentId}{data.student.class ? ` · ${data.student.class}` : ""}{data.student.section ? ` (${data.student.section})` : ""}</div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#f5f5f7] px-5 py-4 dark:bg-[#2c2c2e]">
          <div className="text-[13px] text-[#86868b]">Total outstanding</div>
          <div className="text-[34px] font-semibold tracking-tight">{taka(data.outstanding)}</div>
        </div>
      </div>

      {data.invoices.length === 0 ? (
        <div className="mt-6 rounded-[22px] bg-white p-10 text-center shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] dark:bg-[#1c1c1e] dark:ring-white/10">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#0f766e]" />
          <p className="mt-3 text-[17px] font-medium">You&apos;re all paid up</p>
          <p className="mt-1 text-[14px] text-[#86868b]">There are no outstanding fees on this account.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="px-1 text-[13px] font-medium uppercase tracking-wide text-[#86868b]">Outstanding invoices</div>
          {data.invoices.map((inv) => (
            <div key={inv.id} className="rounded-[20px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] dark:bg-[#1c1c1e] dark:ring-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[15px] font-semibold tabular-nums">{inv.invoiceNo}</div>
                  <div className="mt-0.5 text-[13px] text-[#86868b]">Due {new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{inv.period ? ` · ${inv.period}` : ""}</div>
                </div>
                <div className="text-right">
                  <div className="text-[19px] font-semibold tabular-nums">{taka(inv.due)}</div>
                  {inv.paidTotal > 0 && <div className="text-[12px] text-[#86868b]">{taka(inv.paidTotal)} paid</div>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Array.from(new Set(inv.items.map((it) => it.type))).map((t) => (
                  <span key={t} className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[12px] font-medium text-[#515154] dark:bg-[#2c2c2e] dark:text-[#a1a1a6]">{FEE_LABEL[t] ?? t}</span>
                ))}
              </div>
              <button onClick={() => onPay(inv)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f766e] py-3 text-[15px] font-medium text-white transition hover:bg-[#0b5d56]">
                Pay now <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

/* ------------------------------ Step 3: Checkout ------------------------------ */
function CheckoutStep({ data, invoice, onBack }: { data: LookupResult; invoice: Invoice; onBack: () => void }) {
  const [amount, setAmount] = React.useState(String(invoice.due));
  const [payMode, setPayMode] = React.useState<"full" | "partial">("full");
  const [gateway, setGateway] = React.useState<string>("BKASH");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const amt = Number(amount) || 0;
  const valid = amt > 0 && amt <= invoice.due;

  const pay = async () => {
    setError(null);
    if (!valid) { setError(`Enter an amount between ৳1 and ${taka(invoice.due)}.`); return; }
    setLoading(true);
    try {
      const res = await post<{ redirectUrl: string }>("/api/public/pay/initiate", {
        token: data.token, invoiceId: invoice.id, gateway, amount: amt,
      });
      window.location.href = res.redirectUrl;
    } catch (e) { setError((e as Error).message); setLoading(false); }
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-[15px] text-[#0f766e]"><ChevronLeft className="h-4 w-4" /> Back</button>

      <div className="rounded-[22px] bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] dark:bg-[#1c1c1e] dark:ring-white/10 sm:p-8">
        <div className="text-[13px] uppercase tracking-wide text-[#86868b]">Paying invoice</div>
        <div className="mt-0.5 text-[17px] font-semibold tabular-nums">{invoice.invoiceNo}</div>

        {/* itemized */}
        <div className="mt-5 space-y-2 border-y border-black/[0.06] py-4 dark:border-white/10">
          {invoice.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between text-[14px]">
              <span className="text-[#515154] dark:text-[#a1a1a6]">{it.description}</span>
              <span className="tabular-nums">{taka(it.amount - it.discount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 text-[15px] font-semibold">
            <span>Outstanding</span><span className="tabular-nums">{taka(invoice.due)}</span>
          </div>
        </div>

        {/* amount */}
        <div className="mt-5 flex rounded-xl bg-[#f5f5f7] p-1 dark:bg-[#2c2c2e]">
          {(["full", "partial"] as const).map((m) => (
            <button key={m} onClick={() => { setPayMode(m); if (m === "full") setAmount(String(invoice.due)); }}
              className={`flex-1 rounded-lg py-2 text-[14px] font-medium transition ${payMode === m ? "bg-white text-[#1d1d1f] shadow-sm dark:bg-[#3a3a3c] dark:text-white" : "text-[#86868b]"}`}>
              {m === "full" ? "Pay in full" : "Partial amount"}
            </button>
          ))}
        </div>
        {payMode === "partial" && (
          <div className="mt-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-[#86868b]">৳</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal"
                className="w-full rounded-xl border-0 bg-[#f5f5f7] py-3.5 pl-9 pr-4 text-[17px] tabular-nums outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-[#0f766e] dark:bg-[#2c2c2e]" />
            </div>
          </div>
        )}

        {/* gateways */}
        <div className="mt-6 text-[13px] font-medium text-[#86868b]">Payment method</div>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {GATEWAYS.map((g) => (
            <button key={g.id} onClick={() => setGateway(g.id)}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-left ring-1 transition ${gateway === g.id ? "ring-2 ring-[#0f766e] bg-[#0f766e]/[0.04]" : "ring-black/[0.08] hover:ring-black/20 dark:ring-white/10"}`}>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: g.tint }} />
              <span className="text-[15px] font-medium">{g.label}</span>
              {gateway === g.id && <CheckCircle2 className="ml-auto h-4 w-4 text-[#0f766e]" />}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-600 dark:bg-red-950/40">{error}</p>}

        <button onClick={pay} disabled={loading || !valid}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f766e] py-4 text-[17px] font-medium text-white transition hover:bg-[#0b5d56] disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Pay {taka(amt)} <ArrowRight className="h-4 w-4" /></>}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[#86868b]">
          <Building2 className="h-3.5 w-3.5" /> You&apos;ll be redirected to {GATEWAYS.find((g) => g.id === gateway)?.label} to complete payment.
        </p>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
