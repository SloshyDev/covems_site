// Utilidad para gestión unificada de todos los cachés
// Permite limpiar, invalidar y debuggear todos los cachés desde un solo lugar

/**
 * Invalida todos los cachés del sistema
 */
export function invalidarTodosLosCaches() {
  try {
    // Cache de recibos
    localStorage.removeItem('covems_recibos_cache');
    localStorage.removeItem('covems_recibos_timestamp');
    
    // Cache de usuarios
    localStorage.removeItem('covems_usuarios_cache');
    localStorage.removeItem('covems_usuarios_timestamp');
    
    // Cache de saldos pendientes
    localStorage.removeItem('covems_saldos_pendientes_cache');
    localStorage.removeItem('covems_saldos_pendientes_timestamp');
    
    // Cache de datos bancarios (del userDataService)
    localStorage.removeItem('covems_datos_bancarios_cache');
    localStorage.removeItem('covems_datos_bancarios_timestamp');
    
    console.log('🗑️ Todos los cachés han sido invalidados');
    return true;
  } catch (error) {
    console.error('Error invalidando cachés:', error);
    return false;
  }
}

/**
 * Invalida únicamente el caché de recibos
 */
export function invalidarCacheRecibos() {
  try {
    localStorage.removeItem('covems_recibos_cache');
    localStorage.removeItem('covems_recibos_timestamp');
    
    console.log('🗑️ Caché de recibos ha sido invalidado');
    return true;
  } catch (error) {
    console.error('Error invalidando caché de recibos:', error);
    return false;
  }
}

/**
 * Invalida únicamente el caché de saldos pendientes
 */
export function invalidarCacheSaldosPendientes() {
  try {
    localStorage.removeItem('covems_saldos_pendientes_cache');
    localStorage.removeItem('covems_saldos_pendientes_timestamp');
    
    console.log('🗑️ Caché de saldos pendientes ha sido invalidado');
    return true;
  } catch (error) {
    console.error('Error invalidando caché de saldos pendientes:', error);
    return false;
  }
}

/**
 * Verifica el estado de todos los cachés
 */
export function debugTodosLosCaches() {
  const estadoCaches = {
    recibos: {
      existe: !!localStorage.getItem('covems_recibos_cache'),
      timestamp: localStorage.getItem('covems_recibos_timestamp'),
      esValido: esCacheValido('covems_recibos_timestamp')
    },
    usuarios: {
      existe: !!localStorage.getItem('covems_usuarios_cache'),
      timestamp: localStorage.getItem('covems_usuarios_timestamp'),
      esValido: esCacheValido('covems_usuarios_timestamp')
    },
    saldosPendientes: {
      existe: !!localStorage.getItem('covems_saldos_pendientes_cache'),
      timestamp: localStorage.getItem('covems_saldos_pendientes_timestamp'),
      esValido: esCacheValido('covems_saldos_pendientes_timestamp')
    },
    datosBancarios: {
      existe: !!localStorage.getItem('covems_datos_bancarios_cache'),
      timestamp: localStorage.getItem('covems_datos_bancarios_timestamp'),
      esValido: esCacheValido('covems_datos_bancarios_timestamp')
    }
  };
  
  console.log('🔍 Estado completo de todos los cachés:', estadoCaches);
  
  // Mostrar información resumida
  const cachesValidos = Object.keys(estadoCaches).filter(key => estadoCaches[key].esValido);
  const cachesExistentes = Object.keys(estadoCaches).filter(key => estadoCaches[key].existe);
  
  console.log(`📊 Resumen: ${cachesValidos.length}/4 cachés válidos, ${cachesExistentes.length}/4 cachés existentes`);
  
  return estadoCaches;
}

/**
 * Función auxiliar para verificar si un caché es válido basado en su timestamp
 */
function esCacheValido(timestampKey) {
  try {
    const timestamp = localStorage.getItem(timestampKey);
    if (!timestamp) return false;
    
    const now = new Date().getTime();
    const cacheTime = parseInt(timestamp);
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
    
    return (now - cacheTime) < CACHE_DURATION;
  } catch {
    return false;
  }
}

/**
 * Obtiene información detallada sobre el uso de almacenamiento
 */
export function obtenerInfoAlmacenamiento() {
  try {
    const info = {
      itemsTotal: localStorage.length,
      itemsCovems: 0,
      tamaños: {}
    };
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('covems_')) {
        info.itemsCovems++;
        const value = localStorage.getItem(key);
        info.tamaños[key] = value ? (value.length / 1024).toFixed(2) + ' KB' : '0 KB';
      }
    }
    
    console.log('💾 Información de almacenamiento:', info);
    return info;
  } catch (error) {
    console.error('Error obteniendo información de almacenamiento:', error);
    return null;
  }
}

/**
 * Función completa de diagnóstico del sistema de cachés
 */
export function diagnosticoCacheCompleto() {
  console.log('🔬 === DIAGNÓSTICO COMPLETO DE CACHÉS ===');
  
  const estado = debugTodosLosCaches();
  const almacenamiento = obtenerInfoAlmacenamiento();
  
  // Verificar integridad de datos
  const problemas = [];
  
  Object.keys(estado).forEach(cache => {
    const cacheState = estado[cache];
    if (cacheState.existe && !cacheState.esValido) {
      problemas.push(`${cache}: existe pero ha expirado`);
    }
    if (cacheState.timestamp && !cacheState.existe) {
      problemas.push(`${cache}: timestamp existe pero no hay datos`);
    }
  });
  
  if (problemas.length > 0) {
    console.warn('⚠️ Problemas detectados:', problemas);
  } else {
    console.log('✅ No se detectaron problemas en los cachés');
  }
  
  return {
    estado,
    almacenamiento,
    problemas
  };
}

// Hacer funciones disponibles globalmente para debug en consola
if (typeof window !== 'undefined') {
  window.invalidarTodosLosCaches = invalidarTodosLosCaches;
  window.invalidarCacheRecibos = invalidarCacheRecibos;
  window.invalidarCacheSaldosPendientes = invalidarCacheSaldosPendientes;
  window.debugTodosLosCaches = debugTodosLosCaches;
  window.diagnosticoCacheCompleto = diagnosticoCacheCompleto;
  window.obtenerInfoAlmacenamiento = obtenerInfoAlmacenamiento;
}
