import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export default function ReciboComisionInfo({ comisExcel, comisionRecibo }) {
  return (
    <span className="relative flex items-center ml-2 group">
      <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-pointer" />
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 min-w-[160px] px-4 py-2 rounded bg-slate-700 text-lime-200 text-xs border border-slate-600 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-lg flex flex-col gap-1"
        style={{whiteSpace: 'normal'}}
      >
        <div className="font-bold text-sky-300 mb-1">Comisiones</div>
        <div>
          <span className="font-semibold">% Promotoria:</span> {comisExcel !== undefined ? comisExcel + '%' : 'N/A'}
        </div>
        <div>
          <span className="font-semibold">% Agente:</span> {comisionRecibo !== null ? comisionRecibo + '%' : 'N/A'}
        </div>
      </div>
    </span>
  );
}
