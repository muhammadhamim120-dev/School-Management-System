import { LayoutDashboard, CalendarClock, NotebookPen, Award, BookMarked, Bell } from "lucide-react";
import type { NavItem } from "@/lib/nav";

export const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Timetable", href: "/student/timetable", icon: CalendarClock },
  { label: "Homework", href: "/student/homework", icon: NotebookPen },
  { label: "Results", href: "/student/results", icon: Award },
  { label: "Library", href: "/student/library", icon: BookMarked },
  { label: "Notices", href: "/student/notices", icon: Bell },
];
