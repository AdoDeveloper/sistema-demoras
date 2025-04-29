import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import ExcelJS from "exceljs";

/** Devuelve un nombre de archivo como "Recepciones YYYY-MM-DD HH-mm.xlsx" */
function getFileName() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const [yyyy, mm, dd, hh, min] = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
  ];
  return `Recepciones ${yyyy}-${mm}-${dd} ${hh}-${min}.xlsx`;
}

/** Genera las columnas fijas del resumen */
function buildFixedColumns() {
  return [
    { header: "ID",             key: "id",           width: 10 },
    { header: "Barco",          key: "nombreBarco",  width: 20 },
    { header: "Producto",       key: "producto",     width: 20 },
    { header: "Fecha",          key: "fecha",        width: 15 },
    { header: "Hora",           key: "hora",         width: 15 },
    { header: "Chequero",       key: "chequero",     width: 15 },
    { header: "Inicio Turno",   key: "turnoInicio",  width: 15 },
    { header: "Fin Turno",      key: "turnoFin",     width: 15 },
    { header: "Carga",          key: "puntoCarga",   width: 20 },
    { header: "Descarga",       key: "puntoDescarga",width: 20 },
  ];
}

/** Genera columnas dinámicas según el número de bitácoras */
function buildDynamicColumns(maxEventos) {
  return Array.from({ length: maxEventos }, (_, i) => ([
    { header: `Bitácora ${i + 1} - Placa`,      key: `placa_${i}`,    width: 15 },
    { header: `Bitácora ${i + 1} - Ticket`,     key: `ticket_${i}`,   width: 15 },
    { header: `Bitácora ${i + 1} - Inicio`,     key: `horaIni_${i}`,  width: 15 },
    { header: `Bitácora ${i + 1} - Final`,      key: `horaFin_${i}`,  width: 15 },
    { header: `Bitácora ${i + 1} - Transporte`, key: `transp_${i}`,   width: 20 },
    { header: `Bitácora ${i + 1} - Total`,      key: `tiempo_${i}`,   width: 15 },
    { header: `Bitácora ${i + 1} - Obs.`,       key: `obs_${i}`,      width: 30 },
  ])).flat();
}

/** Aplana una recepcion en una única fila de resumen */
function buildSummaryRow(r, maxEventos) {
  const base = {
    id:            r.id,
    nombreBarco:   r.nombreBarco,
    producto:      r.producto,
    fecha:         r.fecha,
    hora:          r.hora,
    chequero:      r.chequero,
    turnoInicio:   r.turnoInicio || "",
    turnoFin:      r.turnoFin || "",
    puntoCarga:    r.puntoCarga || "",
    puntoDescarga: r.puntoDescarga || "",
  };

  const eventos = Array.isArray(r.bitacoras) ? r.bitacoras : [];
  // Añade por cada índice un valor o "-"
  for (let i = 0; i < maxEventos; i++) {
    const ev = eventos[i] || {};
    base[`placa_${i}`]   = ev.placa         || "-";
    base[`ticket_${i}`]  = ev.ticket        || "-";
    base[`horaIni_${i}`] = ev.horaInicio    || "-";
    base[`horaFin_${i}`] = ev.horaFinal     || "-";
    base[`transp_${i}`]  = ev.transporte    || "-";
    base[`tiempo_${i}`]  = ev.tiempoTotal   || "-";
    base[`obs_${i}`]     = ev.observaciones || "-";
  }

  return base;
}

/** Agrupa un array por función clave */
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item) || "SinBarco";
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
}

export async function GET(request) {
  try {
    const recepciones = await prisma.recepcionTraslado.findMany({
      orderBy: { fecha: "asc" },
    });
    const maxEventos = recepciones.reduce(
      (m, r) => Math.max(m, (r.bitacoras || []).length),
      0
    );

    const wb = new ExcelJS.Workbook();
    const summary = wb.addWorksheet("Recepciones");

    // Columnas y datos resumen
    summary.columns = [
      ...buildFixedColumns(),
      ...buildDynamicColumns(maxEventos),
    ];
    recepciones.forEach(r =>
      summary.addRow(buildSummaryRow(r, maxEventos))
    );

    // Estilo encabezado
    summary.getRow(1).eachCell(cell => {
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
    summary.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx === 1) return;
      row.eachCell(cell => {
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });
    });

    // Hojas por barco
    const grupos = groupBy(recepciones, r => r.nombreBarco);
    for (const [barco, items] of Object.entries(grupos)) {
      const ws = wb.addWorksheet(barco.substring(0, 31));
      ws.columns = [
        { header: "ID",        key: "id",    width: 10 },
        { header: "Fecha",     key: "fecha", width: 15 },
        { header: "Hora",      key: "hora",  width: 15 },
        { header: "Bitácora #",key: "num",   width: 10 },
        { header: "Placa",     key: "placa", width: 15 },
        { header: "Ticket",    key: "ticket",width: 15 },
        { header: "Inicio",    key: "hi",    width: 15 },
        { header: "Final",     key: "hf",    width: 15 },
        { header: "Transporte",key: "transp",width: 20 },
        { header: "Tiempo Total", key: "tt", width: 15 },
        { header: "Obs",       key: "obs",   width: 30 },
      ];

      items.forEach(r => {
        const eventos = Array.isArray(r.bitacoras) ? r.bitacoras : [];
        eventos.forEach((ev, idx) => {
          ws.addRow({
            id:     r.id,
            fecha:  r.fecha          || "",
            hora:   r.hora           || "",
            num:    idx + 1,
            placa:  ev.placa         || "",
            ticket: ev.ticket        || "",
            hi:     ev.horaInicio    || "",
            hf:     ev.horaFinal     || "",
            transp: ev.transporte    || "",
            tt:     ev.tiempoTotal   || "",
            obs:    ev.observaciones || ""
          });
        });
      });

      // Estilo cabecera
      ws.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        };
      });
    }

    // Generar y enviar
    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${getFileName()}"`
      },
    });
  } catch (err) {
    console.error("Error generando Excel:", err);
    return NextResponse.json({ error: "Error generando Excel" }, { status: 500 });
  }
}
