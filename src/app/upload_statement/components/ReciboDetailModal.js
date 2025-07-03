import React from "react";

const RECIBO_FIELDS = [
  "fechaMovimiento",
  "poliza",
  "recibo",
  "dsn",
  "anioVig",
  "primaFracc",
  "recargoFijo",
  "importeComble",
  "pctComisPromotoria",
  "comisPromotoria",
  "pctComisAgente",
  "comisAgente",
  "pctComisSupervisor",
  "comisSupervisor",
  "nivelacionVariable",
  "comisPrimerAnio",
  "comisRenovacion",
  "formaPago",
];

export default function ReciboDetailModal({ open, onClose, recibo }) {
  if (!open || !recibo) return null;
  const pctComisAgenteValue =
    recibo.claveAgente === "2" || recibo.claveAgente === 2
      ? "96%"
      : recibo.pctComisAgente;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-gray-900 rounded-xl p-4 lg:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-cyan-700 shadow-2xl relative">
        <button
          className="absolute top-2 right-2 text-cyan-400 hover:text-cyan-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-cyan-900 transition-colors"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-cyan-300 font-bold text-lg lg:text-xl mb-4 pr-8">
          Detalle del recibo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          {RECIBO_FIELDS.map((h) => (
            <div key={h} className="flex flex-col sm:flex-row sm:justify-between text-sm lg:text-base bg-gray-800 p-3 rounded-lg border border-gray-700">
              <span className="font-semibold text-cyan-300 mb-1 sm:mb-0 sm:mr-2 capitalize">
                {h.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="text-cyan-100 break-words sm:text-right max-w-[200px]">
                {h === "pctComisAgente" ? pctComisAgenteValue : recibo[h]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
