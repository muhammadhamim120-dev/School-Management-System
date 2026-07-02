import {
  LayoutDashboard, Users, GraduationCap, UserCog, BookOpen, Library,
  CalendarCheck, FileText, Award, CreditCard, Bell, CalendarDays, Settings,
  ClipboardList, Building2, Wallet, BookMarked, Bus, BedDouble, MessageSquare, ClipboardCheck, HeartHandshake, Activity,
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
  { label: "Board Registration", href: "/dashboard/board-registrations", icon: ClipboardList },
  { label: "Academic Setup", href: "/dashboard/academic", icon: Building2 },
  { label: "Finance", href: "/dashboard/finance", icon: Wallet },
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
      { label: "Board Registration", href: "/dashboard/board-registrations", icon: ClipboardList },
      { label: "Academic Setup", href: "/dashboard/academic", icon: Building2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Finance", href: "/dashboard/finance", icon: Wallet },
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
] as const;
