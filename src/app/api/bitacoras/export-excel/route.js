// /api/bitacoras/export-excel/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import ExcelJS from "exceljs";

// Función auxiliar para formatear campos que vienen como JSON array
function formatArrayField(field) {
  if (!field) return "-";
  try {
    const parsed = JSON.parse(field);
    if (Array.isArray(parsed)) {
      return parsed.join(", ");
    }
    return field;
  } catch (e) {
    // Si falla el parseo, se retorna el campo tal cual
    return field;
  }
}

/**
 * Convierte una cadena "HH:MM:SS" a un número de minutos (con decimales).
 * Ejemplo: "01:00:02" => 60.0333... minutos
 */
function parseHHMMSStoMinutes(str) {
  if (!str || typeof str !== "string") return 0;

  const [hh, mm, ss] = str.split(":");
  if (!hh || !mm || !ss) return 0; // Si el formato es inválido

  const hours = parseInt(hh, 10) || 0;
  const minutes = parseInt(mm, 10) || 0;
  const seconds = parseInt(ss, 10) || 0;

  // Total de minutos (p. ej. 1h = 60min, 2s = 2/60 min)
  return hours * 60 + minutes + seconds / 60;
}

/**
 * Genera un nombre de archivo dinámico: "Bitacoras YYYY-MM-DD HH-mm.xlsx"
 */
function getFileName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `Bitacoras ${yyyy}-${mm}-${dd} ${hh}-${min}.xlsx`;
}

export async function GET(request) {
  try {
    // 1) Extraer parámetros de consulta (formato YYYY-MM-DD)
    const { searchParams } = new URL(request.url);
    const fechaInicioQuery = searchParams.get("fechaInicio");
    const fechaFinalQuery = searchParams.get("fechaFinal");

    // 2) Consultar bitácoras incluyendo la relación con Barco y Operaciones.
    let bitacoras;
    if (fechaInicioQuery && fechaFinalQuery) {
      bitacoras = await prisma.bitacora.findMany({
        where: {
          fecha: {
            gte: fechaInicioQuery,
            lte: fechaFinalQuery,
          },
        },
        orderBy: { fecha: "asc" },
        include: {
          barco: true,
          operaciones: true,
        },
      });
    } else {
      bitacoras = await prisma.bitacora.findMany({
        orderBy: { fecha: "asc" },
        include: {
          barco: true,
          operaciones: true,
        },
      });
    }

    // 3) Construir las filas para la hoja "Bitacoras"
    //    (El campo "fecha" se omitió de la hoja "Bitacoras", quedando en la hoja "Operaciones")
    const rows = bitacoras.map((bitacora) => ({
      "ID": bitacora.id,
      "Fecha Inicio": bitacora.fechaInicio || "-",
      "Fecha Cierre": bitacora.fechaCierre || "-",
      "Nombre Muellero": bitacora.nombreMuellero || "-",
      "Turno Inicio": bitacora.turnoInicio || "-",
      "Turno Fin": bitacora.turnoFin || "-",
      "Observaciones": bitacora.observaciones || "-",
      // Información del Barco
      "Muelle": bitacora.barco?.muelle || "-",
      "Vapor Barco": bitacora.barco?.vaporBarco || "-",
      "Fecha Arribo": bitacora.barco?.fechaArribo || "-",
      "Hora Arribo": bitacora.barco?.horaArribo || "-",
      "Fecha Atraque": bitacora.barco?.fechaAtraque || "-",
      "Hora Atraque": bitacora.barco?.horaAtraque || "-",
      "Fecha Recibido": bitacora.barco?.fechaRecibido || "-",
      "Hora Recibido": bitacora.barco?.horaRecibido || "-",
      "Fecha Inicio Operaciones": bitacora.barco?.fechaInicioOperaciones || "-",
      "Hora Inicio Operaciones": bitacora.barco?.horaInicioOperaciones || "-",
      "Fecha Fin Operaciones": bitacora.barco?.fechaFinOperaciones || "-",
      "Hora Fin Operaciones": bitacora.barco?.horaFinOperaciones || "-",
      "Tipo Carga": formatArrayField(bitacora.barco?.tipoCarga),
      "Sistema Utilizado": formatArrayField(bitacora.barco?.sistemaUtilizado),
    }));

    // 4) Definir las columnas para la hoja "Bitacoras"
    const bitacorasColumns = [
      { header: "ID", key: "ID", width: 10 },
      { header: "Fecha Inicio", key: "Fecha Inicio", width: 20 },
      { header: "Fecha Cierre", key: "Fecha Cierre", width: 20 },
      { header: "Nombre Muellero", key: "Nombre Muellero", width: 20 },
      { header: "Turno Inicio", key: "Turno Inicio", width: 15 },
      { header: "Turno Fin", key: "Turno Fin", width: 15 },
      { header: "Observaciones", key: "Observaciones", width: 30 },
      { header: "Muelle", key: "Muelle", width: 15 },
      { header: "Vapor Barco", key: "Vapor Barco", width: 20 },
      { header: "Fecha Arribo", key: "Fecha Arribo", width: 20 },
      { header: "Hora Arribo", key: "Hora Arribo", width: 15 },
      { header: "Fecha Atraque", key: "Fecha Atraque", width: 20 },
      { header: "Hora Atraque", key: "Hora Atraque", width: 15 },
      { header: "Fecha Recibido", key: "Fecha Recibido", width: 20 },
      { header: "Hora Recibido", key: "Hora Recibido", width: 15 },
      { header: "Fecha Inicio Operaciones", key: "Fecha Inicio Operaciones", width: 25 },
      { header: "Hora Inicio Operaciones", key: "Hora Inicio Operaciones", width: 20 },
      { header: "Fecha Fin Operaciones", key: "Fecha Fin Operaciones", width: 25 },
      { header: "Hora Fin Operaciones", key: "Hora Fin Operaciones", width: 20 },
      { header: "Tipo Carga", key: "Tipo Carga", width: 25 },
      { header: "Sistema Utilizado", key: "Sistema Utilizado", width: 25 },
    ];

    // Crear el libro y la hoja "Bitacoras"
    const workbook = new ExcelJS.Workbook();
    const sheetBitacoras = workbook.addWorksheet("Bitacoras");
    sheetBitacoras.columns = bitacorasColumns;

    // Estilizar encabezados
    sheetBitacoras.getRow(1).eachCell((cell) => {
      cell.value = String(cell.value).toUpperCase();
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Blanco
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0000FF' }, // Azul
      };
    });

    rows.forEach((row) => {
      sheetBitacoras.addRow(row);
    });

    rows.forEach((row) => {
      sheetBitacoras.addRow(row);
    });

    // 5) Preparar la hoja "Operaciones" con los datos de cada operación
    //    Aquí se incluye el campo "fecha" (de la bitácora) y otros campos.
    let operacionesRows = [];
    bitacoras.forEach((bitacora) => {
      if (bitacora.operaciones && bitacora.operaciones.length > 0) {
        bitacora.operaciones.forEach((operacion) => {
          operacionesRows.push({
            "Operacion ID": operacion.id,
            "Bitacora ID": bitacora.id,
            "Fecha": bitacora.fecha || "-",
            "Muelle": bitacora.barco?.muelle || "-",
            "Barco": bitacora.barco?.vaporBarco || "-",
            "Nombre Muellero": bitacora.nombreMuellero || "-",
            "Turno": `${bitacora.turnoInicio || "-"} - ${bitacora.turnoFin || "-"}`,
            "Bodega": operacion.bodega || "-",
            "Inicio": operacion.inicio || "-",
            "Final": operacion.final || "-",
            "Minutos": operacion.minutos || "-",
            "Actividad": operacion.actividad || "-",
          });
        });
      }
    });

    // Solo si hay operaciones se crea la hoja "Operaciones"
    if (operacionesRows.length > 0) {
      const operacionesColumns = [
        { header: "Operacion ID", key: "Operacion ID", width: 15 },
        { header: "Bitacora ID", key: "Bitacora ID", width: 15 },
        { header: "Fecha", key: "Fecha", width: 15 },
        { header: "Muelle", key: "Muelle", width: 10 },
        { header: "Barco", key: "Barco", width: 20 },
        { header: "Nombre Muellero", key: "Nombre Muellero", width: 20 },
        { header: "Turno", key: "Turno", width: 20 },
        { header: "Bodega", key: "Bodega", width: 20 },
        { header: "Inicio", key: "Inicio", width: 20 },
        { header: "Final", key: "Final", width: 20 },
        { header: "Minutos", key: "Minutos", width: 15 },
        { header: "Actividad", key: "Actividad", width: 30 },
      ];

      const sheetOperaciones = workbook.addWorksheet("Operaciones");
      sheetOperaciones.columns = operacionesColumns;

      // Estilizar encabezados
      sheetOperaciones.getRow(1).eachCell((cell) => {
        cell.value = String(cell.value).toUpperCase();
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Blanco
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0000FF' }, // Azul
        };
      });


      // Agregar las filas de operaciones
      operacionesRows.forEach((row) => {
        sheetOperaciones.addRow(row);
      });

      // 6) Calcular el total de minutos y el total en formato HH:MM:SS
      const totalMinutes = operacionesRows.reduce((acc, row) => {
        // "Minutos" se espera en formato HH:MM:SS
        return acc + parseHHMMSStoMinutes(row["Minutos"]);
      }, 0);

      // Pasar minutos a segundos (redondeamos si es necesario)
      const totalSeconds = Math.round(totalMinutes * 60);

      // Desglosar horas, minutos y segundos
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      // Formatear a HH:MM:SS
      const totalTimeFormatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      // Agregar una fila extra con el total
      const totalRow = sheetOperaciones.addRow({
        "Operacion ID": "Total",
        "Bitacora ID": "",
        "Fecha": "",
        "Muelle": "",
        "Barco": "",
        "Nombre Muellero": "",
        "Turno": "",
        "Bodega": "",
        "Inicio": "",
        "Final": "",
        "Minutos": `${totalTimeFormatted}`,
        "Actividad": totalMinutes.toFixed(2) + " min",
      });

      // Aplicar estilos: negrita y fondo amarillo a toda la fila
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' }, // Amarillo
        };
      });

    }

    // 7) Generar el buffer y retornar la respuesta con el archivo Excel
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
