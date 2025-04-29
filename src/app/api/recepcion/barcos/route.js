import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";
import { Prisma } from "@prisma/client";

export async function GET(request) {
  // Obtener la sesión (token) del usuario autenticado
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }

  // Extraer parámetros de consulta: página, límite y término de búsqueda
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";
  const currentPage = page < 1 ? 1 : page;

  // Se define un filtro base si es necesario; por ejemplo, podrías aplicar condiciones específicas para roles.
  // En este caso se usa un objeto vacío para no restringir la consulta.
  const roleFilter = {};

  // Filtro de búsqueda sobre campos relevantes de BarcoRecepcion
  const searchFilter = search
    ? {
        OR: [
          { vaporBarco: { contains: search } },
          { observaciones: { contains: search } },
        ],
      }
    : {};

  // Combinar los filtros para formar la cláusula WHERE final
  const whereClause = { ...roleFilter, ...searchFilter };

  try {
    if (session.roleId === 6) {
      // Si el rol es 6, devolver todos los registros sin paginación ni límites
      const barcoRecepciones = await prisma.barcoRecepcion.findMany({
        where: whereClause,
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(
        { data: barcoRecepciones, totalCount: barcoRecepciones.length },
        { status: 200 }
      );
    } else {
      // Para otros roles, aplicar paginación
      const totalCount = await prisma.barcoRecepcion.count({ where: whereClause });
      const skip = (currentPage - 1) * limit;

      const barcoRecepciones = await prisma.barcoRecepcion.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ data: barcoRecepciones, totalCount }, { status: 200 });
    }
  } catch (err) {
    console.error("Error al listar BarcoRecepcion:", err);
    return NextResponse.json({ error: "Error al listar BarcoRecepcion" }, { status: 500 });
  }
}


export async function POST(request) {
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para crear registros en BarcoRecepcion" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { vaporBarco, observaciones, productos, puntosDescarga, transportes } = body;

    // Validaciones básicas
    if (
      !vaporBarco ||
      !Array.isArray(productos) ||
      !Array.isArray(puntosDescarga) ||
      !Array.isArray(transportes)
    ) {
      return NextResponse.json(
        {
          error:
            "Debe proporcionarse 'vaporBarco' y los arrays 'productos', 'puntosDescarga' y 'transportes'",
        },
        { status: 400 }
      );
    }

    // Validar puntosDescarga únicos
    const uniquePoints = new Set(puntosDescarga);
    if (uniquePoints.size !== puntosDescarga.length) {
      return NextResponse.json(
        { error: "Los puntos de descarga deben ser únicos" },
        { status: 400 }
      );
    }

    // Validar transportes: cada objeto debe tener id y nombre
    // y los nombres DEBEN ser únicos
    const names = transportes.map((t) => t.nombre);
    if (names.some((n) => !n || typeof n !== "string")) {
      return NextResponse.json(
        { error: "Cada transporte debe tener un 'nombre' válido" },
        { status: 400 }
      );
    }
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      return NextResponse.json(
        { error: "Los nombres de las empresas de transporte deben ser únicos" },
        { status: 400 }
      );
    }

    // Opcional: verificar que existen en la tabla EmpresaTransporte
    for (const { id, nombre } of transportes) {
      if (typeof id !== "number") {
        return NextResponse.json(
          { error: `El transporte "${nombre}" debe incluir un 'id' numérico` },
          { status: 400 }
        );
      }
      const exists = await prisma.empresaTransporte.findUnique({
        where: { id },
      });
      if (!exists) {
        return NextResponse.json(
          { error: `No existe empresa de transporte con id ${id}` },
          { status: 404 }
        );
      }
      if (exists.nombre !== nombre) {
        return NextResponse.json(
          {
            error: `El nombre provisto ("${nombre}") no coincide con la empresa id ${id} ("${exists.nombre}")`,
          },
          { status: 400 }
        );
      }
    }

    // Crear BarcoRecepcion
    const newBarco = await prisma.barcoRecepcion.create({
      data: {
        vaporBarco,
        observaciones,
        productos,
        puntosDescarga,
        transportes, // guardamos el JSON tal cual
      },
    });

    return NextResponse.json(newBarco, { status: 201 });
  } catch (error) {
    console.error("Error creating BarcoRecepcion:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Error: duplicidad en algún campo único" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error creating BarcoRecepcion" },
      { status: 500 }
    );
  }
}