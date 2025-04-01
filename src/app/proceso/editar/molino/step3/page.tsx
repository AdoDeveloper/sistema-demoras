"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Importar react-select de forma dinámica para evitar problemas de SSR/hidratación
const Select = dynamic(() => import("react-select"), { ssr: false });

// Definición del tipo de opción para react-select
interface OptionType {
  value: string;
  label: string;
}

/** Crea una estructura de sub-tiempo: { hora, comentarios } */
function crearSubtiempo(hora = "", comentarios = "") {
  return { hora, comentarios };
}

/** Crea una nueva vuelta con los tiempos predeterminados */
function crearNuevaVuelta(
  numeroVuelta: number,
  llegadaPunto = crearSubtiempo(),
  salidaPunto = crearSubtiempo(),
  llegadaBascula = crearSubtiempo(),
  entradaBascula = crearSubtiempo(),
  salidaBascula = crearSubtiempo()
) {
  return {
    numeroVuelta,
    llegadaPunto,
    salidaPunto,
    llegadaBascula,
    entradaBascula,
    salidaBascula,
  };
}

// Opciones para el select de "Báscula de Salida"
const basculaSalidaOptions: OptionType[] = [
  { value: "Báscula 1", label: "Báscula 1" },
  { value: "Báscula 2", label: "Báscula 2" },
  { value: "Báscula 3", label: "Báscula 3" },
  { value: "Báscula 4", label: "Báscula 4" },
  { value: "Báscula 5", label: "Báscula 5" },
  { value: "Báscula 6", label: "Báscula 6" },
];

// ---------------------------------------
// Función para formatear entrada de tiempo (HH:MM:SS)
const handleTimeInputChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: Function
) => {
  let digits = e.target.value.replace(/\D/g, "");
  if (digits.length > 6) {
    digits = digits.slice(0, 6);
  }
  let formatted = "";
  if (digits.length > 0) {
    formatted = digits.substring(0, 2);
    if (digits.length > 2) {
      formatted += ":" + digits.substring(2, 4);
      if (digits.length > 4) {
        formatted += ":" + digits.substring(4, 6);
      }
    }
  }
  setter((prev: any) => ({ ...prev, hora: formatted }));
};

// Funciones de conversión de tiempo
const timeStringToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(":");
  if (parts.length !== 3) return 0;
  const [hours, minutes, seconds] = parts.map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const secondsToTimeString = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// ---------------------------------------
// Componente del Tercer Proceso (Molino)
export default function TercerProceso() {
  const router = useRouter();

  // ----- Campos Principales (Tercer Proceso) -----
  const [pesadorSalida, setPesadorSalida] = useState("");
  const [basculaSalida, setBasculaSalida] = useState("");
  const [tiempoLlegadaBascula, setTiempoLlegadaBascula] = useState(crearSubtiempo());
  const [tiempoEntradaBascula, setTiempoEntradaBascula] = useState(crearSubtiempo());
  const [tiempoSalidaBascula, setTiempoSalidaBascula] = useState(crearSubtiempo());

  // Registro de Vueltas
  const [vueltas, setVueltas] = useState<any[]>([]);

  // useEffect: Cargar datos desde localStorage (key "editMolino") y sincronizar la Vuelta 1
  useEffect(() => {
    cargarDatosDeLocalStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cargarDatosDeLocalStorage() {
    let stored = localStorage.getItem("editMolino");
    if (!stored) {
      // Si no existe, crear estructura base
      const initialData = {
        fechaInicio: new Date().toLocaleString("en-GB", { timeZone: "America/El_Salvador" }),
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
        primerProceso: {},
        segundoProceso: {},
        tercerProceso: {},
        procesoFinal: {},
      };
      localStorage.setItem("editMolino", JSON.stringify(initialData));
      stored = localStorage.getItem("editMolino");
    }
    const parsed = JSON.parse(stored || "{}");

    // 1) Cargar datos del Tercer Proceso
    if (parsed.tercerProceso) {
      const t = parsed.tercerProceso;
      setPesadorSalida(t.pesadorSalida || "");
      setBasculaSalida(t.basculaSalida || "");
      setTiempoLlegadaBascula(t.tiempoLlegadaBascula || crearSubtiempo());
      setTiempoEntradaBascula(t.tiempoEntradaBascula || crearSubtiempo());
      setTiempoSalidaBascula(t.tiempoSalidaBascula || crearSubtiempo());
    }

    // 2) Extraer datos del Segundo Proceso para sincronizar la Vuelta 1
    const s = parsed.segundoProceso || {};
    const tsLlegPunto = s.tiempoLlegadaPunto || crearSubtiempo();
    const tsSalidaPunto = s.tiempoSalidaPunto || crearSubtiempo();

    // 3) Datos actuales del Tercer Proceso (para tiempos de báscula)
    const tProc = parsed.tercerProceso || {};
    const tLlegBascula = tProc.tiempoLlegadaBascula || crearSubtiempo();
    const tEntradaBascula = tProc.tiempoEntradaBascula || crearSubtiempo();
    const tSalidaBascula = tProc.tiempoSalidaBascula || crearSubtiempo();

    // 4) Cargar vueltas existentes
    let vueltasLS: any[] = [];
    if (parsed.tercerProceso && Array.isArray(parsed.tercerProceso.vueltas)) {
      vueltasLS = parsed.tercerProceso.vueltas;
    }

    // 5) Si no hay vueltas, crear la Vuelta 1 usando datos de procesos 2 y 3
    if (vueltasLS.length === 0) {
      const v1 = crearNuevaVuelta(
        1,
        tsLlegPunto,    // llegadaPunto
        tsSalidaPunto,  // salidaPunto
        tLlegBascula,   // llegadaBascula
        tEntradaBascula, // entradaBascula
        tSalidaBascula   // salidaBascula
      );
      setVueltas([v1]);
    } else {
      // 6) Si hay vueltas, sincronizar la Vuelta 1 con los datos actuales
      const updated = [...vueltasLS];
      const idxV1 = updated.findIndex((x) => x.numeroVuelta === 1);
      if (idxV1 >= 0) {
        updated[idxV1].llegadaPunto = tsLlegPunto;
        updated[idxV1].salidaPunto = tsSalidaPunto;
        updated[idxV1].llegadaBascula = tLlegBascula;
        updated[idxV1].entradaBascula = tEntradaBascula;
        updated[idxV1].salidaBascula = tSalidaBascula;
      }
      setVueltas(updated);
    }
  }

  // Función para guardar los cambios en el objeto "editMolino" (tercerProceso)
  function guardarDatosEnLocalStorage() {
    const stored = localStorage.getItem("editMolino");
    if (!stored) return;
    const parsed = JSON.parse(stored);

    // Reextraer datos del Segundo Proceso (para sincronizar la Vuelta 1)
    const s = parsed.segundoProceso || {};
    const tsLlegPunto = s.tiempoLlegadaPunto || crearSubtiempo();
    const tsSalidaPunto = s.tiempoSalidaPunto || crearSubtiempo();

    // Reextraer datos actuales del Tercer Proceso
    const tProc = parsed.tercerProceso || {};
    const tLlegBascula = tProc.tiempoLlegadaBascula || crearSubtiempo();
    const tEntradaBascula = tProc.tiempoEntradaBascula || crearSubtiempo();
    const tSalidaBascula = tProc.tiempoSalidaBascula || crearSubtiempo();

    // Actualizar la Vuelta 1 en el estado
    setVueltas((prev) => {
      const updated = [...prev];
      const idxV1 = updated.findIndex((x) => x.numeroVuelta === 1);
      if (idxV1 >= 0) {
        updated[idxV1].llegadaPunto = tsLlegPunto;
        updated[idxV1].salidaPunto = tsSalidaPunto;
        updated[idxV1].llegadaBascula = tLlegBascula;
        updated[idxV1].entradaBascula = tEntradaBascula;
        updated[idxV1].salidaBascula = tSalidaBascula;
      }
      return updated;
    });

    // Usamos setTimeout para asegurar que el estado "vueltas" esté actualizado
    setTimeout(() => {
      const finalVState = [...vueltas];
      parsed.tercerProceso = {
        pesadorSalida,
        basculaSalida,
        tiempoLlegadaBascula,
        tiempoEntradaBascula,
        tiempoSalidaBascula,
        vueltas: finalVState,
      };
      localStorage.setItem("editMolino", JSON.stringify(parsed));
    }, 0);
  }

  // Helper: Asignar "Ahora" a un campo de tiempo (formato HH:mm:ss)
  const handleSetNow = (
    setter: Dispatch<SetStateAction<{ hora: string; comentarios: string }>>
  ) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const hora = `${hh}:${mm}:${ss}`;
    setter((prev) => ({ ...prev, hora }));
  };

  // Helper: Asignar "Ahora" a un sub-tiempo de una vuelta
  const handleSetNowSubtiempo = (index: number, tiempoKey: string) => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setVueltas((prev) => {
      const updated = [...prev];
      updated[index][tiempoKey] = { ...updated[index][tiempoKey], hora };
      return updated;
    });
  };

  // Helper: Actualiza un campo de un sub-tiempo en una vuelta
  const handleChangeVueltaTiempo = (
    index: number,
    tiempoKey: string,
    field: string,
    value: string
  ) => {
    setVueltas((prev) => {
      const updated = [...prev];
      updated[index][tiempoKey] = { ...updated[index][tiempoKey], [field]: value };
      return updated;
    });
  };

  // Botón para guardar y continuar (guardar en storage y navegar al siguiente paso: Proceso Final)
  const handleGuardarYContinuar = () => {
    guardarDatosEnLocalStorage();
    router.push("/proceso/editar/molino/step4");
  };

  // Botón para regresar al paso anterior (Segundo Proceso)
  const handleAtras = () => {
    guardarDatosEnLocalStorage();
    router.push("/proceso/editar/molino/step2");
  };

  // Patrón para validar formato HH:MM:SS (24 horas)
  const timePattern = "^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-4 sm:p-6">
        {/* Barra de Progreso */}
        <div className="flex items-center mb-4">
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center rounded-l-lg"></div>
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center rounded-r-lg"></div>
        </div>
        <h2 className="text-xl font-bold mb-4 text-orange-600">
          Tercer Proceso <span className="text-lg text-gray-400">[Modo Edición]</span>
        </h2>

        {/* Campos Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pesador Salida */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Pesador Salida
            </label>
            <input
              type="text"
              className="border w-full p-2 text-sm sm:text-base"
              value={pesadorSalida}
              onChange={(e) => setPesadorSalida(e.target.value)}
            />
          </div>
          {/* Báscula de Salida */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Báscula de Salida
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={basculaSalidaOptions}
              placeholder="Seleccione Báscula"
              value={basculaSalida ? { value: basculaSalida, label: basculaSalida } : null}
              onChange={(option: OptionType | null) =>
                setBasculaSalida(option ? option.value : "")
              }
            />
          </div>
        </div>

        {/* Tiempos de Báscula */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2 sm:text-base">Tiempos de Báscula</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Llegada a la Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Llegada a la Báscula
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaBascula.hora}
                  onChange={(e) =>
                    setTiempoLlegadaBascula((prev) => ({ ...prev, hora: e.target.value }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoLlegadaBascula)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoLlegadaBascula.comentarios}
                onChange={(e) =>
                  setTiempoLlegadaBascula((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
            {/* Entrada a la Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Entrada a la Báscula
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoEntradaBascula.hora}
                  onChange={(e) =>
                    setTiempoEntradaBascula((prev) => ({ ...prev, hora: e.target.value }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoEntradaBascula)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoEntradaBascula.comentarios}
                onChange={(e) =>
                  setTiempoEntradaBascula((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
            {/* Salida a la Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Salida a la Báscula
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoSalidaBascula.hora}
                  onChange={(e) =>
                    setTiempoSalidaBascula((prev) => ({ ...prev, hora: e.target.value }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoSalidaBascula)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoSalidaBascula.comentarios}
                onChange={(e) =>
                  setTiempoSalidaBascula((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Registro de Vueltas */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2 sm:text-sm">Registro de Vueltas</h3>
          <div className="text-sm sm:text-base text-gray-600 mb-2">
            <strong>NOTA:</strong> El proceso normal cuenta como la Vuelta 1.
            <br />
            Las vueltas solo se pueden editar, no agregar ni eliminar.
          </div>

          {vueltas.map((v, index) => {
            const esVuelta1 = v.numeroVuelta === 1;
            return (
              <div
                key={`${v.numeroVuelta}-${index}`}
                className="border rounded p-2 mt-2 bg-gray-50"
              >
                <label className="block font-semibold mb-2 text-sm sm:text-base">
                  <span className="text-orange-700">Vuelta {v.numeroVuelta}</span>
                </label>

                {/* Llegada al Punto */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Llegada al Punto
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.llegadaPunto.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(index, "llegadaPunto", "hora", e.target.value)
                      }
                      disabled={esVuelta1}
                    />
                    {!esVuelta1 && (
                      <button
                        className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                        onClick={() => handleSetNowSubtiempo(index, "llegadaPunto")}
                      >
                        Ahora
                      </button>
                    )}
                  </div>
                  <textarea
                    className="border w-full mt-1 p-1 text-xs sm:text-sm"
                    placeholder="Comentarios..."
                    value={v.llegadaPunto.comentarios}
                    onChange={(e) =>
                      !esVuelta1 &&
                      handleChangeVueltaTiempo(index, "llegadaPunto", "comentarios", e.target.value)
                    }
                    disabled={esVuelta1}
                  />
                </div>

                {/* Salida del Punto */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Salida del Punto
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.salidaPunto.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(index, "salidaPunto", "hora", e.target.value)
                      }
                      disabled={esVuelta1}
                    />
                    {!esVuelta1 && (
                      <button
                        className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                        onClick={() => handleSetNowSubtiempo(index, "salidaPunto")}
                      >
                        Ahora
                      </button>
                    )}
                  </div>
                  <textarea
                    className="border w-full mt-1 p-1 text-xs sm:text-sm"
                    placeholder="Comentarios..."
                    value={v.salidaPunto.comentarios}
                    onChange={(e) =>
                      !esVuelta1 &&
                      handleChangeVueltaTiempo(index, "salidaPunto", "comentarios", e.target.value)
                    }
                    disabled={esVuelta1}
                  />
                </div>

                {/* Llegada a la Báscula */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Llegada a la Báscula
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.llegadaBascula.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(index, "llegadaBascula", "hora", e.target.value)
                      }
                      disabled={esVuelta1}
                    />
                    {!esVuelta1 && (
                      <button
                        className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                        onClick={() => handleSetNowSubtiempo(index, "llegadaBascula")}
                      >
                        Ahora
                      </button>
                    )}
                  </div>
                  <textarea
                    className="border w-full mt-1 p-1 text-xs sm:text-sm"
                    placeholder="Comentarios..."
                    value={v.llegadaBascula.comentarios}
                    onChange={(e) =>
                      !esVuelta1 &&
                      handleChangeVueltaTiempo(index, "llegadaBascula", "comentarios", e.target.value)
                    }
                    disabled={esVuelta1}
                  />
                </div>

                {/* Entrada a la Báscula */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Entrada a la Báscula
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.entradaBascula.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(index, "entradaBascula", "hora", e.target.value)
                      }
                      disabled={esVuelta1}
                    />
                    {!esVuelta1 && (
                      <button
                        className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                        onClick={() => handleSetNowSubtiempo(index, "entradaBascula")}
                      >
                        Ahora
                      </button>
                    )}
                  </div>
                  <textarea
                    className="border w-full mt-1 p-1 text-xs sm:text-sm"
                    placeholder="Comentarios..."
                    value={v.entradaBascula.comentarios}
                    onChange={(e) =>
                      !esVuelta1 &&
                      handleChangeVueltaTiempo(index, "entradaBascula", "comentarios", e.target.value)
                    }
                    disabled={esVuelta1}
                  />
                </div>

                {/* Salida de la Báscula */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Salida de la Báscula
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.salidaBascula.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(index, "salidaBascula", "hora", e.target.value)
                      }
                      disabled={esVuelta1}
                    />
                    {!esVuelta1 && (
                      <button
                        className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                        onClick={() => handleSetNowSubtiempo(index, "salidaBascula")}
                      >
                        Ahora
                      </button>
                    )}
                  </div>
                  <textarea
                    className="border w-full mt-1 p-1 text-xs sm:text-sm"
                    placeholder="Comentarios..."
                    value={v.salidaBascula.comentarios}
                    onChange={(e) =>
                      !esVuelta1 &&
                      handleChangeVueltaTiempo(index, "salidaBascula", "comentarios", e.target.value)
                    }
                    disabled={esVuelta1}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
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
