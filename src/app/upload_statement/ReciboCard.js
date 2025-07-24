import React from "react";
import { getComisionMontoRecibo, getComisionAgenteRecibo, getComisionSupervisorRecibo } from "./comisiones";

const HEADERS = [
  "Grupo",
  "Clave del agente",
  "Nombre del agente",
  "Fecha movimiento",
  "No. Poliza",
  "Nivel",
  "Nombre Asegurado",
  "Recibo",
  "LOC",
  "Dsn",
  "Sts",
  "Año Vig.",
  "Fecha Inicio",
  "Fecha vencimiento",
  "Agente Cedente",
  "Prima Fracc",
  "Recargo Fijo",
  "Importe Comble",
  "% Comis",
  "Nivelacion Variable",
  "Comis 1er Año",
  "Comis Renvovacion",
  "Forma de pago"
];

export default function ReciboCard({ recibo, agenteClave }) {
  const [show, setShow] = React.useState(false);
  // Índices de campos relevantes
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
  const anioVig = recibo[11];
  const comisionPromotoria = getComisionMontoRecibo(recibo, idxs);
  const comisionAgente = getComisionAgenteRecibo(recibo, idxs, agenteClave, anioVig);
  const comisionSupervisor = getComisionSupervisorRecibo(recibo, idxs);

  return (
    <li className="my-4">
      <div className="rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg border border-gray-700 p-5 flex flex-col gap-3 transition-transform hover:scale-[1.015]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <div className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              {recibo[6]}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
              <span>Fecha mov: <span className="font-mono text-gray-100">{recibo[3]}</span></span>
              <span>No. Poliza: <span className="font-mono text-gray-100">{recibo[4]}</span></span>
              <span>Dsn: <span className="font-mono text-gray-100">{recibo[9]}</span></span>
              <span>Año Vig: <span className="font-mono text-gray-100">{recibo[11]}</span></span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="bg-green-900/60 rounded px-2 py-1 text-green-300 font-semibold shadow-inner">
                Promotoria: <span className="font-mono">{comisionPromotoria.valor != null ? `$${comisionPromotoria.valor.toFixed(2)}` : '-'}</span>
              </div>
              <div className="bg-blue-900/60 rounded px-2 py-1 text-blue-300 font-semibold shadow-inner">
                Agente: <span className="font-mono">{comisionAgente.valor != null ? `$${comisionAgente.valor.toFixed(2)}` : '-'}</span>
              </div>
              <div className="bg-yellow-900/60 rounded px-2 py-1 text-yellow-200 font-semibold shadow-inner">
                Supervisor: <span className="font-mono">{comisionSupervisor.valor != null ? `$${comisionSupervisor.valor.toFixed(2)}` : '-'}</span>
              </div>
            </div>
          </div>
          <button
            className="mt-3 sm:mt-0 sm:ml-4 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-sm font-semibold text-white shadow flex items-center gap-2 transition-colors"
            onClick={() => setShow(v => !v)}
            aria-label={show ? 'Ocultar detalle' : 'Ver detalle'}
          >
            <svg className={`w-4 h-4 transition-transform ${show ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            {show ? "Ocultar detalle" : "Ver detalle"}
          </button>
        </div>
        {show && (
          <div className="mt-3 bg-gray-900 border border-gray-700 rounded p-3 text-sm text-gray-200 overflow-x-auto animate-fade-in">
            <table className="w-full">
              <tbody>
                {HEADERS.map((h, i) => (
                  <tr key={h}>
                    <td className="pr-4 py-1 text-gray-400 whitespace-nowrap font-medium">{h}:</td>
                    <td className="py-1">{recibo[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </li>
  );
}
