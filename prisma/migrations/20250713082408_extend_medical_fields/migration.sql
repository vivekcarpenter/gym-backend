-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "chronicConditions" TEXT,
ADD COLUMN     "doctorContact" TEXT,
ADD COLUMN     "injuries" TEXT,
ADD COLUMN     "lastExamDate" TIMESTAMP(3),
ADD COLUMN     "medications" TEXT;
