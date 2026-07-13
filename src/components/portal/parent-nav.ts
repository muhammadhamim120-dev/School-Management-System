import { LayoutDashboard, Users, MessageCircle, CalendarDays } from "lucide-react";
import type { NavItem } from "@/lib/nav";

export const parentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard },
  { label: "My Children", href: "/portal/parent/children", icon: Users },
  { label: "Messages", href: "/portal/parent/messages", icon: MessageCircle },
  { label: "Leave Requests", href: "/portal/parent/leave-requests", icon: CalendarDays },
];
