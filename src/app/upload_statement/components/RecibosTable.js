import React from "react";

export default function RecibosTable({ recibos, onShowDetail, compactFields }) {
  // Asegura que recibos y compactFields siempre sean arrays
  const safeRecibos = Array.isArray(recibos) ? recibos : [];
  const safeCompactFields = Array.isArray(compactFields) ? compactFields : [];

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-gray-800">
        <table className="min-w-full border-separate border-spacing-0 text-xs lg:text-sm text-cyan-100 bg-gray-900 rounded-xl shadow-lg">
          <thead>
            <tr>
              {safeCompactFields.map((h) => (
                <th
                  key={h}
                  className="px-2 lg:px-4 py-2 lg:py-3 border-b-2 border-cyan-600 bg-cyan-900 text-cyan-200 font-bold text-xs lg:text-base sticky top-0 z-10 whitespace-nowrap min-w-[80px]"
                >
                  {h}
                </th>
              ))}
              <th className="px-2 lg:px-4 py-2 lg:py-3 border-b-2 border-cyan-600 bg-cyan-900 text-cyan-200 font-bold text-xs lg:text-base sticky top-0 z-10 whitespace-nowrap min-w-[80px]">
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
                    className="px-2 lg:px-4 py-1 lg:py-2 border-b border-cyan-800 whitespace-nowrap text-xs lg:text-base truncate max-w-[120px] truncate-with-tooltip"
                    title={row[h]} // Tooltip para ver el contenido completo
                  >
                    {row[h]}
                  </td>
                ))}
                <td className="px-2 lg:px-4 py-1 lg:py-2 border-b border-cyan-800 text-center">
                  <button
                    className="text-cyan-400 hover:text-cyan-200 underline text-xs font-bold px-2 py-1 rounded hover:bg-cyan-900 transition-colors"
                    onClick={() =>
                      typeof onShowDetail === "function" && onShowDetail(row)
                    }
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
