import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// 1) Definición de roles en español
const ROLES = {
  ADMINISTRADOR: 1,
  ASISTENTE_OPERATIVO: 2,
  MUELLERO: 3,
  OPERADOR: 4,
  SUPERVISOR_MANTENIMIENTO: 5,
  CHEQUERO: 6,
  AUDITOR_PROCESOS: 7,
};

// 2) Rutas públicas (no requieren auth)
const PUBLIC_ROUTES = [
  "/login",
  "/api/auth",
  "/health",
  "/api/health",
];

// 3) Grupos de permisos
const PERMISSIONS = {
  AUTHENTICATED: [], // cualquier usuario autenticado
  ADMIN_ONLY: [ROLES.ADMINISTRADOR],
  OP_ASSISTANT: [ROLES.ADMINISTRADOR, ROLES.ASISTENTE_OPERATIVO],
  MUELLERO: [ROLES.ADMINISTRADOR, ROLES.MUELLERO],
  EQUIPOS: [ROLES.ADMINISTRADOR, ROLES.OPERADOR, ROLES.SUPERVISOR_MANTENIMIENTO],
  RECEPCION_FULL: [ROLES.ADMINISTRADOR, ROLES.CHEQUERO, ROLES.AUDITOR_PROCESOS],
  RECEPCION_LIMITED: [ROLES.ADMINISTRADOR, ROLES.AUDITOR_PROCESOS],
};

// 4) Módulos reutilizables
const MODULES = ["granel", "envasado", "molino"];

// 5) Construcción dinámica de rutas por módulo
const defineModuleRoutes = (module) => ({
  [`/api/demoras/${module}`]: PERMISSIONS.OP_ASSISTANT,
  [`/api/demoras/${module}/:path*`]: PERMISSIONS.OP_ASSISTANT,
  [`/api/demoras/${module}/export-excel`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/consultar/${module}`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/iniciar/${module}`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/iniciar/${module}/step2`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/iniciar/${module}/step3`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/iniciar/${module}/step4`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/editar/${module}`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/editar/${module}/step2`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/editar/${module}/step3`]: PERMISSIONS.OP_ASSISTANT,
  [`/proceso/editar/${module}/step4`]: PERMISSIONS.OP_ASSISTANT,
});

// 6) Definición de permisos por ruta
const ROUTE_PERMISSIONS = {
  // Globales
  "/": PERMISSIONS.AUTHENTICATED,
  "/perfil": PERMISSIONS.AUTHENTICATED,
  "/proceso/iniciar": PERMISSIONS.AUTHENTICATED,
  "/soporte": PERMISSIONS.AUTHENTICATED,
  "/soporte/chat": PERMISSIONS.AUTHENTICATED,
  "/building": PERMISSIONS.AUTHENTICATED,

  // API y chat
  "/api/tickets": PERMISSIONS.AUTHENTICATED,
  "/api/tickets/:path*": PERMISSIONS.AUTHENTICATED,
  "/api/chat/:path*": PERMISSIONS.AUTHENTICATED,
  "/api/chat/delivered": PERMISSIONS.AUTHENTICATED,
  "/api/chat/estatus": PERMISSIONS.AUTHENTICATED,
  "/api/chat/messages/:path*": PERMISSIONS.AUTHENTICATED,
  "/api/chat/read": PERMISSIONS.AUTHENTICATED,
  "/api/chat/send": PERMISSIONS.AUTHENTICATED,

  // ADMIN
  "/usuarios": PERMISSIONS.ADMIN_ONLY,
  "/api/users": PERMISSIONS.ADMIN_ONLY,
  "/api/users/:path*": PERMISSIONS.ADMIN_ONLY,
  "/api/roles": PERMISSIONS.ADMIN_ONLY,
  "/api/roles/:path*": PERMISSIONS.ADMIN_ONLY,

  // Granel, Envasado, Molino
  ...MODULES.reduce((acc, mod) => ({ ...acc, ...defineModuleRoutes(mod) }), {}),

  // Actividades
  "/api/demoras/actividad": PERMISSIONS.OP_ASSISTANT,
  "/api/demoras/actividad/:path*": PERMISSIONS.OP_ASSISTANT,
  "/api/demoras/actividad/export-excel": PERMISSIONS.OP_ASSISTANT,
  "/proceso/consultar/molino/actividades": PERMISSIONS.OP_ASSISTANT,
  "/proceso/iniciar/molino/actividades": PERMISSIONS.OP_ASSISTANT,

  // Análisis
  "/proceso/analisis": PERMISSIONS.OP_ASSISTANT,
  "/api/analysis": PERMISSIONS.OP_ASSISTANT,

  // Barco y Bitácoras
  "/api/barcos": PERMISSIONS.MUELLERO,
  "/api/barcos/:path*": PERMISSIONS.MUELLERO,
  "/proceso/iniciar/barco": PERMISSIONS.MUELLERO,
  "/proceso/consultar/barco": PERMISSIONS.MUELLERO,
  "/api/bitacoras": PERMISSIONS.MUELLERO,
  "/api/bitacoras/:path*": PERMISSIONS.MUELLERO,
  "/api/bitacoras/export-excel": PERMISSIONS.MUELLERO,
  "/proceso/consultar/bitacora": PERMISSIONS.MUELLERO,

  // Equipos
  "/api/equipos": PERMISSIONS.EQUIPOS,
  "/api/equipos/export-excel": [ROLES.ADMINISTRADOR, ROLES.SUPERVISOR_MANTENIMIENTO],
  "/proceso/iniciar/equipo": PERMISSIONS.EQUIPOS,
  "/proceso/consultar/equipo": PERMISSIONS.EQUIPOS,

  // Recepción
  "/api/recepcion": PERMISSIONS.RECEPCION_FULL,
  "/api/recepcion/bitacoras/:path*": PERMISSIONS.RECEPCION_FULL,
  "/api/recepcion/barcos": PERMISSIONS.RECEPCION_FULL,
  "/proceso/iniciar/recepcion": PERMISSIONS.RECEPCION_FULL,
  "/proceso/consultar/recepcion": PERMISSIONS.RECEPCION_FULL,
  "/api/recepcion/productos": PERMISSIONS.RECEPCION_LIMITED,
  "/api/recepcion/barcos/:path*": PERMISSIONS.RECEPCION_LIMITED,
  "/api/recepcion/productos/:path*": PERMISSIONS.RECEPCION_LIMITED,
  "/api/recepcion/export-excel": PERMISSIONS.RECEPCION_LIMITED,
  "/api/recepcion/transportes": PERMISSIONS.RECEPCION_LIMITED,
  "/api/recepcion/transportes/:path*": PERMISSIONS.RECEPCION_LIMITED,
  "/api/transportes": PERMISSIONS.RECEPCION_LIMITED,
  "/proceso/consultar/recepcion/barcos": PERMISSIONS.RECEPCION_FULL,
};

// 7) Headers de seguridad
const SecurityHeaders = {
  HSTS: "max-age=63072000; includeSubDomains; preload",
  X_FRAME: "DENY",
  X_CONTENT: "nosniff",
  REFERRER: "no-referrer",
  PERMISSIONS_POLICY: "camera=(), microphone=(), geolocation=()",
};

function applySecurityHeaders(response) {
  Object.entries(SecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key.replace('_', '-'), value);
  });
  return response;
}

// 8) Helper para coincidencia de rutas
function matchRoute(path, pattern) {
  if (pattern.includes(":path*")) {
    return path.startsWith(pattern.replace("/:path*", ""));
  }
  return path === pattern;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Rutas públicas
  if (PUBLIC_ROUTES.some(r => matchRoute(pathname, r))) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Token y sesión
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Not authenticated", message: "Authentication required" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verificación de permisos
  const routeKey = Object.keys(ROUTE_PERMISSIONS).find(route => matchRoute(pathname, route));
  const allowedRoles = routeKey ? ROUTE_PERMISSIONS[routeKey] : null;
  if (!allowedRoles) {
    return NextResponse.redirect(new URL("/403", req.url));
  }
  if (allowedRoles.length === 0 || allowedRoles.includes(token.roleId)) {
    return applySecurityHeaders(NextResponse.next());
  }

  console.log(`Acceso denegado: roleId ${token.roleId} no permitido en ruta ${pathname}`);
  return NextResponse.redirect(new URL("/403", req.url));
}

export const config = {
  matcher: [
    "/login",
    "/health",
    "/api/health",
    "/perfil",
    "/building",
    "/api/analysis",
    "/proceso/analisis",

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

    // BITÁCORAS
    "/api/bitacoras",
    "/api/bitacoras/:path*",
    "/api/bitacoras/export-excel",
    "/proceso/consultar/bitacora",

    // EQUIPOS
    "/api/equipos",
    "/api/equipos/export-excel",
    "/proceso/iniciar/equipo",
    "/proceso/consultar/equipo",

    // RECEPCIÓN
    "/api/recepcion",
    "/api/recepcion/bitacoras/:path*",
    "/api/recepcion/barcos",
    "/api/recepcion/productos",
    "/api/recepcion/barcos/:path*",
    "/api/recepcion/productos/:path*",
    "/api/recepcion/export-excel",
    "/api/recepcion/transportes",
    "/api/recepcion/transportes/:path*",
    "/api/transportes",
    "/proceso/iniciar/recepcion",
    "/proceso/consultar/recepcion",
    "/proceso/consultar/recepcion/barcos",

    // SOPORTE
    "/api/tickets",
    "/api/tickets/:path*",
    "/api/chat/:path*",
    "/api/chat/delivered",
    "/api/chat/estatus",
    "/api/chat/messages/:path*",
    "/api/chat/read",
    "/api/chat/send",
    "/soporte",
    "/soporte/chat",
    "/soporte/chat/:path*",

    // ADMIN
    "/usuarios",
    "/api/users/:path*",
    "/api/roles/:path*",
    "/api/users",
    "/api/roles",
  ],
};
