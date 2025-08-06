// utils/saldos.js
// Utilidad para calcular saldo actual y atributos de saldo para cards de agentes y supervisores

export function getSaldoCardProps({ clave, saldoPendiente, totalComision }) {
  // Redondear comisión
  const totalComisionFixed = Number(totalComision).toFixed(2);
  // Tratar saldoPendiente undefined como 0
  const saldoInicial = saldoPendiente !== undefined ? saldoPendiente : 0;
  const saldoActual = Number(saldoInicial) + Number(totalComisionFixed);
  return {
    'data-clave': clave,
    'data-saldo-inicial': saldoInicial,
    'data-saldo-actual': saldoActual,
    saldoActual,
    totalComisionFixed,
  };
}

// Función para actualizar saldos pendientes de todos los usuarios (agentes y supervisores)
export async function actualizarSaldosPendientes(year, month, corteIdx, cortes, recibosFilterados, saldosPendientesPorClave) {
  let fechaSiguienteCorte;
  
  if (cortes[corteIdx + 1]) {
    // Hay siguiente corte en el mismo mes
    const siguienteCorte = cortes[corteIdx + 1];
    fechaSiguienteCorte = new Date(year, month - 1, siguienteCorte.inicio);
  } else {
    // Es el último corte del mes, usar el primer día del siguiente mes
    const siguienteMes = month === 12 ? 1 : month + 1;
    const siguienteAnio = month === 12 ? year + 1 : year;
    fechaSiguienteCorte = new Date(siguienteAnio, siguienteMes - 1, 1);
  }
  const saldosARegistrar = [];

  // Primero, agrupar recibos por agente usando la API
  const response = await fetch("/api/recibos-agente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recibos: recibosFilterados })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  
  const recibosPorAgente = data.recibosPorAgente || {};
  const recibosPorSupervisor = data.recibosPorSupervisor || {};

  // Procesar agentes
  for (const [agenteClave, recibos] of Object.entries(recibosPorAgente)) {
    let totalComisionAgente = 0;
    try {
      const idxs = {
        nivelacionIdx: 19,
        comis1erAnioIdx: 20,
        importeCombleIdx: 17,
        comisIdx: 18,
        dsnIdx: 9,
        formaPagoIdx: 22,
        primaFraccIdx: 15,
        recargoFijoIdx: 16,
      };
      const { getComisionAgenteRecibo } = require("../comisiones");
      totalComisionAgente = recibos.reduce((sum, recibo) => {
        const anioVig = recibo[11];
        const c = getComisionAgenteRecibo(recibo, idxs, agenteClave, anioVig);
        return sum + (c && c.valor ? c.valor : 0);
      }, 0);
    } catch (e) {}

    // SIEMPRE usar 0 si no hay saldo pendiente (no depender de saldosPendientesPorClave)
    const saldoPendiente = saldosPendientesPorClave[agenteClave] || 0;
    const saldoActual = Number(saldoPendiente) + Number(totalComisionAgente);
    // Redondear saldo actual a 2 decimales
    const saldoActualRedondeado = Math.round(saldoActual * 100) / 100;


    // Si saldo actual es negativo, SIEMPRE registrar (sin importar si tenía saldo anterior)
    if (saldoActualRedondeado < 0) {
      saldosARegistrar.push({ clave: agenteClave, saldo: saldoActualRedondeado });
    } else if (saldoPendiente < 0 && saldoActualRedondeado >= 0) {
      // Si saldo inicial era negativo y ahora es positivo o cero, registrar saldo 0
      saldosARegistrar.push({ clave: agenteClave, saldo: 0 });
    }
  }

  // Procesar supervisores
  for (const [supervisor, items] of Object.entries(recibosPorSupervisor)) {
    const totalComision = items.reduce((sum, item) => sum + (item.comision || 0), 0);
    // SIEMPRE usar 0 si no hay saldo pendiente (no depender de saldosPendientesPorClave)
    const saldoPendiente = saldosPendientesPorClave[supervisor] || 0;
    const saldoActual = Number(saldoPendiente) + Number(totalComision);
    // Redondear saldo actual a 2 decimales
    const saldoActualRedondeado = Math.round(saldoActual * 100) / 100;


    // Si saldo actual es negativo, SIEMPRE registrar (sin importar si tenía saldo anterior)
    if (saldoActualRedondeado < 0) {
      saldosARegistrar.push({ clave: supervisor, saldo: saldoActualRedondeado });
    } else if (saldoPendiente < 0 && saldoActualRedondeado >= 0) {
      // Si saldo inicial era negativo y ahora es positivo o cero, registrar saldo 0
      saldosARegistrar.push({ clave: supervisor, saldo: 0 });
    }
  }

  // Agregar saldos pendientes negativos para claves que no tuvieron recibos en el corte
  // pero sí tienen saldo pendiente negativo (evitar duplicados)
  const clavesProcesadas = new Set(saldosARegistrar.map(s => String(s.clave)));
  for (const [clave, saldoPendiente] of Object.entries(saldosPendientesPorClave)) {
    if (saldoPendiente < 0 && !clavesProcesadas.has(String(clave))) {
      saldosARegistrar.push({ clave, saldo: saldoPendiente });
    }
  }

  console.log('Saldos a registrar:', saldosARegistrar);

  if (saldosARegistrar.length === 0) {
    console.log("No hay saldos negativos para registrar - esto es normal cuando todos los saldos son positivos o cero");
    return { success: true, registrados: 0, mensaje: "No hay saldos negativos para actualizar" };
  }

  // Buscar id de usuario por clave
  const resUsers = await fetch('/api/users');
  const users = await resUsers.json();
  const clavesNoEncontradas = [];

  for (const s of saldosARegistrar) {
    const user = users.find(u => String(u.clave) === String(s.clave));
    if (!user) {
      console.warn(`No existe usuario con clave ${s.clave} para registrar saldo pendiente de ${s.saldo}`);
      clavesNoEncontradas.push(s.clave);
      continue;
    }

    // Crear el saldo pendiente en la base de datos
    const resp = await fetch('/api/saldos-pendientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha: fechaSiguienteCorte.toISOString(),
        saldo: s.saldo,
        agenteId: user.id,
        observaciones: 'Actualización automática de saldo',
      })
    });
    const respJson = await resp.json();
    console.log(`Respuesta backend para clave ${s.clave}:`, respJson);
  }

  if (clavesNoEncontradas.length > 0) {
    throw new Error('No se pudo registrar saldo pendiente para las siguientes claves porque no existen en la base de usuarios: ' + clavesNoEncontradas.join(', '));
  }

  return { success: true, registrados: saldosARegistrar.length };
}
