// Utilidad para filtrar recibos por corte
export const filtrarRecibosPorCorte = (recibos, corte, selectedYear, selectedMonth) => {
  if (recibos.length === 0) return [];
  
  return recibos.filter(recibo => {
    if (!recibo.fechaMovimiento) return false;
    const fecha = new Date(recibo.fechaMovimiento);
    return (
      fecha.getFullYear() === selectedYear &&
      fecha.getMonth() + 1 === selectedMonth &&
      fecha.getDate() >= corte.inicio && fecha.getDate() <= corte.fin
    );
  });
};

// Utilidad para filtrar saldos pendientes por corte
export const filtrarSaldosPendientesPorCorte = (saldosPendientes, corte, selectedYear, selectedMonth) => {
  return saldosPendientes.filter(s => {
    if (!s.fecha) return false;
    const fecha = new Date(s.fecha);
    return (
      fecha.getFullYear() === selectedYear &&
      fecha.getMonth() + 1 === selectedMonth &&
      fecha.getDate() >= corte.inicio && fecha.getDate() <= corte.fin
    );
  });
};

// Utilidad para crear recibo sintético de saldo pendiente
export const crearReciboSintético = (saldo, agente, tipo = "agente") => {
  const idPrefix = tipo === "supervisor" ? "saldo-supervisor" : "saldo";
  return {
    id: `${idPrefix}-${saldo.id}`,
    tipo: "Saldo Pendiente",
    fechaMovimiento: saldo.fecha,
    primaFracc: 0,
    comisPromotoria: 0,
    comisAgente: tipo === "supervisor" ? 0 : saldo.saldo, // Para agentes, el saldo va en comisAgente
    comisSupervisor: tipo === "supervisor" ? saldo.saldo : 0, // Para supervisores, el saldo va en comisSupervisor
    claveAgente: agente.clave,
    nombreAsegurado: "SALDO PENDIENTE",
    recibo: "SALDO",
    observaciones: saldo.observaciones || "Saldo pendiente registrado",
    esSaldoPendiente: true
  };
};

// Utilidad para crear estructura inicial de datos de agente/supervisor
export const crearEstructuraInicial = () => ({
  recibos: [],
  totalComisPromotoria: 0,
  totalComisAgente: 0,
  totalComisSupervisor: 0,
  totalPrimaFracc: 0
});
