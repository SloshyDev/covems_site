"use client"
import React, { useState, useEffect } from "react";
import MovimientosPrintCheckbox from "./MovimientosPrintCheckbox";
import { printMovimientosPDF } from "./MovimientosPrintCheckbox";

export default function MovimientosPage() {
    const [selectedToPrint, setSelectedToPrint] = useState([]);

    const handlePrintCheckbox = (id) => {
        setSelectedToPrint(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const handlePrintSelected = () => {
        const movimientosSeleccionados = movimientos.filter(mov => selectedToPrint.includes(mov.id));
        if (movimientosSeleccionados.length === 0) return;
        printMovimientosPDF(movimientosSeleccionados);
    };
    const updateEstatus = async (id) => {
        try {
            const response = await fetch(`/api/movimientos?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, estatus: 'Completado' })
            });
            if (response.ok) {
                setMovimientos(movimientos.map(mov => mov.id === id ? { ...mov, estatus: 'Completado' } : mov));
            } else {
                setError('Error al actualizar estatus');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error al actualizar estatus');
        }
    };
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMovimientos();
    }, []);

    const fetchMovimientos = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/movimientos');
            
            if (response.ok) {
                const data = await response.json();
                setMovimientos(data);
            } else {
                setError('Error al cargar movimientos');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error al cargar movimientos');
        } finally {
            setLoading(false);
        }
    };

    const deleteMovimiento = async (id) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
            return;
        }

        try {
            const response = await fetch(`/api/movimientos?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMovimientos(movimientos.filter(mov => mov.id !== id));
            } else {
                setError('Error al eliminar movimiento');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error al eliminar movimiento');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-MX');
    };

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen  text-white p-8 flex items-center justify-center">
                <div className="text-xl">Cargando movimientos...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen mx-auto text-white p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Movimientos Guardados</h1>
                    <button
                        onClick={fetchMovimientos}
                        className="bg-blue-600 ml-4 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                        Actualizar
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {movimientos.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                        No hay movimientos guardados
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-900 rounded-lg shadow">
                            <thead>
                                <tr className="bg-blue-800 text-white">
                                    <th className="py-3 px-4 text-left">Imprimir</th>
                                    <th className="py-3 px-4 text-left">ID</th>
                                    <th className="py-3 px-4 text-left">Empresa</th>
                                    <th className="py-3 px-4 text-left">Fecha</th>
                                    <th className="py-3 px-4 text-left">Concepto</th>
                                    <th className="py-3 px-4 text-left">Tipo</th>
                                    <th className="py-3 px-4 text-left">Importe</th>
                                    <th className="py-3 px-4 text-left">Banco</th>
                                    <th className="py-3 px-4 text-left">Estatus</th>
                                    <th className="py-3 px-4 text-left">Fecha Creación</th>
                                    <th className="py-3 px-4 text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimientos.map((movimiento, idx) => (
                                    <tr key={movimiento.id} className={idx % 2 === 0 ? "bg-gray-800" : "bg-gray-900"}>
                                        <td className="py-2 px-4 text-center">
                                            <MovimientosPrintCheckbox
                                                checked={selectedToPrint.includes(movimiento.id)}
                                                onChange={() => handlePrintCheckbox(movimiento.id)}
                                            />
                                        </td>
                                        <td className="py-2 px-4 text-white">{movimiento.id}</td>
                                        <td className="py-2 px-4 text-white">{movimiento.empresa}</td>
                                        <td className="py-2 px-4 text-white">{formatDate(movimiento.fecha)}</td>
                                        <td className="py-2 px-4 text-white">
                                            {movimiento.concepto}
                                            {movimiento.subconcepto && (
                                                <div className="text-xs text-gray-300 mt-1">
                                                    {movimiento.subconcepto}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 text-white">{movimiento.tipoMovimiento}</td>
                                        <td className="py-2 px-4 text-white">
                                            <span className={movimiento.tipoMovimiento === 'Ingreso' ? 'text-green-400' : 'text-red-400'}>
                                                {formatCurrency(movimiento.importe)}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4 text-white">{movimiento.banco}</td>
                                        <td className="py-2 px-4 text-white">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    movimiento.estatus === 'Completado' 
                                                        ? 'bg-green-100 text-green-800 border border-green-300' 
                                                        : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                                }`}>
                                                    {movimiento.estatus === 'Completado' && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Completado
                                                        </span>
                                                    )}
                                                    {movimiento.estatus === 'Pendiente' && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </span>
                                                {movimiento.estatus === 'Pendiente' && (
                                                    <button
                                                        className="px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-200 flex items-center gap-1 cursor-pointer"
                                                        onClick={() => updateEstatus(movimiento.id)}
                                                        title="Marcar como Completado"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Completar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 text-white text-sm">
                                            {formatDate(movimiento.createdAt)}
                                        </td>
                                        <td className="py-2 px-4">
                                            <button
                                                onClick={() => deleteMovimiento(movimiento.id)}
                                                className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-6 p-4 bg-gray-800 rounded">
                            <button
                                className="mb-4 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
                                onClick={handlePrintSelected}
                                disabled={selectedToPrint.length === 0}
                            >
                                Imprimir seleccionados en PDF
                            </button>
                            <h3 className="text-lg font-semibold mb-2">Resumen:</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="text-gray-400">Total registros:</span>
                                    <span className="ml-2 font-bold">{movimientos.length}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Total ingresos:</span>
                                    <span className="ml-2 font-bold text-green-400">
                                        {formatCurrency(
                                            movimientos
                                                .filter(m => m.tipoMovimiento === 'Ingreso')
                                                .reduce((sum, m) => sum + parseFloat(m.importe), 0)
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Total egresos:</span>
                                    <span className="ml-2 font-bold text-red-400">
                                        {formatCurrency(
                                            movimientos
                                                .filter(m => m.tipoMovimiento === 'Egreso')
                                                .reduce((sum, m) => sum + parseFloat(m.importe), 0)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
