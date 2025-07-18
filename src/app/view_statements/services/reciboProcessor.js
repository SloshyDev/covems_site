import { crearEstructuraInicial } from "../utils/dataUtils";

// Procesar recibos normales y agrupar por agente y supervisor
export const procesarRecibosNormales = (filteredRecibos, usuarios) => {
  const grouped = {};
  const supervisores = {};
  const supervisoresRec = {};

  filteredRecibos.forEach(recibo => {
    const agente = recibo.claveAgente || "Sin agente";
    
    // Crear estructura para el agente si no existe
    if (!grouped[agente]) {
      grouped[agente] = crearEstructuraInicial();
    }
    
    // Añadir recibo y actualizar totales
    grouped[agente].recibos.push(recibo);
    grouped[agente].totalComisPromotoria += recibo.comisPromotoria || 0;
    grouped[agente].totalComisAgente += recibo.comisAgente || 0;
    grouped[agente].totalComisSupervisor += recibo.comisSupervisor || 0;
    grouped[agente].totalPrimaFracc += recibo.primaFracc || 0;

    // Procesar comisiones de supervisor
    if (recibo.comisSupervisor && recibo.comisSupervisor !== 0 && agente !== "Sin agente") {
      const userAgente = usuarios.find(u => String(u.clave) === String(agente));
      if (userAgente && userAgente.supervisor_clave) {
        const claveSupervisor = userAgente.supervisor_clave;
        // Solo considerar como supervisor si la clave es mayor a 1800
        if (claveSupervisor > 1800) {
          if (!supervisores[claveSupervisor]) {
            supervisores[claveSupervisor] = 0;
            // Buscar información del supervisor
            const supervisorInfo = usuarios.find(u => String(u.clave) === String(claveSupervisor));
            supervisoresRec[claveSupervisor] = { 
              recibos: [], 
              totalComisSupervisor: 0,
              totalComisPromotoria: 0, // Agregar esta propiedad
              totalComisAgente: 0,     // Agregar esta propiedad  
              totalPrimaFracc: 0,      // Agregar esta propiedad
              totalComision: 0,        // Alias para totalComisSupervisor
              totalPrima: 0,           // Agregar esta propiedad
              nombre: supervisorInfo ? supervisorInfo.nombre : `Supervisor ${claveSupervisor}`
            };
          }
          supervisores[claveSupervisor] += recibo.comisSupervisor;
          supervisoresRec[claveSupervisor].recibos.push(recibo);
          supervisoresRec[claveSupervisor].totalComisSupervisor += recibo.comisSupervisor;
          // Para supervisores, no sumar comisAgente de recibos normales - solo de saldos pendientes
          supervisoresRec[claveSupervisor].totalComision += recibo.comisSupervisor; // Solo comisión supervisor para recibos normales
          supervisoresRec[claveSupervisor].totalPrimaFracc += recibo.primaFracc || 0;
        }
      }
    }
  });

  return { grouped, supervisores, supervisoresRec };
};
