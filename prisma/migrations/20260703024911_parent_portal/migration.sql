-- Parent Portal module migration (additive): routine, homework, messaging, leave.

CREATE TYPE "WeekDay" AS ENUM ('SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY');
CREATE TYPE "MessageSender" AS ENUM ('PARENT','TEACHER','ADMIN');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING','APPROVED','REJECTED');

CREATE TABLE "RoutineSlot" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "day" "WeekDay" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoutineSlot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RoutineSlot_classId_idx" ON "RoutineSlot"("classId");
CREATE INDEX "RoutineSlot_sectionId_idx" ON "RoutineSlot"("sectionId");
ALTER TABLE "RoutineSlot" ADD CONSTRAINT "RoutineSlot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutineSlot" ADD CONSTRAINT "RoutineSlot_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoutineSlot" ADD CONSTRAINT "RoutineSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoutineSlot" ADD CONSTRAINT "RoutineSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Homework" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "assignedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Homework_classId_idx" ON "Homework"("classId");
CREATE INDEX "Homework_dueDate_idx" ON "Homework"("dueDate");
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ParentMessage" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT,
    "sender" "MessageSender" NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParentMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ParentMessage_studentId_idx" ON "ParentMessage"("studentId");
CREATE INDEX "ParentMessage_teacherId_idx" ON "ParentMessage"("teacherId");
ALTER TABLE "ParentMessage" ADD CONSTRAINT "ParentMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParentMessage" ADD CONSTRAINT "ParentMessage_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeaveRequest_studentId_idx" ON "LeaveRequest"("studentId");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
