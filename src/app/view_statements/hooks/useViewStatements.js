import { useState, useEffect, useMemo, useCallback } from "react";
import { getCortesDelMes } from "../../upload_statement/utilsCortes";
import { preLlenarCacheDatosBancarios } from "../utils/userDataService";

// Hook para manejar datos de recibos con caché en localStorage
export const useRecibos = () => {
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const CACHE_KEY = 'covems_recibos_cache';
  const CACHE_TIMESTAMP_KEY = 'covems_recibos_timestamp';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos para recibos

  // Función para cargar datos del localStorage
  const loadFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && timestamp) {
        const now = new Date().getTime();
        const cacheTime = parseInt(timestamp);
        
        // Verificar si el caché no ha expirado
        if (now - cacheTime < CACHE_DURATION) {
          const data = JSON.parse(cachedData);
          setRecibos(data.recibos || []);
          console.log('✅ Recibos cargados desde localStorage');
          return true; // Datos cargados desde caché
        }
      }
    } catch (err) {
      console.error('Error cargando caché de recibos:', err);
    }
    return false; // No se pudieron cargar desde caché
  }, []);

  // Función para guardar datos en localStorage
  const saveToCache = useCallback((data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
      console.log('💾 Recibos guardados en localStorage');
    } catch (err) {
      console.error('Error guardando caché de recibos:', err);
    }
  }, []);

  const fetchRecibos = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError("");
    
    // Si no es refresh forzado, intentar cargar desde caché primero
    if (!forceRefresh && loadFromCache()) {
      setLoading(false);
      return; // Datos cargados desde caché, no hacer llamada al API
    }

    console.log('🌐 Cargando recibos desde API...');
    try {
      const res = await fetch("/api/recibo");
      if (!res.ok) throw new Error("Error al cargar recibos");
      const data = await res.json();
      
      // Guardar en localStorage
      saveToCache(data);
      
      setRecibos(data.recibos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  return { recibos, setRecibos, loading, error, fetchRecibos };
};

// Hook para manejar usuarios con caché en localStorage
export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [clavesActivos, setClavesActivos] = useState([]);
  const [clavesCancelados, setClavesCancelados] = useState([]);

  const CACHE_KEY = 'covems_usuarios_cache';
  const CACHE_TIMESTAMP_KEY = 'covems_usuarios_timestamp';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos

  // Función para cargar datos del localStorage
  const loadFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && timestamp) {
        const now = new Date().getTime();
        const cacheTime = parseInt(timestamp);
        
        // Verificar si el caché no ha expirado
        if (now - cacheTime < CACHE_DURATION) {
          const data = JSON.parse(cachedData);
          setUsuarios(data || []);
          
          const activos = [];
          const cancelados = [];
          (data || []).forEach(u => {
            if (u.estado === "activo") activos.push(u.clave);
            else if (u.estado === "cancelado") cancelados.push(u.clave);
          });
          setClavesActivos(activos);
          setClavesCancelados(cancelados);
          
          // Pre-llenar cache de datos bancarios
          preLlenarCacheDatosBancarios(data);
          
          console.log('✅ Usuarios cargados desde localStorage');
          return true; // Datos cargados desde caché
        }
      }
    } catch (err) {
      console.error('Error cargando caché de usuarios:', err);
    }
    return false; // No se pudieron cargar desde caché
  }, []);

  // Función para guardar datos en localStorage
  const saveToCache = useCallback((data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
      console.log('💾 Usuarios guardados en localStorage');
    } catch (err) {
      console.error('Error guardando caché de usuarios:', err);
    }
  }, []);

  const fetchClavesPorEstado = useCallback(async (forceRefresh = false) => {
    // Si no es refresh forzado, intentar cargar desde caché primero
    if (!forceRefresh && loadFromCache()) {
      return; // Datos cargados desde caché, no hacer llamada al API
    }

    console.log('🌐 Cargando usuarios desde API...');
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      
      // Guardar en localStorage
      saveToCache(data);
      
      setUsuarios(data || []);
      const activos = [];
      const cancelados = [];
      (data || []).forEach(u => {
        if (u.estado === "activo") activos.push(u.clave);
        else if (u.estado === "cancelado") cancelados.push(u.clave);
      });
      setClavesActivos(activos);
      setClavesCancelados(cancelados);
      
      // Pre-llenar cache de datos bancarios
      preLlenarCacheDatosBancarios(data);
    } catch (err) {
      setClavesActivos([]);
      setClavesCancelados([]);
      setUsuarios([]);
    }
  }, [loadFromCache, saveToCache]);

  return { 
    usuarios, 
    clavesActivos, 
    clavesCancelados, 
    fetchClavesPorEstado,
    loadFromCache,
    saveToCache
  };
};

// Hook simplificado para manejar saldos pendientes (solo lectura)
export const useSaldosPendientes = () => {
  const [saldosPendientes, setSaldosPendientes] = useState([]);

  const fetchSaldosPendientes = useCallback(async (forceRefresh = false) => {
    try {
      // Usar el servicio unificado solo para obtener datos
      const { obtenerSaldosPendientes } = await import('../utils/saldosPendientesService');
      const saldos = await obtenerSaldosPendientes(forceRefresh);
      setSaldosPendientes(saldos);
    } catch (err) {
      console.error("Error cargando saldos pendientes:", err);
      setSaldosPendientes([]);
    }
  }, []);

  return { 
    saldosPendientes, 
    fetchSaldosPendientes
  };
};

// Hook para manejar filtros de fecha
export const useFiltrosFecha = () => {
  const [selectedCorte, setSelectedCorte] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const cortes = useMemo(() => getCortesDelMes(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const yearOptions = [];
  for (let y = 2023; y <= new Date().getFullYear(); y++) {
    yearOptions.push(y);
  }

  return {
    selectedCorte,
    setSelectedCorte,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    cortes,
    yearOptions
  };
};
