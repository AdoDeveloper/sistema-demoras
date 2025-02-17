"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../components/Loader"; // Ajusta la ruta según tu estructura
import WeatherWidget from "../components/WeatherWidget"; // Ajusta la ruta según tu estructura
import { FiHome, FiLogOut } from "react-icons/fi";
import { FaPlay, FaList, FaChartBar } from "react-icons/fa";
import { HiOutlineUserCircle } from "react-icons/hi";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    const cached = sessionStorage.getItem("user");
    if (cached) {
      setCachedUser(JSON.parse(cached));
    } else if (session?.user) {
      sessionStorage.setItem("user", JSON.stringify(session.user));
      setCachedUser(session.user);
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Encabezado fijo */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Logo e icono de inicio */}
          <div className="flex items-center space-x-2">
            <FiHome size={28} className="text-blue-600" />
            <div className="ml-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                Control de Tiempos
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">Panel de Control</p>
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("user");
              localStorage.removeItem("userId");
              localStorage.removeItem("userName");
              localStorage.removeItem("demorasProcess");
              localStorage.removeItem("nextauth.message");
              signOut();
            }}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200"
          >
            <FiLogOut size={20} className="mr-2" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Contenedor para el contenido principal */}
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Sección de bienvenida */}
        <section className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <HiOutlineUserCircle size={48} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                ¡Bienvenido, {cachedUser?.username || "Usuario"}!
              </h2>
              <p className="text-gray-600">Esperamos que tengas un excelente día.</p>
            </div>
          </div>
        </section>

        {/* Widget del clima */}
        <section>
          <WeatherWidget />
        </section>

        {/* Acciones */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/proceso/iniciar")}
            className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1 active:translate-y-0"
          >
            <FaPlay size={20} className="mr-2" />
            <span>Iniciar Proceso</span>
          </button>
          <button
            onClick={() => router.push("/proceso/consultar")}
            className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1 active:translate-y-0"
          >
            <FaList size={20} className="mr-2" />
            <span>Ver Registros</span>
          </button>
          <button
            onClick={() => router.push("/proceso/analisis")}
            className="flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1 active:translate-y-0"
          >
            <FaChartBar size={20} className="mr-2" />
            <span>Ver Datos</span>
          </button>
        </section>
      </main>
        {/* Pie de página fijo */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white py-3 shadow-inner">
        <div className="max-w-7xl mx-auto text-center text-xs sm:text-sm text-gray-500">
          © {new Date().getFullYear()} Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
