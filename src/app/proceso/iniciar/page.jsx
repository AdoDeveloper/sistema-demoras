"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import { PiTruckTrailerFill, PiBarnFill } from "react-icons/pi";
import { MdPendingActions } from "react-icons/md";
import { GiWindmill, GiGrain } from "react-icons/gi";
import { IoBoatSharp } from "react-icons/io5";
import Footer from "../../../components/Footer";
import Swal from "sweetalert2";

export default function Proceso() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roleId, setRoleId] = useState(null);
  const [molidoOpen, setMolidoOpen] = useState(false);

  useEffect(() => {
    // Redirección si no hay sesión
    if (status === "unauthenticated") {
      router.push("/login");
    }

      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          setRoleId(user.roleId);
        } else if (session?.user) {
          sessionStorage.setItem("user", JSON.stringify(session.user));
          setRoleId(session.user.roleId);
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

  // Función para mostrar confirmación y redirigir
  const handleProcessConfirm = (route, processName) => {
    Swal.fire({
      title: "¿Está seguro?",
      text: `Está a punto de iniciar el proceso de ${processName}. ¿Desea continuar?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push(route);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-6 space-y-4">
          <h1 className="text-2xl font-bold text-center mb-6">Seleccione el Proceso</h1>
          {(roleId === 1 || roleId === 2) && (
            <>
              {/* Botón para Iniciar Granel */}
              <button
                onClick={() => handleProcessConfirm("/proceso/iniciar/granel", "Granel")}
                className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1"
              >
                <PiBarnFill size={24} className="mr-3" />
                <span>Iniciar Granel</span>
              </button>

              {/* Botón para Proceso Envasado */}
                <button
                  onClick={() => handleProcessConfirm("/proceso/iniciar/envasado", "Envasado")}
                  className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow transition"
                >
                  <PiTruckTrailerFill size={28} className="mr-3" />
                  <span>Iniciar Envasado</span>
                </button>

                {/* Botón para Iniciar Molido */}
                <div className="relative">
                  <button
                    onClick={() => setMolidoOpen(!molidoOpen)}
                    className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow transition"
                  >
                    <GiWindmill size={28} className="mr-3" />
                    <span>Iniciar Molido</span>
                  </button>
                  {molidoOpen && (
                    <div className="mt-2 bg-white border border-teal-500 shadow-lg rounded-lg p-4 space-y-2">
                      <button
                        onClick={() => {
                          setMolidoOpen(false);
                          handleProcessConfirm("/proceso/iniciar/molino", "Molido");
                        }}
                        className="w-full flex items-center justify-start bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md transition"
                      >
                        <GiGrain size={24} className="mr-2" />
                        <span>Molido Envasado/Granel</span>
                      </button>
                      <button
                        onClick={() => {
                          setMolidoOpen(false);
                          handleProcessConfirm("/proceso/iniciar/molino/actividades", "Actividades");
                        }}
                        className="w-full flex items-center justify-start bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md transition"
                      >
                        <MdPendingActions size={24} className="mr-2" />
                        <span>Actividades</span>
                      </button>
                    </div>
                  )}
                </div>
            </>
          )}

          {(roleId === 1 || roleId === 3) && (
            <button
              onClick={() => handleProcessConfirm("/proceso/iniciar/barco", "Barco")}
              className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1"
            >
              <IoBoatSharp size={24} className="mr-3" />
              <span>Iniciar Barco</span>
            </button>
          )}
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl shadow transition transform hover:-translate-y-1"
          >
            <FiArrowLeft size={24} className="mr-3" />
            <span>Regresar</span>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
