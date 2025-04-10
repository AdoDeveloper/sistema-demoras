import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";

export async function GET(request, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ticketId is required" },
      { status: 400 }
    );
  }
  try {
    const messages = await prisma.mensaje.findMany({
      where: { ticketId: Number(id) },
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
    return NextResponse.json({ previousMessages: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
