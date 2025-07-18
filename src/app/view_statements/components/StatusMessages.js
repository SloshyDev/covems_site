import React from "react";

const StatusMessages = ({ loading, error, agentesData, filteredRecibos }) => (
  <>
    {loading && <div className="text-gray-300 mb-4">Cargando recibos...</div>}
    {error && <div className="text-red-400 mb-4">{error}</div>}
    {Object.keys(agentesData).length === 0 && !loading && (
      <div className="text-yellow-400 mb-4">
        No hay recibos para el corte seleccionado.
      </div>
    )}
  </>
);

export default StatusMessages;
