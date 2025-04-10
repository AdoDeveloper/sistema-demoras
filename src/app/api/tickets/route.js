import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";
import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary usando la variable de entorno
cloudinary.config(process.env.CLOUDINARY_URL);

// Función para generar el número de ticket con el formato #TKTXXXX
function generateTicketNumber() {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `#TKT${randomPart}`;
}

// GET: Listar tickets con paginación y búsqueda
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";

  // Asegurarse de que la página sea >= 1
  if (page < 1) {
    page = 1;
  }

  // Construir cláusula de búsqueda para los campos: asunto, userName y estado
  const searchClause = search
    ? {
        OR: [
          { asunto: { contains: search, mode: "insensitive" } },
          { userName: { contains: search, mode: "insensitive" } },
          { estado: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  // Obtener el token para verificar la sesión
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  //console.log("Token recibido:", token);

  // Extraer roleId y currentUserId (asegúrate de que el token incluya estos datos)
  const roleIdFromToken = token?.user?.roleId || token?.roleId;
  const currentUserId = token?.user?.id || token?.id;

  // Si el usuario no es admin, filtrar solo los tickets cuyo userId coincida con el usuario actual
  let whereClause = searchClause;
  if (!(roleIdFromToken && Number(roleIdFromToken) === 1)) {
    whereClause = {
      AND: [searchClause, { userId: Number(currentUserId) }],
    };
  }

  try {
    const totalCount = await prisma.ticket.count({ where: whereClause });
    const skip = (page - 1) * limit;

    // Listar tickets sin incluir la relación de mensajes
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      skip,
      take: limit,
      select: {
        id: true,
        numero: true,
        fecha: true,
        hora: true,
        userName: true,
        userId: true,
        asunto: true,
        descripcion: true,
        imagenUrl: true,
        estado: true,
        assignedTo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Preparar respuesta básica
    let responseData = { data: tickets, totalCount };

    // Si el usuario es administrador, incluir la lista de administradores y la lista de usuarios
    if (roleIdFromToken && Number(roleIdFromToken) === 1) {
      // Lista de administradores
      const admins = await prisma.user.findMany({
        where: { roleId: 1 },
        select: {
          id: true,
          username: true,
          nombreCompleto: true,
        },
      });
      responseData.admins = admins;
      // Lista completa de usuarios (para asignar tickets)
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          nombreCompleto: true,
        },
      });
      responseData.users = users;
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (err) {
    console.error("Error al listar tickets:", err);
    return NextResponse.json({ error: "Error al listar tickets" }, { status: 500 });
  }
}

// POST: Crear un nuevo Ticket
export async function POST(request) {
  try {
    // Obtener la sesión (token) del usuario autenticado
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 403 });
    }

    // Obtener el body en formato JSON
    const body = await request.json();
    const { fecha, hora, asunto, descripcion, imageData, imageSize } = body;

    if (!fecha || !hora || !asunto || !descripcion) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Validar el tamaño de la imagen (10 MB)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    let imagenUrl = null;
    let imagenPublicId = null;

    if (imageData) {
      if (imageSize && Number(imageSize) >= MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "La imagen debe ser menor a 10 MB" }, { status: 400 });
      }
      // Subir la imagen a Cloudinary en la carpeta "tickets"
      const uploadResponse = await cloudinary.uploader.upload(imageData, { folder: "tickets" });
      imagenUrl = uploadResponse.secure_url;
      imagenPublicId = uploadResponse.public_id; // <-- Capturamos el public_id
    }

    // Generar número de ticket
    const numero = generateTicketNumber();

    // Determinar si el usuario autenticado es admin
    const isAdmin = (token?.user?.roleId || token?.roleId) === 1;
    let ticketUserId, ticketUserName;
    if (isAdmin && body.forUserId) {
      ticketUserId = parseInt(body.forUserId, 10);
      ticketUserName = body.forUserName || "";
    } else {
      ticketUserId = parseInt(token?.user?.id || token?.id, 10);
      ticketUserName = token?.user?.nombreCompleto || token?.nombreCompleto;
      console.log("User ID:", ticketUserId);
      console.log("User Name:", ticketUserName);
    }

    // Asignar el ticket a un administrador (opcional)
    const assignedTo = body.assignedTo ? parseInt(body.assignedTo, 10) : null;

    // Crear el registro en la tabla Ticket
    const createdTicket = await prisma.ticket.create({
      data: {
        numero,
        fecha,
        hora,
        userName: ticketUserName,
        userId: ticketUserId,
        asunto,
        descripcion,
        imagenUrl,
        imagenPublicId,
        estado: body.estado || "pendiente",
        assignedTo,
      },
    });

    return NextResponse.json({ ok: true, id: createdTicket.id }, { status: 201 });
  } catch (err) {
    console.error("Error al guardar ticket:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Registro duplicado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al guardar ticket" }, { status: 500 });
  }
}