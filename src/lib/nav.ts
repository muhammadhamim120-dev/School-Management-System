import {
  LayoutDashboard, Users, GraduationCap, UserCog, BookOpen, Library,
  CalendarCheck, FileText, Award, CreditCard, Bell, CalendarDays, CalendarClock, Settings,
  ClipboardList, Building2, Wallet, BookMarked, Bus, BedDouble, MessageSquare, ClipboardCheck, HeartHandshake, Activity,
  NotebookPen, MonitorPlay,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/students", icon: Users },
  { label: "Teachers", href: "/dashboard/teachers", icon: GraduationCap },
  { label: "Parents", href: "/dashboard/parents", icon: UserCog },
  { label: "Classes", href: "/dashboard/classes", icon: Library },
  { label: "Subjects", href: "/dashboard/subjects", icon: BookOpen },
  { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
  { label: "Timetable", href: "/dashboard/timetable", icon: CalendarClock },
  { label: "Coaching", href: "/dashboard/coaching", icon: Users },
  { label: "Homework", href: "/dashboard/homework", icon: NotebookPen },
  { label: "Examinations", href: "/dashboard/exams", icon: FileText },
  { label: "Online Exam", href: "/dashboard/online-exams", icon: MonitorPlay },
  { label: "Results", href: "/dashboard/results", icon: Award },
  { label: "Board Registration", href: "/dashboard/board-registrations", icon: ClipboardList },
  { label: "Academic Setup", href: "/dashboard/academic", icon: Building2 },
  { label: "Finance", href: "/dashboard/finance", icon: Wallet },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Library", href: "/dashboard/library", icon: BookMarked },
  { label: "Transport", href: "/dashboard/transport", icon: Bus },
  { label: "Hostel", href: "/dashboard/hostel", icon: BedDouble },
  { label: "SMS", href: "/dashboard/sms", icon: MessageSquare },
  { label: "Admissions", href: "/dashboard/admissions", icon: ClipboardCheck },
  { label: "Parent Portal", href: "/dashboard/parent-portal", icon: HeartHandshake },
  { label: "Dropout Risk", href: "/dashboard/risk", icon: Activity },
  { label: "Fees", href: "/dashboard/fees", icon: CreditCard },
  { label: "Notices", href: "/dashboard/notices", icon: Bell },
  { label: "Events", href: "/dashboard/events", icon: CalendarDays },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

/** Grouped navigation for the sidebar (presentational grouping of the same routes). */
export const navGroups: NavGroup[] = [
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
      { label: "Timetable", href: "/dashboard/timetable", icon: CalendarClock },
      { label: "Coaching", href: "/dashboard/coaching", icon: Users },
      { label: "Homework", href: "/dashboard/homework", icon: NotebookPen },
      { label: "Examinations", href: "/dashboard/exams", icon: FileText },
      { label: "Online Exam", href: "/dashboard/online-exams", icon: MonitorPlay },
      { label: "Results", href: "/dashboard/results", icon: Award },
      { label: "Board Registration", href: "/dashboard/board-registrations", icon: ClipboardList },
      { label: "Academic Setup", href: "/dashboard/academic", icon: Building2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Finance", href: "/dashboard/finance", icon: Wallet },
      { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
      { label: "Library", href: "/dashboard/library", icon: BookMarked },
      { label: "Transport", href: "/dashboard/transport", icon: Bus },
      { label: "Hostel", href: "/dashboard/hostel", icon: BedDouble },
      { label: "SMS", href: "/dashboard/sms", icon: MessageSquare },
      { label: "Fees", href: "/dashboard/fees", icon: CreditCard },
      { label: "Notices", href: "/dashboard/notices", icon: Bell },
      { label: "Events", href: "/dashboard/events", icon: CalendarDays },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
  {
    label: "Engagement & Insights",
    items: [
      { label: "Admissions", href: "/dashboard/admissions", icon: ClipboardCheck },
      { label: "Parent Portal", href: "/dashboard/parent-portal", icon: HeartHandshake },
      { label: "Dropout Risk", href: "/dashboard/risk", icon: Activity },
    ],
  },
];

const TEACHER_GROUPS = ["Overview", "People", "Academics", "Engagement & Insights"] as const;
const ACCOUNTANT_GROUPS = ["Overview", "Finance", "Operations"] as const;
const ALL_ADMIN_GROUPS = ["Overview", "People", "Academics", "Operations", "Engagement & Insights"] as const;

/**
 * Filter dashboard nav groups by role.
 * PARENT / STUDENT use the portal nav, not the dashboard sidebar.
 */
export function getNavGroupsForRole(role: string | undefined): NavGroup[] {
  switch (role) {
    case "TEACHER":
      return navGroups.filter((g) => (TEACHER_GROUPS as readonly string[]).includes(g.label));
    case "ACCOUNTANT": {
      const acctGroups = ["Overview", "Finance", "Operations"] as const;
      return navGroups.filter((g) => (acctGroups as readonly string[]).includes(g.label));
    }
    case "SCHOOL_ADMIN":
    case "ADMIN":
      return navGroups.filter((g) => (ALL_ADMIN_GROUPS as readonly string[]).includes(g.label));
    case "SUPER_ADMIN":
      return navGroups;
    default:
      return navGroups;
  }
}
