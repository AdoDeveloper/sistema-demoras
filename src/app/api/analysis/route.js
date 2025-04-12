import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma"; // Ajusta la ruta según tu estructura

// --- Funciones de Conversión y Cálculos Básicos ---

// Convierte una cadena "HH:mm:ss" a minutos (número decimal)
function parseHHmmssToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  const hours = parts[0] || 0;
  const mins = parts[1] || 0;
  const secs = parts[2] || 0;
  return hours * 60 + mins + secs / 60;
}

// Convierte un número de minutos a formato "HH:MM:SS"
function convertMinutesToHHMMSS(minutes) {
  const totalSeconds = Math.round(minutes * 60);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss
    .toString()
    .padStart(2, "0")}`;
}

// --- Funciones para Estadísticas Generales y Agrupados ---

// Calcula estadísticas generales a partir de registros de Granel y Envasado
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
    // Ejemplo: se considera retrasado si dura más de 45 minutos
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

// Agrupación (standardization) para Granel agrupando por "puntoDespacho" y "condicion"
function computeStandardizationGranel(demoras) {
  const groups = {};
  demoras.forEach(proc => {
    if (!proc.primerProceso) return;
    const puntoDespacho = proc.primerProceso.puntoDespacho || "Sin despacho";
    const condicion = proc.primerProceso.condicion || "Sin condición";
    const key = `${puntoDespacho} | ${condicion}`;
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
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

// Para Molino se agrupa de forma similar (usando el primerProceso)
function computeStandardizationMolino(molinos) {
  const groups = {};
  molinos.forEach(proc => {
    if (!proc.primerProceso) return;
    const puntoDespacho = proc.primerProceso.puntoDespacho || "Sin despacho";
    const condicion = proc.primerProceso.condicion || "Sin condición";
    const key = `${puntoDespacho} | ${condicion}`;
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
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

// Para Actividades se agrupa por "userName" utilizando el campo "totalDuracion" (formato "HH:mm:ss")
function computeStandardizationActividad(actividades) {
  const groups = {};
  actividades.forEach(proc => {
    const key = proc.userName || "Desconocido";
    const minutes = parseHHmmssToMinutes(proc.totalDuracion || "00:00:00");
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
    groups[key].total += minutes;
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

// Calcula aggregates por "metodoCarga" para registros (usado para Granel y Envasado)
function computeAggregatesByMetodo(records) {
  const groups = {};
  records.forEach(record => {
    if (!record.primerProceso) return;
    const metodo = record.primerProceso.metodoCarga || "Desconocido";
    if (!groups[metodo]) groups[metodo] = { total: 0, count: 0 };
    groups[metodo].total += record.tiempoTotalMin;
    groups[metodo].count++;
  });
  const aggregates = {};
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    const avg = group.total / group.count;
    aggregates[key] = { count: group.count, avgTime: convertMinutesToHHMMSS(avg) };
  });
  return aggregates;
}

// Función similar para Molino (usando su relación "primerProceso")
function computeAggregatesForMolino(molinos) {
  const groups = {};
  molinos.forEach(record => {
    if (!record.primerProceso) return;
    const metodo = record.primerProceso.metodoCarga || "Desconocido";
    if (!groups[metodo]) groups[metodo] = { total: 0, count: 0 };
    groups[metodo].total += record.tiempoTotalMin;
    groups[metodo].count++;
  });
  const aggregates = {};
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    const avg = group.total / group.count;
    aggregates[key] = { count: group.count, avgTime: convertMinutesToHHMMSS(avg) };
  });
  return aggregates;
}

// Para Actividades se agrupa por "userName" promediando "totalDuracion"
function computeAggregatesForActividad(actividades) {
  const groups = {};
  actividades.forEach(record => {
    const key = record.userName || "Desconocido";
    const minutes = parseHHmmssToMinutes(record.totalDuracion || "00:00:00");
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
    groups[key].total += minutes;
    groups[key].count++;
  });
  const aggregates = {};
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    const avg = group.total / group.count;
    aggregates[key] = { count: group.count, avgTime: convertMinutesToHHMMSS(avg) };
  });
  return aggregates;
}

// --- Endpoint GET para /api/analysis ---

export async function GET(request) {
  try {
    // Consulta de Granel (demoras) con sus relaciones
    const demoras = await prisma.demora.findMany({
      include: {
        primerProceso: true,
        segundoProceso: true,
        tercerProceso: { include: { vueltas: true } },
        procesoFinal: true,
      },
    });
    // Consulta de Envasado (envasados) con sus relaciones
    const envasados = await prisma.envasado.findMany({
      include: {
        primerProceso: true,
        segundoProceso: { include: { parosEnv: true } },
        tercerProceso: { include: { vueltasEnv: true } },
        procesoFinal: true,
      },
    });
    // Consulta de Molino con sus relaciones
    const molinos = await prisma.molino.findMany({
      include: {
        primerProceso: true,
        segundoProceso: { include: { parosMol: true } },
        tercerProceso: { include: { vueltasMol: true } },
        procesoFinal: true,
      },
    });
    // Consulta de Actividades con detalles
    const actividades = await prisma.actividad.findMany({
      include: {
        detalles: true,
      },
    });

    // Transformar "tiempoTotal" a un campo calculado "tiempoTotalMin" para Granel, Envasado y Molino
    const demorasTransformed = demoras.map(d => ({
      ...d,
      tiempoTotalMin: parseHHmmssToMinutes(d.tiempoTotal || "00:00:00")
    }));
    const envasadosTransformed = envasados.map(e => ({
      ...e,
      tiempoTotalMin: parseHHmmssToMinutes(e.tiempoTotal || "00:00:00")
    }));
    const molinosTransformed = molinos.map(m => ({
      ...m,
      tiempoTotalMin: parseHHmmssToMinutes(m.tiempoTotal || "00:00:00")
    }));
    // Se asume que las Actividades incluyen "totalDuracion" en formato "HH:mm:ss"

    // Calcular estadísticas generales a partir de Granel y Envasado
    const stats = computeStats(demorasTransformed, envasadosTransformed);

    // Calcular standardization para cada grupo
    const standardizationGranel = computeStandardizationGranel(demorasTransformed);
    const standardizationMolino = computeStandardizationMolino(molinosTransformed);
    const standardizationActividad = computeStandardizationActividad(actividades);

    // Calcular aggregates para cada grupo
    const aggregatesGranel = computeAggregatesByMetodo(demorasTransformed);
    const aggregatesEnvasado = computeAggregatesByMetodo(envasadosTransformed);
    const aggregatesMolino = computeAggregatesForMolino(molinosTransformed);
    const aggregatesActividad = computeAggregatesForActividad(actividades);

    return NextResponse.json({
      success: true,
      data: {
        granel: demorasTransformed,
        envasado: envasadosTransformed,
        molino: molinosTransformed,
        actividades: actividades,
      },
      stats: {
        totalProcesses: stats.totalProcesses,
        avgTime: convertMinutesToHHMMSS(stats.avgTime),
        delayedCount: stats.delayedCount,
        completedToday: stats.completedToday,
      },
      standardization: {
        granel: standardizationGranel,
        envasado: {}, // Puedes extender esta lógica para Envasado si es necesario.
        molino: standardizationMolino,
        actividades: standardizationActividad,
      },
      aggregates: {
        granel: aggregatesGranel,
        envasado: aggregatesEnvasado,
        molino: aggregatesMolino,
        actividades: aggregatesActividad,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching analysis data:", error);
    return NextResponse.json({ error: "Error fetching analysis data" }, { status: 500 });
  }
}
