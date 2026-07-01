import {
  LayoutDashboard, Users, GraduationCap, UserCog, BookOpen, Library,
  CalendarCheck, FileText, Award, CreditCard, Bell, CalendarDays, Settings,
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/students", icon: Users },
  { label: "Teachers", href: "/dashboard/teachers", icon: GraduationCap },
  { label: "Parents", href: "/dashboard/parents", icon: UserCog },
  { label: "Classes", href: "/dashboard/classes", icon: Library },
  { label: "Subjects", href: "/dashboard/subjects", icon: BookOpen },
  { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
  { label: "Examinations", href: "/dashboard/exams", icon: FileText },
  { label: "Results", href: "/dashboard/results", icon: Award },
  { label: "Fees", href: "/dashboard/fees", icon: CreditCard },
  { label: "Notices", href: "/dashboard/notices", icon: Bell },
  { label: "Events", href: "/dashboard/events", icon: CalendarDays },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

/** Grouped navigation for the sidebar (presentational grouping of the same routes). */
export const navGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { label: "Students", href: "/dashboard/students", icon: Users },
      { label: "Teachers", href: "/dashboard/teachers", icon: GraduationCap },
      { label: "Parents", href: "/dashboard/parents", icon: UserCog },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Classes", href: "/dashboard/classes", icon: Library },
      { label: "Subjects", href: "/dashboard/subjects", icon: BookOpen },
      { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
      { label: "Examinations", href: "/dashboard/exams", icon: FileText },
      { label: "Results", href: "/dashboard/results", icon: Award },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Fees", href: "/dashboard/fees", icon: CreditCard },
      { label: "Notices", href: "/dashboard/notices", icon: Bell },
      { label: "Events", href: "/dashboard/events", icon: CalendarDays },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
] as const;
