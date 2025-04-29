// src/app/api/recepcion/transportes/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLE_ID = 1;

export async function GET(request) {
  // Sólo administradores
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== ADMIN_ROLE_ID) {
    return NextResponse.json(
      { error: "No tienes permiso para ver los transportes" },
      { status: 403 }
    );
  }

  try {
    const empresas = await prisma.empresaTransporte.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(empresas, { status: 200 });
  } catch (err) {
    console.error("Error fetching transportes:", err);
    return NextResponse.json(
      { error: "Error al obtener las empresas de transporte" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Sólo administradores
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== ADMIN_ROLE_ID) {
    return NextResponse.json(
      { error: "No tienes permiso para crear transportes" },
      { status: 403 }
    );
  }

  try {
    // Puede venir un solo objeto o un array
    const payload = await request.json();
    const items = Array.isArray(payload) ? payload : [payload];

    const created = [];
    for (const item of items) {
      let { nombre, motoristas } = item;

      // Validar nombre
      if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        return NextResponse.json(
          { error: "El campo 'nombre' es obligatorio" },
          { status: 400 }
        );
      }
      nombre = nombre.trim();

      // Verificar duplicado manualmente con findFirst
      const exists = await prisma.empresaTransporte.findFirst({
        where: { nombre }
      });
      if (exists) {
        return NextResponse.json(
          { error: `Ya existe una empresa de transporte llamada '${nombre}'` },
          { status: 409 }
        );
      }

      // Asegurar que motoristas venga como array, o default a []
      const motoristasData = Array.isArray(motoristas) ? motoristas : [];

      // Crear la nueva empresa de transporte
      const nueva = await prisma.empresaTransporte.create({
        data: {
          nombre,
          motoristas: motoristasData,
        },
      });
      created.push(nueva);
    }

    // Si recibimos array devolvemos array, si no, el único objeto
    return NextResponse.json(
      Array.isArray(payload) ? created : created[0],
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating transporte(s):", err);
    return NextResponse.json(
      { error: "Error al crear la(s) empresa(s) de transporte" },
      { status: 500 }
    );
  }
}
