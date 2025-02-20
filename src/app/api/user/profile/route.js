// /app/api/user/profile/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

// Función para convertir una fecha ISO (YYYY-MM-DD) al formato "dd/mm/yyyy"
// utilizando la zona horaria de El Salvador (UTC-6)
function convertIsoToCustom(isoDate) {
  // Se crea la fecha forzando que se interprete en la zona horaria de El Salvador
  const dateObj = new Date(`${isoDate}T00:00:00-06:00`);
  return dateObj.toLocaleDateString("es-SV", {
    timeZone: "America/El_Salvador",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get("id") || "0");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Obtener parámetros de fecha (opcionales)
    let startDateParam = searchParams.get("startDate");
    let endDateParam = searchParams.get("endDate");

    // Si se proporciona solo una fecha, se utiliza para ambas (inicio y fin)
    if (startDateParam && !endDateParam) {
      endDateParam = startDateParam;
    }
    if (endDateParam && !startDateParam) {
      startDateParam = endDateParam;
    }
    
    // Validar que se haya proporcionado un ID de usuario
    if (!userId) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    // Contador global (total de registros en "demora")
    const total = await prisma.demora.count({});

    // Verificar que el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { nombreCompleto: true, codigo: true, email: true },
    });
    if (!userExists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Condición base de filtrado
    const whereCondition = { userId };

    // Si se proporcionan los filtros de fecha, se aplican; de lo contrario se muestran todos los registros.
    if (startDateParam && endDateParam) {
      const formattedStartDate = `${convertIsoToCustom(startDateParam)}, 00:00:00`;
      const formattedEndDate = `${convertIsoToCustom(endDateParam)}, 23:59:59`;
      whereCondition.fechaInicio = {
        gte: formattedStartDate,
        lte: formattedEndDate,
      };
    }

    // Obtener total de registros según filtro
    const totalRegistros = await prisma.demora.count({
      where: whereCondition,
    });

    // Estadísticas generales por método de carga
    const cabaleoStats = await prisma.demora.count({
      where: {
        ...whereCondition,
        primerProceso: { metodoCarga: "Cabaleo" },
      },
    });
    const cargaMaximaStats = await prisma.demora.count({
      where: {
        ...whereCondition,
        primerProceso: { metodoCarga: "Carga Máxima" },
      },
    });

    // Obtener todos los registros para agrupar por día
    const demoras = await prisma.demora.findMany({
      where: whereCondition,
      include: { primerProceso: true },
    });

    // Agrupar resultados por día (se extrae la parte "dd/mm/yyyy" de fechaInicio)
    const dailyStatsMap = {};
    demoras.forEach((demora) => {
      const fechaDia = demora.fechaInicio.substring(0, 10);
      if (!dailyStatsMap[fechaDia]) {
        dailyStatsMap[fechaDia] = { total: 0, cabaleo: 0, cargaMaxima: 0 };
      }
      dailyStatsMap[fechaDia].total++;
      if (demora.primerProceso && demora.primerProceso.metodoCarga === "Cabaleo") {
        dailyStatsMap[fechaDia].cabaleo++;
      }
      if (demora.primerProceso && demora.primerProceso.metodoCarga === "Carga Máxima") {
        dailyStatsMap[fechaDia].cargaMaxima++;
      }
    });

    // Convertir el objeto de agrupación a un arreglo ordenado cronológicamente
    const dailyStats = Object.keys(dailyStatsMap)
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.split("/");
        const [dayB, monthB, yearB] = b.split("/");
        return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
      })
      .map((fecha) => ({
        fecha,
        total: dailyStatsMap[fecha].total,
        cabaleo: dailyStatsMap[fecha].cabaleo,
        cargaMaxima: dailyStatsMap[fecha].cargaMaxima,
      }));

    // Obtener registros paginados para la respuesta principal
    const registrosPaginados = await prisma.demora.findMany({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      include: { primerProceso: true },
      orderBy: { fechaInicio: "asc" },
    });

    return NextResponse.json({
      pagination: {
        total: totalRegistros,
        page,
        limit,
        totalPages: Math.ceil(totalRegistros / limit),
      },
      stats: {
        totalRegistros,
        totalCabaleo: cabaleoStats,
        totalCargaMaxima: cargaMaximaStats,
        total,
      },
      user: userExists,
      dailyStats,
      registros: registrosPaginados,
    });
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
