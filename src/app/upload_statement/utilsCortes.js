// utilsCortes.js
// Utilidad para obtener los cortes de fechas personalizados por mes

/**
 * Obtiene los cortes de fechas para pagos semanales personalizados.
 * @param {number} year - Año (ejemplo: 2025)
 * @param {number} month - Mes (1-12)
 * @returns {Array<{inicio: number, fin: number}>}
 */
export function getCortesDelMes(year, month) {
  const cortes = [];
  const date = new Date(year, month - 1, 1);

  // Primer corte: del 1 al primer martes
  let firstTuesday = 1;
  while (date.getDay() !== 2) { // 2 = martes
    date.setDate(date.getDate() + 1);
    firstTuesday++;
  }
  cortes.push({ inicio: 1, fin: firstTuesday });

  // Siguientes cortes
  let inicio = firstTuesday + 1;
  while (true) {
    let fin = inicio + 6; // martes siguiente
    const finDate = new Date(year, month - 1, fin);
    if (finDate.getMonth() !== month - 1) break; // Si se pasa del mes, termina
    cortes.push({ inicio, fin });
    inicio = fin + 1; // miércoles siguiente
  }

  // Último corte: del último miércoles hasta el último día del mes
  const lastDay = new Date(year, month, 0).getDate();
  const lastTuesday = cortes.length > 0 ? cortes[cortes.length - 1].fin : firstTuesday;
  const lastWednesday = lastTuesday + 1;
  if (lastWednesday <= lastDay) {
    cortes.push({ inicio: lastWednesday, fin: lastDay });
  }

  return cortes;
}

/**
 * Obtiene la fecha del inicio del siguiente corte
 * @param {number} year - Año actual
 * @param {number} month - Mes actual (1-12)  
 * @param {number} corteActual - Índice del corte actual (0-based)
 * @returns {Date} - Fecha del inicio del siguiente corte
 */
export function getFechaInicioSiguienteCorte(year, month, corteActual) {
  const cortesDelMes = getCortesDelMes(year, month);
  
  // Si hay un siguiente corte en el mismo mes
  if (corteActual + 1 < cortesDelMes.length) {
    const siguienteCorte = cortesDelMes[corteActual + 1];
    return new Date(year, month - 1, siguienteCorte.inicio);
  }
  
  // Si no hay más cortes en el mes, ir al primer corte del siguiente mes
  let siguienteMes = month + 1;
  let siguienteAnio = year;
  
  if (siguienteMes > 12) {
    siguienteMes = 1;
    siguienteAnio = year + 1;
  }
  
  const cortesDelSiguienteMes = getCortesDelMes(siguienteAnio, siguienteMes);
  const primerCorte = cortesDelSiguienteMes[0];
  
  return new Date(siguienteAnio, siguienteMes - 1, primerCorte.inicio);
}

/**
 * Filtra los datos por el rango de fechas del corte seleccionado.
 * @param {Array<Object>} data - Datos con campo 'fecha' (string o Date)
 * @param {{inicio: number, fin: number}} corte - Corte seleccionado
 * @returns {Array<Object>} - Datos filtrados
 */
export function filtrarPorCorte(data, corte, year, month) {
  return data.filter(row => {
    let fechaStr = "";
    if (Array.isArray(row)) {
      // Fecha en columna 2 (índice 1)
      fechaStr = row[1] || "";
    } else {
      fechaStr = row["Fecha movimiento"] || row.fecha || "";
    }
    fechaStr = fechaStr.trim().replace(/-/g, '/').replace(/\s+/g, '');
    const parts = fechaStr.split('/');
    let d;
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(fechaStr);
    }
    if (isNaN(d.getTime())) {
      return false;
    }
    const match = (
      d.getFullYear() === year &&
      d.getMonth() + 1 === month &&
      d.getDate() >= corte.inicio && d.getDate() <= corte.fin
    );
    return match;
  });
}
