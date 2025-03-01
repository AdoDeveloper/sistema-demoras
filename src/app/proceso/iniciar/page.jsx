"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import { FiArrowLeft } from "react-icons/fi";
import { PiTruckTrailerFill, PiBarnFill } from "react-icons/pi";
import Footer from "../../../components/Footer";
import Swal from "sweetalert2";

export default function Proceso() {
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-500">
        <div className="text-white text-lg font-semibold">Cargando...</div>
      </div>
    );
  }

  // Función para mostrar confirmación con SweetAlert2
  const handleProcessConfirm = (route, processName) => {
    Swal.fire({
      title: "¿Está seguro?",
      text: `Está a punto de iniciar un proceso de ${processName}. ¿Desea continuar?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
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
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Seleccione el Proceso</h1>
          <div className="space-y-4">
            <button
              onClick={() =>
                handleProcessConfirm("/proceso/iniciar/granel", "Granel")
              }
              className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md shadow transition transform hover:-translate-y-1"
            >
              <PiBarnFill size={24} className="mr-3" />
              <span>Granel</span>
            </button>
            <button
              onClick={() =>
                handleProcessConfirm("/building", "Envasado")
              }
              className="flex items-center justify-center w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-md shadow transition transform hover:-translate-y-1"
            >
              <PiTruckTrailerFill size={24} className="mr-3" />
              <span>Envasado</span>
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-md shadow transition transform hover:-translate-y-1"
            >
              <FiArrowLeft size={24} className="mr-3" />
              <span>Regresar</span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
