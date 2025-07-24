// utils/recibos.js
// Utilidad para insertar recibos en la base de datos

export async function insertarRecibos(recibosFilterados) {
  // Importar dinámicamente las funciones de comisiones
  const { getComisionMontoRecibo, getComisionAgenteRecibo, getComisionSupervisorRecibo } = await import("../comisiones");
  
  if (!recibosFilterados || recibosFilterados.length === 0) {
    throw new Error("No hay recibos para insertar.");
  }

  // Primero, agrupar recibos por agente usando la API para obtener las claves correctas
  const response = await fetch("/api/recibos-agente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recibos: recibosFilterados })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  
  const recibosPorAgente = data.recibosPorAgente || {};

  const recibosParaInsertar = [];
  const errores = [];

  // Procesar solo recibos de agentes (evita duplicados)
  for (const [agenteClave, recibos] of Object.entries(recibosPorAgente)) {
    for (let i = 0; i < recibos.length; i++) {
      const recibo = recibos[i];
      
      try {
        // Índices según el archivo comisiones.js
        const idxs = {
          nivelacionIdx: 19,
          comis1erAnioIdx: 20,
          importeCombleIdx: 17,
          comisIdx: 18,
          dsnIdx: 9,
          formaPagoIdx: 22,
          primaFraccIdx: 15,
          recargoFijoIdx: 16,
        };

        const anioVig = recibo[11];
        
        // Calcular comisiones usando las funciones del archivo comisiones.js
        const comisionPromotoria = getComisionMontoRecibo(recibo, idxs);
        const comisionAgente = getComisionAgenteRecibo(recibo, idxs, agenteClave, anioVig);
        const comisionSupervisor = getComisionSupervisorRecibo(recibo, idxs);

        // Mapear índices según el esquema de Prisma
        const reciboData = {
          grupo: recibo[0] || null,
          claveAgente: parseInt(agenteClave), // Usar la clave del agente de agrupación
          fechaMovimiento: parsearFecha(recibo[3]),
          poliza: recibo[4] ? String(recibo[4]).trim() : '',
          nombreAsegurado: recibo[6] || null,
          recibo: recibo[7] || null,
          dsn: recibo[9] || null,
          sts: recibo[10] || null,
          anioVig: recibo[11] ? parseInt(recibo[11]) : null,
          fechaInicio: parsearFecha(recibo[12]),
          fechaVencimiento: parsearFecha(recibo[13]),
          primaFracc: recibo[15] ? parseFloat(recibo[15]) : null,
          recargoFijo: recibo[16] ? parseFloat(recibo[16]) : null,
          importeComble: recibo[17] ? parseFloat(recibo[17]) : null,
          pctComisPromotoria: recibo[18] ? parseFloat(recibo[18]) : null,
          comisPromotoria: comisionPromotoria.valor ? Math.round(comisionPromotoria.valor * 100) / 100 : null,
          pctComisAgente: comisionAgente.porcentaje || null,
          comisAgente: comisionAgente.valor ? Math.round(comisionAgente.valor * 100) / 100 : null,
          pctComisSupervisor: comisionSupervisor.tipo !== 'no_aplica' ? 7 : null, // 7% para supervisores cuando aplica
          comisSupervisor: comisionSupervisor.valor ? Math.round(comisionSupervisor.valor * 100) / 100 : null,
          nivelacionVariable: recibo[19] ? parseFloat(recibo[19]) : null,
          comisPrimerAnio: recibo[20] ? parseFloat(recibo[20]) : null,
          comisRenovacion: recibo[21] ? parseFloat(recibo[21]) : null,
          formaPago: recibo[22] || null
        };

        // Validar campos obligatorios
        if (!reciboData.poliza) {
          errores.push(`Agente ${agenteClave}, fila ${i + 1}: Falta número de póliza`);
          continue;
        }

        recibosParaInsertar.push(reciboData);
      } catch (error) {
        errores.push(`Agente ${agenteClave}, fila ${i + 1}: Error procesando recibo - ${error.message}`);
      }
    }
  }

  

  if (errores.length > 0) {
    console.warn('Errores encontrados:', errores);
  }

  if (recibosParaInsertar.length === 0) {
    throw new Error("No hay recibos válidos para insertar.");
  }

  // Enviar recibos al backend en lotes para evitar timeouts
  const tamanoLote = 100;
  let insertados = 0;
  let fallos = 0;

  for (let i = 0; i < recibosParaInsertar.length; i += tamanoLote) {
    const lote = recibosParaInsertar.slice(i, i + tamanoLote);
    
    try {
      const response = await fetch('/api/recibo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recibos: lote })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error en el servidor');
      }

      insertados += result.insertados || lote.length;
      
    } catch (error) {
      console.error(`Error insertando lote ${Math.floor(i / tamanoLote) + 1}:`, error);
      fallos += lote.length;
    }
  }

  const resultado = {
    total: recibosFilterados.length,
    procesados: recibosParaInsertar.length,
    insertados,
    fallos,
    errores: errores.length
  };


  if (insertados === 0) {
    throw new Error("No se pudo insertar ningún recibo en la base de datos.");
  }

  return resultado;
}

// Función auxiliar para parsear fechas
function parsearFecha(fechaStr) {
  if (!fechaStr) return null;
  
  try {
    const fechaLimpia = fechaStr.toString().trim().replace(/-/g, '/').replace(/\s+/g, '');
    const parts = fechaLimpia.split('/');
    
    if (parts.length === 3) {
      // Asumiendo formato DD/MM/YYYY
      const dia = parseInt(parts[0]);
      const mes = parseInt(parts[1]);
      const anio = parseInt(parts[2]);
      
      if (dia > 0 && dia <= 31 && mes > 0 && mes <= 12 && anio > 1900) {
        return new Date(anio, mes - 1, dia);
      }
    }
    
    // Intentar parsear directamente
    const fecha = new Date(fechaLimpia);
    if (!isNaN(fecha.getTime())) {
      return fecha;
    }
    
    return null;
  } catch (error) {
    console.warn(`Error parseando fecha "${fechaStr}":`, error);
    return null;
  }
}