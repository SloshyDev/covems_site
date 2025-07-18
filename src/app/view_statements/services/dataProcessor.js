import { filtrarRecibosPorCorte } from "../utils/dataUtils";
import { procesarRecibosNormales } from "./reciboProcessor";

// Función simplificada para procesar datos (solo recibos, sin saldos)
export const procesarDatosCompletos = (
  recibos,
  usuarios,
  saldosPendientes, // Mantenemos el parámetro para compatibilidad
  corte,
  selectedYear,
  selectedMonth
) => {
  // Filtrar recibos por corte
  const filteredRecibos = filtrarRecibosPorCorte(recibos, corte, selectedYear, selectedMonth);

  // Procesar solo recibos normales
  const { grouped, supervisores, supervisoresRec } = procesarRecibosNormales(filteredRecibos, usuarios);

  return {
    agentesData: grouped,
    supervisoresData: supervisores,
    supervisoresRecibos: supervisoresRec,
    filteredRecibos
  };
};
