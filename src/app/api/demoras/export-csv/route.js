import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { Parser as Json2CsvParser } from "json2csv";

// ✅ Método GET - Genera y exporta el CSV
export async function GET() {
  try {
    // 1) Obtener todos los registros desde la base de datos
    const demoras = await prisma.demora.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 2) "Aplanar" la data para que se vea mejor en CSV
    const rows = demoras.map((d) => {
      const data = d.data || {};
      return {
        id: d.id,
        fechaInicio: data.fechaInicio || "",
        primer_terminal: data.primerProceso?.terminal || "",
        primer_cliente: data.primerProceso?.cliente || "",
        placa: data.primerProceso?.placa || "",
        remolque: data.primerProceso?.remolque || "",
        ejes: data.primerProceso?.ejes || "",
        pesador: data.primerProceso?.pesador || "",
        pesoInicial: data.primerProceso?.pesoInicial || "",
        tipoProducto: data.primerProceso?.tipoProducto || "",
        puntoDespacho: data.primerProceso?.puntoDespacho || "",
        basculaEntrada: data.primerProceso?.basculaEntrada || "",
        tipoCarga: data.primerProceso?.tipoCarga || "",
        metodoCarga: data.primerProceso?.metodoCarga || "",

        // Segundo proceso
        enlonador: data.segundoProceso?.enlonador || "",
        operador: data.segundoProceso?.operador || "",
        personalAsignado: data.segundoProceso?.personalAsignado || "",
        modeloEquipo: data.segundoProceso?.modeloEquipo || "",

        // Tercer proceso
        pesadorSalida: data.tercerProceso?.pesadorSalida || "",
        basculaSalida: data.tercerProceso?.basculaSalida || "",
        pesoNeto: data.tercerProceso?.pesoNeto || "",

        // Tiempos primer proceso
        tiempoPrechequeo: data.primerProceso?.tiempoPrechequeo?.hora || "",
        tiempoScanner: data.primerProceso?.tiempoScanner?.hora || "",
        tiempoAutorizacion: data.primerProceso?.tiempoAutorizacion?.hora || "",
        tiempoIngresoPlanta: data.primerProceso?.tiempoIngresoPlanta?.hora || "",
        tiempoEntradaBascula: data.primerProceso?.tiempoEntradaBascula?.hora || "",
        tiempoSalidaBascula: data.primerProceso?.tiempoSalidaBascula?.hora || "",

        // Tiempos segundo proceso
        tiempoLlegadaPunto: data.segundoProceso?.tiempoLlegadaPunto?.hora || "",
        tiempoSalidaPunto: data.segundoProceso?.tiempoSalidaPunto?.hora || "",

        // Tiempos tercer proceso
        tiempoEntradaBasculaSalida: data.tercerProceso?.tiempoEntradaBascula?.hora || "",
        tiempoSalidaBasculaSalida: data.tercerProceso?.tiempoSalidaBascula?.hora || "",

        // Vueltas
        vueltas: Array.isArray(data.tercerProceso?.vueltas)
          ? data.tercerProceso.vueltas.map(
              (v, index) =>
                `Vuelta ${index + 1}: Llegada ${v.llegadaPunto.hora || "N/A"}, Salida ${v.salidaPunto.hora || "N/A"}`
            ).join(" | ")
          : "",
      };
    });

    // 3) Definir los campos del CSV
    const fields = [
      "id",
      "fechaInicio",
      "primer_terminal",
      "primer_cliente",
      "placa",
      "remolque",
      "ejes",
      "pesador",
      "pesoInicial",
      "tipoProducto",
      "puntoDespacho",
      "basculaEntrada",
      "tipoCarga",
      "metodoCarga",
      "enlonador",
      "operador",
      "personalAsignado",
      "modeloEquipo",
      "pesadorSalida",
      "basculaSalida",
      "pesoNeto",
      "tiempoPrechequeo",
      "tiempoScanner",
      "tiempoAutorizacion",
      "tiempoIngresoPlanta",
      "tiempoEntradaBascula",
      "tiempoSalidaBascula",
      "tiempoLlegadaPunto",
      "tiempoSalidaPunto",
      "tiempoEntradaBasculaSalida",
      "tiempoSalidaBasculaSalida",
      "vueltas",
    ];

    // 4) Convertir a CSV
    const parser = new Json2CsvParser({ fields });
    const csv = parser.parse(rows);

    // 5) Responder con el CSV
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=demoras_export.csv",
      },
    });
  } catch (err) {
    console.error("❌ Error generando CSV:", err);
    return NextResponse.json({ error: "Error generando CSV" }, { status: 500 });
  }
}

// ✅ Manejo de métodos no permitidos
export function POST() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 });
}
