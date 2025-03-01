"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import SVGComponent from "../../components/SVGComponent";
export default function EnConstruccion() {
  const router = useRouter();

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center relative bg-white px-4 sm:px-6">
        {/* Cinta de construcción superior */}
        <div className="construction-tape top-tape"></div>
        {/* Cinta de construcción inferior */}
        <div className="construction-tape bottom-tape"></div>

        <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-6 sm:p-8 max-w-lg w-full flex flex-col items-center space-y-4 sm:space-y-6 relative z-10 mt-20 mb-20">
          {/* Ícono de advertencia */}
          <div className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2">
            <FiAlertTriangle size={32} className="text-yellow-500" />
          </div>

          {/* Texto 404 */}
          <h1 className="text-5xl sm:text-6xl font-bold text-red-600">404</h1>

          {/* SVG personalizado */}
          <div className="w-3/4 sm:w-full flex justify-center">
            <SVGComponent />
          </div>

          {/* Título con efecto máquina de escribir */}
          <h2 className="typewriter text-lg sm:text-xl font-bold text-orange-600 text-center uppercase">
            EN DESARROLLO
          </h2>

          <p className="text-sm sm:text-base text-gray-600 text-center">
            Estamos trabajando en esta sección. Vuelve más tarde para ver las novedades.
          </p>

          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-md shadow transition transform hover:-translate-y-1"
          >
            <FiArrowLeft size={24} className="mr-3" />
            <span>Regresar</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .typewriter {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          min-width: 16ch;
          border-right: 0.10em solid #2563eb;
          animation: typing 10s steps(16, end) infinite, blink-caret 1s step-end infinite;
        }

        @keyframes typing {
          0% {
            width: 0;
          }
          40% {
            width: 13ch;
          }
          60% {
            width: 13ch;
          }
          100% {
            width: 0;
          }
        }

        @keyframes blink-caret {
          from,
          to {
            border-color: transparent;
          }
          50% {
            border-color: #2563eb;
          }
        }

        .construction-tape {
          position: absolute;
          left: 0;
          width: 100%;
          background: repeating-linear-gradient(
            45deg,
            #f1c40f,
            #f1c40f 10px,
            #e67e22 10px,
            #e67e22 20px
          );
          z-index: 0;
        }

        .top-tape {
          top: 0;
          height: 40px;
        }

        .bottom-tape {
          bottom: 0;
          height: 40px;
        }

        @media (max-width: 640px) {
          .top-tape,
          .bottom-tape {
            height: 30px;
          }
        }
      `}</style>
    </>
  );
}
