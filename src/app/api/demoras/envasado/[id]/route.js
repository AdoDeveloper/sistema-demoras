import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

function parseFechaInicio(fechaStr) {
  // Se guarda la fecha de inicio directamente como string
  return fechaStr;
}

// GET: Obtiene el registro de envasado filtrado por el id, incluyendo todas sus relaciones.
export async function GET(request, { params }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const paramsData = await params;
  const { id } = paramsData;
  try {
    const envasado = await prisma.envasado.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        primerProceso: true,
        segundoProceso: { include: { parosEnv: true } },
        tercerProceso: { include: { vueltasEnv: true } },
        procesoFinal: true,
      },
    });
    if (!envasado) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    const loggedUserId = parseInt(token.id, 10);
    const loggedRoleId = parseInt(token.roleId, 10);
    if (loggedRoleId !== 1 && envasado.userId !== loggedUserId) {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a este registro" },
        { status: 403 }
      );
    }
    return NextResponse.json({ envasado }, { status: 200 });
  } catch (err) {
    console.error("Error al obtener el envasado:", err);
    return NextResponse.json({ error: "Error al obtener el envasado" }, { status: 500 });
  }
}

// PUT: Actualiza el registro de envasado y todos sus procesos asociados utilizando una transacción de Prisma.
// En el Segundo Proceso se actualizan los paros asociados, usando el id del segundo proceso para obtenerlos
// y actualizarlos según el orden en que se reciben del payload.
export async function PUT(request, { params }) {
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const body = await request.json();
    const { editEnvasado } = body;
    if (!editEnvasado) {
      return NextResponse.json({ error: "Payload inválido: falta editEnvasado" }, { status: 400 });
    }
    if (
      !editEnvasado.userId ||
      !editEnvasado.userName ||
      !editEnvasado.fechaInicio ||
      !editEnvasado.tiempoTotal ||
      !editEnvasado.primerProceso ||
      !editEnvasado.segundoProceso ||
      !editEnvasado.tercerProceso ||
      !editEnvasado.procesoFinal
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios en el payload." },
        { status: 400 }
      );
    }
    const fechaInicioStr = parseFechaInicio(editEnvasado.fechaInicio);
    console.debug(">>> [API Debug] Fecha de Inicio (string):", fechaInicioStr);

    const primerP = editEnvasado.primerProceso;
    const segundoP = editEnvasado.segundoProceso;
    const tercerP = editEnvasado.tercerProceso;
    const procesoFinal = editEnvasado.procesoFinal;

    // Validar duplicidad en el Primer Proceso (por ejemplo, usando numeroTransaccion)
    if (primerP.numeroTransaccion) {
      const transaccionExistente = await prisma.primerProcesoEnv.findFirst({
        where: { numeroTransaccion: primerP.numeroTransaccion },
      });
      if (transaccionExistente && transaccionExistente.envasadoId !== parseInt(id, 10)) {
        return NextResponse.json(
          { error: "La transacción ya existe y no pertenece a este registro." },
          { status: 400 }
        );
      }
    }

    // Validar las vueltas en el Tercer Proceso
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

    const updatedEnvasado = await prisma.$transaction(async (tx) => {
      // Actualizar envasado principal
      const envasadoUpdated = await tx.envasado.update({
        where: { id: parseInt(id, 10) },
        data: {
          userId: parseInt(session.id, 10) || null,
          userName: session.username || "",
          fechaInicio: editEnvasado.fechaInicio,
          tiempoTotal: editEnvasado.tiempoTotal,
        },
      });
      console.debug(">>> [API Debug] Envasado principal actualizado:", envasadoUpdated);

      // Actualizar Primer Proceso
      const primerProcesoUpdated = await tx.primerProcesoEnv.update({
        where: { envasadoId: envasadoUpdated.id },
        data: {
          numeroTransaccion: primerP.numeroTransaccion,
          numeroOrden: primerP.numeroOrden,
          pesadorEntrada: primerP.pesadorEntrada,
          porteriaEntrada: primerP.porteriaEntrada,
          metodoCarga: primerP.metodoCarga,
          numeroEjes: primerP.numeroEjes,
          puntoDespacho: primerP.puntoDespacho,
          puntoEnvasado: primerP.puntoEnvasado,
          basculaEntrada: primerP.basculaEntrada,
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
      console.debug(">>> [API Debug] Primer Proceso actualizado:", primerProcesoUpdated);

      // Actualizar Segundo Proceso
      const segundoProcesoUpdated = await tx.segundoProcesoEnv.update({
        where: { envasadoId: envasadoUpdated.id },
        data: {
          operador: segundoP.operador,
          grupo: segundoP.grupo,
          modeloEquipo: segundoP.modeloEquipo,
          personalAsignado: segundoP.personalAsignado
            ? parseInt(segundoP.personalAsignado, 10)
            : undefined,
          personalAsignadoObservaciones: segundoP.personalAsignadoObservaciones,
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
          tiempoSalidaPunto: segundoP.tiempoSalidaPunto?.hora || null,
          salidaPuntoObservaciones: segundoP.tiempoSalidaPunto?.comentarios || null,
        },
      });
      console.debug(">>> [API Debug] Segundo Proceso actualizado:", segundoProcesoUpdated);

      // Actualizar Paros del Segundo Proceso:
      // Se obtienen los paros asociados al segundo proceso (ordenados por id) y se actualizan en el mismo orden que vienen en el payload.
      if (segundoP.paros && Array.isArray(segundoP.paros)) {
        const parosExistentes = await tx.parosEnv.findMany({
          where: { segundoProcesoEnvId: segundoProcesoUpdated.id },
          orderBy: { id: "asc" },
        });
        console.debug(">>> [API Debug] Paros existentes:", parosExistentes);
        for (let i = 0; i < segundoP.paros.length; i++) {
          if (i < parosExistentes.length) {
            const payloadParo = segundoP.paros[i];
            const paroUpdated = await tx.parosEnv.update({
              where: { id: parosExistentes[i].id },
              data: {
                inicio: payloadParo.inicio,
                fin: payloadParo.fin,
                razon: payloadParo.razon,
                diffCargaInicio: payloadParo.diffCargaInicio,
                duracionParo: payloadParo.duracionParo,
              },
            });
            console.debug(">>> [API Debug] Paro actualizado:", paroUpdated);
          } else {
            console.warn(`>>> [API Debug] No existe paro para el índice ${i}. Se omite la actualización.`);
          }
        }
      }

      // Actualizar Tercer Proceso y sus Vueltas
      const updatedTercerProcesoEnv = await tx.tercerProcesoEnv.update({
        where: { envasadoId: envasadoUpdated.id },
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
      console.debug(">>> [API Debug] Tercer Proceso actualizado:", updatedTercerProcesoEnv);

      // Procesar Vueltas del Tercer Proceso (solo se actualizan las existentes)
      if (Array.isArray(tercerP.vueltas)) {
        for (const vuelta of tercerP.vueltas) {
          let vueltaId = vuelta.id;
          if (!vueltaId) {
            const vueltaExistente = await tx.vueltasEnv.findFirst({
              where: {
                tercerProcesoEnvId: updatedTercerProcesoEnv.id,
                numeroVuelta: vuelta.numeroVuelta,
              },
            });
            if (vueltaExistente) {
              vueltaId = vueltaExistente.id;
            }
          }
          if (vueltaId) {
            const vueltaUpdated = await tx.vueltasEnv.update({
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
            console.debug(">>> [API Debug] Vueltas actualizada:", vueltaUpdated);
          } else {
            console.warn(">>> [API Debug] No se encontró registro para la vuelta", vuelta.numeroVuelta);
          }
        }
      }

      // Actualizar Proceso Final
      const procesoFinalUpdated = await tx.procesoFinalEnv.update({
        where: { envasadoId: envasadoUpdated.id },
        data: {
          tiempoSalidaPlanta: procesoFinal.tiempoSalidaPlanta?.hora || null,
          salidaPlantaObservaciones: procesoFinal.tiempoSalidaPlanta?.comentarios || null,
          porteriaSalida: procesoFinal.porteriaSalida,
          tiempoLlegadaPorteria: procesoFinal.tiempoLlegadaPorteria?.hora || null,
          llegadaPorteriaObservaciones: procesoFinal.tiempoLlegadaPorteria?.comentarios || null,
        },
      });
      console.debug(">>> [API Debug] Proceso Final actualizado:", procesoFinalUpdated);

      return envasadoUpdated;
    });

    console.debug(">>> [API Debug] Transacción completada exitosamente. Resultado final:", updatedEnvasado);
    return NextResponse.json({ ok: true, envasado: updatedEnvasado }, { status: 200 });
  } catch (err) {
    console.error("Error al actualizar el envasado:", err);
    return NextResponse.json({ error: "Error al actualizar el envasado" }, { status: 500 });
  }
}
