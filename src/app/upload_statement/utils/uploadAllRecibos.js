// utils/uploadAllRecibos.js
import { uploadRecibosBatch } from "./apiUploadRecibos";
import { getComisionMontoRecibo, getComisionAgenteRecibo, getComisionSupervisorRecibo } from "./comisiones";

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
 * Invalida el caché de saldos pendientes después de procesarlos
 */
async function invalidarCacheSaldosPendientes() {
  try {
    // Importación dinámica para evitar problemas en SSR
    const { invalidarCacheSaldosPendientes } = await import("../../view_statements/utils/cacheManager");
    invalidarCacheSaldosPendientes();
  } catch (error) {
    console.warn('No se pudo invalidar el caché de saldos pendientes:', error);
  }
}

/**
 * Procesa automáticamente los saldos pendientes después de cargar estados de cuenta
 * @param {string} fechaInicio - Fecha de inicio del corte
 * @param {string} fechaFin - Fecha de fin del corte
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
async function procesarSaldosPendientesPostCarga(fechaInicio, fechaFin) {
  try {
    console.log('🔄 Iniciando procesamiento automático de saldos pendientes...');
    
    // Importar las funciones necesarias
    const { procesarSaldosSoloCalculo } = await import("../../view_statements/utils/procesamientoSaldos");
    
    // Obtener los datos necesarios para el procesamiento
    // Simulamos la obtención de datos como en view_statements
    const response = await Promise.all([
      fetch('/api/users'),
      fetch('/api/recibo'),
      fetch('/api/saldos-pendientes')
    ]);
    
    const [usuariosRes, recibosRes, saldosRes] = response;
    
    if (!usuariosRes.ok || !recibosRes.ok || !saldosRes.ok) {
      throw new Error('Error obteniendo datos para procesamiento de saldos');
    }
    
    const [usuarios, recibos, saldosPendientes] = await Promise.all([
      usuariosRes.json(),
      recibosRes.json(),
      saldosRes.json()
    ]);
    
    // Filtrar recibos por el corte actual
    const recibosFiltrados = recibos.filter(recibo => {
      if (!recibo.fechaInicioVigencia) return false;
      
      try {
        const fechaRecibo = new Date(recibo.fechaInicioVigencia);
        const fechaInicioCorte = new Date(fechaInicio + 'T00:00:00');
        const fechaFinCorte = new Date(fechaFin + 'T23:59:59');
        
        return fechaRecibo >= fechaInicioCorte && fechaRecibo <= fechaFinCorte;
      } catch (error) {
        console.warn('Error procesando fecha de recibo:', recibo.fechaInicioVigencia);
        return false;
      }
    });
    
    // Obtener claves activas (usuarios que aparecen en los recibos del corte)
    const clavesActivos = [...new Set(
      recibosFiltrados
        .map(r => r.claveAgente)
        .filter(clave => clave && clave !== 'Sin agente')
        .map(String)
    )];
    
    // Procesar datos para obtener agentesData y supervisoresRecibos (simplificado)
    const { procesarDatosCompletos } = await import("../../view_statements/services/dataProcessor");
    
    // Crear objeto de corte en el formato esperado
    const [anio, mes, diaInicio] = fechaInicio.split('-').map(Number);
    const [, , diaFin] = fechaFin.split('-').map(Number);
    
    const corte = { 
      inicio: diaInicio, 
      fin: diaFin 
    };
    
    console.log('📊 Procesando datos para saldos automáticos:', {
      corte,
      anio,
      mes,
      totalRecibos: recibos.length,
      recibosFiltrados: recibosFiltrados.length,
      clavesActivos: clavesActivos.length
    });
    const resultado = procesarDatosCompletos(
      recibos,
      usuarios,
      saldosPendientes,
      corte,
      anio,
      mes
    );
    
    // Procesar saldos pendientes
    const resultadoSaldos = await procesarSaldosSoloCalculo({
      agentesData: resultado.agentesData,
      supervisoresRecibos: resultado.supervisoresRecibos,
      usuarios,
      clavesActivos,
      fechaInicio,
      fechaFin
    });
    
    console.log('✅ Procesamiento automático de saldos completado:', {
      totalProcesados: resultadoSaldos.totalProcesados,
      saldosCreados: resultadoSaldos.saldosCreados
    });
    
    return resultadoSaldos;
    
  } catch (error) {
    console.error('❌ Error en procesamiento automático de saldos:', error);
    return {
      ok: false,
      error: error.message,
      procesamientoAutomatico: true
    };
  }
}

/**
 * Junta todos los recibos de todos los agentes y los sube en lote.
 * @param {Array<{ agenteClave: string, polizas: object, headers: string[] }>} agentesData
 * @returns {Promise<{ok: boolean, creados?: number, error?: string}>}
 */
export function getAllRecibos(agentesData) {
  const allRecibos = [];
  agentesData.forEach(({ agenteClave, polizas, headers }) => {
    Object.entries(polizas).forEach(([poliza, rows]) => {
      rows.forEach(row => {
        const reciboObj = {};
        headers.forEach((header, idx) => {
          let val = row[idx];
          if (val === undefined || val === "") val = null;
          reciboObj[header] = val;
        });
        
        // Usar la clave del agente del contexto del mapeo, que ya se extrajo correctamente desde la BD
        reciboObj["Clave Agente"] = agenteClave !== "Sin agente" ? agenteClave : null;
        reciboObj["claveAgente"] = agenteClave !== "Sin agente" ? agenteClave : null;
        
        // Calcular comisiones igual que en AgenteCard
        const comisIdx = headers.findIndex(h => h.toLowerCase() === '% comis');
        const anioVigIdx = headers.findIndex(h => h.toLowerCase() === 'año vig.');
        const anioVigRecibo = anioVigIdx !== -1 ? row[anioVigIdx] : null;
        
        const comisionMonto = getComisionMontoRecibo(row, {
          nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
          comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año')),
          importeCombleIdx: headers.findIndex(h => h.toLowerCase() === 'importe comble'),
          comisIdx
        });
        
        const comisionAgente = getComisionAgenteRecibo(row, {
          dsnIdx: headers.findIndex(h => h.toLowerCase() === 'dsn'),
          formaPagoIdx: headers.findIndex(h => h.toLowerCase() === 'forma de pago'),
          primaFraccIdx: headers.findIndex(h => h.toLowerCase() === 'prima fracc'),
          recargoFijoIdx: headers.findIndex(h => h.toLowerCase() === 'recargo fijo'),
          importeCombleIdx: headers.findIndex(h => h.toLowerCase() === 'importe comble'),
          comisIdx,
          nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
          comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año'))
        }, agenteClave, anioVigRecibo);
        
        const comisionSupervisor = getComisionSupervisorRecibo(row, {
          dsnIdx: headers.findIndex(h => h.toLowerCase() === 'dsn'),
          formaPagoIdx: headers.findIndex(h => h.toLowerCase() === 'forma de pago'),
          primaFraccIdx: headers.findIndex(h => h.toLowerCase() === 'prima fracc'),
          recargoFijoIdx: headers.findIndex(h => h.toLowerCase() === 'recargo fijo')
        });
        
        reciboObj["pctComisPromotoria"] = comisIdx !== -1 ? row[comisIdx] : null;
        reciboObj["comisPromotoria"] = comisionMonto.valor;
        reciboObj["pctComisAgente"] = comisionAgente.porcentaje;
        reciboObj["comisAgente"] = comisionAgente.valor;
        reciboObj["comisSupervisor"] = comisionSupervisor.valor;
        reciboObj["pctComisSupervisor"] = comisionSupervisor.valor !== null ? 7 : null;
        
        allRecibos.push(reciboObj);
      });
    });
  });
  return allRecibos;
}

export async function uploadAllRecibos(agentesData, fechaInicio = null, fechaFin = null, procesarSaldosAutomaticamente = false) {
  const recibos = getAllRecibos(agentesData);
  const resultado = await uploadRecibosBatch(recibos);
  
  // Invalidar caché de recibos después de la carga exitosa
  if (resultado.ok) {
    console.log('🔄 Invalidando caché de recibos después de cargar estado de cuenta...');
    await invalidarCacheRecibos();
    
    // Procesar saldos pendientes automáticamente si se solicita
    if (procesarSaldosAutomaticamente && fechaInicio && fechaFin) {
      console.log('🚀 Iniciando procesamiento automático de saldos pendientes...');
      
      try {
        const resultadoSaldos = await procesarSaldosPendientesPostCarga(fechaInicio, fechaFin);
        
        // Agregar información del procesamiento de saldos al resultado
        resultado.procesamientoSaldos = {
          realizado: true,
          ...resultadoSaldos
        };
        
        if (resultadoSaldos.ok) {
          console.log('✅ Saldos pendientes procesados automáticamente:', {
            totalProcesados: resultadoSaldos.totalProcesados,
            saldosCreados: resultadoSaldos.saldosCreados
          });
        } else {
          console.warn('⚠️ Error en procesamiento automático de saldos:', resultadoSaldos.error);
        }
        
      } catch (error) {
        console.error('❌ Error durante procesamiento automático de saldos:', error);
        resultado.procesamientoSaldos = {
          realizado: false,
          error: error.message
        };
      }
    }
  }
  
  return resultado;
}
