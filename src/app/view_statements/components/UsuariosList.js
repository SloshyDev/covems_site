"use client";

import React, { useMemo, useEffect } from "react";
import AgenteStateCard from "./AgenteStateCard";
import SupervisoresComisionList from "./SupervisoresComisionList";

const UsuariosList = ({ 
  agentesData = {}, 
  supervisoresRecibos = {}, 
  usuarios = [], 
  clavesActivos = [], 
  clavesCancelados = [], 
  fechaInicio, 
  fechaFin, 
  onTotalesCalculados 
}) => {
  
  const getUsuarioPorClave = (clave) => {
    return usuarios.find(u => String(u.clave) === String(clave));
  };

  // Combinar datos pero separar por tipo de usuario
  const { agentesCompletos, supervisoresCompletos, usuariosActivosUnificados } = useMemo(() => {
    const agentes = {};
    const supervisores = {};
    const activosUnificados = {};
    
    // Agregar agentes (clave <= 1800)
    Object.entries(agentesData).forEach(([clave, data]) => {
      const claveNum = parseInt(clave);
      if (claveNum <= 1800) {
        agentes[clave] = {
          ...data,
          tipo: 'agente'
        };
        // Si es activo, agregarlo a la sección unificada
        if (clavesActivos.map(String).includes(String(clave))) {
          activosUnificados[clave] = {
            ...data,
            tipo: 'agente'
          };
        }
      }
    });
    
    // Agregar supervisores (clave > 1800)
    Object.entries(supervisoresRecibos).forEach(([clave, data]) => {
      const claveNum = parseInt(clave);
      if (claveNum > 1800) {
        supervisores[clave] = {
          ...data,
          tipo: 'supervisor'
        };
        // Todos los supervisores van a la sección unificada (considerados como "activos")
        activosUnificados[clave] = {
          ...data,
          tipo: 'supervisor'
        };
      }
    });
    
    return { 
      agentesCompletos: agentes, 
      supervisoresCompletos: supervisores,
      usuariosActivosUnificados: activosUnificados
    };
  }, [agentesData, supervisoresRecibos, clavesActivos]);

  // Clasificar usuarios por estado (solo agentes, supervisores van a la sección unificada)
  const { cancelados, sinClasificar, activosUnificados } = useMemo(() => {
    const clavesActivosStr = clavesActivos.map(String);
    const clavesCanceladosStr = clavesCancelados.map(String);
    
    const entradasAgentes = Object.entries(agentesCompletos);
    const entradasActivosUnificados = Object.entries(usuariosActivosUnificados);
    
    return {
      activosUnificados: entradasActivosUnificados, // Agentes activos + Supervisores
      cancelados: entradasAgentes.filter(([clave]) => clavesCanceladosStr.includes(String(clave))),
      sinClasificar: entradasAgentes.filter(([clave]) => 
        !clavesActivosStr.includes(String(clave)) && 
        !clavesCanceladosStr.includes(String(clave))
      )
    };
  }, [agentesCompletos, usuariosActivosUnificados, clavesActivos, clavesCancelados]);

  const renderAgenteCard = (usuarioClave, data) => {
    const usuario = getUsuarioPorClave(usuarioClave);
    const isActivo = clavesActivos.map(String).includes(String(usuarioClave));
    let supervisorInfo = null;
    
    // Buscar supervisor del agente
    if (usuario && usuario.supervisor_clave) {
      const supervisor = usuarios.find(u => String(u.clave) === String(usuario.supervisor_clave));
      if (supervisor) {
        supervisorInfo = {
          clave: supervisor.clave,
          nombre: supervisor.nombre
        };
      }
    }
    
    // Calcular totales para la tabla (solo comisAgente para agentes)
    const totalPrima = data.recibos.reduce((acc, r) => acc + (r.primaFracc || 0), 0);
    const totalComision = data.recibos.reduce((acc, r) => acc + (r.comisAgente || 0), 0);

    return (
      <AgenteStateCard
        key={usuarioClave}
        agenteClave={usuarioClave}
        agenteNombre={usuario ? usuario.nombre : ''}
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

  const renderUsuarioUnificado = (usuarioClave, data) => {
    const usuario = getUsuarioPorClave(usuarioClave);
    
    if (data.tipo === 'supervisor') {
      // Renderizar supervisor con SupervisoresComisionList
      const supervisorData = { [usuarioClave]: data };
      return (
        <div key={`supervisor-${usuarioClave}`} className="mb-6">
          <SupervisoresComisionList
            supervisoresRecibos={supervisorData}
            usuarios={usuarios}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onTotalesCalculados={() => {}} // Los totales se calculan globalmente
          />
        </div>
      );
    } else {
      // Renderizar agente con AgenteStateCard
      return renderAgenteCard(usuarioClave, data);
    }
  };

  // Calcular totales y notificar al padre en useEffect para evitar llamadas durante render
  useEffect(() => {
    // Solo procesar si hay datos válidos
    if (!activosUnificados || activosUnificados.length === 0 || !onTotalesCalculados) {
      return;
    }
    
    let totalPrimaTotal = 0;
    let totalComisionTotal = 0;
    
    // Calcular totales de usuarios activos unificados (agentes + supervisores)
    activosUnificados.forEach(([clave, data]) => {
      if (data && data.recibos && Array.isArray(data.recibos)) {
        const totalPrima = data.recibos.reduce((acc, r) => acc + (r.primaFracc || 0), 0);
        // Usar la comisión correcta según el tipo
        const totalComision = data.tipo === 'agente' 
          ? data.recibos.reduce((acc, r) => acc + (r.comisAgente || 0), 0)
          : data.recibos.reduce((acc, r) => acc + (r.comisSupervisor || 0), 0);
        
        totalPrimaTotal += totalPrima;
        totalComisionTotal += totalComision;
      }
    });
    
    const resultado = {
      tipo: 'usuarios',
      totalPrima: totalPrimaTotal,
      totalComision: totalComisionTotal,
      cantidadUsuarios: activosUnificados.length
    };
    
    // Notificar al padre después del render
    onTotalesCalculados(resultado);
  }, [activosUnificados, onTotalesCalculados]);

  return (
    <>
      {/* Usuarios Activos - Agentes y Supervisores Unidos */}
      <h2 className="text-lg font-bold text-green-400 mb-2">Usuarios Activos (Agentes y Supervisores)</h2>
      <div className="grid gap-6 mb-8">
        {activosUnificados.map(([clave, data]) => renderUsuarioUnificado(clave, data))}
        {activosUnificados.length === 0 && (
          <div className="text-gray-400">No hay usuarios activos en este corte.</div>
        )}
      </div>

      {/* Usuarios Cancelados - Solo Agentes */}
      <h2 className="text-lg font-bold text-red-400 mb-2">Agentes Cancelados</h2>
      <div className="grid gap-6 mb-8">
        {cancelados.map(([clave, data]) => renderAgenteCard(clave, data))}
        {cancelados.length === 0 && (
          <div className="text-gray-400">No hay agentes cancelados en este corte.</div>
        )}
      </div>

      {/* Sin clasificar - Solo Agentes */}
      <h2 className="text-lg font-bold text-yellow-400 mb-2">Agentes sin clasificar</h2>
      <div className="grid gap-6 mb-8">
        {sinClasificar.map(([clave, data]) => renderAgenteCard(clave, data))}
        {sinClasificar.length === 0 && (
          <div className="text-gray-400">No hay agentes sin clasificar en este corte.</div>
        )}
      </div>
    </>
  );
};

export default UsuariosList;
