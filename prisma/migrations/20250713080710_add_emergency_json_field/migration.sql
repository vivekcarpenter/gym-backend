/*
  Warnings:

  - You are about to drop the column `emergencyEmail` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyName` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyPhone` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyRelationship` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "emergencyEmail",
DROP COLUMN "emergencyName",
DROP COLUMN "emergencyPhone",
DROP COLUMN "emergencyRelationship";
