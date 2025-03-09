import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

function parseFechaInicio(fechaStr) {
  // Guarda la fecha de inicio directamente como string
  return fechaStr;
}

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

export async function PUT(request, { params }) {
   // Obtener la sesión (token) del usuario autenticado
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }
  console.log(">>> [API Debug] userId (de sesión):", session.id);
  console.log(">>> [API Debug] userName (de sesión):", session.username);
  const paramsData = await params;
  const { id } = paramsData;
  console.debug(">>> [API Debug] Iniciando PUT para envasado id:", id);
  try {
    const body = await request.json();
    // console.debug(">>> [API Debug] Payload recibido:", JSON.stringify(body, null, 2));

    const { editEnvasado } = body;
    if (!editEnvasado) {
      console.error(">>> [API Debug] Payload inválido: falta editEnvasado");
      return NextResponse.json({ error: "Payload inválido: falta editEnvasado" }, { status: 400 });
    }
    console.debug(">>> [API Debug] editEnvasado completo:", JSON.stringify(editEnvasado, null, 2));

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
      console.error(">>> [API Debug] Faltan campos obligatorios en el payload:", JSON.stringify(editEnvasado, null, 2));
      return NextResponse.json(
        { error: "Faltan campos obligatorios en el payload." },
        { status: 400 }
      );
    }

    const fechaInicioStr = parseFechaInicio(editEnvasado.fechaInicio);
    console.debug(">>> [API Debug] Fecha de Inicio (string):", fechaInicioStr);

    const primerP = editEnvasado.primerProceso || {};
    const segundoP = editEnvasado.segundoProceso || {};
    const tercerP = editEnvasado.tercerProceso || {};
    const procesoFinal = editEnvasado.procesoFinal || {};

    console.debug(">>> [API Debug] Datos de primerProceso:", JSON.stringify(primerP, null, 2));
    console.debug(">>> [API Debug] Datos de segundoProceso:", JSON.stringify(segundoP, null, 2));
    console.debug(">>> [API Debug] Datos de tercerProceso:", JSON.stringify(tercerP, null, 2));
    console.debug(">>> [API Debug] Datos de procesoFinal:", JSON.stringify(procesoFinal, null, 2));

    if (primerP.numeroTransaccion) {
      const transaccionExistente = await prisma.primerProcesoEnv.findFirst({
        where: { numeroTransaccion: primerP.numeroTransaccion },
      });
      if (transaccionExistente && transaccionExistente.envasadoId !== parseInt(id, 10)) {
        console.warn(">>> [API Debug] Transacción ya existe y pertenece a otro registro:", primerP.numeroTransaccion);
        return NextResponse.json(
          { error: "La transacción ya existe y no pertenece a este registro." },
          { status: 400 }
        );
      }
    }

    if (tercerP && Object.keys(tercerP).length > 0 && Array.isArray(tercerP.vueltas)) {
      console.debug(">>> [API Debug] Validando vueltas en tercerProceso:", JSON.stringify(tercerP.vueltas, null, 2));
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

    const updatedEnvasado = await prisma.$transaction(async (tx) => {
      console.debug(">>> [API Debug] Actualizando envasado principal con datos:", {
        fechaInicio: editEnvasado.fechaInicio,
        tiempoTotal: editEnvasado.tiempoTotal,
      });
      const envasadoUpdated = await tx.envasado.update({
        where: { id: parseInt(id, 10) },
        data: {
          userId: parseInt(session.id, 10) || null,
          userName: session.username || "",
          fechaInicio: editEnvasado.fechaInicio,
          tiempoTotal: editEnvasado.tiempoTotal,
        },
      });
      console.debug(">>> [API Debug] Envasado principal actualizado:", JSON.stringify(envasadoUpdated, null, 2));

      if (editEnvasado.primerProceso) {
        console.debug(">>> [API Debug] Actualizando primerProceso con datos:", JSON.stringify(primerP, null, 2));
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
        console.debug(">>> [API Debug] Primer Proceso actualizado:", JSON.stringify(primerProcesoUpdated, null, 2));
      }

      let segundoProcesoUpdated = null;
      if (editEnvasado.segundoProceso) {
        console.debug(">>> [API Debug] Actualizando segundoProceso con datos:", JSON.stringify(segundoP, null, 2));
        segundoProcesoUpdated = await tx.segundoProcesoEnv.update({
          where: { envasadoId: envasadoUpdated.id },
          data: {
            operador: segundoP.operador,
            grupo: segundoP.grupo,
            modeloEquipo: segundoP.modeloEquipo,
            personalAsignado: segundoP.personalAsignado ? parseInt(segundoP.personalAsignado, 10) : undefined,
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
            parosStatsTotalParos: segundoP.parosStats ? segundoP.parosStats.totalParos : undefined,
            parosStatsTiempoTotalParos: segundoP.parosStats ? segundoP.parosStats.tiempoTotalParos : undefined,
          },
        });
        console.debug(">>> [API Debug] Segundo Proceso actualizado:", JSON.stringify(segundoProcesoUpdated, null, 2));

        if (segundoP.paros && Array.isArray(segundoP.paros)) {
          console.debug(">>> [API Debug] Procesando paros:", JSON.stringify(segundoP.paros, null, 2));
          for (const paro of segundoP.paros) {
            let paroId = paro.id;
            if (!paroId) {
              const paroExistente = await tx.parosEnv.findFirst({
                where: {
                  segundoProcesoEnvId: segundoProcesoUpdated.id,
                  inicio: paro.inicio,
                  fin: paro.fin,
                  razon: paro.razon,
                },
              });
              if (paroExistente) {
                paroId = paroExistente.id;
              }
            }
            if (paroId) {
              const paroUpdated = await tx.parosEnv.update({
                where: { id: paroId },
                data: {
                  inicio: paro.inicio,
                  fin: paro.fin,
                  razon: paro.razon,
                  diffCargaInicio: paro.diffCargaInicio,
                  duracionParo: paro.duracionParo,
                },
              });
              console.debug(">>> [API Debug] Paro actualizado:", JSON.stringify(paroUpdated, null, 2));
            } else {
              const paroCreated = await tx.parosEnv.create({
                data: {
                  segundoProcesoEnvId: segundoProcesoUpdated.id,
                  inicio: paro.inicio,
                  fin: paro.fin,
                  razon: paro.razon,
                  diffCargaInicio: paro.diffCargaInicio,
                  duracionParo: paro.duracionParo,
                },
              });
              console.debug(">>> [API Debug] Paro creado:", JSON.stringify(paroCreated, null, 2));
            }
          }
        }
      }

      let updatedTercerProcesoEnv = null;
      if (editEnvasado.tercerProceso) {
        console.debug(">>> [API Debug] Actualizando tercerProceso con datos:", JSON.stringify(tercerP, null, 2));
        updatedTercerProcesoEnv = await tx.tercerProcesoEnv.update({
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
        console.debug(">>> [API Debug] Tercer Proceso actualizado:", JSON.stringify(updatedTercerProcesoEnv, null, 2));

        if (Array.isArray(tercerP.vueltas)) {
          console.debug(">>> [API Debug] Procesando vueltas:", JSON.stringify(tercerP.vueltas, null, 2));
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
              console.debug(">>> [API Debug] Actualizando vuelta con id:", vueltaId, "datos:", JSON.stringify(vuelta, null, 2));
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
              console.debug(">>> [API Debug] Vueltas actualizada:", JSON.stringify(vueltaUpdated, null, 2));
            } else {
              console.warn(">>> [API Debug] No se encontró registro para la vuelta", vuelta.numeroVuelta);
            }
          }
        }
      }

      if (editEnvasado.procesoFinal) {
        console.debug(">>> [API Debug] Actualizando procesoFinal con datos:", JSON.stringify(procesoFinal, null, 2));
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
        console.debug(">>> [API Debug] Proceso Final actualizado:", JSON.stringify(procesoFinalUpdated, null, 2));
      }

      return envasadoUpdated;
    });

    console.debug(">>> [API Debug] Transacción completada exitosamente. Resultado final:", JSON.stringify(updatedEnvasado, null, 2));
    return NextResponse.json({ ok: true, envasado: updatedEnvasado }, { status: 200 });
  } catch (err) {
    console.error("Error al actualizar el envasado:", err);
    return NextResponse.json({ error: "Error al actualizar el envasado" }, { status: 500 });
  }
}
