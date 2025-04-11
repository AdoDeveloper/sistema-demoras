import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../../../../../lib/prisma";

cloudinary.config(process.env.CLOUDINARY_URL);

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticketId, senderId, receiverId, text, imageData, imageSize } = body;

    if (!ticketId || !senderId) {
      return NextResponse.json(
        { error: "ticketId and senderId are required" },
        { status: 400 }
      );
    }

    let imageUrl = null;
    let imagenPublicId = null;
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

    if (imageData) {
      if (imageSize && Number(imageSize) >= MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "La imagen debe ser menor a 10 MB" },
          { status: 400 }
        );
      }
      try {
        // Generar la carpeta de destino basada en el ticketId
        const folderName = `chat/${ticketId}`;
        const uploadResponse = await cloudinary.uploader.upload(imageData, { folder: folderName });
        
        imageUrl = uploadResponse.secure_url;
        imagenPublicId = uploadResponse.public_id;
        console.log(`Imagen subida a Cloudinary en la carpeta ${folderName}:`, imageUrl);
      } catch (error) {
        console.error("Error al subir imagen a Cloudinary:", error);
        return NextResponse.json(
          { error: "Error al subir imagen" },
          { status: 500 }
        );
      }
    }

    const newMessage = await prisma.mensaje.create({
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
    
    console.log(`Mensaje creado para ticket ${ticketId}: ${newMessage.id}`);
    return NextResponse.json({ newMessage });
  } catch (error) {
    console.error("Error in sendMessage endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
