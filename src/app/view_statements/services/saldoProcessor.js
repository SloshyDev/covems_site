import { crearReciboSintético, crearEstructuraInicial } from "../utils/dataUtils";

// Procesar saldos pendientes y añadirlos como recibos sintéticos
export const procesarSaldosPendientes = (
  saldosPendientesEnCorte, 
  usuarios, 
  grouped, 
  supervisores, 
  supervisoresRec
) => {
  saldosPendientesEnCorte.forEach(saldo => {
    const agente = usuarios.find(u => u.id === saldo.agenteId);
    if (agente) {
      const agenteClave = agente.clave;
      
      // Si es un supervisor (clave > 1800), añadir a la sección de supervisores
      if (agenteClave > 1800) {
        if (!supervisores[agenteClave]) {
          supervisores[agenteClave] = 0;
          const supervisorInfo = usuarios.find(u => String(u.clave) === String(agenteClave));
          supervisoresRec[agenteClave] = { 
            recibos: [], 
            totalComisSupervisor: 0,
            totalComisPromotoria: 0,
            totalComisAgente: 0,
            totalPrimaFracc: 0,
            totalComision: 0,
            totalPrima: 0,
            nombre: supervisorInfo ? supervisorInfo.nombre : `Supervisor ${agenteClave}`
          };
        }
        
        // Crear recibo sintético para el supervisor
        const reciboSintéticoSupervisor = crearReciboSintético(saldo, agente, "supervisor");
        supervisoresRec[agenteClave].recibos.unshift(reciboSintéticoSupervisor);
        
        // Para supervisores con saldo pendiente, ponerlo en la columna comisión agente
        supervisoresRec[agenteClave].totalComisAgente += saldo.saldo;
        supervisoresRec[agenteClave].totalComision += saldo.saldo;
      } else {
        // Si es un agente (clave <= 1800), añadir a la sección de agentes
        // Crear el grupo del agente si no existe
        if (!grouped[agenteClave]) {
          grouped[agenteClave] = crearEstructuraInicial();
        }

        // Crear recibo sintético para el saldo pendiente
        const reciboSintético = crearReciboSintético(saldo, agente, "agente");

        // Añadir al inicio de la lista de recibos
        grouped[agenteClave].recibos.unshift(reciboSintético);
        
        // Sumar el saldo pendiente a totalComisAgente
        grouped[agenteClave].totalComisAgente += saldo.saldo;
      }
    }
  });

  return { grouped, supervisores, supervisoresRec };
};
