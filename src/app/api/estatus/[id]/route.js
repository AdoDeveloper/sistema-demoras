// app/api/estatus/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma"; // Ajusta la ruta según la estructura de tu proyecto
import { getToken } from "next-auth/jwt";

export async function PUT(request, { params }) {
  const { id } = await params; // El parámetro dinámico [id] corresponde al ticketId
  const ticketId = Number(id);

  if (isNaN(ticketId)) {
    return NextResponse.json({ error: "ticketId inválido" }, { status: 400 });
  }

  // Obtener el token para validar la sesión y extraer datos del usuario
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 403 });
  }
  
  // Extraer datos relevantes de la sesión
  const userId = token?.user?.id || token?.id;
  const roleId = token?.user?.roleId || token?.roleId;

  try {
    const { newStatus } = await request.json();
    
    if (!newStatus) {
      return NextResponse.json({ error: "El nuevo estado es requerido" }, { status: 400 });
    }

    // Verificar que el ticket exista
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    // Solo el admin o el dueño del ticket pueden actualizar el estado
    if (Number(roleId) !== 1 && Number(userId) !== ticket.userId) {
      return NextResponse.json({ error: "No tiene permisos para actualizar este ticket" }, { status: 403 });
    }
    
    // Actualizar el estado del ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { estado: newStatus },
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
      },
    });

    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar el estado del ticket:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
