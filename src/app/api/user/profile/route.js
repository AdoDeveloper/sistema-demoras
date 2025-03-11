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

    // ------------------- Procesamiento de datos para ambos modelos -------------------
    // Función para obtener datos paginados y estadísticas con estructura unificada
    const getModelData = async (modelName, whereCondition, page, limit) => {
      // Nombre de la tabla relacionada del primer proceso según el modelo
      const primerProcesoTable = modelName === "demora" ? "primerProceso" : "primerProceso";
      
      // Contador global
      const totalGlobal = await prisma[modelName].count({});
      
      // Obtener total de registros según filtro
      const totalRegistros = await prisma[modelName].count({ where: whereCondition });
      
      // Estadísticas por método de carga
      const cabaleoStats = await prisma[modelName].count({
        where: {
          ...whereCondition,
          [primerProcesoTable]: { metodoCarga: "Cabaleo" },
        },
      });
      
      const cargaMaximaStats = await prisma[modelName].count({
        where: {
          ...whereCondition,
          [primerProcesoTable]: { metodoCarga: "Carga Máxima" },
        },
      });
      
      // Obtener todos los registros para agrupar por día
      const allRecords = await prisma[modelName].findMany({
        where: whereCondition,
        include: { [primerProcesoTable]: true },
      });
      
      // Agrupar resultados por día
      const dailyStatsMap = {};
      allRecords.forEach((record) => {
        const fechaDia = record.fechaInicio.substring(0, 10);
        if (!dailyStatsMap[fechaDia]) {
          dailyStatsMap[fechaDia] = { total: 0, cabaleo: 0, cargaMaxima: 0 };
        }
        dailyStatsMap[fechaDia].total++;
        
        if (record[primerProcesoTable] && record[primerProcesoTable].metodoCarga === "Cabaleo") {
          dailyStatsMap[fechaDia].cabaleo++;
        }
        
        if (record[primerProcesoTable] && record[primerProcesoTable].metodoCarga === "Carga Máxima") {
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
      
      // Obtener registros paginados
      // Determinar los incluidos según el modelo
      let includedRelations = {};
      if (modelName === "demora") {
        includedRelations = {
          primerProceso: true,
          segundoProceso: true,
          tercerProceso: true,
          procesoFinal: true
        };
      } else if (modelName === "envasado") {
        includedRelations = {
          primerProceso: true,
          segundoProceso: true,
          tercerProceso: true,
          procesoFinal: true
        };
      }
      
      const registrosPaginados = await prisma[modelName].findMany({
        where: whereCondition,
        skip: (page - 1) * limit,
        take: limit,
        include: includedRelations,
        orderBy: { fechaInicio: "asc" },
      });
      
      return {
        pagination: {
          total: totalRegistros,
          realizado: totalRegistros, // Para mantener consistencia con envasados
          totalGlobal: totalGlobal,
          page,
          limit,
          totalPages: Math.ceil(totalRegistros / limit),
        },
        stats: {
          totalRegistros,
          totalCabaleo: cabaleoStats,
          totalCargaMaxima: cargaMaximaStats,
          total: totalGlobal,
        },
        dailyStats,
        registros: registrosPaginados,
      };
    };
    
    // ------------------- Procesar datos para Demora (Granel) -------------------
    // Condición base de filtrado para demoras
    const demoraWhereCondition = { userId };
    if (startDateParam && endDateParam) {
      const formattedStartDate = `${convertIsoToCustom(startDateParam)}, 00:00:00`;
      const formattedEndDate = `${convertIsoToCustom(endDateParam)}, 23:59:59`;
      demoraWhereCondition.fechaInicio = {
        gte: formattedStartDate,
        lte: formattedEndDate,
      };
    }
    
    const demoraData = await getModelData("demora", demoraWhereCondition, page, limit);
    
    // ------------------- Procesar datos para Envasado -------------------
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
    
    const envasadoData = await getModelData("envasado", envasadoWhereCondition, page, limit);
    
    // Estructura normalizada para la respuesta
    return NextResponse.json({
      user: userExists,
      granel: {
        pagination: demoraData.pagination,
        stats: demoraData.stats,
        dailyStats: demoraData.dailyStats
      },
      envasado: {
        pagination: envasadoData.pagination,
        stats: envasadoData.stats,
        dailyStats: envasadoData.dailyStats
      }
    });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}