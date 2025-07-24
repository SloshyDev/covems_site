// comisiones.js
// Módulo para manejar los porcentajes de comisión por agente

// Puedes agregar más agentes y reglas aquí
export const comisionesPorAgente = {
  '2': 96, // Agente 2 siempre 96%
};

export function getComisionPorcentaje(agenteClave, anioVig) {
  // Si el agente es el 1, no se le paga comisión
  if (agenteClave === '1') return 0;
  // Si el agente es el 2, siempre 96%
  if (agenteClave === '2') return 96;
  // Para los demás, depende del año de vigencia
  const anio = Number(anioVig);
  if (anio === 1) return 0;
  if (anio === 2) return 10;
  if (anio === 3) return 5;
  if (anio >= 4 && anio <= 10) return 1;
  return null;
}

/**
 * Calcula la comisión a pagar a la promotoria para un recibo.
 * Si hay valor en 'Nivelacion Variable' o 'Comis 1er Año', usa ese valor.
 * Si no, calcula: Importe Comble * (% Comis / 100)
 * @param {Array} row - Fila de datos del recibo
 * @param {Object} idxs - Índices de los campos relevantes
 * @returns {Object} { valor, tipo, fuente }
 */
export function getComisionMontoRecibo(row, idxs) {
  const nivelacion = idxs.nivelacionIdx !== -1 ? row[idxs.nivelacionIdx] : null;
  const comis1erAnio = idxs.comis1erAnioIdx !== -1 ? row[idxs.comis1erAnioIdx] : null;
  if (nivelacion && !isNaN(Number(nivelacion))) {
    return { valor: Number(nivelacion), tipo: 'nivelacion', fuente: 'Nivelación Variable' };
  }
  if (comis1erAnio && !isNaN(Number(comis1erAnio))) {
    return { valor: Number(comis1erAnio), tipo: 'comis1eranio', fuente: 'Comis 1er Año' };
  }
  const importeComble = idxs.importeCombleIdx !== -1 ? Number(row[idxs.importeCombleIdx]) : null;
  const comisPorc = idxs.comisIdx !== -1 ? Number(row[idxs.comisIdx]) : null;
  if (importeComble != null && comisPorc != null && !isNaN(importeComble) && !isNaN(comisPorc)) {
    return { valor: +(importeComble * (comisPorc / 100)), tipo: 'calculada', fuente: 'Importe Comble x % Comis' };
  }
  return { valor: null, tipo: 'ninguna', fuente: null };
}

/**
 * Calcula la comisión del agente para un recibo según reglas especiales.
 * Si DSN contiene EMI o CAN, base = (Prima Fracc - Recargo Fijo) * (24 si H, 12 si M)
 * Si no, base = Importe Comble
 * El porcentaje es el de getComisionPorcentaje(agenteClave, anioVig)
 * @param {Array} row - Fila de datos del recibo
 * @param {Object} idxs - Índices de los campos relevantes
 * @param {string} agenteClave
 * @param {string|number} anioVig
 * @returns {Object} { valor, base, porcentaje, tipo, fuente }
 */
export function getComisionAgenteRecibo(row, idxs, agenteClave, anioVig) {
  // Si el agente es 1, no se le paga comisión
  if (agenteClave === '1') {
    return {
      valor: 0,
      base: 0,
      porcentaje: 0,
      tipo: 'agente1',
      fuente: 'Sin comisión para agente 1'
    };
  }
  // Si el agente es 2, la comisión es la promotoria por su porcentaje
  if (agenteClave === '2') {
    const comisionPromotoria = getComisionMontoRecibo(row, idxs);
    const porcentaje = getComisionPorcentaje(agenteClave, anioVig);
    const valor = comisionPromotoria.valor != null && porcentaje != null ? +(comisionPromotoria.valor * (porcentaje / 100)) : null;
    return {
      valor,
      base: comisionPromotoria.valor,
      porcentaje,
      tipo: 'agente2',
      fuente: 'Comisión promotoria x %'
    };
  }
  const dsn = idxs.dsnIdx !== -1 ? String(row[idxs.dsnIdx] || '').toUpperCase() : '';
  const formaPago = idxs.formaPagoIdx !== -1 ? String(row[idxs.formaPagoIdx] || '').toUpperCase() : '';
  const primaFracc = idxs.primaFraccIdx !== -1 ? Number(row[idxs.primaFraccIdx]) : null;
  const recargoFijo = idxs.recargoFijoIdx !== -1 ? Number(row[idxs.recargoFijoIdx]) : null;
  const importeComble = idxs.importeCombleIdx !== -1 ? Number(row[idxs.importeCombleIdx]) : null;
  const porcentaje = getComisionPorcentaje(agenteClave, anioVig);
  let base = null;
  let tipo = 'normal';
  let fuente = 'Importe Comble';
  if (dsn.includes('EMI') || dsn.includes('CAN')) {
    if (primaFracc != null && recargoFijo != null) {
      let factor = 1;
      if (formaPago === 'H') factor = 24;
      else if (formaPago === 'M') factor = 12;
      base = (primaFracc - recargoFijo) * factor;
      tipo = 'especial';
      fuente = `(Prima Fracc - Recargo Fijo) x ${factor}) x 0.225`;
      let valor = base * 0.225;
      if (dsn.includes('CAN')) valor = -Math.abs(valor);
      return { valor, base, porcentaje: 22.5, tipo, fuente };
    }
  } else if (importeComble != null) {
    base = importeComble;
    fuente = 'Importe Comble x';
  }
  const valor = base != null && porcentaje != null ? +(base * (porcentaje / 100)) : null;
  return { valor, base, porcentaje, tipo, fuente };
}

/**
 * Calcula la comisión del supervisor para un recibo.
 * Solo aplica si DSN contiene EMI o CAN.
 * Base = (Prima Fracc - Recargo Fijo) * (24 si H, 12 si M, 1 en otro caso)
 * Comisión = base * 0.07. Si es CAN, el resultado es negativo.
 * @param {Array} row - Fila de datos del recibo
 * @param {Object} idxs - Índices de los campos relevantes
 * @returns {Object} { valor, base, factor, tipo, fuente }
 */
export function getComisionSupervisorRecibo(row, idxs) {
  const dsn = idxs.dsnIdx !== -1 ? String(row[idxs.dsnIdx] || '').toUpperCase() : '';
  if (!(dsn.includes('EMI') || dsn.includes('CAN'))) {
    return { valor: null, base: null, factor: null, tipo: 'no_aplica', fuente: 'Solo EMI o CAN' };
  }
  const formaPago = idxs.formaPagoIdx !== -1 ? String(row[idxs.formaPagoIdx] || '').toUpperCase() : '';
  const primaFracc = idxs.primaFraccIdx !== -1 ? Number(row[idxs.primaFraccIdx]) : null;
  const recargoFijo = idxs.recargoFijoIdx !== -1 ? Number(row[idxs.recargoFijoIdx]) : null;
  let factor = 1;
  if (formaPago === 'H') factor = 24;
  else if (formaPago === 'M') factor = 12;
  if (primaFracc == null || recargoFijo == null) {
    return { valor: null, base: null, factor, tipo: 'sin_datos', fuente: 'Faltan datos' };
  }
  const base = (primaFracc - recargoFijo) * factor;
  let valor = base * 0.07;
  if (dsn.includes('CAN')) valor = -Math.abs(valor);
  return {
    valor,
    base,
    factor,
    tipo: dsn.includes('CAN') ? 'can' : 'emi',
    fuente: `(Prima Fracc - Recargo Fijo) x ${factor} x 0.07`
  };
}
