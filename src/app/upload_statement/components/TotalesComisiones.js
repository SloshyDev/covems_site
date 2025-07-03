import React, { useState } from "react";
import RecibosTable from "./RecibosTable";

export default function TotalesComisiones({
  recibos,
  compactFields,
  onShowDetail,
}) {
  // Asegura que recibos siempre sea un array
  const safeRecibos = Array.isArray(recibos) ? recibos : [];
  // Agrupa por claveAgente y obtiene nombre/identificador
  const grupos = {};
  safeRecibos.forEach((r) => {
    const clave = r.claveAgente || "Sin clave de agente";
    const nombre = r.nombreAgente || r.agente || r.asegurado || "";
    if (!grupos[clave]) grupos[clave] = { nombre, recibos: [] };
    grupos[clave].recibos.push(r);
  });

  const [openAgente, setOpenAgente] = useState(null);

  return (
    <div className="w-full flex flex-col gap-8 my-6">
      {Object.entries(grupos).map(([clave, { nombre, recibos: slice }]) => {
        const totalPromotoria = slice
          .slice(0, 20)
          .reduce((acc, r) => acc + (Number(r.comisPromotoria) || 0), 0);
        const totalAgente = slice
          .slice(0, 20)
          .reduce((acc, r) => acc + (Number(r.comisAgente) || 0), 0);
        const totalSupervisor = slice
          .slice(0, 20)
          .reduce((acc, r) => acc + (Number(r.comisSupervisor) || 0), 0);
        const isOpen = openAgente === clave; return (
          <div
            key={clave}
            className="w-full flex flex-col bg-gradient-to-r from-cyan-950 to-cyan-900 rounded-2xl shadow-lg p-6 border border-cyan-800 mb-2"
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-4 lg:gap-8">
              <div className="flex flex-col min-w-[220px] justify-center items-start lg:items-center lg:justify-start lg:border-r lg:pr-8 border-cyan-800">
                <div className="text-cyan-400 font-extrabold text-xl mb-1 tracking-wide">
                  {clave === "Sin clave de agente" ? clave : `Agente: ${clave}`}
                </div>
                {nombre && (
                  <div className="text-cyan-200 text-base mb-1 font-semibold">
                    {nombre}
                  </div>
                )}
                <div className="text-xs text-cyan-600 mt-1">
                  Total de recibos: {slice.length > 20 ? 20 : slice.length}
                </div>
                <button
                  className="mt-4 bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all duration-150"
                  onClick={() => setOpenAgente(isOpen ? null : clave)}
                >
                  {isOpen ? "Ocultar detalle" : "Ver detalle"}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full justify-evenly items-center">
                <div className="bg-cyan-800 rounded-xl p-4 lg:p-6 shadow-md flex-1 min-w-[160px] text-center border border-cyan-700">
                  <div className="text-cyan-200 font-bold text-base lg:text-lg mb-1 uppercase tracking-wide">
                    Promotoria
                  </div>
                  <div className="text-2xl lg:text-3xl font-mono text-cyan-50">
                    {totalPromotoria.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="bg-cyan-800 rounded-xl p-4 lg:p-6 shadow-md flex-1 min-w-[160px] text-center border border-cyan-700">
                  <div className="text-cyan-200 font-bold text-base lg:text-lg mb-1 uppercase tracking-wide">
                    Agente
                  </div>
                  <div className="text-2xl lg:text-3xl font-mono text-cyan-50">
                    {totalAgente.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="bg-cyan-800 rounded-xl p-4 lg:p-6 shadow-md flex-1 min-w-[160px] text-center border border-cyan-700">
                  <div className="text-cyan-200 font-bold text-base lg:text-lg mb-1 uppercase tracking-wide">
                    Supervisor
                  </div>
                  <div className="text-2xl lg:text-3xl font-mono text-cyan-50">
                    {totalSupervisor.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>{isOpen && (
              <div className="w-full mt-6 border-t border-cyan-700 pt-6">
                <div className="bg-gray-900 rounded-xl p-4 border border-cyan-800">
                  <h3 className="text-cyan-300 font-bold text-lg mb-4">
                    Detalle de recibos - {clave === "Sin clave de agente" ? clave : `Agente: ${clave}`}
                  </h3>
                  <RecibosTable
                    recibos={Array.isArray(slice) ? slice : []}
                    onShowDetail={onShowDetail}
                    compactFields={compactFields}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
