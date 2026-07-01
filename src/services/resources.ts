import { createResource } from "@/services/api-client";
import type {
  StudentWithRelations, ParentWithStudents, SubjectWithRelations,
  Teacher, Class, Section, Exam, Result, Fee, Notice, Event,
} from "@/types";
import type {
  StudentInput, TeacherInput, ParentInput, ClassInput, SectionInput, SubjectInput,
  ExamInput, FeeInput, NoticeInput, EventInput,
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
