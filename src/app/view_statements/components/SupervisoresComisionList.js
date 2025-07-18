import React, { useState, useEffect, useMemo } from "react";
import { descargarSupervisorPDF } from "../utils/pdfSupervisor";
import { obtenerDatosBancarios, obtenerUsuarioCompleto } from "../utils/userDataService";
import { obtenerSaldosAnteriores } from "../utils/saldosPendientesService";

const SupervisoresComisionList = ({ supervisoresRecibos, usuarios, fechaInicio = "", fechaFin = "", onTotalesCalculados }) => {

  const [generandoPDFs, setGenerandoPDFs] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [saldosPendientes, setSaldosPendientes] = useState({});
  const [cargandoSaldos, setCargandoSaldos] = useState(false);

  // Memorizar los totales calculados para evitar recálculos innecesarios
  const totalesCalculados = useMemo(() => {
    let totalPrimaSupervisores = 0;
    let totalComisionSupervisores = 0;
    
    // Solo procesar si hay datos
    if (supervisoresRecibos && Object.keys(supervisoresRecibos).length > 0) {
      Object.values(supervisoresRecibos).forEach(data => {
        if (data && data.recibos && Array.isArray(data.recibos)) {
          // Calcular totales de la última fila como se muestra en la tabla
          const totalPrima = data.recibos.reduce((total, recibo) => total + (recibo.primaFracc || 0), 0);
          // Para supervisores: sumar comisiones de supervisor + saldos pendientes (que están en comisSupervisor)
          const totalComision = data.recibos.reduce((total, recibo) => {
            if (recibo.esSaldoPendiente) {
              return total + (recibo.comisSupervisor || 0);
            } else {
              return total + (recibo.comisSupervisor || 0);
            }
          }, 0);
          
          totalPrimaSupervisores += totalPrima;
          totalComisionSupervisores += totalComision;
        }
      });
    }
    
    const resultado = {
      tipo: 'supervisores',
      totalPrima: totalPrimaSupervisores,
      totalComision: totalComisionSupervisores,
      cantidadUsuarios: supervisoresRecibos ? Object.keys(supervisoresRecibos).length : 0
    };
    
    // Llamar al callback directamente cuando hay cambios reales
    if (onTotalesCalculados) {
      // Usar setTimeout para evitar el bucle en el render
      setTimeout(() => {
        onTotalesCalculados(resultado);
      }, 0);
    }
    
    return resultado;
  }, [supervisoresRecibos, onTotalesCalculados]);

  // Función para obtener saldos pendientes de supervisores
  const obtenerSaldosPendientesSupervisores = async () => {
    if (!supervisoresRecibos || Object.keys(supervisoresRecibos).length === 0 || !fechaInicio) return;
    
    setCargandoSaldos(true);
    const saldosTemp = {};
    
    try {
      for (const claveSupervisor of Object.keys(supervisoresRecibos)) {
        try {
          // Obtener el usuario para conseguir su ID
          const usuario = await obtenerUsuarioCompleto(claveSupervisor);
          if (!usuario || !usuario.id) {
            console.warn(`No se pudo obtener el usuario supervisor ${claveSupervisor}`);
            continue;
          }
          
          // Obtener saldos anteriores a la fecha de inicio del corte
          const saldosPrevios = obtenerSaldosAnteriores(usuario.id, fechaInicio);
          
          if (saldosPrevios.length > 0) {
            saldosTemp[claveSupervisor] = saldosPrevios[0];
            console.log(`💰 Saldo pendiente previo encontrado para supervisor ${claveSupervisor}:`, saldosPrevios[0]);
          }
        } catch (error) {
          console.error(`Error obteniendo saldo pendiente para supervisor ${claveSupervisor}:`, error);
        }
      }
      
      setSaldosPendientes(saldosTemp);
    } catch (error) {
      console.error('Error general obteniendo saldos pendientes de supervisores:', error);
    } finally {
      setCargandoSaldos(false);
    }
  };

  // Cargar saldos pendientes al montar el componente o cambiar las fechas
  useEffect(() => {
    obtenerSaldosPendientesSupervisores();
  }, [supervisoresRecibos, fechaInicio]);

  const handleDescargar = async (supervisor, claveSupervisor, data) => {
    setGenerandoPDFs(prev => ({ ...prev, [claveSupervisor]: true }));
    try {
      // Obtener datos bancarios del supervisor
      const datosUsuario = await obtenerDatosBancarios(claveSupervisor);
      
      await descargarSupervisorPDF({
        supervisor,
        claveSupervisor,
        data,
        usuarios: usuarios || [],
        tipo: "supervisor",
        fechaInicio,
        fechaFin,
        datosUsuario
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setGenerandoPDFs(prev => ({ ...prev, [claveSupervisor]: false }));
    }
  };

  return (
    <>
      <h2 className="text-lg font-bold text-blue-400 mb-2 mt-8">Supervisores (Recibos con comisión para el supervisor)</h2>
      {Object.keys(supervisoresRecibos).length > 0 ? (
        Object.entries(supervisoresRecibos).map(([claveSupervisor, data]) => {
          const supervisor = usuarios.find(u => String(u.clave) === String(claveSupervisor));
          const expanded = expandedItems[claveSupervisor] || false;
          const saldoPendiente = saldosPendientes[claveSupervisor];
          
          // Calcular saldo neto (comisión del corte - saldo pendiente previo)
          const comisionCorte = data.totalComisSupervisor || 0;
          const montoPendiente = saldoPendiente?.saldo || 0;
          const saldoNeto = comisionCorte - Math.abs(montoPendiente);
          
          const toggleExpanded = () => {
            setExpandedItems(prev => ({
              ...prev,
              [claveSupervisor]: !prev[claveSupervisor]
            }));
          };
          
          return (
            <div key={claveSupervisor} className="mb-8 bg-slate-800 rounded-2xl shadow-lg p-6 text-white border border-slate-700">
              <div className="mb-2 flex flex-wrap justify-between gap-4 cursor-pointer" onClick={toggleExpanded}>
                <span className="text-blue-300 font-bold text-lg">
                  Supervisor: <span className="text-white">{claveSupervisor}</span>
                  {supervisor && <span className="ml-2 text-gray-300">({supervisor.nombre})</span>}
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-blue-300">
                    Comisión total: {data.totalComisSupervisor?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                  </span>
                  {saldoPendiente && (
                    <span className="text-red-300">
                      Saldo Pendiente: {Math.abs(saldoPendiente.saldo).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </span>
                  )}
                  <span className={`font-bold ${saldoNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Saldo Neto: {saldoNeto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                  </span>
                  <span className="text-blue-200">
                    Recibos: {data.recibos.length}
                  </span>
                  {cargandoSaldos && (
                    <span className="text-yellow-300 text-xs">
                      Cargando saldos...
                    </span>
                  )}
                  <button
                    className={`px-3 py-1 rounded shadow text-white ${
                      generandoPDFs[claveSupervisor] 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    onClick={e => {
                      e.stopPropagation();
                      handleDescargar(supervisor, claveSupervisor, data);
                    }}
                    disabled={generandoPDFs[claveSupervisor]}
                  >
                    {generandoPDFs[claveSupervisor] ? 'Generando...' : 'Descargar'}
                  </button>
                  <span className="text-gray-400 select-none">
                    {expanded ? "\u25bc" : "\u25b6"}
                  </span>
                </div>
              </div>
              {expanded && (
                <div className="mt-4">
                  {/* Información de saldo pendiente */}
                  {saldoPendiente && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded">
                      <h4 className="text-red-300 font-semibold mb-2">💰 Saldo Pendiente Previo:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Monto:</span>
                          <div className="text-red-300 font-bold">
                            {Math.abs(saldoPendiente.saldo).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Fecha:</span>
                          <div className="text-white">
                            {new Date(saldoPendiente.fecha).toLocaleDateString('es-MX')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Comisión Corte:</span>
                          <div className="text-blue-300 font-bold">
                            {comisionCorte.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Saldo Neto:</span>
                          <div className={`font-bold ${saldoNeto >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {saldoNeto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                          </div>
                        </div>
                      </div>
                      {saldoPendiente.observaciones && (
                        <div className="mt-2">
                          <span className="text-gray-400 text-xs">Observaciones:</span>
                          <div className="text-gray-300 text-xs">{saldoPendiente.observaciones}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tabla de recibos */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left p-2">Póliza</th>
                          <th className="text-left p-2">Agente</th>
                          <th className="text-left p-2">Asegurado</th>
                          <th className="text-left p-2">Fecha Mov.</th>
                          <th className="text-left p-2">Año Vigencia</th>
                          <th className="text-left p-2">Plan</th>
                          <th className="text-left p-2">Prima</th>
                        <th className="text-left p-2">% Comisión</th>
                        <th className="text-left p-2">Comisión Agente</th>
                        <th className="text-left p-2">Comisión Supervisor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recibos.map((recibo, idx) => {
                        let agenteStr = '';
                        if (recibo.claveAgente) {
                          const agente = usuarios.find(u => String(u.clave) === String(recibo.claveAgente));
                          agenteStr = agente ? `${recibo.claveAgente} (${agente.nombre})` : recibo.claveAgente;
                        }
                        return (
                          <tr key={idx} className={`border-b border-slate-700 hover:bg-slate-700 ${
                            recibo.esSaldoPendiente || recibo.nombreAsegurado === 'SALDO PENDIENTE' || recibo.comisAgente < 0 || recibo.comisSupervisor < 0 
                              ? 'text-red-500' 
                              : ''
                          }`}>
                            <td className="p-2">{recibo.polizaRef?.poliza || recibo.poliza}</td>
                            <td className="p-2">{agenteStr}</td>
                            <td className="p-2">{recibo.nombreAsegurado}</td>
                            <td className="p-2">{recibo.fechaMovimiento ? new Date(recibo.fechaMovimiento).toLocaleDateString('es-MX') : ''}</td>
                            <td className="p-2">{recibo.anioVig || ''}</td>
                            <td className="p-2">{recibo.dsn}</td>
                            <td className="p-2">{(recibo.primaFracc || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                            <td className="p-2">{(recibo.pctComisSupervisor || 0)}%</td>
                            <td className="p-2">
                              {/* Columna "Comisión Agente" - siempre $0.00 para supervisores */}
                              $0.00
                            </td>
                            <td className="p-2">
                              {/* Mostrar tanto comisSupervisor como saldos pendientes en la columna "Comisión Supervisor" */}
                              {recibo.esSaldoPendiente 
                                ? (recibo.comisSupervisor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
                                : (recibo.comisSupervisor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
                              }
                            </td>
                          </tr>
                        );
                      })}
                      {/* Fila de totales */}
                      <tr className="font-bold bg-slate-900 border-t border-slate-700">
                        <td className="p-2 text-right" colSpan={6}>Totales:</td>
                        <td className="p-2 text-left">
                          {data.recibos.reduce((total, recibo) => total + (recibo.primaFracc || 0), 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        </td>
                        <td className="p-2"></td>
                        <td className="p-2 text-left">
                          {/* Columna "Comisión Agente" - siempre $0.00 para supervisores */}
                          $0.00
                        </td>
                        <td className="p-2 text-left">
                          {/* Sumar tanto comisiones de supervisor como saldos pendientes en la columna "Comisión Supervisor" */}
                          {data.recibos.reduce((total, recibo) => {
                            if (recibo.esSaldoPendiente) {
                              return total + (recibo.comisSupervisor || 0);
                            } else {
                              return total + (recibo.comisSupervisor || 0);
                            }
                          }, 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        </td>
                      </tr>
                      {/* Fila de saldo neto si hay saldo pendiente */}
                      {saldoPendiente && (
                        <tr className="font-bold bg-slate-800 border-t border-slate-600">
                          <td className="p-2 text-right" colSpan={9}>
                            <span className="text-red-300">Menos Saldo Pendiente:</span>
                          </td>
                          <td className="p-2 text-left text-red-300">
                            -{Math.abs(saldoPendiente.saldo).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                          </td>
                        </tr>
                      )}
                      {saldoPendiente && (
                        <tr className="font-bold bg-blue-900/30 border-t border-blue-700">
                          <td className="p-2 text-right" colSpan={9}>
                            <span className="text-blue-300">Saldo Neto Final:</span>
                          </td>
                          <td className={`p-2 text-left ${saldoNeto >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {saldoNeto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-gray-400">No hay supervisores con recibos de comisión en este corte.</div>
      )}
    </>
  );
};

export default SupervisoresComisionList;
