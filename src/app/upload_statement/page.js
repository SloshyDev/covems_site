"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCortesDelMes } from "../upload_statement/utilsCortes";

import { readEstadosExcel, printEstadosJson } from "./utilsEstadosCuenta";

import { actualizarSaldosPendientes } from "./utils/saldos";
import { insertarRecibos } from "./utils/recibos";

import RecibosPorAgenteCards from "./RecibosPorAgenteCards";
import SelectorCortes from "./SelectorCortes";




export default function CargarEstadosPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [corteIdx, setCorteIdx] = useState(0);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [saldosPendientes, setSaldosPendientes] = useState([]);
  const [recibosPorAgente, setRecibosPorAgente] = useState({});
  const [recibosPorSupervisor, setRecibosPorSupervisor] = useState({});
  // Llama al API de saldos pendientes y filtra por fecha de corte
  useEffect(() => {
    const fetchSaldos = async () => {
      try {
        const res = await fetch("/api/saldos-pendientes");
        const json = await res.json();
        if (json.saldos) {
          setSaldosPendientes(json.saldos);
        }
      } catch (e) {
        // No mostrar error al usuario, solo log
        console.error("Error obteniendo saldos pendientes", e);
      }
    };
    fetchSaldos();
  }, [year, month, corteIdx]);
  const cortes = getCortesDelMes(year, month);

  const onFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    readEstadosExcel(file, setData, setError);
  }, []);

  // Filtra usando SIEMPRE la columna 'Fecha movimiento' (índice 3)
  const filtered = useMemo(() => {
    if (!data.length || !cortes[corteIdx]) return [];
    
    return data.filter(row => {
      const fechaStr = (row[3] || "").toString().trim().replace(/-/g, '/').replace(/\s+/g, '');
      const parts = fechaStr.split('/');
      let d;
      if (parts.length === 3) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        d = new Date(fechaStr);
      }
      if (isNaN(d.getTime())) return false;
      return (
        d.getFullYear() === year &&
        d.getMonth() + 1 === month &&
        d.getDate() >= cortes[corteIdx].inicio && d.getDate() <= cortes[corteIdx].fin
      );
    });
  }, [data, cortes, corteIdx, year, month]);

  // Buscar saldo pendiente para el corte actual y mapear por clave
  const saldosPendientesPorClave = useMemo(() => {
    const result = {};
    if (saldosPendientes.length && cortes[corteIdx]) {
      const corte = cortes[corteIdx];
      saldosPendientes.forEach(s => {
        const fecha = new Date(s.fecha);
        if (
          fecha.getFullYear() === year &&
          fecha.getMonth() + 1 === month &&
          fecha.getDate() >= corte.inicio && fecha.getDate() <= corte.fin
        ) {
          if (s.agente?.clave) {
            result[s.agente.clave] = s.saldo;
          }
        }
      });
    }
    return result;
  }, [saldosPendientes, cortes, corteIdx, year, month]);

  // Mostrar el JSON en consola solo cuando cambien los datos filtrados
  useEffect(() => {
    printEstadosJson(filtered);
  }, [filtered]);

  // Función combinada para insertar recibos y actualizar saldos
  const handleProcesarDatos = useCallback(async () => {
    try {
      if (!filtered || filtered.length === 0) {
        alert('No hay datos de recibos para procesar. Asegúrate de cargar un archivo Excel y seleccionar un corte con datos.');
        return;
      }
      
      const confirmacion = confirm(`¿Estás seguro de que quieres procesar ${filtered.length} recibos?\n\nEsto hará:\n1. Insertar todos los recibos en la base de datos\n2. Actualizar los saldos pendientes\n\nEsta acción no se puede deshacer.`);
      if (!confirmacion) {
        return;
      }

      // PASO 1: Insertar recibos en la base de datos
      console.log('PASO 1: Insertando recibos en la base de datos...');
      const resultadoInsercion = await insertarRecibos(filtered);
      
      console.log('Resultado de inserción:', resultadoInsercion);
      
      if (resultadoInsercion.insertados === 0) {
        alert('No se pudo insertar ningún recibo. No se actualizarán los saldos.');
        return;
      }

      // PASO 1.5: Refrescar saldos pendientes después de insertar recibos
      console.log('PASO 1.5: Refrescando saldos pendientes...');
      let saldosActualizadosData = [];
      try {
        const res = await fetch("/api/saldos-pendientes");
        const json = await res.json();
        if (json.saldos) {
          saldosActualizadosData = json.saldos;
          setSaldosPendientes(json.saldos); // También actualizar el estado
        }
      } catch (e) {
        console.error("Error refrescando saldos pendientes", e);
        saldosActualizadosData = saldosPendientes; // Usar los existentes si falla
      }

      // Recalcular saldosPendientesPorClave con los datos recién obtenidos
      const saldosActualizados = {};
      if (saldosActualizadosData.length && cortes[corteIdx]) {
        const corte = cortes[corteIdx];
        saldosActualizadosData.forEach(s => {
          const fecha = new Date(s.fecha);
          if (
            fecha.getFullYear() === year &&
            fecha.getMonth() + 1 === month &&
            fecha.getDate() >= corte.inicio && fecha.getDate() <= corte.fin
          ) {
            if (s.agente?.clave) {
              saldosActualizados[s.agente.clave] = s.saldo;
            }
          }
        });
      }

      // PASO 2: Actualizar saldos pendientes
      console.log('PASO 2: Actualizando saldos pendientes...');
      console.log('saldosActualizados para usar:', saldosActualizados);
      console.log('Datos para actualizarSaldosPendientes:', {
        year, 
        month, 
        corteIdx, 
        cortes: cortes[corteIdx], 
        filteredCount: filtered.length,
        saldosActualizados
      });
      
      const resultadoSaldos = await actualizarSaldosPendientes(
        year, 
        month, 
        corteIdx, 
        cortes, 
        filtered,
        saldosActualizados // Usar los saldos recién obtenidos
      );

      console.log('Resultado de actualización de saldos:', resultadoSaldos);

      // Mostrar resumen completo con manejo especial para cuando no hay saldos a actualizar
      const mensajeSaldos = resultadoSaldos.registrados === 0 
        ? `📝 ${resultadoSaldos.mensaje || 'No hay saldos negativos para actualizar'}`
        : `✅ Registros creados: ${resultadoSaldos.registrados}`;

      alert(`✅ Procesamiento completado exitosamente!\n\n📊 RESUMEN:\n\n🔹 RECIBOS:\n  • Total procesados: ${resultadoInsercion.procesados}\n  • Insertados: ${resultadoInsercion.insertados}\n  • Fallos: ${resultadoInsercion.fallos}\n  • Errores: ${resultadoInsercion.errores}\n\n🔹 SALDOS PENDIENTES:\n  • ${mensajeSaldos}`);
      
    } catch (error) {
      alert(`❌ Error durante el procesamiento:\n\n${error.message}`);
    }
  }, [year, month, corteIdx, cortes, filtered, saldosPendientes]);

  // Callback para manejar actualizaciones de datos sin causar re-renders
  const handleDataUpdate = useCallback((agentes, supervisores) => {
    setRecibosPorAgente(agentes);
    setRecibosPorSupervisor(supervisores);
  }, []);

  return (
    <main className="mx-4 p-6">
      <h1 className="text-2xl font-bold mb-6">Cargar estados de cuenta</h1>
      <section className="mb-6">
        <label className="font-medium block mb-2">
          Selecciona archivo Excel:
          <input type="file" accept=".xlsx,.xls" onChange={onFileChange} className="block mt-2" />
        </label>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </section>
      <div className="mb-6">
        <button
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-700 to-green-700 hover:from-blue-800 hover:to-green-800 text-white font-bold shadow-lg transition-all duration-300 transform hover:scale-105"
          onClick={handleProcesarDatos}
          disabled={!filtered || filtered.length === 0}
        >
          🚀 Procesar Datos
        </button>
        <p className="text-sm text-gray-300 mt-2">
          Inserta recibos en BD y actualiza saldos pendientes automáticamente
        </p>
      </div>
      <SelectorCortes
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
        corteIdx={corteIdx}
        setCorteIdx={setCorteIdx}
        cortes={cortes}
      />
      <RecibosPorAgenteCards 
        recibosJson={filtered} 
        saldosPendientesPorClave={saldosPendientesPorClave}
        onDataUpdate={handleDataUpdate}
      />
      {filtered.length === 0 && data.length > 0 && (
        <div className="text-gray-500 mt-6">No hay registros para el corte seleccionado.</div>
      )}
    </main>
  );
}
