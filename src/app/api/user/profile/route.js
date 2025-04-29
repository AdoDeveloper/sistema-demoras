import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

// Función para convertir una fecha ISO (YYYY-MM-DD) al formato "dd/mm/yyyy"
function convertIsoToCustom(isoDate) {
  if (!isoDate) return null;
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
    const demorasPage = parseInt(searchParams.get("demorasPage") || "1");
    const envasadosPage = parseInt(searchParams.get("envasadosPage") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Obtener parámetros de fecha
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!userId) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    // Verificar que el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        nombreCompleto: true,
        codigo: true,
        role: {
          select: { 
            id: true,
            name: true 
          },
        },
      },
    });

    if (!userExists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Función para obtener estadísticas diarias paginadas
    const getDailyStats = async (records, page, limit) => {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return records.slice(startIndex, endIndex);
    };

    // Función principal para obtener datos del modelo
    const getModelData = async (modelName, whereCondition, page, limit) => {
      // Obtener totales globales
      const totalGlobal = await prisma[modelName].count({});
      const totalRegistros = await prisma[modelName].count({ where: whereCondition });

      // Estadísticas por método de carga
      const cabaleoStats = await prisma[modelName].count({
        where: {
          ...whereCondition,
          primerProceso: { metodoCarga: "Cabaleo" },
        },
      });
      
      const cargaMaximaStats = await prisma[modelName].count({
        where: {
          ...whereCondition,
          primerProceso: { metodoCarga: "Carga Máxima" },
        },
      });

      // Obtener todas las fechas distintas para estadísticas diarias
      const allDates = await prisma[modelName].findMany({
        where: whereCondition,
        select: {
          fechaInicio: true,
          primerProceso: {
            select: {
              metodoCarga: true
            }
          }
        },
        orderBy: { fechaInicio: "asc" },
      });

      // Procesar estadísticas diarias
      const dailyStatsMap = {};
      allDates.forEach((record) => {
        const fechaDia = record.fechaInicio.split(',')[0]; // Obtener solo la fecha (dd/mm/yyyy)
        if (!dailyStatsMap[fechaDia]) {
          dailyStatsMap[fechaDia] = { total: 0, cabaleo: 0, cargaMaxima: 0 };
        }
        dailyStatsMap[fechaDia].total++;
        
        if (record.primerProceso?.metodoCarga === "Cabaleo") {
          dailyStatsMap[fechaDia].cabaleo++;
        }
        
        if (record.primerProceso?.metodoCarga === "Carga Máxima") {
          dailyStatsMap[fechaDia].cargaMaxima++;
        }
      });

      // Convertir a array y ordenar
      let dailyStats = Object.entries(dailyStatsMap)
        .map(([fecha, stats]) => ({
          fecha,
          total: stats.total,
          cabaleo: stats.cabaleo,
          cargaMaxima: stats.cargaMaxima,
        }))
        .sort((a, b) => {
          const [dayA, monthA, yearA] = a.fecha.split('/');
          const [dayB, monthB, yearB] = b.fecha.split('/');
          return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
        });

      // Paginar estadísticas diarias
      const paginatedDailyStats = await getDailyStats(dailyStats, page, limit);
      const totalDailyStats = dailyStats.length;

      return {
        stats: {
          totalRegistros,
          totalCabaleo: cabaleoStats,
          totalCargaMaxima: cargaMaximaStats,
          total: totalGlobal,
        },
        dailyStats: paginatedDailyStats,
        pagination: {
          totalRecords: totalRegistros,
          totalDailyRecords: totalDailyStats,
          page,
          limit,
          totalPages: Math.ceil(totalDailyStats / limit),
        }
      };
    };

    // ------------------- Procesar datos para Demora (Granel) -------------------
    const demoraWhereCondition = { userId };
    if (startDateParam && endDateParam) {
      const formattedStartDate = `${convertIsoToCustom(startDateParam)}, 00:00:00`;
      const formattedEndDate = `${convertIsoToCustom(endDateParam)}, 23:59:59`;
      demoraWhereCondition.fechaInicio = {
        gte: formattedStartDate,
        lte: formattedEndDate,
      };
    }
    
    const demoraData = await getModelData("demora", demoraWhereCondition, demorasPage, limit);
    
    // ------------------- Procesar datos para Envasado -------------------
    const envasadoWhereCondition = { userId };
    if (startDateParam && endDateParam) {
      const formattedStartDate = `${convertIsoToCustom(startDateParam)}, 00:00:00`;
      const formattedEndDate = `${convertIsoToCustom(endDateParam)}, 23:59:59`;
      envasadoWhereCondition.fechaInicio = {
        gte: formattedStartDate,
        lte: formattedEndDate,
      };
    }
    
    const envasadoData = await getModelData("envasado", envasadoWhereCondition, envasadosPage, limit);
    
    // Estructura de respuesta
    return NextResponse.json({
      user: {
        ...userExists,
        role: {
          id: userExists.role.id,
          name: userExists.role.name
        }
      },
      granel: demoraData,
      envasado: envasadoData
    });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error.message 
    }, { status: 500 });
  }
}