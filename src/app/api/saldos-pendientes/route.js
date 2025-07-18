import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const saldos = await prisma.saldoPendiente.findMany({
      include: {
        agente: {
          select: {
            id: true,
            clave: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
    return NextResponse.json({ saldos });
  } catch (error) {
    return NextResponse.json({ saldos: [], error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fecha, saldo, agenteId, observaciones } = body;

    // Validaciones
    if (!fecha || saldo === undefined || saldo === null || !agenteId) {
      return NextResponse.json(
        { error: 'Fecha, saldo y agente son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el agente existe
    const agente = await prisma.user.findUnique({
      where: { id: parseInt(agenteId) },
    });

    if (!agente) {
      return NextResponse.json(
        { error: 'El agente especificado no existe' },
        { status: 404 }
      );
    }

    const nuevoSaldo = await prisma.saldoPendiente.create({
      data: {
        fecha: new Date(fecha),
        saldo: parseFloat(saldo),
        agenteId: parseInt(agenteId),
        observaciones,
      },
      include: {
        agente: {
          select: {
            id: true,
            clave: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({ saldo: nuevoSaldo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, fecha, saldo, agenteId, observaciones } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del saldo es requerido' },
        { status: 400 }
      );
    }

    const saldoActualizado = await prisma.saldoPendiente.update({
      where: { id: parseInt(id) },
      data: {
        ...(fecha && { fecha: new Date(fecha) }),
        ...(saldo !== undefined && { saldo: parseFloat(saldo) }),
        ...(agenteId && { agenteId: parseInt(agenteId) }),
        ...(observaciones !== undefined && { observaciones }),
      },
      include: {
        agente: {
          select: {
            id: true,
            clave: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({ saldo: saldoActualizado });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
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
        { error: 'ID del saldo es requerido' },
        { status: 400 }
      );
    }

    await prisma.saldoPendiente.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Saldo eliminado correctamente' });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
