"use client";
import React, { useState, useEffect, useMemo } from "react";
import AgenteSelect from "../../../components/AgenteSelect";
import ExportAgenteMensualPDFButton from "./components/ExportAgenteMensualPDFButton";

export default function MonthlyViewPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [claveAgente, setClaveAgente] = useState("");
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [saldoPendiente, setSaldoPendiente] = useState(null);
  const [saldoLoading, setSaldoLoading] = useState(false);

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

  // Buscar recibos cuando cambie la clave del agente, año o mes
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
        let recibosFiltrados = [];
        const claveNum = Number(claveAgente);
        if (claveNum >= 1800) {
          // Buscar usuarios que tengan como supervisor_clave a este supervisor
          const usuariosSupervisados = usuarios.filter(u => Number(u.supervisor_clave) === claveNum);
          const clavesSupervisados = usuariosSupervisados.map(u => String(u.clave));
          // Filtrar recibos de esos usuarios (excluir 1PG y solo incluir los que tienen comisión supervisor diferente de 0)
          recibosFiltrados = json.recibos.filter(
            recibo => clavesSupervisados.includes(String(recibo.claveAgente)) && 
                     recibo.dsn !== "1PG" &&
                     Number(recibo.comisSupervisor) !== 0
          ).map(recibo => ({
            ...recibo,
            comisAgente: recibo.comisSupervisor // Usar comisión supervisor
          }));
        } else {
          // Filtrar recibos por clave de agente normal (excluir 1PG)
          recibosFiltrados = json.recibos.filter(
            recibo => recibo.claveAgente == claveAgente && 
                     recibo.dsn !== "1PG"
          );
        }
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
    fetchSaldoPendiente();
  }, [claveAgente, year, month]);

  // Buscar el saldo pendiente más temprano del mes consultado
  const fetchSaldoPendiente = async () => {
    if (!claveAgente) {
      setSaldoPendiente(null);
      return;
    }

    setSaldoLoading(true);
    try {
      const res = await fetch("/api/saldos-pendientes");
      const json = await res.json();
      
      if (json.saldos) {
        // Buscar saldos del mes consultado específicamente
        const inicioPeriodoConsultado = new Date(year, month - 1, 1); // Primer día del mes
        const finPeriodoConsultado = new Date(year, month, 0, 23, 59, 59); // Último día del mes
        
        // Filtrar saldos del agente que estén dentro del mes consultado
        const saldosDelMes = json.saldos
          .filter(saldo => saldo.agente?.clave == claveAgente)
          .filter(saldo => {
            const fechaSaldo = new Date(saldo.fecha);
            return fechaSaldo >= inicioPeriodoConsultado && fechaSaldo <= finPeriodoConsultado;
          })
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // Ordenar por fecha ascendente (más temprano primero)
        
        // Tomar el más temprano del mes (primero en el array ordenado)
        setSaldoPendiente(saldosDelMes[0] || null);
      } else {
        setSaldoPendiente(null);
      }
    } catch (e) {
      setSaldoPendiente(null);
    } finally {
      setSaldoLoading(false);
    }
  };

  // Calcular totales y combinar saldo pendiente con recibos
  const { totales, listaCombinada, usarSaldoPendiente } = useMemo(() => {
    // Ordenar recibos por fecha para aplicar lógica de cancelación
    const recibosOrdenados = [...recibos].sort((a, b) => 
      new Date(a.fechaMovimiento) - new Date(b.fechaMovimiento)
    );

    // Verificar si hay recibos anteriores al saldo pendiente
    let usarSaldoPendiente = saldoPendiente;
    if (saldoPendiente && recibos.length > 0) {
      const fechaSaldoPendiente = new Date(saldoPendiente.fecha);
      const hayRecibosAnteriores = recibos.some(recibo => 
        new Date(recibo.fechaMovimiento) < fechaSaldoPendiente
      );
      
      // Si hay recibos anteriores al saldo pendiente, no usar el saldo pendiente
      if (hayRecibosAnteriores) {
        usarSaldoPendiente = null;
      }
    }

    // Aplicar lógica de cancelación a las comisiones
    const comisionesEfectivas = [];
    for (let i = 0; i < recibosOrdenados.length; i++) {
      const reciboActual = recibosOrdenados[i];
      const comisionActual = Number(reciboActual.comisAgente) || 0;
      
      // Buscar si hay un recibo siguiente con comisión negativa
      let esCancelado = false;
      for (let j = i + 1; j < recibosOrdenados.length; j++) {
        const reciboSiguiente = recibosOrdenados[j];
        const comisionSiguiente = Number(reciboSiguiente.comisAgente) || 0;
        
        // Si la comisión actual es positiva y encontramos una negativa después, se cancela
        if (comisionActual > 0 && comisionSiguiente < 0) {
          esCancelado = true;
          break;
        }
      }
      
      // Solo agregar la comisión si no fue cancelada
      if (!esCancelado) {
        comisionesEfectivas.push(comisionActual);
      }
    }

    // Calcular totales incluyendo saldo pendiente
    const saldoPendienteValor = usarSaldoPendiente ? Number(usarSaldoPendiente.saldo) || 0 : 0;
    
    // Para el resumen, sumar todas las comisiones (incluyendo negativas) + saldo pendiente
    const totalComisionesRecibos = recibos.reduce((acc, recibo) => acc + (Number(recibo.comisAgente) || 0), 0);
    
    const totalesRecibos = {
      primaFracc: recibos.reduce((acc, recibo) => acc + (Number(recibo.primaFracc) || 0), 0),
      comisPromotoria: recibos.reduce((acc, recibo) => acc + (Number(recibo.comisPromotoria) || 0), 0),
      comisAgente: totalComisionesRecibos + saldoPendienteValor, // Suma directa de todas las comisiones + saldo pendiente
      comisSupervisor: recibos.reduce((acc, recibo) => acc + (Number(recibo.comisSupervisor) || 0), 0)
    };

    // Crear lista combinada de saldo pendiente y recibos
    const lista = [];
    
    // Agregar saldo pendiente si existe y aplica
    if (usarSaldoPendiente) {
      lista.push({
        id: `saldo-${usarSaldoPendiente.id}`,
        tipo: 'saldo',
        fechaMovimiento: usarSaldoPendiente.fecha,
        descripcion: 'Saldo Pendiente',
        saldo: usarSaldoPendiente.saldo,
        observaciones: usarSaldoPendiente.observaciones,
        poliza: '-',
        nombreAsegurado: '-',
        recibo: '-',
        primaFracc: 0,
        comisPromotoria: 0,
        comisAgente: 0,
        formaPago: '-'
      });
    }

    // Agregar recibos
    recibos.forEach(recibo => {
      lista.push({
        ...recibo,
        tipo: 'recibo',
        saldo: null
      });
    });

    // Ordenar por fecha de movimiento (menor a mayor)
    lista.sort((a, b) => {
      const fechaA = new Date(a.fechaMovimiento);
      const fechaB = new Date(b.fechaMovimiento);
      return fechaA - fechaB;
    });

    return { totales: totalesRecibos, listaCombinada: lista, usarSaldoPendiente };
  }, [recibos, saldoPendiente]);

  const agenteSeleccionado = usuarios.find(u => u.clave == claveAgente);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        Consulta de Recibos por Agente y Mes
      </h1>

      {/* Filtros */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de Agente */}
          <div>
            <AgenteSelect
              value={claveAgente}
              onChange={(e) => setClaveAgente(e.target.value)}
              agentes={usuarios}
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
      {agenteSeleccionado && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
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
                <div>
                  <span className="font-semibold">Banco:</span> {agenteSeleccionado.banco || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">CLABE:</span> {agenteSeleccionado.cuenta_clabe || "N/A"}
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <ExportAgenteMensualPDFButton
                agente={agenteSeleccionado}
                recibos={recibos}
                saldoPendiente={saldoPendiente}
                year={year}
                month={month}
              />
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {loading || saldoLoading ? (
        <div className="text-gray-200 text-center py-8">
          Cargando recibos y saldos...
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : !claveAgente ? (
        <div className="text-gray-400 text-center py-8">
          Seleccione un agente para ver sus recibos
        </div>
      ) : recibos.length === 0 && !saldoPendiente ? (
        <div className="text-gray-400 text-center py-8">
          No se encontraron recibos ni saldo pendiente para el agente y período seleccionado
        </div>
      ) : (
        <div>
          {/* Resumen de totales */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3">
              Resumen del Período ({recibos.length} recibos{usarSaldoPendiente ? ' + 1 saldo pendiente' : ''})
            </h3>
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
            </div>
          </div>

          {/* Tabla de movimientos (saldos y recibos) */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fecha Mov.
                    </th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Póliza
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Asegurado
                    </th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Recibo
                    </th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      DSN
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Prima Fracc.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Comis. Agente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {listaCombinada.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`${index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"} ${
                        item.tipo === 'saldo' ? 'bg-orange-900/20 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {item.fechaMovimiento 
                          ? new Date(item.fechaMovimiento).toLocaleDateString('es-MX')
                          : "N/A"
                        }
                      </td>
                     
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-cyan-400 font-medium">
                        {item.poliza}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {item.nombreAsegurado || "N/A"}
                      </td>
                     
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {item.tipo === 'recibo' ? (item.dsn || "N/A") : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                        {item.primaFracc > 0 ? (
                          `$${item.primaFracc.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {item.tipo === 'saldo' ? (
                          <span className="text-orange-400 font-medium">
                            ${item.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (item.comisAgente !== null && item.comisAgente !== undefined && item.comisAgente !== "") ? (
                          <span className={item.comisAgente >= 0 ? "text-yellow-400" : "text-red-400"}>
                            ${Number(item.comisAgente).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {item.tipo === 'saldo' ? (item.observaciones || "N/A") : (item.formaPago || "N/A")}
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
