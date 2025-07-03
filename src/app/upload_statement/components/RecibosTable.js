import React from "react";

export default function RecibosTable({ recibos, onShowDetail, compactFields }) {
  // Asegura que recibos y compactFields siempre sean arrays
  const safeRecibos = Array.isArray(recibos) ? recibos : [];
  const safeCompactFields = Array.isArray(compactFields) ? compactFields : [];
  // Calcular el total solo de las columnas de comisión
  const comisFields = ["comisPromotoria", "comisAgente", "comisSupervisor"];
  const comisTotals = {};
  comisFields.forEach((h) => {
    comisTotals[h] = safeRecibos.slice(0, 20).reduce((acc, row) => {
      const val = Number(row[h]);
      return !isNaN(val) ? acc + val : acc;
    }, 0);
  });

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full border-separate border-spacing-0 text-sm text-cyan-100 bg-gray-900 rounded-xl shadow-lg">
        <thead>
          <tr>
            {safeCompactFields.map((h) => (
              <th
                key={h}
                className="px-4 py-3 border-b-2 border-cyan-600 bg-cyan-900 text-cyan-200 font-bold text-base sticky top-0 z-10 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
            <th className="px-4 py-3 border-b-2 border-cyan-600 bg-cyan-900 text-cyan-200 font-bold text-base sticky top-0 z-10 whitespace-nowrap">
              Detalle
            </th>
          </tr>
        </thead>
        <tbody>
          {safeRecibos.slice(0, 20).map((row, i) => (
            <tr
              key={i}
              className={
                i % 2 === 0
                  ? "bg-gray-800 hover:bg-cyan-950"
                  : "bg-gray-900 hover:bg-cyan-950"
              }
            >
              {safeCompactFields.map((h) => (
                <td
                  key={h}
                  className="px-4 py-2 border-b border-cyan-800 whitespace-nowrap text-base"
                >
                  {row[h]}
                </td>
              ))}
              <td className="px-4 py-2 border-b border-cyan-800 text-center">
                <button
                  className="text-cyan-400 hover:text-cyan-200 underline text-xs font-bold"
                  onClick={() =>
                    typeof onShowDetail === "function" && onShowDetail(row)
                  }
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
          {/* Fila de totales solo para comisiones */}
          <tr className="bg-cyan-950 font-bold">
            {safeCompactFields.map((h) =>
              comisFields.includes(h) ? (
                <td
                  key={h}
                  className="px-4 py-2 border-t border-cyan-700 text-cyan-200"
                >
                  {typeof comisTotals[h] === "number" &&
                  !isNaN(comisTotals[h]) &&
                  comisTotals[h] !== 0
                    ? comisTotals[h].toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : ""}
                </td>
              ) : (
                <td key={h} className="px-4 py-2 border-t border-cyan-700" />
              )
            )}
            <td className="px-4 py-2 border-t border-cyan-700 text-center text-cyan-200">
              Total comisiones
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
