import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request) {
  try {
    // 1) Extraer parámetros de consulta (formato YYYY-MM-DD)
    const { searchParams } = new URL(request.url);
    const fechaInicioQuery = searchParams.get("fechaInicio");
    const fechaFinalQuery = searchParams.get("fechaFinal");

    // 2) Obtener todas las actividades (incluyendo la relación con detalles)
    const actividades = await prisma.actividad.findMany({
      orderBy: { fecha: "asc" },
      include: { detalles: true },
    });
    console.log("Actividades obtenidas:", actividades);

    // 3) Filtrar actividades según el campo 'fecha' (comparando cadenas)
    const actividadesFiltradas = actividades.filter((act) => {
      return (!fechaInicioQuery || act.fecha >= fechaInicioQuery) &&
             (!fechaFinalQuery || act.fecha <= fechaFinalQuery);
    });
    console.log("Actividades filtradas:", actividadesFiltradas);

    // 4) Construir las filas para la hoja "Actividades"
    const filasActividades = actividadesFiltradas.map((act) => ({
      "Fecha": act.fecha,
      "Total Actividades": act.totalActividades,
      "Total Duración": act.totalDuracion,
    }));
    console.log("Filas Actividades:", filasActividades);

    // 5) Definir las columnas para la hoja "Actividades"
    const columnasActividades = [
      { header: "Fecha", key: "Fecha", width: 15 },
      { header: "Total Actividades", key: "Total Actividades", width: 20 },
      { header: "Total Duración", key: "Total Duración", width: 20 },
    ];

    // 6) Crear el workbook y agregar la hoja "Actividades"
    const workbook = new ExcelJS.Workbook();
    const hojaActividades = workbook.addWorksheet("Actividades");
    hojaActividades.columns = columnasActividades;
    filasActividades.forEach((fila) => {
      hojaActividades.addRow(fila);
    });

    // 7) Construir las filas para la hoja "Detalle Actividades"
    let filasDetalles = [];
    actividadesFiltradas.forEach((act) => {
      act.detalles.forEach((detalle) => {
        filasDetalles.push({
          "Fecha": act.fecha,
          "Actividad ID": detalle.actividadId,
          "Detalle ID": detalle.id,
          "Activity": detalle.activity,
          "Start Time": detalle.startTime,
          "End Time": detalle.endTime,
          "Duration": detalle.duration,
          "Responsables": detalle.responsables,
        });
      });
    });
    console.log("Filas Detalles:", filasDetalles);

    // 8) Definir las columnas para la hoja "Detalle Actividades"
    const columnasDetalles = [
      { header: "Fecha", key: "Fecha", width: 15 },
      { header: "Actividad ID", key: "Actividad ID", width: 15 },
      { header: "Detalle ID", key: "Detalle ID", width: 10 },
      { header: "Actividad", key: "Activity", width: 30 },
      { header: "Inicia", key: "Start Time", width: 20 },
      { header: "Termina", key: "End Time", width: 20 },
      { header: "Duracion", key: "Duration", width: 15 },
      { header: "Responsables", key: "Responsables", width: 25 },
    ];

    if (filasDetalles.length > 0) {
      const hojaDetalles = workbook.addWorksheet("Detalle Actividades");
      hojaDetalles.columns = columnasDetalles;
      filasDetalles.forEach((fila) => {
        hojaDetalles.addRow(fila);
      });
    }

    // 9) Generar el buffer del Excel y retornar la respuesta
    const buffer = await workbook.xlsx.writeBuffer();

    // Función para generar nombre de archivo dinámico
    function getFileName() {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      return `Actividades ${yyyy}-${mm}-${dd} ${hh}-${min}.xlsx`;
    }

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
