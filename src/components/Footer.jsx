"use client";

import { FiActivity } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-3">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          {/* Columna Izquierda: Información */}
          <div className="whitespace-nowrap">
            <p className="text-sm sm:text-base text-gray-600">
              © {new Date().getFullYear()} Control de Tiempos.
            </p>
          </div>
          {/* Columna Derecha: Botón de acceso a Estado del Sistema y desarrollador */}
          <div className="flex items-center space-x-4 whitespace-nowrap">
            <a
              href="/health"
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
            >
              <FiActivity className="mr-2" size={16} />
              Estado del Sistema
            </a>
            <p className="text-xs sm:text-sm text-gray-600">
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
        </div>
      </div>
    </footer>
  );
}
