import React from "react";

const ResumenCorte = ({ agentesData, supervisoresRecibos, filteredRecibos, totalesCalculados }) => {
  // Calcular totales directamente desde los recibos filtrados del backend
  const totalPrima = React.useMemo(() => {
    return (filteredRecibos || []).reduce((sum, recibo) => sum + (recibo.primaFracc || 0), 0);
  }, [filteredRecibos]);
  
  const totalComisionPromotoria = React.useMemo(() => {
    return (filteredRecibos || []).reduce((sum, recibo) => sum + (recibo.comisPromotoria || 0), 0);
  }, [filteredRecibos]);
  
  const cantidadUsuarios = totalesCalculados?.cantidadUsuarios || 0;
  
  // Calcular cantidad total de usuarios (agentes + supervisores) incluyendo cancelados
  const totalAgentes = Object.keys(agentesData || {}).length;
  const totalSupervisores = Object.keys(supervisoresRecibos || {}).length;
  const totalUsuarios = totalAgentes + totalSupervisores;

  return (
    <div className="bg-slate-700 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-bold text-white mb-2">Resumen del Corte</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="text-center">
          <div className="text-gray-400">Total Recibos</div>
          <div className="text-white font-bold">{filteredRecibos?.length || 0}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Usuarios Activos</div>
          <div className="text-white font-bold">
            {cantidadUsuarios > 0 ? cantidadUsuarios : totalUsuarios}
          </div>
          <div className="text-xs text-gray-400">
            A:{totalAgentes} | S:{totalSupervisores}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Total Usuarios</div>
          <div className="text-white font-bold">{totalUsuarios}</div>
          <div className="text-xs text-gray-400">
            (Activos + Cancelados)
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Prima Total</div>
          <div className="text-white font-bold">
            {totalPrima.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Comisión Promotoria</div>
          <div className="text-white font-bold">
            {totalComisionPromotoria.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          </div>
        </div>     
      </div>
      <div className="mt-3 text-xs text-gray-400 space-y-1">
        <div>* Prima Total: suma de primaFracc de todos los recibos filtrados</div>
        <div>* Comisión Promotoria: suma de comisPromotoria de todos los recibos filtrados</div>
      </div>
    </div>
  );
};

export default ResumenCorte;
