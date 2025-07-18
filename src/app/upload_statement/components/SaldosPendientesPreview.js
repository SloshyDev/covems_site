import React, { useState, useEffect, useMemo } from "react";
import { getComisionAgenteRecibo, getComisionMontoRecibo, getComisionSupervisorRecibo } from "../utils/comisiones";

const SaldosPendientesPreview = ({ filteredData, headers, polizas, selectedCorte, selectedMonth, selectedYear, cortes }) => {
  const [saldosPendientes, setSaldosPendientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar saldos pendientes y usuarios
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [saldosRes, usuariosRes] = await Promise.all([
          fetch("/api/saldos-pendientes"),
          fetch("/api/users")
        ]);
        
        if (saldosRes.ok && usuariosRes.ok) {
          const saldosData = await saldosRes.json();
          const usuariosData = await usuariosRes.json();
          setSaldosPendientes(saldosData.saldos || []);
          setUsuarios(usuariosData || []);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcular resumen de comisiones por agente
  const resumenComisiones = useMemo(() => {
    if (!filteredData.length || !polizas.length) return {};

    // Crear mapeo de pólizas a agentes
    const polizaMap = {};
    polizas.forEach(p => {
      if (p.poliza != null) {
        polizaMap[String(p.poliza)] = p.agenteClave;
      }
    });

    // Índices de campos importantes
    const noPolizaIdx = headers.findIndex(h => h === "No. Poliza");
    const anioVigIdx = headers.findIndex(h => h === "Año Vig.");
    const dsnIdx = headers.findIndex(h => h === "Dsn");
    const formaPagoIdx = headers.findIndex(h => h === "Forma de pago");
    const primaFraccIdx = headers.findIndex(h => h === "Prima Fracc");
    const recargoFijoIdx = headers.findIndex(h => h === "Recargo Fijo");
    const importeCombleIdx = headers.findIndex(h => h === "Importe Comble");
    const comisIdx = headers.findIndex(h => h === "% Comis");

    // Agrupar por agente y calcular comisiones
    const comisionesPorAgente = {};

    filteredData.forEach(row => {
      const noPoliza = row[noPolizaIdx] != null ? String(row[noPolizaIdx]) : "Sin póliza";
      const claveAgente = polizaMap[noPoliza] ?? "Sin agente";
      
      if (claveAgente === "Sin agente") return;

      // Inicializar agente si no existe
      if (!comisionesPorAgente[claveAgente]) {
        comisionesPorAgente[claveAgente] = {
          totalComisionAgente: 0,
          totalComisionPromotoria: 0,
          totalComisionSupervisor: 0,
          recibos: 0,
          agenteClave: claveAgente
        };
      }

      // Calcular comisiones
      const anioVigRecibo = anioVigIdx !== -1 ? row[anioVigIdx] : null;
      
      const comisionPromotoria = getComisionMontoRecibo(row, {
        nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
        comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año')),
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
        nivelacionIdx: headers.findIndex(h => h.toLowerCase().includes('nivelacion variable')),
        comis1erAnioIdx: headers.findIndex(h => h.toLowerCase().includes('comis 1er año'))
      }, claveAgente, anioVigRecibo);

      const comisionSupervisor = getComisionSupervisorRecibo(row, {
        dsnIdx,
        formaPagoIdx,
        primaFraccIdx,
        recargoFijoIdx
      });

      comisionesPorAgente[claveAgente].totalComisionAgente += comisionAgente.valor || 0;
      comisionesPorAgente[claveAgente].totalComisionPromotoria += comisionPromotoria.valor || 0;
      comisionesPorAgente[claveAgente].totalComisionSupervisor += comisionSupervisor.valor || 0;
      comisionesPorAgente[claveAgente].recibos += 1;
    });

    return { agentes: comisionesPorAgente };
  }, [filteredData, headers, polizas]);

  // Obtener saldos pendientes del corte actual (fecha del primer día del corte)
  const saldosDelCorte = useMemo(() => {
    if (!saldosPendientes.length || !usuarios.length) return {};

    const fechaInicioCorte = new Date(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(cortes[selectedCorte]?.inicio || 1).padStart(2, '0')}`);
    
    const saldosMap = {};
    
    saldosPendientes.forEach((saldo, index) => {
      const fechaSaldo = new Date(saldo.fecha);
      const claveAgente = String(saldo.agente?.clave || '');
      
      // Buscar saldos que coincidan exactamente con la fecha del inicio del corte
      if (fechaSaldo.getTime() === fechaInicioCorte.getTime()) {
        if (claveAgente && claveAgente !== '') {
          // Solo mantener un saldo por agente para esta fecha específica
          if (!saldosMap[claveAgente] || new Date(saldosMap[claveAgente].fecha) <= fechaSaldo) {
            saldosMap[claveAgente] = saldo;
          }
        }
      }
    });

    return saldosMap;
  }, [saldosPendientes, usuarios, selectedCorte, selectedMonth, selectedYear, cortes]);

  // Combinar datos para la tabla
  const datosTabla = useMemo(() => {
    const datos = [];
    const agentesEnResumen = new Set(Object.keys(resumenComisiones.agentes || {}));
    const agentesConSaldo = new Set(Object.keys(saldosDelCorte));
    const todosLosAgentes = new Set([...agentesEnResumen, ...agentesConSaldo]);

    todosLosAgentes.forEach(claveAgente => {
      const usuario = usuarios.find(u => String(u.clave) === String(claveAgente));
      const comisiones = resumenComisiones.agentes?.[claveAgente] || { 
        totalComisionAgente: 0, 
        totalComisionPromotoria: 0, 
        totalComisionSupervisor: 0,
        recibos: 0 
      };
      const saldoActual = saldosDelCorte[claveAgente] || { saldo: 0 };
      
      // Determinar el tipo de usuario basado en tipo_usuario
      // tipo_usuario: 1 = admin, 2 = agente, 3 = supervisor
      let tipoUsuario = 'agente'; // por defecto
      
      if (usuario) {
        if (usuario.tipo_usuario === 3) {
          tipoUsuario = 'supervisor';
        } else if (usuario.tipo_usuario === 2) {
          tipoUsuario = 'agente';
        }
      }
      
      // Calcular saldo nuevo para agente: saldo actual + comisiones
      // Si saldo actual es -100 y comisiones son +80, el nuevo saldo sería -20
      // Si saldo actual es -100 y comisiones son +120, el nuevo saldo sería +20
      const saldoNuevoAgente = (saldoActual.saldo || 0) + comisiones.totalComisionAgente;
      
      // FILTRO: Solo procesar si tiene saldo actual negativo
      const tieneSaldoNegativo = (saldoActual.saldo || 0) < 0;
      
      if (tieneSaldoNegativo) {
        console.log(`🔍 Procesando agente ${claveAgente}:`, {
          saldoActual: saldoActual.saldo,
          comision: comisiones.totalComisionAgente,
          saldoNuevo: saldoNuevoAgente,
          nombre: usuario?.nombre
        });
        
        // Determinar qué saldo se guardará en la BD (0 si queda positivo, o el saldo negativo actualizado)
        const saldoParaBD = saldoNuevoAgente >= 0 ? 0 : saldoNuevoAgente;
        
        // Agregar la fila del agente si tiene comisión de agente, recibos, o simplemente saldo negativo
        // Pero solo si es un agente (tipo_usuario = 2) o no hay info de tipo
        const esAgente = !usuario || usuario.tipo_usuario === 2 || usuario.tipo_usuario === 1; // admin también puede ser tratado como agente
        const esSupervisor = usuario && usuario.tipo_usuario === 3;
        
        if ((comisiones.totalComisionAgente > 0 || comisiones.recibos > 0 || (tieneSaldoNegativo && esAgente)) && !esSupervisor) {
          datos.push({
            claveUsuario: `${claveAgente}-agente`,
            claveAgente,
            nombreUsuario: usuario?.nombre || 'Usuario no encontrado',
            saldoActual: saldoActual.saldo || 0,
            comisionDelCorte: comisiones.totalComisionAgente,
            comisionAgente: comisiones.totalComisionAgente,
            comisionSupervisor: 0,
            comisionPromotoria: comisiones.totalComisionPromotoria,
            recibos: comisiones.recibos,
            saldoNuevo: saldoNuevoAgente,
            saldoParaBD: saldoParaBD,
            fechaSaldoActual: saldoActual.fecha,
            observaciones: saldoActual.observaciones,
            tipo: 'agente',
            tipoUsuarioNum: usuario?.tipo_usuario || 0,
            esFilaSupervisor: false,
            estadoAjuste: saldoNuevoAgente >= 0 ? 'saldado' : 'sigue_negativo'
          });
        }
        
        // Agregar fila separada para comisión de supervisor si existe
        if (comisiones.totalComisionSupervisor > 0) {
          // El supervisor también puede tener un saldo negativo del corte actual
          // Usar el mismo saldo actual que el agente (ya que comparten la misma clave)
          const saldoActualSupervisor = saldoActual.saldo || 0;
          const saldoNuevoSupervisor = saldoActualSupervisor + comisiones.totalComisionSupervisor;
          
          console.log(`🔍 Procesando supervisor ${claveAgente}:`, {
            saldoActual: saldoActualSupervisor,
            comisionSupervisor: comisiones.totalComisionSupervisor,
            saldoNuevo: saldoNuevoSupervisor,
            nombre: usuario?.nombre
          });
          
          datos.push({
            claveUsuario: `${claveAgente}-supervisor`,
            claveAgente,
            nombreUsuario: `${usuario?.nombre || 'Usuario no encontrado'} (Comisión Supervisor)`,
            saldoActual: saldoActualSupervisor,
            comisionDelCorte: comisiones.totalComisionSupervisor,
            comisionAgente: 0,
            comisionSupervisor: comisiones.totalComisionSupervisor,
            comisionPromotoria: 0,
            recibos: 0, // Los recibos se muestran en la fila del agente
            saldoNuevo: saldoNuevoSupervisor,
            saldoParaBD: saldoNuevoSupervisor >= 0 ? 0 : saldoNuevoSupervisor,
            fechaSaldoActual: saldoActual.fecha,
            observaciones: 'Comisión por supervisión',
            tipo: 'supervisor',
            tipoUsuarioNum: usuario?.tipo_usuario || 0,
            esFilaSupervisor: true,
            estadoAjuste: saldoNuevoSupervisor >= 0 ? 'saldado' : 'sigue_negativo'
          });
        }
        
        // Si es supervisor y solo tiene saldo negativo (sin comisiones de agente ni supervisor)
        if (esSupervisor && tieneSaldoNegativo && comisiones.totalComisionAgente === 0 && comisiones.totalComisionSupervisor === 0) {
          const saldoNuevoSupervisorSolo = saldoActual.saldo || 0; // Sin comisiones, el saldo se mantiene
          
          console.log(`🔍 Procesando supervisor (solo saldo) ${claveAgente}:`, {
            saldoActual: saldoActual.saldo,
            saldoNuevo: saldoNuevoSupervisorSolo,
            nombre: usuario?.nombre
          });
          
          datos.push({
            claveUsuario: `${claveAgente}-supervisor-solo`,
            claveAgente,
            nombreUsuario: `${usuario?.nombre || 'Usuario no encontrado'} (Supervisor)`,
            saldoActual: saldoActual.saldo,
            comisionDelCorte: 0,
            comisionAgente: 0,
            comisionSupervisor: 0,
            comisionPromotoria: 0,
            recibos: 0,
            saldoNuevo: saldoNuevoSupervisorSolo,
            saldoParaBD: saldoNuevoSupervisorSolo, // Se mantiene el saldo negativo
            fechaSaldoActual: saldoActual.fecha,
            observaciones: 'Supervisor con saldo pendiente',
            tipo: 'supervisor',
            tipoUsuarioNum: usuario?.tipo_usuario || 0,
            esFilaSupervisor: true,
            estadoAjuste: 'sigue_negativo'
          });
        }
      }
    });

    return datos.sort((a, b) => {
      // Primero ordenar por clave de agente, luego agente antes que supervisor
      const claveCompare = a.claveAgente.localeCompare(b.claveAgente);
      if (claveCompare !== 0) return claveCompare;
      return a.esFilaSupervisor ? 1 : -1;
    });
  }, [resumenComisiones, saldosDelCorte, usuarios]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mt-6">
        <h3 className="text-cyan-300 font-bold text-lg mb-4">🔄 Cargando vista previa de saldos...</h3>
      </div>
    );
  }

  if (!filteredData.length) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mt-6">
      <h3 className="text-cyan-300 font-bold text-lg mb-4">
        💰 Ajuste de Saldos Pendientes
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Esta tabla muestra usuarios con saldos negativos del corte actual que serán ajustados con las comisiones. 
        Si el saldo queda positivo se guardará como $0.00, si sigue negativo se actualizará con el nuevo saldo pendiente. 
        La fecha será el inicio del siguiente corte.
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-cyan-900">
              <th className="px-3 py-2 text-left text-cyan-200 font-bold border-b-2 border-cyan-600">
                Usuario
              </th>
              <th className="px-3 py-2 text-left text-cyan-200 font-bold border-b-2 border-cyan-600">
                Nombre
              </th>
              <th className="px-3 py-2 text-center text-cyan-200 font-bold border-b-2 border-cyan-600">
                Tipo
              </th>
              <th className="px-3 py-2 text-right text-cyan-200 font-bold border-b-2 border-cyan-600">
                Saldo del Corte
              </th>
              <th className="px-3 py-2 text-right text-cyan-200 font-bold border-b-2 border-cyan-600">
                Comisión Total
              </th>
              <th className="px-3 py-2 text-center text-cyan-200 font-bold border-b-2 border-cyan-600">
                Recibos
              </th>
              <th className="px-3 py-2 text-right text-cyan-200 font-bold border-b-2 border-cyan-600">
                Saldo Resultante
              </th>
              <th className="px-3 py-2 text-right text-cyan-200 font-bold border-b-2 border-cyan-600">
                Saldo a Guardar
              </th>
              <th className="px-3 py-2 text-center text-cyan-200 font-bold border-b-2 border-cyan-600">
                Estado Ajuste
              </th>
            </tr>
          </thead>
          <tbody>
            {datosTabla.map((dato, index) => (
              <tr 
                key={dato.claveUsuario}
                className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-cyan-950 transition-colors ${
                  dato.esFilaSupervisor ? 'bg-purple-900/20' : ''
                }`}
              >
                <td className="px-3 py-2 border-b border-gray-700 font-mono text-cyan-100">
                  {dato.claveAgente}
                </td>
                <td className="px-3 py-2 border-b border-gray-700 text-gray-200">
                  {dato.nombreUsuario}
                </td>
                <td className="px-3 py-2 border-b border-gray-700 text-center">
                  <div className="space-y-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      dato.esFilaSupervisor || dato.tipo === 'supervisor' 
                        ? 'bg-purple-900 text-purple-200' 
                        : 'bg-blue-900 text-blue-200'
                    }`}>
                      {dato.esFilaSupervisor ? 'COMISIÓN SUP' : (dato.tipo === 'supervisor' ? 'SUPERVISOR' : 'AGENTE')}
                    </span>
                    <div className="text-xs text-gray-400">
                      tipo: {dato.tipoUsuarioNum}
                    </div>
                  </div>
                </td>
                <td className={`px-3 py-2 border-b border-gray-700 text-right font-bold ${
                  dato.saldoActual < 0 ? 'text-red-300' : 
                  dato.saldoActual > 0 ? 'text-green-300' : 'text-gray-400'
                }`}>
                  {dato.saldoActual.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </td>
                <td className="px-3 py-2 border-b border-gray-700 text-right">
                  <div className="space-y-1">
                    <div className={`font-bold ${dato.esFilaSupervisor ? 'text-purple-300' : 'text-blue-300'}`}>
                      {dato.comisionDelCorte.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </div>
                    <div className="text-xs space-y-0.5">
                      {dato.esFilaSupervisor ? (
                        <div className="text-purple-300">
                          Comisión Supervisor
                        </div>
                      ) : (
                        <div className="text-blue-300">
                          Comisión Agente
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 border-b border-gray-700 text-center text-gray-300">
                  {dato.recibos}
                </td>
                <td className={`px-3 py-2 border-b border-gray-700 text-right font-bold ${
                  dato.saldoNuevo < 0 ? 'text-red-400' : 
                  dato.saldoNuevo > 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {dato.saldoNuevo.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </td>
                <td className={`px-3 py-2 border-b border-gray-700 text-right font-bold ${
                  dato.saldoParaBD < 0 ? 'text-red-400' : 
                  dato.saldoParaBD > 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {dato.saldoParaBD.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </td>
                <td className="px-3 py-2 border-b border-gray-700 text-center">
                  {dato.estadoAjuste === 'saldado' ? (
                    <span className="px-2 py-1 bg-green-900 text-green-200 rounded text-xs">
                      ✅ SALDADO
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-900 text-red-200 rounded text-xs">
                      ⚠️ SIGUE DEUDOR
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {datosTabla.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400 border-b border-gray-700">
                  No hay usuarios con saldos negativos pendientes de ajuste.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {datosTabla.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Estadísticas por estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-green-900/20 border border-green-700 rounded p-3">
              <div className="text-green-300 font-bold">✅ Usuarios Saldados</div>
              <div className="text-green-200 text-lg font-mono">
                {datosTabla.filter(d => d.estadoAjuste === 'saldado').length}
              </div>
              <div className="text-green-200 text-xs mt-1 space-y-1">
                <div>Se guardarán con saldo $0.00</div>
                <div>Agentes: {datosTabla.filter(d => d.estadoAjuste === 'saldado' && d.tipo === 'agente').length} | Supervisores: {datosTabla.filter(d => d.estadoAjuste === 'saldado' && d.tipo === 'supervisor').length}</div>
              </div>
            </div>
            <div className="bg-red-900/20 border border-red-700 rounded p-3">
              <div className="text-red-300 font-bold">⚠️ Usuarios Siguen Deudores</div>
              <div className="text-red-200 text-lg font-mono">
                {datosTabla.filter(d => d.estadoAjuste === 'sigue_negativo').length}
              </div>
              <div className="text-red-200 text-xs mt-1 space-y-1">
                <div>Total pendiente: {datosTabla.filter(d => d.estadoAjuste === 'sigue_negativo').reduce((sum, d) => sum + d.saldoParaBD, 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
                <div>Agentes: {datosTabla.filter(d => d.estadoAjuste === 'sigue_negativo' && d.tipo === 'agente').length} | Supervisores: {datosTabla.filter(d => d.estadoAjuste === 'sigue_negativo' && d.tipo === 'supervisor').length}</div>
              </div>
            </div>
          </div>

          {/* Totales generales */}
          <div className="bg-slate-800 rounded p-4 border border-slate-600">
            <h4 className="text-slate-300 font-bold mb-3">📊 Resumen del Ajuste de Saldos</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Total Comisiones Aplicadas</div>
                <div className="text-blue-300 font-bold">
                  {datosTabla.reduce((sum, d) => sum + d.comisionDelCorte, 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Saldos Negativos del Corte</div>
                <div className="text-red-300 font-bold">
                  {datosTabla.reduce((sum, d) => sum + d.saldoActual, 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Usuarios Procesados</div>
                <div className="text-cyan-300 font-bold">
                  {datosTabla.length}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Saldo Total a Guardar</div>
                <div className={`font-bold ${
                  datosTabla.reduce((sum, d) => sum + d.saldoParaBD, 0) >= 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {datosTabla.reduce((sum, d) => sum + d.saldoParaBD, 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaldosPendientesPreview;
