import { createResource } from "@/services/api-client";
import type {
  StudentWithRelations, ParentWithStudents, SubjectWithRelations,
  Teacher, Class, Section, Exam, Result, Fee, Notice, Event,
  Campus, SessionWithTerms, BoardRegistrationWithStudent,
  FeeCategory, FeeStructureWithCategory, InvoiceWithRelations, PaymentWithInvoice, ConcessionWithStudent,
  BookCategory, Author, Publisher, BookWithRelations, BookLoanWithRelations, BookCopy,
  Driver, VehicleWithDriver, RouteWithRelations, StudentTransportWithRelations,
  BuildingWithRooms, RoomWithRelations, AllocationWithRelations,
  SmsTemplate, SmsMessageWithRelations,
  SessionWithCount, ApplicationWithSession,
  RiskAssessmentWithStudent,
  PaymentTransaction,
  HomeworkWithRelations, QuestionWithRelations, OnlineExamWithRelations,
} from "@/types";
import type {
  StudentInput, TeacherInput, ParentInput, ClassInput, SectionInput, SubjectInput,
  ExamInput, FeeInput, NoticeInput, EventInput,
  CampusInput, SessionInput, BoardRegistrationInput,
  FeeCategoryInput, FeeStructureInput, InvoiceInput, PaymentInput, ConcessionInput,
  BookCategoryInput, AuthorInput, PublisherInput, BookInput, BookCopyInput, IssueLoanInput,
  DriverInput, VehicleInput, TransportRouteInput, StudentTransportInput,
  HostelBuildingInput, HostelRoomInput, HostelAllocationInput,
  SmsTemplateInput, SmsMessageInput,
  AdmissionSessionInput, ApplicationInput,
  HomeworkInput, QuestionInput, OnlineExamInput,
} from "@/lib/validations";

export const studentsApi = createResource<StudentWithRelations, StudentInput>("students");
export const teachersApi = createResource<Teacher, TeacherInput>("teachers");
export const parentsApi = createResource<ParentWithStudents, ParentInput>("parents");
export const classesApi = createResource<Class & { sections: Section[]; _count: { students: number; subjects: number } }, ClassInput>("classes");
export const sectionsApi = createResource<Section & { class: Class | null }, SectionInput>("sections");
export const subjectsApi = createResource<SubjectWithRelations, SubjectInput>("subjects");
export const examsApi = createResource<Exam & { class: Class | null }, ExamInput>("exams");
export const feesApi = createResource<Fee, FeeInput>("fees");
export const noticesApi = createResource<Notice, NoticeInput>("notices");
export const eventsApi = createResource<Event, EventInput>("events");
export const resultsApi = createResource<Result, never>("results");

// Academic structure
export const campusesApi = createResource<Campus & { _count: { students: number; teachers: number; classes: number } }, CampusInput>("campuses");
export const sessionsApi = createResource<SessionWithTerms, SessionInput>("sessions");
export const boardRegistrationsApi = createResource<BoardRegistrationWithStudent, BoardRegistrationInput>("board-registrations");

// Finance
export const feeCategoriesApi = createResource<FeeCategory, FeeCategoryInput>("fee-categories");
export const feeStructuresApi = createResource<FeeStructureWithCategory, FeeStructureInput>("fee-structures");
export const invoicesApi = createResource<InvoiceWithRelations, InvoiceInput>("invoices");
export const paymentsApi = createResource<PaymentWithInvoice, PaymentInput>("payments");
export const concessionsApi = createResource<ConcessionWithStudent, ConcessionInput>("concessions");

// Library
export const bookCategoriesApi = createResource<BookCategory, BookCategoryInput>("book-categories");
export const authorsApi = createResource<Author, AuthorInput>("authors");
export const publishersApi = createResource<Publisher, PublisherInput>("publishers");
export const booksApi = createResource<BookWithRelations, BookInput>("books");
export const bookCopiesApi = createResource<BookCopy, BookCopyInput>("book-copies");
export const loansApi = createResource<BookLoanWithRelations, IssueLoanInput>("loans");

// Transport
export const driversApi = createResource<Driver, DriverInput>("drivers");
export const vehiclesApi = createResource<VehicleWithDriver, VehicleInput>("vehicles");
export const transportRoutesApi = createResource<RouteWithRelations, TransportRouteInput>("transport-routes");
export const studentTransportApi = createResource<StudentTransportWithRelations, StudentTransportInput>("student-transport");

// Hostel
export const hostelBuildingsApi = createResource<BuildingWithRooms, HostelBuildingInput>("hostel-buildings");
export const hostelRoomsApi = createResource<RoomWithRelations, HostelRoomInput>("hostel-rooms");
export const hostelAllocationsApi = createResource<AllocationWithRelations, HostelAllocationInput>("hostel-allocations");

// SMS
export const smsTemplatesApi = createResource<SmsTemplate, SmsTemplateInput>("sms-templates");
export const smsMessagesApi = createResource<SmsMessageWithRelations, SmsMessageInput>("sms-messages");

// Admissions
export const admissionSessionsApi = createResource<SessionWithCount, AdmissionSessionInput>("admission-sessions");
export const applicationsApi = createResource<ApplicationWithSession, ApplicationInput>("applications");

// Risk (read-only list; compute via dedicated endpoint)
export const riskAssessmentsApi = createResource<RiskAssessmentWithStudent, never>("risk-assessments");

// Payment transaction logs (read-only)
export const paymentTransactionsApi = createResource<PaymentTransaction, never>("payment-transactions");

// Homework
export const homeworkApi = createResource<HomeworkWithRelations, HomeworkInput>("homework");

// Online examination: question bank + exams (sub-routes use raw request())
export const questionsApi = createResource<QuestionWithRelations, QuestionInput>("questions");
export const onlineExamsApi = createResource<OnlineExamWithRelations, OnlineExamInput>("online-exams");
