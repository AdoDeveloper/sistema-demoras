import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

// Convierte la fecha (string "YYYY-MM-DD") a objeto Date
function parseFecha(fechaStr) {
  return new Date(fechaStr);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const totalCount = await prisma.actividad.count();
    const actividades = await prisma.actividad.findMany({
      include: { detalles: true },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Formatear la fecha para mostrar "YYYY-MM-DD"
    const formattedActividades = actividades.map((act) => {
      const date = new Date(act.fecha);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return {
        ...act,
        fecha: `${year}-${month}-${day}`,
      };
    });

    return NextResponse.json({ data: formattedActividades, totalCount }, { status: 200 });
  } catch (err) {
    console.error("Error al listar actividades:", err);
    return NextResponse.json({ error: "Error al listar actividades" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Obtener la sesión (token) del usuario autenticado
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }

    const body = await request.json();
    console.log(">>> [API Debug] BODY RECIBIDO:", body);

    // Se espera que el body tenga la propiedad actividadProcess
    const { actividadProcess } = body;
    if (!actividadProcess) {
      console.warn(">>> [API Debug] actividadProcess es undefined o null.");
      return NextResponse.json({ error: "Faltan datos en el body" }, { status: 400 });
    }

    // Extraer datos generales
    const fecha = parseFecha(actividadProcess.generalDate);
    console.log(">>> [API Debug] Fecha (generalDate):", fecha);
    console.log(">>> [API Debug] userId (de sesión):", session.id);
    console.log(">>> [API Debug] userName (de sesión):", session.username);

    // Ejecutar operaciones en una transacción
    const createdData = await prisma.$transaction(async (tx) => {
      // Crear registro principal en Actividad usando datos de la sesión
      const actividadCreada = await tx.actividad.create({
        data: {
          userId: parseInt(session.id, 10) || null,
          userName: session.username || "",
          fecha: fecha,
          totalActividades: actividadProcess.totalActivities || 0,
          totalDuracion: actividadProcess.totalDuration || "",
        },
      });
      console.log(">>> [API Debug] Actividad creada con ID:", actividadCreada.id);

      // Crear registros de DetalleActividad para cada actividad en el array
      if (Array.isArray(actividadProcess.actividades)) {
        for (let i = 0; i < actividadProcess.actividades.length; i++) {
          const detalle = actividadProcess.actividades[i];
          await tx.detalleActividad.create({
            data: {
              actividadId: actividadCreada.id,
              activity: detalle.activity || "",
              startTime: detalle.startTime || "",
              endTime: detalle.endTime || "",
              duration: detalle.duration || "",
              responsables: detalle.responsables || "",
            },
          });
          console.log(`>>> [API Debug] Detalle de actividad ${i + 1} creado con éxito.`);
        }
      } else {
        console.log(">>> [API Debug] No se encontró array de actividades en actividadProcess.");
      }

      return actividadCreada;
    });

    console.log(">>> [API Debug] Todo creado correctamente. Respondiendo con status 201.");
    return NextResponse.json({ ok: true, id: createdData.id }, { status: 201 });
  } catch (err) {
    console.error("Error al guardar actividad:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Registro duplicado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al guardar actividad" }, { status: 500 });
  }
}
