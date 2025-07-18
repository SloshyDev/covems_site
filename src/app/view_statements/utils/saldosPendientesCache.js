// Servicio de caché para saldos pendientes
// Maneja la verificación de duplicidad y optimización de llamadas API

const CACHE_KEY = 'covems_saldos_pendientes_cache';
const CACHE_TIMESTAMP_KEY = 'covems_saldos_pendientes_timestamp';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

/**
 * Obtiene los saldos pendientes desde el caché
 * @returns {Array} Array de saldos pendientes desde localStorage
 */
export function obtenerSaldosPendientesDesdeCache() {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && timestamp) {
      const now = new Date().getTime();
      const cacheTime = parseInt(timestamp);
      
      // Verificar si el caché no ha expirado
      if (now - cacheTime < CACHE_DURATION) {
        const data = JSON.parse(cachedData);
        console.log('✅ Saldos pendientes obtenidos desde caché');
        return data || [];
      }
    }
  } catch (err) {
    console.error('Error obteniendo saldos pendientes desde caché:', err);
  }
  
  return [];
}

/**
 * Guarda los saldos pendientes en el caché
 * @param {Array} saldos - Array de saldos pendientes a guardar
 */
export function guardarSaldosPendientesEnCache(saldos) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(saldos));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
    console.log('💾 Saldos pendientes guardados en caché');
  } catch (err) {
    console.error('Error guardando saldos pendientes en caché:', err);
  }
}

/**
 * Verifica si ya existe un saldo pendiente similar para evitar duplicados
 * @param {number} agenteId - ID del agente
 * @param {string} fecha - Fecha del saldo pendiente
 * @param {number} saldo - Monto del saldo
 * @returns {boolean} True si ya existe un saldo similar
 */
export function verificarDuplicidadSaldoPendiente(agenteId, fecha, saldo) {
  const saldosCache = obtenerSaldosPendientesDesdeCache();
  const fechaComparacion = new Date(fecha).toDateString();
  
  const duplicado = saldosCache.some(saldoExistente => 
    saldoExistente.agente.id === agenteId && 
    new Date(saldoExistente.fecha).toDateString() === fechaComparacion &&
    Math.abs(saldoExistente.saldo - saldo) < 0.01 // Tolerancia para decimales
  );
  
  if (duplicado) {
    console.log(`⚠️ Saldo pendiente duplicado detectado para agente ${agenteId} en fecha ${fecha}`);
  }
  
  return duplicado;
}

/**
 * Obtiene saldos pendientes previos de un agente antes de una fecha específica
 * @param {number} agenteId - ID del agente
 * @param {string} fechaInicio - Fecha de inicio del corte en formato YYYY-MM-DD
 * @returns {Array} Array de saldos pendientes previos ordenados por fecha descendente
 */
export function obtenerSaldosPreviosDesdeCache(agenteId, fechaInicio) {
  const saldosCache = obtenerSaldosPendientesDesdeCache();
  const fechaInicioDate = new Date(fechaInicio);
  
  return saldosCache.filter(saldo => {
    if (saldo.agente.id !== agenteId) return false;
    const fechaSaldo = new Date(saldo.fecha);
    return fechaSaldo < fechaInicioDate;
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

/**
 * Añade un nuevo saldo pendiente al caché local
 * @param {Object} nuevoSaldo - Nuevo saldo pendiente a añadir
 */
export function agregarSaldoPendienteAlCache(nuevoSaldo) {
  try {
    const saldosActuales = obtenerSaldosPendientesDesdeCache();
    const nuevosData = [nuevoSaldo, ...saldosActuales];
    guardarSaldosPendientesEnCache(nuevosData);
    console.log('✅ Nuevo saldo pendiente añadido al caché');
  } catch (err) {
    console.error('Error añadiendo saldo pendiente al caché:', err);
  }
}

/**
 * Verifica si el caché está disponible y no ha expirado
 * @returns {boolean} True si el caché es válido
 */
export function esCacheValido() {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const now = new Date().getTime();
    const cacheTime = parseInt(timestamp);
    
    return (now - cacheTime) < CACHE_DURATION;
  } catch {
    return false;
  }
}

/**
 * Función de debug para inspeccionar el estado del caché
 */
export function debugSaldosPendientesCache() {
  const saldos = obtenerSaldosPendientesDesdeCache();
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const isValid = esCacheValido();
  
  console.log('🔍 Estado del caché de saldos pendientes:', {
    cantidadSaldos: saldos.length,
    timestamp: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'No disponible',
    esValido: isValid,
    ultimosSaldos: saldos.slice(0, 3).map(s => ({
      agente: s.agente?.clave,
      fecha: s.fecha,
      saldo: s.saldo
    }))
  });
  
  return { saldos, isValid, count: saldos.length };
}

// Hacer disponible globalmente para debug
if (typeof window !== 'undefined') {
  window.debugSaldosPendientesCache = debugSaldosPendientesCache;
}
