import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma"; // Ajusta la ruta según tu estructura

// Convierte una cadena "HH:mm:ss" a minutos (número decimal)
function parseHHmmssToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hh, mm, ss] = timeStr.split(":").map(Number);
  const hours = hh || 0;
  const mins = mm || 0;
  const secs = ss || 0;
  return hours * 60 + mins + secs / 60;
}

// Convierte un número de minutos a formato "HH:MM:SS"
function convertMinutesToHHMMSS(minutes) {
  const totalSeconds = Math.round(minutes * 60);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

// Calcula estadísticas generales de los procesos
function computeStats(demoras, envasados) {
  const allProcesses = [...demoras, ...envasados];
  if (allProcesses.length === 0) {
    return {
      totalProcesses: 0,
      avgTime: 0,
      delayedCount: 0,
      completedToday: 0,
    };
  }
  let totalMinutes = 0;
  let delayedCount = 0;
  let completedToday = 0;
  const todayDate = new Date().toLocaleDateString();
  for (const proc of allProcesses) {
    const minutes = parseHHmmssToMinutes(proc.tiempoTotal || "00:00:00");
    totalMinutes += minutes;
    if (minutes > 45) delayedCount++;
    const createdDate = new Date(proc.createdAt).toLocaleDateString();
    if (createdDate === todayDate) {
      completedToday++;
    }
  }
  const avgTime = totalMinutes / allProcesses.length; // en minutos
  return {
    totalProcesses: allProcesses.length,
    avgTime, // en minutos
    delayedCount,
    completedToday,
  };
}

// Calcula estandarización para Granel agrupando por "puntoDespacho" y "condicion"
function computeStandardizationGranel(demoras) {
  const groups = {};
  // Se utiliza el campo "puntoDespacho" y "condicion" del objeto primerProceso
  demoras.forEach(proc => {
    if (!proc.primerProceso) return;
    const puntoDespacho = proc.primerProceso.puntoDespacho || "Sin despacho";
    const condicion = proc.primerProceso.condicion || "Sin condición";
    const key = `${puntoDespacho} | ${condicion}`;
    if (!groups[key]) {
      groups[key] = { total: 0, count: 0 };
    }
    groups[key].total += proc.tiempoTotalMin;
    groups[key].count++;
  });
  const standardization = {};
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    const avg = group.total / group.count;
    standardization[key] = convertMinutesToHHMMSS(avg);
  });
  return standardization;
}

// Calcula agregados por "metodoCarga" para los registros (Granel o Envasado)
function computeAggregatesByMetodo(records) {
  const groups = {};
  records.forEach(record => {
    if (!record.primerProceso) return;
    const metodo = record.primerProceso.metodoCarga || "Desconocido";
    if (!groups[metodo]) {
      groups[metodo] = { total: 0, count: 0 };
    }
    groups[metodo].total += record.tiempoTotalMin;
    groups[metodo].count++;
  });
  const aggregates = {};
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    const avg = group.total / group.count;
    aggregates[key] = {
      count: group.count,
      avgTime: convertMinutesToHHMMSS(avg)
    };
  });
  return aggregates;
}

/**
 * GET /api/analysis
 * Devuelve un JSON con:
 * - data: Los registros de Granel y Envasado (incluyendo relaciones y campo calculado "tiempoTotalMin")
 * - stats: Estadísticas generales (tiempo promedio, procesos retrasados y completados hoy) con tiempo promedio en formato "HH:MM:SS"
 * - standardization: Agrupación (estandarización) para Granel por "puntoDespacho" y "condicion"
 * - aggregates: Agrupados por "metodoCarga" para Granel y Envasado
 * 
 * Puedes extender esta API con más endpoints o acciones según lo requieras.
 */
export async function GET(request) {
  try {
    // Consulta de Granel (demoras) con todas sus relaciones
    const demoras = await prisma.demora.findMany({
      include: {
        primerProceso: true,
        segundoProceso: true,
        tercerProceso: { include: { vueltas: true } },
        procesoFinal: true,
      },
    });
    // Consulta de Envasado (envasados) con todas sus relaciones
    const envasados = await prisma.envasado.findMany({
      include: {
        primerProceso: true,
        segundoProceso: { include: { parosEnv: true } },
        tercerProceso: { include: { vueltasEnv: true } },
        procesoFinal: true,
      },
    });
    // Transformar "tiempoTotal" a un campo calculado "tiempoTotalMin"
    const demorasTransformed = demoras.map(d => ({
      ...d,
      tiempoTotalMin: parseHHmmssToMinutes(d.tiempoTotal || "00:00:00"),
    }));
    const envasadosTransformed = envasados.map(e => ({
      ...e,
      tiempoTotalMin: parseHHmmssToMinutes(e.tiempoTotal || "00:00:00"),
    }));
    // Calcular estadísticas generales
    const stats = computeStats(demorasTransformed, envasadosTransformed);
    // Calcular estandarización para Granel
    const standardizationGranel = computeStandardizationGranel(demorasTransformed);
    // Calcular agregados por "metodoCarga"
    const aggregatesGranel = computeAggregatesByMetodo(demorasTransformed);
    const aggregatesEnvasado = computeAggregatesByMetodo(envasadosTransformed);
    return NextResponse.json({
      success: true,
      data: {
        granel: demorasTransformed,
        envasado: envasadosTransformed,
      },
      stats: {
        totalProcesses: stats.totalProcesses,
        avgTime: convertMinutesToHHMMSS(stats.avgTime),
        delayedCount: stats.delayedCount,
        completedToday: stats.completedToday,
      },
      standardization: {
        granel: standardizationGranel,
        envasado: {} // Puedes extender lógica similar para Envasado si es necesario
      },
      aggregates: {
        granel: aggregatesGranel,
        envasado: aggregatesEnvasado,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching analysis data:", error);
    return NextResponse.json({ error: "Error fetching analysis data" }, { status: 500 });
  }
}
