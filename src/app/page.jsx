"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    // Obtener datos desde caché si existen
    const cached = sessionStorage.getItem("user");
    if (cached) {
      setCachedUser(JSON.parse(cached));
    } else if (session?.user) {
      sessionStorage.setItem("user", JSON.stringify(session.user));
      setCachedUser(session.user);
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <p className="text-center text-gray-500">Cargando...</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
        {/* Franja superior en color naranja (original) */}
        <div className="h-2 bg-orange-500"></div>
        <div className="p-6">
          {/* Logo centrado */}
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="ALMAPAC Logo"
              className="w-20 h-20 object-contain"
            />
          </div>

          {/* Título principal */}
          <h1 className="text-center text-3xl font-bold text-blue-700 mt-4">
            Control de Tiempos
          </h1>

          {/* Banner del Panel de Control */}
          <div className="mt-4 text-center font-bold text-white py-2 px-4 bg-orange-500 rounded-md shadow-md">
            Panel de Control
          </div>

          {/* Área de bienvenida y botones */}
          <div className="mt-6 p-4 border border-orange-500 rounded-md">
            <p className="text-lg font-semibold text-gray-800">
              👋 Bienvenido,{" "}
              <span className="text-blue-700">
                {cachedUser?.username || "Usuario"}
              </span>
            </p>

            {/* Grid de botones responsive */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                className="md:col-span-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md shadow-xl transform transition duration-200 hover:-translate-y-1 active:translate-y-0"
                onClick={() => router.push("/proceso/iniciar")}
              >
                Iniciar Proceso
              </button>

              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md shadow-xl transform transition duration-200 hover:-translate-y-1 active:translate-y-0"
                onClick={() => router.push("/proceso/consultar")}
              >
                Ver Registros
              </button>

              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md shadow-xl transform transition duration-200 hover:-translate-y-1 active:translate-y-0"
                onClick={() => {
                  sessionStorage.removeItem("user");
                  localStorage.removeItem("userId");
                  localStorage.removeItem("userName");
                  localStorage.removeItem("demorasProcess");
                  localStorage.removeItem("nextauth.message");
                  signOut();
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
