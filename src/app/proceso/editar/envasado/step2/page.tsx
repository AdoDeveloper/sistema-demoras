"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";

// Importar react-select de forma dinámica para evitar problemas de SSR/hidratación
const Select = dynamic(() => import("react-select"), { ssr: false });

// Definición del tipo de opción para react-select
interface OptionType {
  value: string;
  label: string;
}

// Opciones para Grupo
const grupoOptions: OptionType[] = [
  { value: "NO REQUIERE", label: "NO REQUIERE" },
  { value: "GRUPO 1", label: "GRUPO 1" },
  { value: "GRUPO 2", label: "GRUPO 2" },
  { value: "GRUPO 3", label: "GRUPO 3" },
  { value: "GRUPO 4", label: "GRUPO 4" },
];

// Opciones para Modelo de Equipo
const modeloEquipoOptions: OptionType[] = [
  { value: "NO REQUIERE", label: "NO REQUIERE" },
  { value: "J", label: "J" },
  { value: "K", label: "K" },
];

// Opciones para Razón de Paro
const razonesParoOptions: OptionType[] = [
  { value: "Cabaleo de peso", label: "Cabaleo de peso" },
  { value: "Corte de energía eléctrica", label: "Corte de energía eléctrica" },
  { value: "Esperando auditor para programar básculas", label: "Esperando auditor para programar básculas" },
  { value: "Falla de costuradora de sacos", label: "Falla de costuradora de sacos" },
  { value: "Falla en banda transportadora de sacos", label: "Falla en banda transportadora de sacos" },
  { value: "Falla en básculas pesasacos", label: "Falla en básculas pesasacos" },
  { value: "Falla en sistema de despacho", label: "Falla en sistema de despacho" },
  { value: "Falla mecánica en la unidad de carga", label: "Falla mecánica en la unidad de carga" },
  { value: "Falta de equipo frontal por despachos a granel", label: "Falta de equipo frontal por despachos a granel" },
  { value: "Falta de equipo frontal por tráfico y carga en el mismo punto de carga", label: "Falta de equipo frontal por tráfico y carga en el mismo punto de carga" },
  { value: "Limpieza de sistema", label: "Limpieza de sistema" },
  { value: "Limpieza en tolva", label: "Limpieza en tolva" },
  { value: "Lluvia", label: "Lluvia" },
  { value: "Media hora de comida", label: "Media hora de comida" },
  { value: "Movimiento de tolva a otro punto de carga", label: "Movimiento de tolva a otro punto de carga" },
  { value: "Revisión de sacos previo al despacho", label: "Revisión de sacos previo al despacho" },
  { value: "Solo dos cargadores", label: "Solo dos cargadores" },
  { value: "Solo dos operadores con equipo para todos los despachos", label: "Solo dos operadores con equipo para todos los despachos" },
  { value: "Solo un equipo frontal y tráfico de unidades", label: "Solo un equipo frontal y tráfico de unidades" },
  { value: "Solo un operador con equipo para todos los despachos", label: "Solo un operador con equipo para todos los despachos" },
  { value: "Tráfico congestionado", label: "Tráfico congestionado" },
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
// Estados para el Segundo Proceso
// ---------------------------------------
export default function SegundoProceso() {
  const router = useRouter();

  useEffect(() => {
    // Interceptar navegación atrás y recargas para confirmar cancelación
    window.history.pushState(null, "", window.location.href);
    const handlePopState = (event) => {
      Swal.fire({
        title: "¿Está seguro?",
        text: "Debe cancelar para salir. Se perderán los cambios realizados.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "No, continuar",
      }).then((result) => {
        if (result.isConfirmed) {
          window.removeEventListener("popstate", handlePopState);
          localStorage.removeItem("envasadoProcess");
          router.push("/proceso/iniciar");
        } else {
          window.history.pushState(null, "", window.location.href);
        }
      });
    };
    window.addEventListener("popstate", handlePopState);
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router]);

  // Estados principales
  const [grupo, setGrupo] = useState("");
  // OPERADOR se muestra ahora como input de texto
  const [operador, setOperador] = useState("");
  const [personalAsignado, setPersonalAsignado] = useState("");
  const [personalAsignadoObservaciones, setPersonalAsignadoObservaciones] = useState("");
  const [modeloEquipo, setModeloEquipo] = useState("NO REQUIERE");

  const [tiempoLlegadaPunto, setTiempoLlegadaPunto] = useState({ hora: "", comentarios: "" });
  const [tiempoLlegadaOperador, setTiempoLlegadaOperador] = useState({ hora: "", comentarios: "" });
  const [tiempoLlegadaGrupo, setTiempoLlegadaGrupo] = useState({ hora: "", comentarios: "" });
  const [tiempoLlegadaEquipo, setTiempoLlegadaEquipo] = useState({ hora: "", comentarios: "" });
  const [tiempoInicioCarga, setTiempoInicioCarga] = useState({ hora: "", comentarios: "" });
  const [tiempoTerminaCarga, setTiempoTerminaCarga] = useState({ hora: "", comentarios: "" });
  const [tiempoSalidaPunto, setTiempoSalidaPunto] = useState({ hora: "", comentarios: "" });

  // Estados para Paros (en edición: no se permite agregar ni eliminar, solo actualizar)
  const [parosList, setParosList] = useState<any[]>([]);
  const [tiempoTotalParos, setTiempoTotalParos] = useState("00:00:00");

  // Cargar datos desde localStorage ("editEnvasado") y precargar paros de segundoProceso
  useEffect(() => {
    cargarDatosDeLocalStorage();
  }, []);

  function cargarDatosDeLocalStorage() {
    const stored = localStorage.getItem("editEnvasado");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.segundoProceso) {
        const s = parsed.segundoProceso;
        setGrupo(s.grupo || "");
        setOperador(s.operador || ""); // ahora es texto
        setPersonalAsignado(s.personalAsignado || "");
        setPersonalAsignadoObservaciones(s.personalAsignadoObservaciones || "");
        setModeloEquipo(s.modeloEquipo || "NO REQUIERE");

        setTiempoLlegadaPunto(s.tiempoLlegadaPunto || { hora: "", comentarios: "" });
        setTiempoLlegadaOperador(s.tiempoLlegadaOperador || { hora: "", comentarios: "" });
        setTiempoLlegadaGrupo(s.tiempoLlegadaGrupo || { hora: "", comentarios: "" });
        setTiempoLlegadaEquipo(s.tiempoLlegadaEquipo || { hora: "", comentarios: "" });
        setTiempoInicioCarga(s.tiempoInicioCarga || { hora: "", comentarios: "" });
        setTiempoTerminaCarga(s.tiempoTerminaCarga || { hora: "", comentarios: "" });
        setTiempoSalidaPunto(s.tiempoSalidaPunto || { hora: "", comentarios: "" });
        setParosList(s.paros || []);
      }
    }
  }

  // Función para actualizar un campo de un paro en parosList
  const handleParoChange = (index: number, field: "inicio" | "fin" | "razon", value: string) => {
    setParosList((prev) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  // Nueva función para asignar la hora actual a un campo de un paro (Inicio o Fin)
  const handleSetNowParo = (index: number, field: "inicio" | "fin") => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setParosList((prev) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: hora };
      return newList;
    });
  };

  // Botón para actualizar (recalcular) los paros editados y actualizar la caché en "editEnvasado"
  const handleActualizarParos = () => {
    if (!tiempoInicioCarga.hora) {
      Swal.fire("Error", "Debe tener la hora de inicio de carga para recalcular paros.", "error");
      return;
    }
    const inicioCargaSec = timeStringToSeconds(tiempoInicioCarga.hora);
    const updatedParos = parosList.map((paro) => {
      const inicioSec = timeStringToSeconds(paro.inicio);
      const finSec = timeStringToSeconds(paro.fin);
      return {
        ...paro,
        diffCargaInicio: secondsToTimeString(inicioSec - inicioCargaSec >= 0 ? inicioSec - inicioCargaSec : 0),
        duracionParo: secondsToTimeString(finSec - inicioSec >= 0 ? finSec - inicioSec : 0),
      };
    });
    setParosList(updatedParos);
    // Actualizar la caché en "editEnvasado"
    const stored = localStorage.getItem("editEnvasado");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.segundoProceso.paros = updatedParos;
      localStorage.setItem("editEnvasado", JSON.stringify(parsed));
    }
    Swal.fire("Actualizado", "Los paros han sido actualizados en la caché.", "success");
  };

  // Botón Guardar y Continuar: guardar la información actualizada en "editEnvasado"
  const handleGuardarYContinuar = () => {
    const stored = localStorage.getItem("editEnvasado");
    const parosStats = {
      totalParos: parosList.length,
      tiempoTotalParos: parosList.length > 0 ? tiempoTotalParos : "00:00:00",
    };
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.segundoProceso = {
        grupo,
        operador,
        personalAsignado,
        personalAsignadoObservaciones,
        modeloEquipo,
        tiempoLlegadaPunto,
        tiempoLlegadaOperador,
        tiempoLlegadaGrupo,
        tiempoLlegadaEquipo,
        tiempoInicioCarga,
        tiempoTerminaCarga,
        tiempoSalidaPunto,
        paros: parosList,
        parosStats,
      };
      localStorage.setItem("editEnvasado", JSON.stringify(parsed));
    }
    router.push("/proceso/editar/envasado/step3");
  };

  const handleAtras = () => {
    const stored = localStorage.getItem("editEnvasado");
    const parosStats = {
      totalParos: parosList.length,
      tiempoTotalParos: parosList.length > 0 ? tiempoTotalParos : "00:00:00",
    };
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.segundoProceso = {
        grupo,
        operador,
        personalAsignado,
        personalAsignadoObservaciones,
        modeloEquipo,
        tiempoLlegadaPunto,
        tiempoLlegadaOperador,
        tiempoLlegadaGrupo,
        tiempoLlegadaEquipo,
        tiempoInicioCarga,
        tiempoTerminaCarga,
        tiempoSalidaPunto,
        paros: parosList,
        parosStats,
      };
      localStorage.setItem("editEnvasado", JSON.stringify(parsed));
    }
    router.push("/proceso/editar/envasado");
  };

  const timePattern = "^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$";

  // Helper: Asignar "Ahora" en formato HH:mm:ss para otros campos
  const handleSetNow = (setter: Function) => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setter((prev: any) => ({ ...prev, hora }));
  };

  // Calcular tiempo total de paros (cada vez que parosList cambia)
  useEffect(() => {
    let totalSeconds = 0;
    parosList.forEach((paro) => {
      totalSeconds += timeStringToSeconds(paro.duracionParo || "00:00:00");
    });
    setTiempoTotalParos(secondsToTimeString(totalSeconds));
  }, [parosList]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6">
        {/* Barra de Progreso */}
        <div className="flex items-center mb-4">
          <div className="flex-1 bg-orange-500 py-2 px-4 rounded-l-lg"></div>
          <div className="flex-1 bg-orange-500 py-2 px-4"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center rounded-r-lg"></div>
        </div>
        <h2 className="text-xl font-bold mb-4 text-orange-600">
          Segundo Proceso <span className="text-lg text-gray-400">[Modo Edicion]</span>
        </h2>

        {/* CAMPOS PRINCIPALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Grupo */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Grupo</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={grupoOptions}
              placeholder="Seleccione Grupo"
              value={grupo ? { value: grupo, label: grupo } : null}
              onChange={(option: OptionType | null) => setGrupo(option ? option.value : "")}
            />
          </div>
          {/* Operador - ahora como input de texto */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Operador/Electricista</label>
            <input
              type="text"
              className="border w-full p-2 text-sm sm:text-base"
              placeholder="Ingrese el operador"
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
            />
          </div>
          {/* Personal Asignado */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Personal Asignado</label>
            <input
              type="number"
              className="border w-full p-2 text-sm sm:text-base"
              placeholder="Ingrese la cantidad"
              value={personalAsignado}
              onChange={(e) => setPersonalAsignado(e.target.value)}
            />
          </div>
          {/* Observaciones Personal Asignado */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Observaciones Personal Asignado</label>
            <textarea
              className="border w-full p-2 text-sm sm:text-base"
              placeholder="Observaciones..."
              value={personalAsignadoObservaciones}
              onChange={(e) => setPersonalAsignadoObservaciones(e.target.value)}
            />
          </div>
          {/* Modelo de Equipo */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Modelo de Equipo</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={modeloEquipoOptions}
              placeholder="Seleccione Modelo"
              value={modeloEquipo ? { value: modeloEquipo, label: modeloEquipo } : null}
              onChange={(option: OptionType | null) => setModeloEquipo(option ? option.value : "")}
            />
          </div>
        </div>

        {/* TIEMPOS */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2 sm:text-sm">Tiempos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Llegada al Punto */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Llegada al Punto</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaPunto.hora}
                  onChange={(e) =>
                    setTiempoLlegadaPunto((prev) => ({ ...prev, hora: e.target.value }))
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
                  setTiempoLlegadaPunto((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
            {/* Llegada del Operador */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Llegada del Operador/Electricista</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  pattern={timePattern}
                  placeholder="HH:MM:SS"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaOperador.hora}
                  onChange={(e) => handleTimeInputChange(e, setTiempoLlegadaOperador)}
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
                  setTiempoLlegadaOperador((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
            {/* Llegada del Grupo */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Llegada del Grupo</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  pattern={timePattern}
                  placeholder="HH:MM:SS"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaGrupo.hora}
                  onChange={(e) => handleTimeInputChange(e, setTiempoLlegadaGrupo)}
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoLlegadaGrupo)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoLlegadaGrupo.comentarios}
                onChange={(e) =>
                  setTiempoLlegadaGrupo((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
            {/* Llegada del Equipo */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Llegada del Equipo</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  pattern={timePattern}
                  placeholder="HH:MM:SS"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaEquipo.hora}
                  onChange={(e) => handleTimeInputChange(e, setTiempoLlegadaEquipo)}
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
                  setTiempoLlegadaEquipo((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
            {/* Inicio de Carga */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Inicio de Carga</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoInicioCarga.hora}
                  onChange={(e) =>
                    setTiempoInicioCarga((prev) => ({ ...prev, hora: e.target.value }))
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
                  setTiempoInicioCarga((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
            {/* Termina Carga */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Termina Carga</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoTerminaCarga.hora}
                  onChange={(e) =>
                    setTiempoTerminaCarga((prev) => ({ ...prev, hora: e.target.value }))
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
                  setTiempoTerminaCarga((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
            {/* Salida del Punto */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Salida del Punto</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoSalidaPunto.hora}
                  onChange={(e) =>
                    setTiempoSalidaPunto((prev) => ({ ...prev, hora: e.target.value }))
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
                  setTiempoSalidaPunto((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN DE PAROS - Edición (solo actualizar, no agregar ni eliminar) */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Editar Paros Registrados</h3>
          {parosList.length === 0 ? (
            <div className="text-gray-500 text-sm">No hay paros registrados.</div>
          ) : (
            <div className="space-y-4">
              {parosList.map((paro, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Inicio del Paro */}
                    <div>
                      <label className="block font-semibold text-sm">Inicio</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="time"
                          step="1"
                          className="border p-1 w-full text-sm"
                          value={paro.inicio}
                          onChange={(e) => handleParoChange(index, "inicio", e.target.value)}
                        />
                        <button
                          className="bg-orange-500 text-white px-3 rounded text-sm"
                          onClick={() => handleSetNowParo(index, "inicio")}
                        >
                          Ahora
                        </button>
                      </div>
                    </div>
                    {/* Fin del Paro */}
                    <div>
                      <label className="block font-semibold text-sm">Fin</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="time"
                          step="1"
                          className="border p-1 w-full text-sm"
                          value={paro.fin}
                          onChange={(e) => handleParoChange(index, "fin", e.target.value)}
                        />
                        <button
                          className="bg-orange-500 text-white px-3 rounded text-sm"
                          onClick={() => handleSetNowParo(index, "fin")}
                        >
                          Ahora
                        </button>
                      </div>
                    </div>
                    {/* Razón del Paro */}
                    <div>
                      <label className="block font-semibold text-sm">Razón</label>
                      <Select
                        className="react-select-container"
                        classNamePrefix="react-select"
                        options={razonesParoOptions}
                        placeholder="Seleccione Razón"
                        value={paro.razon ? { value: paro.razon, label: paro.razon } : null}
                        onChange={(option: OptionType | null) =>
                          handleParoChange(index, "razon", option ? option.value : "")
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-semibold">Duración:</span> {paro.duracionParo || "00:00:00"}{" "}
                    <span className="font-semibold">Desde Inicio de Carga:</span> {paro.diffCargaInicio || "00:00:00"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Botón para actualizar los paros editados y guardarlos en la caché */}
          <div className="flex justify-center mt-4">
            <button
              className="bg-orange-500 text-white px-4 py-2 rounded text-sm"
              onClick={handleActualizarParos}
            >
              Actualizar Paros
            </button>
          </div>
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="mt-6 flex justify-between">
          <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={handleAtras}>
            Anterior
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleGuardarYContinuar}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
