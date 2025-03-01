"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { MdConstruction } from "react-icons/md";

export default function EnConstruccion() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center space-y-6">
        {/* Contenedor del icono con animación de giro */}
        <div
          className="w-24 h-24 rounded-full border-4 border-orange-600 flex items-center justify-center animate-spin"
          style={{ animationDuration: "3s" }}
        >
          <MdConstruction className="text-orange-600" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-blue-600 text-center">
          En desarrollo
        </h1>
        <p className="text-gray-600 text-center">
          Estamos trabajando en esta página. Vuelve más tarde para ver las novedades.
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow transition-transform hover:scale-105"
        >
          <FiArrowLeft size={20} />
          <span>Regresar</span>
        </button>
      </div>
    </div>
  );
}
