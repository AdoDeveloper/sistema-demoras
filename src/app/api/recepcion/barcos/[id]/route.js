import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

// GET: Consulta los detalles de un registro de barcoRecepcion por ID
export async function GET(request, { params }) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para acceder a este endpoint" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const barco = await prisma.barcoRecepcion.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!barco) {
      return NextResponse.json({ error: "Barco no encontrado" }, { status: 404 });
    }
    return NextResponse.json(barco, { status: 200 });
  } catch (error) {
    console.error("Error fetching barcoRecepcion:", error);
    return NextResponse.json(
      { error: "Error fetching barcoRecepcion" },
      { status: 500 }
    );
  }
}

// PUT: Actualiza un registro de barcoRecepcion
export async function PUT(request, { params }) {
  // 1) Autorización
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para actualizar este registro" },
      { status: 403 }
    );
  }

  // 2) Extraer y convertir ID
  const { id } = await params;
  const barcoId = parseInt(id, 10);

  // 3) Leer body
  const body = await request.json();
  const { vaporBarco, observaciones } = body;

  // 4) Arrays: si no vienen, quedan null
  const productos      = Array.isArray(body.productos)      ? (body.productos.length      ? body.productos      : null) : null;
  const puntosDescarga = Array.isArray(body.puntosDescarga) ? (body.puntosDescarga.length ? body.puntosDescarga : null) : null;
  const transportes    = Array.isArray(body.transportes)    ? (body.transportes.length    ? body.transportes    : null) : null;

  // 5) Validar existencia previa
  const existingBarco = await prisma.barcoRecepcion.findUnique({
    where: { id: barcoId },
  });
  if (!existingBarco) {
    return NextResponse.json({ error: "Barco no encontrado" }, { status: 404 });
  }

  // 6) Hacer update
  try {
    const updatedBarco = await prisma.barcoRecepcion.update({
      where: { id: barcoId },
      data: {
        vaporBarco,
        observaciones,
        productos,
        puntosDescarga,
        transportes,
      },
    });
    return NextResponse.json(updatedBarco, { status: 200 });
  } catch (error) {
    console.error("Error updating barcoRecepcion:", error);
    return NextResponse.json(
      { error: "Error updating barcoRecepcion" },
      { status: 500 }
    );
  }
}

// DELETE: Elimina un registro de barcoRecepcion
export async function DELETE(request, { params }) {
  // 1) Autorización
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para eliminar este registro" },
      { status: 403 }
    );
  }

  // 2) Extraer ID
  const { id } = await params;
  const barcoId = parseInt(id, 10);

  // 3) Comprobar traslados asociados
  const count = await prisma.recepcionTraslado.count({
    where: { barcoId },
  });
  if (count > 0) {
    return NextResponse.json(
      { error: "No puedes eliminar un barco con recepciones/traslados asociados" },
      { status: 400 }
    );
  }

  // 4) Borrar
  try {
    const deleted = await prisma.barcoRecepcion.delete({
      where: { id: barcoId },
    });
    return NextResponse.json(deleted, { status: 200 });
  } catch (error) {
    console.error("Error deleting barcoRecepcion:", error);
    return NextResponse.json(
      { error: "Error deleting barcoRecepcion" },
      { status: 500 }
    );
  }
}