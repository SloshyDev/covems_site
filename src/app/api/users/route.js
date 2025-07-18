import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
// Endpoint para buscar usuario por clave: /api/users?clave=123
// Endpoint para obtener datos específicos: /api/users?clave=123&fields=rfc,banco,cuenta_clabe
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clave = searchParams.get("clave");
  const fields = searchParams.get("fields");
  
  if (clave) {
    try {
      const user = await prisma.user.findUnique({ where: { clave: Number(clave) } });
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      
      // Si se especifican campos específicos, devolver solo esos
      if (fields) {
        const requestedFields = fields.split(',').map(f => f.trim());
        const filteredUser = { clave: user.clave, nombre: user.nombre };
        requestedFields.forEach(field => {
          if (user.hasOwnProperty(field)) {
            filteredUser[field] = user[field];
          }
        });
        return NextResponse.json(filteredUser);
      }
      
      return NextResponse.json(user);
    } catch (error) {
      return NextResponse.json({ error: "Error buscando usuario" }, { status: 500 });
    }
  }
  // Si no hay clave, devolver todos (comportamiento original)
  try {
    const users = await prisma.user.findMany({ orderBy: { clave: "asc" } });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
  }
}


export async function PUT(request) {
  try {
    const data = await request.json();
    const { clave, ...updateData } = data;
    if (!clave) {
      return NextResponse.json(
        { error: "Falta el campo 'clave'" },
        { status: 400 }
      );
    }
    // Convertir fecha_nacimiento a Date si es string tipo 'YYYY-MM-DD'
    if (
      updateData.fecha_nacimiento &&
      typeof updateData.fecha_nacimiento === "string"
    ) {
      // Solo si es formato fecha simple, no ISO
      if (/^\d{4}-\d{2}-\d{2}$/.test(updateData.fecha_nacimiento)) {
        updateData.fecha_nacimiento = new Date(updateData.fecha_nacimiento);
      }
    }
    const updatedUser = await prisma.user.update({
      where: { clave: Number(clave) },
      data: updateData,
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Error actualizando usuario" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    // Validar campos requeridos
    if (!data.clave || !data.nombre || !data.estado || !data.tipo_usuario) {
      return NextResponse.json(
        {
          error:
            "Faltan campos requeridos (clave, nombre, estado, tipo_usuario)",
        },
        { status: 400 }
      );
    }
    // Convertir fecha_nacimiento a Date si es string tipo 'YYYY-MM-DD'
    if (data.fecha_nacimiento && typeof data.fecha_nacimiento === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.fecha_nacimiento)) {
        data.fecha_nacimiento = new Date(data.fecha_nacimiento);
      }
    }
    const newUser = await prisma.user.create({
      data: {
        ...data,
        clave: Number(data.clave),
        supervisor_clave: data.supervisor_clave
          ? Number(data.supervisor_clave)
          : null,
      },
    });
    return NextResponse.json(newUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Error creando usuario" },
      { status: 500 }
    );
  }
}
