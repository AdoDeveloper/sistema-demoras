"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function SegundoProceso() {
  const router = useRouter();

  // Campos principales
  const [enlonador, setEnlonador] = useState("");
  const [operador, setOperador] = useState("");
  const [personalAsignado, setPersonalAsignado] = useState("");
  const [modeloEquipo, setModeloEquipo] = useState("No requiere");

  // Tiempos (cada uno con { hora, comentarios })
  const [tiempoLlegadaPunto, setTiempoLlegadaPunto] = useState({
    hora: "",
    comentarios: "",
  });
  const [tiempoLlegadaOperador, setTiempoLlegadaOperador] = useState({
    hora: "",
    comentarios: "",
  });
  const [tiempoLlegadaEnlonador, setTiempoLlegadaEnlonador] = useState({
    hora: "",
    comentarios: "",
  });
  const [tiempoLlegadaEquipo, setTiempoLlegadaEquipo] = useState({
    hora: "",
    comentarios: "",
  });
  const [tiempoInicioCarga, setTiempoInicioCarga] = useState({
    hora: "",
    comentarios: "",
  });
  const [tiempoTerminaCarga, setTiempoTerminaCarga] = useState({
    hora: "",
    comentarios: "",
  });
  const [tiempoSalidaPunto, setTiempoSalidaPunto] = useState({
    hora: "",
    comentarios: "",
  });

  // ---------------------------------------
  // useEffect: Cargar/crear "demorasProcess" en localStorage
  // ---------------------------------------
  useEffect(() => {
    let stored = localStorage.getItem("demorasProcess");
    if (!stored) {
      // Crear estructura base si no existe
      const initialData = {
        fechaInicio: new Date().toLocaleString("en-GB", {
          timeZone: "America/El_Salvador",
        }),
        primerProceso: {},
        segundoProceso: {},
        tercerProceso: {},
        procesoFinal: {},
      };
      localStorage.setItem("demorasProcess", JSON.stringify(initialData));
      stored = localStorage.getItem("demorasProcess");
    }

    if (stored) {
      const parsed = JSON.parse(stored);

      if (parsed.segundoProceso) {
        const s = parsed.segundoProceso;
        setEnlonador(s.enlonador || "");
        setOperador(s.operador || "");
        setPersonalAsignado(s.personalAsignado || "");
        setModeloEquipo(s.modeloEquipo || "No requiere");

        setTiempoLlegadaPunto(s.tiempoLlegadaPunto || { hora: "", comentarios: "" });
        setTiempoLlegadaOperador(s.tiempoLlegadaOperador || {
          hora: "",
          comentarios: "",
        });
        setTiempoLlegadaEnlonador(s.tiempoLlegadaEnlonador || {
          hora: "",
          comentarios: "",
        });
        setTiempoLlegadaEquipo(s.tiempoLlegadaEquipo || {
          hora: "",
          comentarios: "",
        });
        setTiempoInicioCarga(s.tiempoInicioCarga || { hora: "", comentarios: "" });
        setTiempoTerminaCarga(s.tiempoTerminaCarga || { hora: "", comentarios: "" });
        setTiempoSalidaPunto(s.tiempoSalidaPunto || { hora: "", comentarios: "" });
      }
    }
  }, []);

  // ---------------------------------------
  // Helper: Asignar "Ahora" en formato HH:mm:ss (UTC-6)
  // ---------------------------------------
  const handleSetNow = (setter) => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setter((prev) => ({ ...prev, hora }));
  };

  // ---------------------------------------
  // Guardar en localStorage y pasar al Tercer Proceso
  // ---------------------------------------
  const handleGuardarYContinuar = () => {
    const stored = localStorage.getItem("demorasProcess");
    if (stored) {
      const parsed = JSON.parse(stored);

      parsed.segundoProceso = {
        enlonador,
        operador,
        personalAsignado,
        modeloEquipo,

        tiempoLlegadaPunto,
        tiempoLlegadaOperador,
        tiempoLlegadaEnlonador,
        tiempoLlegadaEquipo,
        tiempoInicioCarga,
        tiempoTerminaCarga,
        tiempoSalidaPunto,
      };

      localStorage.setItem("demorasProcess", JSON.stringify(parsed));
    }
    router.push("/proceso/iniciar/step3");
  };

  // ---------------------------------------
  // Botón "Anterior" => vuelve a Paso 1
  // ---------------------------------------
  const handleAtras = () => {
    const stored = localStorage.getItem("demorasProcess");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Guardar temporal antes de salir
      parsed.segundoProceso = {
        enlonador,
        operador,
        personalAsignado,
        modeloEquipo,

        tiempoLlegadaPunto,
        tiempoLlegadaOperador,
        tiempoLlegadaEnlonador,
        tiempoLlegadaEquipo,
        tiempoInicioCarga,
        tiempoTerminaCarga,
        tiempoSalidaPunto,
      };
      localStorage.setItem("demorasProcess", JSON.stringify(parsed));
    }
    router.push("/proceso/iniciar"); // Regresa al Primer Proceso
  };

  // ---------------------------------------
  // Render principal
  // ---------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6">
        {/* Barra de Progreso */}
        <div className="flex items-center mb-4">
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center rounded-l-lg">Paso 1</div>
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4">
            Paso 2 de 4
          </div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center">Paso 3</div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center rounded-r-lg">Paso 4</div>
        </div>

        <h2 className="text-xl font-bold mb-4 text-orange-600">Segundo Proceso</h2>

        {/* Campos principales (responsive 1 col en mobile, 2 cols en sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Enlonador */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Enlonador</label>
            <input
              type="text"
              className="border w-full p-2 text-sm sm:text-base"
              value={enlonador}
              onChange={(e) => setEnlonador(e.target.value)}
            />
          </div>

          {/* Operador */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Operador</label>
            <input
              type="text"
              className="border w-full p-2 text-sm sm:text-base"
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
            />
          </div>

          {/* Personal Asignado */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Personal Asignado
            </label>
            <input
              type="text"
              className="border w-full p-2 text-sm sm:text-base"
              value={personalAsignado}
              onChange={(e) => setPersonalAsignado(e.target.value)}
            />
          </div>

          {/* Modelo de Equipo */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Modelo de Equipo
            </label>
            <select
              className="border w-full p-2 text-sm sm:text-base"
              value={modeloEquipo}
              onChange={(e) => setModeloEquipo(e.target.value)}
            >
              <option value="No requiere">No Requiere</option>
              <option value="J1">J1</option>
              <option value="J2">J2</option>
              <option value="J3">J3</option>
              <option value="K1">K1</option>
              <option value="K2">K2</option>
              <option value="K3">K3</option>
            </select>
          </div>
        </div>

        {/* Tiempos */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2 text-sm sm:text-base">Tiempos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Llegada al Punto */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Llegada al Punto
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaPunto.hora}
                  onChange={(e) =>
                    setTiempoLlegadaPunto((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoLlegadaPunto)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoLlegadaPunto.comentarios}
                onChange={(e) =>
                  setTiempoLlegadaPunto((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>

            {/* Llegada del Operador */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Llegada del Operador
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaOperador.hora}
                  onChange={(e) =>
                    setTiempoLlegadaOperador((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoLlegadaOperador)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoLlegadaOperador.comentarios}
                onChange={(e) =>
                  setTiempoLlegadaOperador((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>

            {/* Llegada del Enlonador */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Llegada del Enlonador
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaEnlonador.hora}
                  onChange={(e) =>
                    setTiempoLlegadaEnlonador((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoLlegadaEnlonador)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoLlegadaEnlonador.comentarios}
                onChange={(e) =>
                  setTiempoLlegadaEnlonador((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>

            {/* Llegada del Equipo */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Llegada del Equipo
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaEquipo.hora}
                  onChange={(e) =>
                    setTiempoLlegadaEquipo((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoLlegadaEquipo)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoLlegadaEquipo.comentarios}
                onChange={(e) =>
                  setTiempoLlegadaEquipo((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>

            {/* Inicio de Carga */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Inicio de Carga
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoInicioCarga.hora}
                  onChange={(e) =>
                    setTiempoInicioCarga((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoInicioCarga)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoInicioCarga.comentarios}
                onChange={(e) =>
                  setTiempoInicioCarga((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>

            {/* Termina Carga */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Termina Carga
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoTerminaCarga.hora}
                  onChange={(e) =>
                    setTiempoTerminaCarga((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoTerminaCarga)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoTerminaCarga.comentarios}
                onChange={(e) =>
                  setTiempoTerminaCarga((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>

            {/* Salida del Punto */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Salida del Punto
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoSalidaPunto.hora}
                  onChange={(e) =>
                    setTiempoSalidaPunto((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoSalidaPunto)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoSalidaPunto.comentarios}
                onChange={(e) =>
                  setTiempoSalidaPunto((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

          {/* Botones de Navegación */}
          <div className="mt-6 flex justify-between">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={handleAtras}
          >
            Anterior
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleGuardarYContinuar}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
