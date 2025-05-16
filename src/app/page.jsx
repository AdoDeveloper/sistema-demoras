"use client";

import { useEffect } from "react";
import { useSession, getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WeatherLoader from "../components/WeatherLoader";

import {
  FaPlay,
  FaChartBar,
  FaArrowRight,
} from "react-icons/fa";
import { PiTruckTrailerFill, PiBarnFill } from "react-icons/pi";
import { FiUsers } from "react-icons/fi";
import { ImSpinner5 } from "react-icons/im";
import { HiOutlineUserCircle } from "react-icons/hi";
import { IoBoatSharp } from "react-icons/io5";
import { GiGrain } from "react-icons/gi";
import { MdPendingActions, MdFrontLoader } from "react-icons/md";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { RiCalendarScheduleFill } from "react-icons/ri";

const WeatherWidget = dynamic(
  () => import("../components/WeatherWidget"),
  {
    ssr: false,
    loading: () => <WeatherLoader />,
  }
);

const ActionButton = ({ path, icon: Icon, label, bgColor, hoverColor, onNavigate }) => (
  <button
    onClick={() => onNavigate(path)}
    className={`
      group relative flex items-center justify-between
      px-5 py-3 rounded-xl text-white font-medium
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
        <Icon size={18} />
      </div>
      <span className="text-base">{label}</span>
    </div>
    <FaArrowRight
      className="
        text-white opacity-0 group-hover:opacity-100
        transform group-hover:translate-x-1
        transition-all duration-150
      "
    />
  </button>
);

// Define all possible actions and their allowed roles
const ACTIONS = [
  { path: "/proceso/iniciar", icon: FaPlay, label: "Iniciar Proceso", bgColor: "bg-green-700", hoverColor: "hover:bg-green-800", roles: [1,2,3,4,5,6,7,8] },
  { path: "/proceso/consultar/granel", icon: GiGrain, label: "Registros Granel", bgColor: "bg-blue-900", hoverColor: "hover:bg-blue-950", roles: [1,2] },
  { path: "/proceso/consultar/envasado", icon: PiTruckTrailerFill, label: "Registros Envasado", bgColor: "bg-amber-500", hoverColor: "hover:bg-amber-600", roles: [1,2] },
  { path: "/proceso/consultar/molino", icon: GiGrain, label: "Registros Molino", bgColor: "bg-emerald-600", hoverColor: "hover:bg-emerald-700", roles: [1,2] },
  { path: "/proceso/consultar/molino/actividades", icon: MdPendingActions, label: "Registros Actividades", bgColor: "bg-yellow-600", hoverColor: "hover:bg-yellow-700", roles: [1,2] },
  { path: "/proceso/analisis", icon: FaChartBar, label: "Datos", bgColor: "bg-teal-600", hoverColor: "hover:bg-teal-700", roles: [1,2] },
  { path: "/proceso/consultar/equipo", icon: MdFrontLoader, label: "Historial de Equipos", bgColor: "bg-red-700", hoverColor: "hover:bg-red-800", roles: [1,4,5] },
  { path: "/proceso/consultar/bitacora", icon: HiClipboardDocumentList, label: "Registros Bitácoras Barco", bgColor: "bg-indigo-700", hoverColor: "hover:bg-indigo-800", roles: [1,3] },
  { path: "/proceso/consultar/barco", icon: IoBoatSharp, label: "Registros Barcos", bgColor: "bg-orange-700", hoverColor: "hover:bg-orange-800", roles: [1] },
  { path: "/proceso/consultar/recepcion/barcos", icon: IoBoatSharp, label: "Barcos Recepción", bgColor: "bg-blue-800", hoverColor: "hover:bg-blue-900", roles: [1] },
  { path: "/proceso/consultar/recepcion", icon: PiBarnFill, label: "Recepciones & Traslados", bgColor: "bg-cyan-700", hoverColor: "hover:bg-cyan-800", roles: [1,6,7] },
  { path: "/proceso/consultar/acontecimientos", icon: RiCalendarScheduleFill, label: "Registros Acontecimientos", bgColor: "bg-orange-700", hoverColor: "hover:bg-orange-800", roles: [1,8] },
  { path: "/usuarios", icon: FiUsers, label: "Usuarios & Roles", bgColor: "bg-gray-700", hoverColor: "hover:bg-gray-800", roles: [1] },
];

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login?authorize=SessionRequired");
    },
  });

  useEffect(() => {
    if (status === "authenticated" && (!session || !session.user)) {
      signOut({ callbackUrl: "/login?authorize=SessionRequired" });
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <ImSpinner5 className="animate-spin mb-4" size={48} />
        <span className="text-xl text-gray-600">Cargando...</span>
      </div>
    );
  }

  const roleId = session.user.roleId;

  const handleNavigate = async (path) => {
    const fresh = await getSession();
    if (!fresh || !fresh.user) {
      signOut({ callbackUrl: "/login?authorize=SessionRequired" });
      return;
    }
    router.push(path);
  };

  // Filter actions by role
  const availableActions = ACTIONS.filter(action => action.roles.includes(roleId));

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="pt-24 pb-4 max-w-7xl mx-auto px-4 space-y-6">
        <section className="bg-white rounded-xl shadow p-6 flex items-center space-x-3">
          <HiOutlineUserCircle size={48} className="text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-800">¡Bienvenido, {session.user.username}!</h2>
            <p className="text-gray-600">Esperamos que tengas un excelente día.</p>
          </div>
        </section>

        <WeatherWidget />

        <section className="bg-white p-4 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableActions.map(({ path, icon, label, bgColor, hoverColor }) => (
              <ActionButton
                key={path}
                path={path}
                icon={icon}
                label={label}
                bgColor={bgColor}
                hoverColor={hoverColor}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
