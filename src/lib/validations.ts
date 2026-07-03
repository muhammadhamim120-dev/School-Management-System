import { z } from "zod";

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
const statusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
const mediumEnum = z.enum(["BANGLA", "ENGLISH", "MADRASA"]);
const madrasaLevelEnum = z.enum(["EBTEDAYEE", "DAKHIL", "ALIM"]);
const shiftEnum = z.enum(["MORNING", "DAY", "EVENING"]);
const boardExamEnum = z.enum(["PEC", "JSC", "SSC", "HSC"]);
const boardRegStatusEnum = z.enum(["PENDING", "REGISTERED", "APPROVED", "REJECTED"]);

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
  medium: mediumEnum.optional(),
  madrasaLevel: madrasaLevelEnum.optional(),
  shift: shiftEnum.optional(),
  campusId: optionalString,
  sessionId: optionalString,
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
  campusId: optionalString,
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
  medium: mediumEnum.optional(),
  shift: shiftEnum.optional(),
  campusId: optionalString,
  sessionId: optionalString,
});
export type ClassInput = z.infer<typeof classSchema>;

// ---------- Academic structure ----------
export const campusSchema = z.object({
  name: z.string().min(1, "Campus name is required"),
  code: z.string().min(1, "Campus code is required"),
  address: optionalString,
  phone: optionalString,
  isMain: z.coerce.boolean().optional().default(false),
});
export type CampusInput = z.infer<typeof campusSchema>;

export const sessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  startDate: z.coerce.date({ message: "Valid start date required" }),
  endDate: z.coerce.date({ message: "Valid end date required" }),
  isCurrent: z.coerce.boolean().optional().default(false),
});
export type SessionInput = z.infer<typeof sessionSchema>;

export const termSchema = z.object({
  name: z.string().min(1, "Term name is required"),
  sessionId: z.string().min(1, "Session is required"),
  startDate: z.coerce.date({ message: "Valid start date required" }),
  endDate: z.coerce.date({ message: "Valid end date required" }),
});
export type TermInput = z.infer<typeof termSchema>;

export const boardRegistrationSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  boardExam: boardExamEnum,
  regNumber: optionalString,
  rollNumber: optionalString,
  examYear: z.coerce.number().int().min(2000).max(2100),
  boardName: optionalString,
  status: boardRegStatusEnum.optional().default("PENDING"),
});
export type BoardRegistrationInput = z.infer<typeof boardRegistrationSchema>;

// ---------- Finance ----------
const feeTypeEnum = z.enum(["TUITION", "ADMISSION", "EXAM", "TRANSPORT", "HOSTEL", "COACHING", "LIBRARY", "OTHER"]);
const feeRecurrenceEnum = z.enum(["ONE_TIME", "MONTHLY", "TERM", "ANNUAL"]);
const invoiceStatusEnum = z.enum(["DRAFT", "ISSUED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]);
const paymentMethodEnum = z.enum(["CASH", "BANK", "BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ", "CARD", "CHEQUE", "OTHER"]);
const paymentStatusEnum = z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]);
const paymentGatewayEnum = z.enum(["BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ"]);
const concessionTypeEnum = z.enum(["DISCOUNT", "SCHOLARSHIP", "WAIVER"]);
const concessionModeEnum = z.enum(["PERCENTAGE", "FIXED"]);

export const feeCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: feeTypeEnum,
  recurrence: feeRecurrenceEnum.default("ONE_TIME"),
  description: optionalString,
  isActive: z.coerce.boolean().optional().default(true),
});
export type FeeCategoryInput = z.infer<typeof feeCategorySchema>;

export const feeStructureSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  classId: optionalString,
  sessionId: optionalString,
  label: optionalString,
  isActive: z.coerce.boolean().optional().default(true),
});
export type FeeStructureInput = z.infer<typeof feeStructureSchema>;

const invoiceItemSchema = z.object({
  categoryId: optionalString,
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional().default(0),
});

export const invoiceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  dueDate: z.coerce.date({ message: "Valid due date required" }),
  period: optionalString,
  notes: optionalString,
  status: invoiceStatusEnum.optional().default("ISSUED"),
  items: z.array(invoiceItemSchema).min(1, "At least one line item is required"),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  method: paymentMethodEnum.default("CASH"),
  status: paymentStatusEnum.optional().default("SUCCESS"),
  gateway: paymentGatewayEnum.optional(),
  gatewayRef: optionalString,
  note: optionalString,
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const concessionSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  type: concessionTypeEnum,
  mode: concessionModeEnum.default("PERCENTAGE"),
  value: z.coerce.number().min(0),
  reason: optionalString,
  isActive: z.coerce.boolean().optional().default(true),
});
export type ConcessionInput = z.infer<typeof concessionSchema>;

// ---------- Library ----------
const copyStatusEnum = z.enum(["AVAILABLE", "ISSUED", "LOST", "DAMAGED", "RESERVED"]);
const loanStatusEnum = z.enum(["ISSUED", "RETURNED", "OVERDUE", "LOST", "DAMAGED"]);
const borrowerTypeEnum = z.enum(["STUDENT", "TEACHER"]);

export const bookCategorySchema = z.object({ name: z.string().min(1, "Name is required") });
export type BookCategoryInput = z.infer<typeof bookCategorySchema>;

export const authorSchema = z.object({ name: z.string().min(1, "Name is required"), bio: optionalString });
export type AuthorInput = z.infer<typeof authorSchema>;

export const publisherSchema = z.object({ name: z.string().min(1, "Name is required") });
export type PublisherInput = z.infer<typeof publisherSchema>;

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  isbn: optionalString,
  categoryId: optionalString,
  authorId: optionalString,
  publisherId: optionalString,
  edition: optionalString,
  publishYear: z.coerce.number().int().min(0).max(2100).optional(),
  language: optionalString,
  shelf: optionalString,
  rack: optionalString,
  description: optionalString,
  coverUrl: optionalString,
  // When creating, how many physical copies to auto-generate.
  copyCount: z.coerce.number().int().min(0).max(100).optional().default(1),
});
export type BookInput = z.infer<typeof bookSchema>;

export const bookCopySchema = z.object({
  bookId: z.string().min(1, "Book is required"),
  copyCode: z.string().min(1, "Copy code is required"),
  status: copyStatusEnum.optional().default("AVAILABLE"),
});
export type BookCopyInput = z.infer<typeof bookCopySchema>;

export const issueLoanSchema = z.object({
  copyId: z.string().min(1, "Book copy is required"),
  borrowerType: borrowerTypeEnum,
  studentId: optionalString,
  teacherId: optionalString,
  dueDate: z.coerce.date({ message: "Valid due date required" }),
  note: optionalString,
}).refine((d) => (d.borrowerType === "STUDENT" ? !!d.studentId : !!d.teacherId), {
  message: "Borrower is required",
  path: ["studentId"],
});
export type IssueLoanInput = z.infer<typeof issueLoanSchema>;

export const returnLoanSchema = z.object({
  fineAmount: z.coerce.number().min(0).optional().default(0),
  finePaid: z.coerce.boolean().optional().default(false),
  status: loanStatusEnum.optional().default("RETURNED"),
  note: optionalString,
});
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>;

// ---------- Transport ----------
const vehicleTypeEnum = z.enum(["BUS", "MINIBUS", "VAN", "CAR"]);
const vehicleStatusEnum = z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]);
const transportAssignmentStatusEnum = z.enum(["ACTIVE", "CANCELLED"]);

export const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: optionalString,
  licenseNo: optionalString,
  address: optionalString,
});
export type DriverInput = z.infer<typeof driverSchema>;

export const vehicleSchema = z.object({
  regNumber: z.string().min(1, "Registration number is required"),
  type: vehicleTypeEnum.default("BUS"),
  capacity: z.coerce.number().int().min(1).default(30),
  model: optionalString,
  status: vehicleStatusEnum.default("ACTIVE"),
  driverId: optionalString,
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

const routeStopSchema = z.object({
  name: z.string().min(1, "Stop name is required"),
  sequence: z.coerce.number().int().min(0).optional().default(0),
  pickupTime: optionalString,
});

export const transportRouteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  fare: z.coerce.number().min(0).default(0),
  vehicleId: optionalString,
  stops: z.array(routeStopSchema).optional().default([]),
});
export type TransportRouteInput = z.infer<typeof transportRouteSchema>;

export const studentTransportSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  routeId: z.string().min(1, "Route is required"),
  stopId: optionalString,
  status: transportAssignmentStatusEnum.optional().default("ACTIVE"),
});
export type StudentTransportInput = z.infer<typeof studentTransportSchema>;

// ---------- Hostel ----------
const genderEnumH = z.enum(["MALE", "FEMALE", "OTHER"]);
const roomStatusEnum = z.enum(["AVAILABLE", "FULL", "MAINTENANCE"]);
const allocationStatusEnum = z.enum(["ACTIVE", "VACATED"]);

export const hostelBuildingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: genderEnumH.optional(),
  warden: optionalString,
  address: optionalString,
});
export type HostelBuildingInput = z.infer<typeof hostelBuildingSchema>;

export const hostelRoomSchema = z.object({
  buildingId: z.string().min(1, "Building is required"),
  roomNo: z.string().min(1, "Room number is required"),
  capacity: z.coerce.number().int().min(1).default(4),
  monthlyFee: z.coerce.number().min(0).default(0),
  status: roomStatusEnum.optional().default("AVAILABLE"),
});
export type HostelRoomInput = z.infer<typeof hostelRoomSchema>;

export const hostelAllocationSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  studentId: z.string().min(1, "Student is required"),
  status: allocationStatusEnum.optional().default("ACTIVE"),
});
export type HostelAllocationInput = z.infer<typeof hostelAllocationSchema>;

// ---------- SMS ----------
const smsAudienceEnum = z.enum(["ALL", "STUDENTS", "PARENTS", "TEACHERS", "CUSTOM"]);
const smsCategoryEnum = z.enum(["GENERAL", "ATTENDANCE", "FEE_REMINDER", "RESULT", "HOLIDAY", "EMERGENCY", "ADMISSION", "OTP"]);

export const smsTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: smsCategoryEnum.default("GENERAL"),
  body: z.string().min(1, "Body is required"),
});
export type SmsTemplateInput = z.infer<typeof smsTemplateSchema>;

const smsRecipientSchema = z.object({
  name: optionalString,
  phone: z.string().min(3, "Phone is required"),
});

export const smsMessageSchema = z.object({
  title: optionalString,
  body: z.string().min(1, "Message body is required"),
  category: smsCategoryEnum.default("GENERAL"),
  audience: smsAudienceEnum.default("CUSTOM"),
  templateId: optionalString,
  // For CUSTOM audience, explicit recipients; for others, resolved server-side.
  recipients: z.array(smsRecipientSchema).optional().default([]),
  // If true, attempt to dispatch via the configured provider immediately.
  send: z.coerce.boolean().optional().default(false),
});
export type SmsMessageInput = z.infer<typeof smsMessageSchema>;

// ---------- Admissions ----------
const genderEnumA = z.enum(["MALE", "FEMALE", "OTHER"]);
const applicationStatusEnum = z.enum(["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "ADMITTED", "REJECTED", "WAITLISTED"]);

export const admissionSessionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  year: z.coerce.number().int().min(2000).max(2100),
  classApplied: optionalString,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  seats: z.coerce.number().int().min(0).default(0),
  isOpen: z.coerce.boolean().optional().default(true),
});
export type AdmissionSessionInput = z.infer<typeof admissionSessionSchema>;

export const applicationSchema = z.object({
  sessionId: z.string().min(1, "Session is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  dateOfBirth: z.coerce.date().optional(),
  gender: genderEnumA.optional(),
  guardianName: optionalString,
  guardianPhone: optionalString,
  email: optionalString,
  address: optionalString,
  previousSchool: optionalString,
  classApplied: optionalString,
  score: z.coerce.number().min(0).max(100).optional().default(0),
  status: applicationStatusEnum.optional().default("SUBMITTED"),
  note: optionalString,
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

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
