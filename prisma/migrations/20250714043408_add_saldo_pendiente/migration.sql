-- CreateTable
CREATE TABLE "SaldoPendiente" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL,
    "agenteId" INTEGER NOT NULL,

    CONSTRAINT "SaldoPendiente_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SaldoPendiente" ADD CONSTRAINT "SaldoPendiente_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
