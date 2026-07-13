-- Homework module: extend Homework with attachment + add submissions.
-- Online Examination: question bank, online exams, attempts, answers.

-- New enums
CREATE TYPE "HomeworkSubmissionStatus" AS ENUM ('SUBMITTED', 'GRADED', 'LATE', 'RETURNED');
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'WRITTEN');
CREATE TYPE "OnlineExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED');
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'TIMED_OUT');

-- Extend Homework with an attachment URL.
ALTER TABLE "Homework" ADD COLUMN "attachmentUrl" TEXT;

-- Homework submissions (one per student per homework) with grading.
CREATE TABLE "HomeworkSubmission" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "status" "HomeworkSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marks" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeworkSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HomeworkSubmission_homeworkId_studentId_key" ON "HomeworkSubmission"("homeworkId", "studentId");
CREATE INDEX "HomeworkSubmission_homeworkId_idx" ON "HomeworkSubmission"("homeworkId");
CREATE INDEX "HomeworkSubmission_studentId_idx" ON "HomeworkSubmission"("studentId");
ALTER TABLE "HomeworkSubmission"
  ADD CONSTRAINT "HomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeworkSubmission"
  ADD CONSTRAINT "HomeworkSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Question bank (reusable across exams).
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "classId" TEXT,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB,
    "correctOption" INTEGER,
    "modelAnswer" TEXT,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Question_subjectId_idx" ON "Question"("subjectId");
CREATE INDEX "Question_classId_idx" ON "Question"("classId");
CREATE INDEX "Question_type_idx" ON "Question"("type");
ALTER TABLE "Question"
  ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Question"
  ADD CONSTRAINT "Question_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Question"
  ADD CONSTRAINT "Question_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Online exam definition (timer, window, marks, status).
CREATE TABLE "OnlineExam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "classId" TEXT,
    "sectionId" TEXT,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passMark" DOUBLE PRECISION,
    "negativeMark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "status" "OnlineExamStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnlineExam_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OnlineExam_classId_idx" ON "OnlineExam"("classId");
CREATE INDEX "OnlineExam_status_idx" ON "OnlineExam"("status");
ALTER TABLE "OnlineExam"
  ADD CONSTRAINT "OnlineExam_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OnlineExam"
  ADD CONSTRAINT "OnlineExam_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OnlineExam"
  ADD CONSTRAINT "OnlineExam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OnlineExam"
  ADD CONSTRAINT "OnlineExam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Join table: question attached to an exam (order + per-exam marks).
CREATE TABLE "OnlineExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    CONSTRAINT "OnlineExamQuestion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OnlineExamQuestion_examId_questionId_key" ON "OnlineExamQuestion"("examId", "questionId");
CREATE INDEX "OnlineExamQuestion_examId_idx" ON "OnlineExamQuestion"("examId");
ALTER TABLE "OnlineExamQuestion"
  ADD CONSTRAINT "OnlineExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "OnlineExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnlineExamQuestion"
  ADD CONSTRAINT "OnlineExamQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One attempt per student per exam.
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExamAttempt_examId_studentId_key" ON "ExamAttempt"("examId", "studentId");
CREATE INDEX "ExamAttempt_examId_idx" ON "ExamAttempt"("examId");
CREATE INDEX "ExamAttempt_studentId_idx" ON "ExamAttempt"("studentId");
ALTER TABLE "ExamAttempt"
  ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "OnlineExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttempt"
  ADD CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One answer per question per attempt.
CREATE TABLE "ExamAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionLinkId" TEXT NOT NULL,
    "selectedOption" INTEGER,
    "writtenAnswer" TEXT,
    "attachmentUrl" TEXT,
    "awardedMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN,
    "gradedAt" TIMESTAMP(3),
    CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExamAnswer_attemptId_questionLinkId_key" ON "ExamAnswer"("attemptId", "questionLinkId");
CREATE INDEX "ExamAnswer_attemptId_idx" ON "ExamAnswer"("attemptId");
ALTER TABLE "ExamAnswer"
  ADD CONSTRAINT "ExamAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAnswer"
  ADD CONSTRAINT "ExamAnswer_questionLinkId_fkey" FOREIGN KEY ("questionLinkId") REFERENCES "OnlineExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
