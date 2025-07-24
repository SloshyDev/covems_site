import React from "react";
import ReciboCard from "./ReciboCard";
import { getSaldoCardProps } from "./utils/saldos";

function RecibosPorAgenteCards({ recibosJson, saldosPendientesPorClave = {}, onDataUpdate }) {
  const [recibosPorAgente, setRecibosPorAgente] = React.useState({});
  const [recibosPorSupervisor, setRecibosPorSupervisor] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!recibosJson || !recibosJson.length) {
      setRecibosPorAgente({});
      setRecibosPorSupervisor({});
      if (onDataUpdate) {
        onDataUpdate({}, {});
      }
      return;
    }
    
    setLoading(true);
    setError("");
    
    fetch("/api/recibos-agente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recibos: recibosJson })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const agentes = data.recibosPorAgente || {};
        const supervisores = data.recibosPorSupervisor || {};
        
        setRecibosPorAgente(agentes);
        setRecibosPorSupervisor(supervisores);
        
        // Notificar al componente padre solo si hay cambios
        if (onDataUpdate) {
          onDataUpdate(agentes, supervisores);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [recibosJson, onDataUpdate]);

  if (loading) return <div className="text-gray-200">Cargando recibos...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!Object.keys(recibosPorAgente).length) return <div className="text-gray-400">No hay recibos para mostrar.</div>;

  return (
    <div className="grid grid-cols-2 gap-8 mt-8 w-full mx-auto">
      {/* Cards de agentes */}
      {Object.entries(recibosPorAgente).map(([agenteClave, recibos]) => {
        const saldoPendiente = saldosPendientesPorClave[agenteClave];
        // Calcular suma comisión agente
        let totalComisionAgente = 0;
        try {
          // Índices igual que en ReciboCard.js
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
          const { getComisionAgenteRecibo } = require("./comisiones");
          totalComisionAgente = recibos.reduce((sum, recibo) => {
            const anioVig = recibo[11];
            const c = getComisionAgenteRecibo(recibo, idxs, agenteClave, anioVig);
            return sum + (c && c.valor ? c.valor : 0);
          }, 0);
        } catch (e) {}
        // Usar utilidad para props de saldo
        const saldoPropsAll = getSaldoCardProps({ clave: agenteClave, saldoPendiente, totalComision: totalComisionAgente });
        const { saldoActual, totalComisionFixed, ...saldoProps } = saldoPropsAll;
        return (
          <div
            key={agenteClave}
            className="bg-gray-800 rounded-xl shadow-lg px-8 py-6 w-full"
            {...saldoProps}
          >
            <h3 className="text-2xl font-bold text-gray-100 mb-3">
              Agente: {agenteClave}
              {saldoPendiente !== undefined && (
                <span className="ml-4 text-base font-semibold text-orange-400 bg-gray-900 px-3 py-1 rounded-lg">
                  Saldo Pendiente: <span className={saldoPendiente < 0 ? "text-red-400" : "text-green-400"}>${Number(saldoPendiente).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
              )}
              <span className="ml-4 text-base font-semibold text-blue-300 bg-gray-900 px-3 py-1 rounded-lg">
                Comisión: <span className={totalComisionAgente < 0 ? "text-red-400" : "text-green-400"}>${Number(totalComisionFixed).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
              {saldoActual !== null && (
                <span className="ml-4 text-base font-semibold text-green-300 bg-gray-900 px-3 py-1 rounded-lg">
                  Saldo Actual: <span className={saldoActual < 0 ? "text-red-400" : "text-green-400"}>${saldoActual.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-300 mb-4">Total recibos: {recibos.length}</div>
            <ul
              className="divide-y divide-gray-700"
              style={{
                maxHeight: recibos.length > 3 ? 400 : 'auto',
                overflowY: recibos.length > 3 ? 'auto' : 'visible',
                minHeight: 0,
                paddingRight: 8
              }}
            >
              {recibos.map((recibo, idx) => (
                <ReciboCard key={idx} recibo={recibo} agenteClave={agenteClave} />
              ))}
            </ul>
          </div>
        );
      })}

      {/* Cards de supervisores como agentes */}
      {Object.entries(recibosPorSupervisor).map(([supervisor, items]) => {
        const totalComision = items.reduce((sum, item) => sum + (item.comision || 0), 0);
        // Usar utilidad para props de saldo
        const saldoPendiente = saldosPendientesPorClave[supervisor];
        const saldoPropsAll = getSaldoCardProps({ clave: supervisor, saldoPendiente, totalComision });
        const { saldoActual: saldoActualSup, totalComisionFixed: totalComisionFixedSup, ...saldoPropsSup } = saldoPropsAll;
        return (
          <div
            key={"supervisor-" + supervisor}
            className="bg-gray-800 rounded-xl shadow-lg px-8 py-6 w-full"
            {...saldoPropsSup}
          >
            <h3 className="text-2xl font-bold text-gray-100 mb-3">
              Supervisor: {supervisor}
              {saldoPendiente !== undefined && (
                <span className="ml-4 text-base font-semibold text-orange-400 bg-gray-900 px-3 py-1 rounded-lg">
                  Saldo Pendiente: <span className={saldoPendiente < 0 ? "text-red-400" : "text-green-400"}>${Number(saldoPendiente).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
              )}
              <span className="ml-4 text-base font-semibold text-blue-300 bg-gray-900 px-3 py-1 rounded-lg">
                Comisión: <span className={totalComision < 0 ? "text-red-400" : "text-green-400"}>${Number(totalComisionFixedSup).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
              {saldoActualSup !== null && (
                <span className="ml-4 text-base font-semibold text-green-300 bg-gray-900 px-3 py-1 rounded-lg">
                  Saldo Actual: <span className={saldoActualSup < 0 ? "text-red-400" : "text-green-400"}>${saldoActualSup.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-300 mb-4">Recibos con comisión: {items.length}</div>
            <ul
              className="divide-y divide-gray-700"
              style={{
                maxHeight: items.length > 3 ? 400 : 'auto',
                overflowY: items.length > 3 ? 'auto' : 'visible',
                minHeight: 0,
                paddingRight: 8
              }}
            >
              {items.map((item, idx) => (
                  <ReciboCard key={idx} recibo={item.recibo} agenteClave={item.agenteClave} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// Usar React.memo para evitar re-renders innecesarios
export default React.memo(RecibosPorAgenteCards, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian los datos relevantes
  return (
    JSON.stringify(prevProps.recibosJson) === JSON.stringify(nextProps.recibosJson) &&
    JSON.stringify(prevProps.saldosPendientesPorClave) === JSON.stringify(nextProps.saldosPendientesPorClave) &&
    prevProps.onDataUpdate === nextProps.onDataUpdate
  );
});
