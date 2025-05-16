import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import ExcelJS from "exceljs";

function getFileName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `Acontecimientos_Interrupciones ${yyyy}-${mm}-${dd} ${hh}-${min}.xlsx`;
}

/** Construye las columnas fijas para la hoja resumen */
function buildFixedColumns() {
  return [
    { header: "ID", key: "id", width: 10 },
    { header: "Usuario", key: "userName", width: 20 },
    { header: "Fecha", key: "fecha", width: 15 },
    { header: "Turno", key: "turno", width: 15 },
    { header: "Condición", key: "condicion", width: 20 },
    { header: "Operadores", key: "operadores", width: 12 },
    { header: "Enlonadores", key: "enlonadores", width: 12 },
    { header: "Equipos", key: "equipos", width: 10 },
  ];
}

/** Construye columnas dinámicas para acontecimientos */
function buildDynamicColumns(maxAcontecimientos) {
  return Array.from({ length: maxAcontecimientos }, (_, i) => ([
    { header: `Ac. ${i + 1} - Razón`,        key: `razon_${i}`,        width: 30 },
    { header: `Ac. ${i + 1} - Hora Inicio`,  key: `horaInicio_${i}`,   width: 15 },
    { header: `Ac. ${i + 1} - Hora Final`,   key: `horaFinal_${i}`,    width: 15 },
    { header: `Ac. ${i + 1} - Tiempo Total`, key: `tiempoTotal_${i}`,  width: 15 },
    { header: `Ac. ${i + 1} - Observaciones`,key: `observaciones_${i}`,width: 30 },
  ])).flat();
}

/** Convierte un tiempo "HH:MM:SS" o "H:MM:SS" a segundos */
function timeStrToSeconds(t) {
  if (!t || typeof t !== "string") return NaN;
  const parts = t.split(":").map(p => parseInt(p, 10));
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if ([h, m, s].some(isNaN)) return NaN;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) { // MM:SS
    const [m, s] = parts;
    if ([m, s].some(isNaN)) return NaN;
    return m * 60 + s;
  }
  return NaN;
}

/** Convierte segundos a formato "HH:MM:SS" */
function secondsToTimeStr(seconds) {
  if (isNaN(seconds) || seconds < 0) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return [h,m,s].map(v => String(v).padStart(2, "0")).join(":");
}

/** Aplana un registro en una fila para la hoja resumen */
function buildSummaryRow(r, maxAcontecimientos) {
  const base = {
    id: r.id,
    userName: r.userName || "-",
    fecha: r.fecha,
    turno: r.turno || "-",
    condicion: r.condicion || "-",
    operadores: r.operadores ?? "-",
    enlonadores: r.enlonadores ?? "-",
    equipos: r.equipos ?? "-",
  };

  const acontecimientos = Array.isArray(r.acontecimientos) ? r.acontecimientos : [];
  
  for (let i = 0; i < maxAcontecimientos; i++) {
    const a = acontecimientos[i] || {};
    base[`razon_${i}`]        = a.razon || "-";
    base[`horaInicio_${i}`]   = a.horaInicio || "-";
    base[`horaFinal_${i}`]    = a.horaFinal || "-";
    base[`tiempoTotal_${i}`]  = a.tiempoTotal || "-";
    base[`observaciones_${i}`]= a.observaciones || "-";
  }

  return base;
}

/** Agrupa los acontecimientos por fecha y calcula el promedio de tiempos en segundos por fecha */
function calculateDailyAverages(records) {
  // Mapa: fecha => array de segundos de tiempoTotal
  const map = {};

  records.forEach(rec => {
    const fecha = rec.fecha;
    if (!map[fecha]) map[fecha] = [];
    const eventos = Array.isArray(rec.acontecimientos) ? rec.acontecimientos : [];
    eventos.forEach(ev => {
      const segs = timeStrToSeconds(ev.tiempoTotal);
      if (!isNaN(segs)) {
        map[fecha].push(segs);
      }
    });
  });

  // Calcular promedio por fecha
  const result = [];
  for (const [fecha, tiempos] of Object.entries(map)) {
    const avg = tiempos.length > 0 ? tiempos.reduce((a,b) => a+b, 0)/tiempos.length : NaN;
    result.push({ fecha, avgSegundos: avg });
  }
  // Ordenar por fecha asc
  result.sort((a,b) => a.fecha.localeCompare(b.fecha));
  return result;
}

export async function GET(request) {
  try {
    const records = await prisma.acontecimiento.findMany({
      orderBy: { fecha: "asc" },
    });

    const maxAcontecimientos = records.reduce(
      (max, rec) => Math.max(max, Array.isArray(rec.acontecimientos) ? rec.acontecimientos.length : 0),
      0
    );

    const workbook = new ExcelJS.Workbook();

    // Hoja Resumen
    const summarySheet = workbook.addWorksheet("Acontecimientos_Interrupciones");
    summarySheet.columns = [
      ...buildFixedColumns(),
      ...buildDynamicColumns(maxAcontecimientos),
    ];

    records.forEach(r => {
      summarySheet.addRow(buildSummaryRow(r, maxAcontecimientos));
    });

    // Calcular promedio de tiempos para cada columna tiempoTotal en hoja resumen
    const avgRow = {
      id: "Promedio",
      userName: "",
      fecha: "",
      turno: "",
      condicion: "",
      operadores: "",
      enlonadores: "",
      equipos: "",
    };

    for (let i = 0; i < maxAcontecimientos; i++) {
      const key = `tiempoTotal_${i}`;
      const valores = summarySheet.getColumn(key).values.slice(2)
        .map(timeStrToSeconds)
        .filter(n => !isNaN(n));

      const avgSegundos = valores.length > 0
        ? valores.reduce((a, b) => a + b, 0) / valores.length
        : NaN;

      avgRow[key] = isNaN(avgSegundos) ? "-" : secondsToTimeStr(avgSegundos);
    }

    const lastRow = summarySheet.addRow(avgRow);
    lastRow.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else if (colNumber > 8 && (colNumber - 9) % 5 === 3) {
        cell.font = { italic: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFD9EAD3'} };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "double" }, right: { style: "thin" }
        };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });

    // Estilos encabezado y celdas resumen
    summarySheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" }
      };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });

    summarySheet.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx === 1) return;
      row.eachCell(cell => {
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        };
        if (cell.col % 5 === 0) {
          cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        } else {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
    });

    // Hoja detalle con promedios por registro (igual que antes)
    const detailSheet = workbook.addWorksheet("Detalle Acontecimientos");
    detailSheet.columns = [
      { width: 15 },
      { width: 35 },
      { width: 15 },
      { width: 25 },
      { width: 40 },
    ];

    let rowNum = 1;
    for (const rec of records) {
      detailSheet.mergeCells(`A${rowNum}:E${rowNum}`);
      const titleCell = detailSheet.getCell(`A${rowNum}`);
      titleCell.value = `Registro #: ${rec.id}`;
      titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      rowNum++;

      const dataRows = [
        ["Usuario", rec.userName || "-", "Fecha", rec.fecha || "-"],
        ["Condición", rec.condicion || "-", "Turno", rec.turno || "-"],
        ["Operadores", rec.operadores ?? "-", "Enlonadores", rec.enlonadores ?? "-"],
        ["Equipos", rec.equipos ?? "-", "", ""],
      ];

      for (const rowData of dataRows) {
        detailSheet.getCell(`A${rowNum}`).value = rowData[0];
        detailSheet.getCell(`A${rowNum}`).font = { bold: true };
        detailSheet.getCell(`A${rowNum}`).alignment = { horizontal: "right", vertical: "middle" };

        detailSheet.getCell(`C${rowNum}`).value = rowData[2];
        detailSheet.getCell(`C${rowNum}`).font = { bold: true };
        detailSheet.getCell(`C${rowNum}`).alignment = { horizontal: "right", vertical: "middle" };

        detailSheet.getCell(`B${rowNum}`).value = rowData[1];
        detailSheet.getCell(`B${rowNum}`).alignment = { horizontal: "left", vertical: "middle", wrapText: true };

        detailSheet.getCell(`D${rowNum}`).value = rowData[3];
        detailSheet.getCell(`D${rowNum}`).alignment = { horizontal: "left", vertical: "middle", wrapText: true };

        rowNum++;
      }
      rowNum++;

      const headers = [
        { header: "Acontecimientos", key: "razon", width: 30 },
        { header: "Hora Inicio", key: "horaInicio", width: 15 },
        { header: "Hora Final", key: "horaFinal", width: 15 },
        { header: "Tiempo Total", key: "tiempoTotal", width: 15 },
        { header: "Observaciones", key: "observaciones", width: 40 },
      ];

      headers.forEach(({ header }, i) => {
        const cell = detailSheet.getCell(rowNum, i + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      rowNum++;

      const eventos = Array.isArray(rec.acontecimientos) ? rec.acontecimientos : [];

      if (eventos.length === 0) {
        detailSheet.mergeCells(`A${rowNum}:E${rowNum}`);
        detailSheet.getCell(`A${rowNum}`).value = "No hay registros de acontecimientos.";
        detailSheet.getCell(`A${rowNum}`).alignment = { horizontal: "center", vertical: "middle" };
        rowNum++;
      } else {
        // Calcular promedio tiempo total para este registro
        const tiemposSegundos = eventos
          .map(ev => timeStrToSeconds(ev.tiempoTotal))
          .filter(n => !isNaN(n));

        const avgSegundosRegistro = tiemposSegundos.length > 0
          ? tiemposSegundos.reduce((a, b) => a + b, 0) / tiemposSegundos.length
          : NaN;

        eventos.forEach((ev) => {
          detailSheet.getCell(`A${rowNum}`).value = ev.razon || "-";
          detailSheet.getCell(`B${rowNum}`).value = ev.horaInicio || "-";
          detailSheet.getCell(`C${rowNum}`).value = ev.horaFinal || "-";
          detailSheet.getCell(`D${rowNum}`).value = ev.tiempoTotal || "-";
          detailSheet.getCell(`E${rowNum}`).value = ev.observaciones || "-";

          for (let c = 1; c <= 5; c++) {
            const cell = detailSheet.getCell(rowNum, c);
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = {
              horizontal: c === 5 ? "left" : "center",
              vertical: "middle",
              wrapText: true,
            };
          }
          rowNum++;
        });

        // Fila promedio al final para este registro
        detailSheet.mergeCells(`A${rowNum}:C${rowNum}`);
        const avgCell = detailSheet.getCell(`A${rowNum}`);
        avgCell.value = "Promedio Tiempo Total:";
        avgCell.font = { bold: true };
        avgCell.alignment = { horizontal: "right", vertical: "middle" };

        const avgTimeCell = detailSheet.getCell(`D${rowNum}`);
        avgTimeCell.value = isNaN(avgSegundosRegistro) ? "-" : secondsToTimeStr(avgSegundosRegistro);
        avgTimeCell.font = { italic: true };
        avgTimeCell.alignment = { horizontal: "center", vertical: "middle" };

        // Estilo borde fila promedio
        for (let c = 1; c <= 5; c++) {
          const cell = detailSheet.getCell(rowNum, c);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "double" },
            right: { style: "thin" },
          };
        }

        rowNum += 2;
      }
    }

    // Hoja nuevos promedios diarios
    const dailySheet = workbook.addWorksheet("Promedios Diarios");
    dailySheet.columns = [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Promedio Tiempo Total", key: "promedio", width: 25 },
    ];

    const dailyAverages = calculateDailyAverages(records);

    dailyAverages.forEach(({ fecha, avgSegundos }) => {
      dailySheet.addRow({
        fecha,
        promedio: secondsToTimeStr(avgSegundos),
      });
    });

    // Promedio general total
    const allSegs = dailyAverages.flatMap(d => isNaN(d.avgSegundos) ? [] : [d.avgSegundos]);
    const totalAvg = allSegs.length > 0 ? allSegs.reduce((a,b) => a+b,0) / allSegs.length : NaN;

    const totalRow = dailySheet.addRow({
      fecha: "Promedio Total",
      promedio: secondsToTimeStr(totalAvg),
    });

    totalRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFD9EAD3'} };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "double" }, right: { style: "thin" }
      };
    });

    // Estilo encabezado hoja diaria
    dailySheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" }
      };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });

    dailySheet.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx === 1) return;
      row.eachCell(cell => {
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    // Generar buffer y enviar archivo Excel
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