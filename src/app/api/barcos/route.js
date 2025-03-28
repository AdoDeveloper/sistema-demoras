import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    // Asegurarnos de que page >= 1
    if (page < 1) {
      page = 1;
    }

    const whereClause = search
    ? {
        OR: [
          { muelle: { contains: search } },
          { vaporBarco: { contains: search } },
        ],
      }
    : {};

    const totalCount = await prisma.barco.count({ where: whereClause });

    // skip calculado de forma segura
    const skip = (page - 1) * limit;

    const barcos = await prisma.barco.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      { data: barcos, totalCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error GET /api/barcos:", error);
    return NextResponse.json(
      { error: "Error al obtener barcos" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const tipoCargaJSON = body.tipoCarga ? JSON.stringify(body.tipoCarga) : "[]";
    const sistemaUtilizadoJSON = body.sistemaUtilizado ? JSON.stringify(body.sistemaUtilizado) : "[]";

    const nuevoBarco = await prisma.barco.create({
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

    return NextResponse.json(nuevoBarco, { status: 201 });
  } catch (error) {
    console.error("Error POST /api/barcos:", error);
    return NextResponse.json(
      { error: "Error al crear barco" },
      { status: 500 }
    );
  }
}
