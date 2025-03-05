import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const path = req.nextUrl.pathname;

  // Permitir acceso sin autenticación a rutas de autenticación y login
  if (path.startsWith("/api/auth") || path === "/login") {
    return NextResponse.next();
  }

  // Rutas protegidas para usuarios autenticados
  const protectedRoutes = [
    "/",
    "/proceso/consultar",
    "/api/demoras/granel",
    "/api/demoras/granel/:path*",
    "/perfil",
    "/proceso/iniciar",
    "/proceso/iniciar/granel",
    "/proceso/iniciar/granel/step2",
    "/proceso/iniciar/granel/step3",
    "/proceso/iniciar/granel/step4",
    "/proceso/analisis",
  ];

  // Rutas exclusivas para administradores
  const adminRoutes = ["/usuarios", "/api/users", "/api/roles"];

  // Validar rutas de administración: se requiere sesión y rol de admin (roleId === 1)
  if (adminRoutes.some(route => path.startsWith(route))) {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url), 302);
    }
    if (session.roleId !== 1) {
      return NextResponse.redirect(new URL("/403", req.url), 302); // Redirigir a la página de error 403
    }
  }

  // Validar rutas protegidas generales: se requiere sesión
  if (protectedRoutes.some(route => path.startsWith(route))) {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url), 302);
    }
  }

  return NextResponse.next();
}

// Configuración para que el middleware actúe en las rutas indicadas
export const config = {
  matcher: [
    "/",
    "/proceso/consultar/granel",
    "/api/demoras/granel",
    "/api/demoras/granel/:path*",
    "/api/auth/session",
    "/proceso/iniciar",
    "/proceso/iniciar/granel",
    "/proceso/iniciar/granel/step2",
    "/proceso/iniciar/granel/step3",
    "/proceso/iniciar/granel/step4",
    "/proceso/analisis",
    "/perfil",
    "/usuarios",
    "/api/users/:path*",
    "/api/roles/:path*",
    "/building",
  ],
};
