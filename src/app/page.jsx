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

    // 📌 Obtener datos desde caché si existen
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-6 border-t-4 border-orange-500">
        
        <div className="flex justify-center">
          <img src="/logo.png" alt="ALMAPAC Logo" className="h-16" />
        </div>

        <h1 className="text-center text-2xl font-bold text-blue-700 mt-4">
          ALMAPAC Sistema de Demoras
        </h1>

        <div className="mt-6 bg-orange-500 text-white text-xl font-semibold py-2 px-4 rounded-lg text-center">
          Panel de Control
        </div>

        <div className="p-6 text-center">
          <p className="text-lg font-semibold text-gray-800">
            👋 Bienvenido, <span className="text-blue-700">{cachedUser?.username || "Usuario"}</span>
          </p>
          {/* <p className="text-sm text-gray-600">🆔 ID: {cachedUser?.id}</p> */}

          <div className="mt-6 grid grid-cols-2 gap-5">
            <button
              className="col-span-2 bg-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-orange-600"
              onClick={() => router.push("/proceso/iniciar")}
            >
            Iniciar Proceso
            </button>

            <button
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700"
              onClick={() => router.push("/proceso/consultar")}
            >
            Ver Registros
            </button>

            <button
              className="bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-red-600"
              onClick={() => {
                sessionStorage.removeItem("user");
                signOut();
              }}
            >
            Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
