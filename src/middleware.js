import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(req) {
  const path = req.nextUrl.pathname;

  // 🟢 Hacer `await` para obtener cookies correctamente
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("next-auth.session-token")?.value;

  if (!sessionCookie && path !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Configuración para que el middleware se ejecute en `/`
export const config = {
  matcher: ["/"], // Protege la página principal (dashboard)
};
