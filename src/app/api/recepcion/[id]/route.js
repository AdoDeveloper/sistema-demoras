// File: /app/api/recepcion/[id]/route.js

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "../../../../../lib/prisma";

export async function GET(request, { params }) {
  try {

    // Verificación de token y rol
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
          return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }
    const roleId = token?.user?.roleId || token?.roleId;
    if (Number(roleId) !== 1) {
        console.log("No autorizado para editar recepcion o traslado")
         return NextResponse.json({ error: "No autorizado para editar recepcion o traslado" }, { status: 403 });
    }

    // Extraer y convertir el parámetro 'id'
    const { id } = await params;
    const recepcionId = parseInt(id, 10);

    // Buscar la recepción única
    const recepcion = await prisma.recepcionTraslado.findUnique({
      where: { id: recepcionId },
    });

    if (!recepcion) {
      return NextResponse.json(
        { error: "Recepción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: recepcion }, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/recepcion/[id]:", error);
    return NextResponse.json(
      { error: "Error al obtener recepción" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {

    // Verificación de token y rol
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
          return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }
    const roleId = token?.user?.roleId || token?.roleId;
    if (Number(roleId) !== 1) {
        console.log("No autorizado para editar recepcion o traslado")
         return NextResponse.json({ error: "No autorizado para editar recepcion o traslado" }, { status: 403 });
    }

    // Extraer y convertir el parámetro 'id'
    const { id } = await params;
    const recepcionId = parseInt(id, 10);
    // Leer el cuerpo de la petición
    const body = await request.json();

    // Actualizar sólo los campos editables
    const recepcionActualizada = await prisma.recepcionTraslado.update({
      where: { id: recepcionId },
      data: {
        barcoId:       body.barcoId,
        fecha:         body.fecha         || undefined,
        hora:          body.hora          || undefined,
        producto:      body.producto      || undefined,
        nombreBarco:   body.nombreBarco   || undefined,
        chequero:      body.chequero      || undefined,
        turnoInicio:   body.turnoInicio   ?? null,
        turnoFin:      body.turnoFin      ?? null,
        puntoCarga:    body.puntoCarga    ?? null,
        puntoDescarga: body.puntoDescarga ?? null,
        bitacoras:     body.bitacoras     ?? undefined, // espera un JSON válido
      },
    });

    return NextResponse.json(recepcionActualizada, { status: 200 });
  } catch (error) {
    console.error("Error PUT /api/recepcion/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar recepción" },
      { status: 500 }
    );
  }
}