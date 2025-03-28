import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// GET: Obtiene las bitácoras con paginación y permite filtrar por nombre del muellero o fecha.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    // Asegurarse de que la página sea >= 1
    if (page < 1) {
      page = 1;
    }

    // Se permite filtrar por nombre del muellero o por fecha
    const whereClause = search
      ? {
          OR: [
            { nombreMuellero: { contains: search } },
            { fecha: { contains: search } },
            { fechaInicio: { contains: search } },
            { turnoInicio: { contains: search } },
            { turnoFin: { contains: search } },
            { observaciones: { contains: search } },
            { barco: { vaporBarco: { contains: search } } },
            { barco: { muelle: { contains: search } } },
          ],
        }
      : {};

    const totalCount = await prisma.bitacora.count({ where: whereClause });
    const skip = (page - 1) * limit;

    const bitacoras = await prisma.bitacora.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      include: {
        // Se incluye el barco asociado y las operaciones de la bitácora
        barco: true,
        operaciones: true,
      },
    });

    return NextResponse.json({ data: bitacoras, totalCount }, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/bitacoras:", error);
    return NextResponse.json(
      { error: "Error al obtener bitácoras" },
      { status: 500 }
    );
  }
}

// POST: Crea una nueva bitácora, la asocia a un barco y crea de forma anidada las operaciones.
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fechaInicio,
      fecha,
      fechaCierre,
      nombreMuellero,
      turnoInicio,
      turnoFin,
      observaciones,
      barcoId,
      operaciones,
    } = body;

    // Validación: se debe enviar el id del barco (siempre se asocia la bitácora a un barco)
    if (!barcoId) {
      return NextResponse.json(
        { error: "El barco es obligatorio" },
        { status: 400 }
      );
    }

    // Validación: se debe agregar al menos una operación
    if (!operaciones || operaciones.length === 0) {
      return NextResponse.json(
        { error: "Debe haber al menos una operación" },
        { status: 400 }
      );
    }

    const nuevaBitacora = await prisma.bitacora.create({
      data: {
        fechaInicio: fechaInicio || "",
        fecha: fecha || "",
        fechaCierre: fechaCierre || "",
        nombreMuellero: nombreMuellero || "",
        turnoInicio: turnoInicio || "",
        turnoFin: turnoFin || "",
        observaciones: observaciones || "",
        // Se asocia la bitácora al barco mediante su id
        barco: {
          connect: { id: barcoId },
        },
        // Se crean de forma anidada las operaciones
        operaciones: {
          create: operaciones,
        },
      },
      include: {
        operaciones: true,
        barco: true,
      },
    });

    return NextResponse.json(nuevaBitacora, { status: 201 });
  } catch (error) {
    console.error("Error POST /api/bitacoras:", error);
    return NextResponse.json(
      { error: "Error al crear bitácora" },
      { status: 500 }
    );
  }
}
