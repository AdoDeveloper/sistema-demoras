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

const enlonadorOptions: OptionType[] = [
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
  { value: "WALDIR PINEDA", label: "WALDIR PINEDA" }
];

const modeloEquipoOptions: OptionType[] = [
  { value: "NO REQUIERE", label: "NO REQUIERE" },
  { value: "J", label: "J" },
  { value: "K", label: "K" },
];

// Función para aplicar máscara de tiempo (HH:MM:SS)
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

// Helper para asignar la fecha actual (formato YYYY-MM-DD)
const handleSetNowDate = (setter: Function) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const fecha = `${year}-${month}-${day}`;
  setter((prev: any) => ({ ...prev, fecha }));
};

export default function SegundoProceso() {
  const router = useRouter();

  // Estados para campos principales
  const [enlonador, setEnlonador] = useState("");
  const [operador, setOperador] = useState("");
  const [personalAsignado, setPersonalAsignado] = useState("");
  const [personalAsignadoObservaciones, setPersonalAsignadoObservaciones] = useState("");
  const [modeloEquipo, setModeloEquipo] = useState("NO REQUIERE");

  // Estados para los tiempos (cada uno es un objeto { hora, comentarios })
  const [tiempoLlegadaPunto, setTiempoLlegadaPunto] = useState({ hora: "", comentarios: "" });
  const [tiempoLlegadaOperador, setTiempoLlegadaOperador] = useState({ hora: "", comentarios: "" });
  const [tiempoLlegadaEnlonador, setTiempoLlegadaEnlonador] = useState({ hora: "", comentarios: "" });
  const [tiempoLlegadaEquipo, setTiempoLlegadaEquipo] = useState({ hora: "", comentarios: "" });
  const [tiempoInicioCarga, setTiempoInicioCarga] = useState({ hora: "", comentarios: "" });
  const [tiempoTerminaCarga, setTiempoTerminaCarga] = useState({ hora: "", comentarios: "" });
  const [tiempoSalidaPunto, setTiempoSalidaPunto] = useState({ hora: "", comentarios: "" });

  // ---------------------------------------
  // useEffect: Cargar o crear la estructura de "editDemora" en el storage y extraer el segundo proceso
  // ---------------------------------------
  useEffect(() => {
    cargarDatosDeLocalStorage();
  }, []);

  function cargarDatosDeLocalStorage() {
    let stored = localStorage.getItem("editDemora");
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
      localStorage.setItem("editDemora", JSON.stringify(initialData));
      stored = localStorage.getItem("editDemora");
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.segundoProceso) {
        const s = parsed.segundoProceso;
        setEnlonador(s.enlonador || "");
        setOperador(s.operador || "");
        setPersonalAsignado(s.personalAsignado || "");
        setPersonalAsignadoObservaciones(s.personalAsignadoObservaciones || "");
        setModeloEquipo(s.modeloEquipo || "NO REQUIERE");

        setTiempoLlegadaPunto(s.tiempoLlegadaPunto || { hora: "", comentarios: "" });
        setTiempoLlegadaOperador(s.tiempoLlegadaOperador || { hora: "", comentarios: "" });
        setTiempoLlegadaEnlonador(s.tiempoLlegadaEnlonador || { hora: "", comentarios: "" });
        setTiempoLlegadaEquipo(s.tiempoLlegadaEquipo || { hora: "", comentarios: "" });
        setTiempoInicioCarga(s.tiempoInicioCarga || { hora: "", comentarios: "" });
        setTiempoTerminaCarga(s.tiempoTerminaCarga || { hora: "", comentarios: "" });
        setTiempoSalidaPunto(s.tiempoSalidaPunto || { hora: "", comentarios: "" });
      }
    }
  }

  // ---------------------------------------
  // Helper: Asignar "Ahora" (HH:mm:ss) a un campo de tiempo
  // ---------------------------------------
  const handleSetNow = (setter: Function) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const hora = `${hh}:${mm}:${ss}`;
    setter((prev: any) => ({ ...prev, hora }));
  };

  // ---------------------------------------
  // Guardar los cambios en la propiedad segundoProceso de "editDemora" y continuar al siguiente paso
  // ---------------------------------------
  const handleGuardarYContinuar = () => {
    let stored = localStorage.getItem("editDemora");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.segundoProceso = {
        enlonador,
        operador,
        personalAsignado,
        personalAsignadoObservaciones,
        modeloEquipo,
        tiempoLlegadaPunto,
        tiempoLlegadaOperador,
        tiempoLlegadaEnlonador,
        tiempoLlegadaEquipo,
        tiempoInicioCarga,
        tiempoTerminaCarga,
        tiempoSalidaPunto,
      };
      localStorage.setItem("editDemora", JSON.stringify(parsed));
    }
    router.push("/proceso/editar/granel/step3");
  };

  // ---------------------------------------
  // Botón "Anterior": guardar cambios y regresar al primer proceso
  // ---------------------------------------
  const handleAtras = () => {
    let stored = localStorage.getItem("editDemora");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.segundoProceso = {
        enlonador,
        operador,
        personalAsignado,
        personalAsignadoObservaciones,
        modeloEquipo,
        tiempoLlegadaPunto,
        tiempoLlegadaOperador,
        tiempoLlegadaEnlonador,
        tiempoLlegadaEquipo,
        tiempoInicioCarga,
        tiempoTerminaCarga,
        tiempoSalidaPunto,
      };
      localStorage.setItem("editDemora", JSON.stringify(parsed));
    }
    router.push("/proceso/editar/granel"); // Regresa al primer proceso
  };

  // Patrón para validar formato HH:MM:SS (24 horas)
  const timePattern = "^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$";

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

        {/* Campos Principales */}
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

          {/* Operador/Electricista */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Operador/Electricista</label>
            <input
              type="text"
              className="border w-full p-2 text-sm sm:text-base"
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
              placeholder="Ingrese la Cantidad"
              value={personalAsignado}
              onChange={(e) => setPersonalAsignado(e.target.value)}
            />
          </div>

          {/* Observaciones */}
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
              onChange={(option: OptionType | null) =>
                setModeloEquipo(option ? option.value : "")
              }
            />
          </div>
        </div>

        {/* Tiempos */}
        <div className="mt-6">
          <h3 className="font-bold text-xl mb-2 sm:text-sm">Tiempos</h3>
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

            {/* Llegada del Operador/Electricista */}
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

            {/* Llegada del Enlonador */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Llegada del Enlonador</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  pattern={timePattern}
                  placeholder="HH:MM:SS"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaEnlonador.hora}
                  onChange={(e) => handleTimeInputChange(e, setTiempoLlegadaEnlonador)}
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
                  setTiempoLlegadaEnlonador((prev) => ({ ...prev, comentarios: e.target.value }))
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
