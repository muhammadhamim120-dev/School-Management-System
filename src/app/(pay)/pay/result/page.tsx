"use client";
import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, GraduationCap, Download, ArrowLeft } from "lucide-react";

function ResultInner() {
  const sp = useSearchParams();
  const status = sp.get("status") ?? "failed";
  const ref = sp.get("ref");

  const config = {
    success: { icon: CheckCircle2, color: "#0f766e", bg: "#0f766e", title: "Payment successful", body: "Your payment has been received. A receipt and confirmation have been sent to your registered phone and email." },
    pending: { icon: Clock, color: "#b45309", bg: "#b45309", title: "Payment pending", body: "Your payment is being processed. We'll confirm by SMS and email once it settles. You can safely close this page." },
    failed: { icon: XCircle, color: "#dc2626", bg: "#dc2626", title: "Payment not completed", body: "Your payment didn't go through and you have not been charged. You can try again." },
  }[status] ?? { icon: XCircle, color: "#dc2626", bg: "#dc2626", title: "Something went wrong", body: "Please try again." };

  const Icon = config.icon;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f766e] text-white"><GraduationCap className="h-5 w-5" /></div>
        <span className="text-[17px] font-semibold tracking-tight">Greenwood School</span>
      </div>

      <div className="w-full rounded-[24px] bg-white p-8 shadow-[0_2px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:bg-[#1c1c1e] dark:ring-white/10 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${config.bg}14` }}>
          <Icon className="h-9 w-9" style={{ color: config.color }} />
        </div>
        <h1 className="mt-6 text-[26px] font-semibold tracking-tight">{config.title}</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-[#86868b]">{config.body}</p>
        {ref && <p className="mt-4 rounded-xl bg-[#f5f5f7] px-4 py-2.5 text-[13px] tabular-nums text-[#515154] dark:bg-[#2c2c2e] dark:text-[#a1a1a6]">Reference: {ref}</p>}

        <div className="mt-8 space-y-3">
          <Link href="/pay" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f766e] py-3.5 text-[16px] font-medium text-white transition hover:bg-[#0b5d56]">
            <ArrowLeft className="h-4 w-4" /> Back to fees
          </Link>
        </div>
      </div>

      <p className="mt-6 text-[13px] text-[#86868b]">Greenwood International School · Secured payment</p>
    </div>
  );
}

export default function PayResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[#86868b]">Loading…</div>}>
      <ResultInner />
    </Suspense>
  );
}
