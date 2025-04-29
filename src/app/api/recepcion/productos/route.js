import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request) {
  // Validar que el usuario tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para acceder a los productos" },
      { status: 403 }
    );
  }
  
  try {
    // Buscar todos los productos y opcionalmente incluir sus barcos recepción relacionados
    const productos = await prisma.producto.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(productos, { status: 200 });
  } catch (error) {
    console.error("Error fetching productos:", error);
    return NextResponse.json({ error: "Error fetching productos" }, { status: 500 });
  }
}

export async function POST(request) {
  // Validar que el usuario tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para crear productos" },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    const { nombre, descripcion } = body;
    
    // Validar que el campo obligatorio 'nombre' esté presente
    if (!nombre) {
      return NextResponse.json({ error: "El campo 'nombre' es obligatorio" }, { status: 400 });
    }
    
    const nuevoProducto = await prisma.producto.create({
      data: { 
        nombre, 
        descripcion, 
      }
    });
    
    return NextResponse.json(nuevoProducto, { status: 201 });
  } catch (error) {
    console.error("Error creating producto:", error);
    // Manejo de errores conocidos de Prisma, por ejemplo duplicidad en campos únicos
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "El producto ya existe" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: error.message || "Error creating producto" }, { status: 500 });
  }
}
