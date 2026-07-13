import {
  LayoutDashboard, Building2, CreditCard, BarChart3, Users,
  ToggleLeft, LifeBuoy, ClipboardList, HeartPulse, Settings,
} from "lucide-react";

export type SuperAdminNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

export type SuperAdminNavGroup = {
  label: string;
  items: SuperAdminNavItem[];
};

export const superAdminNavGroups: SuperAdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/super-admin", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { label: "Schools", href: "/super-admin/schools", icon: Building2 },
      { label: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard },
      { label: "Users", href: "/super-admin/users", icon: Users },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
      { label: "Feature Flags", href: "/super-admin/feature-flags", icon: ToggleLeft },
      { label: "System Health", href: "/super-admin/system-health", icon: HeartPulse },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Support Tickets", href: "/super-admin/support", icon: LifeBuoy },
      { label: "Audit Logs", href: "/super-admin/audit-logs", icon: ClipboardList },
      { label: "Global Settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];

export const superAdminNavItems: SuperAdminNavItem[] = superAdminNavGroups.flatMap(
  (g) => g.items,
);
