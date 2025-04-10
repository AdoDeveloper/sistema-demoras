import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";
import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary usando la variable de entorno
cloudinary.config(process.env.CLOUDINARY_URL);

// PUT: Actualizar un Ticket (solo para admin)
export async function PUT(request, { params }) {
  // Convertir el id a número
  const { id } = await params;
  const ticketId = parseInt(id, 10);

  try {
    // Verificación de token y rol
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }
    const roleId = token?.user?.roleId || token?.roleId;
    if (Number(roleId) !== 1) {
      return NextResponse.json({ error: "No autorizado para editar tickets" }, { status: 403 });
    }

    const body = await request.json();
    const updateData = {};

    // Set de los campos que llegan
    if (body.fecha) updateData.fecha = body.fecha;
    if (body.hora) updateData.hora = body.hora;
    if (body.asunto) updateData.asunto = body.asunto;
    if (body.descripcion) updateData.descripcion = body.descripcion;
    if (body.estado) updateData.estado = body.estado;
    if (body.assignedTo !== undefined) {
      updateData.assignedTo = body.assignedTo ? parseInt(body.assignedTo, 10) : null;
    }

    // Comprobamos si llegó una imagen nueva
    if (body.imageData) {
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
      if (body.imageSize && Number(body.imageSize) >= MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "La imagen debe ser menor a 10 MB" }, { status: 400 });
      }

      // 1) Obtener la info del ticket actual para saber si tiene imagen previa
      const oldTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      // 2) Si existe una imagen previa con publicId, la eliminamos en Cloudinary
      if (oldTicket?.imagenPublicId) {
        await cloudinary.uploader.destroy(oldTicket.imagenPublicId);
      }

      // 3) Subir la nueva imagen a Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(body.imageData, { folder: "tickets" });
      // Guardamos la url de la imagen y el publicId en la DB
      updateData.imagenUrl = uploadResponse.secure_url;
      updateData.imagenPublicId = uploadResponse.public_id;
    }

    // Actualizamos el ticket en la base de datos
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return NextResponse.json({ ok: true, ticket: updatedTicket }, { status: 200 });
  } catch (err) {
    console.error("Error al actualizar ticket:", err);
    return NextResponse.json({ error: "Error al actualizar ticket" }, { status: 500 });
  }
}

// DELETE: Eliminar un Ticket (solo para admin)
export async function DELETE(request, { params }) {
  // Convertir el id a número
  const { id } = await params;
  const ticketId = parseInt(id, 10);

  try {
    // Verificación de token y rol
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }
    const roleId = token?.user?.roleId || token?.roleId;
    if (Number(roleId) !== 1) {
      return NextResponse.json({ error: "No autorizado para eliminar tickets" }, { status: 403 });
    }

    // 1) Obtener la info del ticket actual para saber si tiene imagen previa
    const oldTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    // 2) Si tiene publicId, eliminamos la imagen en Cloudinary
    if (oldTicket?.imagenPublicId) {
      await cloudinary.uploader.destroy(oldTicket.imagenPublicId);
    }

    // 3) Ahora sí, eliminamos el ticket en la base de datos
    await prisma.ticket.delete({ where: { id: ticketId } });

    return NextResponse.json({ ok: true, message: "Ticket eliminado correctamente" }, { status: 200 });
  } catch (err) {
    console.error("Error al eliminar ticket:", err);
    return NextResponse.json({ error: "Error al eliminar ticket" }, { status: 500 });
  }
}
