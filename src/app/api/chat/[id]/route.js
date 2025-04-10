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
  // Si el usuario es admin (roleId === 1) puede acceder a cualquier ticket
  if (Number(roleId) === 1) {
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
        // Incluimos la información del usuario (sin la contraseña)
        user: {
          select: {
            id: true,
            username: true,
            nombreCompleto: true,
            roleId: true,
            // No se incluye "password"
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
      },
    });
  }

  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado o sin permisos" }, { status: 404 });
  }

  return NextResponse.json(ticket, { status: 200 });
}
