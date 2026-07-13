import { LayoutDashboard, CalendarClock, NotebookPen, Award, BookMarked, Bell } from "lucide-react";
import type { NavItem } from "@/lib/nav";

export const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
  { label: "Timetable", href: "/portal/student/timetable", icon: CalendarClock },
  { label: "Homework", href: "/portal/student/homework", icon: NotebookPen },
  { label: "Results", href: "/portal/student/results", icon: Award },
  { label: "Library", href: "/portal/student/library", icon: BookMarked },
  { label: "Notices", href: "/portal/student/notices", icon: Bell },
];
