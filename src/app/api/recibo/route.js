import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    // Construir filtro de fechas si se proporcionan
    let where = {};
    if (fechaInicio && fechaFin) {
      where.fechaMovimiento = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      };
    } else if (fechaInicio) {
      where.fechaMovimiento = {
        gte: new Date(fechaInicio)
      };
    } else if (fechaFin) {
      where.fechaMovimiento = {
        lte: new Date(fechaFin)
      };
    }

    const recibos = await prisma.recibo.findMany({
      where,
      include: {
        polizaRef: {
          select: {
            poliza: true
          }
        }
      },
      orderBy: {
        fechaMovimiento: 'desc'
      }
    });

    return NextResponse.json({ ok: true, recibos });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    // Permitir recibir un lote de recibos o un solo recibo
    const recibos = Array.isArray(body) ? body : (body.recibos || [body]);
    if (!Array.isArray(recibos) || recibos.length === 0) {
      return NextResponse.json({ error: "No hay recibos para procesar." }, { status: 400 });
    }

    // Insertar todos los recibos (uno a uno para poder actualizar la poliza después)
    const creados = [];
    const polizasAActualizar = {};
    for (const recibo of recibos) {
      if (!recibo.poliza) continue;
      const polizaStr = String(recibo.poliza);
      // Crear recibo
      const reciboCreado = await prisma.recibo.create({
        data: {
          grupo: recibo.grupo || undefined,
          claveAgente: recibo.claveAgente ? Number(recibo.claveAgente) : undefined,
          fechaMovimiento: recibo.fechaMovimiento ? new Date(recibo.fechaMovimiento) : undefined,
          polizaRef: { connect: { poliza: polizaStr } },
          nombreAsegurado: recibo.nombreAsegurado || undefined,
          recibo: recibo.recibo || undefined,
          dsn: recibo.dsn || undefined,
          sts: recibo.sts || undefined,
          anioVig: recibo.anioVig ? Number(recibo.anioVig) : undefined,
          fechaInicio: recibo.fechaInicio ? new Date(recibo.fechaInicio) : undefined,
          fechaVencimiento: recibo.fechaVencimiento ? new Date(recibo.fechaVencimiento) : undefined,
          primaFracc: recibo.primaFracc ? Number(recibo.primaFracc) : undefined,
          recargoFijo: recibo.recargoFijo ? Number(recibo.recargoFijo) : undefined,
          importeComble: recibo.importeComble ? Number(recibo.importeComble) : undefined,
          pctComisPromotoria: recibo.pctComisPromotoria ? Number(recibo.pctComisPromotoria) : undefined,
          comisPromotoria: recibo.comisPromotoria ? Number(recibo.comisPromotoria) : undefined,
          pctComisAgente: recibo.pctComisAgente ? Number(recibo.pctComisAgente) : undefined,
          comisAgente: recibo.comisAgente ? Number(recibo.comisAgente) : undefined,
          pctComisSupervisor: recibo.pctComisSupervisor ? Number(recibo.pctComisSupervisor) : undefined,
          comisSupervisor: recibo.comisSupervisor ? Number(recibo.comisSupervisor) : undefined,
          nivelacionVariable: recibo.nivelacionVariable ? Number(recibo.nivelacionVariable) : undefined,
          comisPrimerAnio: recibo.comisPrimerAnio ? Number(recibo.comisPrimerAnio) : undefined,
          comisRenovacion: recibo.comisRenovacion ? Number(recibo.comisRenovacion) : undefined,
          formaPago: recibo.formaPago || undefined,
        },
      });
      creados.push(reciboCreado);
      // Agrupar para actualizar poliza
      if (!polizasAActualizar[polizaStr]) polizasAActualizar[polizaStr] = [];
      polizasAActualizar[polizaStr].push(reciboCreado);
    }

    // Actualizar cada póliza con la fecha, dsn y año de vigencia del recibo más reciente
    for (const poliza of Object.keys(polizasAActualizar)) {
      const recibosPoliza = polizasAActualizar[poliza];
      // Buscar el recibo con la fechaMovimiento más reciente
      const reciboMasReciente = recibosPoliza.reduce((a, b) => {
        if (!a.fechaMovimiento) return b;
        if (!b.fechaMovimiento) return a;
        return new Date(a.fechaMovimiento) > new Date(b.fechaMovimiento) ? a : b;
      });
      await prisma.poliza.update({
        where: { poliza },
        data: {
          fechaUltimoMov: reciboMasReciente.fechaMovimiento ? new Date(reciboMasReciente.fechaMovimiento) : undefined,
          dsn: reciboMasReciente.dsn,
          anioVig: reciboMasReciente.anioVig
        }
      });
    }

    return NextResponse.json({ ok: true, insertados: creados.length, polizasActualizadas: Object.keys(polizasAActualizar).length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
