import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticketId, messageIds } = body;
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: "messageIds inválidos" },
        { status: 400 }
      );
    }
    const numericIds = messageIds
      .filter((id) => !id.toString().includes("-"))
      .map((id) => Number(id));

    if (numericIds.length > 0) {
      const result = await prisma.mensaje.updateMany({
        where: { id: { in: numericIds }, read: false },
        data: { read: true },
      });
      console.log(`Se actualizaron ${result.count} mensajes como leídos en ticket ${ticketId}`);
      return NextResponse.json({ updatedCount: result.count });
    }
    return NextResponse.json({ message: "No hay mensajes a actualizar" });
  } catch (error) {
    console.error("Error in messageRead endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
