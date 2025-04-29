import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

// GET: Consultar los detalles de un producto por ID
export async function GET(request, { params }) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para acceder a este endpoint" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    return NextResponse.json(producto, { status: 200 });
  } catch (error) {
    console.error("Error fetching producto:", error);
    return NextResponse.json({ error: "Error fetching producto" }, { status: 500 });
  }
}

// PUT: Actualizar un producto existente
export async function PUT(request, { params }) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para actualizar este producto" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { nombre, descripcion } = body;

    // Validar que el campo "nombre" esté presente
    if (!nombre || nombre.trim() === "") {
      return NextResponse.json({ error: "El campo 'nombre' es obligatorio" }, { status: 400 });
    }

    // Verificar que el producto exista
    const existingProducto = await prisma.producto.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!existingProducto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const updatedProducto = await prisma.producto.update({
      where: { id: parseInt(id, 10) },
      data: { nombre, descripcion },
    });

    return NextResponse.json(updatedProducto, { status: 200 });
  } catch (error) {
    console.error("Error updating producto:", error);
    return NextResponse.json({ error: "Error updating producto" }, { status: 500 });
  }
}

// DELETE: Eliminar un producto
export async function DELETE(request, { params }) {
  // Validar que el usuario autenticado tenga rol de administrador (roleId === 1)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para eliminar este producto" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    // Verificar que el producto exista
    const existingProducto = await prisma.producto.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!existingProducto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const deletedProducto = await prisma.producto.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(deletedProducto, { status: 200 });
  } catch (error) {
    console.error("Error deleting producto:", error);
    return NextResponse.json({ error: "Error deleting producto" }, { status: 500 });
  }
}
