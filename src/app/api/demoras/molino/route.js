import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

function parseFechaInicio(fechaStr) {
  // Se guarda la fecha de inicio directamente como string
  return fechaStr;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const totalCount = await prisma.molino.count();
    const molinos = await prisma.molino.findMany({
      include: {
        primerProceso: true,
        segundoProceso: { include: { parosMol: true } },
        tercerProceso: { include: { vueltasMol: true } },
        procesoFinal: true,
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json({ data: molinos, totalCount }, { status: 200 });
  } catch (err) {
    console.error("Error al listar molinos:", err);
    return NextResponse.json({ error: "Error al listar molinos" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Obtener la sesión (token) del usuario autenticado
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }

    const body = await request.json();
    console.log(">>> [API Debug] BODY RECIBIDO:", body);

    // Se espera que el body tenga la propiedad molinoProcess
    const { molinoProcess } = body;
    if (!molinoProcess) {
      console.warn(">>> [API Debug] molinoProcess es undefined o null.");
      return NextResponse.json({ error: "Faltan datos en el body" }, { status: 400 });
    }

    // Extraer datos generales
    const fechaInicioStr = parseFechaInicio(molinoProcess.fechaInicio);
    console.log(">>> [API Debug] Fecha de Inicio (string):", fechaInicioStr);
    console.log(">>> [API Debug] userId (de sesión):", session.id);
    console.log(">>> [API Debug] userName (de sesión):", session.username);

    // Extraer procesos
    const primerP = molinoProcess.primerProceso || {};
    const segundoP = molinoProcess.segundoProceso || {};
    const tercerP = molinoProcess.tercerProceso || {};
    const finalP = molinoProcess.procesoFinal || {};

    // Validar duplicidad en el Primer Proceso Mol (por numeroTransaccion)
    if (primerP.numeroTransaccion) {
      const transaccionExistente = await prisma.primerProcesoMol.findFirst({
        where: { numeroTransaccion: primerP.numeroTransaccion },
      });
      if (transaccionExistente) {
        console.warn(">>> [API Debug] Transacción ya existe:", primerP.numeroTransaccion);
        return NextResponse.json({ error: "La transacción ya existe" }, { status: 400 });
      }
    }

    // Validar las vueltas del Tercer Proceso Mol
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

    // Ejecutar operaciones en una transacción
    const createdData = await prisma.$transaction(async (tx) => {
      // Crear registro principal en Molino usando datos de la sesión
      const molinoCreado = await tx.molino.create({
        data: {
          userId: parseInt(session.id, 10) || null,
          userName: session.username || "",
          fechaInicio: fechaInicioStr,
          tiempoTotal: molinoProcess.tiempoTotal || null,
        },
      });
      console.log(">>> [API Debug] Molino creado con ID:", molinoCreado.id);

      // Crear Primer Proceso Mol
      if (Object.keys(primerP).length > 0) {
        await tx.primerProcesoMol.create({
          data: {
            molId: molinoCreado.id,
            numeroTransaccion: primerP.numeroTransaccion || "",
            numeroOrden: primerP.numeroOrden || "",
            numeroCriba: primerP.numeroCriba || "",
            numeroMolino: primerP.numeroMolino || "",
            pesadorEntrada: primerP.pesadorEntrada || "",
            porteriaEntrada: primerP.porteriaEntrada || "",
            presentacion: primerP.presentacion || "",
            puntoDespacho: primerP.puntoDespacho || "",
            puntoEnvasado: primerP.puntoEnvasado || "",
            basculaEntrada: primerP.basculaEntrada || "",
            metodoCarga: primerP.metodoCarga || "",
            numeroEjes: primerP.numeroEjes || "",
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
        console.log(">>> [API Debug] Primer proceso (Molino) creado con éxito.");
      } else {
        console.log(">>> [API Debug] primerProceso vacío, no se crea registro.");
      }

      // Crear Segundo Proceso Mol y sus paros
      let segundoProcesoMolCreado = null;
      if (Object.keys(segundoP).length > 0) {
        segundoProcesoMolCreado = await tx.segundoProcesoMol.create({
          data: {
            molId: molinoCreado.id,
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
            tiempoInicioMolido: segundoP.tiempoInicioMolido?.hora || "",
            inicioMolidoObservaciones: segundoP.tiempoInicioMolido?.comentarios || "",
            tiempoTerminaMolido: segundoP.tiempoTerminaMolido?.hora || "",
            terminaMolidoObservaciones: segundoP.tiempoTerminaMolido?.comentarios || "",
            tiempoSalidaPunto: segundoP.tiempoSalidaPunto?.hora || "",
            salidaPuntoObservaciones: segundoP.tiempoSalidaPunto?.comentarios || "",
          },
        });
        console.log(">>> [API Debug] Segundo proceso (Molino) creado con éxito.");

        if (Array.isArray(segundoP.paros) && segundoProcesoMolCreado) {
          for (let i = 0; i < segundoP.paros.length; i++) {
            const paro = segundoP.paros[i];
            await tx.parosMol.create({
              data: {
                segundoProcesoMolId: segundoProcesoMolCreado.id,
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

      // Crear Tercer Proceso Mol y sus vueltas
      if (Object.keys(tercerP).length > 0) {
        const terceroCreado = await tx.tercerProcesoMol.create({
          data: {
            molId: molinoCreado.id,
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
        console.log(">>> [API Debug] Tercer proceso (Molino) creado con ID:", terceroCreado.id);

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
              await tx.vueltasMol.create({
                data: {
                  tercerProcesoMolId: terceroCreado.id,
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

      // Crear Proceso Final Mol
      if (Object.keys(finalP).length > 0) {
        await tx.procesoFinalMol.create({
          data: {
            molId: molinoCreado.id,
            tiempoSalidaPlanta: finalP.tiempoSalidaPlanta?.hora || "",
            salidaPlantaObservaciones: finalP.tiempoSalidaPlanta?.comentarios || "",
            porteriaSalida: finalP.porteriaSalida || "",
            tiempoLlegadaPorteria: finalP.tiempoLlegadaPorteria?.hora || "",
            llegadaPorteriaObservaciones: finalP.tiempoLlegadaPorteria?.comentarios || "",
          },
        });
        console.log(">>> [API Debug] Proceso final (Molino) creado con éxito.");
      } else {
        console.log(">>> [API Debug] procesoFinal vacío, no se crea registro.");
      }

      return molinoCreado;
    });

    console.log(">>> [API Debug] Todo creado correctamente. Respondiendo con status 201.");
    return NextResponse.json({ ok: true, id: createdData.id }, { status: 201 });
  } catch (err) {
    console.error("Error al guardar molino:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Registro duplicado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al guardar molino" }, { status: 500 });
  }
}
