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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-cyan-700 shadow-2xl relative">
        <button
          className="absolute top-2 right-2 text-cyan-400 hover:text-cyan-200 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-cyan-300 font-bold text-lg mb-4">
          Detalle del recibo
        </h2>
        <div className="flex flex-col gap-2">
          {RECIBO_FIELDS.map((h) => (
            <div key={h} className="flex justify-between text-sm">
              <span className="font-semibold text-cyan-300 mr-2">{h}:</span>
              <span className="text-cyan-100 text-right break-all">
                {h === "pctComisAgente" ? pctComisAgenteValue : recibo[h]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
