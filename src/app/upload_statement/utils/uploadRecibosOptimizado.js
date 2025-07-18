// utils/uploadRecibosOptimizado.js
import { uploadRecibosBatch } from "./apiUploadRecibos";
import { getComisionMontoRecibo, getComisionAgenteRecibo, getComisionSupervisorRecibo } from "./comisiones";

/**
 * Configuración para el procesamiento por lotes
 */
const BATCH_CONFIG = {
  BATCH_SIZE: 25, // Recibos por lote (ajustable según rendimiento del servidor)
  DELAY_BETWEEN_BATCHES: 100, // ms de espera entre lotes para no sobrecargar
  MAX_RETRIES: 3, // Reintentos por lote en caso de error
  RETRY_DELAY: 1000 // ms de espera antes de reintentar
};

/**
 * Invalida el caché de recibos después de subir nuevos datos
 */
async function invalidarCacheRecibos() {
  try {
    const { invalidarCacheRecibos } = await import("../../view_statements/utils/cacheManager");
    invalidarCacheRecibos();
  } catch (error) {
    console.warn('No se pudo invalidar el caché de recibos:', error);
  }
}

/**
 * Divide un array en lotes del tamaño especificado
 */
function dividirEnLotes(array, tamanoLote) {
  const lotes = [];
  for (let i = 0; i < array.length; i += tamanoLote) {
    lotes.push(array.slice(i, i + tamanoLote));
  }
  return lotes;
}

/**
 * Sube un lote con reintentos automáticos
 */
async function subirLoteConReintentos(lote, numeroLote, totalLotes, onProgress) {
  let ultimoError = null;
  
  for (let intento = 1; intento <= BATCH_CONFIG.MAX_RETRIES; intento++) {
    try {
      const resultado = await uploadRecibosBatch(lote);
      
      if (resultado.ok) {
        // Actualizar progreso
        if (onProgress) {
          onProgress({
            loteActual: numeroLote,
            totalLotes,
            recibosEnLote: lote.length,
            recibosProcesados: numeroLote * BATCH_CONFIG.BATCH_SIZE,
            porcentaje: Math.round((numeroLote / totalLotes) * 100),
            estado: 'completado',
            intento: intento,
            recibosCreadosEnLote: resultado.creados || lote.length
          });
        }
        
        return { ok: true, creados: resultado.creados || lote.length };
      } else {
        ultimoError = resultado.error || 'Error desconocido';
      }
    } catch (error) {
      ultimoError = error.message;
    }
    
    // Si no es el último intento, esperar antes de reintentar
    if (intento < BATCH_CONFIG.MAX_RETRIES) {
      if (onProgress) {
        onProgress({
          loteActual: numeroLote,
          totalLotes,
          recibosEnLote: lote.length,
          porcentaje: Math.round(((numeroLote - 1) / totalLotes) * 100),
          estado: 'reintentando',
          intento: intento + 1,
          error: ultimoError
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.RETRY_DELAY));
    }
  }
  
  // Si llegamos aquí, todos los reintentos fallaron
  throw new Error(`Error en lote ${numeroLote} después de ${BATCH_CONFIG.MAX_RETRIES} intentos: ${ultimoError}`);
}

/**
 * Extrae todos los recibos de los datos de agentes con cálculo de comisiones
 */
function getAllRecibos(agentesData) {
  const allRecibos = [];
  
  agentesData.forEach(agente => {
    const { agenteClave, polizas, headers } = agente;
    
    // Buscar índices de las columnas importantes
    const noPolizaIdx = headers.findIndex(h => h === "No. Poliza");
    const anioVigIdx = headers.findIndex(h => h === "Año Vig.");
    const dsnIdx = headers.findIndex(h => h === "Dsn");
    const formaPagoIdx = headers.findIndex(h => h === "Forma de pago");
    const primaFraccIdx = headers.findIndex(h => h === "Prima Fracc");
    const recargoFijoIdx = headers.findIndex(h => h === "Recargo Fijo");
    const importeCombleIdx = headers.findIndex(h => h === "Importe Comble");
    const comisIdx = headers.findIndex(h => h === "% Comis");
    
    Object.entries(polizas).forEach(([noPoliza, recibosPoliza]) => {
      recibosPoliza.forEach(recibo => {
        // Crear objeto recibo base con todos los campos
        const reciboObj = {};
        headers.forEach((header, idx) => {
          reciboObj[header] = recibo[idx];
        });
        
        // Agregar clave del agente
        reciboObj["Clave Agente"] = agenteClave;
        
        // Calcular comisiones
        const anioVigRecibo = anioVigIdx !== -1 ? recibo[anioVigIdx] : null;
        
        const comisionPromotoria = getComisionMontoRecibo(recibo, {
          nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
          comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año')),
          importeCombleIdx,
          comisIdx
        });
        
        const comisionAgente = getComisionAgenteRecibo(recibo, {
          dsnIdx,
          formaPagoIdx,
          primaFraccIdx,
          recargoFijoIdx,
          importeCombleIdx,
          comisIdx,
          nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
          comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año'))
        }, agenteClave, anioVigRecibo);
        
        const comisionSupervisor = getComisionSupervisorRecibo(recibo, {
          dsnIdx,
          formaPagoIdx,
          primaFraccIdx,
          recargoFijoIdx
        });
        
        // Agregar campos de comisión calculados
        reciboObj["comisPromotoria"] = comisionPromotoria.valor;
        reciboObj["comisAgente"] = comisionAgente.valor;
        reciboObj["comisSupervisor"] = comisionSupervisor.valor;
        reciboObj["pctComisAgente"] = comisionAgente.valor !== null ? 7 : null;
        reciboObj["pctComisSupervisor"] = comisionSupervisor.valor !== null ? 7 : null;
        
        allRecibos.push(reciboObj);
      });
    });
  });
  
  return allRecibos;
}

/**
 * Sube todos los recibos usando procesamiento por lotes optimizado con progreso en tiempo real
 * @param {Array} agentesData - Datos de agentes con sus pólizas y recibos
 * @param {string} fechaInicio - Fecha de inicio del corte
 * @param {string} fechaFin - Fecha de fin del corte
 * @param {boolean} procesarSaldosAutomaticamente - Si procesar saldos automáticamente
 * @param {Function} onProgress - Callback para reportar progreso
 * @returns {Promise<Object>} - Resultado del upload con estadísticas detalladas
 */
export async function uploadAllRecibosOptimizado(
  agentesData, 
  fechaInicio = null, 
  fechaFin = null, 
  procesarSaldosAutomaticamente = false,
  onProgress = null
) {
  const tiempoInicio = Date.now();
  
  try {
    // Extraer todos los recibos
    const recibos = getAllRecibos(agentesData);
    const totalRecibos = recibos.length;
    
    if (totalRecibos === 0) {
      return { ok: false, error: 'No hay recibos para procesar' };
    }
    
    console.log(`🚀 Iniciando carga optimizada de ${totalRecibos} recibos en lotes de ${BATCH_CONFIG.BATCH_SIZE}`);
    
    // Dividir en lotes
    const lotes = dividirEnLotes(recibos, BATCH_CONFIG.BATCH_SIZE);
    const totalLotes = lotes.length;
    
    let totalCreadosExitosos = 0;
    let erroresEnLotes = [];
    
    // Reportar inicio
    if (onProgress) {
      onProgress({
        totalRecibos,
        totalLotes,
        loteActual: 0,
        recibosProcesados: 0,
        porcentaje: 0,
        estado: 'iniciando',
        estimacionTiempoRestante: null
      });
    }
    
    // Procesar cada lote secuencialmente
    for (let i = 0; i < lotes.length; i++) {
      const lote = lotes[i];
      const numeroLote = i + 1;
      
      try {
        // Reportar progreso del lote actual
        if (onProgress) {
          onProgress({
            totalRecibos,
            totalLotes,
            loteActual: numeroLote,
            recibosEnLote: lote.length,
            recibosProcesados: i * BATCH_CONFIG.BATCH_SIZE,
            porcentaje: Math.round((i / totalLotes) * 100),
            estado: 'procesando',
            tiempoTranscurrido: Date.now() - tiempoInicio,
            estimacionTiempoRestante: i > 0 ? Math.round(((Date.now() - tiempoInicio) / i) * (totalLotes - i)) : null
          });
        }
        
        // Subir lote con reintentos
        const resultadoLote = await subirLoteConReintentos(lote, numeroLote, totalLotes, onProgress);
        totalCreadosExitosos += resultadoLote.creados;
        
        // Pequeña pausa entre lotes para no sobrecargar el servidor
        if (i < lotes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.DELAY_BETWEEN_BATCHES));
        }
        
      } catch (error) {
        console.error(`❌ Error en lote ${numeroLote}:`, error.message);
        erroresEnLotes.push({
          lote: numeroLote,
          recibos: lote.length,
          error: error.message
        });
        
        // Reportar error en el lote
        if (onProgress) {
          onProgress({
            totalRecibos,
            totalLotes,
            loteActual: numeroLote,
            recibosEnLote: lote.length,
            recibosProcesados: i * BATCH_CONFIG.BATCH_SIZE,
            porcentaje: Math.round((i / totalLotes) * 100),
            estado: 'error',
            error: error.message
          });
        }
      }
    }
    
    const tiempoTotal = Date.now() - tiempoInicio;
    
    // Preparar resultado final
    const resultado = {
      ok: totalCreadosExitosos > 0,
      totalRecibos,
      creados: totalCreadosExitosos,
      errores: erroresEnLotes,
      lotesProcesados: totalLotes,
      lotesExitosos: totalLotes - erroresEnLotes.length,
      tiempoTotal,
      velocidadPromedio: Math.round(totalCreadosExitosos / (tiempoTotal / 1000)), // recibos por segundo
      estadisticas: {
        recibosExitosos: totalCreadosExitosos,
        recibosFallidos: totalRecibos - totalCreadosExitosos,
        tasaExito: Math.round((totalCreadosExitosos / totalRecibos) * 100),
        tiempoPromedioporLote: Math.round(tiempoTotal / totalLotes)
      }
    };
    
    // Reportar finalización
    if (onProgress) {
      onProgress({
        totalRecibos,
        totalLotes,
        loteActual: totalLotes,
        recibosProcesados: totalCreadosExitosos,
        porcentaje: 100,
        estado: resultado.ok ? 'completado' : 'completado_con_errores',
        tiempoTotal,
        resultado
      });
    }
      // Invalidar caché si hubo éxito
    if (resultado.ok) {
      console.log('🔄 Invalidando caché de recibos después de cargar estado de cuenta...');
      await invalidarCacheRecibos();
    }

    console.log(`✅ Carga completada: ${totalCreadosExitosos}/${totalRecibos} recibos en ${Math.round(tiempoTotal/1000)}s`);
    return resultado;
    
  } catch (error) {
    console.error('❌ Error crítico en uploadAllRecibosOptimizado:', error);
    
    if (onProgress) {
      onProgress({
        estado: 'error_critico',
        error: error.message,
        porcentaje: 0
      });
    }
    
    return {
      ok: false,
      error: error.message,
      tiempoTotal: Date.now() - tiempoInicio
    };
  }
}
