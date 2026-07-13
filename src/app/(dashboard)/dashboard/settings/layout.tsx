"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Palette, CreditCard } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "general", label: "General", href: "/dashboard/settings", icon: Settings },
  { value: "branding", label: "Branding", href: "/dashboard/settings/branding", icon: Palette },
  { value: "subscription", label: "Subscription", href: "/dashboard/settings/subscription", icon: CreditCard },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = TABS.find((tab) =>
    tab.value === "general" ? pathname === tab.href : pathname.startsWith(tab.href)
  )?.value ?? "general";

  return (
    <div>
      <Tabs value={activeTab}>
        <TabsList className="mb-6">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={tab.href} className="flex items-center gap-1.5">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
