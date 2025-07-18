import React from "react";
import PolizaCard from "./PolizaCard";
import { getComisionPorcentaje, getComisionMontoRecibo, getComisionAgenteRecibo, getComisionSupervisorRecibo } from "../utils/comisiones";
import { uploadRecibosBatch } from "../utils/apiUploadRecibos";

export default function AgenteCard({ agenteClave, polizas, headers }) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState(null);

  // Sumas de comisiones
  let totalComisionSupervisor = 0;
  let totalComisionAgente = 0;
  let totalComisionPromotoria = 0;
  Object.values(polizas).forEach(recibosArr => {
    recibosArr.forEach(row => {
      const comisionSupervisor = getComisionSupervisorRecibo(row, {
        dsnIdx: headers.findIndex(h => h.toLowerCase() === 'dsn'),
        formaPagoIdx: headers.findIndex(h => h.toLowerCase() === 'forma de pago'),
        primaFraccIdx: headers.findIndex(h => h.toLowerCase() === 'prima fracc'),
        recargoFijoIdx: headers.findIndex(h => h.toLowerCase() === 'recargo fijo')
      });
      if (typeof comisionSupervisor.valor === 'number' && !isNaN(comisionSupervisor.valor)) {
        totalComisionSupervisor += comisionSupervisor.valor;
      }
      // Comision agente
      const anioVigIdx = headers.findIndex(h => h.toLowerCase() === 'año vig.');
      const anioVigRecibo = anioVigIdx !== -1 ? row[anioVigIdx] : null;
      const comisIdx = headers.findIndex(h => h.toLowerCase() === '% comis');
      const comisionAgente = getComisionAgenteRecibo(row, {
        dsnIdx: headers.findIndex(h => h.toLowerCase() === 'dsn'),
        formaPagoIdx: headers.findIndex(h => h.toLowerCase() === 'forma de pago'),
        primaFraccIdx: headers.findIndex(h => h.toLowerCase() === 'prima fracc'),
        recargoFijoIdx: headers.findIndex(h => h.toLowerCase() === 'recargo fijo'),
        importeCombleIdx: headers.findIndex(h => h.toLowerCase() === 'importe comble'),
        comisIdx,
        nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
        comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año'))
      }, agenteClave, anioVigRecibo);
      if (typeof comisionAgente.valor === 'number' && !isNaN(comisionAgente.valor)) {
        totalComisionAgente += comisionAgente.valor;
      }
      // Comision promotoria
      const comisionPromotoria = getComisionMontoRecibo(row, {
        nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
        comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año')),
        importeCombleIdx: headers.findIndex(h => h.toLowerCase() === 'importe comble'),
        comisIdx
      });
      if (typeof comisionPromotoria.valor === 'number' && !isNaN(comisionPromotoria.valor)) {
        totalComisionPromotoria += comisionPromotoria.valor;
      }
    });
  });

  // mapDataToRecibos y handleUpload igual que antes, pero solo para este agente
  function mapDataToRecibos() {
    const recibos = [];
    Object.entries(polizas).forEach(([poliza, rows]) => {
      rows.forEach(row => {
        const reciboObj = {};
        headers.forEach((header, idx) => {
          let val = row[idx];
          if (val === undefined || val === "") val = null;
          reciboObj[header] = val;
        });
        reciboObj["Clave Agente"] = agenteClave !== "Sin agente" ? agenteClave : null;
        reciboObj["claveAgente"] = agenteClave !== "Sin agente" ? agenteClave : null;
        const comisIdx = headers.findIndex(h => h.toLowerCase() === '% comis');
        const anioVigIdx = headers.findIndex(h => h.toLowerCase() === 'año vig.');
        const anioVigRecibo = anioVigIdx !== -1 ? row[anioVigIdx] : null;
        const comisionMonto = getComisionMontoRecibo(row, {
          nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
          comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año')),
          importeCombleIdx: headers.findIndex(h => h.toLowerCase() === 'importe comble'),
          comisIdx
        });
        const comisionAgente = getComisionAgenteRecibo(row, {
          dsnIdx: headers.findIndex(h => h.toLowerCase() === 'dsn'),
          formaPagoIdx: headers.findIndex(h => h.toLowerCase() === 'forma de pago'),
          primaFraccIdx: headers.findIndex(h => h.toLowerCase() === 'prima fracc'),
          recargoFijoIdx: headers.findIndex(h => h.toLowerCase() === 'recargo fijo'),
          importeCombleIdx: headers.findIndex(h => h.toLowerCase() === 'importe comble'),
          comisIdx,
          nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
          comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año'))
        }, agenteClave, anioVigRecibo);
        const comisionSupervisor = getComisionSupervisorRecibo(row, {
          dsnIdx: headers.findIndex(h => h.toLowerCase() === 'dsn'),
          formaPagoIdx: headers.findIndex(h => h.toLowerCase() === 'forma de pago'),
          primaFraccIdx: headers.findIndex(h => h.toLowerCase() === 'prima fracc'),
          recargoFijoIdx: headers.findIndex(h => h.toLowerCase() === 'recargo fijo')
        });
        reciboObj["pctComisPromotoria"] = comisIdx !== -1 ? row[comisIdx] : null;
        reciboObj["comisPromotoria"] = comisionMonto.valor;
        reciboObj["pctComisAgente"] = comisionAgente.porcentaje;
        reciboObj["comisAgente"] = comisionAgente.valor;
        reciboObj["comisSupervisor"] = comisionSupervisor.valor;
        reciboObj["pctComisSupervisor"] = comisionSupervisor.valor !== null ? 7 : null;
        recibos.push(reciboObj);
      });
    });
    return recibos;
  }

  async function handleUpload() {
    setUploading(true);
    setUploadResult(null);
    const recibos = mapDataToRecibos();
    const result = await uploadRecibosBatch(recibos);
    setUploadResult(result);
    setUploading(false);
  }

  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg p-8 mb-8 text-white border border-slate-700 flex flex-col justify-between min-h-[600px] h-full">
      <h2 className="text-2xl font-bold text-green-400 mb-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
        <span>Agente: <span className="text-white">{agenteClave}</span></span>
        <span className="flex flex-col md:flex-row md:gap-4 text-base md:text-lg font-semibold">
          <span className="text-amber-300 flex items-center gap-1">
            <span className="hidden md:inline">Total promotoria:</span>
            <span className="font-mono">{totalComisionPromotoria.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
          </span>
          <span className="text-green-300 flex items-center gap-1">
            <span className="hidden md:inline">Total agente:</span>
            <span className="font-mono">{totalComisionAgente.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
          </span>
          <span className="text-purple-300 flex items-center gap-1">
            <span className="hidden md:inline">Total supervisor:</span>
            <span className="font-mono">{totalComisionSupervisor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
          </span>
        </span>
      </h2>
      <div className="text-gray-200 text-base mb-2">Pólizas y Recibos:</div>
      <ul className="mb-4 max-h-[380px] overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {Object.entries(polizas).map(([poliza, recibos]) => (
          <PolizaCard key={poliza} poliza={poliza} recibos={recibos} headers={headers} agenteClave={agenteClave} />
        ))}
      </ul>
      <div className="pt-4 border-t border-slate-700 text-lime-300 font-bold">
        Total recibos: {Object.values(polizas).reduce((acc, arr) => acc + arr.length, 0)}
      </div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Enviar recibos al backend"}
        </button>
        {uploadResult && (
          <span className={"ml-4 text-sm " + (uploadResult.ok ? "text-green-400" : "text-red-400") }>
            {uploadResult.ok
              ? `Recibos subidos correctamente: ${uploadResult.creados}`
              : `Error: ${uploadResult.error}`}
          </span>
        )}
      </div>
    </div>
  );
}
