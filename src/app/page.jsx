"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WeatherLoader from "../components/WeatherLoader";

// Iconos
import { FaPlay, FaChartBar, FaArrowRight } from "react-icons/fa";
import { PiTruckTrailerFill, PiBarnFill } from "react-icons/pi";
import { FiUsers, FiLoader } from "react-icons/fi";
import { HiOutlineUserCircle } from "react-icons/hi";
import { IoBoatSharp } from "react-icons/io5";
import { GiGrain } from "react-icons/gi";
import { MdPendingActions, MdHistory, MdFrontLoader } from "react-icons/md";
import { HiClipboardDocumentList } from "react-icons/hi2";

// Importación dinámica para el WeatherWidget con fallback al WeatherLoader
const WeatherWidget = dynamic(() => import("../components/WeatherWidget"), {
  ssr: false,
  loading: () => <WeatherLoader />,
});

// Botón reutilizable con ícono en círculo, flecha en hover y sombra interior
const ActionButton = ({ onClick, icon: Icon, label, bgColor, hoverColor }) => {
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex items-center justify-between 
        px-5 py-3
        rounded-xl
        text-white font-medium
        whitespace-nowrap
        shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]
        transition-all duration-150
        hover:-translate-y-0.5 
        hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2),0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]
        active:translate-y-0 active:shadow-inner
        ${bgColor} ${hoverColor}
      `}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 shadow shadow-black/20">
          <Icon size={18} className="relative" />
        </div>
        <span className="text-base">{label}</span>
      </div>
      <FaArrowRight
        className="
          text-white
          opacity-0
          group-hover:opacity-100
          transform
          group-hover:translate-x-1
          transition-all
          duration-150
        "
      />
    </button>
  );
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si no hay sesión, redirigimos al login
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Mientras carga la sesión mostramos un loader
  if (typeof window === "undefined" || status === "loading") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <FiLoader className="animate-spin mr-2" size={40} />
        <span className="text-xl text-gray-600">Cargando...</span>
      </div>
    );
  }

  // Obtenemos el roleId directamente de la sesión
  const roleId = session?.user?.roleId;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="pt-24 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Tarjeta de bienvenida */}
        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <HiOutlineUserCircle size={48} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">¡Bienvenido!</h2>
              <p className="text-gray-600">Esperamos que tengas un excelente día.</p>
            </div>
          </div>
        </section>
        {/* WeatherWidget */}
        <WeatherWidget />

        {/* Sección: Acciones rápidas */}
        <section className="bg-white p-4 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(roleId === 1 || roleId === 2 || roleId === 3 || roleId === 4) && (
              <>
                <ActionButton
                  onClick={() => router.push("/proceso/iniciar")}
                  icon={FaPlay}
                  label="Iniciar Proceso"
                  bgColor="bg-green-700"
                  hoverColor="hover:bg-green-800"
                />
              </>
            )}
            {(roleId === 1 || roleId === 2) && (
              <>
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/granel")}
                  icon={PiBarnFill}
                  label="Registros Granel"
                  bgColor="bg-blue-900"
                  hoverColor="hover:bg-blue-950"
                />
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/envasado")}
                  icon={PiTruckTrailerFill}
                  label="Registros Envasado"
                  bgColor="bg-amber-500"
                  hoverColor="hover:bg-amber-600"
                />
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/molino")}
                  icon={GiGrain}
                  label="Registros Molino"
                  bgColor="bg-emerald-600"
                  hoverColor="hover:bg-emerald-700"
                />
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/molino/actividades")}
                  icon={MdPendingActions}
                  label="Registros Actividades"
                  bgColor="bg-yellow-600"
                  hoverColor="hover:bg-yellow-700"
                />
                <ActionButton
                  onClick={() => router.push("/proceso/analisis")}
                  icon={FaChartBar}
                  label="Datos"
                  bgColor="bg-teal-600"
                  hoverColor="hover:bg-teal-700"
                />
              </>
            )}
            {(roleId === 1 || roleId === 4) && (
              <ActionButton
                onClick={() => router.push("/proceso/consultar/equipo")}
                icon={MdFrontLoader}
                label="Historial de Equipos"
                bgColor="bg-red-700"
                hoverColor="hover:bg-red-800"
              />
            )}
            {(roleId === 1 || roleId === 3) && (
              <ActionButton
                onClick={() => router.push("/proceso/consultar/bitacora")}
                icon={HiClipboardDocumentList}
                label="Registros Bitácoras Barco"
                bgColor="bg-indigo-700"
                hoverColor="hover:bg-indigo-800"
              />
            )}
            {roleId === 1 && (
              <>
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/barco")}
                  icon={IoBoatSharp}
                  label="Registros Barcos"
                  bgColor="bg-orange-700"
                  hoverColor="hover:bg-orange-800"
                />
                <ActionButton
                  onClick={() => router.push("/usuarios")}
                  icon={FiUsers}
                  label="Usuarios"
                  bgColor="bg-gray-700"
                  hoverColor="hover:bg-gray-800"
                />
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
