import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma"; // Ajusta la ruta según tu proyecto
import { getToken } from "next-auth/jwt";

export async function GET(request, { params }) {
  const { id } = await params; // El parámetro dinámico [id] corresponde al ticketId
  const ticketId = Number(id);
  
  if (isNaN(ticketId)) {
    return NextResponse.json({ error: "ticketId inválido" }, { status: 400 });
  }

  // Obtener token para validar la sesión y extraer datos del usuario
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }

  // Extraer datos relevantes de la sesión
  const userId = token?.user?.id || token?.id;
  const roleId = token?.user?.roleId || token?.roleId;

  let ticket;
  if (Number(roleId) === 1) {
    // Si el usuario es admin (roleId === 1) puede acceder a cualquier ticket
    ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        numero: true,
        fecha: true,
        hora: true,
        userName: true,
        asunto: true,
        descripcion: true,
        estado: true,
        assignedTo: true,
        // Información del usuario que creó el ticket
        user: {
          select: {
            id: true,
            username: true,
            nombreCompleto: true,
            roleId: true,
          },
        },
        // Información del admin asignado (si existe)
        admin: {
          select: {
            id: true,
            username: true,
            nombreCompleto: true,
            roleId: true,
          },
        },
        // Se incluye la relación con los mensajes del ticket
        mensajes: {
          select: {
            id: true,
            ticketId: true,
            senderId: true,
            receiverId: true,
            text: true,
            imageUrl: true,
            imagenPublicId: true,
            delivered: true,
            read: true,
            createdAt: true,
            updatedAt: true,
            // Opcionalmente se pueden incluir datos de sender y receiver
            sender: {
              select: {
                id: true,
                username: true,
                nombreCompleto: true,
                roleId: true,
              },
            },
            receiver: {
              select: {
                id: true,
                username: true,
                nombreCompleto: true,
                roleId: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } else {
    // Si no es admin, se verifica que el ticket pertenezca al usuario autenticado
    ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId: Number(userId),
      },
      select: {
        id: true,
        numero: true,
        fecha: true,
        hora: true,
        userName: true,
        asunto: true,
        descripcion: true,
        estado: true,
        assignedTo: true,
        user: {
          select: {
            id: true,
            username: true,
            nombreCompleto: true,
            roleId: true,
          },
        },
        admin: {
          select: {
            id: true,
            username: true,
            nombreCompleto: true,
            roleId: true,
          },
        },
        mensajes: {
          select: {
            id: true,
            ticketId: true,
            senderId: true,
            receiverId: true,
            text: true,
            imageUrl: true,
            imagenPublicId: true,
            delivered: true,
            read: true,
            createdAt: true,
            updatedAt: true,
            sender: {
              select: {
                id: true,
                username: true,
                nombreCompleto: true,
                roleId: true,
              },
            },
            receiver: {
              select: {
                id: true,
                username: true,
                nombreCompleto: true,
                roleId: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado o sin permisos" }, { status: 404 });
  }

  return NextResponse.json(ticket, { status: 200 });
}
