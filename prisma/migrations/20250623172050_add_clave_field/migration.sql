/*
  Warnings:

  - A unique constraint covering the columns `[clave]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clave` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clave" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_clave_key" ON "User"("clave");
