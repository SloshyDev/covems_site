import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      grupo,
      claveAgente,
      fechaMovimiento,
      poliza,
      nombreAsegurado,
      recibo,
      dsn,
      sts,
      anioVig,
      fechaInicio,
      fechaVencimiento,
      primaFracc,
      recargoFijo,
      importeComble,
      pctComisPromotoria,
      comisPromotoria,
      pctComisAgente,
      comisAgente,
      pctComisSupervisor,
      comisSupervisor,
      nivelacionVariable,
      comisPrimerAnio,
      comisRenovacion,
      formaPago,
    } = body;

    if (!poliza) {
      return NextResponse.json({ error: "El campo 'poliza' es obligatorio" }, { status: 400 });
    } const polizaStr = poliza !== undefined ? String(poliza) : undefined;

    // Ya no se busca la claveAgente por la poliza, se espera que venga en el payload
    const reciboCreado = await prisma.recibo.create({
      data: {
        grupo: grupo || undefined,
        claveAgente: claveAgente ? Number(claveAgente) : undefined,
        fechaMovimiento: fechaMovimiento ? new Date(fechaMovimiento) : undefined,
        polizaRef: { connect: { poliza: polizaStr } },
        nombreAsegurado: nombreAsegurado || undefined,
        recibo: recibo || undefined,
        dsn: dsn || undefined,
        sts: sts || undefined,
        anioVig: anioVig ? Number(anioVig) : undefined,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        primaFracc: primaFracc ? Number(primaFracc) : undefined,
        recargoFijo: recargoFijo ? Number(recargoFijo) : undefined,
        importeComble: importeComble ? Number(importeComble) : undefined,
        pctComisPromotoria: pctComisPromotoria ? Number(pctComisPromotoria) : undefined,
        comisPromotoria: comisPromotoria ? Number(comisPromotoria) : undefined,
        pctComisAgente: pctComisAgente ? Number(pctComisAgente) : undefined,
        comisAgente: comisAgente ? Number(comisAgente) : undefined,
        pctComisSupervisor: pctComisSupervisor ? Number(pctComisSupervisor) : undefined,
        comisSupervisor: comisSupervisor ? Number(comisSupervisor) : undefined,
        nivelacionVariable: nivelacionVariable ? Number(nivelacionVariable) : undefined,
        comisPrimerAnio: comisPrimerAnio ? Number(comisPrimerAnio) : undefined,
        comisRenovacion: comisRenovacion ? Number(comisRenovacion) : undefined,
        formaPago: formaPago || undefined,
      },
    });

    return NextResponse.json({ ok: true, recibo: reciboCreado });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
