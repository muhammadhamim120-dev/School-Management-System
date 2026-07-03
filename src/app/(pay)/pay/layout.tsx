import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pay Fees — Greenwood International School",
  description: "Securely pay your school fees online with bKash, Nagad, Rocket, or card.",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased dark:bg-[#000000] dark:text-[#f5f5f7]">
      {children}
    </div>
  );
}
