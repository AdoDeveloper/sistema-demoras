import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma"; // Adjust path as needed

export async function PUT(request, { params }) {
  //console.log("PUT request to /api/activo/[id] with params:", params);
  
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    
    console.log("Parsed userId:", userId);
    
    if (isNaN(userId)) {
      console.log("Invalid userId:", id);
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }
    
    // Parse the request body
    const body = await request.json().catch(e => {
      console.error("Error parsing request body:", e);
      throw new Error("Invalid request body");
    });
    
    console.log("Request body:", body);
    
    const { activoChat } = body;
    
    if (activoChat === undefined) {
      console.log("Missing activoChat in request body");
      return NextResponse.json({ error: "activoChat is required" }, { status: 400 });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      console.log("User not found with ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { activoChat },
    });
    
    // Return only the selected fields
    const responseData = {
      id: updatedUser.id,
      username: updatedUser.username,
      nombreCompleto: updatedUser.nombreCompleto,
      activoChat: updatedUser.activoChat,
    };

    console.log("User updated successfully:", responseData);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error("Error in /api/activo/[api] route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}
