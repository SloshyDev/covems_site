import React from "react";

const FilterControls = ({ yearOptions, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, selectedCorte, setSelectedCorte, cortes, fetchRecibos }) => {
  
  // Función para limpiar todo el caché
  const limpiarCache = () => {
    try {
      // Usar la función global unificada si está disponible
      if (window.invalidarTodosLosCaches) {
        window.invalidarTodosLosCaches();
        console.log('🗑️ Todos los cachés limpiados (usando función unificada)');
        alert('Todos los cachés limpiados exitosamente');
      } else {
        // Fallback para limpiar cachés manualmente
        localStorage.removeItem('covems_usuarios_cache');
        localStorage.removeItem('covems_usuarios_timestamp');
        localStorage.removeItem('covems_recibos_cache');
        localStorage.removeItem('covems_recibos_timestamp');
        localStorage.removeItem('covems_saldos_pendientes_cache');
        localStorage.removeItem('covems_saldos_pendientes_timestamp');
        console.log('🗑️ Cachés limpiados (fallback manual)');
        alert('Cachés limpiados exitosamente');
      }
    } catch (err) {
      console.error('Error limpiando caché:', err);
      alert('Error al limpiar caché');
    }
  };

  return (
    <div className="flex gap-4 mb-6 flex-wrap items-center">
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
      <button
        onClick={fetchRecibos}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
        title="Actualizar todos los cachés (usuarios, recibos, saldos pendientes)"
      >
        🔄 Actualizar Todo
      </button>
      <button
        onClick={limpiarCache}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
        title="Limpiar todos los cachés (usuarios, recibos, saldos pendientes)"
      >
        🗑️ Limpiar Todo
      </button>
    </div>
  );
};

export default FilterControls;
