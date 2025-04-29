// src/app/api/chat/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";  // Ajusta la ruta si tu estructura difiere
import { getToken } from "next-auth/jwt";

export async function GET(request, { params }) {
  // params viene como Promise en Next.js 15+, así que lo aguardamos:
  const { id } = await params;
  const ticketId = Number(id);
  if (isNaN(ticketId)) {
    return NextResponse.json(
      { error: "ticketId inválido" },
      { status: 400 }
    );
  }

  // --- Autenticación / Autorización ---
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 403 }
    );
  }
  const userId = token.user?.id ?? token.id;
  const roleId = token.user?.roleId ?? token.roleId;

  // --- Parámetro `since` para fetch incremental ---
  const sinceParam = request.nextUrl.searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : null;

  // Filtro para mensajes: si hay `since`, sólo los posteriores
  const mensajesWhere = sinceDate
    ? { ticketId, createdAt: { gt: sinceDate } }
    : { ticketId };

  // Definimos los campos que queremos del ticket
  const ticketSelect = {
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
      select: { id: true, username: true, nombreCompleto: true, roleId: true },
    },
    admin: {
      select: { id: true, username: true, nombreCompleto: true, roleId: true },
    },
    mensajes: {
      where: mensajesWhere,
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
      },
      orderBy: { createdAt: "asc" },
    },
  };

  // Carga del ticket según rol
  let ticket;
  if (Number(roleId) === 1) {
    ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: ticketSelect,
    });
  } else {
    ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId: Number(userId) },
      select: ticketSelect,
    });
  }

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket no encontrado o sin permisos" },
      { status: 404 }
    );
  }

  // Calculamos el último timestamp de los mensajes devueltos
  const { mensajes } = ticket;
  const lastTimestamp = mensajes.length
    ? mensajes[mensajes.length - 1].createdAt.toISOString()
    : sinceParam || null;

  // Si vinimos con `since`, devolvemos sólo el array de mensajes nuevos + timestamp
  if (sinceParam) {
    return NextResponse.json(
      { mensajes, lastTimestamp },
      { status: 200 }
    );
  }

  // Primera carga: devolvemos todo el ticket + mensajes completos + timestamp
  return NextResponse.json(
    { ...ticket, lastTimestamp },
    { status: 200 }
  );
}
