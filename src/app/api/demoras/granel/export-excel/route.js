// /api/demoras/granel/export-excel/route.js  
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
  return `Data ${yyyy}-${mm}-${dd} ${hh}-${min}.xlsx`;
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

    // 2) Obtener todos los registros de Demora (incluyendo relaciones)
    const registros = await prisma.demora.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        primerProceso: true,
        segundoProceso: true,
        tercerProceso: { include: { vueltas: true } },
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
    // Se calculan los 6 intervalos originales, 2 cálculos adicionales ya existentes,
    // el cálculo "Ingreso Planta → Llegada Báscula" y 3 nuevos cálculos.
    // Además, se agrega el cálculo entre la llegada de la unidad al punto y el inicio de la carga.
    const rows = registrosFiltrados.map((record) => {
      const primer = record.primerProceso || {};
      const segundo = record.segundoProceso || {};
      const tercero = record.tercerProceso || {};
      const final = record.procesoFinal || {};

      // CORRECCIÓN en el primer proceso: diferencia de horas entre salida y entrada de báscula (P1)
      const decCalc1 = diffEnHoras(parseHora(primer.tiempoEntradaBascula), parseHora(primer.tiempoSalidaBascula));
      const decCalc2 = diffEnHoras(parseHora(primer.tiempoSalidaBascula), parseHora(segundo.tiempoLlegadaPunto));
      // NUEVO cálculo: entre la llegada al punto y el inicio de la carga (segundo proceso)
      const decCalc7 = diffEnHoras(parseHora(segundo.tiempoLlegadaPunto), parseHora(segundo.tiempoInicioCarga));
      const decCalc3 = diffEnHoras(parseHora(segundo.tiempoInicioCarga), parseHora(segundo.tiempoTerminaCarga));
      let entradaBS = null;
      let salidaBS = null;
      if (tercero.vueltas && tercero.vueltas.length > 0) {
        const lastVuelta = tercero.vueltas[tercero.vueltas.length - 1];
        entradaBS = parseHora(lastVuelta.tiempoEntradaBascula);
        salidaBS = parseHora(lastVuelta.tiempoSalidaBascula);
      }
      const decCalc4 = diffEnHoras(parseHora(segundo.tiempoSalidaPunto), entradaBS);
      const decCalc5 = diffEnHoras(entradaBS, salidaBS);
      const decCalc6 = diffEnHoras(salidaBS, parseHora(final.tiempoSalidaPlanta));

      // Cálculos adicionales ya existentes
      const decCalc8 = diffEnHoras(parseHora(primer.tiempoAutorizacion), parseHora(primer.tiempoIngresoPlanta));
      const decCalc12 = diffEnHoras(parseHora(segundo.tiempoTerminaCarga), parseHora(segundo.tiempoSalidaPunto));
      
      // Cálculo existente: Ingreso Planta → Llegada Báscula
      const decCalcIngresoBascula = diffEnHoras(parseHora(primer.tiempoIngresoPlanta), parseHora(primer.tiempoLlegadaBascula));

      // NUEVOS cálculos solicitados:
      // a) Llegada → Entrada Básq. (P1): Primer proceso
      const decCalcExtra1 = diffEnHoras(parseHora(primer.tiempoLlegadaBascula), parseHora(primer.tiempoEntradaBascula));
      // b) Llegada → Entrada Básq. (P3): Tercer proceso
      const decCalcExtra2 = diffEnHoras(parseHora(tercero.tiempoLlegadaBascula), parseHora(tercero.tiempoEntradaBascula));
      // c) Entrada (P3) Primera → Salida (P3) Última: Usando las vueltas del tercer proceso
      let decCalcExtra3 = 0;
      if (tercero.vueltas && tercero.vueltas.length > 0) {
        const firstVueltaEntrada = parseHora(tercero.vueltas[0].tiempoEntradaBascula);
        const lastVueltaSalida = parseHora(tercero.vueltas[tercero.vueltas.length - 1].tiempoSalidaBascula);
        decCalcExtra3 = diffEnHoras(firstVueltaEntrada, lastVueltaSalida);
      }

      return {
        "Fecha Inicio": record.fechaInicio,
        "Tiempo Total": record.tiempoTotal || "-",
        "Nº Transacción": primer.numeroTransaccion || "-",
        "Condición": primer.condicion || "-",
        "Pesador Entrada": primer.pesadorEntrada || "-",
        "Portería Entrada": primer.porteriaEntrada || "-",
        "Método Carga": primer.metodoCarga || "-",
        "Nº Ejes": primer.numeroEjes || "-",
        "Punto Despacho": primer.puntoDespacho || "-",
        "Báscula Entrada": primer.basculaEntrada || "-",
        "Tiempo Precheq.": primer.tiempoPrechequeo || "-",
        "Fecha Precheq.": primer.fechaPrechequeo || "-",
        "Obs Precheq.": primer.prechequeoObservaciones || "-",
        "Tiempo Scanner": primer.tiempoScanner || "-",
        "Fecha Scanner": primer.fechaScanner || "-",
        "Obs Scanner": primer.scannerObservaciones || "-",
        "Fecha Autorización": primer.fechaAutorizacion || "-",
        "Tiempo Autorizac.": primer.tiempoAutorizacion || "-",
        "Fecha Autorizac.": primer.fechaAutorizacion || "-",
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
        "Enlonador": segundo.enlonador || "-",
        "Modelo Equipo": segundo.modeloEquipo || "-",
        "Personal Asig.": segundo.personalAsignado != null ? segundo.personalAsignado : "-",
        "Obs Personal Asig.": segundo.personalAsignadoObservaciones || "-",
        "Tiempo Lleg. Punto": segundo.tiempoLlegadaPunto || "-",
        "Obs Lleg. Punto": segundo.llegadaPuntoObservaciones || "-",
        "Tiempo Lleg. Oper.": segundo.tiempoLlegadaOperador || "-",
        "Obs Lleg. Oper.": segundo.llegadaOperadorObservaciones || "-",
        "Tiempo Lleg. Enlon.": segundo.tiempoLlegadaEnlonador || "-",
        "Obs Lleg. Enlon.": segundo.llegadaEnlonadorObservaciones || "-",
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
        "Últ. Vuelta - Nº": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].numeroVuelta || "-"
                              : "-",
        "Últ. Vuelta - Lleg. Punto": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].tiempoLlegadaPunto || "-"
                              : "-",
        "Obs Lleg. Punto (V)": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].llegadaPuntoObservaciones || "-"
                              : "-",
        "Últ. Vuelta - Sal. Punto": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].tiempoSalidaPunto || "-"
                              : "-",
        "Obs Sal. Punto (V)": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].salidaPuntoObservaciones || "-"
                              : "-",
        "Últ. Vuelta - Lleg. Básq.": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].tiempoLlegadaBascula || "-"
                              : "-",
        "Obs Lleg. Básq. (V)": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].llegadaBasculaObservaciones || "-"
                              : "-",
        "Últ. Vuelta - Entr. Básq.": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].tiempoEntradaBascula || "-"
                              : "-",
        "Obs Entr. Básq. (V)": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].entradaBasculaObservaciones || "-"
                              : "-",
        "Últ. Vuelta - Sal. Básq.": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].tiempoSalidaBascula || "-"
                              : "-",
        "Obs Sal. Básq. (V)": (tercero.vueltas && tercero.vueltas.length > 0)
                              ? tercero.vueltas[tercero.vueltas.length - 1].salidaBasculaObservaciones || "-"
                              : "-",
        "Tiempo Salida Planta": final.tiempoSalidaPlanta || "-",
        "Obs Salida Planta": final.salidaPlantaObservaciones || "-",
        "Portería Salida": final.porteriaSalida || "-",
        "Tiempo Lleg. Portería": final.tiempoLlegadaPorteria || "-",
        "Obs Lleg. Portería": final.llegadaPorteriaObservaciones || "-",
        // Cálculos originales en formato HH:MM:SS (con validación de no negativos)
        "B.E. (Entr → Sal)": formatInterval(decCalc1),
        "Sal. B.E. → Lleg. Punto": formatInterval(decCalc2),
        "Tiempo Total Carga": formatInterval(decCalc3),
        "Sal. Punto → B.S. Entr.": formatInterval(decCalc4),
        "B.S. (Entr → Sal)": formatInterval(decCalc5),
        "B.S. → Salida Planta": formatInterval(decCalc6),
        // Cálculos adicionales en formato HH:MM:SS
        "Autorizac → Ing. Planta": formatInterval(decCalc8),
        "Termina Carga → Salida Punto": formatInterval(decCalc12),
        "Ing. Planta → Lleg. Básq.": formatInterval(decCalcIngresoBascula),
        // NUEVOS cálculos:
        "Llegada → Entrada Básq. (P1)": formatInterval(decCalcExtra1),
        "Llegada → Entrada Básq. (P3)": formatInterval(decCalcExtra2),
        "Entrada (P3) Primera → Salida (P3) Última": tercero.vueltas && tercero.vueltas.length > 0
          ? formatInterval(decCalcExtra3)
          : "-",
        "Punto → Inicio Carga": formatInterval(decCalc7)
      };
    });

    // 5) Definir las columnas para la hoja "Historial"
    const columnasExcel = [
      { header: "Fecha Inicio", key: "Fecha Inicio", width: 20 },
      { header: "Tiempo Total", key: "Tiempo Total", width: 20 },
      { header: "Nº Transacción", key: "Nº Transacción", width: 20 },
      { header: "Condición", key: "Condición", width: 15 },
      { header: "Pesador Entrada", key: "Pesador Entrada", width: 20 },
      { header: "Portería Entrada", key: "Portería Entrada", width: 20 },
      { header: "Método Carga", key: "Método Carga", width: 20 },
      { header: "Nº Ejes", key: "Nº Ejes", width: 15 },
      { header: "Punto Despacho", key: "Punto Despacho", width: 25 },
      { header: "Báscula Entrada", key: "Báscula Entrada", width: 20 },
      { header: "Hora Precheq.", key: "Tiempo Precheq.", width: 20 },
      { header: "Fecha Precheq.", key: "Fecha Precheq.", width: 20 },
      { header: "Obs Precheq.", key: "Obs Precheq.", width: 25 },
      { header: "Hora Scanner", key: "Tiempo Scanner", width: 20 },
      { header: "Fecha Scanner", key: "Fecha Scanner", width: 20 },
      { header: "Obs Scanner", key: "Obs Scanner", width: 25 },
      { header: "Fecha Autorización", key: "Fecha Autorización", width: 20 },
      { header: "Hora Autorizac.", key: "Tiempo Autorizac.", width: 20 },
      { header: "Fecha Autorizac.", key: "Fecha Autorizac.", width: 20 },
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
      { header: "Enlonador", key: "Enlonador", width: 20 },
      { header: "Modelo Equipo", key: "Modelo Equipo", width: 25 },
      { header: "Personal Asig.", key: "Personal Asig.", width: 20 },
      { header: "Obs Personal Asig.", key: "Obs Personal Asig.", width: 25 },
      { header: "Hora Lleg. Punto", key: "Tiempo Lleg. Punto", width: 20 },
      { header: "Obs Lleg. Punto", key: "Obs Lleg. Punto", width: 25 },
      { header: "Hora Lleg. Oper.", key: "Tiempo Lleg. Oper.", width: 20 },
      { header: "Obs Lleg. Oper.", key: "Obs Lleg. Oper.", width: 25 },
      { header: "Hora Lleg. Enlon.", key: "Tiempo Lleg. Enlon.", width: 20 },
      { header: "Obs Lleg. Enlon.", key: "Obs Lleg. Enlon.", width: 25 },
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
      { header: "Lleg. Punto → Inicio Carga", key: "Punto → Inicio Carga", width: 20 },
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

    // 6) Procesar los datos de "Vueltas": definir el orden fijo y agregar cálculos adicionales
    let datosVueltas = [];
    registrosFiltrados.forEach((record) => {
      const vueltas = record.tercerProceso?.vueltas;
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
            "Numero Transaccion": numTransaccion,
            tercerProcesoId: vuelta.tercerProcesoId, // N° Registro
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
      { header: "N° Transaccion", key: "Numero Transaccion", width: 20 },
      { header: "N° Registro", key: "tercerProcesoId", width: 15 },
      { header: "N° Vuelta", key: "numeroVuelta", width: 15 },
      { header: "Hora Llegada Punto", key: "tiempoLlegadaPunto", width: 20 },
      { header: "Observaciones Llegada Punto", key: "llegadaPuntoObservaciones", width: 25 },
      { header: "Hora Salida Punto", key: "tiempoSalidaPunto", width: 20 },
      { header: "Observaciones Salida Punto", key: "salidaPuntoObservaciones", width: 25 },
      { header: "Hora Llegada Báscula", key: "tiempoLlegadaBascula", width: 20 },
      { header: "Observaciones Llegada Báscula", key: "llegadaBasculaObservaciones", width: 25 },
      { header: "Hora Entrada Báscula", key: "tiempoEntradaBascula", width: 20 },
      { header: "Observaciones Entrada Báscula", key: "entradaBasculaObservaciones", width: 25 },
      { header: "Hora Salida Báscula", key: "tiempoSalidaBascula", width: 20 },
      { header: "Observaciones Salida Báscula", key: "salidaBasculaObservaciones", width: 25 },
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

    // 7) Generar el buffer y retornar la respuesta
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
