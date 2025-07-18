// utils/apiUploadRecibos.js

/**
 * Invalida el caché de recibos después de subir nuevos datos
 */
async function invalidarCacheRecibos() {
  try {
    // Importación dinámica para evitar problemas en SSR
    const { invalidarCacheRecibos } = await import("../../view_statements/utils/cacheManager");
    invalidarCacheRecibos();
  } catch (error) {
    console.warn('No se pudo invalidar el caché de recibos:', error);
  }
}

/**
 * Sube un lote de recibos al backend usando el endpoint /api/recibo
 * @param {Array<Object>} recibos - Array de objetos recibo (campos según modelo)
 * @returns {Promise<{ok: boolean, creados?: number, error?: string}>}
 */
export async function uploadRecibosBatch(recibos) {
  // Mapea los campos al formato que espera el backend
  const recibosMapeados = recibos.map(r => ({
    poliza: r.poliza || r["No. Poliza"],
    grupo: r.grupo || r["Grupo"],
    claveAgente: r.claveAgente || r["Clave Agente"],
    fechaMovimiento: r.fechaMovimiento || r["Fecha movimiento"],
    nombreAsegurado: r.nombreAsegurado || r["Nombre Asegurado"],
    recibo: r.recibo || r["Recibo"],
    dsn: r.dsn || r["Dsn"],
    sts: r.sts || r["Sts"],
    anioVig: r.anioVig || r["Año Vig."] || r["Año Vig"],
    fechaInicio: r.fechaInicio || r["Fecha Inicio"],
    fechaVencimiento: r.fechaVencimiento || r["Fecha Vencimiento"],
    primaFracc: r.primaFracc || r["Prima Fracc"],
    recargoFijo: r.recargoFijo || r["Recargo Fijo"],
    importeComble: r.importeComble || r["Importe Comble"],
    pctComisPromotoria: r.pctComisPromotoria || r["% Comis"] || r["pctComisPromotoria"],
    comisPromotoria: r.comisPromotoria || r["comisPromotoria"],
    pctComisAgente: r.pctComisAgente || r["pctComisAgente"],
    comisAgente: r.comisAgente || r["comisAgente"],
    pctComisSupervisor: r.pctComisSupervisor || r["pctComisSupervisor"],
    comisSupervisor: r.comisSupervisor || r["comisSupervisor"],
    nivelacionVariable: r.nivelacionVariable || r["Nivelacion Variable"],
    comisPrimerAnio: r.comisPrimerAnio || r["Comis 1er Año"],
    comisRenovacion: r.comisRenovacion || r["Comis Renvovacion"] || r["Comis Renovacion"],
    formaPago: r.formaPago || r["Forma de pago"],
  }));
  try {
    const res = await fetch("/api/recibo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recibos: recibosMapeados })
    });
    const data = await res.json();
    
    // Invalidar caché de recibos después de la carga exitosa
    if (data.ok) {
      console.log('🔄 Invalidando caché de recibos después de cargar recibos...');
      await invalidarCacheRecibos();
    }
    
    return data;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Ejemplo de uso:
 *
 * import { uploadRecibosBatch } from "./apiUploadRecibos";
 *
 * async function handleUpload(recibos) {
 *   const result = await uploadRecibosBatch(recibos);
 *   if (result.ok) {
 *     alert(`Recibos subidos correctamente: ${result.creados}`);
 *   } else {
 *     alert(`Error al subir recibos: ${result.error}`);
 *   }
 * }
 */
