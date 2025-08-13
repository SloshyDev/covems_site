import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');

		const whereClause = userId ? { userId: parseInt(userId) } : {};

		const movimientos = await prisma.movimiento.findMany({
			where: whereClause,
			orderBy: {
				fecha: 'desc'
			},
			include: {
				user: {
					select: {
						nombre: true,
						clave: true
					}
				}
			}
		});

		return NextResponse.json(movimientos);
	} catch (error) {
		console.error('Error al obtener movimientos:', error);
		return NextResponse.json(
			{ error: 'Error al obtener movimientos' },
			{ status: 500 }
		);
	}
}

export async function POST(request) {
	try {
		const data = await request.json();
		
		// Guardar fecha como ISO-8601 completo (YYYY-MM-DDT00:00:00)
		let fechaISO = '';
		if (typeof data.fecha === 'string') {
			// Si ya viene con hora, usarla; si no, agregar T00:00:00Z
			if (data.fecha.length === 10) {
				fechaISO = `${data.fecha}T00:00:00Z`;
			} else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(data.fecha)) {
				fechaISO = `${data.fecha}Z`;
			} else {
				fechaISO = data.fecha;
			}
		}
		const movimiento = await prisma.movimiento.create({
			data: {
				empresa: data.empresa,
				fecha: fechaISO,
				concepto: data.concepto,
				subconcepto: data.subconcepto || null,
				tipoMovimiento: data.tipo,
				importe: parseFloat(data.importe),
				banco: data.banco,
				tipo: data.tipo,
				tipoComprobancion: data.tipoComprobancion,
				estatus: data.estatus,
				userId: data.userId || null
			}
		});

		return NextResponse.json(movimiento, { status: 201 });
	} catch (error) {
		console.error('Error al crear movimiento:', error);
		return NextResponse.json(
			{ error: 'Error al crear movimiento' },
			{ status: 500 }
		);
	}
}

export async function PUT(request) {
	try {
		const data = await request.json();
		const { id, ...updateData } = data;

		// Solo incluir los campos que realmente vienen en updateData
		const prismaData = {};
		if (updateData.empresa !== undefined) prismaData.empresa = updateData.empresa;
		if (updateData.fecha !== undefined) {
			if (typeof updateData.fecha === 'string') {
				prismaData.fecha = updateData.fecha.length === 10 ? `${updateData.fecha}T00:00:00` : updateData.fecha;
			}
		}
		if (updateData.concepto !== undefined) prismaData.concepto = updateData.concepto;
		if (updateData.subconcepto !== undefined) prismaData.subconcepto = updateData.subconcepto || null;
		if (updateData.tipo !== undefined) prismaData.tipoMovimiento = updateData.tipo;
		if (updateData.importe !== undefined) prismaData.importe = parseFloat(updateData.importe);
		if (updateData.banco !== undefined) prismaData.banco = updateData.banco;
		if (updateData.tipo !== undefined) prismaData.tipo = updateData.tipo;
		if (updateData.tipoComprobancion !== undefined) prismaData.tipoComprobancion = updateData.tipoComprobancion;
		if (updateData.estatus !== undefined) prismaData.estatus = updateData.estatus;
		if (updateData.userId !== undefined) prismaData.userId = updateData.userId || null;

		const movimiento = await prisma.movimiento.update({
			where: { id: parseInt(id) },
			data: prismaData
		});

		return NextResponse.json(movimiento);
	} catch (error) {
		console.error('Error al actualizar movimiento:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar movimiento' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json(
				{ error: 'ID requerido' },
				{ status: 400 }
			);
		}

		await prisma.movimiento.delete({
			where: { id: parseInt(id) }
		});

		return NextResponse.json({ message: 'Movimiento eliminado' });
	} catch (error) {
		console.error('Error al eliminar movimiento:', error);
		return NextResponse.json(
			{ error: 'Error al eliminar movimiento' },
			{ status: 500 }
		);
	}
}
