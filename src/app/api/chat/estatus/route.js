import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticketId, updatedTicket } = body;
    if (!ticketId || !updatedTicket) {
      return NextResponse.json(
        { error: "ticketId and updatedTicket are required" },
        { status: 400 }
      );
    }

    // Actualizamos el estado del ticket; ajusta según el modelo y campos que utilices
    const updated = await prisma.ticket.update({
      where: { id: Number(ticketId) },
      data: { estado: updatedTicket.estado },
    });
    console.log(`Estado del ticket ${ticketId} actualizado a ${updatedTicket.estado}`);
    return NextResponse.json({ updatedTicket: updated });
  } catch (error) {
    console.error("Error in broadcastTicketStatus endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
