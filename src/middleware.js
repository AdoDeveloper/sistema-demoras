import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const protectedRoutes = ["/"]; // Rutas protegidas (puedes agregar más)

  // Obtener el token de sesión de NextAuth
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Si el usuario no tiene sesión y está intentando acceder a una ruta protegida, redirigir al login
  if (!session && protectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Configuración para que el middleware se ejecute en todas las rutas protegidas
export const config = {
  matcher: ["/"], // Puedes añadir más rutas protegidas aquí
};