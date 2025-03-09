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

// Opciones para Operador
const operadorOptions: OptionType[] = [
  { value: "NO REQUIERE", label: "NO REQUIERE" },
  { value: "ADIEL QUIÑONES", label: "ADIEL QUIÑONES" },
  { value: "ALEJANDRO CENTENO", label: "ALEJANDRO CENTENO" },
  { value: "ALEXIS MARTINEZ", label: "ALEXIS MARTINEZ" },
  { value: "ANIBAL SANCHEZ", label: "ANIBAL SANCHEZ" },
  { value: "CARLOS CABRERA", label: "CARLOS CABRERA" },
  { value: "CARLOS RIVERA", label: "CARLOS RIVERA" },
  { value: "CARLOS SIGUACHI", label: "CARLOS SIGUACHI" },
  { value: "CELVIN DIAZ", label: "CELVIN DIAZ" },
  { value: "DARWIN HERNANDEZ", label: "DARWIN HERNANDEZ" },
  { value: "EDENILSON RUIZ", label: "EDENILSON RUIZ" },
  { value: "EDGARDO GARCIA", label: "EDGARDO GARCIA" },
  { value: "EDUARDO TINO", label: "EDUARDO TINO" },
  { value: "EDWIN TESHE", label: "EDWIN TESHE" },
  { value: "ELIAS PATRIZ", label: "ELIAS PATRIZ" },
  { value: "EMERSON CAMPOS", label: "EMERSON CAMPOS" },
  { value: "FERNANDO RAMOS", label: "FERNANDO RAMOS" },
  { value: "FRANCISCO GARCIA", label: "FRANCISCO GARCIA" },
  { value: "GABRIEL MARTINEZ", label: "GABRIEL MARTINEZ" },
  { value: "IVAN GOMEZ", label: "IVAN GOMEZ" },
  { value: "JONATHAN CALDERON", label: "JONATHAN CALDERON" },
  { value: "JORGE ISIDRO", label: "JORGE ISIDRO" },
  { value: "JORGE MENDEZ", label: "JORGE MENDEZ" },
  { value: "JORGE MUYA", label: "JORGE MUYA" },
  { value: "JOSE FUENTES", label: "JOSE FUENTES" },
  { value: "JOSE GOCHEZ", label: "JOSE GOCHEZ" },
  { value: "JOSE RAMIREZ", label: "JOSE RAMIREZ" },
  { value: "JOSUE TRINIDAD", label: "JOSUE TRINIDAD" },
  { value: "JUAN PEREZ", label: "JUAN PEREZ" },
  { value: "KEVIN MARTINEZ", label: "KEVIN MARTINEZ" },
  { value: "LUIS GIRON", label: "LUIS GIRON" },
  { value: "LUIS RAMOS", label: "LUIS RAMOS" },
  { value: "MANUEL CORTEZ", label: "MANUEL CORTEZ" },
  { value: "MANUEL PEREZ", label: "MANUEL PEREZ" },
  { value: "MARVIN ECHEVERRIA", label: "MARVIN ECHEVERRIA" },
  { value: "MARVIN SANCHEZ", label: "MARVIN SANCHEZ" },
  { value: "MELVIN RUBIO", label: "MELVIN RUBIO" },
  { value: "MIGUEL CRESPIN", label: "MIGUEL CRESPIN" },
  { value: "MOISES ALVAREZ", label: "MOISES ALVAREZ" },
  { value: "RAFAEL JIMENEZ", label: "RAFAEL JIMENEZ" },
  { value: "RICARDO CLEMENTE", label: "RICARDO CLEMENTE" },
  { value: "ROBERTO CALDERON", label: "ROBERTO CALDERON" },
  { value: "TOMAS CADENA", label: "TOMAS CADENA" },
  { value: "WALDIR PINEDA", label: "WALDIR PINEDA" },
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

// ---------------------------------------
// Funciones para conversión de tiempo
// ---------------------------------------
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
// Helper para actualizar la caché de Paros (clave "parosCache")
// Ahora se incluye además la razón (razon)
const updateParosCache = (
  newInicioParo?: { hora: string },
  newFinParo?: { hora: string },
  newRazon?: string
) => {
  const existingCache = JSON.parse(
    localStorage.getItem("parosCache") || '{"inicioParo":{"hora":""},"finParo":{"hora":""},"razon":""}'
  );
  const cache = {
    inicioParo: newInicioParo ? newInicioParo : existingCache.inicioParo,
    finParo: newFinParo ? newFinParo : existingCache.finParo,
    razon: newRazon !== undefined ? newRazon : existingCache.razon,
  };
  localStorage.setItem("parosCache", JSON.stringify(cache));
};

export default function SegundoProceso() {
  const router = useRouter();

  // -------------------------------
  // ESTADOS PRINCIPALES (SIN CAMBIOS)
  // -------------------------------
  const [grupo, setGrupo] = useState("");
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

  // -------------------------------
  // ESTADOS PARA PAROS Y ESTADÍSTICAS
  // -------------------------------
  // Mientras no se presione Agregar, estos valores se guardan en caché en "parosCache"
  const [inicioParo, setInicioParo] = useState({ hora: "" });
  const [finParo, setFinParo] = useState({ hora: "" });
  const [razonParo, setRazonParo] = useState("");
  const [parosList, setParosList] = useState<any[]>([]);
  const [tiempoTotalParos, setTiempoTotalParos] = useState("00:00:00");

  // -------------------------------
  // Cargar datos de LocalStorage (envasadoProcess) y precargar caché de paros
  // -------------------------------
  useEffect(() => {
    cargarDatosDeLocalStorage();
    const cache = localStorage.getItem("parosCache");
    if (cache) {
      const parsedCache = JSON.parse(cache);
      if (parsedCache.inicioParo) setInicioParo(parsedCache.inicioParo);
      if (parsedCache.finParo) setFinParo(parsedCache.finParo);
      if (parsedCache.razon) setRazonParo(parsedCache.razon);
    }
  }, []);

  useEffect(() => {
    let totalSeconds = 0;
    parosList.forEach((paro) => {
      totalSeconds += timeStringToSeconds(paro.duracionParo);
    });
    const totalTiempo = secondsToTimeString(totalSeconds);
    setTiempoTotalParos(totalTiempo);
  }, [parosList]);

  function cargarDatosDeLocalStorage() {
    let stored = localStorage.getItem("envasadoProcess");
    if (!stored) {
      const initialData = {
        fechaInicio: new Date().toLocaleString("en-GB", { timeZone: "America/El_Salvador" }),
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
        primerProceso: {},
        segundoProceso: {
          // Estructura por defecto para paros similar a vueltas
          paros: [],
          parosStats: { totalParos: 0, tiempoTotalParos: "00:00:00" },
        },
        tercerProceso: {},
        procesoFinal: {},
      };
      localStorage.setItem("envasadoProcess", JSON.stringify(initialData));
      stored = localStorage.getItem("envasadoProcess");
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.segundoProceso) {
        const s = parsed.segundoProceso;
        setGrupo(s.grupo || "");
        setOperador(s.operador || "");
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

  // -------------------------------
  // Actualizar caché de paros (incluye razón)
  // -------------------------------
  const handleInicioParoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = { hora: e.target.value };
    setInicioParo(newVal);
    updateParosCache(newVal, undefined, undefined);
  };

  const handleFinParoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = { hora: e.target.value };
    setFinParo(newVal);
    updateParosCache(undefined, newVal, undefined);
  };

  // Actualizar razón en caché
  const handleRazonChange = (option: OptionType | null) => {
    const newRazon = option ? option.value : "";
    setRazonParo(newRazon);
    updateParosCache(undefined, undefined, newRazon);
  };

  // Botones "Ahora" para paros
  const handleAhoraInicioParo = () => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    const newVal = { hora };
    setInicioParo(newVal);
    updateParosCache(newVal, undefined, undefined);
  };

  const handleAhoraFinParo = () => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    const newVal = { hora };
    setFinParo(newVal);
    updateParosCache(undefined, newVal, undefined);
  };

  // -------------------------------
  // Agregar Paro: valida campos, usa SweetAlert para alertas individuales,
  // agrega a la lista y limpia la caché de paros.
  // -------------------------------
  const handleAgregarParo = () => {
    if (!tiempoInicioCarga.hora) {
      Swal.fire("Error", "Falta la hora de inicio de carga", "error");
      return;
    }
    if (!inicioParo.hora) {
      Swal.fire("Error", "Falta la hora de inicio del paro", "error");
      return;
    }
    if (!finParo.hora) {
      Swal.fire("Error", "Falta la hora de fin del paro", "error");
      return;
    }
    if (!razonParo) {
      Swal.fire("Error", "Falta la razón del paro", "error");
      return;
    }
    const inicioCargaSec = timeStringToSeconds(tiempoInicioCarga.hora);
    const inicioParoSec = timeStringToSeconds(inicioParo.hora);
    const finParoSec = timeStringToSeconds(finParo.hora);

    const diffCargaInicio = inicioParoSec - inicioCargaSec;
    const duracionParo = finParoSec - inicioParoSec;

    const newParo = {
      inicio: inicioParo.hora,
      fin: finParo.hora,
      razon: razonParo,
      diffCargaInicio: secondsToTimeString(diffCargaInicio >= 0 ? diffCargaInicio : 0),
      duracionParo: secondsToTimeString(duracionParo >= 0 ? duracionParo : 0),
    };

    setParosList((prev) => [...prev, newParo]);
    // Vaciar campos de paro y limpiar la caché
    setInicioParo({ hora: "" });
    setFinParo({ hora: "" });
    setRazonParo("");
    localStorage.removeItem("parosCache");
  };

  // -------------------------------
  // Eliminar Paro con confirmación
  // -------------------------------
  const handleEliminarParo = (index: number) => {
    Swal.fire({
      title: "¿Está seguro?",
      text: "¿Desea eliminar este paro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        setParosList((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };

  // -------------------------------
  // Guardar datos en envasadoProcess (incluyendo parosStats)
  // Si no se registró ningún paro, se guarda el arreglo vacío.
  // -------------------------------
  const handleGuardarYContinuar = () => {
    const stored = localStorage.getItem("envasadoProcess");
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
        paros: parosList, // Si no hay paros, se guarda como []
        parosStats,
      };
      localStorage.setItem("envasadoProcess", JSON.stringify(parsed));
    }
    router.push("/proceso/iniciar/envasado/step3");
  };

  const handleAtras = () => {
    const stored = localStorage.getItem("envasadoProcess");
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
        paros: parosList, // Si no hay paros, se guarda como []
        parosStats,
      };
      localStorage.setItem("envasadoProcess", JSON.stringify(parsed));
    }
    router.push("/proceso/iniciar/envasado");
  };

  const timePattern = "^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$";

  // ---------------------------------------
  // Helper: Asignar "Ahora" en formato HH:mm:ss (para otros campos)
  // ---------------------------------------
  const handleSetNow = (setter: Function) => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setter((prev: any) => ({ ...prev, hora }));
  };

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
        <h2 className="text-xl font-bold mb-4 text-orange-600">Segundo Proceso</h2>

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
          {/* Operador */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Operador/Electricista</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={operadorOptions}
              placeholder="Seleccione Operador"
              value={operador ? { value: operador, label: operador } : null}
              onChange={(option: OptionType | null) => setOperador(option ? option.value : "")}
            />
          </div>
          {/* Personal Asignado */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Personal Asignado</label>
            <input
              type="number"
              className="border w-full p-2 text-sm sm:text-base"
              placeholder="Ingrese la Cantidad"
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
          <div className="text-sm sm:text-base text-orange-600 mb-2">
            <strong>NOTA:</strong> Si no requiere ingresar 6 dígitos de 0.
          </div>
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

        {/* SECCIÓN DE PAROS (estilo de la imagen) */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Registrar Paro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Hora de Inicio del Paro */}
            <div className="flex flex-col border rounded p-3">
              <label className="block font-semibold text-sm sm:text-base">Hora de Inicio del Paro</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base rounded"
                  value={inicioParo.hora}
                  onChange={handleInicioParoChange}
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={handleAhoraInicioParo}
                >
                  Ahora
                </button>
              </div>
            </div>
            {/* Hora de Fin del Paro */}
            <div className="flex flex-col border rounded p-3">
              <label className="block font-semibold text-sm sm:text-base">Hora de Fin del Paro</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base rounded"
                  value={finParo.hora}
                  onChange={handleFinParoChange}
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={handleAhoraFinParo}
                >
                  Ahora
                </button>
              </div>
            </div>
          </div>
          {/* Seleccionar Razón del Paro */}
          <div className="mb-4">
            <label className="block font-semibold text-sm sm:text-base mb-1">Razón del Paro</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={razonesParoOptions}
              placeholder="Seleccione la razón"
              value={razonParo ? { value: razonParo, label: razonParo } : null}
              onChange={handleRazonChange}
            />
          </div>
          <div className="flex justify-center">
            <button
              className="bg-orange-500 text-white px-4 py-1 rounded text-sm sm:text-base"
              onClick={handleAgregarParo}
            >
              + Agregar Paro
            </button>
          </div>
        </div>

        {/* LISTA DE PAROS REGISTRADOS */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <h3 className="text-lg font-semibold mb-2 sm:mb-0">Paros Registrados</h3>
            <div className="text-sm sm:text-base">
              <span className="font-semibold">Total:</span> {parosList.length} &nbsp;|&nbsp;
              <span className="font-semibold">Tiempo Total:</span> {tiempoTotalParos}
            </div>
          </div>
          {parosList.length === 0 ? (
            <div className="text-gray-500 text-sm">No hay paros registrados.</div>
          ) : (
            <div className="space-y-2">
              {parosList.map((paro, index) => (
                <div key={index} className="border rounded p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm sm:text-base">
                    <div>
                      <span className="font-semibold">Inicio:</span>{" "}
                      {typeof paro.inicio === "object" ? paro.inicio.hora : paro.inicio}{" "}
                      <span className="font-semibold">Fin:</span>{" "}
                      {typeof paro.fin === "object" ? paro.fin.hora : paro.fin}
                    </div>
                    <div>
                      <span className="font-semibold">Razón:</span> {paro.razon}
                    </div>
                    <div>
                      <span className="font-semibold">Duración:</span> {paro.duracionParo}{" "}
                      <span className="font-semibold">Desde Inicio de Carga:</span> {paro.diffCargaInicio}
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <button
                      onClick={() => handleEliminarParo(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
