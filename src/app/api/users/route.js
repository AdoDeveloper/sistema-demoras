import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { getToken } from "next-auth/jwt";
import { Prisma } from "@prisma/client";

export async function GET(request) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para acceder a los usuarios" },
      { status: 403 }
    );
  }
  
  try {
    // Buscar solo usuarios que no estén eliminados (eliminado === false)
    const users = await prisma.user.findMany({
      where: { eliminado: false },
      include: { role: true },
    });
    // Remover el campo password de cada usuario
    const sanitizedUsers = users.map(({ password, ...rest }) => rest);
    return NextResponse.json(sanitizedUsers, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
  }
}

export async function POST(request) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para crear usuarios" },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    const { username, nombreCompleto, codigo, email, password, roleId } = body;
    
    // Validar que todos los campos requeridos estén presentes
    if (!username || !nombreCompleto || !codigo || !email || !password || typeof roleId === "undefined") {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }
    
    // Validación simple del formato del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "El email es inválido" }, { status: 400 });
    }
    
    // Validar que no exista ya un usuario con el mismo username
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return NextResponse.json({ error: "Usuario ya existe. Por favor, comuníquese con el administrador TI." }, { status: 409 });
    }
    
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
    
    // Remover la propiedad password del usuario creado
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    // Manejo de errores conocidos de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes("username")) {
          return NextResponse.json({ error: "Usuario ya existe" }, { status: 409 });
        }
        return NextResponse.json(
          { error: "Usuario ya existe. Por favor, comuníquese con el administrador TI." },
          { status: 409 }
        );
      }
    }
    // Retornar mensaje de error general
    return NextResponse.json({ error: error.message || "Error creating user" }, { status: 500 });
  }
}
