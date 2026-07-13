-- Multi-shift system: tag Teachers, Sections, and FeeStructures with an optional
-- shift. Attendance/Timetable separation needs no migration — Attendance is
-- per-student (students already carry shift) and timetables are per-class
-- (classes already carry shift). Uses the existing "Shift" enum.

ALTER TABLE "Teacher" ADD COLUMN "shift" "Shift";
ALTER TABLE "Section" ADD COLUMN "shift" "Shift";
ALTER TABLE "FeeStructure" ADD COLUMN "shift" "Shift";

-- Helpful indexes for shift-scoped queries on the admin pages.
CREATE INDEX "Teacher_shift_idx" ON "Teacher"("shift");
CREATE INDEX "Section_shift_idx" ON "Section"("shift");
CREATE INDEX "FeeStructure_shift_idx" ON "FeeStructure"("shift");
