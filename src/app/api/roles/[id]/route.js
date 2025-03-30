import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function GET(request, { params }) {
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    return NextResponse.json(role, { status: 200 });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json({ error: "Error fetching role" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const body = await request.json();
    const { name } = body;
    const updatedRole = await prisma.role.update({
      where: { id: parseInt(id, 10) },
      data: { name },
    });
    return NextResponse.json(updatedRole, { status: 200 });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Error updating role" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const paramsData = await params;
  const { id } = paramsData;
  try {
    const roleId = parseInt(id, 10);
    // Validar que no existan usuarios asignados al rol que no estén eliminados
    const assignedUsers = await prisma.user.count({
      where: { roleId, eliminado: false },
    });
    if (assignedUsers > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el rol porque tiene usuarios asignados" },
        { status: 400 }
      );
    }
    const deletedRole = await prisma.role.delete({
      where: { id: roleId },
    });
    return NextResponse.json(deletedRole, { status: 200 });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "Error deleting role" }, { status: 500 });
  }
}
