-- CreateTable
CREATE TABLE "Poliza" (
    "id" SERIAL NOT NULL,
    "poliza" TEXT NOT NULL,
    "asegurado" TEXT NOT NULL,
    "agenteClave" INTEGER NOT NULL,
    "fechaRecibida" TIMESTAMP(3) NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "primaFraccionada" TEXT,
    "primaAnual" TEXT,
    "formaPago" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poliza_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_agenteClave_fkey" FOREIGN KEY ("agenteClave") REFERENCES "User"("clave") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
