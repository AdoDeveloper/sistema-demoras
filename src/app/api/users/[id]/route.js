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
  
  const { id } = await params;
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
  
  const { id } = await params;
  try {
    const body = await request.json();
    const { username, nombreCompleto, codigo, email, password, roleId, activo } = body;
    // Preparar los datos a actualizar
    const data = { username, nombreCompleto, codigo, email, roleId };

    // Si se proporciona una contraseña (no vacía), se convierte a hash
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      data.password = hashedPassword;
    }
    
    // Actualizar el campo "activo" si se proporciona
    if (typeof activo !== "undefined") {
      data.activo = activo;
    }

    // Obtener el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      include: { role: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    
    // Si el usuario es administrador y se intenta desactivar, verificar que no sea el único admin activo
    if (currentUser.roleId === 1 && data.activo === false) {
      const adminCount = await prisma.user.count({
        where: { roleId: 1, activo: true, eliminado: false },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "No se puede desactivar porque solo hay un usuario administrador" }, { status: 400 });
      }
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
  
  const { id } = await params;
  try {
    // Obtener el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    
    // Si el usuario es administrador, verificar que no sea el único admin activo
    if (currentUser.roleId === 1) {
      const adminCount = await prisma.user.count({
        where: { roleId: 1, activo: true, eliminado: false },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "No se puede eliminar porque solo hay un usuario administrador" }, { status: 400 });
      }
    }
    
    // Soft delete: se actualizan los campos "eliminado" y "activo"
    const deletedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: {
        eliminado: true,
        activo: false,
      },
    });
    return NextResponse.json(deletedUser, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}
