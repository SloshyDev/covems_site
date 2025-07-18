// Endpoint deshabilitado - funcionalidad removida
import { NextResponse } from 'next/server';

export async function POST(request) {
  return NextResponse.json(
    { error: 'Funcionalidad de procesamiento automático de saldos deshabilitada' },
    { status: 404 }
  );
}
