// utilsPagos.js
// Lógica para calcular pagos y comisiones

/**
 * Calcula la comisión de promotoria para un recibo o póliza.
 * Si hay nivelacionVariable o comisPrimerAnio, regresa ese valor (prioridad: nivelacionVariable > comisPrimerAnio).
 * Si no, calcula: importeComble * (pctComisPromotoria / 100)
 * @param {Object} params
 * @param {number|string} params.importeComble - Importe base para comisión
 * @param {number|string} params.pctComisPromotoria - Porcentaje de comisión promotoria
 * @param {number|string} [params.nivelacionVariable] - Si existe, se usa este valor
 * @param {number|string} [params.comisPrimerAnio] - Si existe y no hay nivelacionVariable, se usa este valor
 * @returns {number}
 */
export function calcularComisPromotoria({
  importeComble,
  pctComisPromotoria,
  nivelacionVariable,
  comisPrimerAnio,
}) {
  // Si hay nivelacionVariable, usarlo
  if (
    nivelacionVariable !== undefined &&
    nivelacionVariable !== null &&
    nivelacionVariable !== ""
  ) {
    const nv = Number(nivelacionVariable);
    if (!isNaN(nv)) return nv;
  }
  // Si hay comisPrimerAnio, usarlo
  if (
    comisPrimerAnio !== undefined &&
    comisPrimerAnio !== null &&
    comisPrimerAnio !== ""
  ) {
    const cpa = Number(comisPrimerAnio);
    if (!isNaN(cpa)) return cpa;
  }
  // Si no, calcular importeComble * (%comis / 100)
  const base = Number(importeComble);
  const pct = Number(pctComisPromotoria);
  if (!isNaN(base) && !isNaN(pct)) {
    return +(base * (pct / 100)).toFixed(2);
  }
  return 0;
}

/**
 * Calcula la comisión de agente para cualquier claveAgente.
 * Para clave 2: pctComisAgente = 96% (0.96), comisAgente = comisPromotoria * pctComisAgente
 * Para los demás:
 *   Si anioVig === 1 y dsn es EMI o CAN:
 *     comisAgente = (primaFracc - recargoFijo) * (24 si H, 12 si M)
 *     pctComisAgente = 0
 *   Si no:
 *     pctComisAgente depende de anioVig:
 *       1 => 0%, 2 => 10%, 3 => 5%, 4-10 => 1%
 *     comisAgente = importeComble * pctComisAgente
 * @param {Object} params
 * @param {number} params.comisPromotoria - Comisión promotoria ya calculada (solo para clave 2)
 * @param {string|number} params.claveAgente - Clave del agente
 * @param {number|string} params.anioVig - Año de vigencia
 * @param {number|string} params.importeComble - Importe base para comisión
 * @param {number|string} [params.primaFracc] - Prima fraccionada
 * @param {number|string} [params.recargoFijo] - Recargo fijo
 * @param {string} [params.dsn] - DSN
 * @param {string} [params.formaPago] - Forma de pago (H o M)
 * @returns {{ pctComisAgente: number, comisAgente: number }}
 */
export function calcularComisAgente({
  comisPromotoria,
  claveAgente,
  anioVig,
  importeComble,
  primaFracc,
  recargoFijo,
  dsn,
  formaPago,
}) {
  if (String(claveAgente) === "2") {
    const pctComisAgente = 0.96;
    const base = Number(comisPromotoria);
    return {
      pctComisAgente,
      comisAgente: !isNaN(base) ? +(base * pctComisAgente).toFixed(2) : 0,
    };
  } else {
    const anio = Number(anioVig);
    const dsnStr = String(dsn || "").toUpperCase();
    const forma = String(formaPago || "").toUpperCase();
    if (anio === 1 && (dsnStr === "EMI" || dsnStr === "CAN")) {
      const base = Number(importeComble);
      let factor = 0;
      if (forma === "H") factor = 24;
      else if (forma === "M") factor = 12;
      let comis = !isNaN(base) ? +(base * factor * 0.225).toFixed(2) : 0;
      if (dsnStr === "CAN") comis = -Math.abs(comis); // Si es CAN, resultado negativo
      return {
        pctComisAgente: 0,
        comisAgente: comis,
      };
    } else {
      let pctComisAgente = 0;
      if (anio === 1) pctComisAgente = 0;
      else if (anio === 2) pctComisAgente = 0.1;
      else if (anio === 3) pctComisAgente = 0.05;
      else if (anio >= 4 && anio <= 10) pctComisAgente = 0.01;
      const base = Number(importeComble);
      return {
        pctComisAgente,
        comisAgente: !isNaN(base) ? +(base * pctComisAgente).toFixed(2) : 0,
      };
    }
  }
}

/**
 * Calcula la comisión de supervisor.
 * Solo aplica si dsn es EMI o CAN.
 * pctComisSupervisor = 0.07
 * comisSupervisor = importeComble * (24 si H, 12 si M) * 0.07
 * Si dsn es CAN, el resultado es negativo.
 * @param {Object} params
 * @param {number|string} params.importeComble
 * @param {string} params.dsn
 * @param {string} params.formaPago
 * @returns {{ pctComisSupervisor: number, comisSupervisor: number }}
 */
export function calcularComisSupervisor({ importeComble, dsn, formaPago }) {
  const dsnStr = String(dsn || "").toUpperCase();
  if (dsnStr === "EMI" || dsnStr === "CAN") {
    const pctComisSupervisor = 0.07;
    const base = Number(importeComble);
    let factor = 0;
    const forma = String(formaPago || "").toUpperCase();
    if (forma === "H") factor = 24;
    else if (forma === "M") factor = 12;
    let comis = !isNaN(base) ? +(base * factor * pctComisSupervisor).toFixed(2) : 0;
    if (dsnStr === "CAN") comis = -Math.abs(comis);
    return {
      pctComisSupervisor,
      comisSupervisor: comis,
    };
  }
  return {
    pctComisSupervisor: 0,
    comisSupervisor: 0,
  };
}
