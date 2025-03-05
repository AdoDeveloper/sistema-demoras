import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { getToken } from "next-auth/jwt";

export async function GET(request, { params }) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json({ error: "No tienes permiso para acceder a este endpoint" }, { status: 403 });
  }
  
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      include: { role: true },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json({ error: "No tienes permiso para actualizar este usuario" }, { status: 403 });
  }
  
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const body = await request.json();
    const { username, nombreCompleto, codigo, email, password, roleId } = body;
    // Preparar los datos a actualizar
    const data = { username, nombreCompleto, codigo, email, roleId };

    // Si se proporciona una contraseña (no vacía), se convierte a hash
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      data.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data,
      include: { role: true },
    });
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json({ error: "No tienes permiso para eliminar este usuario" }, { status: 403 });
  }
  
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const deletedUser = await prisma.user.delete({
      where: { id: parseInt(id, 10) },
    });
    return NextResponse.json(deletedUser, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}
