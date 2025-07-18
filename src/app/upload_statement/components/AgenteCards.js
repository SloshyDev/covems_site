import React from "react";
import AgenteCard from "./AgenteCard";

export default function AgenteCards({ headers, data, polizas }) {
  // Crear un mapa para buscar agenteClave por poliza (No. Poliza)
  const polizaMap = React.useMemo(() => {
    const map = {};
    if (Array.isArray(polizas)) {
      for (const p of polizas) {
        if (p.poliza != null) {
          map[String(p.poliza)] = p.agenteClave;
        }
      }
    }
    return map;
  }, [polizas]);

  // Determinar el índice de la columna No. Poliza
  const noPolizaIdx = headers.findIndex((h) => h === "No. Poliza");

  // Agrupar por agenteClave y luego por póliza
  const agentes = React.useMemo(() => {
    const grupos = {};
    data.forEach((row) => {
      const noPoliza = row[noPolizaIdx] != null ? String(row[noPolizaIdx]) : "Sin póliza";
      const agenteClave = polizaMap[noPoliza] ?? "Sin agente";
      if (!grupos[agenteClave]) grupos[agenteClave] = {};
      if (!grupos[agenteClave][noPoliza]) grupos[agenteClave][noPoliza] = [];
      grupos[agenteClave][noPoliza].push(row);
    });
    return grupos;
  }, [data, polizaMap, noPolizaIdx]);

  return (
    <div className="grid grid-cols-2 items-center w-full gap-4">
      {Object.entries(agentes).map(([agenteClave, polizas]) => (
        <AgenteCard
          key={agenteClave}
          agenteClave={agenteClave}
          polizas={polizas}
          headers={headers}
        />
      ))}
    </div>
  );
}
