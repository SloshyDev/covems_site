import React, { useEffect, useMemo, useRef } from "react";
import AgenteStateCard from "./AgenteStateCard";

const AgentesList = ({ 
  agentesData, 
  usuarios, 
  clavesActivos, 
  clavesCancelados, 
  unificado = false,
  fechaInicio = "",
  fechaFin = "",
  onTotalesCalculados // Nueva prop para pasar totales al padre
}) => {
  const getAgentePorClave = (agenteClave) => {
    return usuarios.find(u => String(u.clave) === String(agenteClave));
  };

  // Memorizar las listas filtradas para evitar recálculos
  const { activos, cancelados, sinClasificar } = useMemo(() => {
    const clavesActivosStr = clavesActivos.map(String);
    const clavesCanceladosStr = clavesCancelados.map(String);
    
    const entradas = Object.entries(agentesData);
    
    return {
      activos: entradas.filter(([clave]) => clavesActivosStr.includes(String(clave))),
      cancelados: entradas.filter(([clave]) => clavesCanceladosStr.includes(String(clave))),
      sinClasificar: entradas.filter(([clave]) => 
        !clavesActivosStr.includes(String(clave)) && 
        !clavesCanceladosStr.includes(String(clave))
      )
    };
  }, [agentesData, clavesActivos, clavesCancelados]);

  const renderAgenteCard = (agenteClave, data) => {
    const agente = getAgentePorClave(agenteClave);
    const isActivo = clavesActivos.map(String).includes(String(agenteClave));
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
    // Calcular totales para la tabla
    const totalPrima = data.recibos.reduce((acc, r) => acc + (r.primaFracc || 0), 0);
    const totalComision = data.recibos.reduce((acc, r) => acc + (r.comisAgente || 0), 0);
    return (
      <AgenteStateCard
        key={agenteClave}
        agenteClave={agenteClave}
        agenteNombre={agente ? agente.nombre : ''}
        saldoPendiente={0} // Los saldos pendientes ya están incluidos en los recibos
        data={{
          ...data,
          totalPrima,
          totalComision
        }}
        isActivo={isActivo}
        supervisorInfo={supervisorInfo}
        usuarios={usuarios}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
      />
    );
  };

  // Memorizar los totales calculados para evitar recálculos innecesarios
  const totalesCalculados = useMemo(() => {
    let totalPrimaAgentes = 0;
    let totalComisionAgentes = 0;
    
    // Calcular totales solo de agentes activos (para el resumen)
    if (activos && activos.length > 0) {
      activos.forEach(([clave, data]) => {
        if (data && data.recibos && Array.isArray(data.recibos)) {
          // Calcular totales de la última fila como se muestra en la tabla
          const totalPrima = data.recibos.reduce((acc, r) => acc + (r.primaFracc || 0), 0);
          const totalComision = data.recibos.reduce((acc, r) => acc + (r.comisAgente || 0), 0);
          
          totalPrimaAgentes += totalPrima;
          totalComisionAgentes += totalComision;
        }
      });
    }
    
    const resultado = {
      tipo: 'agentes',
      totalPrima: totalPrimaAgentes,
      totalComision: totalComisionAgentes,
      cantidadUsuarios: activos ? activos.length : 0
    };
    
    // Llamar al callback directamente cuando hay cambios reales
    if (onTotalesCalculados) {
      // Usar setTimeout para evitar el bucle en el render
      setTimeout(() => {
        onTotalesCalculados(resultado);
      }, 0);
    }
    
    return resultado;
  }, [activos, onTotalesCalculados]);

  return (
    <>
      {/* Listado unificado de activos */}
      {unificado ? null : <h2 className="text-lg font-bold text-green-400 mb-2">Agentes Activos</h2>}
      <div className="grid gap-6 mb-8">
        {activos.map(([clave, data]) => renderAgenteCard(clave, data))}
        {activos.length === 0 && (
          <div className="text-gray-400">No hay activos en este corte.</div>
        )}
      </div>

      {/* Cancelados */}
      {!unificado && <h2 className="text-lg font-bold text-red-400 mb-2">Agentes Cancelados</h2>}
      {!unificado && (
        <div className="grid gap-6 mb-8">
          {cancelados.map(([clave, data]) => renderAgenteCard(clave, data))}
          {cancelados.length === 0 && (
            <div className="text-gray-400">No hay agentes cancelados en este corte.</div>
          )}
        </div>
      )}

      {/* Sin clasificar */}
      {!unificado && <h2 className="text-lg font-bold text-yellow-400 mb-2">Agentes sin clasificar</h2>}
      {!unificado && (
        <div className="grid gap-6 mb-8">
          {sinClasificar.map(([clave, data]) => renderAgenteCard(clave, data))}
          {sinClasificar.length === 0 && (
            <div className="text-gray-400">No hay agentes sin clasificar en este corte.</div>
          )}
        </div>
      )}
    </>
  );
};

export default AgentesList;
