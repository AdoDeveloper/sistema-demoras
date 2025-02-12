import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import ExcelJS from "exceljs";

/** Umbral de horas para considerar que hubo “demora”. Ajusta según tu criterio. */
const UMBRAL_DEMORA = 2;

/**
 * Parsea un string "DD/MM/YYYY, HH:mm:ss" => objeto Date
 * Ejemplo: "11/02/2025, 05:57:22"
 */
function parseFechaHora(str) {
  if (!str) return null;
  try {
    const [fechaStr, horaStr] = str.split(", ");
    const [dia, mes, anio] = fechaStr.split("/").map(Number);
    const [hh, mm, ss] = horaStr.split(":").map(Number);
    return new Date(anio, mes - 1, dia, hh, mm, ss);
  } catch {
    return null;
  }
}

/**
 * Parsea "HH:mm:ss" => objeto Date (1970-01-01 HH:mm:ss)
 */
function parseHora(str) {
  if (!str) return null;
  try {
    const [hh, mm, ss] = str.split(":").map(Number);
    return new Date(1970, 0, 1, hh, mm, ss);
  } catch {
    return null;
  }
}

/**
 * Calcula diferencia en horas (decimales) entre 2 fechas
 */
function diffEnHoras(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const msDiff = dateB - dateA; // milisegundos
  return msDiff / (1000 * 60 * 60);
}

/**
 * Generar nombre de archivo "Demoras-YYYY-MM-DD_HH-mm.xlsx"
 */
function getFileName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `Demoras-${yyyy}-${mm}-${dd}-${hh}-${min}.xlsx`;
}

/**
 * GET: Exportar todos los campos sin omitir nada + cálculos, demoras y gráficos
 */
export async function GET() {
  try {
    // 1) Obtener registros
    const demoras = await prisma.demora.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Variables para análisis
    let sumHoras = 0;
    let countValid = 0;
    let totalDemoras = 0;

    // 2) Aplanar la data
    const rows = demoras.map((record) => {
      const d = record.data || {};

      // Secciones
      const p = d.primerProceso || {};
      const s = d.segundoProceso || {};
      const t = d.tercerProceso || {};
      const f = d.procesoFinal || {};

      // Tiempos primer proceso
      const tpPre = p.tiempoPrechequeo || {};
      const tpScan = p.tiempoScanner || {};
      const tpAuto = p.tiempoAutorizacion || {};
      const tpIng = p.tiempoIngresoPlanta || {};
      const tpEnt = p.tiempoEntradaBascula || {};
      const tpSal = p.tiempoSalidaBascula || {};

      // Tiempos segundo
      const tsLlegPunto = s.tiempoLlegadaPunto || {};
      const tsLlegOp = s.tiempoLlegadaOperador || {};
      const tsLlegEnl = s.tiempoLlegadaEnlonador || {};
      const tsLlegEq = s.tiempoLlegadaEquipo || {};
      const tsIni = s.tiempoInicioCarga || {};
      const tsTerm = s.tiempoTerminaCarga || {};
      const tsSal = s.tiempoSalidaPunto || {};

      // Tiempos tercero
      const ttEnt = t.tiempoEntradaBascula || {};
      const ttSal = t.tiempoSalidaBascula || {};

      // Tiempos final
      const tfLleg = f.tiempoLlegadaTerminal || {};
      const tfSal = f.tiempoSalidaPlanta || {};

      // Parsear "fechaInicio"
      const fechaHoraInicio = parseFechaHora(d.fechaInicio);

      // Parsear "horaSalidaPlanta"
      const horaSalidaStr = tfSal.hora || "";
      const horaSalidaDate = parseHora(horaSalidaStr);

      let horasTotales = 0;
      let isDemora = false;
      if (fechaHoraInicio && horaSalidaDate) {
        // Combinar
        const salidaFull = new Date(fechaHoraInicio);
        salidaFull.setHours(horaSalidaDate.getHours());
        salidaFull.setMinutes(horaSalidaDate.getMinutes());
        salidaFull.setSeconds(horaSalidaDate.getSeconds());

        horasTotales = diffEnHoras(fechaHoraInicio, salidaFull);
        sumHoras += horasTotales;
        countValid++;

        if (horasTotales >= UMBRAL_DEMORA) {
          isDemora = true;
          totalDemoras++;
        }
      }

      // Vueltas
      let vueltasStr = "";
      if (Array.isArray(t.vueltas) && t.vueltas.length > 0) {
        vueltasStr = JSON.stringify(t.vueltas);
      }

      return {
        id: record.id,
        fechaInicio: d.fechaInicio || "",

        // ---------- Primer Proceso ----------
        primer_terminal: p.terminal || "",
        primer_cliente: p.cliente || "",
        primer_placa: p.placa || "",
        primer_remolque: p.remolque || "",
        primer_ejes: p.ejes || "",
        primer_pesador: p.pesador || "",
        primer_pesoInicial: Number(p.pesoInicial) || 0,
        primer_tipoProducto: p.tipoProducto || "",
        primer_puntoDespacho: p.puntoDespacho || "",
        primer_basculaEntrada: p.basculaEntrada || "",
        primer_tipoCarga: p.tipoCarga || "",
        primer_metodoCarga: p.metodoCarga || "",
        // primer_tipoSistema: p.tipoSistema || "",

        primer_tiempoPrechequeo_hora: tpPre.hora || "",
        primer_tiempoPrechequeo_coment: tpPre.comentarios || "",
        primer_tiempoScanner_hora: tpScan.hora || "",
        primer_tiempoScanner_coment: tpScan.comentarios || "",
        primer_tiempoAutorizacion_hora: tpAuto.hora || "",
        primer_tiempoAutorizacion_coment: tpAuto.comentarios || "",
        primer_tiempoIngresoPlanta_hora: tpIng.hora || "",
        primer_tiempoIngresoPlanta_coment: tpIng.comentarios || "",
        primer_tiempoEntradaBascula_hora: tpEnt.hora || "",
        primer_tiempoEntradaBascula_coment: tpEnt.comentarios || "",
        primer_tiempoSalidaBascula_hora: tpSal.hora || "",
        primer_tiempoSalidaBascula_coment: tpSal.comentarios || "",

        // ---------- Segundo Proceso ----------
        segundo_enlonador: s.enlonador || "",
        segundo_operador: s.operador || "",
        segundo_personalAsignado: s.personalAsignado || "",
        segundo_modeloEquipo: s.modeloEquipo || "",

        segundo_llegadaPunto_hora: tsLlegPunto.hora || "",
        segundo_llegadaPunto_coment: tsLlegPunto.comentarios || "",
        segundo_llegadaOperador_hora: tsLlegOp.hora || "",
        segundo_llegadaOperador_coment: tsLlegOp.comentarios || "",
        segundo_llegadaEnlonador_hora: tsLlegEnl.hora || "",
        segundo_llegadaEnlonador_coment: tsLlegEnl.comentarios || "",
        segundo_llegadaEquipo_hora: tsLlegEq.hora || "",
        segundo_llegadaEquipo_coment: tsLlegEq.comentarios || "",
        segundo_inicioCarga_hora: tsIni.hora || "",
        segundo_inicioCarga_coment: tsIni.comentarios || "",
        segundo_terminaCarga_hora: tsTerm.hora || "",
        segundo_terminaCarga_coment: tsTerm.comentarios || "",
        segundo_salidaPunto_hora: tsSal.hora || "",
        segundo_salidaPunto_coment: tsSal.comentarios || "",

        // ---------- Tercer Proceso ----------
        tercer_pesadorSalida: t.pesadorSalida || "",
        tercer_basculaSalida: t.basculaSalida || "",
        tercer_pesoNeto: t.pesoNeto || "",
        tercer_tiempoEntradaBascula_hora: ttEnt.hora || "",
        tercer_tiempoEntradaBascula_coment: ttEnt.comentarios || "",
        tercer_tiempoSalidaBascula_hora: ttSal.hora || "",
        tercer_tiempoSalidaBascula_coment: ttSal.comentarios || "",
        tercer_vueltas: vueltasStr,

        // ---------- Proceso Final ----------
        final_llegadaTerminal_hora: tfLleg.hora || "",
        final_llegadaTerminal_coment: tfLleg.comentarios || "",
        final_salidaPlanta_hora: tfSal.hora || "",
        final_salidaPlanta_coment: tfSal.comentarios || "",

        horasTotales,
        isDemora,
      };
    });

    // Calcular promedio
    let promedioHoras = 0;
    if (countValid > 0) {
      promedioHoras = sumHoras / countValid;
    }

    // 3) Crear workbook
    const workbook = new ExcelJS.Workbook();

    // 4) Hoja principal: "Demoras"
    const sheet = workbook.addWorksheet("Demoras");

    // 5) Definir columnas (Todas las que quieras, sin omitir nada)
    sheet.columns = [
      { header: "ID de la Demora", key: "id", width: 10 },
      { header: "Fecha de Inicio del Proceso", key: "fechaInicio", width: 25 },

      // ---------- Primer Proceso ----------
      { header: "Terminal (P)", key: "primer_terminal", width: 18 },
      { header: "Cliente (P)", key: "primer_cliente", width: 20 },
      { header: "Placa (P)", key: "primer_placa", width: 12 },
      { header: "Remolque (P)", key: "primer_remolque", width: 12 },
      { header: "Ejes (P)", key: "primer_ejes", width: 10 },
      { header: "Pesador (P)", key: "primer_pesador", width: 18 },
      { header: "Peso Inicial (P)", key: "primer_pesoInicial", width: 18 },
      { header: "Tipo de Producto (P)", key: "primer_tipoProducto", width: 20 },
      { header: "Punto de Despacho (P)", key: "primer_puntoDespacho", width: 25 },
      { header: "Báscula de Entrada (P)", key: "primer_basculaEntrada", width: 20 },
      { header: "Tipo de Carga (P)", key: "primer_tipoCarga", width: 18 },
      { header: "Método de Carga (P)", key: "primer_metodoCarga", width: 20 },

      { header: "Prechequeo", key: "primer_tiempoPrechequeo_hora", width: 18 },
      { header: "Comentario", key: "primer_tiempoPrechequeo_coment", width: 25 },
      { header: "Scanner", key: "primer_tiempoScanner_hora", width: 18 },
      { header: "Comentario", key: "primer_tiempoScanner_coment", width: 25 },
      { header: "Autorización", key: "primer_tiempoAutorizacion_hora", width: 18 },
      { header: "Comentario", key: "primer_tiempoAutorizacion_coment", width: 25 },
      { header: "Ingreso Planta", key: "primer_tiempoIngresoPlanta_hora", width: 18 },
      { header: "Comentario", key: "primer_tiempoIngresoPlanta_coment", width: 25 },
      { header: "Entrada Báscula", key: "primer_tiempoEntradaBascula_hora", width: 18 },
      { header: "Comentario", key: "primer_tiempoEntradaBascula_coment", width: 25 },
      { header: "Salida Báscula", key: "primer_tiempoSalidaBascula_hora", width: 18 },
      { header: "Comentario", key: "primer_tiempoSalidaBascula_coment", width: 25 },

      // ---------- Segundo Proceso ----------
      { header: "Enlonador", key: "segundo_enlonador", width: 20 },
      { header: "Operador", key: "segundo_operador", width: 20 },
      { header: "Personal Asignado", key: "segundo_personalAsignado", width: 25 },
      { header: "Modelo Equipo", key: "segundo_modeloEquipo", width: 25 },

      { header: "Llegada Punto", key: "segundo_llegadaPunto_hora", width: 18 },
      { header: "Comentario", key: "segundo_llegadaPunto_coment", width: 25 },
      { header: "Llegada Operador", key: "segundo_llegadaOperador_hora", width: 20 },
      { header: "Comentario", key: "segundo_llegadaOperador_coment", width: 25 },
      { header: "Llegada Enlonador", key: "segundo_llegadaEnlonador_hora", width: 20 },
      { header: "Comentario", key: "segundo_llegadaEnlonador_coment", width: 25 },
      { header: "Llegada Equipo", key: "segundo_llegadaEquipo_hora", width: 18 },
      { header: "Comentario", key: "segundo_llegadaEquipo_coment", width: 25 },
      { header: "Inicio Carga", key: "segundo_inicioCarga_hora", width: 18 },
      { header: "Comentario", key: "segundo_inicioCarga_coment", width: 25 },
      { header: "Termina Carga", key: "segundo_terminaCarga_hora", width: 18 },
      { header: "Comentario", key: "segundo_terminaCarga_coment", width: 25 },
      { header: "Salida Punto", key: "segundo_salidaPunto_hora", width: 18 },
      { header: "Comentario", key: "segundo_salidaPunto_coment", width: 25 },

      // ---------- Tercer Proceso ----------
      { header: "Pesador Salida", key: "tercer_pesadorSalida", width: 25 },
      { header: "Báscula Salida", key: "tercer_basculaSalida", width: 25 },
      { header: "Peso Neto", key: "tercer_pesoNeto", width: 10 },
      { header: "Entrada Báscula", key: "tercer_tiempoEntradaBascula_hora", width: 22 },
      { header: "Comentario", key: "tercer_tiempoEntradaBascula_coment", width: 25 },
      { header: "Salida Báscula", key: "tercer_tiempoSalidaBascula_hora", width: 20 },
      { header: "Comentario", key: "tercer_tiempoSalidaBascula_coment", width: 25 },
      { header: "Vueltas (T) [JSON]", key: "tercer_vueltas", width: 30 },

      // ---------- Proceso Final ----------
      { header: "Llegada Terminal", key: "final_llegadaTerminal_hora", width: 22 },
      { header: "Comentario", key: "final_llegadaTerminal_coment", width: 25 },
      { header: "Salida Planta", key: "final_salidaPlanta_hora", width: 18 },
      { header: "Comentario", key: "final_salidaPlanta_coment", width: 25 },

      { header: "Horas Totales", key: "horasTotales", width: 12 },
      { header: "¿Demora?", key: "isDemora", width: 10 },
    ];

    // 6) Agregar filas
    rows.forEach((row) => {
      sheet.addRow(row);
    });

    // 6a) Formato para “Horas Totales”
    sheet.getColumn("horasTotales").numFmt = "0.00";

    // 6b) isDemora -> "Sí"/"No"
    const colDemora = sheet.getColumn("isDemora");
    colDemora.eachCell((cell, rowNum) => {
      if (rowNum === 1) return; // encabezado
      cell.value = cell.value ? "Sí" : "No";
    });

    // ========== HOJA VUELTAS =============
    // Si quieres dividir "vueltas" en tabla separada
    const sheetVueltas = workbook.addWorksheet("Vueltas");
    sheetVueltas.columns = [
      { header: "DemoraID", key: "demoraId", width: 10 },
      { header: "Nro Vuelta", key: "numeroVuelta", width: 12 },
      { header: "Hora", key: "hora", width: 12 },
      { header: "Comentarios", key: "comentarios", width: 20 },
    ];

    rows.forEach((r) => {
      if (r.tercer_vueltas && typeof r.tercer_vueltas === "string") {
        try {
          const arr = JSON.parse(r.tercer_vueltas);
          if (Array.isArray(arr)) {
            arr.forEach((v) => {
              sheetVueltas.addRow({
                demoraId: r.id,
                numeroVuelta: v.numeroVuelta,
                hora: v.hora,
                comentarios: v.comentarios,
              });
            });
          }
        } catch {
          // no pasa nada
        }
      }
    });

    // ========== HOJA ANALISIS (Promedio, total demoras, etc.) ==========
    const sheetAnalysis = workbook.addWorksheet("Analisis");
    sheetAnalysis.columns = [
      { header: "Métrica", key: "metrica", width: 30 },
      { header: "Valor", key: "valor", width: 15 },
    ];

    sheetAnalysis.addRow({ metrica: "Total Registros", valor: rows.length });
    sheetAnalysis.addRow({ metrica: "Registros con fecha/hora válidos", valor: countValid });
    sheetAnalysis.addRow({ metrica: "Promedio de Horas", valor: promedioHoras });
    sheetAnalysis.addRow({ metrica: "Total en Demora", valor: totalDemoras });
    sheetAnalysis.addRow({ metrica: "Umbral Demora (horas)", valor: UMBRAL_DEMORA });

    // // Formato decimales en "valor" si es number
    // sheetAnalysis.getColumn("valor").eachCell((cell, rowNum) => {
    //   if (rowNum === 1) return; // Encabezado
    //   if (typeof cell.value === "number") {
    //     cell.numFmt = "0.00";
    //   }
    // });

    // 7) Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 8) Nombre de archivo
    const fileName = getFileName();

    // 9) Retornar
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
