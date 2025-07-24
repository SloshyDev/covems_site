// Utilidades para comisiones en el backend (idéntico a comisiones.js pero solo lo necesario)
export function getComisionSupervisorRecibo(row) {
  // Índices fijos según ReciboCard.js
  const dsn = String(row[9] || '').toUpperCase();
  if (!(dsn.includes('EMI') || dsn.includes('CAN'))) {
    return 0;
  }
  const formaPago = String(row[22] || '').toUpperCase();
  const primaFracc = Number(row[15]);
  const recargoFijo = Number(row[16]);
  let factor = 1;
  if (formaPago === 'H') factor = 24;
  else if (formaPago === 'M') factor = 12;
  if (isNaN(primaFracc) || isNaN(recargoFijo)) return 0;
  const base = (primaFracc - recargoFijo) * factor;
  let valor = base * 0.07;
  if (dsn.includes('CAN')) valor = -Math.abs(valor);
  return valor;
}
