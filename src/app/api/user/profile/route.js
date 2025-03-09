import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

// Función para convertir una fecha ISO (YYYY-MM-DD) al formato "dd/mm/yyyy"
// utilizando la zona horaria de El Salvador (UTC-6)
function convertIsoToCustom(isoDate) {
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
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const userId = token.id;
    console.log("user id(session)", userId);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Obtener parámetros de fecha (opcionales)
    let startDateParam = searchParams.get("startDate");
    let endDateParam = searchParams.get("endDate");

    if (startDateParam && !endDateParam) {
      endDateParam = startDateParam;
    }
    if (endDateParam && !startDateParam) {
      startDateParam = endDateParam;
    }
    
    if (!userId) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    // Contador global (total de registros en "demora")
    const total = await prisma.demora.count({});

    // Verificar que el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        nombreCompleto: true,
        codigo: true,
        email: true,
        role: {
          select: { name: true },
        },
      },
    });

    if (!userExists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // ------------------- Demoras -------------------
    // Condición base de filtrado para demoras
    const whereCondition = { userId };
    if (startDateParam && endDateParam) {
      const formattedStartDate = `${convertIsoToCustom(startDateParam)}, 00:00:00`;
      const formattedEndDate = `${convertIsoToCustom(endDateParam)}, 23:59:59`;
      whereCondition.fechaInicio = {
        gte: formattedStartDate,
        lte: formattedEndDate,
      };
    }

    // Obtener total de registros según filtro en demoras
    const totalRegistros = await prisma.demora.count({ where: whereCondition });

    // Estadísticas generales por método de carga en demoras
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

    // Obtener todos los registros de demoras para agrupar por día
    const demoras = await prisma.demora.findMany({
      where: whereCondition,
      include: { primerProceso: true },
    });

    // Agrupar resultados por día para demoras
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

    // Obtener registros paginados de demoras
    const registrosPaginados = await prisma.demora.findMany({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      include: { primerProceso: true },
      orderBy: { fechaInicio: "asc" },
    });

    // ------------------- Envasados -------------------
    // Condición base de filtrado para envasados
    const envasadoWhereCondition = { userId };
    if (startDateParam && endDateParam) {
      const formattedStartDate = `${convertIsoToCustom(startDateParam)}, 00:00:00`;
      const formattedEndDate = `${convertIsoToCustom(endDateParam)}, 23:59:59`;
      envasadoWhereCondition.fechaInicio = {
        gte: formattedStartDate,
        lte: formattedEndDate,
      };
    }

    // Contar total de registros en envasados
    const totalEnvasados = await prisma.envasado.count({
      where: envasadoWhereCondition,
    });

    // Obtener registros paginados de envasados
    const envasadosPaginados = await prisma.envasado.findMany({
      where: envasadoWhereCondition,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        primerProceso: true,  // PrimerProcesoEnv
        segundoProceso: true, // SegundoProcesoEnv
        tercerProceso: true,  // TercerProcesoEnv
        procesoFinal: true,   // ProcesoFinalEnv
      },
      orderBy: { fechaInicio: "asc" },
    });

    // Calcular dailyStats para envasados
    const envasadosAll = await prisma.envasado.findMany({
      where: envasadoWhereCondition,
      include: { primerProceso: true },
    });

    const dailyStatsEnvasadosMap = {};
    envasadosAll.forEach((envasado) => {
      const fechaDia = envasado.fechaInicio.substring(0, 10);
      if (!dailyStatsEnvasadosMap[fechaDia]) {
        dailyStatsEnvasadosMap[fechaDia] = { total: 0, cabaleo: 0, cargaMaxima: 0 };
      }
      dailyStatsEnvasadosMap[fechaDia].total++;
      if (envasado.primerProceso && envasado.primerProceso.metodoCarga === "Cabaleo") {
        dailyStatsEnvasadosMap[fechaDia].cabaleo++;
      }
      if (envasado.primerProceso && envasado.primerProceso.metodoCarga === "Carga Máxima") {
        dailyStatsEnvasadosMap[fechaDia].cargaMaxima++;
      }
    });

    const dailyStatsEnvasados = Object.keys(dailyStatsEnvasadosMap)
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.split("/");
        const [dayB, monthB, yearB] = b.split("/");
        return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
      })
      .map((fecha) => ({
        fecha,
        total: dailyStatsEnvasadosMap[fecha].total,
        cabaleo: dailyStatsEnvasadosMap[fecha].cabaleo,
        cargaMaxima: dailyStatsEnvasadosMap[fecha].cargaMaxima,
      }));

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
      envasados: {
        pagination: {
          total: totalEnvasados,
          page,
          limit,
          totalPages: Math.ceil(totalEnvasados / limit),
        },
        dailyStats: dailyStatsEnvasados,
        registros: envasadosPaginados,
      }
    });
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
