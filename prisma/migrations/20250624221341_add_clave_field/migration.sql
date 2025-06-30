-- CreateTable
CREATE TABLE "Solicitud" (
    "id" SERIAL NOT NULL,
    "solicitud" TEXT NOT NULL,
    "recepcion" TIMESTAMP(3) NOT NULL,
    "asegurado" TEXT NOT NULL,
    "contratante" TEXT NOT NULL,
    "agenteClave" INTEGER NOT NULL,
    "primaAhorro" TEXT,
    "formaPago" TEXT NOT NULL,
    "primaSolicitada" TEXT,
    "poliza" TEXT,
    "pase" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_agenteClave_fkey" FOREIGN KEY ("agenteClave") REFERENCES "User"("clave") ON DELETE RESTRICT ON UPDATE CASCADE;
