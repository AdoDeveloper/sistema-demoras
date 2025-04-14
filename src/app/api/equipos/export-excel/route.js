import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import ExcelJS from "exceljs";

/**
 * Genera un nombre de archivo dinámico: "Equipos YYYY-MM-DD HH-mm.xlsx"
 */
function getFileName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `Equipos ${yyyy}-${mm}-${dd} ${hh}-${min}.xlsx`;
}

export async function GET(request) {
  try {
    // 1) Consultar todos los equipos junto con su historial de inspecciones.
    // No se usa "include" porque inspecciones es un campo JSON dentro de Equipo.
    const equipos = await prisma.equipo.findMany({
      orderBy: { fecha: "asc" }
    });

    // 2) Obtener todos los títulos únicos de inspección (para la hoja resumen).
    const uniqueInspectionTitles = new Set();
    equipos.forEach((e) => {
      const insps = Array.isArray(e.inspecciones) ? e.inspecciones : [];
      insps.forEach((insp) => {
        if (insp.titulo) uniqueInspectionTitles.add(insp.titulo);
      });
    });
    const inspectionTitles = Array.from(uniqueInspectionTitles);

    // 3) Crear un nuevo libro de Excel.
    const workbook = new ExcelJS.Workbook();

    // ===============================
    // Hoja Resumen: "Equipos"
    // ===============================
    const summarySheet = workbook.addWorksheet("Equipos");

    // Columnas fijas
    const fixedColumns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Equipo", key: "equipo", width: 20 },
      { header: "Horómetro", key: "horometro", width: 15 },
      { header: "Operador", key: "operador", width: 20 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Hora", key: "hora", width: 15 },
      { header: "Hora Fin", key: "horaFin", width: 15 },
      { header: "Tiempo Total", key: "tiempoTotal", width: 15 },
      { header: "Inicia Turno", key: "horaDe", width: 15 },
      { header: "Termina Turno", key: "horaA", width: 15 },
      { header: "Recomendaciones", key: "recomendaciones", width: 30 },
    ];

    // Columnas dinámicas por cada título de inspección:
    // Se asigna una columna para el resultado y otra para las observaciones.
    const dynamicColumns = [];
    inspectionTitles.forEach((title, index) => {
      dynamicColumns.push({ header: title, key: `insp_${index}`, width: 15 });
      dynamicColumns.push({ header: `Observaciones ${index + 1}`, key: `obs_${index}`, width: 30 });
    });

    summarySheet.columns = fixedColumns.concat(dynamicColumns);

    // Agregar cada registro a la hoja resumen.
    equipos.forEach((e) => {
      const row = {
        id: e.id,
        equipo: e.equipo || "",
        horometro: e.horometro || "",
        operador: e.operador || "",
        fecha: e.fecha || "",
        hora: e.hora || "",
        horaFin: e.horaFin || "",
        tiempoTotal: e.tiempoTotal || "",
        horaDe: e.horaDe || "",
        horaA: e.horaA || "",
        recomendaciones: e.recomendaciones || "",
      };

      // Para cada título de inspección, buscar si existe ese registro en el array JSON
      inspectionTitles.forEach((title, index) => {
        const insps = Array.isArray(e.inspecciones) ? e.inspecciones : [];
        const insp = insps.find((i) => i.titulo === title);
        if (insp) {
          row[`insp_${index}`] = insp.cumple === true ? "SI" : "NO";
          row[`obs_${index}`] = insp.observaciones || "";
        } else {
          row[`insp_${index}`] = "-";
          row[`obs_${index}`] = "-";
        }
      });

      summarySheet.addRow(row);
    });

    // Estilizar el encabezado de la hoja resumen.
    summarySheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0000FF" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Agregar bordes y alineaciones a las celdas de datos
    summarySheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber !== 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        });
      }
    });

    // ===============================
    // Hojas individuales por grupo (equipo)
    // ===============================
    // Agrupar por el campo "equipo"
    const groups = {};
    equipos.forEach((e) => {
      const key = e.equipo ? e.equipo.toString() : "Sin equipo";
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    for (const groupName in groups) {
      // Nombre de la hoja basado en el grupo (truncado a 31 caracteres si es necesario)
      let sheetName = groupName;
      if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 31);
      }
      // Se define la hoja individual con 4 columnas (A a D)
      const ws = workbook.addWorksheet(sheetName);
      ws.columns = [
        { header: "", key: "A", width: 10 },
        { header: "", key: "B", width: 30 },
        { header: "", key: "C", width: 15 },
        { header: "", key: "D", width: 40 },
      ];
    
      let currentRow = 1;
      const registros = groups[groupName];
    
      registros.forEach((registro) => {
        // --- Bloque: Datos Generales del Equipo ---
        // Título del bloque
        ws.mergeCells(`A${currentRow}:D${currentRow}`);
        const titleCell = ws.getCell(`A${currentRow}`);
        titleCell.value = "Detalles del Equipo";
        titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "CC4A0B" } };
        currentRow++;
    
        // Encabezados de datos generales (Equipo, Horómetro, Fecha, Operador)
        ws.getCell(`A${currentRow}`).value = "Equipo";
        ws.getCell(`B${currentRow}`).value = "Horómetro";
        ws.getCell(`C${currentRow}`).value = "Fecha";
        ws.getCell(`D${currentRow}`).value = "Operador";
        ["A", "B", "C", "D"].forEach((col) => {
          const cell = ws.getCell(`${col}${currentRow}`);
          cell.font = { bold: true };
          cell.alignment = { horizontal: "center" };
        });
        currentRow++;
    
        // Valores de datos generales
        ws.getCell(`A${currentRow}`).value = registro.equipo || "";
        ws.getCell(`B${currentRow}`).value = registro.horometro || "";
        ws.getCell(`C${currentRow}`).value = (registro.fecha ? registro.fecha + " " : "") + (registro.hora || "");
        ws.getCell(`D${currentRow}`).value = registro.operador || "";
        ["A", "B", "C", "D"].forEach((col) => {
          const cell = ws.getCell(`${col}${currentRow}`);
          cell.alignment = { horizontal: "center" };
        });
        currentRow++;
    
        // --- Recuadro para Hora Fin, Tiempo Total y Turno sin fusionar celdas ---
        ws.getCell(`A${currentRow}`).value = "Hora Fin";
        ws.getCell(`B${currentRow}`).value = "Tiempo Total";
        ws.getCell(`C${currentRow}`).value = "Inicia Turno";
        ws.getCell(`D${currentRow}`).value = "Termina Turno";
        ["A", "B", "C", "D"].forEach((col) => {
          const cell = ws.getCell(`${col}${currentRow}`);
          cell.font = { bold: true };
          cell.alignment = { horizontal: "center" };
        });
        currentRow++;
    
        // Valores correspondientes
        ws.getCell(`A${currentRow}`).value = registro.horaFin || "";
        ws.getCell(`B${currentRow}`).value = registro.tiempoTotal || "";
        ws.getCell(`C${currentRow}`).value = registro.horaDe || "";
        ws.getCell(`D${currentRow}`).value = registro.horaA || "";
        ["A", "B", "C", "D"].forEach((col) => {
          const cell = ws.getCell(`${col}${currentRow}`);
          cell.alignment = { horizontal: "center" };
        });
        currentRow++;

        // Espacio adicional (línea en blanco)
        currentRow++;
    
        // --- Sección: Historial de Inspecciones ---
        ws.mergeCells(`A${currentRow}:D${currentRow}`);
        const inspTitleCell = ws.getCell(`A${currentRow}`);
        inspTitleCell.value = "Inspecciones";
        inspTitleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        inspTitleCell.alignment = { horizontal: "center" };
        inspTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "3838B0" } };
        currentRow++;
    
        // Encabezados de la tabla de inspecciones
        ws.getCell(`A${currentRow}`).value = "N°";
        ws.getCell(`B${currentRow}`).value = "Parte Evaluada";
        ws.getCell(`C${currentRow}`).value = "Cumple";
        ws.getCell(`D${currentRow}`).value = "Observaciones";
        ["A", "B", "C", "D"].forEach((col) => {
          const cell = ws.getCell(`${col}${currentRow}`);
          cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
          cell.alignment = { horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "86899B" } };
        });
        currentRow++;
    
        // Datos de cada inspección
        const insps = Array.isArray(registro.inspecciones) ? registro.inspecciones : [];
        insps.forEach((insp, idx) => {
          ws.getCell(`A${currentRow}`).value = idx + 1;
          ws.getCell(`B${currentRow}`).value = insp.titulo || "";
          ws.getCell(`C${currentRow}`).value = insp.cumple === true ? "SI" : "NO";
          ws.getCell(`D${currentRow}`).value = insp.observaciones || "";
          ["A", "B", "C", "D"].forEach((col) => {
            const cell = ws.getCell(`${col}${currentRow}`);
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = {
              horizontal: "center",
              vertical: "middle",
              wrapText: true,
            };
          });
          currentRow++;
        });
    
        // Espacio antes de Recomendaciones
        currentRow++;
    
        // --- Sección: Recomendaciones ---
        ws.mergeCells(`A${currentRow}:D${currentRow}`);
        const recTitleCell = ws.getCell(`A${currentRow}`);
        recTitleCell.value = "Recomendaciones:";
        recTitleCell.font = { bold: true };
        recTitleCell.alignment = { horizontal: "left" };
        currentRow++;
    
        ws.mergeCells(`A${currentRow}:D${currentRow}`);
        ws.getCell(`A${currentRow}`).value = registro.recomendaciones || "";
        ws.getCell(`A${currentRow}`).alignment = { wrapText: true, horizontal: "left" };
        currentRow += 2; // Línea en blanco para separar cada bloque
      });
    }

    // 4) Generar el buffer y retornar el archivo Excel.
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
