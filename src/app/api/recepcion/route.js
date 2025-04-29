import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../lib/prisma";

const SECRET = process.env.NEXTAUTH_SECRET;

export async function GET(request) {
  const session = await getToken({ req: request, secret: SECRET });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    if (page < 1) page = 1;
    const skip = (page - 1) * limit;

    // Filtro de texto (sin mode)
    const searchFilter = search
      ? {
          OR: [
            { nombreBarco: { contains: search } },
            { producto: { contains: search } },
          ],
        }
      : {};

    // Si no es admin (roleId !== 1), sólo propios
    const ownerFilter =
      session.roleId === 1
        ? {}
        : { userId: Number(session.id) };

    const where = {
      ...ownerFilter,
      ...searchFilter,
    };

    // totalCount con count()
    const totalCount = await prisma.recepcionTraslado.count({ where });
    const data = await prisma.recepcionTraslado.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data, totalCount }, { status: 200 });
  } catch (err) {
    console.error("Error en GET /api/recepcion:", err);
    return NextResponse.json(
      { error: "Error al obtener recepciones y traslados" },
      { status: 500 }
    );
  }
}

// POST /api/recepcion
export async function POST(request) {
  try {
    // validar sesión
    const session = await getToken({ req: request, secret: SECRET });
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }
    console.log(">>> [API Debug] userId:", session.id);
    console.log(">>> [API Debug] userName:", session.username);

    const body = await request.json();

    const nuevo = await prisma.recepcionTraslado.create({
      data: {
        barcoId:       body.barcoId,
        userId:        Number(session.id),
        userName:      String(session.username),
        fecha:         body.fecha,
        hora:          body.hora,
        producto:      body.producto,
        nombreBarco:   body.nombreBarco,
        chequero:      String(session.nombreCompleto),
        turnoInicio:   body.turnoInicio || null,
        turnoFin:      body.turnoFin    || null,
        puntoCarga:    body.puntoCarga  || null,
        puntoDescarga: body.puntoDescarga || null,
        bitacoras:     body.bitacoras  || [],
      },
    });

    return NextResponse.json(nuevo, { status: 201 });
  } catch (err) {
    console.error("Error en POST /api/recepcion:", err);
    return NextResponse.json(
      { error: "Error al crear recepción/traslado" },
      { status: 500 }
    );
  }
}
