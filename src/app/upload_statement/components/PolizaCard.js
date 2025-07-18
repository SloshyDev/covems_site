import React from "react";
import ReciboCard from "./ReciboCard";
import { getComisionPorcentaje } from "../utils/comisiones";

export default function PolizaCard({ poliza, recibos, headers, agenteClave }) {
  const comisIdx = headers.findIndex(h => h.toLowerCase() === '% comis');
  const anioVigIdx = headers.findIndex(h => h.toLowerCase() === 'año vig.');
  const anioVig = recibos[0] && recibos[0][anioVigIdx];
  const comision = getComisionPorcentaje(agenteClave, anioVig);
  return (
    <li className="mb-2">
      <div className="font-semibold text-blue-200 mb-1 flex items-center gap-4">
        <span>Póliza: {poliza}</span>
        <span className="text-sm text-lime-300 font-normal">Año Vig: {anioVig}</span>
      </div>
      <ul className="ml-4">
        {recibos.map((row, idx) => (
          <ReciboCard key={idx} row={row} headers={headers} agenteClave={agenteClave} />
        ))}
      </ul>
    </li>
  );
}
