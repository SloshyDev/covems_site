-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "rfc" TEXT,
    "curp" TEXT,
    "celular" TEXT,
    "banco" TEXT,
    "cuenta_clabe" TEXT,
    "supervisor_clave" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
