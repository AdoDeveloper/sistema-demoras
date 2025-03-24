// app/api/health/route.js
import { PrismaClient } from "@prisma/client";
import NodeCache from "node-cache";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

/**
 * Devuelve una descripción para el estado de la base de datos.
 */
function getDatabaseDescription(status) {
  return status === "Activo"
    ? "Servicio de base de datos funcionando correctamente."
    : "Error al conectar con la base de datos.";
}

/**
 * Devuelve una descripción para el estado del servicio de autenticación.
 */
function getAuthDescription(status) {
  return status === "Activo"
    ? "Servicio de autenticación funcionando correctamente."
    : "El servicio de autenticación presenta problemas.";
}

/**
 * Devuelve una descripción para el servicio de caché.
 */
function getCacheDescription(status) {
  return status === "Activo"
    ? "Servicio de caché funcionando correctamente."
    : "Error: no se pudo leer/escribir correctamente en el caché.";
}

/**
 * Retorna un mensaje descriptivo basado en el código de estado HTTP.
 */
function getStatusMessage(code) {
  switch (code) {
    case 200:
      return "OK - Petición exitosa.";
    case 400:
      return "Solicitud mal formada o parámetros inválidos.";
    case 401:
      return "No autorizado - Credenciales inválidas o no proveídas.";
    case 403:
      return "Prohibido - No se tienen permisos para acceder al recurso.";
    case 404:
      return "No encontrado - El recurso no existe o ha sido movido.";
    case 500:
      return "Error interno del servidor.";
    default:
      return "Error desconocido.";
  }
}

/**
 * Comprueba la conexión a la base de datos.
 */
async function checkDatabase() {
  let status = "Inactivo";
  try {
    await prisma.$queryRaw`SELECT 1`;
    status = "Activo";
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error);
  }
  return status;
}

/**
 * Comprueba el servicio de autenticación consultando un endpoint público de NextAuth (/api/auth/csrf).
 * De esta forma se verifica que el sistema de autenticación funciona, independientemente de si hay sesión activa.
 */
async function checkAuthService() {
  const fullUrl = `${process.env.NEXTAUTH_URL}/api/auth/csrf`;
  try {
    const start = performance.now();
    const res = await fetch(fullUrl);
    const end = performance.now();
    const responseTime = Math.round(end - start);
    if (res.ok) {
      return { status: "Activo", responseTime, statusCode: res.status, message: getStatusMessage(res.status) };
    } else {
      return { status: "Inactivo", responseTime, statusCode: res.status, message: getStatusMessage(res.status) };
    }
  } catch (error) {
    console.error("Error verificando servicio de autenticación:", error);
    return { status: "Inactivo", responseTime: 0, statusCode: 0, message: "Error de red o servicio inaccesible." };
  }
}

/**
 * Comprueba el servicio de caché utilizando NodeCache.
 */
async function checkCache() {
  let status = "Inactivo";
  try {
    const cache = new NodeCache();
    const testKey = "healthCheckTest";
    cache.set(testKey, "OK", 5);
    const value = cache.get(testKey);
    if (value === "OK") {
      status = "Activo";
    } else {
      throw new Error("NodeCache no funciona correctamente");
    }
  } catch (error) {
    console.error("Error en NodeCache:", error);
  }
  return status;
}

/**
 * Verifica un endpoint midiendo su tiempo de respuesta, código HTTP y generando un mensaje descriptivo.
 * Si "withAuth" es true, se envía el token en el header "Authorization".
 */
async function checkEndpoint(path, withAuth = false, token = null) {
  const result = {
    status: "Inactivo",
    statusCode: 0,
    responseTime: 0,
    lastUpdate: new Date().toISOString(),
    message: "",
  };

  const fullUrl = `${process.env.NEXTAUTH_URL}${path}`;
  const start = performance.now();
  const headers = {};
  if (withAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    const res = await fetch(fullUrl, { headers });
    const end = performance.now();
    result.responseTime = Math.round(end - start);
    result.statusCode = res.status;
    result.message = getStatusMessage(res.status);
    if (res.ok) {
      result.status = "Activo";
    }
  } catch (error) {
    console.error(`Error verificando endpoint ${fullUrl}:`, error);
    result.message = "Error de red o endpoint inaccesible.";
  }
  return result;
}

export async function GET(request) {
  // Se intenta extraer el token (opcional) para usarlo en endpoints que requieran autenticación (como /api/user/profile)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, raw: true });
  // Nota: No se retorna error si no hay token, pues el Health Check debe verse siempre.

  // 1) Estado de la base de datos
  const dbStatus = await checkDatabase();

  // 2) Estado del servicio de autenticación (verificado mediante /api/auth/csrf)
  const authResult = await checkAuthService();

  // 3) Estado del servicio de caché
  const cacheStatus = await checkCache();

  // 4) Endpoints generales
  const endpoints = [
    { name: "analisis", path: "/api/analysis" },
    { name: "actividades", path: "/api/demoras/actividad" },
    { name: "envasado", path: "/api/demoras/envasado" },
    { name: "granel", path: "/api/demoras/granel" },
    { name: "molino", path: "/api/demoras/molino" },
    { name: "roles", path: "/api/roles" },
    // Para "user", se envía el token (si existe) para obtener el estado real.
    { name: "perfil", path: "/api/user/profile", withAuth: true },
    { name: "usuarios", path: "/api/users" },
  ];

  // 5) Endpoints de servicios de reporte
  const reportEndpoints = [
    { name: "molino Export", path: "/api/demoras/molino/export-excel" },
    { name: "actividad Export", path: "/api/demoras/actividad/export-excel" },
    { name: "envasado Export", path: "/api/demoras/envasado/export-excel" },
    { name: "granel Export", path: "/api/demoras/granel/export-excel" },
  ];

  const endpointsResults = await Promise.all(
    endpoints.map(async (ep) => {
      const result = await checkEndpoint(ep.path, ep.withAuth || false, token);
      return { [ep.name]: result };
    })
  );
  const apisStatus = Object.assign({}, ...endpointsResults);

  const reportResults = await Promise.all(
    reportEndpoints.map(async (rep) => {
      const result = await checkEndpoint(rep.path);
      return { [rep.name]: result };
    })
  );
  const reportServices = Object.assign({}, ...reportResults);

  const healthData = {
    database: {
      status: dbStatus,
      description: getDatabaseDescription(dbStatus),
    },
    authentication: {
      // Se devuelve el resultado obtenido de /api/auth/csrf
      status: authResult.status,
      description: getAuthDescription(authResult.status),
    },
    cache: {
      status: cacheStatus,
      description: getCacheDescription(cacheStatus),
    },
    apis: apisStatus,
    reportServices,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(healthData);
}
