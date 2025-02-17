// /api/demoras/export-excel/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import ExcelJS from "exceljs";

/** Umbral de horas para considerar “demora” (para análisis, si se requiere) */
const UMBRAL_DEMORA = 2;

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
 */
function formatInterval(hoursDecimal) {
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

    // Variables para análisis
    let sumHoras = 0;
    let countValid = 0;
    let totalDemoras = 0;

    // 4) Construir las filas de la hoja "Demoras" con los mismos campos que la tabla de la UI
    const rows = registrosFiltrados.map((record) => {
      const primer = record.primerProceso || {};
      const segundo = record.segundoProceso || {};
      const tercero = record.tercerProceso || {};
      const final = record.procesoFinal || {};

      // Calcular intervalos en horas decimales y convertir a formato HH:MM:SS
      const calc1 = formatInterval(diffEnHoras(parseHora(primer.tiempoEntradaBascula), parseHora(primer.tiempoSalidaBascula)));
      const calc2 = formatInterval(diffEnHoras(parseHora(primer.tiempoSalidaBascula), parseHora(segundo.tiempoLlegadaPunto)));
      const calc3 = formatInterval(diffEnHoras(parseHora(segundo.tiempoInicioCarga), parseHora(segundo.tiempoTerminaCarga)));
      let entradaBS = null;
      let salidaBS = null;
      if (tercero.vueltas && tercero.vueltas.length > 0) {
        const lastVuelta = tercero.vueltas[tercero.vueltas.length - 1];
        entradaBS = parseHora(lastVuelta.tiempoEntradaBascula);
        salidaBS = parseHora(lastVuelta.tiempoSalidaBascula);
      }
      const calc4 = formatInterval(diffEnHoras(parseHora(segundo.tiempoSalidaPunto), entradaBS));
      const calc5 = formatInterval(diffEnHoras(entradaBS, salidaBS));
      const calc6 = formatInterval(diffEnHoras(salidaBS, parseHora(final.tiempoSalidaPlanta)));

      // Extraer datos de la última vuelta, si existe
      let ultVueltaNum = "-";
      let ultVueltaLlegPunto = "-";
      let ultVueltaObsLlegPunto = "-";
      let ultVueltaSalPunto = "-";
      let ultVueltaObsSalPunto = "-";
      let ultVueltaLlegBascula = "-";
      let ultVueltaObsLlegBascula = "-";
      let ultVueltaEntrBascula = "-";
      let ultVueltaObsEntrBascula = "-";
      let ultVueltaSalBascula = "-";
      let ultVueltaObsSalBascula = "-";
      if (tercero.vueltas && tercero.vueltas.length > 0) {
        const lastVuelta = tercero.vueltas[tercero.vueltas.length - 1];
        ultVueltaNum = lastVuelta.numeroVuelta || "-";
        ultVueltaLlegPunto = lastVuelta.tiempoLlegadaPunto || "-";
        ultVueltaObsLlegPunto = lastVuelta.llegadaPuntoObservaciones || "-";
        ultVueltaSalPunto = lastVuelta.tiempoSalidaPunto || "-";
        ultVueltaObsSalPunto = lastVuelta.salidaPuntoObservaciones || "-";
        ultVueltaLlegBascula = lastVuelta.tiempoLlegadaBascula || "-";
        ultVueltaObsLlegBascula = lastVuelta.llegadaBasculaObservaciones || "-";
        ultVueltaEntrBascula = lastVuelta.tiempoEntradaBascula || "-";
        ultVueltaObsEntrBascula = lastVuelta.entradaBasculaObservaciones || "-";
        ultVueltaSalBascula = lastVuelta.tiempoSalidaBascula || "-";
        ultVueltaObsSalBascula = lastVuelta.salidaBasculaObservaciones || "-";
      }

      // Calcular horas totales (para análisis)
      let horasTotales = 0;
      if (record.fechaInicio) {
        const fechaHoraInicio = parseFechaHora(record.fechaInicio);
        const horaSalidaStr = final.tiempoSalidaPlanta?.hora || "";
        const horaSalidaDate = parseHora(horaSalidaStr);
        if (fechaHoraInicio && horaSalidaDate) {
          const salidaFull = new Date(fechaHoraInicio);
          salidaFull.setHours(horaSalidaDate.getHours());
          salidaFull.setMinutes(horaSalidaDate.getMinutes());
          salidaFull.setSeconds(horaSalidaDate.getSeconds());
          horasTotales = diffEnHoras(fechaHoraInicio, salidaFull);
          sumHoras += horasTotales;
          countValid++;
          if (horasTotales >= UMBRAL_DEMORA) {
            totalDemoras++;
          }
        }
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
        "Últ. Vuelta - Nº": ultVueltaNum,
        "Últ. Vuelta - Lleg. Punto": ultVueltaLlegPunto,
        "Obs Lleg. Punto (V)": ultVueltaObsLlegPunto,
        "Últ. Vuelta - Sal. Punto": ultVueltaSalPunto,
        "Obs Sal. Punto (V)": ultVueltaObsSalPunto,
        "Últ. Vuelta - Lleg. Básq.": ultVueltaLlegBascula,
        "Obs Lleg. Básq. (V)": ultVueltaObsLlegBascula,
        "Últ. Vuelta - Entr. Básq.": ultVueltaEntrBascula,
        "Obs Entr. Básq. (V)": ultVueltaObsEntrBascula,
        "Últ. Vuelta - Sal. Básq.": ultVueltaSalBascula,
        "Obs Sal. Básq. (V)": ultVueltaObsSalBascula,
        "Tiempo Salida Planta": final.tiempoSalidaPlanta || "-",
        "Obs Salida Planta": final.salidaPlantaObservaciones || "-",
        "Portería Salida": final.porteriaSalida || "-",
        "Tiempo Lleg. Portería": final.tiempoLlegadaPorteria || "-",
        "Obs Lleg. Portería": final.llegadaPorteriaObservaciones || "-",
        "B.E. (Entr → Sal)": calc1,
        "Sal. B.E. → Lleg. Punto": calc2,
        "Carga": calc3,
        "Sal. Punto → B.S. Entr.": calc4,
        "B.S. (Entr → Sal)": calc5,
        "B.S. → Planta": calc6
      };
    });

    // 5) Definir las columnas de Excel exactamente en el mismo orden que la tabla actual
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
      { header: "Tiempo Precheq.", key: "Tiempo Precheq.", width: 20 },
      { header: "Fecha Precheq.", key: "Fecha Precheq.", width: 20 },
      { header: "Obs Precheq.", key: "Obs Precheq.", width: 25 },
      { header: "Tiempo Scanner", key: "Tiempo Scanner", width: 20 },
      { header: "Fecha Scanner", key: "Fecha Scanner", width: 20 },
      { header: "Obs Scanner", key: "Obs Scanner", width: 25 },
      { header: "Fecha Autorización", key: "Fecha Autorización", width: 20 },
      { header: "Tiempo Autorizac.", key: "Tiempo Autorizac.", width: 20 },
      { header: "Fecha Autorizac.", key: "Fecha Autorizac.", width: 20 },
      { header: "Obs Autorizac.", key: "Obs Autorizac.", width: 25 },
      { header: "Tiempo Ing. Planta", key: "Tiempo Ing. Planta", width: 20 },
      { header: "Obs Ingreso", key: "Obs Ingreso", width: 25 },
      { header: "Tiempo Lleg. Básq. (P1)", key: "Tiempo Lleg. Básq. (P1)", width: 20 },
      { header: "Obs Lleg. Básq. (P1)", key: "Obs Lleg. Básq. (P1)", width: 25 },
      { header: "Tiempo Entr. Básq. (P1)", key: "Tiempo Entr. Básq. (P1)", width: 20 },
      { header: "Obs Entr. Básq. (P1)", key: "Obs Entr. Básq. (P1)", width: 25 },
      { header: "Tiempo Sal. Básq. (P1)", key: "Tiempo Sal. Básq. (P1)", width: 20 },
      { header: "Obs Sal. Básq. (P1)", key: "Obs Sal. Básq. (P1)", width: 25 },
      { header: "Operador", key: "Operador", width: 20 },
      { header: "Enlonador", key: "Enlonador", width: 20 },
      { header: "Modelo Equipo", key: "Modelo Equipo", width: 25 },
      { header: "Personal Asig.", key: "Personal Asig.", width: 20 },
      { header: "Obs Personal Asig.", key: "Obs Personal Asig.", width: 25 },
      { header: "Tiempo Lleg. Punto", key: "Tiempo Lleg. Punto", width: 20 },
      { header: "Obs Lleg. Punto", key: "Obs Lleg. Punto", width: 25 },
      { header: "Tiempo Lleg. Oper.", key: "Tiempo Lleg. Oper.", width: 20 },
      { header: "Obs Lleg. Oper.", key: "Obs Lleg. Oper.", width: 25 },
      { header: "Tiempo Lleg. Enlon.", key: "Tiempo Lleg. Enlon.", width: 20 },
      { header: "Obs Lleg. Enlon.", key: "Obs Lleg. Enlon.", width: 25 },
      { header: "Tiempo Lleg. Equipo", key: "Tiempo Lleg. Equipo", width: 20 },
      { header: "Obs Lleg. Equipo", key: "Obs Lleg. Equipo", width: 25 },
      { header: "Tiempo Inicio Carga", key: "Tiempo Inicio Carga", width: 20 },
      { header: "Obs Inicio Carga", key: "Obs Inicio Carga", width: 25 },
      { header: "Tiempo Term. Carga", key: "Tiempo Term. Carga", width: 20 },
      { header: "Obs Term. Carga", key: "Obs Term. Carga", width: 25 },
      { header: "Tiempo Salida Punto", key: "Tiempo Salida Punto", width: 20 },
      { header: "Obs Salida Punto", key: "Obs Salida Punto", width: 25 },
      { header: "Báscula Salida", key: "Báscula Salida", width: 20 },
      { header: "Pesador Salida", key: "Pesador Salida", width: 20 },
      { header: "Tiempo Lleg. Básq. (P3)", key: "Tiempo Lleg. Básq. (P3)", width: 20 },
      { header: "Obs Lleg. Básq. (P3)", key: "Obs Lleg. Básq. (P3)", width: 25 },
      { header: "Tiempo Entr. Básq. (P3)", key: "Tiempo Entr. Básq. (P3)", width: 20 },
      { header: "Obs Entr. Básq. (P3)", key: "Obs Entr. Básq. (P3)", width: 25 },
      { header: "Tiempo Sal. Básq. (P3)", key: "Tiempo Sal. Básq. (P3)", width: 20 },
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
      { header: "Tiempo Salida Planta", key: "Tiempo Salida Planta", width: 20 },
      { header: "Obs Salida Planta", key: "Obs Salida Planta", width: 25 },
      { header: "Portería Salida", key: "Portería Salida", width: 20 },
      { header: "Tiempo Lleg. Portería", key: "Tiempo Lleg. Portería", width: 20 },
      { header: "Obs Lleg. Portería", key: "Obs Lleg. Portería", width: 25 },
      { header: "B.E. (Entr → Sal)", key: "B.E. (Entr → Sal)", width: 20 },
      { header: "Sal. B.E. → Lleg. Punto", key: "Sal. B.E. → Lleg. Punto", width: 20 },
      { header: "Tiempo Total Carga", key: "Carga", width: 20 },
      { header: "Sal. Punto → B.S. Entr.", key: "Sal. Punto → B.S. Entr.", width: 20 },
      { header: "B.S. (Entr → Sal)", key: "B.S. (Entr → Sal)", width: 20 },
      { header: "B.S. → Planta", key: "B.S. → Planta", width: 20 },
    ];

    // 6) Crear el workbook y la hoja "Demoras"
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Demoras");
    sheet.columns = columnasExcel;
    rows.forEach((row) => {
      sheet.addRow(row);
    });
    // Se formatean los campos de cálculo (si se desean, se pueden aplicar formatos personalizados aquí)

    // 7) Agregar hoja "Vueltas" si existen datos
    let datosVueltas = [];
    registrosFiltrados.forEach((record) => {
      const idDemora = record.id;
      const vueltas = record.tercerProceso?.vueltas;
      if (Array.isArray(vueltas) && vueltas.length > 0) {
        vueltas.forEach((vuelta, index) => {
          datosVueltas.push({
            demoraId: idDemora,
            numeroVuelta: index + 1,
            ...vuelta,
          });
        });
      }
    });
    if (datosVueltas.length > 0) {
      const keysVueltasSet = new Set();
      datosVueltas.forEach((dato) => {
        Object.keys(dato).forEach((key) => keysVueltasSet.add(key));
      });
      const columnasVueltas = Array.from(keysVueltasSet).map((key) => ({
        header: key,
        key: key,
        width: 20,
      }));
      const sheetVueltas = workbook.addWorksheet("Vueltas");
      sheetVueltas.columns = columnasVueltas;
      datosVueltas.forEach((row) => {
        sheetVueltas.addRow(row);
      });
    }

    // 8) Agregar hoja de análisis con más datos
    const sheetAnalisis = workbook.addWorksheet("Analisis");
    sheetAnalisis.columns = [
      { header: "Métrica", key: "metrica", width: 30 },
      { header: "Valor", key: "valor", width: 20 },
    ];
    // Datos de análisis
    sheetAnalisis.addRow({ metrica: "Total Registros", valor: rows.length });
    sheetAnalisis.addRow({ metrica: "Registros con fecha/hora válidos", valor: countValid });
    sheetAnalisis.addRow({ metrica: "Suma Total de Horas (decimales)", valor: sumHoras.toFixed(2) });
    sheetAnalisis.addRow({ metrica: "Promedio de Horas (decimales)", valor: countValid ? (sumHoras / countValid).toFixed(2) : 0 });
    // También se agregan en formato tiempo:
    sheetAnalisis.addRow({ metrica: "Promedio de Horas (HH:MM:SS)", valor: countValid ? formatInterval(sumHoras / countValid) : "-" });
    sheetAnalisis.addRow({ metrica: "Total en Demora", valor: totalDemoras });
    // Porcentaje de registros en demora:
    const porcentajeDemora = rows.length ? ((totalDemoras / rows.length) * 100).toFixed(2) : 0;
    sheetAnalisis.addRow({ metrica: "Porcentaje en Demora (%)", valor: porcentajeDemora + "%" });
    // Agregar fecha y hora de generación:
    sheetAnalisis.addRow({ metrica: "Fecha de Exportación", valor: new Date().toLocaleString() });

    // 9) Generar el buffer y retornar la respuesta
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
