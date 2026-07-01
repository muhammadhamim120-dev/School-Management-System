import { z } from "zod";

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
const statusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);

const optionalString = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

// ---------- Student ----------
export const studentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  fullName: z.string().min(2, "Full name is required"),
  photo: optionalString,
  gender: genderEnum,
  dateOfBirth: z.coerce.date({ message: "Valid date of birth required" }),
  bloodGroup: optionalString,
  phone: optionalString,
  email: z.string().email("Invalid email").optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  address: optionalString,
  classId: optionalString,
  sectionId: optionalString,
  rollNumber: optionalString,
  admissionDate: z.coerce.date().optional(),
  guardianName: optionalString,
  parentId: optionalString,
  emergencyContact: optionalString,
  status: statusEnum.default("ACTIVE"),
});
export type StudentInput = z.infer<typeof studentSchema>;

// ---------- Teacher ----------
export const teacherSchema = z.object({
  teacherId: z.string().min(1, "Teacher ID is required"),
  fullName: z.string().min(2, "Full name is required"),
  photo: optionalString,
  department: optionalString,
  subject: optionalString,
  qualification: optionalString,
  experience: z.coerce.number().int().min(0).optional(),
  phone: optionalString,
  email: z.string().email("Invalid email").optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  address: optionalString,
  joiningDate: z.coerce.date().optional(),
  salary: z.coerce.number().min(0).optional(),
  status: statusEnum.default("ACTIVE"),
});
export type TeacherInput = z.infer<typeof teacherSchema>;

// ---------- Parent ----------
export const parentSchema = z.object({
  parentId: z.string().min(1, "Parent ID is required"),
  fullName: z.string().min(2, "Full name is required"),
  photo: optionalString,
  phone: optionalString,
  email: z.string().email("Invalid email").optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  address: optionalString,
  occupation: optionalString,
  emergencyContact: optionalString,
  studentIds: z.array(z.string()).optional(),
});
export type ParentInput = z.infer<typeof parentSchema>;

// ---------- Class / Section / Subject ----------
export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  capacity: z.coerce.number().int().min(1).default(40),
});
export type ClassInput = z.infer<typeof classSchema>;

export const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  classId: z.string().min(1, "Class is required"),
});
export type SectionInput = z.infer<typeof sectionSchema>;

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Code is required"),
  classId: optionalString,
  teacherId: optionalString,
});
export type SubjectInput = z.infer<typeof subjectSchema>;

// ---------- Attendance ----------
export const attendanceSchema = z.object({
  studentId: z.string().min(1),
  date: z.coerce.date(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).default("PRESENT"),
  remark: optionalString,
});
export type AttendanceInput = z.infer<typeof attendanceSchema>;

// ---------- Exam / Result ----------
export const examSchema = z.object({
  name: z.string().min(1, "Exam name required"),
  classId: optionalString,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type ExamInput = z.infer<typeof examSchema>;

export const resultSchema = z.object({
  studentId: z.string().min(1),
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  marks: z.coerce.number().min(0),
  totalMarks: z.coerce.number().min(1).default(100),
});
export type ResultInput = z.infer<typeof resultSchema>;

// ---------- Fee ----------
export const feeSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().min(1, "Title required"),
  amount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0).default(0),
  dueDate: z.coerce.date(),
  status: z.enum(["PAID", "UNPAID", "PARTIAL", "OVERDUE"]).default("UNPAID"),
});
export type FeeInput = z.infer<typeof feeSchema>;

// ---------- Notice / Event ----------
export const noticeSchema = z.object({
  title: z.string().min(1, "Title required"),
  content: z.string().min(1, "Content required"),
  audience: z.string().default("ALL"),
  pinned: z.coerce.boolean().default(false),
});
export type NoticeInput = z.infer<typeof noticeSchema>;

export const eventSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: optionalString,
  location: optionalString,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).default("UPCOMING"),
});
export type EventInput = z.infer<typeof eventSchema>;

// ---------- Auth ----------
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export const forgotSchema = z.object({ email: z.string().email("Invalid email") });
export const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
