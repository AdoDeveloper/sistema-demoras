import { Server } from "socket.io"; 
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config(process.env.CLOUDINARY_URL);
const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("🔌 Inicializando Socket.IO...");
    const io = new Server(res.socket.server, { path: "/api/socketio" });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("🟢 Cliente conectado:", socket.id);

      // Al unirse a la sala
      socket.on("joinTicketRoom", async ({ ticketId, userId, isSupport }) => {
        try {
          if (!ticketId || !userId) {
            socket.emit("errorMessage", { message: "ticketId y userId son requeridos" });
            return;
          }

          const roomId = String(ticketId);
          socket.data.userId = userId;
          socket.data.isSupport = isSupport;
          socket.data.roomId = roomId;

          socket.join(roomId);
          console.log(
            `Cliente ${socket.id} (userId: ${userId}, isSupport: ${isSupport}) se unió a la sala ${roomId}`
          );

          // Cargar y enviar todos los mensajes previos para el ticket, incluyendo la información del receptor
          const oldMessages = await prisma.mensaje.findMany({
            where: { ticketId: Number(ticketId) },
            include: {
              sender: {
                select: { id: true, username: true, nombreCompleto: true, roleId: true },
              },
              receiver: {
                select: { id: true, username: true, nombreCompleto: true, roleId: true },
              },
            },
            orderBy: { createdAt: "asc" },
          });

          console.log(`Enviando ${oldMessages.length} mensajes previos a la sala ${roomId}`);
          io.to(roomId).emit("previousMessages", oldMessages);
        } catch (error) {
          console.error("Error en joinTicketRoom:", error);
          socket.emit("errorMessage", { message: "Error al unirse a la sala: " + error.message });
        }
      });

      // Se ha eliminado el manejo del estado de actividad de los usuarios,
      // por lo que el evento "userStatusChanged" y sus invocaciones ya no se utilizan.

      // Manejo de salida de la sala
      socket.on("leaveTicketRoom", async ({ ticketId, userId, isSupport }) => {
        try {
          const roomId = String(ticketId);
          socket.leave(roomId);
          console.log(`Cliente ${socket.id} (userId: ${userId}) salió de la sala ${roomId}`);
        } catch (error) {
          console.error("Error al salir de la sala:", error);
          socket.emit("errorMessage", { message: "Error al salir de la sala" });
        }
      });

      // Envío de mensajes (incluye subida de imágenes a Cloudinary y receptor)
      socket.on("sendMessage", async (data) => {
        const { ticketId, senderId, receiverId, text, imageData, imageSize } = data;

        if (!ticketId || !senderId) {
          return socket.emit("errorMessage", { message: "ticketId y senderId son requeridos" });
        }

        let imageUrl = null;
        let imagenPublicId = null;
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

        if (imageData) {
          if (imageSize && Number(imageSize) >= MAX_IMAGE_SIZE) {
            return socket.emit("errorMessage", { message: "La imagen debe ser menor a 10 MB" });
          }
          try {
            const uploadResponse = await cloudinary.uploader.upload(imageData, { folder: "chat" });
            imageUrl = uploadResponse.secure_url;
            imagenPublicId = uploadResponse.public_id;
            console.log("Imagen subida a Cloudinary:", imageUrl);
          } catch (error) {
            console.error("Error al subir imagen a Cloudinary:", error);
            return socket.emit("errorMessage", { message: "Error al subir imagen" });
          }
        }

        try {
          const nuevoMensaje = await prisma.mensaje.create({
            data: {
              ticketId: Number(ticketId),
              senderId,
              receiverId: receiverId ? Number(receiverId) : null,
              text,
              imageUrl,
              imagenPublicId,
              createdAt: new Date(),
            },
            include: {
              sender: { select: { id: true, nombreCompleto: true, username: true } },
              receiver: { select: { id: true, nombreCompleto: true, username: true, roleId: true } },
            },
          });
          console.log(`Mensaje creado para sala ${ticketId}: ${nuevoMensaje.id}`);
          io.to(String(ticketId)).emit("newMessage", nuevoMensaje);
        } catch (error) {
          console.error("Error al guardar el mensaje:", error);
          socket.emit("errorMessage", { message: "Error al guardar el mensaje: " + error.message });
        }
      });

      // Marcar mensajes como entregados
      socket.on("messageDelivered", async ({ ticketId, messageIds }) => {
        try {
          if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            console.warn("messageDelivered recibió messageIds inválidos");
            return;
          }

          const numericIds = messageIds
            .filter((id) => !id.toString().includes("-"))
            .map((id) => Number(id));

          if (numericIds.length > 0) {
            const result = await prisma.mensaje.updateMany({
              where: { id: { in: numericIds }, delivered: false },
              data: { delivered: true },
            });
            console.log(`Se actualizaron ${result.count} mensajes como entregados en sala ${ticketId}`);
            io.to(String(ticketId)).emit("messagesDelivered", { messageIds: numericIds });
          }
        } catch (error) {
          console.error("Error actualizando mensajes como entregados:", error);
        }
      });

      // Marcar mensajes como leídos
      socket.on("messageRead", async ({ ticketId, messageIds }) => {
        try {
          if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            console.warn("messageRead recibió messageIds inválidos");
            return;
          }

          const numericIds = messageIds
            .filter((id) => !id.toString().includes("-"))
            .map((id) => Number(id));

          if (numericIds.length > 0) {
            const result = await prisma.mensaje.updateMany({
              where: { id: { in: numericIds }, read: false },
              data: { read: true },
            });
            console.log(`Se actualizaron ${result.count} mensajes como leídos en sala ${ticketId}`);
            io.to(String(ticketId)).emit("messagesRead", { messageIds: numericIds });
          }
        } catch (error) {
          console.error("Error actualizando mensajes como leídos:", error);
        }
      });

      // Difundir la actualización del estado del ticket
      socket.on("broadcastTicketStatus", (data) => {
        const roomId = String(data.ticketId);
        const { updatedTicket } = data;
        console.log(`Broadcasting updated status for ticket ${roomId}: ${updatedTicket.estado}`);
        io.to(roomId).emit("ticketStatusUpdated", updatedTicket);
      });

      // Manejar evento "typing"
      socket.on("typing", ({ userId, isTyping }) => {
        const roomId = socket.data.roomId;
        if (roomId) {
          console.log(
            `Usuario ${userId} está ${isTyping ? "escribiendo" : "dejó de escribir"} en sala ${roomId}`
          );
          socket.to(roomId).emit("typing", { userId, isTyping });
        }
      });

      // Al desconectar
      socket.on("disconnect", () => {
        console.log("🔴 Cliente desconectado:", socket.id);
      });
    });
  }
  res.end();
}
