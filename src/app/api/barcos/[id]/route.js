import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function GET(request, { params }) {
    try {
      // Await params and extract the correct 'id' property
      const { id } = await params;
      const barcoId = parseInt(id, 10);
      const barco = await prisma.barco.findUnique({
        where: { id: barcoId },
      });
      if (!barco) {
        return NextResponse.json(
          { error: "Barco no encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json(barco, { status: 200 });
    } catch (error) {
      console.error("Error GET /api/barcos/[id]:", error);
      return NextResponse.json(
        { error: "Error al obtener barco" },
        { status: 500 }
      );
    }
  }

export async function PUT(request, { params }) {
    try {
      // Await the params before using it
      const { id } = await params;
      const barcoId = parseInt(id, 10);
      const body = await request.json();
  
      const tipoCargaJSON = body.tipoCarga ? JSON.stringify(body.tipoCarga) : "[]";
      const sistemaUtilizadoJSON = body.sistemaUtilizado ? JSON.stringify(body.sistemaUtilizado) : "[]";
  
      const barcoActualizado = await prisma.barco.update({
        where: { id: barcoId },
        data: {
          muelle: body.muelle || "",
          vaporBarco: body.vaporBarco || "",
          fechaArribo: body.fechaArribo || "",
          horaArribo: body.horaArribo || "",
          fechaAtraque: body.fechaAtraque || "",
          horaAtraque: body.horaAtraque || "",
          fechaRecibido: body.fechaRecibido || "",
          horaRecibido: body.horaRecibido || "",
          fechaInicioOperaciones: body.fechaInicioOperaciones || "",
          horaInicioOperaciones: body.horaInicioOperaciones || "",
          fechaFinOperaciones: body.fechaFinOperaciones || "",
          horaFinOperaciones: body.horaFinOperaciones || "",
          tipoCarga: tipoCargaJSON,
          sistemaUtilizado: sistemaUtilizadoJSON,
        },
      });
      return NextResponse.json(barcoActualizado, { status: 200 });
    } catch (error) {
      console.error("Error PUT /api/barcos/[id]:", error);
      return NextResponse.json(
        { error: "Error al actualizar barco" },
        { status: 500 }
      );
    }
  }
  

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const barcoId = parseInt(id, 10);
    await prisma.barco.delete({
      where: { id: barcoId },
    });
    return NextResponse.json({ message: "Barco eliminado" }, { status: 200 });
  } catch (error) {
    console.error("Error DELETE /api/barcos/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar barco" },
      { status: 500 }
    );
  }
}
