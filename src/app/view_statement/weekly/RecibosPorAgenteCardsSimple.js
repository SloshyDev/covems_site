import React from "react";
import ReciboCardSimple from "./ReciboCardSimple";
import ExportAgentePDFButton from "./components/ExportAgentePDFButton";

// RecibosJson: array de arrays, cada uno con los campos mínimos
// saldosPendientes: objeto { claveAgente: saldoObj }
export default function RecibosPorAgenteCardsSimple({ recibosJson, saldosPendientes, usuarios = [], fechaInicioCorte }) {
  // Agrupar por claveAgente (primer campo)
  const agrupados = React.useMemo(() => {
    const map = {};
    for (const recibo of recibosJson) {
      const clave = recibo[0] || "SinClave";
      if (!map[clave]) map[clave] = [];
      map[clave].push(recibo);
    }
    return map;
  }, [recibosJson]);

  // Crear grupos de supervisores basados en las comisiones
  const supervisores = React.useMemo(() => {
    const supervisorMap = {};
    
    for (const recibo of recibosJson) {
      const comisionSupervisor = parseFloat(recibo[12]) || 0; // comisSupervisor está en índice 12
      
      if (comisionSupervisor !== 0) { // Incluir tanto positivas como negativas
        const claveAgente = recibo[0] || "SinClave";
        
        // Buscar el usuario agente para obtener supervisor_clave
        const agenteUsuario = usuarios.find(u => String(u.clave) === String(claveAgente));
        const supervisorClave = agenteUsuario?.supervisor_clave;
        
        if (supervisorClave) {
          if (!supervisorMap[supervisorClave]) {
            supervisorMap[supervisorClave] = [];
          }
          
          // Crear un "recibo" modificado para el supervisor
          const reciboSupervisor = [...recibo];
          reciboSupervisor[0] = supervisorClave; // Cambiar clave al supervisor
          reciboSupervisor[10] = recibo[12]; // Mover comisión supervisor a posición de comisión agente
          reciboSupervisor[12] = 0; // Limpiar comisión supervisor original
          
          supervisorMap[supervisorClave].push(reciboSupervisor);
        }
      }
    }
    
    return supervisorMap;
  }, [recibosJson, usuarios]);

  const todosLosGrupos = { ...agrupados, ...supervisores };

  // Separar por estado del usuario
  const gruposActivos = {};
  const gruposCancelados = {};

  Object.entries(todosLosGrupos).forEach(([clave, recibos]) => {
    const usuario = usuarios.find(u => String(u.clave) === String(clave));
    const estado = usuario?.estado?.toLowerCase();
    
    if (estado === 'cancelado') {
      gruposCancelados[clave] = recibos;
    } else {
      // Por defecto, consideramos activos (incluso si no hay usuario encontrado)
      gruposActivos[clave] = recibos;
    }
  });

  if (!Object.keys(todosLosGrupos).length) return <div className="text-gray-400">No hay recibos para mostrar.</div>;

  // Función para renderizar un grupo de cards
  const renderCards = (grupos, titulo, estiloCard = "bg-gray-800") => {
    if (!Object.keys(grupos).length) return null;

    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">{titulo}</h2>
        <div className="grid grid-cols-2 gap-8 w-full mx-auto">
          {Object.entries(grupos).map(([clave, recibos]) => {
            // Determinar si es un supervisor
            const esSupervisor = supervisores[clave];
            
            // Sumar comisión agente (índice 10)
            const totalComisionAgente = recibos.reduce((sum, r) => sum + (parseFloat(r[10]) || 0), 0);
            const saldoPendiente = saldosPendientes?.[clave]?.saldo ?? 0;
            const saldoActual = Number(saldoPendiente) + Number(totalComisionAgente);
            
            // Buscar usuario por clave
            const usuario = usuarios.find(u => String(u.clave) === String(clave));
            
            return (
              <div key={clave} className={`rounded-xl shadow-lg px-8 py-6 w-full ${estiloCard}`}>
                <div className="flex justify-between items-start mb-4">
                  {/* Datos del agente/supervisor a la izquierda */}
                  <div className="flex-1 text-left mr-4">
                    <h3 className="text-2xl font-bold text-gray-100 mb-2">
                      {esSupervisor ? 'Supervisor' : 'Agente'}: {clave}
                    </h3>
                    {usuario && (
                      <div className="text-lg font-normal text-blue-200">
                        <div className="mb-1">{usuario.nombre}</div>
                        
                        {usuario.banco || usuario.cuenta_clabe ? (
                          <div className="text-xs text-gray-300">
                            {usuario.banco && <div>Banco: <span className="font-semibold text-green-300">{usuario.banco}</span></div>}
                            {usuario.cuenta_clabe && <div>CLABE: <span className="font-mono text-yellow-200">{usuario.cuenta_clabe}</span></div>}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {/* Botón a la derecha */}
                  <div className="flex-shrink-0">
                    <ExportAgentePDFButton
                      clave={clave}
                      nombre={usuario?.nombre || ""}
                      recibos={recibos}
                      saldo={{
                        saldo: saldosPendientes?.[clave]?.saldo ?? 0,
                        saldoActual: (Number(saldosPendientes?.[clave]?.saldo ?? 0) + recibos.reduce((sum, r) => sum + (parseFloat(r[10]) || 0), 0))
                      }}
                      fechaInicioCorte={fechaInicioCorte}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                  <span className="text-base font-semibold text-orange-400 bg-gray-900 px-3 py-1 rounded-lg">
                    Saldo pendiente: <span className={saldoPendiente < 0 ? "text-red-400" : "text-green-400"}>${Number(saldoPendiente).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </span>
                  <span className={`text-base font-semibold px-3 py-1 rounded-lg bg-gray-900 ${esSupervisor ? 'text-purple-300' : 'text-blue-300'}`}>
                    {esSupervisor ? 'Comisión supervisor' : 'Comisión agente'}: <span className={totalComisionAgente < 0 ? "text-red-400" : "text-green-400"}>${Number(totalComisionAgente).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </span>
                  <span className="text-base font-semibold text-green-300 bg-gray-900 px-3 py-1 rounded-lg">
                    Saldo actual: <span className={saldoActual < 0 ? "text-red-400" : "text-green-400"}>${saldoActual.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-4">Total recibos: {recibos.length}</div>
                <ul
                  className="divide-y divide-gray-700"
                  style={{
                    maxHeight: recibos.length > 4 ? 420 : 'auto',
                    overflowY: recibos.length > 4 ? 'auto' : 'visible',
                    minHeight: 0,
                    paddingRight: recibos.length > 5 ? 8 : 0
                  }}
                >
                  {recibos.map((recibo, idx) => (
                    <ReciboCardSimple key={idx} recibo={recibo} />
                  ))}
                  {/* Totales al final */}
                  <li className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-6 text-base font-bold text-blue-200">
                    <span>Total Prima Fracc: <span className="text-green-300">${recibos.reduce((sum, r) => sum + (parseFloat(r[6]) || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></span>
                    <span>Total {esSupervisor ? 'Comis Supervisor' : 'Comis Agente'}: <span className="text-green-300">${recibos.reduce((sum, r) => sum + (parseFloat(r[10]) || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></span>
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 w-full mx-auto">
      {renderCards(gruposActivos, "Usuarios Activos", "bg-gray-800")}
      {renderCards(gruposCancelados, "Usuarios Cancelados", "bg-gray-800 border-2 border-red-500")}
    </div>
  );
}
