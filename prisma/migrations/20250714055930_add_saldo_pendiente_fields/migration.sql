/*
  Warnings:

  - Added the required column `updatedAt` to the `SaldoPendiente` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SaldoPendiente" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
