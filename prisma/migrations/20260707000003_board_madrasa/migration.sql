-- Bangladesh Education Board: add madrasa education stream exams to the
-- BoardExam enum. Ebtedayee (≈PEC), Dakhil (≈SSC), Alim (≈HSC) are the
-- Bangladesh Madrasah Education Board equivalents.
-- ALTER TYPE ... ADD VALUE must run outside a transaction block on Postgres;
-- Prisma executes each statement independently.
ALTER TYPE "BoardExam" ADD VALUE IF NOT EXISTS 'EBTEDAYEE';
ALTER TYPE "BoardExam" ADD VALUE IF NOT EXISTS 'DAKHIL';
ALTER TYPE "BoardExam" ADD VALUE IF NOT EXISTS 'ALIM';
