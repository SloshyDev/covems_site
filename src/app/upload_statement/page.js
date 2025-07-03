"use client";
import React, { useState } from "react";
import { parseExcelFile } from "./utils/excel";
import { addClaveAgenteToRows } from "./utils/recibo";
import {
  calcularComisPromotoria,
  calcularComisAgente,
  calcularComisSupervisor,
} from "./utils/utilsPagos";
import ReciboDetailModal from "./components/ReciboDetailModal";
import RecibosTable from "./components/RecibosTable";
import TotalesComisiones from "./components/TotalesComisiones";

// Campos clave para vista compacta
const RECIBO_COMPACT_FIELDS = [
  "poliza",
  "recibo",
  "anioVig",
  "importeComble",
  "formaPago",
  "comisPromotoria",
  "pctComisAgente",
  "comisAgente",
  "pctComisSupervisor",
  "comisSupervisor",
];

// Agrupa los recibos por claveAgente
function groupByClaveAgente(rows) {
  const grupos = {};
  for (const row of rows) {
    const clave = row.claveAgente || "Sin clave de agente";
    if (!grupos[clave]) grupos[clave] = [];
    grupos[clave].push(row);
  }
  return grupos;
}

export default function UploadRecibosPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [modalRecibo, setModalRecibo] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const handleFile = async (e) => {
    setSuccess("");
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const parsedRows = await parseExcelFile(file);
      // Filtrar por rango de fechas si ambos inputs están definidos
      let filteredRows = parsedRows;
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        filteredRows = parsedRows.filter((row) => {
          if (!row.fechaMovimiento) return false;
          // Asume formato yyyy-mm-dd o similar compatible con Date
          const fecha = new Date(row.fechaMovimiento);
          return fecha >= inicio && fecha <= fin;
        });
      }
      const withClave = await addClaveAgenteToRows(filteredRows, setError);
      // Agrega comisPromotoria, comisAgente/pctComisAgente y comisSupervisor/pctComisSupervisor a cada row
      const withComisiones = withClave.map((row) => {
        const comisPromotoria = calcularComisPromotoria({
          importeComble: row.importeComble,
          pctComisPromotoria: row.pctComisPromotoria,
          nivelacionVariable: row.nivelacionVariable,
          comisPrimerAnio: row.comisPrimerAnio,
        });
        const { pctComisAgente, comisAgente } = calcularComisAgente({
          comisPromotoria,
          claveAgente: row.claveAgente,
          anioVig: row.anioVig,
          importeComble: row.importeComble,
          primaFracc: row.primaFracc,
          recargoFijo: row.recargoFijo,
          dsn: row.dsn,
          formaPago: row.formaPago,
        });
        const { pctComisSupervisor, comisSupervisor } = calcularComisSupervisor(
          {
            importeComble: row.importeComble,
            dsn: row.dsn,
            formaPago: row.formaPago,
          }
        );
        return {
          ...row,
          comisPromotoria,
          pctComisAgente,
          comisAgente,
          pctComisSupervisor,
          comisSupervisor,
        };
      });
      setRows(withComisiones);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    } finally {
      e.target.value = "";
    }
  };
  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold text-cyan-300 mb-8 text-center w-full">
        Vista previa de Recibos a cargar
      </h1>
      <div className="w-full mx-auto mb-8">
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <div>
            <label className="block text-cyan-200 font-semibold mb-1">
              Fecha inicio
            </label>
            <input
              type="date"
              className="bg-gray-800 border border-cyan-700 rounded-lg px-3 py-2 text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              max={fechaFin || undefined}
            />
          </div>
          <div>
            <label className="block text-cyan-200 font-semibold mb-1">
              Fecha fin
            </label>
            <input
              type="date"
              className="bg-gray-800 border border-cyan-700 rounded-lg px-3 py-2 text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio || undefined}
            />
          </div>
        </div>
        <label className="block w-full text-center cursor-pointer bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-150 mb-6">
          Selecciona archivo Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
            disabled={loading}
          />
        </label>
        {loading && (
          <div className="text-cyan-400 text-center">Cargando...</div>
        )}
        {error && (
          <div className="text-red-400 text-center font-bold">{error}</div>
        )}
      </div>
      {rows.length > 0 && (
        <div className="w-full flex flex-col gap-6 items-start">
          <TotalesComisiones
            recibos={rows}
            compactFields={RECIBO_COMPACT_FIELDS}
            onShowDetail={setModalRecibo}
          />
          <button
            className="mt-4 mx-auto w-full max-w-6xl bg-gradient-to-r from-cyan-700 to-cyan-500 hover:from-cyan-800 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
            onClick={async () => {
              setSuccess("");
              setError("");
              setLoading(true);
              let ok = 0,
                fail = 0;
              for (const row of rows) {
                try {
                  // Asegura que poliza y recibo sean string
                  const payload = {
                    ...row,
                    poliza: row.poliza !== undefined ? String(row.poliza) : undefined,
                    recibo: row.recibo !== undefined ? String(row.recibo) : undefined,
                  };
                  const res = await fetch("/api/recibo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (res.ok) ok++;
                  else fail++;
                } catch {
                  fail++;
                }
              }
              setSuccess(`Recibos cargados: ${ok}. Fallidos: ${fail}`);
              setLoading(false);
            }}
          >
            Cargar recibos al sistema
          </button>
          {success && (
            <div className="text-green-400 text-center font-bold mt-2">
              {success}
            </div>
          )}
          <ReciboDetailModal
            open={!!modalRecibo}
            onClose={() => setModalRecibo(null)}
            recibo={modalRecibo}
          />
        </div>
      )}
    </div>
  );
}
