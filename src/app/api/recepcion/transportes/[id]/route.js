// src/app/api/recepcion/transportes/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLE_ID = 1;

export async function GET(request, { params }) {

  const { id } = await params;
  try {
    const empresa = await prisma.empresaTransporte.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!empresa) {
      return NextResponse.json({ error: "Empresa de transporte no encontrada" }, { status: 404 });
    }
    return NextResponse.json(empresa, { status: 200 });
  } catch (error) {
    console.error("Error fetching empresaTransporte:", error);
    return NextResponse.json(
      { error: "Error al obtener la empresa de transporte" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  // Sólo administradores
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== ADMIN_ROLE_ID) {
    return NextResponse.json(
      { error: "No tienes permiso para actualizar este transporte" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { nombre, motoristas } = body;

    // Validar nombre
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { error: "El campo 'nombre' es obligatorio" },
        { status: 400 }
      );
    }

    // Asegurar que motoristas sea array o array vacío
    const motoristasData = Array.isArray(motoristas) ? motoristas : [];

    // Verificar existencia
    const existing = await prisma.empresaTransporte.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Empresa de transporte no encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.empresaTransporte.update({
      where: { id: parseInt(id, 10) },
      data: {
        nombre: nombre.trim(),
        motoristas: motoristasData,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating empresaTransporte:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una empresa de transporte con ese nombre" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar la empresa de transporte" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  // Sólo administradores
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== ADMIN_ROLE_ID) {
    return NextResponse.json(
      { error: "No tienes permiso para eliminar este transporte" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const existing = await prisma.empresaTransporte.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Empresa de transporte no encontrada" },
        { status: 404 }
      );
    }

    const deleted = await prisma.empresaTransporte.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error) {
    console.error("Error deleting empresaTransporte:", error);
    return NextResponse.json(
      { error: "Error al eliminar la empresa de transporte" },
      { status: 500 }
    );
  }
}
