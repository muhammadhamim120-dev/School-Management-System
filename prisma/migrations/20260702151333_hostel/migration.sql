-- Hostel module migration (additive).

CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'FULL', 'MAINTENANCE');
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'VACATED');

-- HostelBuilding
CREATE TABLE "HostelBuilding" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender",
    "warden" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HostelBuilding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HostelBuilding_name_key" ON "HostelBuilding"("name");

-- HostelRoom
CREATE TABLE "HostelRoom" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HostelRoom_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HostelRoom_buildingId_roomNo_key" ON "HostelRoom"("buildingId", "roomNo");
CREATE INDEX "HostelRoom_status_idx" ON "HostelRoom"("status");
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "HostelBuilding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- HostelAllocation
CREATE TABLE "HostelAllocation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacatedAt" TIMESTAMP(3),
    "status" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HostelAllocation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HostelAllocation_roomId_idx" ON "HostelAllocation"("roomId");
CREATE INDEX "HostelAllocation_studentId_idx" ON "HostelAllocation"("studentId");
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
