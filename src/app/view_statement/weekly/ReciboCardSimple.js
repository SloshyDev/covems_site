import React from "react";

const HEADERS = [
  "Clave agente",
  "Póliza",
  "Fecha movimiento",
  "Nombre asegurado",
  "DSN",
  "Año Vig.",
  "Prima Fracc.",
  "% Comis Promotoria",
  "Comis Promotoria",
  "% Comis Agente",
  "Comis Agente",
  "% Comis Supervisor",
  "Comis Supervisor",
  "Forma de pago"
];

export default function ReciboCardSimple({ recibo }) {
  const [show, setShow] = React.useState(false);
  return (
    <li className="my-4">
      <div className="rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg border border-gray-700 p-5 flex flex-col gap-3 transition-transform hover:scale-[1.015]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <div className="mb-1 flex flex-col gap-1">
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-LG font-semibold text-white tracking-wide">{recibo[3]}</span> {/* Nombre asegurado */}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-blue-200 mt-1">
                <span>Póliza: <span className="font-mono text-blue-300">{recibo[1]}</span></span>
                <span>Fecha mov: <span className="font-mono text-gray-100">{recibo[2]}</span></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
              <span>Fecha mov: <span className="font-mono text-gray-100">{recibo[2]}</span></span>
              <span>DSN: <span className="font-mono text-gray-100">{recibo[4]}</span></span>
              <span>Año Vig: <span className="font-mono text-gray-100">{recibo[5]}</span></span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="bg-green-900/60 rounded px-2 py-1 text-green-300 font-semibold shadow-inner">
                Promotoria: <span className="font-mono">{recibo[8] != null ? `$${Number(recibo[8]).toFixed(2)}` : '-'}</span>
              </div>
              <div className="bg-blue-900/60 rounded px-2 py-1 text-blue-300 font-semibold shadow-inner">
                Comision: <span className="font-mono">{recibo[10] != null ? `$${Number(recibo[10]).toFixed(2)}` : '-'}</span>
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
