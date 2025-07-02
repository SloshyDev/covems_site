"use client";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import React, { useState } from "react";
import FormInput from "../../../components/FormInput";

export default function PolizaFormModal({ solicitud, onClose, onSuccess }) {
  const [form, setForm] = useState({
    poliza: "",
    asegurado: solicitud.asegurado,
    agenteClave: solicitud.agenteClave,
    fechaRecibida: "",
    solicitudId: solicitud.id,
    primaFraccionada: "",
    primaAnual: "",
    formaPago: solicitud.formaPago,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/poliza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al subir póliza");
      }
      setSuccess("Póliza subida correctamente");
      if (onSuccess) onSuccess();
      setTimeout(onClose, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      transition
      className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-closed:opacity-0"
    >
      <DialogPanel className="relative bg-gray-900 rounded-2xl p-8 w-full max-w-xl border border-cyan-800 shadow-2xl text-left align-middle">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-cyan-400 text-2xl hover:text-cyan-200 transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>
        <DialogTitle
          as="h2"
          className="text-2xl font-bold text-cyan-300 mb-4 text-center"
        >
          Agregar Póliza
        </DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="No. de Póliza"
            name="poliza"
            value={form.poliza}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Asegurado"
            name="asegurado"
            value={form.asegurado}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Clave de Agente"
            name="agenteClave"
            value={form.agenteClave}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Fecha Recibida"
            name="fechaRecibida"
            type="date"
            value={form.fechaRecibida}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Prima Fraccionada"
            name="primaFraccionada"
            value={form.primaFraccionada}
            onChange={handleChange}
          />
          <FormInput
            label="Prima Anual"
            name="primaAnual"
            value={form.primaAnual}
            onChange={handleChange}
          />
          <FormInput
            label="Forma de Pago"
            name="formaPago"
            value={form.formaPago}
            onChange={handleChange}
            required
          />
          {error && (
            <div className="text-red-400 font-bold text-center">{error}</div>
          )}
          {success && (
            <div className="text-green-400 font-bold text-center">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-700 to-cyan-500 hover:from-cyan-800 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-xl mt-2 disabled:opacity-60"
          >
            {loading ? "Subiendo..." : "Guardar Póliza"}
          </button>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
