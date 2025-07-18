import React, { useState, useEffect } from 'react';

const CacheStatus = () => {
  const [cacheStats, setCacheStats] = useState({
    recibos: { hasCache: false, timestamp: null },
    usuarios: { hasCache: false, timestamp: null },
    saldosPendientes: { hasCache: false, timestamp: null }
  });

  const checkCacheStatus = () => {
    const stats = {
      recibos: {
        hasCache: !!localStorage.getItem('covems_recibos_cache'),
        timestamp: localStorage.getItem('covems_recibos_timestamp')
      },
      usuarios: {
        hasCache: !!localStorage.getItem('covems_usuarios_cache'),
        timestamp: localStorage.getItem('covems_usuarios_timestamp')
      },
      saldosPendientes: {
        hasCache: !!localStorage.getItem('covems_saldos_pendientes_cache'),
        timestamp: localStorage.getItem('covems_saldos_pendientes_timestamp')
      }
    };
    setCacheStats(stats);
  };

  useEffect(() => {
    checkCacheStatus();
    
    // Verificar cada 5 segundos
    const interval = setInterval(checkCacheStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(parseInt(timestamp));
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date().getTime();
    const then = parseInt(timestamp);
    const diffMinutes = Math.floor((now - then) / (1000 * 60));
    
    if (diffMinutes < 1) return 'hace menos de 1 min';
    if (diffMinutes === 1) return 'hace 1 min';
    return `hace ${diffMinutes} min`;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        💾 Estado del Caché localStorage
        <button 
          onClick={checkCacheStatus}
          className="ml-auto text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          🔄 Actualizar
        </button>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cache de Recibos */}
        <div className={`p-3 rounded border ${
          cacheStats.recibos.hasCache 
            ? 'border-green-600 bg-green-900/20' 
            : 'border-red-600 bg-red-900/20'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-white">📄 Recibos</span>
            <span className={`text-xs px-2 py-1 rounded ${
              cacheStats.recibos.hasCache 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {cacheStats.recibos.hasCache ? 'ACTIVO' : 'VACÍO'}
            </span>
          </div>
          {cacheStats.recibos.hasCache && (
            <div className="text-xs text-gray-300">
              <div>Actualizado: {formatTimestamp(cacheStats.recibos.timestamp)}</div>
              <div className="text-gray-400">{getTimeAgo(cacheStats.recibos.timestamp)}</div>
            </div>
          )}
        </div>

        {/* Cache de Usuarios */}
        <div className={`p-3 rounded border ${
          cacheStats.usuarios.hasCache 
            ? 'border-green-600 bg-green-900/20' 
            : 'border-red-600 bg-red-900/20'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-white">👥 Usuarios</span>
            <span className={`text-xs px-2 py-1 rounded ${
              cacheStats.usuarios.hasCache 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {cacheStats.usuarios.hasCache ? 'ACTIVO' : 'VACÍO'}
            </span>
          </div>
          {cacheStats.usuarios.hasCache && (
            <div className="text-xs text-gray-300">
              <div>Actualizado: {formatTimestamp(cacheStats.usuarios.timestamp)}</div>
              <div className="text-gray-400">{getTimeAgo(cacheStats.usuarios.timestamp)}</div>
            </div>
          )}
        </div>

        {/* Cache de Saldos Pendientes */}
        <div className={`p-3 rounded border ${
          cacheStats.saldosPendientes.hasCache 
            ? 'border-green-600 bg-green-900/20' 
            : 'border-red-600 bg-red-900/20'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-white">💰 Saldos</span>
            <span className={`text-xs px-2 py-1 rounded ${
              cacheStats.saldosPendientes.hasCache 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {cacheStats.saldosPendientes.hasCache ? 'ACTIVO' : 'VACÍO'}
            </span>
          </div>
          {cacheStats.saldosPendientes.hasCache && (
            <div className="text-xs text-gray-300">
              <div>Actualizado: {formatTimestamp(cacheStats.saldosPendientes.timestamp)}</div>
              <div className="text-gray-400">{getTimeAgo(cacheStats.saldosPendientes.timestamp)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
        <span>ℹ️ El caché expira automáticamente después de 30 minutos</span>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.debugServicioSaldos) {
                window.debugServicioSaldos();
              } else {
                console.log('Función debug de saldos no disponible');
              }
            }}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
          >
            🔍 Debug Saldos
          </button>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.debugUserCache) {
                window.debugUserCache();
              } else {
                console.log('Función debug de usuarios no disponible');
              }
            }}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
          >
            🔍 Debug Usuarios
          </button>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.diagnosticoCacheCompleto) {
                window.diagnosticoCacheCompleto();
              } else {
                console.log('Función diagnóstico no disponible');
              }
            }}
            className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-xs"
          >
            🔬 Diagnóstico
          </button>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.invalidarTodosLosCaches) {
                const resultado = window.invalidarTodosLosCaches();
                if (resultado) {
                  alert('✅ Todos los cachés han sido invalidados');
                  // Recargar el estado del caché
                  setTimeout(() => checkCacheStatus(), 100);
                } else {
                  alert('❌ Error al invalidar cachés');
                }
              } else {
                console.log('Función invalidar cachés no disponible');
              }
            }}
            className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
          >
            🗑️ Limpiar Todo
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheStatus;
