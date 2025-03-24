"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Iconos
import { FaPlay, FaChartBar, FaArrowRight } from "react-icons/fa";
import { PiTruckTrailerFill, PiBarnFill } from "react-icons/pi";
import { FiUsers, FiLoader } from "react-icons/fi";
import { HiOutlineUserCircle } from "react-icons/hi";
import { IoBoatSharp } from "react-icons/io5";
import { GiGrain } from "react-icons/gi";
import { MdPendingActions } from "react-icons/md";

// Importación dinámica para evitar problemas de hidratación con Next.js
const WeatherWidget = dynamic(() => import("../components/WeatherWidget"), {
  ssr: false,
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
        transition-transform duration-150
        hover:-translate-y-0.5 hover:shadow-md
        active:translate-y-0 active:shadow-inner
        ${bgColor} hover:${hoverColor}
      `}
    >
      {/* Contenedor principal (icono + texto) */}
      <div className="flex items-center space-x-3">
        {/* Ícono con círculo y sombra */}
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 shadow shadow-black/20">
          <Icon size={18} className="relative" />
        </div>
        <span className="text-base">{label}</span>
      </div>

      {/* Flecha que aparece al hacer hover */}
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
  const [cachedUser, setCachedUser] = useState(null);
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    // Redirección si no hay sesión
    if (status === "unauthenticated") {
      router.push("/login");
    }

    // Cacheo de usuario en sessionStorage
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("user");
      if (cached) {
        setCachedUser(JSON.parse(cached));
      } else if (session?.user) {
        sessionStorage.setItem("user", JSON.stringify(session.user));
        setCachedUser(session.user);
      }
      // Obtenemos el roleId desde localStorage
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
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Tarjeta de bienvenida y WeatherWidget en la misma columna */}
        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <HiOutlineUserCircle size={48} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">¡Bienvenido!</h2>
              <p className="text-gray-600">Esperamos que tengas un excelente día.</p>
            </div>
          </div>

        </section>
        <div>{typeof window !== "undefined" && <WeatherWidget />}</div>

        {/* Sección: Acciones rápidas */}
        <section className="bg-white p-6 rounded-md shadow space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Iniciar Proceso: visible para todos */}
            <ActionButton
              onClick={() => router.push("/proceso/iniciar")}
              icon={FaPlay}
              label="Iniciar Proceso"
              bgColor="bg-green-500"
              hoverColor="bg-green-600"
            />

            {/* Opciones para roleId 1 y 2 */}
            {(roleId === 1 || roleId === 2) && (
              <>
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/granel")}
                  icon={PiBarnFill}
                  label="Registros Granel"
                  bgColor="bg-purple-500"
                  hoverColor="bg-purple-600"
                />
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/envasado")}
                  icon={PiTruckTrailerFill}
                  label="Registros Envasado"
                  bgColor="bg-blue-500"
                  hoverColor="bg-blue-600"
                />
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/molino")}
                  icon={GiGrain}
                  label="Registros Molino"
                  bgColor="bg-orange-500"
                  hoverColor="bg-orange-600"
                />
                <ActionButton
                  onClick={() => router.push("/proceso/consultar/molino/actividades")}
                  icon={MdPendingActions}
                  label="Registros Actividades"
                  bgColor="bg-orange-600"
                  hoverColor="bg-orange-700"
                />
                <ActionButton
                  onClick={() => router.push("/proceso/analisis")}
                  icon={FaChartBar}
                  label="Datos"
                  bgColor="bg-violet-500"
                  hoverColor="bg-violet-600"
                />
              </>
            )}

            {/* Registros Barcos: visible para roleId 1 y roleId 3 */}
            {(roleId === 1 || roleId === 3) && (
              <ActionButton
                onClick={() => router.push("/building")}
                icon={IoBoatSharp}
                label="Registros Barcos"
                bgColor="bg-sky-500"
                hoverColor="bg-sky-600"
              />
            )}

            {/* Usuarios: visible solo para roleId 1 */}
            {roleId === 1 && (
              <ActionButton
                onClick={() => router.push("/usuarios")}
                icon={FiUsers}
                label="Usuarios"
                bgColor="bg-gray-600"
                hoverColor="bg-gray-700"
              />
            )}
          </div>
        </section>

        {/* Sección: Estado del sistema */}
        <section className="bg-white p-6 rounded-md shadow space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Estado del sistema</h2>
          <ul className="space-y-3">
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <span>Conexión a base de datos</span>
              <span className="ml-auto px-2 py-1 text-sm rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                Activo
              </span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <span>API de servicios</span>
              <span className="ml-auto px-2 py-1 text-sm rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                Activo
              </span>
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <span>Servicio de reportes</span>
              <span className="ml-auto px-2 py-1 text-sm rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                Activo
              </span>
            </li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
