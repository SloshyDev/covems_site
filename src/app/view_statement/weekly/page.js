"use client";
import React, { useState, useEffect, useMemo } from "react";
import SelectorCortes from "../../upload_statement/SelectorCortes";
import { getCortesDelMes, filtrarPorCorte } from "../../upload_statement/utilsCortes";
import RecibosPorAgenteCardsSimple from "./RecibosPorAgenteCardsSimple";

 

export default function ViewStatementPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [corteIdx, setCorteIdx] = useState(0);
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);

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

  // Obtener cortes del mes
  const cortes = useMemo(() => getCortesDelMes(year, month), [year, month]);

  // Buscar recibos del API según el corte seleccionado
  useEffect(() => {
    async function fetchRecibos() {
      setLoading(true);
      setError("");
      try {
        // Calcular fechas del corte
        const corte = cortes[corteIdx];
        if (!corte) {
          setRecibos([]);
          setLoading(false);
          return;
        }
        const fechaInicio = new Date(year, month - 1, corte.inicio);
        const fechaFin = new Date(year, month - 1, corte.fin, 23, 59, 59);
        const res = await fetch(`/api/recibo?fechaInicio=${fechaInicio.toISOString()}&fechaFin=${fechaFin.toISOString()}`);
        const json = await res.json();
        if (json.ok && json.recibos) {
          setRecibos(json.recibos);
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
    }
    fetchRecibos();
  }, [year, month, corteIdx, cortes]);

  // Agrupar recibos por usuario (agenteClave) y calcular saldos
  const [saldosPendientes, setSaldosPendientes] = useState({});
  const [saldosLoading, setSaldosLoading] = useState(false);

  const recibosPorAgente = useMemo(() => {
    const map = {};
    for (const recibo of recibos) {
      const clave = recibo.claveAgente || recibo.polizaRef?.agenteClave || "SinClave";
      if (!map[clave]) map[clave] = [];
      map[clave].push([
        clave,
        recibo.poliza,
        recibo.fechaMovimiento ? new Date(recibo.fechaMovimiento).toLocaleDateString() : "",
        recibo.nombreAsegurado || "",
        recibo.dsn || "",
        recibo.anioVig || "",
        recibo.primaFracc || "",
        recibo.pctComisPromotoria || "",
        recibo.comisPromotoria || "",
        recibo.pctComisAgente || "",
        recibo.comisAgente || "",
        recibo.pctComisSupervisor || "",
        recibo.comisSupervisor || "",
        recibo.formaPago || ""
      ]);
    }
    return map;
  }, [recibos]);

  // Obtener saldos pendientes al inicio del corte
  useEffect(() => {
    async function fetchSaldos() {
      setSaldosLoading(true);
      try {
        const fechaInicio = new Date(year, month - 1, cortes[corteIdx]?.inicio || 1);
        const res = await fetch(`/api/saldos-pendientes`);
        const json = await res.json();
        if (!json.saldos) {
          setSaldosPendientes({});
          setSaldosLoading(false);
          return;
        }
        // Buscar el saldo más reciente anterior o igual a la fecha de corte para cada agente (comparando solo año, mes, día)
        function soloFechaLocal(d) {
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        }
        const saldosPorClave = {};
        const fechaInicioSolo = soloFechaLocal(new Date(fechaInicio));
        for (const saldo of json.saldos) {
          const clave = saldo.agente?.clave;
          if (!clave) continue;
          const fechaSaldo = soloFechaLocal(new Date(saldo.fecha));
          if (fechaSaldo <= fechaInicioSolo) {
            if (!saldosPorClave[clave] || fechaSaldo > soloFechaLocal(new Date(saldosPorClave[clave].fecha))) {
              saldosPorClave[clave] = saldo;
            }
          }
        }
        setSaldosPendientes(saldosPorClave);
      } catch (e) {
        setSaldosPendientes({});
      } finally {
        setSaldosLoading(false);
      }
    }
    if (cortes[corteIdx]) fetchSaldos();
  }, [year, month, corteIdx, cortes]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Ver Recibos por Usuario</h1>
      <SelectorCortes
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
        corteIdx={corteIdx}
        setCorteIdx={setCorteIdx}
        cortes={cortes}
      />
      {loading || saldosLoading || usuariosLoading ? (
        <div className="text-gray-200">Cargando recibos, saldos y usuarios...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <RecibosPorAgenteCardsSimple
          recibosJson={Object.values(recibosPorAgente).flat()}
          saldosPendientes={saldosPendientes}
          usuarios={usuarios}
          fechaInicioCorte={cortes[corteIdx]?.inicio ? new Date(year, month - 1, cortes[corteIdx].inicio) : null}
        />
      )}
    </main>
  );
}
