import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import ExcelJS from "exceljs";

/**
 * Parsea un string "DD/MM/YYYY, HH:mm:ss" a Date.
 * Ejemplo: "11/02/2025, 05:57:22"
 */
function parseFechaHora(str) {
  if (!str) return null;
  try {
    const [fechaStr, horaStr] = str.split(", ");
    const [dia, mes, anio] = fechaStr.split("/").map(Number);
    const [hh, mm, ss] = horaStr.split(":").map(Number);
    return new Date(anio, mes - 1, dia, hh, mm, ss);
  } catch (err) {
    return null;
  }
}

/**
 * Parsea "HH:mm:ss" a Date (con fecha base 1970-01-01).
 */
function parseHora(str) {
  if (!str) return null;
  try {
    const [hh, mm, ss] = str.split(":").map(Number);
    return new Date(1970, 0, 1, hh, mm, ss);
  } catch (err) {
    return null;
  }
}

/**
 * Calcula la diferencia en horas (decimales) entre 2 fechas.
 */
function diffEnHoras(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  return (dateB - dateA) / (1000 * 60 * 60);
}

/**
 * Convierte un valor en horas (decimal) a formato "HH:MM:SS".
 * Si el valor es negativo, retorna "00:00:00".
 */
function formatInterval(hoursDecimal) {
  if (hoursDecimal < 0) return "00:00:00";
  const seconds = Math.round(hoursDecimal * 3600);
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * Genera un nombre de archivo dinámico: "Data YYYY-MM-DD HH-mm.xlsx"
 */
function getFileName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `Envasado ${yyyy}-${mm}-${dd} ${hh}-${min}.xlsx`;
}

/**
 * Función recursiva para aplanar un objeto (flatten).
 * Si encuentra un array, lo convierte a JSON (para la hoja principal).
 */
function flattenObject(obj, prefix = "") {
  let result = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

export async function GET(request) {
  try {
    // 1) Extraer parámetros de consulta (formato YYYY-MM-DD)
    const { searchParams } = new URL(request.url);
    const fechaInicioQuery = searchParams.get("fechaInicio");
    const fechaFinalQuery = searchParams.get("fechaFinal");

    const fechaInicioFilter = fechaInicioQuery ? new Date(fechaInicioQuery) : null;
    const fechaFinalFilter = fechaFinalQuery ? new Date(fechaFinalQuery) : null;

    // 2) Obtener todos los registros de Envasado (incluyendo relaciones)
    const registros = await prisma.envasado.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        primerProceso: true,
        segundoProceso: { include: { parosEnv: true } },
        tercerProceso: { include: { vueltasEnv: true } },
        procesoFinal: true,
      },
    });

    // 3) Filtrar registros según la fecha de autorización (primerProceso.fechaAutorizacion)
    let registrosFiltrados = registros;
    if (fechaInicioFilter && fechaFinalFilter) {
      registrosFiltrados = registros.filter((record) => {
        const authDateStr = record.primerProceso?.fechaAutorizacion;
        if (!authDateStr) return false;
        const authDate = new Date(authDateStr);
        return authDate >= fechaInicioFilter && authDate <= fechaFinalFilter;
      });
    }

    // 4) Construir las filas para la hoja "Historial"
    const rows = registrosFiltrados.map((record) => {
      const primer = record.primerProceso || {};
      const segundo = record.segundoProceso || {};
      const tercero = record.tercerProceso || {};
      const final = record.procesoFinal || {};

      // Cálculos adaptados para envasado
      const decCalc1 = diffEnHoras(parseHora(primer.tiempoEntradaBascula), parseHora(primer.tiempoSalidaBascula));
      const decCalc2 = diffEnHoras(parseHora(primer.tiempoSalidaBascula), parseHora(segundo.tiempoLlegadaPunto));
      const decCalc7 = diffEnHoras(parseHora(segundo.tiempoLlegadaPunto), parseHora(segundo.tiempoInicioCarga));
      const decCalc3 = diffEnHoras(parseHora(segundo.tiempoInicioCarga), parseHora(segundo.tiempoTerminaCarga));

      let entradaBS = null;
      let salidaBS = null;
      if (tercero.vueltasEnv && tercero.vueltasEnv.length > 0) {
        const lastVuelta = tercero.vueltasEnv[tercero.vueltasEnv.length - 1];
        entradaBS = parseHora(lastVuelta.tiempoEntradaBascula);
        salidaBS = parseHora(lastVuelta.tiempoSalidaBascula);
      }
      const decCalc4 = diffEnHoras(parseHora(segundo.tiempoSalidaPunto), entradaBS);
      const decCalc5 = diffEnHoras(entradaBS, salidaBS);
      const decCalc6 = diffEnHoras(salidaBS, parseHora(final.tiempoSalidaPlanta));

      const decCalc8 = diffEnHoras(parseHora(primer.tiempoAutorizacion), parseHora(primer.tiempoIngresoPlanta));
      const decCalc12 = diffEnHoras(parseHora(segundo.tiempoTerminaCarga), parseHora(segundo.tiempoSalidaPunto));
      const decCalcIngresoBascula = diffEnHoras(parseHora(primer.tiempoIngresoPlanta), parseHora(primer.tiempoLlegadaBascula));

      // Nuevos cálculos
      const decCalcExtra1 = diffEnHoras(parseHora(primer.tiempoLlegadaBascula), parseHora(primer.tiempoEntradaBascula));
      const decCalcExtra2 = diffEnHoras(parseHora(tercero.tiempoLlegadaBascula), parseHora(tercero.tiempoEntradaBascula));
      let decCalcExtra3 = 0;
      if (tercero.vueltasEnv && tercero.vueltasEnv.length > 0) {
        const firstVueltaEntrada = parseHora(tercero.vueltasEnv[0].tiempoEntradaBascula);
        const lastVueltaSalida = parseHora(tercero.vueltasEnv[tercero.vueltasEnv.length - 1].tiempoSalidaBascula);
        decCalcExtra3 = diffEnHoras(firstVueltaEntrada, lastVueltaSalida);
      }

      return {
        "Fecha Inicio": record.fechaInicio,
        "Tiempo Total": record.tiempoTotal || "-",
        "Nº Transacción": primer.numeroTransaccion || "-",
        "Nº Orden": primer.numeroOrden || "-",
        "Condición": primer.condicion || "-",
        "Pesador Entrada": primer.pesadorEntrada || "-",
        "Portería Entrada": primer.porteriaEntrada || "-",
        "Método Carga": primer.metodoCarga || "-",
        "Nº Ejes": primer.numeroEjes || "-",
        "Punto Despacho": primer.puntoDespacho || "-",
        "Punto Envasado": primer.puntoEnvasado || "-",
        "Báscula Entrada": primer.basculaEntrada || "-",
        "Tiempo Precheq.": primer.tiempoPrechequeo || "-",
        "Fecha Precheq.": primer.fechaPrechequeo || "-",
        "Obs Precheq.": primer.prechequeoObservaciones || "-",
        "Tiempo Scanner": primer.tiempoScanner || "-",
        "Fecha Scanner": primer.fechaScanner || "-",
        "Obs Scanner": primer.scannerObservaciones || "-",
        "Fecha Autorización": primer.fechaAutorizacion || "-",
        "Tiempo Autorizac.": primer.tiempoAutorizacion || "-",
        "Obs Autorizac.": primer.autorizacionObservaciones || "-",
        "Tiempo Ing. Planta": primer.tiempoIngresoPlanta || "-",
        "Obs Ingreso": primer.ingresoPlantaObservaciones || "-",
        "Tiempo Lleg. Básq. (P1)": primer.tiempoLlegadaBascula || "-",
        "Obs Lleg. Básq. (P1)": primer.llegadaBasculaObservaciones || "-",
        "Tiempo Entr. Básq. (P1)": primer.tiempoEntradaBascula || "-",
        "Obs Entr. Básq. (P1)": primer.entradaBasculaObservaciones || "-",
        "Tiempo Sal. Básq. (P1)": primer.tiempoSalidaBascula || "-",
        "Obs Sal. Básq. (P1)": primer.salidaBasculaObservaciones || "-",
        "Operador": segundo.operador || "-",
        "Grupo": segundo.grupo || "-",
        "Modelo Equipo": segundo.modeloEquipo || "-",
        "Personal Asig.": segundo.personalAsignado != null ? segundo.personalAsignado : "-",
        "Obs Personal Asig.": segundo.personalAsignadoObservaciones || "-",
        "Tiempo Lleg. Punto": segundo.tiempoLlegadaPunto || "-",
        "Obs Lleg. Punto": segundo.llegadaPuntoObservaciones || "-",
        "Tiempo Lleg. Oper.": segundo.tiempoLlegadaOperador || "-",
        "Obs Lleg. Oper.": segundo.llegadaOperadorObservaciones || "-",
        "Tiempo Lleg. Grupo": segundo.tiempoLlegadaGrupo || "-",
        "Obs Lleg. Grupo": segundo.llegadaGrupoObservaciones || "-",
        "Tiempo Lleg. Equipo": segundo.tiempoLlegadaEquipo || "-",
        "Obs Lleg. Equipo": segundo.llegadaEquipoObservaciones || "-",
        "Tiempo Inicio Carga": segundo.tiempoInicioCarga || "-",
        "Obs Inicio Carga": segundo.inicioCargaObservaciones || "-",
        "Tiempo Term. Carga": segundo.tiempoTerminaCarga || "-",
        "Obs Term. Carga": segundo.terminaCargaObservaciones || "-",
        "Tiempo Salida Punto": segundo.tiempoSalidaPunto || "-",
        "Obs Salida Punto": segundo.salidaPuntoObservaciones || "-",
        "Báscula Salida": tercero.basculaSalida || "-",
        "Pesador Salida": tercero.pesadorSalida || "-",
        "Tiempo Lleg. Básq. (P3)": tercero.tiempoLlegadaBascula || "-",
        "Obs Lleg. Básq. (P3)": tercero.llegadaBasculaObservaciones || "-",
        "Tiempo Entr. Básq. (P3)": tercero.tiempoEntradaBascula || "-",
        "Obs Entr. Básq. (P3)": tercero.entradaBasculaObservaciones || "-",
        "Tiempo Sal. Básq. (P3)": tercero.tiempoSalidaBascula || "-",
        "Obs Sal. Básq. (P3)": tercero.salidaBasculaObservaciones || "-",
        "Últ. Vuelta - Nº": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].numeroVuelta || "-"
                              : "-",
        "Últ. Vuelta - Lleg. Punto": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].tiempoLlegadaPunto || "-"
                              : "-",
        "Obs Lleg. Punto (V)": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].llegadaPuntoObservaciones || "-"
                              : "-",
        "Últ. Vuelta - Sal. Punto": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].tiempoSalidaPunto || "-"
                              : "-",
        "Obs Sal. Punto (V)": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].salidaPuntoObservaciones || "-"
                              : "-",
        "Últ. Vuelta - Lleg. Básq.": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].tiempoLlegadaBascula || "-"
                              : "-",
        "Obs Lleg. Básq. (V)": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].llegadaBasculaObservaciones || "-"
                              : "-",
        "Últ. Vuelta - Entr. Básq.": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].tiempoEntradaBascula || "-"
                              : "-",
        "Obs Entr. Básq. (V)": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].entradaBasculaObservaciones || "-"
                              : "-",
        "Últ. Vuelta - Sal. Básq.": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].tiempoSalidaBascula || "-"
                              : "-",
        "Obs Sal. Básq. (V)": (tercero.vueltasEnv && tercero.vueltasEnv.length > 0)
                              ? tercero.vueltasEnv[tercero.vueltasEnv.length - 1].salidaBasculaObservaciones || "-"
                              : "-",
        "Tiempo Salida Planta": final.tiempoSalidaPlanta || "-",
        "Obs Salida Planta": final.salidaPlantaObservaciones || "-",
        "Portería Salida": final.porteriaSalida || "-",
        "Tiempo Lleg. Portería": final.tiempoLlegadaPorteria || "-",
        "Obs Lleg. Portería": final.llegadaPorteriaObservaciones || "-",
        // Cálculos adicionales
        "Autorizac → Ing. Planta": formatInterval(decCalc8),
        "Ing. Planta → Lleg. Básq.": formatInterval(decCalcIngresoBascula),
        "Termina Carga → Salida Punto": formatInterval(decCalc12),
        "B.E. (Entr → Sal)": formatInterval(decCalc1),
        "Sal. B.E. → Lleg. Punto": formatInterval(decCalc2),
        "Punto → Inicio Carga": formatInterval(decCalc7),
        "Tiempo Total Carga": formatInterval(decCalc3),
        "Sal. Punto → B.S. Entr.": formatInterval(decCalc4),
        "B.S. (Entr → Sal)": formatInterval(decCalc5),
        "B.S. → Salida Planta": formatInterval(decCalc6),
        "Llegada → Entrada Básq. (P1)": formatInterval(decCalcExtra1),
        "Llegada → Entrada Básq. (P3)": formatInterval(decCalcExtra2),
        "Entrada (P3) Primera → Salida (P3) Última": tercero.vueltasEnv && tercero.vueltasEnv.length > 0
          ? formatInterval(decCalcExtra3)
          : "-",
      };
    });

    // 5) Definir las columnas para la hoja "Historial"
    const columnasExcel = [
      { header: "Fecha Inicio", key: "Fecha Inicio", width: 20 },
      { header: "Tiempo Total", key: "Tiempo Total", width: 20 },
      { header: "Nº Transacción", key: "Nº Transacción", width: 20 },
      { header: "Nº Orden", key: "Nº Orden", width: 20 },
      { header: "Condición", key: "Condición", width: 15 },
      { header: "Pesador Entrada", key: "Pesador Entrada", width: 20 },
      { header: "Portería Entrada", key: "Portería Entrada", width: 20 },
      { header: "Método Carga", key: "Método Carga", width: 20 },
      { header: "Nº Ejes", key: "Nº Ejes", width: 15 },
      { header: "Punto Despacho", key: "Punto Despacho", width: 25 },
      { header: "Punto Envasado", key: "Punto Envasado", width: 25 },
      { header: "Báscula Entrada", key: "Báscula Entrada", width: 20 },
      { header: "Hora Precheq.", key: "Tiempo Precheq.", width: 20 },
      { header: "Fecha Precheq.", key: "Fecha Precheq.", width: 20 },
      { header: "Obs Precheq.", key: "Obs Precheq.", width: 25 },
      { header: "Hora Scanner", key: "Tiempo Scanner", width: 20 },
      { header: "Fecha Scanner", key: "Fecha Scanner", width: 20 },
      { header: "Obs Scanner", key: "Obs Scanner", width: 25 },
      { header: "Fecha Autorización", key: "Fecha Autorización", width: 20 },
      { header: "Hora Autorizac.", key: "Tiempo Autorizac.", width: 20 },
      { header: "Obs Autorizac.", key: "Obs Autorizac.", width: 25 },
      { header: "Hora Ing. Planta", key: "Tiempo Ing. Planta", width: 20 },
      { header: "Obs Ingreso", key: "Obs Ingreso", width: 25 },
      { header: "Hora Lleg. Básq. (P1)", key: "Tiempo Lleg. Básq. (P1)", width: 20 },
      { header: "Obs Lleg. Básq. (P1)", key: "Obs Lleg. Básq. (P1)", width: 25 },
      { header: "Hora Entr. Básq. (P1)", key: "Tiempo Entr. Básq. (P1)", width: 20 },
      { header: "Obs Entr. Básq. (P1)", key: "Obs Entr. Básq. (P1)", width: 25 },
      { header: "Hora Sal. Básq. (P1)", key: "Tiempo Sal. Básq. (P1)", width: 20 },
      { header: "Obs Sal. Básq. (P1)", key: "Obs Sal. Básq. (P1)", width: 25 },
      { header: "Operador", key: "Operador", width: 20 },
      { header: "Grupo", key: "Grupo", width: 20 },
      { header: "Modelo Equipo", key: "Modelo Equipo", width: 25 },
      { header: "Personal Asig.", key: "Personal Asig.", width: 20 },
      { header: "Obs Personal Asig.", key: "Obs Personal Asig.", width: 25 },
      { header: "Hora Lleg. Punto", key: "Tiempo Lleg. Punto", width: 20 },
      { header: "Obs Lleg. Punto", key: "Obs Lleg. Punto", width: 25 },
      { header: "Hora Lleg. Oper.", key: "Tiempo Lleg. Oper.", width: 20 },
      { header: "Obs Lleg. Oper.", key: "Obs Lleg. Oper.", width: 25 },
      { header: "Hora Lleg. Grupo", key: "Tiempo Lleg. Grupo", width: 20 },
      { header: "Obs Lleg. Grupo", key: "Obs Lleg. Grupo", width: 25 },
      { header: "Hora Lleg. Equipo", key: "Tiempo Lleg. Equipo", width: 20 },
      { header: "Obs Lleg. Equipo", key: "Obs Lleg. Equipo", width: 25 },
      { header: "Hora Inicio Carga", key: "Tiempo Inicio Carga", width: 20 },
      { header: "Obs Inicio Carga", key: "Obs Inicio Carga", width: 25 },
      { header: "Hora Term. Carga", key: "Tiempo Term. Carga", width: 20 },
      { header: "Obs Term. Carga", key: "Obs Term. Carga", width: 25 },
      { header: "Hora Salida Punto", key: "Tiempo Salida Punto", width: 20 },
      { header: "Obs Salida Punto", key: "Obs Salida Punto", width: 25 },
      { header: "Báscula Salida", key: "Báscula Salida", width: 20 },
      { header: "Pesador Salida", key: "Pesador Salida", width: 20 },
      { header: "Hora Lleg. Básq. (P3)", key: "Tiempo Lleg. Básq. (P3)", width: 20 },
      { header: "Obs Lleg. Básq. (P3)", key: "Obs Lleg. Básq. (P3)", width: 25 },
      { header: "Hora Entr. Básq. (P3)", key: "Tiempo Entr. Básq. (P3)", width: 20 },
      { header: "Obs Entr. Básq. (P3)", key: "Obs Entr. Básq. (P3)", width: 25 },
      { header: "Hora Sal. Básq. (P3)", key: "Tiempo Sal. Básq. (P3)", width: 20 },
      { header: "Obs Sal. Básq. (P3)", key: "Obs Sal. Básq. (P3)", width: 25 },
      { header: "Últ. Vuelta - Nº", key: "Últ. Vuelta - Nº", width: 20 },
      { header: "Últ. Vuelta - Lleg. Punto", key: "Últ. Vuelta - Lleg. Punto", width: 20 },
      { header: "Obs Lleg. Punto (V)", key: "Obs Lleg. Punto (V)", width: 25 },
      { header: "Últ. Vuelta - Sal. Punto", key: "Últ. Vuelta - Sal. Punto", width: 20 },
      { header: "Obs Sal. Punto (V)", key: "Obs Sal. Punto (V)", width: 25 },
      { header: "Últ. Vuelta - Lleg. Básq.", key: "Últ. Vuelta - Lleg. Básq.", width: 20 },
      { header: "Obs Lleg. Básq. (V)", key: "Obs Lleg. Básq. (V)", width: 25 },
      { header: "Últ. Vuelta - Entr. Básq.", key: "Últ. Vuelta - Entr. Básq.", width: 20 },
      { header: "Obs Entr. Básq. (V)", key: "Obs Entr. Básq. (V)", width: 25 },
      { header: "Últ. Vuelta - Sal. Básq.", key: "Últ. Vuelta - Sal. Básq.", width: 20 },
      { header: "Obs Sal. Básq. (V)", key: "Obs Sal. Básq. (V)", width: 25 },
      { header: "Hora Salida Planta", key: "Tiempo Salida Planta", width: 20 },
      { header: "Obs Salida Planta", key: "Obs Salida Planta", width: 25 },
      { header: "Portería Salida", key: "Portería Salida", width: 20 },
      { header: "Hora Lleg. Portería", key: "Tiempo Lleg. Portería", width: 20 },
      { header: "Obs Lleg. Portería", key: "Obs Lleg. Portería", width: 25 },
      { header: "Autorizac → Ing. Planta", key: "Autorizac → Ing. Planta", width: 20 },
      { header: "Ing. Planta → Lleg. Básq.", key: "Ing. Planta → Lleg. Básq.", width: 20 },
      { header: "Llegada → Entrada Básq. (P1)", key: "Llegada → Entrada Básq. (P1)", width: 20 },
      { header: "B.E. (Entr → Sal)", key: "B.E. (Entr → Sal)", width: 20 },
      { header: "Sal. B.E. → Lleg. Punto", key: "Sal. B.E. → Lleg. Punto", width: 20 },
      { header: "Punto → Inicio Carga", key: "Punto → Inicio Carga", width: 20 },
      { header: "Tiempo Total Carga", key: "Tiempo Total Carga", width: 20 },
      { header: "Termina Carga → Salida Punto", key: "Termina Carga → Salida Punto", width: 25 },
      { header: "Llegada → Entrada Básq. (P3)", key: "Llegada → Entrada Básq. (P3)", width: 20 },
      { header: "Sal. Punto → B.S. Entr.", key: "Sal. Punto → B.S. Entr.", width: 20 },
      { header: "Entrada (P3) Primera → Salida (P3) Última", key: "Entrada (P3) Primera → Salida (P3) Última", width: 25 },
      { header: "B.S. (Entr → Sal)", key: "B.S. (Entr → Sal)", width: 20 },
      { header: "B.S. → Salida Planta", key: "B.S. → Salida Planta", width: 20 }
    ];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Historial");
    sheet.columns = columnasExcel;
    rows.forEach((row) => {
      sheet.addRow(row);
    });

    // 6) Procesar los datos de "Vueltas" (usando tercerProceso.vueltasEnv)
    let datosVueltas = [];
    registrosFiltrados.forEach((record) => {
      const vueltas = record.tercerProceso?.vueltasEnv;
      const numTransaccion = record.primerProceso?.numeroTransaccion || "-";
      if (Array.isArray(vueltas) && vueltas.length > 0) {
        vueltas.forEach((vuelta, index) => {
          const llegadaPunto = parseHora(vuelta.tiempoLlegadaPunto);
          const salidaPunto = parseHora(vuelta.tiempoSalidaPunto);
          const llegadaBascula = parseHora(vuelta.tiempoLlegadaBascula);
          const entradaBascula = parseHora(vuelta.tiempoEntradaBascula);
          const salidaBascula = parseHora(vuelta.tiempoSalidaBascula);

          const calcA = (llegadaPunto && salidaPunto)
            ? formatInterval(diffEnHoras(llegadaPunto, salidaPunto))
            : "-";
          const calcB = (salidaPunto && llegadaBascula)
            ? formatInterval(diffEnHoras(salidaPunto, llegadaBascula))
            : "-";
          const calcC = (llegadaBascula && entradaBascula)
            ? formatInterval(diffEnHoras(llegadaBascula, entradaBascula))
            : "-";
          const tiempoVuelta = (entradaBascula && salidaBascula)
            ? formatInterval(diffEnHoras(entradaBascula, salidaBascula))
            : "-";

          datosVueltas.push({
            id: vuelta.id,
            "Nº Transacción": numTransaccion,
            tercerProcesoEnvId: vuelta.tercerProcesoEnvId,
            numeroVuelta: index + 1,
            tiempoLlegadaPunto: vuelta.tiempoLlegadaPunto,
            llegadaPuntoObservaciones: vuelta.llegadaPuntoObservaciones,
            tiempoSalidaPunto: vuelta.tiempoSalidaPunto,
            salidaPuntoObservaciones: vuelta.salidaPuntoObservaciones,
            tiempoLlegadaBascula: vuelta.tiempoLlegadaBascula,
            llegadaBasculaObservaciones: vuelta.llegadaBasculaObservaciones,
            tiempoEntradaBascula: vuelta.tiempoEntradaBascula,
            entradaBasculaObservaciones: vuelta.entradaBasculaObservaciones,
            tiempoSalidaBascula: vuelta.tiempoSalidaBascula,
            salidaBasculaObservaciones: vuelta.salidaBasculaObservaciones,
            "Tiempo Vuelta": tiempoVuelta,
            "Llegada Punto → Salida Punto": calcA,
            "Salida Punto → Llegada Báscula": calcB,
            "Llegada Báscula → Entrada Báscula": calcC,
          });
        });
      }
    });

    const vueltasColumnsOrder = [
      { header: "ID", key: "id", width: 10 },
      { header: "Nº Transacción", key: "Nº Transacción", width: 20 },
      { header: "Nº Registro", key: "tercerProcesoEnvId", width: 15 },
      { header: "Nº Vuelta", key: "numeroVuelta", width: 15 },
      { header: "Hora Llegada Punto", key: "tiempoLlegadaPunto", width: 20 },
      { header: "Obs Llegada Punto", key: "llegadaPuntoObservaciones", width: 25 },
      { header: "Hora Salida Punto", key: "tiempoSalidaPunto", width: 20 },
      { header: "Obs Salida Punto", key: "salidaPuntoObservaciones", width: 25 },
      { header: "Hora Llegada Báscula", key: "tiempoLlegadaBascula", width: 20 },
      { header: "Obs Llegada Báscula", key: "llegadaBasculaObservaciones", width: 25 },
      { header: "Hora Entrada Báscula", key: "tiempoEntradaBascula", width: 20 },
      { header: "Obs Entrada Báscula", key: "entradaBasculaObservaciones", width: 25 },
      { header: "Hora Salida Báscula", key: "tiempoSalidaBascula", width: 20 },
      { header: "Obs Salida Báscula", key: "salidaBasculaObservaciones", width: 25 },
      { header: "Tiempo Vuelta", key: "Tiempo Vuelta", width: 20 },
      { header: "Llegada Punto → Salida Punto", key: "Llegada Punto → Salida Punto", width: 20 },
      { header: "Salida Punto → Llegada Báscula", key: "Salida Punto → Llegada Báscula", width: 20 },
      { header: "Llegada Báscula → Entrada Báscula", key: "Llegada Báscula → Entrada Báscula", width: 20 },
    ];

    if (datosVueltas.length > 0) {
      const sheetVueltas = workbook.addWorksheet("Vueltas");
      sheetVueltas.columns = vueltasColumnsOrder;
      datosVueltas.forEach((row) => {
        sheetVueltas.addRow(row);
      });
    }

    // 7) Procesar los datos de "Paros" (desde segundoProceso.parosEnv)
    let datosParos = [];
    registrosFiltrados.forEach((record) => {
      const paros = record.segundoProceso?.parosEnv;
      const numTransaccion = record.primerProceso?.numeroTransaccion || "-";
      const numOrden = record.primerProceso?.numeroOrden || "-";
      if (Array.isArray(paros) && paros.length > 0) {
        paros.forEach((paro) => {
          datosParos.push({
            id: paro.id,
            "Nº Transacción": numTransaccion,
            "Nº Orden": numOrden,
            inicio: paro.inicio,
            fin: paro.fin,
            razon: paro.razon,
            "Diff Carga Inicio": paro.diffCargaInicio,
            "Duración Paro": paro.duracionParo,
          });
        });
      }
    });

    const parosColumnsOrder = [
      { header: "ID", key: "id", width: 10 },
      { header: "Nº Transacción", key: "Nº Transacción", width: 20 },
      { header: "Nº Orden", key: "Nº Orden", width: 20 },
      { header: "Inicio", key: "inicio", width: 20 },
      { header: "Fin", key: "fin", width: 20 },
      { header: "Razón", key: "razon", width: 25 },
      { header: "Diff Carga Inicio", key: "Diff Carga Inicio", width: 20 },
      { header: "Duración Paro", key: "Duración Paro", width: 20 },
    ];

    if (datosParos.length > 0) {
      const sheetParos = workbook.addWorksheet("Paros");
      sheetParos.columns = parosColumnsOrder;
      datosParos.forEach((row) => {
        sheetParos.addRow(row);
      });
    }

    // 8) Generar el buffer y retornar la respuesta
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = getFileName();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("Error generando Excel:", err);
    return NextResponse.json({ error: "Error generando Excel" }, { status: 500 });
  }
}
