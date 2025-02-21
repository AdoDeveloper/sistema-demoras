import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request) {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, nombreCompleto, codigo, email, password, roleId } = body;
    // Convertir la contraseña a hash con bcryptjs (10 rondas)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: { 
        username, 
        nombreCompleto, 
        codigo, 
        email, 
        password: hashedPassword, 
        roleId 
      },
      include: { role: true },
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Error creating user" }, { status: 500 });
  }
}
