import type {
  Student, Teacher, Parent, Class, Section, Subject,
  Attendance, Exam, Result, Fee, Notice, Event, Status,
} from "@prisma/client";

export type { Student, Teacher, Parent, Class, Section, Subject, Attendance, Exam, Result, Fee, Notice, Event, Status };

export type StudentWithRelations = Student & {
  class?: Class | null;
  section?: Section | null;
  parent?: Parent | null;
};

export type SubjectWithRelations = Subject & {
  class?: Class | null;
  teacher?: Teacher | null;
};

export type ParentWithStudents = Parent & { students: Student[] };

export type ResultWithRelations = Result & {
  student?: Student;
  exam?: Exam;
  subject?: Subject;
};

export type FeeWithStudent = Fee & { student?: Student };

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type DashboardStats = {
  students: number;
  teachers: number;
  parents: number;
  classes: number;
  revenue: number;
  attendanceRate: number;
};
