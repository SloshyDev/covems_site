// Servicio unificado para saldos pendientes con caché
// Centraliza todas las operaciones de saldos pendientes para evitar llamadas redundantes

import { 
  obtenerSaldosPendientesDesdeCache, 
  guardarSaldosPendientesEnCache,
  verificarDuplicidadSaldoPendiente,
  agregarSaldoPendienteAlCache,
  esCacheValido
} from './saldosPendientesCache';

/**
 * Obtiene los saldos pendientes, preferiblemente desde caché
 * @param {boolean} forceRefresh - Forzar actualización desde API
 * @returns {Promise<Array>} Array de saldos pendientes
 */
export async function obtenerSaldosPendientes(forceRefresh = false) {
  // Si no es refresh forzado y el caché es válido, usar caché
  if (!forceRefresh && esCacheValido()) {
    const saldosCache = obtenerSaldosPendientesDesdeCache();
    console.log(`✅ Saldos pendientes obtenidos desde caché (${saldosCache.length} registros)`);
    return saldosCache;
  }
  
  // Cargar desde API y actualizar caché
  console.log('🌐 Cargando saldos pendientes desde API...');
  try {
    const response = await fetch('/api/saldos-pendientes');
    if (!response.ok) {
      throw new Error('Error al cargar saldos pendientes desde API');
    }
    
    const data = await response.json();
    const saldos = data.saldos || [];
    
    // Guardar en caché
    guardarSaldosPendientesEnCache(saldos);
    
    console.log(`✅ Saldos pendientes cargados desde API y guardados en caché (${saldos.length} registros)`);
    return saldos;
  } catch (error) {
    console.error('Error cargando saldos pendientes desde API:', error);
    
    // En caso de error, intentar usar caché como fallback
    const saldosCache = obtenerSaldosPendientesDesdeCache();
    if (saldosCache.length > 0) {
      console.log(`⚠️ Usando saldos del caché como fallback (${saldosCache.length} registros)`);
      return saldosCache;
    }
    
    return [];
  }
}

/**
 * Crea un nuevo saldo pendiente con verificación de duplicidad
 * @param {Object} saldoData - Datos del saldo pendiente
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function crearSaldoPendienteSeguro(saldoData) {
  const { fecha, saldo, agenteId, observaciones } = saldoData;
  
  // Verificar duplicidad usando caché
  const esDuplicado = verificarDuplicidadSaldoPendiente(agenteId, fecha, saldo);
  
  if (esDuplicado) {
    console.log(`⚠️ Saldo pendiente duplicado detectado para agente ${agenteId}. Omitiendo creación.`);
    return { 
      success: false, 
      error: 'Saldo pendiente duplicado detectado',
      isDuplicate: true 
    };
  }
  
  try {
    console.log('📤 Creando saldo pendiente:', saldoData);
    
    const response = await fetch('/api/saldos-pendientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saldoData)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error al crear saldo pendiente:', errorData);
      return { 
        success: false, 
        error: `Error al crear saldo pendiente: ${response.status} - ${errorData}` 
      };
    }
    
    const resultado = await response.json();
    
    // Añadir al caché local
    if (resultado.saldo) {
      agregarSaldoPendienteAlCache(resultado.saldo);
      console.log('✅ Nuevo saldo pendiente creado y añadido al caché');
    }
    
    return { success: true, data: resultado };
  } catch (error) {
    console.error('Error creando saldo pendiente:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene saldos pendientes de un agente específico
 * @param {number} agenteId - ID del agente
 * @returns {Array} Saldos pendientes del agente
 */
export function obtenerSaldosPorAgente(agenteId) {
  const saldos = obtenerSaldosPendientesDesdeCache();
  return saldos.filter(saldo => saldo.agente.id === agenteId);
}

/**
 * Obtiene saldos pendientes anteriores a una fecha
 * @param {number} agenteId - ID del agente
 * @param {string} fechaLimite - Fecha límite en formato YYYY-MM-DD
 * @returns {Array} Saldos pendientes anteriores a la fecha
 */
export function obtenerSaldosAnteriores(agenteId, fechaLimite) {
  const saldos = obtenerSaldosPendientesDesdeCache();
  const fechaLimiteDate = new Date(fechaLimite);
  
  return saldos.filter(saldo => {
    if (saldo.agente.id !== agenteId) return false;
    const fechaSaldo = new Date(saldo.fecha);
    return fechaSaldo < fechaLimiteDate;
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

/**
 * Verifica si existe un saldo pendiente para una fecha específica
 * @param {number} agenteId - ID del agente
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {Object|null} El saldo existente o null
 */
export function verificarSaldoEnFecha(agenteId, fecha) {
  const saldos = obtenerSaldosPendientesDesdeCache();
  const fechaBuscada = new Date(fecha).toDateString();
  
  return saldos.find(saldo => 
    saldo.agente.id === agenteId && 
    new Date(saldo.fecha).toDateString() === fechaBuscada
  ) || null;
}

/**
 * Invalida el caché de saldos pendientes (útil después de operaciones críticas)
 */
export function invalidarCacheSaldos() {
  try {
    localStorage.removeItem('covems_saldos_pendientes_cache');
    localStorage.removeItem('covems_saldos_pendientes_timestamp');
    console.log('🗑️ Caché de saldos pendientes invalidado');
  } catch (error) {
    console.error('Error invalidando caché de saldos:', error);
  }
}

/**
 * Función de utilidad para debug del estado del servicio
 */
export function debugServicioSaldos() {
  const saldos = obtenerSaldosPendientesDesdeCache();
  const cacheValido = esCacheValido();
  
  console.log('🔍 Estado del servicio de saldos pendientes:', {
    cantidadSaldos: saldos.length,
    cacheValido,
    ultimosSaldos: saldos.slice(0, 5).map(s => ({
      agente: s.agente?.clave,
      fecha: s.fecha,
      saldo: s.saldo
    }))
  });
  
  return { saldos, cacheValido };
}

// Hacer funciones disponibles globalmente para debug
if (typeof window !== 'undefined') {
  window.debugServicioSaldos = debugServicioSaldos;
  window.invalidarCacheSaldos = invalidarCacheSaldos;
}
