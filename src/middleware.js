// middleware
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  
  // Definir rutas protegidas
  const protectedRoutes = ["/", "/proceso/consultar", "/api/demoras"];

  // Permitir acceso sin autenticación a la ruta de autenticación y login
  if (path.startsWith("/api/auth") || path === "/login") {
    return NextResponse.next();
  }

  // Solo ejecutar autenticación si se accede a rutas protegidas
  if (protectedRoutes.some(route => path.startsWith(route))) {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url), 302);
    }
  }

  return NextResponse.next();
}

// Configuración para que el middleware actúe en estas rutas
export const config = {
  matcher: ["/", "/proceso/consultar", "/api/demoras", "/api/auth/session", "/proceso/iniciar",
            "/proceso/iniciar/step2", "/proceso/iniciar/step3", "/proceso/iniciar/step4","/proceso/analisis",],
};
