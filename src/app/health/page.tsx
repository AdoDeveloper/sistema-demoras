"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiArrowLeft,
} from "react-icons/fi";

interface ServiceData {
  status: string;
  statusCode?: number;
  responseTime?: number;
  lastUpdate?: string;
  message?: string;
  description?: string;
}

interface HealthData {
  apis?: Record<string, ServiceData>;
  timestamp: string;
  database: ServiceData;
  authentication: ServiceData;
  cache: ServiceData;
  reportServices?: Record<string, ServiceData>;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function HealthStatusPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  // Función para mostrar una tostada (toast) con duración de 3 segundos.
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Función para obtener los datos de Health desde /api/health
  const fetchHealthData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/health");
      if (res.status === 401) {
        // No autenticado: se muestran solo Componentes Principales
        const defaultData: HealthData = {
          database: {
            status: "Activo",
            description: "Servicio de base de datos funcionando correctamente.",
          },
          authentication: {
            status: "Inactivo",
            description: "No autenticado. Servicio de autenticación inalcanzable.",
          },
          cache: {
            status: "Activo",
            description: "Servicio de caché funcionando correctamente.",
          },
          timestamp: new Date().toISOString(),
        };
        setHealthData(defaultData);
      } else {
        const data: HealthData = await res.json();
        setHealthData(data);
      }
    } catch (error) {
      console.error("Error al obtener datos de health:", error);
      showToast("Error al actualizar la información.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  // Al actualizar healthData, se muestra una tostada con los mensajes de error (si existen)
  useEffect(() => {
    if (healthData) {
      let messages: string[] = [];
      // Revisar componentes principales
      if (healthData.database.status !== "Activo") {
        messages.push(`Base de Datos: ${healthData.database.description}`);
      }
      if (healthData.authentication.status !== "Activo") {
        messages.push(`Autenticación: ${healthData.authentication.description}`);
      }
      if (healthData.cache.status !== "Activo") {
        messages.push(`Caché: ${healthData.cache.description}`);
      }
      // Revisar endpoints generales
      if (healthData.apis) {
        Object.entries(healthData.apis).forEach(([key, service]) => {
          if (service.status !== "Activo") {
            messages.push(`${key}: ${service.message}`);
          }
        });
      }
      // Revisar servicios de reporte
      if (healthData.reportServices) {
        Object.entries(healthData.reportServices).forEach(([key, service]) => {
          if (service.status !== "Activo") {
            messages.push(`${key}: ${service.message}`);
          }
        });
      }
      if (messages.length > 0) {
        showToast(messages.join(" | "), "error");
      } else {
        showToast(`Información actualizada a las ${new Date().toLocaleTimeString("es-ES")}`, "success");
      }
    }
  }, [healthData]);

  // Calcula el estado global: si DB, Auth y Caché son "Activo" y, si existen, todos los endpoints en apis también.
  const computeGlobalStatus = (data: HealthData) => {
    const mainComponents = [
      data.database.status,
      data.authentication.status,
      data.cache.status,
    ];
    let apiStatuses: string[] = [];
    if (data.apis) {
      apiStatuses = Object.values(data.apis).map((api: ServiceData) => api.status);
    }
    const allActive =
      mainComponents.every((s) => s === "Activo") &&
      (apiStatuses.length ? apiStatuses.every((s) => s === "Activo") : true);
    return allActive ? "Todos los Servicios Funcionando" : "Interrupción Parcial del Sistema";
  };

  const globalStatus = healthData ? computeGlobalStatus(healthData) : "";

  // Filtrar APIs según el filtro de búsqueda (si existen)
  let filteredAPIs: [string, ServiceData][] = [];
  if (healthData && healthData.apis) {
    filteredAPIs = Object.entries(healthData.apis).filter(([apiName]) =>
      apiName.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }

  // Componente para mostrar un indicador pulsante según el estado.
  const StatusIndicator = ({ status }: { status: string }) => {
    if (status === "Activo") {
      return (
        <div className="relative flex items-center">
          <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 animate-ping"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-600"></span>
        </div>
      );
    }
    return (
      <div className="relative flex items-center">
        <span className="inline-flex h-3 w-3 rounded-full bg-red-600"></span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin" size={40} />
        <p className="mt-4 text-gray-600">Cargando información del sistema...</p>
      </div>
    );
  }

  // Determinar si el usuario está autenticado
  const isAuthenticated = sessionStatus === "authenticated";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 relative">
      {/* Tostada */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-sm font-medium 
          ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {toast.message}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-col md:flex-row justify-between">
            <div className="flex items-center">
                <button
                onClick={() => (window.location.href = "/")}
                className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
                title="Volver"
                >
                <FiArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">Estado del Sistema</h1>
            </div>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <button
            onClick={fetchHealthData}
            className="mr-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {refreshing ? (
              <FiLoader className="animate-spin mr-1" size={20} />
            ) : (
              <FiRefreshCw className="mr-1" size={20} />
            )}
            Actualizar
          </button>
          <div>
            {globalStatus === "Todos los Servicios Funcionando" ? (
              <div className="px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                {globalStatus}
              </div>
            ) : (
              <div className="px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                {globalStatus}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
            Última actualización:{" "}
            {new Date(healthData!.timestamp).toLocaleString("es-ES")}
      </p>
      {/* Componentes Principales */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Componentes Principales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Base de Datos */}
          <div className="p-4 border rounded-lg flex flex-col">
            <span className="block text-gray-600 font-medium">Base de Datos</span>
            <div className="mt-2 flex items-center space-x-2">
              <StatusIndicator status={healthData!.database.status} />
              <span className={healthData!.database.status === "Activo" ? "text-green-700" : "text-red-700"}>
                {healthData!.database.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{healthData!.database.description}</p>
          </div>
          {/* Autenticación */}
          <div className="p-4 border rounded-lg flex flex-col">
            <span className="block text-gray-600 font-medium">Autenticación</span>
            <div className="mt-2 flex items-center space-x-2">
              <StatusIndicator status={healthData!.authentication.status} />
              <span className={healthData!.authentication.status === "Activo" ? "text-green-700" : "text-red-700"}>
                {healthData!.authentication.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{healthData!.authentication.description}</p>
          </div>
          {/* Caché */}
          <div className="p-4 border rounded-lg flex flex-col">
            <span className="block text-gray-600 font-medium">Caché</span>
            <div className="mt-2 flex items-center space-x-2">
              <StatusIndicator status={healthData!.cache.status} />
              <span className={healthData!.cache.status === "Activo" ? "text-green-700" : "text-red-700"}>
                {healthData!.cache.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{healthData!.cache.description}</p>
          </div>
        </div>
      </div>

      {/* Si el usuario está autenticado, se muestran las secciones adicionales */}
      {isAuthenticated && healthData?.apis && (
        <>
          {/* Puntos de Conexión API */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Puntos de Conexión API</h2>
              <div className="relative mt-4 md:mt-0">
                <input
                  type="search"
                  placeholder="Filtrar por API..."
                  className="bg-gray-100 h-9 px-4 pr-8 rounded text-sm focus:outline-none"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-2 top-2">
                  <FiSearch size={16} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">NOMBRE</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">ESTADO</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">CÓDIGO</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">TIEMPO DE RESPUESTA</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">ÚLTIMA ACTUALIZACIÓN</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">MENSAJE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAPIs.length > 0 ? (
                    filteredAPIs.map(([apiName, apiData]) => (
                      <tr key={apiName} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b text-sm text-gray-800 capitalize">{apiName}</td>
                        <td className="px-4 py-2 border-b text-sm">
                          <div className="flex items-center space-x-2">
                            <StatusIndicator status={apiData.status} />
                            <span className={apiData.status === "Activo" ? "text-green-700" : "text-red-700"}>
                              {apiData.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 border-b text-sm text-gray-800">{apiData.statusCode}</td>
                        <td className="px-4 py-2 border-b text-sm text-gray-800">{apiData.responseTime} ms</td>
                        <td className="px-4 py-2 border-b text-sm text-gray-800">
                          {new Date(apiData.lastUpdate!).toLocaleTimeString("es-ES")}
                        </td>
                        <td className="px-4 py-2 border-b text-sm text-gray-800">{apiData.message}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-2 text-center text-gray-500">
                        No se encontraron APIs con ese filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Servicios de Reporte */}
          {healthData.reportServices && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Servicios de Reporte</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-2 text-sm font-semibold text-gray-600">NOMBRE</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-600">ESTADO</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-600">CÓDIGO</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-600">TIEMPO DE RESPUESTA</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-600">ÚLTIMA ACTUALIZACIÓN</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-600">MENSAJE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(healthData.reportServices).map(
                      ([serviceName, serviceData]: [string, ServiceData]) => (
                        <tr key={serviceName} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b text-sm text-gray-800 capitalize">{serviceName}</td>
                          <td className="px-4 py-2 border-b text-sm">
                            <div className="flex items-center space-x-2">
                              <StatusIndicator status={serviceData.status} />
                              <span className={serviceData.status === "Activo" ? "text-green-700" : "text-red-700"}>
                                {serviceData.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{serviceData.statusCode}</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{serviceData.responseTime} ms</td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">
                            {new Date(serviceData.lastUpdate!).toLocaleTimeString("es-ES")}
                          </td>
                          <td className="px-4 py-2 border-b text-sm text-gray-800">{serviceData.message}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
