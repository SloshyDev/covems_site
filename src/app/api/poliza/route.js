import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      solicitudId,
      poliza,
      asegurado,
      agenteClave,
      fechaRecibida,
      primaFraccionada,
      primaAnual,
      formaPago,
    } = body;

    if (
      !solicitudId ||
      !poliza ||
      !asegurado ||
      !agenteClave ||
      !fechaRecibida ||
      !formaPago
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // 1. Crear la nueva póliza
    const nuevaPoliza = await prisma.poliza.create({
      data: {
        poliza,
        asegurado,
        agenteClave: Number(agenteClave),
        fechaRecibida: new Date(fechaRecibida),
        solicitudId: Number(solicitudId),
        primaFraccionada: primaFraccionada ? String(primaFraccionada) : null,
        primaAnual: primaAnual ? String(primaAnual) : null,
        formaPago,
      },
    });

    // 2. Actualizar el campo poliza en la solicitud
    await prisma.solicitud.update({
      where: { id: Number(solicitudId) },
      data: { poliza },
    });

    return NextResponse.json({ ok: true, poliza: nuevaPoliza });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const polizaNum = searchParams.get("poliza");
  if (polizaNum) {
    // Buscar una póliza específica
    const poliza = await prisma.poliza.findUnique({
      where: { poliza: polizaNum },
      select: {
        poliza: true,
        agenteClave: true,
        asegurado: true,
        solicitudId: true,
        formaPago: true,
      },
    });
    if (!poliza) {
      return NextResponse.json({ error: "No existe la póliza" }, { status: 404 });
    }
    return NextResponse.json(poliza);
  } else {
    // Regresar todas las pólizas
    const polizas = await prisma.poliza.findMany({
      select: {
        poliza: true,
        agenteClave: true,
        asegurado: true,
        solicitudId: true,
        formaPago: true,
      },
    });
    return NextResponse.json(polizas);
  }
}
