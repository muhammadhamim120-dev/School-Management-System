import { LayoutDashboard, Users, MessageCircle, CalendarDays } from "lucide-react";
import type { NavItem } from "@/lib/nav";

export const parentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
  { label: "My Children", href: "/parent/children", icon: Users },
  { label: "Messages", href: "/parent/messages", icon: MessageCircle },
  { label: "Leave Requests", href: "/parent/leave-requests", icon: CalendarDays },
];
