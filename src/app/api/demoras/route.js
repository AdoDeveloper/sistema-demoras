// src/app/api/demoras/route.js (App Router estilo)
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  try {
    const demoras = await prisma.demora.findMany({
      orderBy: { createdAt: "desc" },
    });
    // Retorna una respuesta JSON con status 200
    return NextResponse.json(demoras, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al listar demoras" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Lee el body como JSON
    const body = await request.json();
    const { demorasProcess } = body;

    if (!demorasProcess) {
      return NextResponse.json({ error: "Faltan datos en el body" }, { status: 400 });
    }

    const nueva = await prisma.demora.create({
      data: {
        data: demorasProcess, // Guarda todo el JSON en la columna "data"
      },
    });

    return NextResponse.json({ ok: true, id: nueva.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al guardar demoras" }, { status: 500 });
  }
}
