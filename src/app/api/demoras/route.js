import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

function parseFechaInicio(fechaStr) {
  // Se guarda la fecha de inicio directamente como string
  return fechaStr;
}

export async function GET() {
  try {
    const demoras = await prisma.demora.findMany({
      include: {
        primerProceso: true,
        segundoProceso: true,
        tercerProceso: { include: { vueltas: true } },
        procesoFinal: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(demoras, { status: 200 });
  } catch (err) {
    console.error("Error al listar demoras:", err);
    return NextResponse.json({ error: "Error al listar demoras" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Leer y depurar el body recibido
    const body = await request.json();
    console.log(">>> [API Debug] BODY RECIBIDO");
    // debugger; // Descomenta para pausar la ejecución en modo debug

    const { demorasProcess } = body;
    if (!demorasProcess) {
      console.warn(">>> [API Debug] demorasProcess es undefined o null.");
      return NextResponse.json({ error: "Faltan datos en el body" }, { status: 400 });
    }

    // 1) Extraer datos generales
    const fechaInicioStr = parseFechaInicio(demorasProcess.fechaInicio);
    console.log(">>> [API Debug] Fecha de Inicio (string):", fechaInicioStr);
    console.log(">>> [API Debug] userId:", demorasProcess.userId);
    console.log(">>> [API Debug] userName:", demorasProcess.userName);

    // 2) Crear la Demora principal
    const demoraCreada = await prisma.demora.create({
      data: {
        userId: parseInt(demorasProcess.userId, 10) || null,
        userName: demorasProcess.userName || "",
        fechaInicio: fechaInicioStr,
        tiempoTotal: demorasProcess.tiempoTotal || null,
      },
    });
    console.log(">>> [API Debug] Demora creada con ID:", demoraCreada.id);

    // 3) Crear Primer Proceso
    const primerP = demorasProcess.primerProceso || {};
    console.log(">>> [API Debug] primerProceso:", primerP);
    if (Object.keys(primerP).length > 0) {
      await prisma.primerProceso.create({
        data: {
          demoraId: demoraCreada.id,
          numeroTransaccion: primerP.numeroTransaccion || "",
          pesadorEntrada: primerP.pesadorEntrada || "",
          porteriaEntrada: primerP.porteriaEntrada || "",
          metodoCarga: primerP.metodoCarga || "",
          puntoDespacho: primerP.puntoDespacho || "",
          basculaEntrada: primerP.basculaEntrada || "",
          tiempoPrechequeo: primerP.tiempoPrechequeo?.hora || "",
          fechaPrechequeo: primerP.tiempoPrechequeo?.fecha || "",
          prechequeoObservaciones: primerP.tiempoPrechequeo?.comentarios || "",
          tiempoScanner: primerP.tiempoScanner?.hora || "",
          fechaScanner: primerP.tiempoScanner?.fecha || "",
          scannerObservaciones: primerP.tiempoScanner?.comentarios || "",
          tiempoAutorizacion: primerP.tiempoAutorizacion?.hora || "",
          fechaAutorizacion: primerP.tiempoAutorizacion?.fecha || "",
          autorizacionObservaciones: primerP.tiempoAutorizacion?.comentarios || "",
          tiempoIngresoPlanta: primerP.tiempoIngresoPlanta?.hora || "",
          ingresoPlantaObservaciones: primerP.tiempoIngresoPlanta?.comentarios || "",
          tiemporLlegadaBascula: primerP.tiempoLlegadaBascula?.hora || "",
          llegadaBasculaObservaciones: primerP.tiempoLlegadaBascula?.comentarios || "",
          tiempoEntradaBascula: primerP.tiempoEntradaBascula?.hora || "",
          entradaBasculaObservaciones: primerP.tiempoEntradaBascula?.comentarios || "",
          tiempoSalidaBascula: primerP.tiempoSalidaBascula?.hora || "",
          salidaBasculaObservaciones: primerP.tiempoSalidaBascula?.comentarios || "",
        },
      });
      console.log(">>> [API Debug] Primer proceso creado con éxito.");
    } else {
      console.log(">>> [API Debug] primerProceso vacío, no se crea registro.");
    }

    // 4) Crear Segundo Proceso
    const segundoP = demorasProcess.segundoProceso || {};
    console.log(">>> [API Debug] segundoProceso:", segundoP);
    if (Object.keys(segundoP).length > 0) {
      await prisma.segundoProceso.create({
        data: {
          demoraId: demoraCreada.id,
          operador: segundoP.operador || "",
          enlonador: segundoP.enlonador || "",
          modeloEquipo: segundoP.modeloEquipo || "",
          personalAsignado: parseInt(segundoP.personalAsignado, 10) || 0,
          personalAsignadoObservaciones: segundoP.personalAsignadoObservaciones || "",
          tiempoLlegadaPunto: segundoP.tiempoLlegadaPunto?.hora || "",
          llegadaPuntoObservaciones: segundoP.tiempoLlegadaPunto?.comentarios || "",
          tiempoLlegadaOperador: segundoP.tiempoLlegadaOperador?.hora || "",
          llegadaOperadorObservaciones: segundoP.tiempoLlegadaOperador?.comentarios || "",
          tiempoLlegadaEnlonador: segundoP.tiempoLlegadaEnlonador?.hora || "",
          llegadaEnlonadorObservaciones: segundoP.tiempoLlegadaEnlonador?.comentarios || "",
          tiempoLlegadaEquipo: segundoP.tiempoLlegadaEquipo?.hora || "",
          llegadaEquipoObservaciones: segundoP.tiempoLlegadaEquipo?.comentarios || "",
          tiempoInicioCarga: segundoP.tiempoInicioCarga?.hora || "",
          inicioCargaObservaciones: segundoP.tiempoInicioCarga?.comentarios || "",
          tiempoTerminaCarga: segundoP.tiempoTerminaCarga?.hora || "",
          terminaCargaObservaciones: segundoP.tiempoTerminaCarga?.comentarios || "",
          tiempoSalidaPunto: segundoP.tiempoSalidaPunto?.hora || "",
          salidaPuntoObservaciones: segundoP.tiempoSalidaPunto?.comentarios || "",
        },
      });
      console.log(">>> [API Debug] Segundo proceso creado con éxito.");
    } else {
      console.log(">>> [API Debug] segundoProceso vacío, no se crea registro.");
    }

    // 5) Crear Tercer Proceso y sus Vueltas
    const tercerP = demorasProcess.tercerProceso || {};
    console.log(">>> [API Debug] tercerProceso:", tercerP);
    if (Object.keys(tercerP).length > 0) {
      const terceroCreado = await prisma.tercerProceso.create({
        data: {
          demoraId: demoraCreada.id,
          basculaSalida: tercerP.basculaSalida || "",
          pesadorSalida: tercerP.pesadorSalida || "",
          tiempoLlegadaBascula: tercerP.tiempoLlegadaBascula?.hora || "",
          llegadaBasculaObservaciones: tercerP.tiempoLlegadaBascula?.comentarios || "",
          tiempoEntradaBascula: tercerP.tiempoEntradaBascula?.hora || "",
          entradaBasculaObservaciones: tercerP.tiempoEntradaBascula?.comentarios || "",
          tiempoSalidaBascula: tercerP.tiempoSalidaBascula?.hora || "",
          salidaBasculaObservaciones: tercerP.tiempoSalidaBascula?.comentarios || "",
        },
      });
      console.log(">>> [API Debug] Tercer proceso creado con ID:", terceroCreado.id);
      if (Array.isArray(tercerP.vueltas)) {
        console.log(">>> [API Debug] Vueltas a crear:", JSON.stringify(tercerP.vueltas, null, 2));
        for (const unaVuelta of tercerP.vueltas) {
          await prisma.vueltas.create({
            data: {
              tercerProcesoId: terceroCreado.id,
              numeroVuelta: unaVuelta.numeroVuelta || 1,
              tiempoLlegadaPunto: unaVuelta.llegadaPunto?.hora || "",
              llegadaPuntoObservaciones: unaVuelta.llegadaPunto?.comentarios || "",
              tiempoSalidaPunto: unaVuelta.salidaPunto?.hora || "",
              salidaPuntoObservaciones: unaVuelta.salidaPunto?.comentarios || "",
              tiempoLlegadaBascula: unaVuelta.llegadaBascula?.hora || "",
              llegadaBasculaObservaciones: unaVuelta.llegadaBascula?.comentarios || "",
              tiempoEntradaBascula: unaVuelta.entradaBascula?.hora || "",
              entradaBasculaObservaciones: unaVuelta.entradaBascula?.comentarios || "",
              tiempoSalidaBascula: unaVuelta.salidaBascula?.hora || "",
              salidaBasculaObservaciones: unaVuelta.salidaBascula?.comentarios || "",
            },
          });
        }
        console.log(">>> [API Debug] Vueltas creadas satisfactoriamente.");
      } else {
        console.log(">>> [API Debug] No se encontró array de vueltas.");
      }
    } else {
      console.log(">>> [API Debug] tercerProceso vacío, no se crea registro.");
    }

    // 6) Crear Proceso Final
    const finalP = demorasProcess.procesoFinal || {};
    console.log(">>> [API Debug] procesoFinal:", finalP);
    if (Object.keys(finalP).length > 0) {
      await prisma.procesoFinal.create({
        data: {
          demoraId: demoraCreada.id,
          tiempoSalidaPlanta: finalP.tiempoSalidaPlanta?.hora || "",
          salidaPlantaObservaciones: finalP.tiempoSalidaPlanta?.comentarios || "",
          porteriaSalida: finalP.porteriaSalida || "",
          tiempoLlegadaPorteria: finalP.tiempoLlegadaPorteria?.hora || "",
          llegadaPorteriaObservaciones: finalP.tiempoLlegadaPorteria?.comentarios || "",
        },
      });
      console.log(">>> [API Debug] Proceso final creado con éxito.");
    } else {
      console.log(">>> [API Debug] procesoFinal vacío, no se crea registro.");
    }

    console.log(">>> [API Debug] Todo creado correctamente. Respondiendo con status 201.");
    return NextResponse.json({ ok: true, id: demoraCreada.id }, { status: 201 });
  } catch (err) {
    console.error("Error al guardar demoras:", err);
    return NextResponse.json({ error: "Error al guardar demoras" }, { status: 500 });
  }
}
