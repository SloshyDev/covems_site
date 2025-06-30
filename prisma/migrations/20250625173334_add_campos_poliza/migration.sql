/*
  Warnings:

  - A unique constraint covering the columns `[poliza]` on the table `Poliza` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Poliza" ADD COLUMN     "anioVig" INTEGER,
ADD COLUMN     "dsn" TEXT,
ADD COLUMN     "fechaUltimoMov" TIMESTAMP(3),
ADD COLUMN     "ultimoRecibo" TEXT;

-- CreateTable
CREATE TABLE "Recibo" (
    "id" SERIAL NOT NULL,
    "grupo" TEXT,
    "claveAgente" INTEGER,
    "fechaMovimiento" TIMESTAMP(3),
    "poliza" TEXT NOT NULL,
    "nombreAsegurado" TEXT,
    "recibo" TEXT,
    "dsn" TEXT,
    "sts" TEXT,
    "anioVig" INTEGER,
    "fechaInicio" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "primaFracc" DOUBLE PRECISION,
    "recargoFijo" DOUBLE PRECISION,
    "importeComble" DOUBLE PRECISION,
    "pctComisPromotoria" DOUBLE PRECISION,
    "comisPromotoria" DOUBLE PRECISION,
    "pctComisAgente" DOUBLE PRECISION,
    "comisAgente" DOUBLE PRECISION,
    "pctComisSupervisor" DOUBLE PRECISION,
    "comisSupervisor" DOUBLE PRECISION,
    "nivelacionVariable" DOUBLE PRECISION,
    "comisPrimerAnio" DOUBLE PRECISION,
    "comisRenovacion" DOUBLE PRECISION,
    "formaPago" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recibo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Poliza_poliza_key" ON "Poliza"("poliza");

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_poliza_fkey" FOREIGN KEY ("poliza") REFERENCES "Poliza"("poliza") ON DELETE RESTRICT ON UPDATE CASCADE;
