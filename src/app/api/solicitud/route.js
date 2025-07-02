import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/solicitud - Crear nueva solicitud
export async function POST(request) {
  try {
    const data = await request.json();
    // Validar campos requeridos
    const required = [
      "solicitud",
      "recepcion",
      "asegurado",
      "contratante",
      "agenteClave",
      "formaPago",
      "pase",
    ];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null) {
        return NextResponse.json(
          { error: `Falta el campo '${field}'` },
          { status: 400 }
        );
      }
    }
    // Crear solicitud
    const nuevaSolicitud = await prisma.solicitud.create({
      data: {
        solicitud: data.solicitud,
        recepcion: new Date(data.recepcion),
        asegurado: data.asegurado,
        contratante: data.contratante,
        agenteClave: Number(data.agenteClave),
        primaAhorro:
          data.primaAhorro !== undefined &&
          data.primaAhorro !== null &&
          data.primaAhorro !== ""
            ? String(data.primaAhorro)
            : null,
        formaPago: data.formaPago,
        primaSolicitada:
          data.primaSolicitada !== undefined &&
          data.primaSolicitada !== null &&
          data.primaSolicitada !== ""
            ? String(data.primaSolicitada)
            : null,
        poliza: data.poliza || null,
        pase: Boolean(data.pase),
      },
    });
    return NextResponse.json(nuevaSolicitud);
  } catch (error) {
    // Log detallado para debug
    console.error("Error creando solicitud:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("solicitud")) {
      return NextResponse.json(
        { error: "Ya existe una solicitud con ese número." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error creando solicitud" },
      { status: 500 }
    );
  }
}
