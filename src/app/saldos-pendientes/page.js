"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";

const SaldosPendientesPage = () => {
  const [saldos, setSaldos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSaldo, setEditingSaldo] = useState(null);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    saldo: "",
    agenteId: "",
    observaciones: ""
  });

  // Cargar saldos pendientes
  const fetchSaldos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/saldos-pendientes");
      if (!res.ok) throw new Error("Error al cargar saldos pendientes");
      const data = await res.json();
      setSaldos(data.saldos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios (agentes)
  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsuarios(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Guardar saldo (crear o actualizar)
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "/api/saldos-pendientes";
      const method = editingSaldo ? "PUT" : "POST";
      const body = editingSaldo 
        ? { ...formData, id: editingSaldo.id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      await fetchSaldos();
      setShowModal(false);
      setEditingSaldo(null);
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        saldo: "",
        agenteId: "",
        observaciones: ""
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar saldo
  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este saldo pendiente?")) {
      return;
    }

    try {
      const res = await fetch(`/api/saldos-pendientes?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      await fetchSaldos();
    } catch (err) {
      setError(err.message);
    }
  };

  // Abrir modal para editar
  const handleEdit = (saldo) => {
    setEditingSaldo(saldo);
    setFormData({
      fecha: new Date(saldo.fecha).toISOString().split('T')[0],
      saldo: saldo.saldo.toString(),
      agenteId: saldo.agenteId.toString(),
      observaciones: saldo.observaciones || ""
    });
    setShowModal(true);
  };

  // Abrir modal para crear nuevo
  const handleNew = () => {
    setEditingSaldo(null);
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      saldo: "",
      agenteId: "",
      observaciones: ""
    });
    setShowModal(true);
  };

  useEffect(() => {
    fetchSaldos();
    fetchUsuarios();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Header />
      <div className="p-6 px-9 w-full mx-auto pt-24">{/* Añadido pt-24 para dar espacio al header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Gestión de Saldos Pendientes</h1>
          <button
            onClick={handleNew}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Nuevo Saldo
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading && !updatingAll && (
          <div className="text-white text-center">Cargando...</div>
        )}

        {/* Tabla de saldos */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white bg-opacity-20">
                <tr>
                  <th className="px-6 py-3 text-left text-white font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Agente/Supervisor</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Saldo</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Observaciones</th>
                  <th className="px-6 py-3 text-left text-white font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {saldos.map((saldo) => (
                  <tr key={saldo.id} className="border-b border-white border-opacity-20">
                    <td className="px-6 py-4 text-white">
                      {new Date(saldo.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {saldo.agente ? 
                        `${saldo.agente.clave > 1800 ? '[SUPERVISOR] ' : '[AGENTE] '}${saldo.agente.clave} - ${saldo.agente.nombre}` : 
                        'Usuario no encontrado'
                      }
                    </td>
                    <td className="px-6 py-4 text-white">
                      ${saldo.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {saldo.observaciones || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(saldo)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(saldo.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {saldos.length === 0 && !loading && (
              <div className="text-white text-center py-8">
                No hay saldos pendientes registrados
              </div>
            )}
          </div>
        </div>

        {/* Modal para crear/editar saldo */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingSaldo ? "Editar Saldo Pendiente" : "Nuevo Saldo Pendiente"}
              </h2>
              <form onSubmit={handleSave}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Agente/Supervisor
                  </label>
                  <select
                    value={formData.agenteId}
                    onChange={(e) => setFormData({ ...formData, agenteId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar agente/supervisor</option>
                    {usuarios
                      .sort((a, b) => {
                        // Primero supervisores (clave > 1800), luego agentes
                        if (a.clave > 1800 && b.clave <= 1800) return -1;
                        if (a.clave <= 1800 && b.clave > 1800) return 1;
                        return a.clave - b.clave;
                      })
                      .map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.clave > 1800 ? '[SUPERVISOR] ' : '[AGENTE] '}{usuario.clave} - {usuario.nombre}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Saldo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.saldo}
                    onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaldosPendientesPage;
