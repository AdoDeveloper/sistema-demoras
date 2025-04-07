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

    // GRANEL
    "/api/demoras/granel",
    "/api/demoras/granel/:path*",
    "/api/demoras/granel/export-excel",
    "/proceso/consultar/granel",
    "/proceso/iniciar/granel",
    "/proceso/iniciar/granel/step2",
    "/proceso/iniciar/granel/step3",
    "/proceso/iniciar/granel/step4",
    "/proceso/editar/granel",
    "/proceso/editar/granel/step2",
    "/proceso/editar/granel/step3",
    "/proceso/editar/granel/step4",

    // ENVASADO
    "/api/demoras/envasado",
    "/api/demoras/envasado/:path*",
    "/api/demoras/envasado/export-excel",
    "/proceso/consultar/envasado",
    "/proceso/iniciar/envasado",
    "/proceso/iniciar/envasado/step2",
    "/proceso/iniciar/envasado/step3",
    "/proceso/iniciar/envasado/step4",
    "/proceso/editar/envasado",
    "/proceso/editar/envasado/step2",
    "/proceso/editar/envasado/step3",
    "/proceso/editar/envasado/step4",

    // MOLINO
    "/api/demoras/molino",
    "/api/demoras/molino/:path*",
    "/api/demoras/molino/export-excel",
    "/proceso/consultar/molino",
    "/proceso/iniciar/molino",
    "/proceso/iniciar/molino/step2",
    "/proceso/iniciar/molino/step3",
    "/proceso/iniciar/molino/step4",

    // ACTIVIDADES
    "/api/demoras/actividad",
    "/api/demoras/actividad/:path*",
    "/api/demoras/actividad/export-excel",
    "/proceso/consultar/molino/actividades",
    "/proceso/iniciar/molino/actividades",

    // BARCO
    "/api/barcos",
    "/api/barcos/:path*",
    "/proceso/iniciar/barco",
    "/proceso/consultar/barco",

    // BITACORAS
    "/api/bitacoras",
    "/api/bitacoras/:path*",
    "/api/bitacoras/export-excel",
    "/proceso/consultar/bitacora",

    // EQUIPOS
    "/api/equipos",
    "/api/equipos/export-excel",
    "/proceso/iniciar/equipo",
    "/proceso/consultar/equipo",

    // Otras rutas protegidas
    "/perfil",
    "/proceso/analisis",
    "/proceso/iniciar",
  ];

  // Rutas exclusivas para administradores
  const adminRoutes = [
    "/usuarios",
    "/api/users",
    "/api/roles",

    // BARCOS
    "/api/barcos/:path*",
    "/proceso/consultar/barco",
  ];

  // Validar rutas de administración: se requiere sesión y rol de admin (roleId === 1)
  if (adminRoutes.some(route => path.startsWith(route))) {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url), 302);
    }
    if (session.roleId !== 1) {
      return NextResponse.redirect(new URL("/403", req.url), 302);
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
    // Rutas genéricas
    "/",
    "/login",
    "/perfil",

    // GRANEL
    "/api/demoras/granel",
    "/api/demoras/granel/:path*",
    "/api/demoras/granel/export-excel",
    "/proceso/consultar/granel",
    "/proceso/iniciar/granel",
    "/proceso/iniciar/granel/step2",
    "/proceso/iniciar/granel/step3",
    "/proceso/iniciar/granel/step4",
    "/proceso/editar/granel",
    "/proceso/editar/granel/step2",
    "/proceso/editar/granel/step3",
    "/proceso/editar/granel/step4",

    // ENVASADO
    "/api/demoras/envasado",
    "/api/demoras/envasado/:path*",
    "/api/demoras/envasado/export-excel",
    "/proceso/consultar/envasado",
    "/proceso/iniciar/envasado",
    "/proceso/iniciar/envasado/step2",
    "/proceso/iniciar/envasado/step3",
    "/proceso/iniciar/envasado/step4",
    "/proceso/editar/envasado",
    "/proceso/editar/envasado/step2",
    "/proceso/editar/envasado/step3",
    "/proceso/editar/envasado/step4",

    // MOLINO
    "/api/demoras/molino",
    "/api/demoras/molino/:path*",
    "/api/demoras/molino/export-excel",
    "/proceso/consultar/molino",
    "/proceso/iniciar/molino",
    "/proceso/iniciar/molino/step2",
    "/proceso/iniciar/molino/step3",
    "/proceso/iniciar/molino/step4",

    // ACTIVIDADES
    "/api/demoras/actividad",
    "/api/demoras/actividad/:path*",
    "/api/demoras/actividad/export-excel",
    "/proceso/consultar/molino/actividades",
    "/proceso/iniciar/molino/actividades",

    // BARCO
    "/api/barcos",
    "/api/barcos/:path*",
    "/proceso/iniciar/barco",
    "/proceso/consultar/barco",

    // BITACORAS
    "/api/bitacoras",
    "/api/bitacoras/:path*",
    "/api/bitacoras/export-excel",
    "/proceso/consultar/bitacora",

    // EQUIPOS
    "/api/equipos",
    "/api/equipos/export-excel",
    "/proceso/iniciar/equipo",
    "/proceso/consultar/equipo",

    // Otras rutas protegidas
    "/proceso/analisis",
    "/proceso/iniciar",

    // Rutas de administración
    "/usuarios",
    "/api/users/:path*",
    "/api/roles/:path*",

    // Ejemplo de ruta de construcción/mantenimiento
    "/building",
  ],
};
