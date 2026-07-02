-- Library module migration (additive: new enums + tables + FKs).

CREATE TYPE "CopyStatus" AS ENUM ('AVAILABLE', 'ISSUED', 'LOST', 'DAMAGED', 'RESERVED');
CREATE TYPE "LoanStatus" AS ENUM ('ISSUED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED');
CREATE TYPE "BorrowerType" AS ENUM ('STUDENT', 'TEACHER');

-- BookCategory
CREATE TABLE "BookCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BookCategory_name_key" ON "BookCategory"("name");

-- Author
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Author_name_key" ON "Author"("name");

-- Publisher
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Publisher_name_key" ON "Publisher"("name");

-- Book
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isbn" TEXT,
    "categoryId" TEXT,
    "authorId" TEXT,
    "publisherId" TEXT,
    "edition" TEXT,
    "publishYear" INTEGER,
    "language" TEXT,
    "shelf" TEXT,
    "rack" TEXT,
    "description" TEXT,
    "coverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");
CREATE INDEX "Book_categoryId_idx" ON "Book"("categoryId");
CREATE INDEX "Book_authorId_idx" ON "Book"("authorId");
CREATE INDEX "Book_title_idx" ON "Book"("title");
ALTER TABLE "Book" ADD CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BookCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Book" ADD CONSTRAINT "Book_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Book" ADD CONSTRAINT "Book_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- BookCopy
CREATE TABLE "BookCopy" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "copyCode" TEXT NOT NULL,
    "status" "CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookCopy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BookCopy_copyCode_key" ON "BookCopy"("copyCode");
CREATE INDEX "BookCopy_bookId_idx" ON "BookCopy"("bookId");
CREATE INDEX "BookCopy_status_idx" ON "BookCopy"("status");
ALTER TABLE "BookCopy" ADD CONSTRAINT "BookCopy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BookLoan
CREATE TABLE "BookLoan" (
    "id" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "borrowerType" "BorrowerType" NOT NULL,
    "studentId" TEXT,
    "teacherId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "renewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "LoanStatus" NOT NULL DEFAULT 'ISSUED',
    "fineAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finePaid" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookLoan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BookLoan_copyId_idx" ON "BookLoan"("copyId");
CREATE INDEX "BookLoan_studentId_idx" ON "BookLoan"("studentId");
CREATE INDEX "BookLoan_teacherId_idx" ON "BookLoan"("teacherId");
CREATE INDEX "BookLoan_status_idx" ON "BookLoan"("status");
ALTER TABLE "BookLoan" ADD CONSTRAINT "BookLoan_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "BookCopy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookLoan" ADD CONSTRAINT "BookLoan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BookLoan" ADD CONSTRAINT "BookLoan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
