"use client";

import { FiActivity } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* En móviles: dos columnas, información a la izquierda y botón a la derecha */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-between">
          {/* Columna Izquierda: Información */}
          <div className="flex flex-col items-start">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Control de Tiempos.
            </p>
            <p className="text-gray-600 text-xs">
              Desarrollado por{" "}
              <a
                href="https://github.com/AdoDeveloper"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline"
              >
                Adolfo Cortez
              </a>
            </p>
          </div>
          {/* Columna Derecha: Botón de acceso a Estado del Sistema */}
          <div className="flex justify-end">
            <a
              href="/health"
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              <FiActivity className="mr-2" size={16} />
              Estado del Sistema
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
