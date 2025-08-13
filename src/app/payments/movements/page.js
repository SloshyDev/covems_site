"use client"
import React, { useState, useEffect } from "react";

export default function MovimientosPage() {
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
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                movimiento.estatus === 'Completado' 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-yellow-600 text-white'
                                            }`}>
                                                {movimiento.estatus}
                                            </span>
                                            {movimiento.estatus === 'Pendiente' && (
                                                <button
                                                    className="ml-2 bg-green-700 text-white px-2 py-1 rounded text-xs hover:bg-green-800 transition"
                                                    onClick={() => updateEstatus(movimiento.id)}
                                                >
                                                    Marcar como Completado
                                                </button>
                                            )}
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
