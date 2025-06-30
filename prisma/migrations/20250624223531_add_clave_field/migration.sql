/*
  Warnings:

  - A unique constraint covering the columns `[solicitud]` on the table `Solicitud` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_solicitud_key" ON "Solicitud"("solicitud");
