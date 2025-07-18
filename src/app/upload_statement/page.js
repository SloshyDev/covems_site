"use client";
import React, { useState, useEffect } from "react";
import { parseExcel } from "./utils/utilsExcel";
import AgenteCards from "./components/AgenteCards";
import SaldosPendientesPreview from "./components/SaldosPendientesPreview";
import ProgressBar from "./components/ProgressBar";
import { IGNORE_HEADERS, HEADERS } from "./conts";
import { usePolizas } from "./usePolizas";
import { getCortesDelMes, filtrarPorCorte } from "./utilsCortes";
import { uploadAllRecibos } from "./utils/uploadAllRecibos";
import { uploadAllRecibosOptimizado } from "./utils/uploadRecibosOptimizado";


const UploadStatementPage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState("");
  const [selectedCorte, setSelectedCorte] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [uploadingAll, setUploadingAll] = useState(false);
  const [uploadAllResult, setUploadAllResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const { polizas, loading: loadingPolizas, error: errorPolizas } = usePolizas();
  const VISIBLE_HEADERS = HEADERS.filter(h => !IGNORE_HEADERS.includes(h));

  // Calcula cortes del mes y año seleccionados
  const cortes = getCortesDelMes(selectedYear, selectedMonth);

  useEffect(() => {
    if (data.length === 0) {
      setFilteredData([]);
      return;
    }
    const corte = cortes[selectedCorte];
    setFilteredData(filtrarPorCorte(data, corte, selectedYear, selectedMonth));
  }, [data, selectedCorte, selectedMonth, selectedYear]);

  const handleFile = (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    parseExcel(file, HEADERS, VISIBLE_HEADERS, setData, setError);
  };

  // Función para subir todos los recibos
  async function handleUploadAll() {
    if (filteredData.length === 0) return;
    setUploadingAll(true);
    setUploadAllResult(null);
    setUploadProgress(null);
    
    // Crear polizaMap igual que en AgenteCards.js
    const polizaMap = {};
    if (Array.isArray(polizas)) {
      for (const p of polizas) {
        if (p.poliza != null) {
          polizaMap[String(p.poliza)] = p.agenteClave;
        }
      }
    }
    
    // Determinar el índice de la columna No. Poliza
    const noPolizaIdx = VISIBLE_HEADERS.findIndex((h) => h === "No. Poliza");
    
    // Crear la estructura de agentesData desde los datos filtrados
    const agentesMap = {};
    filteredData.forEach(row => {
      const noPoliza = row[noPolizaIdx] != null ? String(row[noPolizaIdx]) : "Sin póliza";
      const claveAgente = polizaMap[noPoliza] ?? "Sin agente";
      
      if (!agentesMap[claveAgente]) {
        agentesMap[claveAgente] = { polizas: {} };
      }
      if (!agentesMap[claveAgente].polizas[noPoliza]) {
        agentesMap[claveAgente].polizas[noPoliza] = [];
      }
      agentesMap[claveAgente].polizas[noPoliza].push(row);
    });
    
    // Convertir a formato que espera uploadAllRecibos
    const agentesData = Object.entries(agentesMap).map(([agenteClave, data]) => ({
      agenteClave,
      polizas: data.polizas,
      headers: VISIBLE_HEADERS
    }));
    
    // Obtener fechas del corte seleccionado
    const corte = cortes[selectedCorte];
    
    // Asegurar que las fechas tengan el formato correcto YYYY-MM-DD
    const mesStr = String(selectedMonth).padStart(2, '0');
    const inicioStr = String(corte.inicio).padStart(2, '0');
    const finStr = String(corte.fin).padStart(2, '0');
    
    const fechaInicio = `${selectedYear}-${mesStr}-${inicioStr}`;
    const fechaFin = `${selectedYear}-${mesStr}-${finStr}`;
    
    console.log('📅 Subiendo recibos para el corte (optimizado):', {
      fechaInicio,
      fechaFin,
      totalRecibos: filteredData.length,
      procesamientoAutomatico: true
    });
    
    // Callback para reportar progreso
    const onProgress = (progressData) => {
      setUploadProgress(progressData);
    };
    
    // Llamar a uploadAllRecibosOptimizado con progreso en tiempo real
    const result = await uploadAllRecibosOptimizado(
      agentesData, 
      fechaInicio, 
      fechaFin, 
      false, // NO procesar saldos automáticamente
      onProgress
    );
    
    setUploadAllResult(result);
    setUploadingAll(false);
  }

  // Genera opciones de años (puedes ajustar el rango)
  const yearOptions = [];
  for (let y = 2023; y <= new Date().getFullYear(); y++) {
    yearOptions.push(y);
  }

  return (
    <div className="p-6 px-9 w-full mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-white">Subir Estado de Cuenta (Excel)</h1>
      <div className="flex gap-4 mb-4">
        {/* ...selects de año, mes y corte... */}
        <select
          className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
          value={selectedYear}
          onChange={e => {
            setSelectedYear(Number(e.target.value));
            setSelectedCorte(0);
          }}
        >
          {yearOptions.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
          value={selectedMonth}
          onChange={e => {
            setSelectedMonth(Number(e.target.value));
            setSelectedCorte(0);
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("es-MX", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
          value={selectedCorte}
          onChange={e => setSelectedCorte(Number(e.target.value))}
        >
          {cortes.map((corte, idx) => (
            <option key={idx} value={idx}>
              {`Corte ${idx + 1}: del ${corte.inicio} al ${corte.fin}`}
            </option>
          ))}
        </select>
      </div>
      {/* Botón para subir todos los recibos en lote */}
      {filteredData.length > 0 && (
        <div className="flex justify-end mb-6">
          <button
            onClick={handleUploadAll}
            disabled={uploadingAll}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-8 rounded shadow disabled:opacity-50"
          >
            {uploadingAll ? "Enviando recibos..." : "Enviar todos los recibos"}
          </button>
          
          {/* Barra de progreso durante la carga */}
          {uploadingAll && <ProgressBar progress={uploadProgress} />}
          
          {uploadAllResult && (
            <div className="ml-4 text-sm">
              {uploadAllResult.ok ? (
                <div className="space-y-1">
                  <div className="text-green-400">
                    ✅ Recibos subidos: {uploadAllResult.creados} de {uploadAllResult.totalRecibos}
                  </div>
                  {uploadAllResult.estadisticas && (
                    <div className="text-gray-300 text-xs">
                      📊 Tasa: {uploadAllResult.estadisticas.tasaExito}% | 
                      Velocidad: {uploadAllResult.velocidadPromedio} rec/s | 
                      Tiempo: {Math.round(uploadAllResult.tiempoTotal/1000)}s
                    </div>
                  )}
                  {uploadAllResult.procesamientoSaldos?.realizado && (
                    <div className="text-blue-400">
                      💰 Saldos procesados: {uploadAllResult.procesamientoSaldos.totalProcesados} 
                      ({uploadAllResult.procesamientoSaldos.saldosCreados || 0} nuevos)
                    </div>
                  )}
                  {uploadAllResult.procesamientoSaldos?.error && (
                    <div className="text-yellow-400">
                      ⚠️ Error en saldos: {uploadAllResult.procesamientoSaldos.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-400">
                  ❌ Error: {uploadAllResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
        className="mb-8 bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
      />
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {errorPolizas && <div className="text-red-400 mb-4">{errorPolizas}</div>}
      {loadingPolizas && <div className="text-gray-300 mb-4">Cargando pólizas...</div>}
      
      {/* Vista previa de saldos pendientes cuando hay datos filtrados */}
      {filteredData.length > 0 && (
        <SaldosPendientesPreview 
          filteredData={filteredData}
          headers={VISIBLE_HEADERS}
          polizas={polizas}
          selectedCorte={selectedCorte}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          cortes={cortes}
        />
      )}
      
      {filteredData.length > 0 ? (
        <AgenteCards headers={VISIBLE_HEADERS} data={filteredData} polizas={polizas} />
      ) : (
        data.length > 0 && (
          <div className="text-yellow-400 mb-4">No hay datos para el corte seleccionado.</div>
        )
      )}
    </div>
  );
};
export default UploadStatementPage;
