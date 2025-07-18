import React from "react";
import { getComisionMontoRecibo, getComisionAgenteRecibo, getComisionSupervisorRecibo } from "../utils/comisiones";
import ReciboComisionInfo from "./ReciboComisionInfo";

export default function ReciboCard({ row, headers, agenteClave }) {
  const comisIdx = headers.findIndex(h => h.toLowerCase() === '% comis');
  const anioVigIdx = headers.findIndex(h => h.toLowerCase() === 'año vig.');
  const anioVigRecibo = anioVigIdx !== -1 ? row[anioVigIdx] : null;
  const comisionRecibo = comisIdx !== -1 ? row[comisIdx] : null;
  const dsnIdx = headers.findIndex(h => h.toLowerCase() === 'dsn');
  const primaFraccIdx = headers.findIndex(h => h.toLowerCase() === 'prima fracc');
  const recargoFijoIdx = headers.findIndex(h => h.toLowerCase() === 'recargo fijo');
  const importeCombleIdx = headers.findIndex(h => h.toLowerCase() === 'importe comble');
  const formaPagoIdx = headers.findIndex(h => h.toLowerCase() === 'forma de pago');
  const nivelacionIdx = headers.findIndex(h => h.toLowerCase().includes('nivelacion variable'));
  const comis1erAnioIdx = headers.findIndex(h => h.toLowerCase().includes('comis 1er año'));
  const reciboIdx = headers.findIndex(h => h === "Recibo");
  const fechaIdx = headers.findIndex(h => h.toLowerCase() === "fecha movimiento");

  const comisionMonto = getComisionMontoRecibo(row, {
    nivelacionIdx,
    comis1erAnioIdx,
    importeCombleIdx,
    comisIdx
  });
  const comisionAgente = getComisionAgenteRecibo(row, {
    dsnIdx,
    formaPagoIdx,
    primaFraccIdx,
    recargoFijoIdx,
    importeCombleIdx,
    comisIdx,
    nivelacionIdx,
    comis1erAnioIdx
  }, agenteClave, anioVigRecibo);
  const comisionSupervisor = getComisionSupervisorRecibo(row, {
    dsnIdx,
    formaPagoIdx,
    primaFraccIdx,
    recargoFijoIdx
  });

  return (
    <li className="mb-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-md p-4 flex flex-col gap-2 hover:border-blue-400 transition-all">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-semibold text-blue-300">Recibo:</span>
          <span className="font-mono text-lg text-white">{row[reciboIdx]}</span>
          <span className="text-gray-400 text-sm">
            {row[fechaIdx] !== undefined && row[fechaIdx] !== null && String(row[fechaIdx]).trim() !== ''
              ? String(row[fechaIdx])
              : 'Sin fecha'}
          </span>
          <ReciboComisionInfo comisExcel={comisionRecibo} comisionRecibo={comisionAgente.porcentaje} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-300">
          <div><span className="font-semibold text-slate-200">DSN:</span> {row[dsnIdx]}</div>
          <div><span className="font-semibold text-slate-200">Prima Fracc:</span> {row[primaFraccIdx]}</div>
          <div><span className="font-semibold text-slate-200">Recargo Fijo:</span> {row[recargoFijoIdx]}</div>
          <div><span className="font-semibold text-slate-200">Importe Comble:</span> {row[importeCombleIdx]}</div>
          <div><span className="font-semibold text-slate-200">Forma de pago:</span> {row[formaPagoIdx]}</div>
          <div className="col-span-2 md:col-span-3 mt-2">
            <span className="font-semibold text-amber-300">Comisión promotoria:</span>{' '}
            <span className="text-white font-mono">{comisionMonto.valor !== null ? comisionMonto.valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : 'N/A'}</span>
            <span className="ml-2 text-xs text-gray-400">{comisionMonto.fuente ? `(${comisionMonto.fuente})` : ''}</span>
          </div>
          <div className="col-span-2 md:col-span-3">
            <span className="font-semibold text-green-300">Comisión agente:</span>{' '}
            <span className={
              "font-mono " +
              (comisionAgente.valor < 0
                ? "text-red-400"
                : "text-white")
            }>
              {comisionAgente.valor !== null ? comisionAgente.valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : 'N/A'}
            </span>
            <span className="ml-2 text-xs text-gray-400">{comisionAgente.fuente ? `(${comisionAgente.fuente}` : ''}{comisionAgente.porcentaje != null ? ` ${comisionAgente.porcentaje}%` : ''}{comisionAgente.fuente ? ')' : ''}</span>
          </div>
          <div className="col-span-2 md:col-span-3">
            <span className="font-semibold text-purple-300">Comisión supervisor:</span>{' '}
            <span className={
              "font-mono " +
              (comisionSupervisor.valor < 0
                ? "text-red-400"
                : "text-white")
            }>
              {comisionSupervisor.valor !== null ? comisionSupervisor.valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : 'N/A'}
            </span>
            <span className="ml-2 text-xs text-gray-400">{comisionSupervisor.fuente ? `(${comisionSupervisor.fuente})` : ''}</span>
          </div>
        </div>
      </div>
    </li>
  );
}
