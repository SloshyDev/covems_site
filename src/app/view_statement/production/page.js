"use client";
import React, { useState, useEffect } from "react";
import AgenteSelect from "../../../components/AgenteSelect";
import ExportProductionPDFButton from "./components/ExportProductionPDFButton";

export default function ProductionViewPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [claveAgente, setClaveAgente] = useState("");
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);

  // Obtener todos los usuarios al cargar
  useEffect(() => {
    async function fetchUsuarios() {
      setUsuariosLoading(true);
      try {
        const res = await fetch("/api/users");
        const json = await res.json();
        if (Array.isArray(json)) {
          setUsuarios(json);
        } else {
          setUsuarios([]);
        }
      } catch (e) {
        setUsuarios([]);
      } finally {
        setUsuariosLoading(false);
      }
    }
    fetchUsuarios();
  }, []);

  // Buscar recibos con DSN "EMI" cuando cambie la clave del agente, año o mes
  const fetchRecibos = async () => {
    if (!claveAgente) {
      setRecibos([]);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Calcular fechas del mes completo
      const fechaInicio = new Date(year, month - 1, 1);
      const fechaFin = new Date(year, month, 0, 23, 59, 59); // Último día del mes

      const res = await fetch(
        `/api/recibo?fechaInicio=${fechaInicio.toISOString()}&fechaFin=${fechaFin.toISOString()}`
      );
      const json = await res.json();

      if (json.ok && json.recibos) {
        // Filtrar recibos por DSN "EMI" y opcionalmente por clave de agente
        const recibosFiltrados = json.recibos.filter(recibo => {
          const esEMI = recibo.dsn?.toUpperCase() === "EMI";
          const perteneceAgente = claveAgente === "TODOS" || recibo.claveAgente == claveAgente;
          return esEMI && perteneceAgente;
        });
        setRecibos(recibosFiltrados);
      } else {
        setRecibos([]);
        setError(json.error || "No se pudieron obtener los recibos");
      }
    } catch (e) {
      setError("Error al obtener recibos: " + e.message);
      setRecibos([]);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar búsqueda cuando cambien los filtros
  useEffect(() => {
    fetchRecibos();
  }, [claveAgente, year, month]);

  // Calcular totales
  const totales = {
    primaFracc: recibos.reduce((acc, recibo) => {
      let primaAjustada = Number(recibo.primaFracc) || 0;
      const formaPago = recibo.formaPago?.toUpperCase();
      if (formaPago === "H") {
        primaAjustada *= 24; // Hipotecario
      } else if (formaPago === "M") {
        primaAjustada *= 12; // Mensual
      }
      return acc + primaAjustada;
    }, 0),
    comisPromotoria: recibos.reduce((acc, recibo) => acc + (Number(recibo.comisPromotoria) || 0), 0),
    comisAgente: recibos.reduce((acc, recibo) => acc + (Number(recibo.comisAgente) || 0), 0),
    comisSupervisor: recibos.reduce((acc, recibo) => acc + (Number(recibo.comisSupervisor) || 0), 0)
  };

  const agenteSeleccionado = usuarios.find(u => u.clave == claveAgente);

  // Crear lista de agentes con opción "Todos"
  const agentesConTodos = [
    { clave: "TODOS", nombre: "Todos los agentes", estado: "", rfc: "" },
    ...usuarios
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        Consulta de Producción
      </h1>

      {/* Filtros */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de Agente */}
          <div>
            <AgenteSelect
              value={claveAgente}
              onChange={(e) => setClaveAgente(e.target.value)}
              agentes={agentesConTodos}
              loading={usuariosLoading}
            />
          </div>

          {/* Selector de Año */}
          <div>
            <label className="block text-cyan-100 font-semibold mb-1">
              Año
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full p-2 rounded-lg bg-gray-800 text-cyan-200 border-2 border-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const yearOption = today.getFullYear() - 2 + i;
                return (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selector de Mes */}
          <div>
            <label className="block text-cyan-100 font-semibold mb-1">
              Mes
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full p-2 rounded-lg bg-gray-800 text-cyan-200 border-2 border-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            >
              {[
                { value: 1, label: "Enero" },
                { value: 2, label: "Febrero" },
                { value: 3, label: "Marzo" },
                { value: 4, label: "Abril" },
                { value: 5, label: "Mayo" },
                { value: 6, label: "Junio" },
                { value: 7, label: "Julio" },
                { value: 8, label: "Agosto" },
                { value: 9, label: "Septiembre" },
                { value: 10, label: "Octubre" },
                { value: 11, label: "Noviembre" },
                { value: 12, label: "Diciembre" },
              ].map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Información del agente seleccionado */}
      {agenteSeleccionado && claveAgente !== "TODOS" && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">
            Información del Agente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <span className="font-semibold">Clave:</span> {agenteSeleccionado.clave}
            </div>
            <div>
              <span className="font-semibold">Nombre:</span> {agenteSeleccionado.nombre}
            </div>
            <div>
              <span className="font-semibold">Estado:</span> {agenteSeleccionado.estado}
            </div>
            <div>
              <span className="font-semibold">RFC:</span> {agenteSeleccionado.rfc || "N/A"}
            </div>
          </div>
        </div>
      )}

      {/* Información cuando se selecciona "Todos" */}
      {claveAgente === "TODOS" && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">
            Consulta General
          </h2>
          <div className="text-gray-300">
            <span className="font-semibold">Mostrando:</span> Todos los recibos EMI de todos los agentes
          </div>
        </div>
      )}

      {/* Resultados */}
      {loading ? (
        <div className="text-gray-200 text-center py-8">
          Cargando recibos...
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : !claveAgente ? (
        <div className="text-gray-400 text-center py-8">
          Seleccione un agente para ver sus recibos de producción
        </div>
      ) : recibos.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          {claveAgente === "TODOS" 
            ? "No se encontraron recibos de producción (DSN: EMI) para el período seleccionado"
            : "No se encontraron recibos de producción (DSN: EMI) para el agente y período seleccionado"
          }
        </div>
      ) : (
        <div>
          {/* Resumen de totales */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-cyan-300">
                Resumen de Producción ({recibos.length} recibos {claveAgente === "TODOS" ? " - Todos los agentes" : ""})
              </h3>
              <ExportProductionPDFButton
                recibos={recibos}
                totales={totales}
                claveAgente={claveAgente}
                agenteSeleccionado={agenteSeleccionado}
                year={year}
                month={month}
              />
            </div>
            <div className="flex justify-around text-gray-300">
              <div className="text-center">
                <div className="font-semibold text-cyan-400">Prima Fraccionada</div>
                <div className={`text-xl ${totales.primaFracc >= 0 ? '' : 'text-red-400'}`}>
                  ${totales.primaFracc.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-400">Comisión Promotoria</div>
                <div className={`text-xl ${totales.comisPromotoria >= 0 ? '' : 'text-red-400'}`}>
                  ${totales.comisPromotoria.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-400">Comisión Agente</div>
                <div className={`text-xl ${totales.comisAgente >= 0 ? '' : 'text-red-400'}`}>
                  ${totales.comisAgente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-400">Comisión Supervisor</div>
                <div className={`text-xl ${totales.comisSupervisor >= 0 ? '' : 'text-red-400'}`}>
                  ${totales.comisSupervisor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

        
          {/* Tabla de recibos */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fecha Mov.
                    </th>
                    {claveAgente === "TODOS" && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Agente
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Póliza
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Asegurado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      DSN
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex flex-col items-center">
                        <span>Prima Fracc.</span>
                        <span className="text-xs text-gray-400 normal-case">(Ajustada)</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Comis. Promotoria
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Comis. Agente
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Comis. Supervisor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Forma Pago
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {recibos.map((recibo, index) => (
                    <tr 
                      key={recibo.id || index} 
                      className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {recibo.fechaMovimiento 
                          ? new Date(recibo.fechaMovimiento).toLocaleDateString('es-MX')
                          : "N/A"
                        }
                      </td>
                      {claveAgente === "TODOS" && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-400 font-medium">
                          {(() => {
                            const usuario = usuarios.find(u => u.clave === recibo.claveAgente);
                            const nombreCompleto = usuario ? `${recibo.claveAgente} - ${usuario.nombre}` : (recibo.claveAgente || "N/A");
                            return nombreCompleto.length > 20 ? nombreCompleto.substring(0, 17) + "..." : nombreCompleto;
                          })()}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-cyan-400 font-medium">
                        {recibo.poliza || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {recibo.nombreAsegurado || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          {recibo.dsn}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                        {recibo.primaFracc !== null && recibo.primaFracc !== undefined && recibo.primaFracc !== "" ? (() => {
                          let primaAjustada = Number(recibo.primaFracc);
                          const formaPago = recibo.formaPago?.toUpperCase();
                          if (formaPago === "H") {
                            primaAjustada *= 24; // Hipotecario
                          } else if (formaPago === "M") {
                            primaAjustada *= 12; // Mensual
                          }
                          return `$${primaAjustada.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                        })() : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {recibo.comisPromotoria !== null && recibo.comisPromotoria !== undefined && recibo.comisPromotoria !== "" ? (
                          <span className={Number(recibo.comisPromotoria) >= 0 ? "text-green-400" : "text-red-400"}>
                            ${Number(recibo.comisPromotoria).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {recibo.comisAgente !== null && recibo.comisAgente !== undefined && recibo.comisAgente !== "" ? (
                          <span className={Number(recibo.comisAgente) >= 0 ? "text-yellow-400" : "text-red-400"}>
                            ${Number(recibo.comisAgente).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {recibo.comisSupervisor !== null && recibo.comisSupervisor !== undefined && recibo.comisSupervisor !== "" ? (
                          <span className={Number(recibo.comisSupervisor) >= 0 ? "text-purple-400" : "text-red-400"}>
                            ${Number(recibo.comisSupervisor).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {recibo.formaPago || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
