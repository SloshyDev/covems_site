// Servicio para obtener datos específicos del usuario

// Cache para almacenar datos bancarios ya obtenidos
const datosBancariosCache = new Map();

// Cache en localStorage para datos de usuarios
const USUARIO_CACHE_KEY = 'covems_usuario_datos_cache';
const USUARIO_CACHE_TIMESTAMP_KEY = 'covems_usuario_datos_timestamp';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos para datos específicos del usuario

/**
 * Carga datos de usuario desde localStorage
 */
function cargarUsuarioDesdeCache(clave) {
  console.log(`🔍 Intentando cargar usuario ${clave} desde localStorage...`);
  
  try {
    const cachedData = localStorage.getItem(`${USUARIO_CACHE_KEY}_${clave}`);
    const timestamp = localStorage.getItem(`${USUARIO_CACHE_TIMESTAMP_KEY}_${clave}`);
    
    console.log(`- Datos en localStorage: ${!!cachedData}`);
    console.log(`- Timestamp en localStorage: ${timestamp}`);
    
    if (cachedData && timestamp) {
      const now = new Date().getTime();
      const cacheTime = parseInt(timestamp);
      const minutosDesdeCache = Math.floor((now - cacheTime) / (1000 * 60));
      const estaExpirado = (now - cacheTime) >= CACHE_DURATION;
      
      console.log(`- Minutos desde cache: ${minutosDesdeCache}`);
      console.log(`- Está expirado: ${estaExpirado}`);
      
      // Verificar si el caché no ha expirado
      if (now - cacheTime < CACHE_DURATION) {
        const data = JSON.parse(cachedData);
        console.log(`✅ Datos del usuario ${clave} cargados desde localStorage:`, data);
        return data;
      } else {
        console.log(`⏰ Cache del usuario ${clave} expirado (${minutosDesdeCache} min > 30 min)`);
      }
    } else {
      console.log(`❌ No hay datos o timestamp para usuario ${clave} en localStorage`);
    }
  } catch (err) {
    console.error(`Error cargando caché del usuario ${clave}:`, err);
  }
  return null;
}

/**
 * Guarda datos de usuario en localStorage
 */
function guardarUsuarioEnCache(clave, datos) {
  try {
    localStorage.setItem(`${USUARIO_CACHE_KEY}_${clave}`, JSON.stringify(datos));
    localStorage.setItem(`${USUARIO_CACHE_TIMESTAMP_KEY}_${clave}`, new Date().getTime().toString());
    console.log(`💾 Datos del usuario ${clave} guardados en localStorage`);
  } catch (err) {
    console.error(`Error guardando caché del usuario ${clave}:`, err);
  }
}

/**
 * Limpia el cache de datos bancarios
 */
export function limpiarCacheDatosBancarios() {
  datosBancariosCache.clear();
  
  // También limpiar localStorage de usuarios
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(USUARIO_CACHE_KEY) || key.startsWith(USUARIO_CACHE_TIMESTAMP_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cache de usuarios limpiado de localStorage');
  } catch (err) {
    console.error('Error limpiando cache de usuarios:', err);
  }
}

/**
 * Obtiene los datos bancarios de múltiples usuarios en batch
 * @param {Array<number>} claves - Array de claves de usuarios
 * @returns {Promise<Map>} - Mapa con clave -> datos bancarios
 */
export async function obtenerDatosBancariosBatch(claves) {
  const resultado = new Map();
  const clavesNoEnCache = [];
  
  // Cargar cache general de usuarios una sola vez
  let usuariosCache = [];
  try {
    const usuariosCacheData = localStorage.getItem('covems_usuarios_cache');
    if (usuariosCacheData) {
      usuariosCache = JSON.parse(usuariosCacheData);
      console.log(`📋 Cache general de usuarios cargado: ${usuariosCache.length} usuarios`);
    }
  } catch (err) {
    console.error('Error cargando cache general de usuarios:', err);
  }
  
  // Verificar qué claves ya están en cache (memoria y localStorage)
  claves.forEach(clave => {
    const claveStr = String(clave);
    
    // Primero verificar cache en memoria
    if (datosBancariosCache.has(claveStr)) {
      resultado.set(claveStr, datosBancariosCache.get(claveStr));
      return;
    }
    
    // Si no está en memoria, verificar localStorage específico
    const datosEnCache = cargarUsuarioDesdeCache(clave);
    if (datosEnCache) {
      // Almacenar en cache en memoria también
      datosBancariosCache.set(claveStr, datosEnCache);
      resultado.set(claveStr, datosEnCache);
      return;
    }
    
    // Si no está en cache específico, buscar en cache general de usuarios
    const usuarioEncontrado = usuariosCache.find(u => u.clave === parseInt(clave));
    if (usuarioEncontrado) {
      console.log(`✅ Usuario ${clave} encontrado en cache general (batch)`);
      
      const datosBancarios = {
        id: usuarioEncontrado.id, // IMPORTANTE: Incluir el ID
        rfc: usuarioEncontrado.rfc || null,
        banco: usuarioEncontrado.banco || null,
        cuenta_clabe: usuarioEncontrado.cuenta_clabe || null,
        nombre: usuarioEncontrado.nombre || null,
        clave: usuarioEncontrado.clave,
        estado: usuarioEncontrado.estado || null,
        _cached: true,
        _source: 'usuarios_cache_batch'
      };
      
      // Guardar en caches
      datosBancariosCache.set(claveStr, datosBancarios);
      guardarUsuarioEnCache(clave, datosBancarios);
      resultado.set(claveStr, datosBancarios);
      return;
    }
    
    // Solo agregar a la lista de "no en cache" si NO existe en ningún lado
    clavesNoEnCache.push(clave);
  });
  
  // Si todas las claves están en cache, retornar inmediatamente
  if (clavesNoEnCache.length === 0) {
    console.log('✅ Todos los datos bancarios obtenidos desde caché');
    return resultado;
  }
  
  console.log(`🌐 Obteniendo datos bancarios desde API para ${clavesNoEnCache.length} usuarios (no encontrados en cache general)`);
  
  // ...existing code...
  
  // Obtener datos para las claves que no están en cache
  try {
    const promises = clavesNoEnCache.map(async (clave) => {
      try {
        const response = await fetch(`/api/users?clave=${clave}&fields=rfc,banco,cuenta_clabe`);
        if (response.ok) {
          const data = await response.json();
          // Guardar en cache en memoria
          datosBancariosCache.set(String(clave), data);
          // Guardar en localStorage
          guardarUsuarioEnCache(clave, data);
          return { clave: String(clave), data };
        }
        console.error(`Error en la respuesta para clave ${clave}:`, response.status);
        return { clave: String(clave), data: null };
      } catch (error) {
        console.error(`Error obteniendo datos bancarios para clave ${clave}:`, error);
        return { clave: String(clave), data: null };
      }
    });
    
    const resultados = await Promise.all(promises);
    
    // Agregar resultados al mapa de resultado
    resultados.forEach(({ clave, data }) => {
      resultado.set(clave, data);
    });
    
    return resultado;
  } catch (error) {
    console.error('Error en batch de datos bancarios:', error);
    return resultado;
  }
}

/**
 * Obtiene los datos bancarios de un usuario específico (con cache)
 * @param {number} clave - La clave del usuario
 * @returns {Promise<Object|null>} - Los datos del usuario o null si hay error
 */
export async function obtenerDatosBancarios(clave) {
  const claveStr = String(clave);
  
  console.log(`🔍 Buscando datos bancarios para usuario ${clave}`);
  
  // Verificar cache en memoria primero
  if (datosBancariosCache.has(claveStr)) {
    const data = datosBancariosCache.get(claveStr);
    console.log(`✅ Datos bancarios del usuario ${clave} obtenidos desde cache en memoria:`, data);
    return data;
  }
  
  console.log(`⚠️ Usuario ${clave} no encontrado en cache en memoria`);
  
  // Si no está en memoria, verificar localStorage
  const datosEnCache = cargarUsuarioDesdeCache(clave);
  if (datosEnCache) {
    // Almacenar en cache en memoria también para futuras consultas
    datosBancariosCache.set(claveStr, datosEnCache);
    console.log(`✅ Datos bancarios del usuario ${clave} obtenidos desde localStorage:`, datosEnCache);
    return datosEnCache;
  }
  
  console.log(`⚠️ Usuario ${clave} no encontrado en localStorage`);
  
  // ANTES de hacer llamada a la API, verificar si el usuario existe en el cache general de usuarios
  const usuariosCache = localStorage.getItem('covems_usuarios_cache');
  if (usuariosCache) {
    try {
      const usuarios = JSON.parse(usuariosCache);
      const usuarioEncontrado = usuarios.find(u => u.clave === parseInt(clave));
      
      if (usuarioEncontrado) {
        console.log(`✅ Usuario ${clave} encontrado en cache general de usuarios, usando esos datos`);
        
        // Crear objeto de datos bancarios con lo que tenemos (puede estar vacío)
        const datosBancarios = {
          id: usuarioEncontrado.id, // IMPORTANTE: Incluir el ID
          rfc: usuarioEncontrado.rfc || null,
          banco: usuarioEncontrado.banco || null,
          cuenta_clabe: usuarioEncontrado.cuenta_clabe || null,
          nombre: usuarioEncontrado.nombre || null,
          clave: usuarioEncontrado.clave,
          estado: usuarioEncontrado.estado || null,
          _cached: true,
          _source: 'usuarios_cache'
        };
        
        // Guardar en cache para futuras consultas
        datosBancariosCache.set(claveStr, datosBancarios);
        guardarUsuarioEnCache(clave, datosBancarios);
        
        return datosBancarios;
      }
    } catch (err) {
      console.error('Error parseando cache de usuarios:', err);
    }
  }
  
  // Solo si NO existe en el cache general, hacer llamada a la API
  console.log(`🌐 Usuario ${clave} no existe en cache general, obteniendo desde API`);
  try {
    const response = await fetch(`/api/users?clave=${clave}&fields=rfc,banco,cuenta_clabe`);
    if (response.ok) {
      const data = await response.json();
      // Guardar en cache en memoria
      datosBancariosCache.set(claveStr, data);
      // Guardar en localStorage
      guardarUsuarioEnCache(clave, data);
      console.log(`💾 Datos del usuario ${clave} obtenidos desde API y guardados en cache:`, data);
      return data;
    }
    console.error('Error en la respuesta:', response.status);
    return null;
  } catch (error) {
    console.error('Error obteniendo datos bancarios del usuario:', error);
    return null;
  }
}

/**
 * Obtiene todos los datos de un usuario específico
 * @param {number} clave - La clave del usuario
 * @returns {Promise<Object|null>} - Los datos completos del usuario o null si hay error
 */
export async function obtenerUsuarioCompleto(clave) {
  // Verificar si ya tenemos los datos en localStorage
  const datosEnCache = cargarUsuarioDesdeCache(clave);
  if (datosEnCache) {
    console.log(`✅ Datos completos del usuario ${clave} obtenidos desde localStorage`);
    return datosEnCache;
  }
  
  // Si no está en cache, hacer llamada a la API
  console.log(`🌐 Obteniendo datos completos del usuario ${clave} desde API`);
  try {
    const response = await fetch(`/api/users?clave=${clave}`);
    if (response.ok) {
      const data = await response.json();
      // Guardar en localStorage para futuras consultas
      guardarUsuarioEnCache(clave, data);
      return data;
    }
    console.error('Error en la respuesta:', response.status);
    return null;
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    return null;
  }
}

/**
 * Función de debug para verificar el estado del cache
 */
export function debugCache() {
  console.log('🔍 Estado del cache en memoria:', datosBancariosCache);
  
  console.log('🔍 Estado del cache en localStorage:');
  const keys = Object.keys(localStorage);
  const usuarioKeys = keys.filter(key => key.startsWith(USUARIO_CACHE_KEY));
  const timestampKeys = keys.filter(key => key.startsWith(USUARIO_CACHE_TIMESTAMP_KEY));
  
  console.log('- Claves de datos:', usuarioKeys);
  console.log('- Claves de timestamp:', timestampKeys);
  
  usuarioKeys.forEach(key => {
    const clave = key.replace(`${USUARIO_CACHE_KEY}_`, '');
    const data = localStorage.getItem(key);
    const timestamp = localStorage.getItem(`${USUARIO_CACHE_TIMESTAMP_KEY}_${clave}`);
    
    if (timestamp) {
      const now = new Date().getTime();
      const cacheTime = parseInt(timestamp);
      const minutosDesdeCache = Math.floor((now - cacheTime) / (1000 * 60));
      const estaExpirado = (now - cacheTime) >= CACHE_DURATION;
      
      console.log(`- Usuario ${clave}:`, {
        tieneData: !!data,
        minutosDesdeCache,
        estaExpirado,
        fechaCache: new Date(cacheTime).toLocaleString()
      });
    }
  });
}

// Hacer la función debug disponible globalmente en desarrollo
if (typeof window !== 'undefined') {
  window.debugCacheUsuarios = debugCache;
}

/**
 * Pre-llena el cache de datos bancarios con usuarios existentes
 * @param {Array} usuarios - Array de usuarios del cache principal
 */
export function preLlenarCacheDatosBancarios(usuarios) {
  if (!usuarios || !Array.isArray(usuarios)) {
    console.log('❌ No se recibieron usuarios para pre-llenar cache');
    return;
  }
  
  console.log(`🔄 Pre-llenando cache con ${usuarios.length} usuarios...`);
  
  usuarios.forEach(usuario => {
    if (usuario.clave) {
      const claveStr = String(usuario.clave);
      
      // Guardar TODOS los usuarios, incluso si no tienen datos bancarios completos
      // Esto evita llamadas innecesarias a la API
      const datosBancarios = {
        id: usuario.id, // IMPORTANTE: Incluir el ID para APIs que lo necesiten
        rfc: usuario.rfc || null,
        banco: usuario.banco || null,
        cuenta_clabe: usuario.cuenta_clabe || null,
        // Incluir otros campos que puedan ser útiles
        nombre: usuario.nombre || null,
        clave: usuario.clave,
        estado: usuario.estado || null,
        // Marcar que este usuario ya fue procesado
        _cached: true,
        _source: 'usuarios_bulk'
      };
      
      // Guardar en cache en memoria
      datosBancariosCache.set(claveStr, datosBancarios);
      
      // Guardar en localStorage
      guardarUsuarioEnCache(usuario.clave, datosBancarios);
      
      console.log(`💾 Cache pre-llenado para usuario ${usuario.clave} (rfc: ${usuario.rfc || 'N/A'})`);
    }
  });
  
  console.log(`✅ Cache pre-llenado completado para ${usuarios.length} usuarios`);
}

/**
 * Función para verificar si un usuario específico está en cache
 */
export function verificarUsuarioEnCache(clave) {
  const claveStr = String(clave);
  
  console.log(`🔍 Verificando cache para usuario ${clave}:`);
  
  // Cache en memoria
  const enMemoria = datosBancariosCache.has(claveStr);
  console.log(`- En memoria: ${enMemoria}`);
  if (enMemoria) {
    console.log(`- Datos en memoria:`, datosBancariosCache.get(claveStr));
  }
  
  // Cache en localStorage
  const dataKey = `${USUARIO_CACHE_KEY}_${clave}`;
  const timestampKey = `${USUARIO_CACHE_TIMESTAMP_KEY}_${clave}`;
  
  const datosLS = localStorage.getItem(dataKey);
  const timestampLS = localStorage.getItem(timestampKey);
  
  console.log(`- En localStorage: ${!!datosLS}`);
  console.log(`- Timestamp LS: ${timestampLS}`);
  
  if (datosLS && timestampLS) {
    const now = new Date().getTime();
    const cacheTime = parseInt(timestampLS);
    const minutosDesdeCache = Math.floor((now - cacheTime) / (1000 * 60));
    const estaExpirado = (now - cacheTime) >= CACHE_DURATION;
    
    console.log(`- Minutos desde cache: ${minutosDesdeCache}`);
    console.log(`- Está expirado: ${estaExpirado}`);
    console.log(`- Datos LS:`, JSON.parse(datosLS));
  }
  
  return { enMemoria, enLocalStorage: !!datosLS };
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.verificarUsuarioEnCache = verificarUsuarioEnCache;
}
