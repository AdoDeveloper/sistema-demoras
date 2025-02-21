import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request) {
  try {
    const roles = await prisma.role.findMany();
    return NextResponse.json(roles, { status: 200 });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Error fetching roles" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;
    const newRole = await prisma.role.create({
      data: { name },
    });
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Error creating role" }, { status: 500 });
  }
}
