"use client";

import { useEffect, useState } from "react";
import { useSession, getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import {
  PiTruckTrailerFill,
  PiBarnFill,
} from "react-icons/pi";
import {
  MdFrontLoader,
  MdPendingActions,
} from "react-icons/md";
import {
  GiWindmill,
  GiGrain,
} from "react-icons/gi";
import { IoBoatSharp } from "react-icons/io5";
import Swal from "sweetalert2";

// 1) Definimos toda la configuración de procesos en un array
const PROCESOS = [
  { key: "granel", name: "Granel", path: "/proceso/iniciar/granel", icon: PiBarnFill, bgColor: "bg-blue-900", hoverColor: "hover:bg-blue-950", roles: [1, 2], },
  { key: "envasado", name: "Envasado", path: "/proceso/iniciar/envasado", icon: PiTruckTrailerFill, bgColor: "bg-amber-500", hoverColor: "hover:bg-amber-600", roles: [1, 2], },
  { key: "molido", name: "Molido", icon: GiWindmill, bgColor: "bg-emerald-600", hoverColor: "hover:bg-emerald-700", roles: [1, 2],
    children: [
      { key: "molino", name: "Molido Envasado/Granel", path: "/proceso/iniciar/molino", icon: GiGrain, },
      { key: "actividades", name: "Actividades", path: "/proceso/iniciar/molino/actividades", icon: MdPendingActions, },
    ],
  },
  { key: "barco", name: "Barco", path: "/proceso/iniciar/barco", icon: IoBoatSharp, bgColor: "bg-indigo-700", hoverColor: "hover:bg-indigo-800", roles: [1, 3], },
  { key: "equipo", name: "Inspección de Equipo", path: "/proceso/iniciar/equipo", icon: MdFrontLoader, bgColor: "bg-red-700", hoverColor: "hover:bg-red-800", roles: [1, 4, 5], },
  { key: "recepcion", name: "Recepción/Traslado", path: "/proceso/iniciar/recepcion", icon: PiBarnFill, bgColor: "bg-cyan-700", hoverColor: "hover:bg-cyan-800", roles: [1, 6], },
  { key: "back", name: "Regresar", onClick: (router) => router.push("/"), icon: FiArrowLeft, bgColor: "bg-gray-500", hoverColor: "hover:bg-gray-600", roles: [1,2,3,4,5,6], },
];

// 2) Componente genérico de botón de proceso
const ProcessButton = ({
  icon: Icon,
  label,
  onClick,
  bgColor,
  hoverColor,
  small = false,
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-center
      w-full
      ${small ? "py-2 px-4 rounded-md" : "py-3 px-4 rounded-xl"}
      ${bgColor} ${hoverColor}
      text-white font-semibold
      shadow transition-transform duration-150
      hover:-translate-y-1
    `}
  >
    <Icon size={ small ? 20 : 24 } className="mr-3" />
    <span className={ small ? "text-sm" : "text-base" }>{label}</span>
  </button>
);

export default function Proceso() {
  const router = useRouter();
  const [openMolido, setOpenMolido] = useState(false);

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      signOut({ callbackUrl: "/login?authorize=SessionRequired" });
    },
  });

  // Hook para forzar logout si session.user falla
  useEffect(() => {
    if (status === "authenticated" && (!session || !session.user)) {
      signOut({ callbackUrl: "/login?authorize=SessionRequired" });
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <FiLoader className="animate-spin mb-4" size={48} />
        <span className="text-xl text-gray-600">Cargando...</span>
      </div>
    );
  }

  const roleId = session.user.roleId;

  // Confirmación + revalidación de sesión antes de navegar
  const handleProcessConfirm = (path, name) => {
    Swal.fire({
      title: "¿Está seguro?",
      text: `Está a punto de iniciar el proceso de ${name}. ¿Desea continuar?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const fresh = await getSession();
        if (!fresh || !fresh.user) {
          signOut({ callbackUrl: "/login?authorize=SessionRequired" });
        } else {
          router.push(path);
        }
      }
    });
  };

  // Filtrar procesos según rol
  const available = PROCESOS.filter((p) =>
    p.roles.includes(roleId)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow flex items-center justify-center mt-12 px-4 py-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-6 space-y-4">
          <h1 className="text-2xl font-bold text-center mb-6">
            Seleccione el Proceso
          </h1>

          {available.map((proc) =>
            proc.children ? (
              <div key={proc.key} className="relative">
                <ProcessButton
                  icon={proc.icon}
                  label={`Iniciar ${proc.name}`}
                  onClick={() => setOpenMolido((o) => !o)}
                  bgColor={proc.bgColor}
                  hoverColor={proc.hoverColor}
                />
                {openMolido && (
                  <div className="mt-2 bg-white border border-emerald-400 shadow-lg rounded-lg p-4 space-y-2">
                    {proc.children.map((child) => (
                      <ProcessButton
                        key={child.key}
                        icon={child.icon}
                        label={child.name}
                        small
                        bgColor="bg-emerald-500"
                        hoverColor="hover:bg-emerald-600"
                        onClick={() => {
                          setOpenMolido(false);
                          handleProcessConfirm(child.path, child.name);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <ProcessButton
                key={proc.key}
                icon={proc.icon}
                label={
                  proc.key === "back" ? proc.name : `Iniciar ${proc.name}`
                }
                bgColor={proc.bgColor}
                hoverColor={proc.hoverColor}
                onClick={
                  proc.key === "back"
                    ? () => proc.onClick(router)
                    : () => handleProcessConfirm(proc.path, proc.name)
                }
              />
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}