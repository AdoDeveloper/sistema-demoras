import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

// GET: Listar equipos con inspecciones, con paginación
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
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
    const totalCount = await prisma.equipo.count();
    const skip = (page - 1) * limit;

    const equipos = await prisma.equipo.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        inspecciones: true, // Incluye las inspecciones asociadas
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: equipos, totalCount }, { status: 200 });
  } catch (err) {
    console.error("Error al listar equipos:", err);
    return NextResponse.json({ error: "Error al listar equipos" }, { status: 500 });
  }
}

// POST: Crear un nuevo registro de Equipo y sus inspecciones
export async function POST(request) {
  try {
    // Obtener la sesión (token) del usuario autenticado
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }

    const body = await request.json();
    console.log(">>> [API Debug] BODY RECIBIDO:", body);

    // Se espera que el body tenga: equipo, operador, fecha, horaDe, horaA, recomendaciones y un array de inspecciones
    const { equipo, operador, fecha, hora, horaDe, horaA, recomendaciones, inspecciones } = body;
    if (!equipo || !operador || !fecha || !hora) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Ejecutar operaciones en una transacción
    const createdEquipo = await prisma.$transaction(async (tx) => {
      // Crear el registro principal en Equipo, usando datos del usuario (sesión)
      const newEquipo = await tx.equipo.create({
        data: {
          userId: session.id ? parseInt(session.id, 10) : null,
          userName: session.username || "",
          equipo,          // Nombre o identificador del equipo
          operador,        // Nombre del operador
          fecha,           // Fecha de la inspección
          hora,            // Hora de inicio inspección
          horaDe,          // Hora de inicio
          horaA,           // Hora de finalización
          recomendaciones, // Recomendaciones (opcional)
        },
      });
      console.log(">>> [API Debug] Equipo creado con ID:", newEquipo.id);

      // Crear cada una de las inspecciones asociadas
      if (Array.isArray(inspecciones) && inspecciones.length > 0) {
        for (const item of inspecciones) {
          await tx.inspeccion.create({
            data: {
              titulo: item.titulo,
              // Se espera que 'cumple' tenga un valor booleano (true, false o null)
              cumple: item.cumple,
              observaciones: item.observaciones,
              equipoId: newEquipo.id, // Relaciona la inspección con el Equipo creado
            },
          });
        }
      }
      return newEquipo;
    });

    return NextResponse.json({ ok: true, id: createdEquipo.id }, { status: 201 });
  } catch (err) {
    console.error("Error al guardar equipos:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Registro duplicado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al guardar equipos" }, { status: 500 });
  }
}
