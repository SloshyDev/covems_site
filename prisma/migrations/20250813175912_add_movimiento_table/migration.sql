-- CreateTable
CREATE TABLE "Movimiento" (
    "id" SERIAL NOT NULL,
    "empresa" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "subconcepto" TEXT,
    "tipoMovimiento" TEXT NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,
    "banco" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tipoComprobancion" TEXT NOT NULL,
    "estatus" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
