/**
 * Utilidad para procesamiento optimizado de saldos pendientes
 * Se ejecuta cuando el usuario presiona el botón "Procesar Saldos"
 */

export const procesarSaldosSoloCalculo = async ({
  agentesData,
  supervisoresRecibos,
  usuarios,
  clavesActivos,
  fechaInicio,
  fechaFin
}) => {
  console.log('🚀 === INICIO PROCESAMIENTO DE SALDOS PENDIENTES ===');
  
  const saldosFinales = [];
  let totalProcesados = 0;
  let saldosCreados = 0;
  
  try {
    // Importar las funciones necesarias solo para saldos
    const { manejarSaldoPendiente } = await import("./saldoPendienteService");
    const { invalidarCacheSaldosPendientes } = await import("./cacheManager");
    
    console.log('📊 === DATOS DISPONIBLES ===');
    console.log('Agentes data keys:', Object.keys(agentesData));
    console.log('Supervisores recibos keys:', Object.keys(supervisoresRecibos));
    console.log('Claves activos:', clavesActivos);
    console.log('Total usuarios:', usuarios?.length || 0);
    console.log('Fechas del corte:', { fechaInicio, fechaFin });
    
    // Invalidar caché de saldos pendientes antes de procesar
    console.log('🔄 Invalidando caché de saldos pendientes...');
    invalidarCacheSaldosPendientes();
    
    // Filtrar usuarios activos para agentes
    const agentesActivos = Object.entries(agentesData).filter(([clave]) => 
      clavesActivos.includes(clave) || clavesActivos.includes(String(clave)) || clavesActivos.includes(Number(clave))
    );
    
    // Filtrar usuarios activos para supervisores
    const supervisoresActivos = Object.entries(supervisoresRecibos).filter(([clave]) => {
      const esActivo = clavesActivos.includes(clave) || clavesActivos.includes(String(clave)) || clavesActivos.includes(Number(clave));
      return esActivo;
    });
    
    console.log('👥 === USUARIOS A PROCESAR ===');
    console.log(`Agentes activos: ${agentesActivos.length}`);
    console.log(`Supervisores activos: ${supervisoresActivos.length}`);
    
    // Procesar agentes activos
    for (const [clave, data] of agentesActivos) {
      try {
        const usuario = usuarios.find(u => String(u.clave) === String(clave));
        if (!usuario) {
          console.warn(`⚠️ Usuario agente ${clave} no encontrado en lista de usuarios`);
          continue;
        }
        
        // Calcular saldo total del agente
        const saldoTotal = data.comisionAgenteFinal || 0;
        
        console.log(`🏃‍♂️ Procesando AGENTE ${clave} (${usuario.nombre}): Saldo = $${saldoTotal.toFixed(2)}`);
        
        // Manejar saldo pendiente usando la función del servicio
        const resultado = await manejarSaldoPendiente(
          Number(clave),
          saldoTotal,
          fechaInicio,
          fechaFin,
          "agente"
        );
        
        if (resultado.saldoCreado) {
          saldosCreados++;
          console.log(`✅ Saldo creado para agente ${clave}`);
        } else {
          console.log(`ℹ️ Saldo ya existía para agente ${clave}`);
        }
        
        saldosFinales.push({
          clave: Number(clave),
          nombre: usuario.nombre,
          tipo: 'agente',
          saldoFinal: saldoTotal
        });
        
        totalProcesados++;
        
      } catch (error) {
        console.error(`❌ Error procesando agente ${clave}:`, error);
      }
    }
    
    // Procesar supervisores activos
    for (const [clave, data] of supervisoresActivos) {
      try {
        const usuario = usuarios.find(u => String(u.clave) === String(clave));
        if (!usuario) {
          console.warn(`⚠️ Usuario supervisor ${clave} no encontrado en lista de usuarios`);
          continue;
        }
        
        // Calcular saldo total del supervisor
        const saldoTotal = data.comisionSupervisorFinal || 0;
        
        console.log(`�‍💼 Procesando SUPERVISOR ${clave} (${usuario.nombre}): Saldo = $${saldoTotal.toFixed(2)}`);
        
        // Manejar saldo pendiente usando la función del servicio
        const resultado = await manejarSaldoPendiente(
          Number(clave),
          saldoTotal,
          fechaInicio,
          fechaFin,
          "supervisor"
        );
        
        if (resultado.saldoCreado) {
          saldosCreados++;
          console.log(`✅ Saldo creado para supervisor ${clave}`);
        } else {
          console.log(`ℹ️ Saldo ya existía para supervisor ${clave}`);
        }
        
        saldosFinales.push({
          clave: Number(clave),
          nombre: usuario.nombre,
          tipo: 'supervisor',
          saldoFinal: saldoTotal
        });
        
        totalProcesados++;
        
      } catch (error) {
        console.error(`❌ Error procesando supervisor ${clave}:`, error);
      }
    }
    
    // Clasificar usuarios por saldo
    const usuariosNegativos = saldosFinales.filter(u => u.saldoFinal < 0);
    const usuariosPositivos = saldosFinales.filter(u => u.saldoFinal > 0);
    const usuariosCero = saldosFinales.filter(u => u.saldoFinal === 0);
    
    const resultado = {
      ok: true,
      totalProcesados,
      saldosCreados,
      saldosFinales,
      usuariosNegativos,
      usuariosPositivos,
      usuariosCero,
      fechaProcesamiento: new Date().toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    
    console.log('🎉 === PROCESAMIENTO COMPLETADO EXITOSAMENTE ===');
    console.log('📊 Resumen final:', {
      totalProcesados: resultado.totalProcesados,
      saldosCreados: resultado.saldosCreados,
      usuariosNegativos: resultado.usuariosNegativos.length,
      usuariosPositivos: resultado.usuariosPositivos.length,
      usuariosCero: resultado.usuariosCero.length
    });
    
    return resultado;
    
  } catch (error) {
    console.error('❌ Error general en procesamiento de saldos:', error);
    return {
      ok: false,
      error: error.message,
      totalProcesados,
      fechaProcesamiento: new Date().toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City'
      })
    };
  }
};
