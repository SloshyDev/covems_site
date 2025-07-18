import React from 'react';

const ProgressBar = ({ progress }) => {
  if (!progress) return null;

  const {
    totalRecibos = 0,
    totalLotes = 0,
    loteActual = 0,
    recibosProcesados = 0,
    porcentaje = 0,
    estado = 'iniciando',
    tiempoTranscurrido = 0,
    estimacionTiempoRestante = null,
    resultado = null,
    error = null,
    mensaje = null
  } = progress;

  const formatearTiempo = (ms) => {
    if (!ms) return '--';
    const segundos = Math.round(ms / 1000);
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}m ${segs}s`;
  };

  const getEstadoColor = () => {
    switch (estado) {
      case 'completado': return 'text-green-400';
      case 'completado_con_errores': return 'text-yellow-400';
      case 'error': 
      case 'error_critico': return 'text-red-400';
      case 'procesando_saldos': return 'text-purple-400';
      case 'reintentando': return 'text-orange-400';
      default: return 'text-blue-400';
    }
  };

  const getEstadoTexto = () => {
    switch (estado) {
      case 'iniciando': return '🚀 Iniciando carga...';
      case 'procesando': return `📤 Procesando lote ${loteActual}/${totalLotes}`;
      case 'reintentando': return `🔄 Reintentando lote ${loteActual}...`;
      case 'procesando_saldos': return '⚖️ Procesando saldos pendientes...';
      case 'completado': return '✅ ¡Carga completada exitosamente!';
      case 'completado_con_errores': return '⚠️ Carga completada con algunos errores';
      case 'error': return '❌ Error en el lote actual';
      case 'error_critico': return '💥 Error crítico en la carga';
      default: return 'Procesando...';
    }
  };

  const mostrarEstadisticas = resultado && (estado === 'completado' || estado === 'completado_con_errores');

  return (
    <div className="bg-gray-900 absolute top-20 rounded-xl p-6 border border-gray-700 mt-4">
      <div className="space-y-4">
        {/* Título y estado */}
        <div className="flex items-center justify-between">
          <h3 className="text-cyan-300 font-bold text-lg">
            Carga de Recibos - Progreso
          </h3>
          <span className={`font-semibold ${getEstadoColor()}`}>
            {getEstadoTexto()}
          </span>
        </div>

        {/* Mensaje adicional */}
        {mensaje && (
          <div className="text-gray-300 text-sm bg-gray-800 rounded p-2">
            {mensaje}
          </div>
        )}

        {/* Barra de progreso principal */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-300">
            <span>Progreso General</span>
            <span>{porcentaje}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                estado === 'completado' ? 'bg-green-500' :
                estado === 'completado_con_errores' ? 'bg-yellow-500' :
                estado === 'error' || estado === 'error_critico' ? 'bg-red-500' :
                estado === 'procesando_saldos' ? 'bg-purple-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.max(porcentaje, 0)}%` }}
            />
          </div>
        </div>

        {/* Información detallada */}
        {totalRecibos > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-gray-400">Recibos</div>
              <div className="text-cyan-300 font-bold">
                {recibosProcesados} / {totalRecibos}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-gray-400">Lotes</div>
              <div className="text-cyan-300 font-bold">
                {loteActual} / {totalLotes}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-gray-400">Tiempo</div>
              <div className="text-cyan-300 font-bold">
                {formatearTiempo(tiempoTranscurrido)}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-gray-400">Tiempo Restante</div>
              <div className="text-cyan-300 font-bold">
                {estimacionTiempoRestante ? formatearTiempo(estimacionTiempoRestante) : '--'}
              </div>
            </div>
          </div>
        )}

        {/* Error actual */}
        {error && estado !== 'completado' && estado !== 'completado_con_errores' && (
          <div className="bg-red-900/20 border border-red-700 rounded p-3">
            <div className="text-red-300 font-bold">Error:</div>
            <div className="text-red-200 text-sm">{error}</div>
          </div>
        )}

        {/* Estadísticas finales */}
        {mostrarEstadisticas && (
          <div className="border-t border-gray-700 pt-4 space-y-3">
            <h4 className="text-gray-300 font-bold">📊 Estadísticas de Carga</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-green-900/20 border border-green-700 rounded p-2">
                <div className="text-green-300 font-bold">Exitosos</div>
                <div className="text-green-200">{resultado.estadisticas?.recibosExitosos || 0}</div>
              </div>
              <div className="bg-red-900/20 border border-red-700 rounded p-2">
                <div className="text-red-300 font-bold">Fallidos</div>
                <div className="text-red-200">{resultado.estadisticas?.recibosFallidos || 0}</div>
              </div>
              <div className="bg-blue-900/20 border border-blue-700 rounded p-2">
                <div className="text-blue-300 font-bold">Tasa Éxito</div>
                <div className="text-blue-200">{resultado.estadisticas?.tasaExito || 0}%</div>
              </div>
              <div className="bg-purple-900/20 border border-purple-700 rounded p-2">
                <div className="text-purple-300 font-bold">Velocidad</div>
                <div className="text-purple-200">{resultado.velocidadPromedio || 0} rec/s</div>
              </div>
            </div>

            {/* Errores por lote */}
            {resultado.errores && resultado.errores.length > 0 && (
              <div className="bg-red-900/10 border border-red-800 rounded p-3">
                <div className="text-red-300 font-bold mb-2">Errores por Lote:</div>
                <div className="space-y-1 text-sm">
                  {resultado.errores.map((errorLote, idx) => (
                    <div key={idx} className="text-red-200">
                      Lote {errorLote.lote} ({errorLote.recibos} recibos): {errorLote.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información sobre saldos procesados */}
            {resultado.procesamientoSaldos && (
              <div className={`border rounded p-3 ${
                resultado.procesamientoSaldos.realizado && resultado.procesamientoSaldos.ok
                  ? 'bg-green-900/10 border-green-800'
                  : 'bg-yellow-900/10 border-yellow-800'
              }`}>
                <div className="font-bold mb-1">
                  {resultado.procesamientoSaldos.realizado && resultado.procesamientoSaldos.ok
                    ? '✅ Saldos Pendientes Procesados'
                    : '⚠️ Procesamiento de Saldos'
                  }
                </div>
                <div className="text-sm text-gray-300">
                  {resultado.procesamientoSaldos.realizado && resultado.procesamientoSaldos.ok
                    ? `Total procesados: ${resultado.procesamientoSaldos.totalProcesados || 0}, Creados: ${resultado.procesamientoSaldos.saldosCreados || 0}, Actualizados: ${resultado.procesamientoSaldos.saldosActualizados || 0}`
                    : `Error: ${resultado.procesamientoSaldos.error || 'No realizado'}`
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
