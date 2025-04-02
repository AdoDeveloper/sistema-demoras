import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

function parseFechaInicio(fechaStr) {
  // Se guarda la fecha de inicio directamente como string
  return fechaStr;
}

// GET: Obtiene el registro de molino filtrado por el id, incluyendo todas sus relaciones.
export async function GET(request, { params }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const molino = await prisma.molino.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        primerProceso: true,
        segundoProceso: { include: { parosMol: true } },
        tercerProceso: { include: { vueltasMol: true } },
        procesoFinal: true,
      },
    });
    if (!molino) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    const loggedUserId = parseInt(token.id, 10);
    const loggedRoleId = parseInt(token.roleId, 10);
    if (loggedRoleId !== 1 && molino.userId !== loggedUserId) {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a este registro" },
        { status: 403 }
      );
    }
    return NextResponse.json({ molino }, { status: 200 });
  } catch (err) {
    console.error("Error al obtener el molino:", err);
    return NextResponse.json({ error: "Error al obtener el molino" }, { status: 500 });
  }
}

// PUT: Actualiza el registro de molino y todos sus procesos asociados utilizando una transacción de Prisma.
// Se actualizan los procesos y sus relaciones de forma similar a la API original para envasado.
export async function PUT(request, { params }) {
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { editMolino } = body;
    if (!editMolino) {
      return NextResponse.json({ error: "Payload inválido: falta editMolino" }, { status: 400 });
    }
    if (
      !editMolino.userId ||
      !editMolino.userName ||
      !editMolino.fechaInicio ||
      !editMolino.tiempoTotal ||
      !editMolino.primerProceso ||
      !editMolino.segundoProceso ||
      !editMolino.tercerProceso ||
      !editMolino.procesoFinal
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios en el payload." },
        { status: 400 }
      );
    }
    const fechaInicioStr = parseFechaInicio(editMolino.fechaInicio);
    console.debug(">>> [API Debug] Fecha de Inicio (string):", fechaInicioStr);

    const primerP = editMolino.primerProceso;
    const segundoP = editMolino.segundoProceso;
    const tercerP = editMolino.tercerProceso;
    const procesoFinal = editMolino.procesoFinal;

    // Validar duplicidad en el Primer Proceso (por ejemplo, usando numeroTransaccion)
    if (primerP.numeroTransaccion) {
      const transaccionExistente = await prisma.primerProcesoMol.findFirst({
        where: { numeroTransaccion: primerP.numeroTransaccion },
      });
      if (transaccionExistente && transaccionExistente.molId !== parseInt(id, 10)) {
        return NextResponse.json(
          { error: "La transacción ya existe y no pertenece a este registro." },
          { status: 400 }
        );
      }
    }

    // Validar las vueltas en el Tercer Proceso (suponiendo que la propiedad se llame "vueltas")
    if (tercerP && Array.isArray(tercerP.vueltas)) {
      for (const vuelta of tercerP.vueltas) {
        if (Number(vuelta.numeroVuelta) === 1) {
          const horaLlegadaPunto = vuelta.llegadaPunto?.hora || "";
          const horaSalidaPunto = vuelta.salidaPunto?.hora || "";
          const horaLlegadaBascula = vuelta.llegadaBascula?.hora || "";
          const horaEntradaBascula = vuelta.entradaBascula?.hora || "";
          const horaSalidaBascula = vuelta.salidaBascula?.hora || "";
          if (
            !horaLlegadaPunto.trim() ||
            !horaSalidaPunto.trim() ||
            !horaLlegadaBascula.trim() ||
            !horaEntradaBascula.trim() ||
            !horaSalidaBascula.trim()
          ) {
            const errorMsg =
              "Faltan horas obligatorias en la vuelta 1. Regrese al paso anterior y verifique.";
            return NextResponse.json({ error: errorMsg }, { status: 400 });
          }
        }
      }
    }

    // Se aumenta el timeout de la transacción a 10 segundos para evitar que expire durante la operación
    const updatedMolino = await prisma.$transaction(async (tx) => {
      // Actualizar molino principal
      const molinoUpdated = await tx.molino.update({
        where: { id: parseInt(id, 10) },
        data: {
          userId: parseInt(session.id, 10) || null,
          userName: session.username || "",
          fechaInicio: editMolino.fechaInicio,
          tiempoTotal: editMolino.tiempoTotal,
        },
      });
      console.debug(">>> [API Debug] Molino principal actualizado:", molinoUpdated);

      // Actualizar Primer Proceso de Molino
      const primerProcesoUpdated = await tx.primerProcesoMol.update({
        where: { molId: molinoUpdated.id },
        data: {
          numeroTransaccion: primerP.numeroTransaccion,
          numeroOrden: primerP.numeroOrden,
          numeroCriba: primerP.numeroCriba,
          numeroMolino: primerP.numeroMolino,
          pesadorEntrada: primerP.pesadorEntrada,
          porteriaEntrada: primerP.porteriaEntrada,
          presentacion: primerP.presentacion,
          puntoDespacho: primerP.puntoDespacho,
          puntoEnvasado: primerP.puntoEnvasado,
          basculaEntrada: primerP.basculaEntrada,
          metodoCarga: primerP.metodoCarga,
          numeroEjes: primerP.numeroEjes,
          condicion: primerP.condicion,
          tiempoScanner: primerP.tiempoScanner?.hora || null,
          fechaScanner: primerP.tiempoScanner?.fecha || null,
          scannerObservaciones: primerP.tiempoScanner?.comentarios || null,
          tiempoPrechequeo: primerP.tiempoPrechequeo?.hora || null,
          fechaPrechequeo: primerP.tiempoPrechequeo?.fecha || null,
          prechequeoObservaciones: primerP.tiempoPrechequeo?.comentarios || null,
          tiempoAutorizacion: primerP.tiempoAutorizacion?.hora || null,
          fechaAutorizacion: primerP.tiempoAutorizacion?.fecha || null,
          autorizacionObservaciones: primerP.tiempoAutorizacion?.comentarios || null,
          tiempoIngresoPlanta: primerP.tiempoIngresoPlanta?.hora || null,
          ingresoPlantaObservaciones: primerP.tiempoIngresoPlanta?.comentarios || null,
          tiempoLlegadaBascula: primerP.tiempoLlegadaBascula?.hora || null,
          llegadaBasculaObservaciones: primerP.tiempoLlegadaBascula?.comentarios || null,
          tiempoEntradaBascula: primerP.tiempoEntradaBascula?.hora || null,
          entradaBasculaObservaciones: primerP.tiempoEntradaBascula?.comentarios || null,
          tiempoSalidaBascula: primerP.tiempoSalidaBascula?.hora || null,
          salidaBasculaObservaciones: primerP.tiempoSalidaBascula?.comentarios || null,
        },
      });
      console.debug(">>> [API Debug] Primer Proceso de Molino actualizado:", primerProcesoUpdated);

      // Actualizar Segundo Proceso de Molino
      const segundoProcesoUpdated = await tx.segundoProcesoMol.update({
        where: { molId: molinoUpdated.id },
        data: {
          operador: segundoP.operador,
          grupo: segundoP.grupo,
          modeloEquipo: segundoP.modeloEquipo,
          personalAsignado: segundoP.personalAsignado
            ? parseInt(segundoP.personalAsignado, 10)
            : undefined,
          personalAsignadoObservaciones: segundoP.personalAsignadoObservaciones,
          parosStatsTotalParos: segundoP.parosStatsTotalParos,
          parosStatsTiempoTotalParos: segundoP.parosStatsTiempoTotalParos,
          tiempoLlegadaPunto: segundoP.tiempoLlegadaPunto?.hora || null,
          llegadaPuntoObservaciones: segundoP.tiempoLlegadaPunto?.comentarios || null,
          tiempoLlegadaOperador: segundoP.tiempoLlegadaOperador?.hora || null,
          llegadaOperadorObservaciones: segundoP.tiempoLlegadaOperador?.comentarios || null,
          tiempoLlegadaGrupo: segundoP.tiempoLlegadaGrupo?.hora || null,
          llegadaGrupoObservaciones: segundoP.tiempoLlegadaGrupo?.comentarios || null,
          tiempoLlegadaEquipo: segundoP.tiempoLlegadaEquipo?.hora || null,
          llegadaEquipoObservaciones: segundoP.tiempoLlegadaEquipo?.comentarios || null,
          tiempoInicioCarga: segundoP.tiempoInicioCarga?.hora || null,
          inicioCargaObservaciones: segundoP.tiempoInicioCarga?.comentarios || null,
          tiempoTerminaCarga: segundoP.tiempoTerminaCarga?.hora || null,
          terminaCargaObservaciones: segundoP.tiempoTerminaCarga?.comentarios || null,
          tiempoInicioMolido: segundoP.tiempoInicioMolido?.hora || null,
          inicioMolidoObservaciones: segundoP.tiempoInicioMolido?.comentarios || null,
          tiempoTerminaMolido: segundoP.tiempoTerminaMolido?.hora || null,
          terminaMolidoObservaciones: segundoP.tiempoTerminaMolido?.comentarios || null,
          tiempoSalidaPunto: segundoP.tiempoSalidaPunto?.hora || null,
          salidaPuntoObservaciones: segundoP.tiempoSalidaPunto?.comentarios || null,
        },
      });
      console.debug(">>> [API Debug] Segundo Proceso de Molino actualizado:", segundoProcesoUpdated);

      // Actualizar Paros del Segundo Proceso de Molino
      if (segundoP.paros && Array.isArray(segundoP.paros)) {
        const parosExistentes = await tx.parosMol.findMany({
          where: { segundoProcesoMolId: segundoProcesoUpdated.id },
          orderBy: { id: "asc" },
        });
        console.debug(">>> [API Debug] Paros existentes (Molino):", parosExistentes);
        for (let i = 0; i < segundoP.paros.length; i++) {
          if (i < parosExistentes.length) {
            const payloadParo = segundoP.paros[i];
            const paroUpdated = await tx.parosMol.update({
              where: { id: parosExistentes[i].id },
              data: {
                inicio: payloadParo.inicio,
                fin: payloadParo.fin,
                razon: payloadParo.razon,
                diffCargaInicio: payloadParo.diffCargaInicio,
                duracionParo: payloadParo.duracionParo,
              },
            });
            console.debug(">>> [API Debug] Paro (Molino) actualizado:", paroUpdated);
          } else {
            console.warn(`>>> [API Debug] No existe paro para el índice ${i}. Se omite la actualización.`);
          }
        }
      }

      // Actualizar Tercer Proceso de Molino y sus Vueltas
      const updatedTercerProcesoMol = await tx.tercerProcesoMol.update({
        where: { molId: molinoUpdated.id },
        data: {
          basculaSalida: tercerP.basculaSalida,
          pesadorSalida: tercerP.pesadorSalida,
          tiempoLlegadaBascula: tercerP.tiempoLlegadaBascula?.hora || null,
          llegadaBasculaObservaciones: tercerP.tiempoLlegadaBascula?.comentarios || null,
          tiempoEntradaBascula: tercerP.tiempoEntradaBascula?.hora || null,
          entradaBasculaObservaciones: tercerP.tiempoEntradaBascula?.comentarios || null,
          tiempoSalidaBascula: tercerP.tiempoSalidaBascula?.hora || null,
          salidaBasculaObservaciones: tercerP.tiempoSalidaBascula?.comentarios || null,
        },
      });
      console.debug(">>> [API Debug] Tercer Proceso de Molino actualizado:", updatedTercerProcesoMol);

      // Procesar Vueltas del Tercer Proceso de Molino (actualiza solo las existentes)
      if (tercerP && Array.isArray(tercerP.vueltas)) {
        for (const vuelta of tercerP.vueltas) {
          let vueltaId = vuelta.id;
          if (!vueltaId) {
            const vueltaExistente = await tx.vueltasMol.findFirst({
              where: {
                tercerProcesoMolId: updatedTercerProcesoMol.id,
                numeroVuelta: vuelta.numeroVuelta,
              },
            });
            if (vueltaExistente) {
              vueltaId = vueltaExistente.id;
            }
          }
          if (vueltaId) {
            const vueltaUpdated = await tx.vueltasMol.update({
              where: { id: vueltaId },
              data: {
                numeroVuelta: vuelta.numeroVuelta,
                tiempoLlegadaPunto: vuelta.llegadaPunto?.hora || null,
                llegadaPuntoObservaciones: vuelta.llegadaPunto?.comentarios || null,
                tiempoSalidaPunto: vuelta.salidaPunto?.hora || null,
                salidaPuntoObservaciones: vuelta.salidaPunto?.comentarios || null,
                tiempoLlegadaBascula: vuelta.llegadaBascula?.hora || null,
                llegadaBasculaObservaciones: vuelta.llegadaBascula?.comentarios || null,
                tiempoEntradaBascula: vuelta.entradaBascula?.hora || null,
                entradaBasculaObservaciones: vuelta.entradaBascula?.comentarios || null,
                tiempoSalidaBascula: vuelta.salidaBascula?.hora || null,
                salidaBasculaObservaciones: vuelta.salidaBascula?.comentarios || null,
              },
            });
            console.debug(">>> [API Debug] Vueltas de Molino actualizada:", vueltaUpdated);
          } else {
            console.warn(">>> [API Debug] No se encontró registro para la vuelta", vuelta.numeroVuelta);
          }
        }
      }

      // Actualizar Proceso Final de Molino
      const procesoFinalUpdated = await tx.procesoFinalMol.update({
        where: { molId: molinoUpdated.id },
        data: {
          tiempoSalidaPlanta: procesoFinal.tiempoSalidaPlanta?.hora || null,
          salidaPlantaObservaciones: procesoFinal.tiempoSalidaPlanta?.comentarios || null,
          porteriaSalida: procesoFinal.porteriaSalida,
          tiempoLlegadaPorteria: procesoFinal.tiempoLlegadaPorteria?.hora || null,
          llegadaPorteriaObservaciones: procesoFinal.tiempoLlegadaPorteria?.comentarios || null,
        },
      });
      console.debug(">>> [API Debug] Proceso Final de Molino actualizado:", procesoFinalUpdated);

      return molinoUpdated;
    }, { timeout: 10000 }); // Timeout ajustado a 10 segundos

    console.debug(">>> [API Debug] Transacción completada exitosamente. Resultado final:", updatedMolino);
    return NextResponse.json({ ok: true, molino: updatedMolino }, { status: 200 });
  } catch (err) {
    console.error("Error al actualizar el molino:", err);
    return NextResponse.json({ error: "Error al actualizar el molino" }, { status: 500 });
  }
}