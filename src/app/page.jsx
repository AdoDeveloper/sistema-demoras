"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  FiHome,
  FiLogOut,
  FiUser,
  FiHelpCircle,
  FiChevronDown,
} from "react-icons/fi";
import { FaPlay, FaList, FaChartBar } from "react-icons/fa";
import { HiOutlineUserCircle } from "react-icons/hi";

// Dynamic imports con no SSR para evitar mismatches de hidratación
const AnalysisLoader = dynamic(() => import("../components/AnalysisLoader"), {
  ssr: false,
});
const WeatherWidget = dynamic(() => import("../components/WeatherWidget"), {
  ssr: false,
});

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

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

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  function logOut() {
    sessionStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("roleId");
    localStorage.removeItem("userName");
    localStorage.removeItem("demorasProcess");
    localStorage.removeItem("nextauth.message");
    signOut();
  }

  if (typeof window === "undefined" || status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r">
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header fijo con botón de inicio */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={() => router.push("/")} className="mr-4">
              <FiHome size={28} className="text-blue-600" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                Control de Tiempos
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Panel de Control
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1 rounded-full transition-all duration-300 transform hover:scale-105"
                title="Opciones de usuario"
              >
                <FiUser size={20} className="text-gray-700" />
                {/* En pantallas medianas o superiores se muestra el username en el botón */}
                <span className="uppercase hidden sm:inline text-gray-700">
                  {cachedUser?.username || "Usuario"}
                </span>
                <FiChevronDown size={16} className="text-gray-700" />
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  {/* En móviles se muestra el username en el menú */}
                  {cachedUser && (
                    <div className="block sm:hidden px-4 py-2 text-sm uppercase text-gray-900 border-b border-gray-100">
                      {cachedUser.username}
                    </div>
                  )}
                  <a
                    href="/perfil"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiUser className="mr-2" size={16} />
                    Perfil
                  </a>
                  <a
                    href="/ayuda"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiHelpCircle className="mr-2" size={16} />
                    Ayuda
                  </a>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={logOut}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut className="mr-2" size={16} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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
            onClick={() => router.push("/proceso/consultar")}
            className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1 active:translate-y-0"
          >
            <FaList size={20} className="mr-2" />
            <span>Registros</span>
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
              <FiUser size={20} className="mr-2" />
              <span>Usuarios</span>
            </button>
          )}
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
