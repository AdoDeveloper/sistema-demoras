"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaPlay, FaChartBar } from "react-icons/fa";
import { PiTruckTrailerFill, PiBarnFill } from "react-icons/pi";
import { FiUsers, FiLoader } from "react-icons/fi";
import { HiOutlineUserCircle } from "react-icons/hi";

// Dynamic imports con no SSR para evitar mismatches de hidratación
const WeatherWidget = dynamic(() => import("../components/WeatherWidget"), {
  ssr: false,
});

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState(null);
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("user");
      if (cached) {
        setCachedUser(JSON.parse(cached));
      } else if (session?.user) {
        sessionStorage.setItem("user", JSON.stringify(session.user));
        setCachedUser(session.user);
      }
      const storedRoleId = localStorage.getItem("roleId");
      if (storedRoleId) {
        setRoleId(Number(storedRoleId));
      }
    }
  }, [status, session, router]);

  if (typeof window === "undefined" || status === "loading") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <FiLoader className="animate-spin mr-2" size={40} />
        <span className="text-xl text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header integrado */}
      <Header />

      {/* Contenedor principal */}
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Sección de bienvenida */}
        <section className="bg-white rounded-xl shadow p-6 grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3">
            <HiOutlineUserCircle size={48} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">¡Bienvenido!</h2>
              <p className="text-gray-600">
                Esperamos que tengas un excelente día.
              </p>
            </div>
          </div>
        </section>

        {/* Widget del clima */}
        <section>
          {typeof window !== "undefined" && <WeatherWidget />}
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
            onClick={() => router.push("/proceso/consultar/granel")}
            className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1 active:translate-y-0"
          >
            <PiBarnFill size={20} className="mr-2" />
            <span>Registros Granel</span>
          </button>
          <button
            onClick={() => router.push("/building")}
            className="flex items-center justify-center w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1 active:translate-y-0"
          >
            <PiTruckTrailerFill size={20} className="mr-2" />
            <span>Registros Envasado</span>
          </button>
          <button
            onClick={() => router.push("/proceso/analisis")}
            className="flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1 active:translate-y-0"
          >
            <FaChartBar size={20} className="mr-2" />
            <span>Datos</span>
          </button>
          {/* Opción extra para administradores */}
          {roleId === 1 && (
            <button
              onClick={() => router.push("/usuarios")}
              className="flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1 active:translate-y-0"
            >
              <FiUsers size={20} className="mr-2" />
              <span>Usuarios</span>
            </button>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
