import React, { useState, useEffect } from "react";
import { descargarSupervisorPDF } from "../utils/pdfSupervisor";
import { obtenerDatosBancarios, obtenerUsuarioCompleto } from "../utils/userDataService";
import { obtenerSaldosAnteriores } from "../utils/saldosPendientesService";

const AgenteStateCard = ({ agenteClave, agenteNombre, data, isActivo, supervisorInfo, usuarios, fechaInicio, fechaFin }) => {
  const [expanded, setExpanded] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [saldoPendientePrevio, setSaldoPendientePrevio] = useState(null);
  const [cargandoSaldo, setCargandoSaldo] = useState(false);

  // Función para obtener saldo pendiente previo
  const obtenerSaldoPendiente = async () => {
    if (!agenteClave || !fechaInicio) return;
    
    setCargandoSaldo(true);
    try {
      // Obtener el usuario para conseguir su ID
      const usuario = await obtenerUsuarioCompleto(agenteClave);
      if (!usuario || !usuario.id) {
        console.warn(`No se pudo obtener el usuario ${agenteClave}`);
        return;
      }
      
      // Obtener saldos anteriores a la fecha de inicio del corte
      const saldosPrevios = obtenerSaldosAnteriores(usuario.id, fechaInicio);
      
      if (saldosPrevios.length > 0) {
        // Tomar el más reciente (el primero en la lista ordenada)
        setSaldoPendientePrevio(saldosPrevios[0]);
        console.log(`💰 Saldo pendiente previo encontrado para ${agenteClave}:`, saldosPrevios[0]);
      } else {
        setSaldoPendientePrevio(null);
      }
    } catch (error) {
      console.error(`Error obteniendo saldo pendiente para ${agenteClave}:`, error);
      setSaldoPendientePrevio(null);
    } finally {
      setCargandoSaldo(false);
    }
  };

  // Cargar saldo pendiente al montar el componente o cambiar las fechas
  useEffect(() => {
    obtenerSaldoPendiente();
  }, [agenteClave, fechaInicio]);

  // Calcular saldo neto (comisión del corte - saldo pendiente previo)
  const comisionCorte = data.totalComision || data.totalComisAgente || data.totalComisSupervisor || 0;
  const montoPendiente = saldoPendientePrevio?.saldo || 0;
  const saldoNeto = comisionCorte - Math.abs(montoPendiente); // Math.abs porque los saldos pendientes son negativos

  const handleDescargar = async () => {
    setGenerandoPDF(true);
    try {
      // Obtener datos bancarios del agente
      const datosUsuario = await obtenerDatosBancarios(agenteClave);
      
      // Usar el util pdfSupervisor para descargar el PDF del agente
      await descargarSupervisorPDF({
        supervisor: supervisorInfo,
        claveSupervisor: agenteClave,
        data: data, // Usar los datos tal como están, sin mapeo
        usuarios: usuarios || [],
        tipo: "agente",
        nombreAgente: agenteNombre || "",
        fechaInicio,
        fechaFin,
        datosUsuario
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg p-6 text-white border border-slate-700">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-xl font-bold text-green-400">
          Agente: <span className="text-white">{agenteClave}</span>
          {agenteNombre && <span className="ml-2 text-gray-300">({agenteNombre})</span>}
          {supervisorInfo && (
            <span className="ml-4 text-blue-300 text-base">
              Supervisor: <span className="text-white">{supervisorInfo.clave}</span> <span className="text-gray-300">({supervisorInfo.nombre})</span>
            </span>
          )}
        </h3>
        <div className="flex gap-4 text-sm items-center">
          <span className="text-amber-300">
            Promotoria: {(data.totalComisPromotoria || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          </span>
          <span className="text-green-300">
            Agente: {(data.totalComisAgente || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          </span>
          <span className="text-purple-300">
            Supervisor: {(data.totalComisSupervisor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          </span>
          {saldoPendientePrevio && (
            <span className="text-red-300">
              Saldo Pendiente: {Math.abs(saldoPendientePrevio.saldo).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </span>
          )}
          <span className={`font-bold ${saldoNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Saldo Neto: {saldoNeto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
          </span>
          <span className="text-blue-300">
            Recibos: {data.recibos?.length || 0}
          </span>
          {cargandoSaldo && (
            <span className="text-yellow-300 text-xs">
              Cargando saldo...
            </span>
          )}
          {isActivo && (
            <button
              className={`px-3 py-1 rounded shadow text-white ${
                generandoPDF 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={e => { e.stopPropagation(); handleDescargar(); }}
              disabled={generandoPDF}
            >
              {generandoPDF ? 'Generando...' : 'Descargar'}
            </button>
          )}
          <span className="text-gray-400">
            {expanded ? "\u25bc" : "\u25b6"}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4">
          {/* Información de saldo pendiente */}
          {saldoPendientePrevio && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded">
              <h4 className="text-red-300 font-semibold mb-2">💰 Saldo Pendiente Previo:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Monto:</span>
                  <div className="text-red-300 font-bold">
                    {Math.abs(saldoPendientePrevio.saldo).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Fecha:</span>
                  <div className="text-white">
                    {new Date(saldoPendientePrevio.fecha).toLocaleDateString('es-MX')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Comisión Corte:</span>
                  <div className="text-green-300 font-bold">
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
              {saldoPendientePrevio.observaciones && (
                <div className="mt-2">
                  <span className="text-gray-400 text-xs">Observaciones:</span>
                  <div className="text-gray-300 text-xs">{saldoPendientePrevio.observaciones}</div>
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
                  <th className="text-left p-2">Asegurado</th>
                  <th className="text-left p-2">Fecha Mov.</th>
                  <th className="text-left p-2">Año Vigencia</th>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">Prima</th>
                  <th className="text-left p-2">% Comisión</th>
                  <th className="text-left p-2">Comisión Agente</th>
                </tr>
              </thead>
              <tbody>
                {(data.recibos || []).map((recibo, idx) => (
                  <tr key={idx} className={`border-b border-slate-700 hover:bg-slate-700 ${
                    recibo.esSaldoPendiente || recibo.nombreAsegurado === 'SALDO PENDIENTE' || (recibo.comisAgente || 0) < 0 
                      ? 'text-red-500' 
                      : ''
                  }`} >
                    <td className="p-2">{recibo.polizaRef?.poliza || recibo.poliza}</td>
                    <td className="p-2">{recibo.nombreAsegurado}</td>
                    <td className="p-2">
                      {recibo.fechaMovimiento ? new Date(recibo.fechaMovimiento).toLocaleDateString('es-MX') : ''}
                    </td>
                    <td className="p-2">{recibo.anioVig || ''}</td>
                    <td className="p-2 text-left">
                      {recibo.dsn ? recibo.dsn.toLocaleString('es-MX') : ''}
                    </td>
                    <td className="p-2 text-left">
                      {(recibo.primaFracc || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </td>
                    <td className="p-2 text-left">
                      {(recibo.pctComisAgente || 0)}%
                    </td>
                    <td className="p-2 text-left">
                      {(recibo.comisAgente || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </td>
                  </tr>
                ))}
                {/* Fila de totales */}
                <tr className="font-bold bg-slate-900 border-t border-slate-700">
                  <td className="p-2 text-right" colSpan={5}>Totales:</td>
                  <td className="p-2 text-left">{(data.totalPrimaFracc || data.totalPrima || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                  <td className="p-2"></td>
                  <td className="p-2 text-left">{(data.totalComision || data.totalComisAgente || data.totalComisSupervisor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                </tr>
                {/* Fila de saldo neto si hay saldo pendiente */}
                {saldoPendientePrevio && (
                  <tr className="font-bold bg-slate-800 border-t border-slate-600">
                    <td className="p-2 text-right" colSpan={7}>
                      <span className="text-red-300">Menos Saldo Pendiente:</span>
                    </td>
                    <td className="p-2 text-left text-red-300">
                      -{Math.abs(saldoPendientePrevio.saldo).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </td>
                  </tr>
                )}
                {saldoPendientePrevio && (
                  <tr className="font-bold bg-green-900/30 border-t border-green-700">
                    <td className="p-2 text-right" colSpan={7}>
                      <span className="text-green-300">Saldo Neto Final:</span>
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
};

export default AgenteStateCard;
