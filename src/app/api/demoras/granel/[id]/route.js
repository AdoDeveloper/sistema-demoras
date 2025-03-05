import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

function parseFechaInicio(fechaStr) {
  // Se guarda la fecha de inicio directamente como string
  return fechaStr;
}

// GET: Obtiene el registro de demora filtrado por el id, incluyendo todas las relaciones.
export async function GET(request, { params }) {
  // Obtenemos el token JWT, que incluye la información del usuario autenticado
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  
  // Extraemos el id y roleId del token
  const loggedUserId = parseInt(token.id, 10);
  const loggedRoleId = parseInt(token.roleId, 10);
  console.debug(">>> [API Debug] ID de usuario autenticado:", loggedUserId);
  console.debug(">>> [API Debug] ID de rol autenticado:", loggedRoleId);
  
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const demora = await prisma.demora.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        primerProceso: true,
        segundoProceso: true,
        tercerProceso: { include: { vueltas: true } },
        procesoFinal: true,
      },
    });
    if (!demora) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    // Permitir acceso si el usuario es administrador (roleId === 1) o si el registro le pertenece
    if (loggedRoleId !== 1 && demora.userId !== loggedUserId) {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a este registro" },
        { status: 403 }
      );
    }
    return NextResponse.json({ demora }, { status: 200 });
  } catch (err) {
    console.error("Error al obtener la demora:", err);
    return NextResponse.json({ error: "Error al obtener la demora" }, { status: 500 });
  }
}

// PUT: Actualiza el registro de demora y todos sus procesos asociados utilizando una transacción de Prisma
export async function PUT(request, { params }) {
  // Espera a que params se resuelva antes de usar sus propiedades.
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const body = await request.json();
    // Extraer el objeto editDemora del payload
    const { editDemora } = body;
    if (!editDemora) {
      return NextResponse.json({ error: "Payload inválido: falta editDemora" }, { status: 400 });
    }
    // Validación de campos obligatorios
    if (
      !editDemora.userId ||
      !editDemora.userName ||
      !editDemora.fechaInicio ||
      !editDemora.tiempoTotal ||
      !editDemora.primerProceso ||
      !editDemora.segundoProceso ||
      !editDemora.tercerProceso ||
      !editDemora.procesoFinal
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios en el payload." },
        { status: 400 }
      );
    }
    // Validar que el Primer Proceso incluya la hora de autorización.
    if (
      !editDemora.primerProceso.tiempoAutorizacion ||
      !editDemora.primerProceso.tiempoAutorizacion.hora
    ) {
      return NextResponse.json(
        { error: "Falta el dato de Autorización en el Primer Proceso." },
        { status: 400 }
      );
    }

    // Log de datos generales
    const fechaInicioStr = parseFechaInicio(editDemora.fechaInicio);
    console.debug(">>> [API Debug] Fecha de Inicio (string):", fechaInicioStr);
    console.debug(">>> [API Debug] userId:", editDemora.userId);
    console.debug(">>> [API Debug] userName:", editDemora.userName);

    // Extraer y loggear cada uno de los procesos
    const primerP = editDemora.primerProceso || {};
    const segundoP = editDemora.segundoProceso || {};
    const tercerP = editDemora.tercerProceso || {};
    const procesoFinal = editDemora.procesoFinal || {};

    console.debug(">>> [API Debug] Datos del Primer Proceso:", primerP);
    console.debug(">>> [API Debug] Datos del Segundo Proceso:", segundoP);
    console.debug(">>> [API Debug] Datos del Tercer Proceso:", tercerP);
    console.debug(">>> [API Debug] Datos del Proceso Final:", procesoFinal);

    // 2) Validar duplicidad en el Primer Proceso (por ejemplo, con el campo numeroTransaccion)
    if (primerP.numeroTransaccion) {
      const transaccionExistente = await prisma.primerProceso.findFirst({
        where: { numeroTransaccion: primerP.numeroTransaccion },
      });
      // Permite avanzar si no existe o si pertenece al mismo registro que se está actualizando
      if (
        transaccionExistente &&
        transaccionExistente.demoraId !== parseInt(id, 10)
      ) {
        console.warn(
          ">>> [API Debug] Transacción ya existe y pertenece a otro registro:",
          primerP.numeroTransaccion
        );
        return NextResponse.json(
          { error: "La transacción ya existe y no pertenece a este registro." },
          { status: 400 }
        );
      }
    }

    // 3) Validar las vueltas ANTES de iniciar la transacción para evitar saltos de ID
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

    // Ejecutar todas las operaciones en una transacción para garantizar atomicidad.
    const updatedDemora = await prisma.$transaction(async (tx) => {
      // Actualizar la Demora principal.
      const demoraUpdated = await tx.demora.update({
        where: { id: parseInt(id, 10) },
        data: {
          userId: editDemora.userId ? parseInt(editDemora.userId, 10) : undefined,
          userName: editDemora.userName,
          fechaInicio: editDemora.fechaInicio,
          tiempoTotal: editDemora.tiempoTotal,
        },
      });
      console.debug(">>> [API Debug] Demora principal actualizada:", demoraUpdated);

      // Actualizar el Primer Proceso.
      if (editDemora.primerProceso) {
        const primerProcesoUpdated = await tx.primerProceso.update({
          where: { demoraId: demoraUpdated.id },
          data: {
            numeroTransaccion: editDemora.primerProceso.numeroTransaccion,
            pesadorEntrada: editDemora.primerProceso.pesadorEntrada,
            porteriaEntrada: editDemora.primerProceso.porteriaEntrada,
            metodoCarga: editDemora.primerProceso.metodoCarga,
            numeroEjes: editDemora.primerProceso.numeroEjes,
            puntoDespacho: editDemora.primerProceso.puntoDespacho,
            basculaEntrada: editDemora.primerProceso.basculaEntrada,
            condicion: editDemora.primerProceso.condicion,
            tiempoPrechequeo: editDemora.primerProceso.tiempoPrechequeo?.hora,
            fechaPrechequeo: editDemora.primerProceso.tiempoPrechequeo?.fecha,
            prechequeoObservaciones: editDemora.primerProceso.tiempoPrechequeo?.comentarios,
            tiempoScanner: editDemora.primerProceso.tiempoScanner?.hora,
            fechaScanner: editDemora.primerProceso.tiempoScanner?.fecha,
            scannerObservaciones: editDemora.primerProceso.tiempoScanner?.comentarios,
            tiempoAutorizacion: editDemora.primerProceso.tiempoAutorizacion?.hora,
            fechaAutorizacion: editDemora.primerProceso.tiempoAutorizacion?.fecha,
            autorizacionObservaciones: editDemora.primerProceso.tiempoAutorizacion?.comentarios,
            tiempoIngresoPlanta: editDemora.primerProceso.tiempoIngresoPlanta?.hora,
            ingresoPlantaObservaciones: editDemora.primerProceso.tiempoIngresoPlanta?.comentarios,
            tiempoLlegadaBascula: editDemora.primerProceso.tiempoLlegadaBascula?.hora,
            llegadaBasculaObservaciones: editDemora.primerProceso.tiempoLlegadaBascula?.comentarios,
            tiempoEntradaBascula: editDemora.primerProceso.tiempoEntradaBascula?.hora,
            entradaBasculaObservaciones: editDemora.primerProceso.tiempoEntradaBascula?.comentarios,
            tiempoSalidaBascula: editDemora.primerProceso.tiempoSalidaBascula?.hora,
            salidaBasculaObservaciones: editDemora.primerProceso.tiempoSalidaBascula?.comentarios,
          },
        });
        console.debug(">>> [API Debug] Primer Proceso actualizado:", primerProcesoUpdated);
      }

      // Actualizar el Segundo Proceso.
      if (editDemora.segundoProceso) {
        const segundoProcesoUpdated = await tx.segundoProceso.update({
          where: { demoraId: demoraUpdated.id },
          data: {
            operador: editDemora.segundoProceso.operador,
            enlonador: editDemora.segundoProceso.enlonador,
            modeloEquipo: editDemora.segundoProceso.modeloEquipo,
            personalAsignado: editDemora.segundoProceso.personalAsignado
              ? parseInt(editDemora.segundoProceso.personalAsignado, 10)
              : undefined,
            personalAsignadoObservaciones: editDemora.segundoProceso.personalAsignadoObservaciones,
            tiempoLlegadaPunto: editDemora.segundoProceso.tiempoLlegadaPunto?.hora,
            llegadaPuntoObservaciones: editDemora.segundoProceso.tiempoLlegadaPunto?.comentarios,
            tiempoLlegadaOperador: editDemora.segundoProceso.tiempoLlegadaOperador?.hora,
            llegadaOperadorObservaciones: editDemora.segundoProceso.tiempoLlegadaOperador?.comentarios,
            tiempoLlegadaEnlonador: editDemora.segundoProceso.tiempoLlegadaEnlonador?.hora,
            llegadaEnlonadorObservaciones: editDemora.segundoProceso.tiempoLlegadaEnlonador?.comentarios,
            tiempoLlegadaEquipo: editDemora.segundoProceso.tiempoLlegadaEquipo?.hora,
            llegadaEquipoObservaciones: editDemora.segundoProceso.tiempoLlegadaEquipo?.comentarios,
            tiempoInicioCarga: editDemora.segundoProceso.tiempoInicioCarga?.hora,
            inicioCargaObservaciones: editDemora.segundoProceso.tiempoInicioCarga?.comentarios,
            tiempoTerminaCarga: editDemora.segundoProceso.tiempoTerminaCarga?.hora,
            terminaCargaObservaciones: editDemora.segundoProceso.tiempoTerminaCarga?.comentarios,
            tiempoSalidaPunto: editDemora.segundoProceso.tiempoSalidaPunto?.hora,
            salidaPuntoObservaciones: editDemora.segundoProceso.tiempoSalidaPunto?.comentarios,
          },
        });
        console.debug(">>> [API Debug] Segundo Proceso actualizado:", segundoProcesoUpdated);
      }

      // Actualizar el Tercer Proceso y sus Vueltas.
      let updatedTercerProceso = null;
      if (editDemora.tercerProceso) {
        updatedTercerProceso = await tx.tercerProceso.update({
          where: { demoraId: demoraUpdated.id },
          data: {
            basculaSalida: editDemora.tercerProceso.basculaSalida,
            pesadorSalida: editDemora.tercerProceso.pesadorSalida,
            tiempoLlegadaBascula: editDemora.tercerProceso.tiempoLlegadaBascula?.hora,
            llegadaBasculaObservaciones: editDemora.tercerProceso.tiempoLlegadaBascula?.comentarios,
            tiempoEntradaBascula: editDemora.tercerProceso.tiempoEntradaBascula?.hora,
            entradaBasculaObservaciones: editDemora.tercerProceso.tiempoEntradaBascula?.comentarios,
            tiempoSalidaBascula: editDemora.tercerProceso.tiempoSalidaBascula?.hora,
            salidaBasculaObservaciones: editDemora.tercerProceso.tiempoSalidaBascula?.comentarios,
          },
        });
        console.debug(">>> [API Debug] Tercer Proceso actualizado:", updatedTercerProceso);

        // Procesar las vueltas (solo actualiza, no crea nuevas).
        if (Array.isArray(editDemora.tercerProceso.vueltas)) {
          for (const vuelta of editDemora.tercerProceso.vueltas) {
            let vueltaId = vuelta.id;
            // Si no viene el id, intenta buscar la vuelta existente usando el número de vuelta y el id del tercer proceso.
            if (!vueltaId) {
              const vueltaExistente = await tx.vueltas.findFirst({
                where: {
                  tercerProcesoId: updatedTercerProceso.id, // updatedTercerProceso es el resultado de actualizar el tercer proceso.
                  numeroVuelta: vuelta.numeroVuelta,
                },
              });
              if (vueltaExistente) {
                vueltaId = vueltaExistente.id;
              }
            }
            if (vueltaId) {
              const vueltaUpdated = await tx.vueltas.update({
                where: { id: vueltaId },
                data: {
                  numeroVuelta: vuelta.numeroVuelta,
                  tiempoLlegadaPunto: vuelta.llegadaPunto?.hora,
                  llegadaPuntoObservaciones: vuelta.llegadaPunto?.comentarios,
                  tiempoSalidaPunto: vuelta.salidaPunto?.hora,
                  salidaPuntoObservaciones: vuelta.salidaPunto?.comentarios,
                  tiempoLlegadaBascula: vuelta.llegadaBascula?.hora,
                  llegadaBasculaObservaciones: vuelta.llegadaBascula?.comentarios,
                  tiempoEntradaBascula: vuelta.entradaBascula?.hora,
                  entradaBasculaObservaciones: vuelta.entradaBascula?.comentarios,
                  tiempoSalidaBascula: vuelta.salidaBascula?.hora,
                  salidaBasculaObservaciones: vuelta.salidaBascula?.comentarios,
                },
              });
              console.debug(">>> [API Debug] Vueltas actualizada:", vueltaUpdated);
            } else {
              console.warn("No se encontró registro para la vuelta", vuelta.numeroVuelta);
            }
          }
        }
      }

      // Actualizar el Proceso Final.
      if (editDemora.procesoFinal) {
        const procesoFinalUpdated = await tx.procesoFinal.update({
          where: { demoraId: demoraUpdated.id },
          data: {
            tiempoSalidaPlanta: editDemora.procesoFinal.tiempoSalidaPlanta?.hora,
            salidaPlantaObservaciones: editDemora.procesoFinal.tiempoSalidaPlanta?.comentarios,
            porteriaSalida: editDemora.procesoFinal.porteriaSalida,
            tiempoLlegadaPorteria: editDemora.procesoFinal.tiempoLlegadaPorteria?.hora,
            llegadaPorteriaObservaciones: editDemora.procesoFinal.tiempoLlegadaPorteria?.comentarios,
          },
        });
        console.debug(">>> [API Debug] Proceso Final actualizado:", procesoFinalUpdated);
      }

      return demoraUpdated;
    });

    return NextResponse.json({ ok: true, demora: updatedDemora }, { status: 200 });
  } catch (err) {
    console.error("Error al actualizar la demora:", err);
    return NextResponse.json({ error: "Error al actualizar la demora" }, { status: 500 });
  }
}
