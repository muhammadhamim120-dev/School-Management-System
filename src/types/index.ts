import type {
  Student, Teacher, Parent, Class, Section, Subject,
  Attendance, Exam, Result, Fee, Notice, Event, Status,
  Campus, AcademicSession, Term, BoardRegistration,
  Medium, MadrasaLevel, Shift, BoardExam, BoardRegStatus,
  FeeCategory, FeeStructure, Invoice, InvoiceItem, Payment, Concession,
  FeeType, FeeRecurrence, InvoiceStatus, PaymentMethod, PaymentStatus, PaymentGateway, ConcessionType, ConcessionMode,
  BookCategory, Author, Publisher, Book, BookCopy, BookLoan,
  CopyStatus, LoanStatus, BorrowerType,
  Driver, Vehicle, TransportRoute, RouteStop, StudentTransport,
  VehicleType, VehicleStatus, TransportAssignmentStatus,
  HostelBuilding, HostelRoom, HostelAllocation, RoomStatus, AllocationStatus,
  SmsTemplate, SmsMessage, SmsRecipient, SmsStatus, SmsAudience, SmsCategory,
  AdmissionSession, Application, ApplicationStatus,
  RiskAssessment, RiskLevel,
  PaymentTransaction, PaymentEvent,
  RoutineSlot, Homework, ParentMessage, LeaveRequest, WeekDay, MessageSender, LeaveStatus,
} from "@prisma/client";

export type {
  Student, Teacher, Parent, Class, Section, Subject, Attendance, Exam, Result, Fee, Notice, Event, Status,
  Campus, AcademicSession, Term, BoardRegistration,
  Medium, MadrasaLevel, Shift, BoardExam, BoardRegStatus,
  FeeCategory, FeeStructure, Invoice, InvoiceItem, Payment, Concession,
  FeeType, FeeRecurrence, InvoiceStatus, PaymentMethod, PaymentStatus, PaymentGateway, ConcessionType, ConcessionMode,
  BookCategory, Author, Publisher, Book, BookCopy, BookLoan,
  CopyStatus, LoanStatus, BorrowerType,
  Driver, Vehicle, TransportRoute, RouteStop, StudentTransport,
  VehicleType, VehicleStatus, TransportAssignmentStatus,
  HostelBuilding, HostelRoom, HostelAllocation, RoomStatus, AllocationStatus,
  SmsTemplate, SmsMessage, SmsRecipient, SmsStatus, SmsAudience, SmsCategory,
  AdmissionSession, Application, ApplicationStatus,
  RiskAssessment, RiskLevel,
  PaymentTransaction, PaymentEvent,
  RoutineSlot, Homework, ParentMessage, LeaveRequest, WeekDay, MessageSender, LeaveStatus,
};

export type RiskAssessmentWithStudent = RiskAssessment & {
  student?: (Student & { class?: { name: string } | null }) | null;
};

export type SessionWithCount = AdmissionSession & { _count?: { applications: number } };
export type ApplicationWithSession = Application & { session?: AdmissionSession | null };

export type SmsMessageWithRelations = SmsMessage & {
  template?: SmsTemplate | null;
  recipients?: SmsRecipient[];
  _count?: { recipients: number };
};

export type BuildingWithRooms = HostelBuilding & { rooms?: HostelRoom[]; _count?: { rooms: number } };
export type RoomWithRelations = HostelRoom & { building?: HostelBuilding | null; _count?: { allocations: number } };
export type AllocationWithRelations = HostelAllocation & {
  room?: (HostelRoom & { building?: HostelBuilding | null }) | null;
  student?: Student | null;
};

export type VehicleWithDriver = Vehicle & { driver?: Driver | null };
export type RouteWithRelations = TransportRoute & {
  vehicle?: (Vehicle & { driver?: Driver | null }) | null;
  stops?: RouteStop[];
  _count?: { assignments: number };
};
export type StudentTransportWithRelations = StudentTransport & {
  student?: Student | null;
  route?: TransportRoute | null;
  stop?: RouteStop | null;
};

export type BookWithRelations = Book & {
  category?: BookCategory | null;
  author?: Author | null;
  publisher?: Publisher | null;
  copies?: BookCopy[];
  _count?: { copies: number };
};
export type BookLoanWithRelations = BookLoan & {
  copy?: (BookCopy & { book?: Book | null }) | null;
  student?: Student | null;
  teacher?: Teacher | null;
};

export type InvoiceWithRelations = Invoice & {
  student?: Student | null;
  items?: InvoiceItem[];
  payments?: Payment[];
};
export type PaymentWithInvoice = Payment & { invoice?: (Invoice & { student?: Student | null }) | null };
export type FeeStructureWithCategory = FeeStructure & { category?: FeeCategory | null };
export type ConcessionWithStudent = Concession & { student?: Student | null };

export type SessionWithTerms = AcademicSession & { terms: Term[] };
export type BoardRegistrationWithStudent = BoardRegistration & { student?: Student | null };

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
