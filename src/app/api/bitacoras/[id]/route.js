import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

// GET: Obtiene una bitácora por su id, incluyendo el barco asociado y sus operaciones.
export async function GET(request, { params }) {
  try {
    const { id } = await params; // params ya es un objeto con la propiedad id
    const bitacoraId = parseInt(id, 10);
    const bitacora = await prisma.bitacora.findUnique({
      where: { id: bitacoraId },
      include: {
        barco: true,
        operaciones: true,
      },
    });
    if (!bitacora) {
      return NextResponse.json(
        { error: "Bitácora no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(bitacora, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/bitacoras/[id]:", error);
    return NextResponse.json(
      { error: "Error al obtener bitácora" },
      { status: 500 }
    );
  }
}
