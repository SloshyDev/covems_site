// Servicio para manejar saldos pendientes
import { obtenerUsuarioCompleto } from './userDataService';
import { 
  obtenerSaldosAnteriores,
  verificarSaldoEnFecha,
  crearSaldoPendienteSeguro
} from './saldosPendientesService';

/**
 * Función auxiliar para verificar si el usuario tenía saldo pendiente al inicio del corte
 * @param {number} agenteId - ID del agente/supervisor
 * @param {string} fechaInicio - Fecha de inicio del corte actual en formato YYYY-MM-DD
 * @returns {Promise<Object|null>} - El saldo pendiente previo o null si no existe
 */
async function verificarSaldoPendientePrevio(agenteId, fechaInicio) {
  try {
    console.log(`🔍 Verificando saldo pendiente previo para agente ${agenteId} antes de ${fechaInicio}`);
    
    // Usar el servicio unificado de caché
    const saldosPrevios = obtenerSaldosAnteriores(agenteId, fechaInicio);
    
    if (saldosPrevios.length > 0) {
      console.log(`✅ Saldo pendiente previo encontrado en caché para agente ${agenteId}`);
      return saldosPrevios[0]; // El más reciente
    }
    
    console.log(`ℹ️ No hay saldos previos para agente ${agenteId} antes de ${fechaInicio}`);
    return null;
  } catch (error) {
    console.error('Error verificando saldo pendiente previo:', error);
    return null;
  }
}

/**
 * Función auxiliar para crear un registro de saldo "cerrado" (con valor 0)
 * @param {number} claveSupervisor - Clave del supervisor/agente
 * @param {string} fechaInicioSiguienteCorte - Fecha del siguiente corte en formato ISO
 * @param {string} tipo - Tipo de usuario ("supervisor" o "agente")
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function crearSaldoCerrado(claveSupervisor, fechaInicioSiguienteCorte, tipo) {
  try {
    // Obtener el usuario para conseguir su ID (usando cache)
    console.log(`🔍 Obteniendo datos del usuario ${claveSupervisor} para crear saldo cerrado...`);
    const usuario = await obtenerUsuarioCompleto(claveSupervisor);
    if (!usuario) {
      throw new Error(`No se pudo obtener el usuario ${claveSupervisor}`);
    }
    
    console.log('🔍 Usuario obtenido para saldo cerrado:', {
      id: usuario.id,
      clave: usuario.clave,
      nombre: usuario.nombre
    });
    
    // Verificar que el usuario tenga ID
    if (!usuario.id) {
      throw new Error(`El usuario ${claveSupervisor} no tiene ID válido. Datos: ${JSON.stringify(usuario)}`);
    }
    
    const saldoData = {
      fecha: fechaInicioSiguienteCorte,
      saldo: 0,
      agenteId: usuario.id,
      observaciones: `Saldo pendiente cerrado automáticamente. El ${tipo} tenía saldo pendiente al inicio del corte pero después de procesar los recibos el saldo total es positivo.`
    };

    console.log('📤 Enviando datos de saldo cerrado:', saldoData);

    // Crear el registro de saldo cerrado
    const response = await fetch('/api/saldos-pendientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saldoData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response del servidor:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Error al crear el saldo cerrado: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creando saldo cerrado:', error);
    throw error;
  }
}

/**
 * Función auxiliar para verificar si ya existe un saldo pendiente para la fecha y usuario
 * @param {number} agenteId - ID del agente/supervisor
 * @param {string} fechaInicioSiguienteCorte - Fecha del siguiente corte en formato ISO
 * @returns {Promise<Object|null>} - El saldo existente o null si no existe
 */
async function verificarSaldoExistente(agenteId, fechaInicioSiguienteCorte) {
  try {
    console.log(`🔍 Verificando saldo existente para agente ${agenteId} en fecha ${fechaInicioSiguienteCorte}`);
    
    // Convertir la fecha de entrada a formato de solo fecha (YYYY-MM-DD) para comparación
    const fechaBuscada = new Date(fechaInicioSiguienteCorte);
    const fechaBuscadaStr = fechaBuscada.toISOString().split('T')[0];
    
    // Usar el servicio unificado de caché
    const saldoExistente = verificarSaldoEnFecha(agenteId, fechaBuscadaStr);
    
    if (saldoExistente) {
      console.log(`✅ Saldo existente encontrado en caché para agente ${agenteId}`);
      return saldoExistente;
    }
    
    console.log(`ℹ️ No se encontró saldo existente para agente ${agenteId} en fecha ${fechaBuscadaStr}`);
    return null;
  } catch (error) {
    console.error('Error verificando saldo existente:', error);
    return null;
  }
}

/**
 * Función auxiliar para crear saldo pendiente cuando la comisión es negativa
 * @param {number} claveSupervisor - Clave del supervisor/agente
 * @param {number} comisionNegativa - Monto de la comisión negativa
 * @param {string} fechaInicioSiguienteCorte - Fecha del siguiente corte en formato ISO
 * @returns {Promise<Object>} - Resultado de la operación
 */
async function crearSaldoPendiente(claveSupervisor, comisionNegativa, fechaInicioSiguienteCorte) {
  try {
    // Primero obtener el usuario para conseguir su ID (usando cache)
    console.log(`🔍 Obteniendo datos del usuario ${claveSupervisor} para crear saldo pendiente...`);
    const usuario = await obtenerUsuarioCompleto(claveSupervisor);
    if (!usuario) {
      throw new Error(`No se pudo obtener el usuario ${claveSupervisor}`);
    }
    
    console.log('🔍 Usuario obtenido para saldo pendiente:', {
      id: usuario.id,
      clave: usuario.clave,
      nombre: usuario.nombre
    });
    
    // Verificar que el usuario tenga ID
    if (!usuario.id) {
      throw new Error(`El usuario ${claveSupervisor} no tiene ID válido. Datos: ${JSON.stringify(usuario)}`);
    }
    
    // Verificar si ya existe un saldo para esta fecha y usuario usando el servicio unificado
    const saldoExistente = await verificarSaldoExistente(usuario.id, fechaInicioSiguienteCorte);
    if (saldoExistente) {
      console.log(`Ya existe un saldo pendiente para el usuario ${claveSupervisor} en la fecha ${new Date(fechaInicioSiguienteCorte).toLocaleDateString('es-MX')}. No se creará duplicado.`);
      return { message: 'Saldo ya existe', saldo: saldoExistente };
    }
    
    const saldoData = {
      fecha: fechaInicioSiguienteCorte,
      saldo: comisionNegativa,
      agenteId: usuario.id,
      observaciones: `Saldo negativo generado automáticamente por comisión del corte. Comisión original: ${comisionNegativa.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`
    };

    console.log('📤 Enviando datos de saldo pendiente:', saldoData);
    
    // Usar el servicio unificado para crear el saldo
    const resultado = await crearSaldoPendienteSeguro(saldoData);
    
    if (!resultado.success) {
      if (resultado.isDuplicate) {
        return { message: 'Saldo ya existe (duplicado detectado)' };
      }
      throw new Error(resultado.error);
    }
    
    return resultado.data;
  } catch (error) {
    console.error('Error creando saldo pendiente:', error);
    throw error;
  }
}

/**
 * Función auxiliar para calcular la fecha de inicio del siguiente corte
 * @param {string} fechaFin - Fecha de fin del corte actual en formato YYYY-MM-DD
 * @returns {string|null} - Fecha del siguiente corte en formato ISO o null si hay error
 */
function calcularFechaInicioSiguienteCorte(fechaFin) {
  if (!fechaFin || fechaFin.length < 10) {
    return null;
  }
  
  try {
    // fechaFin viene en formato YYYY-MM-DD
    const [anio, mes, dia] = fechaFin.split('-').map(Number);
    const fechaFinDate = new Date(anio, mes - 1, dia);
    
    // El siguiente corte inicia al día siguiente
    const fechaInicioSiguiente = new Date(fechaFinDate);
    fechaInicioSiguiente.setDate(fechaFinDate.getDate() + 1);
    
    // Retornar en formato ISO string para la base de datos
    return fechaInicioSiguiente.toISOString();
  } catch (error) {
    console.error('Error calculando fecha siguiente corte:', error);
    return null;
  }
}

/**
 * Función principal para manejar saldos pendientes al finalizar un corte
 * @param {number} claveSupervisor - Clave del supervisor/agente
 * @param {number} comisionTotal - Total de la comisión del corte
 * @param {string} fechaInicio - Fecha de inicio del corte actual
 * @param {string} fechaFin - Fecha de fin del corte actual
 * @param {string} tipo - Tipo de usuario ("supervisor" o "agente")
 * @returns {Promise<Object>} - Resultado de la operación con información de si se creó un saldo
 */
export async function manejarSaldoPendiente(claveSupervisor, comisionTotal, fechaInicio, fechaFin, tipo = "supervisor") {
  if (!claveSupervisor) {
    return { saldoCreado: false, error: 'Clave de usuario no proporcionada' };
  }

  console.log(`🔄 Iniciando manejo de saldo pendiente para ${tipo} ${claveSupervisor}`, {
    comisionTotal,
    fechaInicio,
    fechaFin
  });

  try {
    // Obtener el usuario para conseguir su ID (usando cache)
    console.log(`🔍 Obteniendo datos del usuario ${claveSupervisor} para saldo pendiente...`);
    const usuario = await obtenerUsuarioCompleto(claveSupervisor);
    if (!usuario) {
      console.warn(`❌ No se pudo obtener el usuario ${claveSupervisor}`);
      return { saldoCreado: false, error: 'Usuario no encontrado' };
    }
    
    console.log('✅ Usuario obtenido para manejo de saldo pendiente:', {
      id: usuario.id,
      clave: usuario.clave,
      nombre: usuario.nombre
    });
    
    // Verificar que el usuario tenga ID
    if (!usuario.id) {
      console.error(`❌ El usuario ${claveSupervisor} no tiene ID válido. Datos:`, usuario);
      return { saldoCreado: false, error: 'Usuario sin ID válido' };
    }

    // Verificar si tenía saldo pendiente al inicio del corte
    const saldoPendientePrevio = await verificarSaldoPendientePrevio(usuario.id, fechaInicio);
    console.log(`Saldo pendiente previo para ${tipo} ${claveSupervisor}:`, saldoPendientePrevio);
    
    const fechaInicioSiguienteCorte = calcularFechaInicioSiguienteCorte(fechaFin);
    if (!fechaInicioSiguienteCorte) {
      console.warn(`❌ No se pudo calcular la fecha del siguiente corte para ${tipo} ${claveSupervisor}`);
      return { saldoCreado: false, error: 'Error calculando fecha siguiente corte' };
    }

    // Caso 1: Comisión negativa - crear saldo pendiente con verificación de duplicidad
    if (comisionTotal < 0) {
      console.log(`💰 Caso 1: Creando saldo pendiente para ${tipo} ${claveSupervisor} por comisión negativa`);
      
      const resultado = await crearSaldoPendiente(claveSupervisor, comisionTotal, fechaInicioSiguienteCorte);
      
      if (resultado.message && resultado.message.includes('ya existe')) {
        console.log(`ℹ️ Saldo pendiente ya existe para ${tipo} ${claveSupervisor} en la fecha ${new Date(fechaInicioSiguienteCorte).toLocaleDateString('es-MX')}. No se creó duplicado.`);
        return { saldoCreado: false, motivo: 'Saldo ya existía' };
      } else {
        console.log(`✅ Saldo pendiente creado exitosamente para ${tipo} ${claveSupervisor}: ${comisionTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`);
        return { saldoCreado: true, motivo: 'Comisión negativa', saldo: resultado };
      }
    }
    // Caso 2: Tenía saldo pendiente previo pero ahora la comisión es positiva - cerrar saldo
    else if (saldoPendientePrevio && comisionTotal > 0) {
      console.log(`💰 Caso 2: Cerrando saldo pendiente para ${tipo} ${claveSupervisor} por comisión positiva`);
      // Verificar que no exista ya un registro de cierre
      const saldoExistente = await verificarSaldoExistente(usuario.id, fechaInicioSiguienteCorte);
      if (!saldoExistente) {
        console.log(`✅ Creando registro de cierre para ${tipo} ${claveSupervisor}`);
        await crearSaldoCerrado(claveSupervisor, fechaInicioSiguienteCorte, tipo);
        console.log(`✅ Saldo pendiente cerrado para ${tipo} ${claveSupervisor}. Tenía saldo pendiente previo pero después del corte el saldo es positivo.`);
        return { saldoCreado: true, motivo: 'Cierre de saldo previo' };
      } else {
        console.log(`ℹ️ Ya existe un registro de cierre para ${tipo} ${claveSupervisor}`);
        return { saldoCreado: false, motivo: 'Registro de cierre ya existía' };
      }
    }
    // Caso 3: Sin saldo pendiente previo y comisión positiva o cero - no hacer nada
    else {
      console.log(`ℹ️ Caso 3: No se requiere acción para ${tipo} ${claveSupervisor}`, {
        teniaSaldoPrevio: !!saldoPendientePrevio,
        comisionTotal
      });
      return { saldoCreado: false, motivo: 'No se requiere acción' };
    }

  } catch (error) {
    console.error(`❌ Error manejando saldo pendiente para ${tipo} ${claveSupervisor}:`, error);
    return { saldoCreado: false, error: error.message };
  }
}

// Exportar funciones individuales si se necesitan
export { verificarSaldoExistente, crearSaldoPendiente, calcularFechaInicioSiguienteCorte, verificarSaldoPendientePrevio, crearSaldoCerrado };
