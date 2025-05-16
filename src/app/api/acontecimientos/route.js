import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

// GET: Listar acontecimientos con paginación y búsqueda
export async function GET(request) {
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";
  const currentPage = page < 1 ? 1 : page;

  const roleFilter =
    session.roleId === 1 || session.roleId === 8
      ? {}
      : { userId: parseInt(session.id, 10) };

  // Quitamos 'mode' porque no es válido
  const searchFilter = search
    ? {
        OR: [
          { fecha: { contains: search } },
          { turno: { contains: search } },
          { condicion: { contains: search } },
        ],
      }
    : {};

  const whereClause = { ...roleFilter, ...searchFilter };

  try {
    const totalCount = await prisma.acontecimiento.count({ where: whereClause });
    const skip = (currentPage - 1) * limit;

    const data = await prisma.acontecimiento.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data, totalCount }, { status: 200 });
  } catch (err) {
    console.error("Error al listar acontecimientos:", err);
    return NextResponse.json({ error: "Error al listar acontecimientos" }, { status: 500 });
  }
}

// POST: Crear un nuevo Acontecimiento
export async function POST(request) {
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      fecha,
      turno,
      condicion,
      puntosDescarga,
      operadores,
      enlonadores,
      equipos,
      basculas,
      acontecimientos,
    } = body;

    if (!fecha) {
      return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 });
    }

    const pD = Array.isArray(puntosDescarga) && puntosDescarga.length > 0
        ? puntosDescarga
        : ["NO APLICA"];

    const created = await prisma.acontecimiento.create({
      data: {
        userId:           Number(session.id),
        userName:         String(session.username),
        fecha,
        turno:            turno ?? null,
        condicion:        condicion ?? null,
        puntosDescarga:   pD,
        operadores:       Number(operadores),
        enlonadores:      Number(enlonadores),
        equipos:          Number(equipos),
        basculas:         Array.isArray(basculas) ? basculas : [],
        acontecimientos:  Array.isArray(acontecimientos) ? acontecimientos : [],
      },
    });

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (err) {
    console.error("Error al crear acontecimiento:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Registro duplicado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al guardar acontecimiento" }, { status: 500 });
  }
}