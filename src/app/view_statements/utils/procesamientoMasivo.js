/**
 * Utilidad para procesamiento masivo de saldos y descarga de PDFs
 */

export const procesarSaldosMasivo = async ({
  agentesData,
  supervisoresRecibos,
  usuarios,
  clavesActivos,
  fechaInicio,
  fechaFin,
  setProcesandoMasivo,
  setResultadosMasivos
}) => {
  console.log('=== PROCESAMIENTO MASIVO DE SALDOS (CON DESCARGA DE PDFs) ===');
  
  setProcesandoMasivo(true);
  setResultadosMasivos(null);
  
  const saldosFinales = [];
  let totalProcesados = 0;
  let totalDescargados = 0;
  
  try {
    // Importar las funciones necesarias para PDFs y saldos
    const { descargarSupervisorPDF } = await import("../utils/pdfSupervisor");
    const { obtenerDatosBancariosBatch, limpiarCacheDatosBancarios } = await import("../utils/userDataService");
    const { verificarDuplicidadSaldoPendiente, agregarSaldoPendienteAlCache } = await import("../utils/saldosPendientesCache");
    const { invalidarCacheSaldosPendientes } = await import("../utils/cacheManager");
    
    console.log('=== DATOS DISPONIBLES ===');
    console.log('Agentes data keys:', Object.keys(agentesData));
    console.log('Supervisores recibos keys:', Object.keys(supervisoresRecibos));
    console.log('Claves activos:', clavesActivos);
    console.log('Total usuarios:', usuarios?.length || 0);
    
    // Invalidar caché de saldos pendientes al procesar datos masivamente
    console.log('🔄 Invalidando caché de saldos pendientes antes de procesamiento masivo...');
    invalidarCacheSaldosPendientes();
    
    // Limpiar cache antes de procesar
    limpiarCacheDatosBancarios();
    
    // Obtener todas las claves de usuarios que se van a procesar
    const agentesActivos = Object.entries(agentesData).filter(([clave]) => 
      clavesActivos.includes(clave) || clavesActivos.includes(String(clave)) || clavesActivos.includes(Number(clave))
    );
    
    const supervisoresActivos = Object.entries(supervisoresRecibos).filter(([clave]) => {
      const esActivo = clavesActivos.includes(clave) || clavesActivos.includes(String(clave)) || clavesActivos.includes(Number(clave));
      return esActivo;
    });
    
    // Recopilar todas las claves que necesitarán datos bancarios
    const todasLasClaves = [
      ...agentesActivos.map(([clave]) => clave),
      ...supervisoresActivos.map(([clave]) => clave)
    ];
    
    console.log(`Total claves para procesar: ${todasLasClaves.length}`);
    console.log('Claves:', todasLasClaves);
    
    // Obtener todos los datos bancarios en batch (una sola vez)
    console.log('--- OBTENIENDO DATOS BANCARIOS EN BATCH ---');
    const datosBancariosMap = await obtenerDatosBancariosBatch(todasLasClaves);
    console.log(`Datos bancarios obtenidos: ${datosBancariosMap.size} registros`);
    
    
    // Procesar agentes activos
    console.log('--- PROCESANDO AGENTES ACTIVOS ---');
    console.log(`Agentes activos encontrados: ${agentesActivos.length}`);
    
    for (const [clave, data] of agentesActivos) {
      try {
        // Calcular saldo final correctamente para agentes (usando comisAgente)
        const saldoFinal = data.recibos?.reduce((acc, recibo) => acc + (recibo.comisAgente || 0), 0) || 0;
        
        saldosFinales.push({
          clave,
          nombre: data.nombre,
          tipo: 'agente',
          saldoFinal,
          recibosCount: data.recibos?.length || 0,
          esActivo: true
        });
        
        console.log(`✓ Agente ${clave} (${data.nombre}): $${saldoFinal.toFixed(2)} - Descargando PDF...`);
        
        // Simular la descarga del PDF como lo hace AgenteStateCard
        try {
          // Obtener datos bancarios del cache/batch
          const datosUsuario = datosBancariosMap.get(String(clave));
          
          // Buscar información del supervisor
          const agente = usuarios.find(u => String(u.clave) === String(clave));
          let supervisorInfo = null;
          if (agente && agente.supervisor_clave) {
            const supervisor = usuarios.find(u => String(u.clave) === String(agente.supervisor_clave));
            if (supervisor) {
              supervisorInfo = {
                clave: supervisor.clave,
                nombre: supervisor.nombre
              };
            }
          }
          
          // Descargar PDF del agente - NO mapear las comisiones, usar tal como están
          await descargarSupervisorPDF({
            supervisor: supervisorInfo,
            claveSupervisor: clave,
            data: data, // Usar los datos tal como están, sin mapear comisiones
            usuarios: usuarios || [],
            tipo: "agente",
            nombreAgente: data.nombre || "",
            fechaInicio,
            fechaFin,
            datosUsuario
          });
          
          console.log(`  ✓ PDF descargado para agente ${clave}`);
          totalDescargados++;
        } catch (pdfError) {
          console.error(`  ✗ Error descargando PDF para agente ${clave}:`, pdfError);
        }
        
        totalProcesados++;
      } catch (error) {
        console.error(`✗ Error procesando agente ${clave}:`, error);
      }
    }
    
    // Procesar supervisores activos
    console.log('--- PROCESANDO SUPERVISORES ACTIVOS ---');
    console.log('Supervisores recibos data:', supervisoresRecibos);
    
    console.log(`Supervisores activos encontrados: ${supervisoresActivos.length}`);
    
    for (const [clave, data] of supervisoresActivos) {
      try {
        console.log(`Procesando supervisor ${clave}:`, data);
        // Calcular saldo final correctamente para supervisores (usando comisSupervisor)
        const saldoFinal = data.recibos?.reduce((acc, recibo) => acc + (recibo.comisSupervisor || 0), 0) || 0;
        
        saldosFinales.push({
          clave,
          nombre: data.nombre,
          tipo: 'supervisor',
          saldoFinal,
          recibosCount: data.recibos?.length || 0,
          esActivo: true
        });
        
        console.log(`✓ Supervisor ${clave} (${data.nombre}): $${saldoFinal.toFixed(2)} - Descargando PDF...`);
        
        // Simular la descarga del PDF como lo hace SupervisoresComisionList
        try {
          // Obtener datos bancarios del cache/batch
          const datosUsuario = datosBancariosMap.get(String(clave));
          
          // Buscar información del supervisor (igual que en SupervisoresComisionList)
          const supervisor = usuarios.find(u => String(u.clave) === String(clave));
          console.log(`Supervisor info encontrada:`, supervisor);
          
          // Descargar PDF del supervisor (usando la misma estructura que SupervisoresComisionList)
          await descargarSupervisorPDF({
            supervisor: supervisor, // Pasar el objeto completo del supervisor
            claveSupervisor: clave,
            data,
            usuarios: usuarios || [],
            tipo: "supervisor",
            fechaInicio,
            fechaFin,
            datosUsuario
          });
          
          console.log(`  ✓ PDF descargado para supervisor ${clave}`);
          totalDescargados++;
        } catch (pdfError) {
          console.error(`  ✗ Error descargando PDF para supervisor ${clave}:`, pdfError);
        }
        
        totalProcesados++;
      } catch (error) {
        console.error(`✗ Error procesando supervisor ${clave}:`, error);
      }
    }
    
    // Resumen final
    console.log('=== RESUMEN FINAL ===');
    console.log(`Total procesados: ${totalProcesados}`);
    console.log(`PDFs descargados exitosamente: ${totalDescargados}`);
    console.log(`Usuarios con saldo negativo: ${saldosFinales.filter(u => u.saldoFinal < 0).length}`);
    console.log(`Usuarios con saldo positivo: ${saldosFinales.filter(u => u.saldoFinal > 0).length}`);
    console.log(`Usuarios con saldo cero: ${saldosFinales.filter(u => u.saldoFinal === 0).length}`);
    
    // Mostrar usuarios con saldo negativo
    const usuariosNegativos = saldosFinales.filter(u => u.saldoFinal < 0);
    if (usuariosNegativos.length > 0) {
      console.log('--- USUARIOS CON SALDO NEGATIVO ---');
      usuariosNegativos.forEach(usuario => {
        console.log(`${usuario.tipo.toUpperCase()} ${usuario.clave} (${usuario.nombre}): $${usuario.saldoFinal.toFixed(2)}`);
      });
    }
    
    console.log('Datos completos:', saldosFinales);
    
    // Actualizar estado con resultados
    setResultadosMasivos({
      totalProcesados,
      totalDescargados,
      usuariosNegativos: saldosFinales.filter(u => u.saldoFinal < 0),
      usuariosPositivos: saldosFinales.filter(u => u.saldoFinal > 0),
      usuariosCero: saldosFinales.filter(u => u.saldoFinal === 0),
      saldosFinales,
      fechaProcesamiento: new Date().toLocaleString()
    });
    setProcesandoMasivo(false);
    
    return saldosFinales;
    
  } catch (error) {
    console.error('Error en procesamiento masivo:', error);
    setResultadosMasivos({
      error: error.message,
      fechaProcesamiento: new Date().toLocaleString()
    });
    setProcesandoMasivo(false);
    return [];
  }
};
