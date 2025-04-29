import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request, { params }) {
  // 1. Autenticación
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }

  // 2. Extraemos el `id` de barco de la ruta
  const { id } = await params;
  const barcoId = parseInt(id, 10);
  if (Number.isNaN(barcoId)) {
    return NextResponse.json({ error: "ID de barco inválido" }, { status: 400 });
  }

  try {
    // 3. Buscamos ese BarcoRecepcion
    const barco = await prisma.barcoRecepcion.findUnique({
      where: { id: barcoId },
      select: {
        id: true,
        vaporBarco: true,
        productos: true,
        puntosDescarga: true,
        transportes: true,    // JSON: [{ id, nombre }, …]
        observaciones: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!barco) {
      return NextResponse.json({ error: "Barco no encontrado" }, { status: 404 });
    }

    // 4. Extraer IDs únicos de transportes
    const transIds = (barco.transportes || []).map((t) => t.id);
    const uniqueIds = Array.from(new Set(transIds));

    // 5. Traer motoristas para esos IDs
    const empresas = await prisma.empresaTransporte.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, motoristas: true },
    });
    const motosMap = empresas.reduce((acc, e) => {
      acc[e.id] = e.motoristas;
      return acc;
    }, {});

    // 6. Inyectar motoristas en cada transporte
    const transportesConMotores = (barco.transportes || []).map((t) => ({
      id: t.id,
      nombre: t.nombre,
      motoristas: motosMap[t.id] || [],
    }));

    // 7. Responder con la entidad completa
    return NextResponse.json(
      {
        data: {
          ...barco,
          transportes: transportesConMotores,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error al obtener bitácoras por barco:", err);
    return NextResponse.json(
      { error: "Error interno al obtener datos" },
      { status: 500 }
    );
  }
}