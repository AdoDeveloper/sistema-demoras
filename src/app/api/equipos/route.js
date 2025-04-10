import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

// GET: Listar equipos con inspecciones (almacenadas en el campo JSON), con paginación
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";

  // Asegurarse de que la página sea >= 1
  const currentPage = page < 1 ? 1 : page;

  // Permitir filtrar por nombre del equipo, operador, fecha, etc.
  const whereClause = search
    ? {
        OR: [
          { equipo: { contains: search } },
          { operador: { contains: search } },
          { fecha: { contains: search } },
          { hora: { contains: search } },
          { horaDe: { contains: search } },
          { horaA: { contains: search } },
          { recomendaciones: { contains: search } },
        ],
      }
    : {};

  try {
    const totalCount = await prisma.equipo.count({ where: whereClause });
    const skip = (currentPage - 1) * limit;

    const equipos = await prisma.equipo.findMany({
      where: whereClause,
      skip,
      take: limit,
      // El campo inspecciones ya forma parte del modelo Equipo
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: equipos, totalCount }, { status: 200 });
  } catch (err) {
    console.error("Error al listar equipos:", err);
    return NextResponse.json({ error: "Error al listar equipos" }, { status: 500 });
  }
}

// POST: Crear un nuevo registro de Equipo con sus inspecciones en el campo JSON
export async function POST(request) {
  try {
    // Obtener la sesión (token) del usuario autenticado
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }

    const body = await request.json();
    console.log(">>> [API Debug] BODY RECIBIDO:", body);

    // Se espera que el body tenga: equipo, operador, fecha, hora, horaDe, horaA, recomendaciones y un array de inspecciones
    const { equipo, horometro, operador, fecha, hora, horaDe, horaA, recomendaciones, inspecciones } = body;
    if (!equipo || !operador || !fecha || !hora) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Crear el registro en la tabla Equipo, almacenando el arreglo de inspecciones en el campo JSON
    const createdEquipo = await prisma.equipo.create({
      data: {
        userId: session.id ? parseInt(session.id, 10) : null,
        userName: session.username || "",
        equipo,          // Nombre o identificador del equipo
        horometro,
        operador,        // Nombre del operador
        fecha,           // Fecha de la inspección
        hora,            // Hora de inicio de la inspección
        horaDe,          // Hora de inicio
        horaA,           // Hora de finalización
        recomendaciones, // Recomendaciones (opcional)
        // Se almacena directamente el array recibido, en caso de que no sea un array se guarda un arreglo vacío
        inspecciones: Array.isArray(inspecciones) ? inspecciones : []
      },
    });

    console.log(">>> [API Debug] Equipo creado con ID:", createdEquipo.id);

    return NextResponse.json({ ok: true, id: createdEquipo.id }, { status: 201 });
  } catch (err) {
    console.error("Error al guardar equipos:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Registro duplicado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al guardar equipos" }, { status: 500 });
  }
}