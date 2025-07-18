"use client";  

import React, { useState, useEffect, useCallback, useRef } from "react";
import FilterControls from "./components/FilterControls";
import ResumenCorte from "./components/ResumenCorte";
import StatusMessages from "./components/StatusMessages";
import UsuariosList from "./components/UsuariosList";
import CacheStatus from "./components/CacheStatus";
import { useRecibos, useUsuarios, useSaldosPendientes, useFiltrosFecha } from "./hooks/useViewStatements";
import { procesarDatosCompletos } from "./services/dataProcessor";
import { filtrarRecibosPorCorte } from "./utils/dataUtils";
import { invalidarTodosLosCaches, invalidarCacheRecibos, invalidarCacheSaldosPendientes, diagnosticoCacheCompleto } from "./utils/cacheManager";

const ViewStatementsPage = () => {
  // Estados locales para datos procesados
  const [agentesData, setAgentesData] = useState({});
  const [supervisoresData, setSupervisoresData] = useState({});
  const [supervisoresRecibos, setSupervisoresRecibos] = useState({});
  const [filteredRecibos, setFilteredRecibos] = useState([]);
  
  // Estado para totales calculados desde las tablas
  const [totalesCalculados, setTotalesCalculados] = useState({
    totalPrima: 0,
    totalComision: 0,
    cantidadUsuarios: 0
  });
  
  // Estado para indicador de caché
  const [cacheInfo, setCacheInfo] = useState({
    recibosDesdeCache: false,
    usuariosDesdeCache: false,
    saldosDesdeCache: false
  });
  
  // Estado para controlar si ya se cargaron los datos iniciales
  const [datosInicializado, setDatosInicializado] = useState(false);
  
  // Ref para verificar si el componente está montado
  const isMountedRef = useRef(false);
  
  // Efecto para marcar el componente como montado y cargar funciones globales
  useEffect(() => {
    isMountedRef.current = true;
    
    // Hacer funciones de caché disponibles globalmente
    if (typeof window !== 'undefined') {
      // Importar funciones dinámicamente para debug
      import('./utils/cacheManager').then(module => {
        window.invalidarTodosLosCaches = module.invalidarTodosLosCaches;
        window.diagnosticoCacheCompleto = module.diagnosticoCacheCompleto;
        window.debugTodosLosCaches = module.debugTodosLosCaches;
        window.obtenerInfoAlmacenamiento = module.obtenerInfoAlmacenamiento;
      });
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  


  // Hooks personalizados
  const { recibos, loading, error, fetchRecibos } = useRecibos();
  const { usuarios, clavesActivos, clavesCancelados, fetchClavesPorEstado } = useUsuarios();
  const { 
    saldosPendientes, 
    fetchSaldosPendientes
  } = useSaldosPendientes();
  const {
    selectedCorte,
    setSelectedCorte,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    cortes,
    yearOptions
  } = useFiltrosFecha();

  // Filtrar recibos por corte cuando cambian los parámetros
  useEffect(() => {
    const corte = cortes[selectedCorte];
    const filtered = filtrarRecibosPorCorte(recibos, corte, selectedYear, selectedMonth);
    setFilteredRecibos(filtered);
  }, [recibos, selectedCorte, selectedMonth, selectedYear, cortes]);

  // Procesar datos cuando cambian las dependencias
  useEffect(() => {
    const corte = cortes[selectedCorte];
    const resultado = procesarDatosCompletos(
      recibos,
      usuarios,
      saldosPendientes,
      corte,
      selectedYear,
      selectedMonth
    );

    setAgentesData(resultado.agentesData);
    setSupervisoresData(resultado.supervisoresData);
    setSupervisoresRecibos(resultado.supervisoresRecibos);
    
    // Resetear totales calculados cuando cambien los datos
    setTotalesCalculados({
      totalPrima: 0,
      totalComision: 0,
      cantidadUsuarios: 0
    });
  }, [recibos, usuarios, saldosPendientes, selectedCorte, selectedMonth, selectedYear, cortes]);

  // Cargar datos al montar el componente (solo una vez)
  useEffect(() => {
    if (!datosInicializado) {
      const cargarDatosIniciales = async () => {
        console.log('🔄 Cargando datos iniciales...');
        try {
          // Primero cargar usuarios para pre-llenar cache
          console.log('1️⃣ Cargando usuarios...');
          await fetchClavesPorEstado();
          
          // Luego cargar el resto de datos en paralelo
          console.log('2️⃣ Cargando recibos y saldos...');
          await Promise.all([
            fetchRecibos(),
            fetchSaldosPendientes()
          ]);
          
          setDatosInicializado(true);
          console.log('✅ Datos iniciales cargados completamente');
        } catch (error) {
          console.error('❌ Error cargando datos iniciales:', error);
        }
      };
      
      cargarDatosIniciales();
    }
  }, [datosInicializado, fetchRecibos, fetchClavesPorEstado, fetchSaldosPendientes]);

  // Obtener cortes y fechas seleccionadas
  const corte = cortes[selectedCorte] || {};
  // Construir fechas completas para el corte seleccionado
  let fechaInicio = "";
  let fechaFin = "";
  if (corte.inicio && corte.fin && selectedYear && selectedMonth) {
    // selectedMonth es 1-12, Date espera 0-11
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const safeInicio = Math.min(corte.inicio, lastDay);
    const safeFin = Math.min(corte.fin, lastDay);
    const inicioDate = new Date(selectedYear, selectedMonth - 1, safeInicio);
    const finDate = new Date(selectedYear, selectedMonth - 1, safeFin);
    // Formato YYYY-MM-DD
    const pad = n => n.toString().padStart(2, '0');
    fechaInicio = `${inicioDate.getFullYear()}-${pad(inicioDate.getMonth() + 1)}-${pad(inicioDate.getDate())}`;
    fechaFin = `${finDate.getFullYear()}-${pad(finDate.getMonth() + 1)}-${pad(finDate.getDate())}`;
  }

  // Función para recibir totales calculados desde las listas
  const handleTotalesCalculados = useCallback((totales) => {
    // Solo actualizar si el componente está montado
    if (!isMountedRef.current) {
      console.log('⚠️ Ignorando actualización de totales: componente no montado');
      return;
    }
    
    setTotalesCalculados({
      totalPrima: totales.totalPrima || 0,
      totalComision: totales.totalComision || 0,
      cantidadUsuarios: totales.cantidadUsuarios || 0
    });
  }, []);

  // Función separada para actualizar datos manualmente (botón "Actualizar")
  const handleActualizarDatos = useCallback(async () => {
    console.log('🔄 Actualizando TODOS los cachés manualmente (forzando refresh)...');
    try {
      // Actualizar todos los cachés en paralelo
      await Promise.all([
        fetchRecibos(true),           // Recibos con forceRefresh = true
        fetchClavesPorEstado(true),   // Usuarios con forceRefresh = true
        fetchSaldosPendientes(true)   // Saldos pendientes con forceRefresh = true
      ]);
      
      console.log('✅ Todos los cachés actualizados exitosamente desde API');
      
      // Opcional: Mostrar indicadores de que los datos se cargaron desde API
      setCacheInfo({
        recibosDesdeCache: false,
        usuariosDesdeCache: false,
        saldosDesdeCache: false
      });
      
      // Después de un breve momento, restablecer los indicadores
      setTimeout(() => {
        setCacheInfo({
          recibosDesdeCache: true,
          usuariosDesdeCache: true,
          saldosDesdeCache: true
        });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error actualizando cachés:', error);
    }
  }, [fetchRecibos, fetchClavesPorEstado, fetchSaldosPendientes]);

  return (
    <div className="p-6 px-9 w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Estados de Cuenta por Agente</h1>
      </div>
      
      {/* Indicador de estado del caché */}
      <div className="mb-4 flex gap-4 text-sm">
        <div className={`px-3 py-1 rounded ${cacheInfo.recibosDesdeCache ? 'bg-green-800 text-green-200' : 'bg-blue-800 text-blue-200'}`}>
          📄 Recibos: {cacheInfo.recibosDesdeCache ? '💾 Caché' : '🌐 API'}
        </div>
        <div className={`px-3 py-1 rounded ${cacheInfo.usuariosDesdeCache ? 'bg-green-800 text-green-200' : 'bg-blue-800 text-blue-200'}`}>
          👥 Usuarios: {cacheInfo.usuariosDesdeCache ? '💾 Caché' : '🌐 API'}
        </div>
        <div className={`px-3 py-1 rounded ${cacheInfo.saldosDesdeCache ? 'bg-green-800 text-green-200' : 'bg-blue-800 text-blue-200'}`}>
          💰 Saldos: {cacheInfo.saldosDesdeCache ? '💾 Caché' : '🌐 API'}
        </div>
      </div>

      {/* Estado detallado del caché */}
      <CacheStatus />
      
      {/* Controles de filtrado */}
      <FilterControls
        yearOptions={yearOptions}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedCorte={selectedCorte}
        setSelectedCorte={setSelectedCorte}
        cortes={cortes}
        fetchRecibos={handleActualizarDatos}
      />
      
      {/* Estados de carga y error */}
      <StatusMessages
        loading={loading}
        error={error}
        agentesData={agentesData}
        filteredRecibos={filteredRecibos}
      />
      
      {/* Resumen general */}
      {(Object.keys(agentesData).length > 0 || Object.keys(supervisoresRecibos).length > 0) && (
        <ResumenCorte 
          agentesData={agentesData} 
          supervisoresRecibos={supervisoresRecibos}
          filteredRecibos={filteredRecibos} 
          totalesCalculados={totalesCalculados}
        />
      )}
      
      {/* Listado unificado de usuarios */}
      {isMountedRef.current && (
        <UsuariosList
          agentesData={agentesData}
          supervisoresRecibos={supervisoresRecibos}
          usuarios={usuarios}
          clavesActivos={clavesActivos}
          clavesCancelados={clavesCancelados}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onTotalesCalculados={handleTotalesCalculados}
        />
      )}
    </div>
  );
};

export default ViewStatementsPage;
