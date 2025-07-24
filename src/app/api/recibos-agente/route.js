
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getComisionSupervisorRecibo } from "./comisiones-back";


export async function POST(req) {
  try {
    const { recibos } = await req.json();
    if (!Array.isArray(recibos)) {
      return NextResponse.json({ error: "Formato de datos inválido" }, { status: 400 });
    }
    // Extraer polizas únicas y asegurarse que sean strings
    const polizasUnicas = [...new Set(recibos.map(r => String(r[4])))]
    // Buscar agenteClave para cada poliza
    const polizas = await prisma.poliza.findMany({
      where: { poliza: { in: polizasUnicas } },
      select: { poliza: true, agenteClave: true }
    });
    const polizaToAgente = Object.fromEntries(polizas.map(p => [p.poliza, p.agenteClave]));
    // Agrupar recibos por agenteClave
    const recibosPorAgente = {};
    // Para buscar supervisores
    const agentesClaves = new Set();
    for (const recibo of recibos) {
      const poliza = recibo[4];
      const agenteClave = polizaToAgente[poliza] || "Sin agente";
      if (!recibosPorAgente[agenteClave]) recibosPorAgente[agenteClave] = [];
      recibosPorAgente[agenteClave].push(recibo);
      if (agenteClave !== "Sin agente") agentesClaves.add(Number(agenteClave));
    }

    // Buscar supervisor_clave de cada agente
    const users = await prisma.user.findMany({
      where: { clave: { in: Array.from(agentesClaves) } },
      select: { clave: true, supervisor_clave: true }
    });
    const agenteToSupervisor = Object.fromEntries(users.map(u => [u.clave, u.supervisor_clave]));

    // Agrupar recibos por supervisor si generan comisión supervisor
    const recibosPorSupervisor = {};
    for (const [agenteClave, recibosAgente] of Object.entries(recibosPorAgente)) {
      const supervisorClave = agenteToSupervisor[Number(agenteClave)] || null;
      if (!supervisorClave) continue;
      for (const recibo of recibosAgente) {
        const comisionSupervisor = getComisionSupervisorRecibo(recibo);
        if (comisionSupervisor && comisionSupervisor !== 0) {
          if (!recibosPorSupervisor[supervisorClave]) recibosPorSupervisor[supervisorClave] = [];
          recibosPorSupervisor[supervisorClave].push({ recibo, comision: comisionSupervisor, agenteClave });
        }
      }
    }

    return NextResponse.json({ recibosPorAgente, recibosPorSupervisor });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
