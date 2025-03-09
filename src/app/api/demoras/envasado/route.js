import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

function parseFechaInicio(fechaStr) {
  // Se guarda la fecha de inicio directamente como string
  return fechaStr;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const totalCount = await prisma.envasado.count();
    const envasados = await prisma.envasado.findMany({
      include: {
        primerProceso: true,
        segundoProceso: { include: { parosEnv: true } },
        tercerProceso: { include: { vueltasEnv: true } },
        procesoFinal: true,
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json({ data: envasados, totalCount }, { status: 200 });
  } catch (err) {
    console.error("Error al listar envasados:", err);
    return NextResponse.json({ error: "Error al listar envasados" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log(">>> [API Debug] BODY RECIBIDO:", body);

    // Se espera que el body tenga la propiedad envasadoProcess (en singular)
    const { envasadoProcess } = body;
    if (!envasadoProcess) {
      console.warn(">>> [API Debug] envasadoProcess es undefined o null.");
      return NextResponse.json({ error: "Faltan datos en el body" }, { status: 400 });
    }

    // 1) Extraer datos generales
    const fechaInicioStr = parseFechaInicio(envasadoProcess.fechaInicio);
    console.log(">>> [API Debug] Fecha de Inicio (string):", fechaInicioStr);
    console.log(">>> [API Debug] userId:", envasadoProcess.userId);
    console.log(">>> [API Debug] userName:", envasadoProcess.userName);

    // Extraer los procesos (todos los campos sin omitir)
    const primerP = envasadoProcess.primerProceso || {};
    const segundoP = envasadoProcess.segundoProceso || {};
    const tercerP = envasadoProcess.tercerProceso || {};
    const finalP = envasadoProcess.procesoFinal || {};

    // 2) Validar duplicidad en el Primer Proceso Env (por numeroTransaccion)
    if (primerP.numeroTransaccion) {
      const transaccionExistente = await prisma.primerProcesoEnv.findFirst({
        where: { numeroTransaccion: primerP.numeroTransaccion },
      });
      if (transaccionExistente) {
        console.warn(">>> [API Debug] Transacción ya existe:", primerP.numeroTransaccion);
        return NextResponse.json({ error: "La transacción ya existe" }, { status: 400 });
      }
    }

    // 3) Validar las vueltas del Tercer Proceso Env
    if (tercerP && Object.keys(tercerP).length > 0 && Array.isArray(tercerP.vueltas)) {
      for (let i = 0; i < tercerP.vueltas.length; i++) {
        const unaVuelta = tercerP.vueltas[i];
        if (Number(unaVuelta.numeroVuelta) === 1) {
          const horaLlegadaPunto = unaVuelta.llegadaPunto?.hora || "";
          const horaSalidaPunto = unaVuelta.salidaPunto?.hora || "";
          const horaLlegadaBascula = unaVuelta.llegadaBascula?.hora || "";
          const horaEntradaBascula = unaVuelta.entradaBascula?.hora || "";
          const horaSalidaBascula = unaVuelta.salidaBascula?.hora || "";
          
          if (
            !horaLlegadaPunto.trim() ||
            !horaSalidaPunto.trim() ||
            !horaLlegadaBascula.trim() ||
            !horaEntradaBascula.trim() ||
            !horaSalidaBascula.trim()
          ) {
            const errorMsg = "Faltan horas obligatorias en la vuelta 1. Regrese al paso anterior y verifique.";
            console.error(">>> [API Debug]", errorMsg);
            return NextResponse.json({ error: errorMsg }, { status: 400 });
          }
        }
      }
    }

    // 4) Ejecutar todas las operaciones en una transacción
    const createdData = await prisma.$transaction(async (tx) => {
      // Crear el registro principal en Envasado
      const envasadoCreado = await tx.envasado.create({
        data: {
          userId: parseInt(envasadoProcess.userId, 10) || null,
          userName: envasadoProcess.userName || "",
          fechaInicio: fechaInicioStr,
          tiempoTotal: envasadoProcess.tiempoTotal || null,
        },
      });
      console.log(">>> [API Debug] Envasado creado con ID:", envasadoCreado.id);

      // Crear Primer Proceso Env (se incluye numeroOrden)
      if (Object.keys(primerP).length > 0) {
        await tx.primerProcesoEnv.create({
          data: {
            envasadoId: envasadoCreado.id,
            numeroTransaccion: primerP.numeroTransaccion || "",
            numeroOrden: primerP.numeroOrden || "",
            pesadorEntrada: primerP.pesadorEntrada || "",
            porteriaEntrada: primerP.porteriaEntrada || "",
            metodoCarga: primerP.metodoCarga || "",
            numeroEjes: primerP.numeroEjes || "",
            puntoDespacho: primerP.puntoDespacho || "",
            puntoEnvasado: primerP.puntoEnvasado || "",
            basculaEntrada: primerP.basculaEntrada || "",
            condicion: primerP.condicion || "",
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
            tiempoLlegadaBascula: primerP.tiempoLlegadaBascula?.hora || "",
            llegadaBasculaObservaciones: primerP.tiempoLlegadaBascula?.comentarios || "",
            tiempoEntradaBascula: primerP.tiempoEntradaBascula?.hora || "",
            entradaBasculaObservaciones: primerP.tiempoEntradaBascula?.comentarios || "",
            tiempoSalidaBascula: primerP.tiempoSalidaBascula?.hora || "",
            salidaBasculaObservaciones: primerP.tiempoSalidaBascula?.comentarios || "",
          },
        });
        console.log(">>> [API Debug] Primer proceso (Envasados) creado con éxito.");
      } else {
        console.log(">>> [API Debug] primerProceso vacío, no se crea registro.");
      }

      // Crear Segundo Proceso Env y sus paros
      let segundoProcesoEnvCreado = null;
      if (Object.keys(segundoP).length > 0) {
        segundoProcesoEnvCreado = await tx.segundoProcesoEnv.create({
          data: {
            envasadoId: envasadoCreado.id,
            operador: segundoP.operador || "",
            grupo: segundoP.grupo || "",
            modeloEquipo: segundoP.modeloEquipo || "",
            personalAsignado: parseInt(segundoP.personalAsignado, 10) || 0,
            personalAsignadoObservaciones: segundoP.personalAsignadoObservaciones || "",
            parosStatsTotalParos: segundoP.parosStats?.totalParos || null,
            parosStatsTiempoTotalParos: segundoP.parosStats?.tiempoTotalParos || "",
            tiempoLlegadaPunto: segundoP.tiempoLlegadaPunto?.hora || "",
            llegadaPuntoObservaciones: segundoP.tiempoLlegadaPunto?.comentarios || "",
            tiempoLlegadaOperador: segundoP.tiempoLlegadaOperador?.hora || "",
            llegadaOperadorObservaciones: segundoP.tiempoLlegadaOperador?.comentarios || "",
            tiempoLlegadaGrupo: segundoP.tiempoLlegadaGrupo?.hora || "",
            llegadaGrupoObservaciones: segundoP.tiempoLlegadaGrupo?.comentarios || "",
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
        console.log(">>> [API Debug] Segundo proceso (Envasados) creado con éxito.");

        // Crear registros para los paros del Segundo Proceso Env
        if (Array.isArray(segundoP.paros) && segundoProcesoEnvCreado) {
          for (let i = 0; i < segundoP.paros.length; i++) {
            const paro = segundoP.paros[i];
            await tx.parosEnv.create({
              data: {
                segundoProcesoEnvId: segundoProcesoEnvCreado.id,
                inicio: paro.inicio || "",
                fin: paro.fin || "",
                razon: paro.razon || "",
                diffCargaInicio: paro.diffCargaInicio || "",
                duracionParo: paro.duracionParo || "",
              },
            });
            console.log(`>>> [API Debug] Paro ${i + 1} para Segundo Proceso creado con éxito.`);
          }
        }
      } else {
        console.log(">>> [API Debug] segundoProceso vacío, no se crea registro.");
      }

      // Crear Tercer Proceso Env y sus VueltasEnv
      if (Object.keys(tercerP).length > 0) {
        const terceroCreado = await tx.tercerProcesoEnv.create({
          data: {
            envasadoId: envasadoCreado.id,
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
        console.log(">>> [API Debug] Tercer proceso (Envasados) creado con ID:", terceroCreado.id);

        if (Array.isArray(tercerP.vueltas)) {
          console.log(">>> [API Debug] Procesando vueltas:", tercerP.vueltas);
          for (let i = 0; i < tercerP.vueltas.length; i++) {
            const unaVuelta = tercerP.vueltas[i];
            console.log(`>>> [API Debug] Procesando vuelta ${i + 1}:`, unaVuelta);
            
            if (Number(unaVuelta.numeroVuelta) === 1) {
              const horaLlegadaPunto = unaVuelta.llegadaPunto?.hora || "";
              const horaSalidaPunto = unaVuelta.salidaPunto?.hora || "";
              const horaLlegadaBascula = unaVuelta.llegadaBascula?.hora || "";
              const horaEntradaBascula = unaVuelta.entradaBascula?.hora || "";
              const horaSalidaBascula = unaVuelta.salidaBascula?.hora || "";
              if (
                !horaLlegadaPunto.trim() ||
                !horaSalidaPunto.trim() ||
                !horaLlegadaBascula.trim() ||
                !horaEntradaBascula.trim() ||
                !horaSalidaBascula.trim()
              ) {
                const errorMsg = "Error: Faltan horas obligatorias en la vuelta 1 (validación interna).";
                console.error(">>> [API Debug]", errorMsg);
                throw new Error(errorMsg);
              }
            }
            
            try {
              await tx.vueltasEnv.create({
                data: {
                  tercerProcesoEnvId: terceroCreado.id,
                  numeroVuelta: unaVuelta.numeroVuelta || (i + 1),
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
              console.log(`>>> [API Debug] Vuelta ${i + 1} creada exitosamente`);
            } catch (error) {
              console.error(`>>> [API Debug] Error al crear vuelta ${i + 1}:`, error);
              throw error;
            }
          }
        } else {
          console.log(">>> [API Debug] No se encontró array de vueltas.");
        }
      } else {
        console.log(">>> [API Debug] tercerProceso vacío, no se crea registro.");
      }

      // Crear Proceso Final Env
      if (Object.keys(finalP).length > 0) {
        await tx.procesoFinalEnv.create({
          data: {
            envasadoId: envasadoCreado.id,
            tiempoSalidaPlanta: finalP.tiempoSalidaPlanta?.hora || "",
            salidaPlantaObservaciones: finalP.tiempoSalidaPlanta?.comentarios || "",
            porteriaSalida: finalP.porteriaSalida || "",
            tiempoLlegadaPorteria: finalP.tiempoLlegadaPorteria?.hora || "",
            llegadaPorteriaObservaciones: finalP.tiempoLlegadaPorteria?.comentarios || "",
          },
        });
        console.log(">>> [API Debug] Proceso final (Envasados) creado con éxito.");
      } else {
        console.log(">>> [API Debug] procesoFinal vacío, no se crea registro.");
      }

      return envasadoCreado;
    });

    console.log(">>> [API Debug] Todo creado correctamente. Respondiendo con status 201.");
    return NextResponse.json({ ok: true, id: createdData.id }, { status: 201 });
  } catch (err) {
    console.error("Error al guardar envasados:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Registro duplicado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al guardar envasados" }, { status: 500 });
  }
}
