"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";

// Importar react-select de forma dinámica para evitar problemas de SSR/hidratación
const Select = dynamic(() => import("react-select"), { ssr: false });

// Definición del tipo de opción para react-select
interface OptionType {
  value: string;
  label: string;
}

// Opciones para los selects
const porteriaOptions: OptionType[] = [
  { value: "Porteria 1", label: "Porteria 1" },
  { value: "Porteria 2", label: "Porteria 2" },
  { value: "Porteria 3", label: "Porteria 3" },
  { value: "Porteria 4", label: "Porteria 4" },
  { value: "Porteria 5", label: "Porteria 5" },
  { value: "Porteria 6", label: "Porteria 6" },
];

export default function ProcesoFinal() {
  const router = useRouter();

  // Estados de campos en la pantalla final según el esquema
  const [tiempoLlegadaPorteria, setTiempoLlegadaPorteria] = useState({
    hora: "",
    comentarios: "",
  });
  const [tiempoSalidaPlanta, setTiempoSalidaPlanta] = useState({
    hora: "",
    comentarios: "",
  });
  const [porteriaSalida, setPorteriaSalida] = useState("");

  // Almacenará toda la información (resumen) de "demorasProcess"
  const [dataResumen, setDataResumen] = useState<any>(null);

  // Estado para almacenar el resumen de tiempos calculado
  const [timeSummary, setTimeSummary] = useState<{
    autorizacion: string;
    salidaPlanta: string;
    total: string;
  } | null>(null);

  // Control de acordeones
  const [accordionOpen, setAccordionOpen] = useState({
    primerProceso: false,
    segundoProceso: false,
    tercerProceso: false,
    procesoFinal: false,
  });

  // Función para formatear un tiempo (en milisegundos) a "HH:mm:ss"
  const formatTime = (millis: number): string => {
    if (millis < 0) return "00:00:00";
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Al montar, cargar datos de localStorage
  useEffect(() => {
    cargarDatosDeLocalStorage();
  }, []);

  // Función para cargar la info de localStorage
  function cargarDatosDeLocalStorage() {
    let stored = localStorage.getItem("demorasProcess");
    if (!stored) {
      const initialData = {
        fechaInicio: new Date().toLocaleString("en-GB", {timeZone: "America/El_Salvador"}),
        userId:localStorage.getItem("userId"),
        userName:localStorage.getItem("userName"),
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
      setDataResumen(parsed);
      if (parsed.procesoFinal) {
        setTiempoLlegadaPorteria(
          parsed.procesoFinal.tiempoLlegadaPorteria || { hora: "", comentarios: "" }
        );
        setTiempoSalidaPlanta(
          parsed.procesoFinal.tiempoSalidaPlanta || { hora: "", comentarios: "" }
        );
        setPorteriaSalida(parsed.procesoFinal.porteriaSalida || "");
      }
      if (parsed.tiempoTotal) {
        setTimeSummary({
          autorizacion: parsed.primerProceso?.tiempoAutorizacion?.hora || "",
          salidaPlanta: parsed.procesoFinal?.tiempoSalidaPlanta?.hora || "",
          total: parsed.tiempoTotal,
        });
      }
    }
  }

  // Helper para setear la hora actual
  const handleSetNow = (setter) => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setter((prev) => ({ ...prev, hora }));
  };

  // Función para parsear una hora
  const parserHora = (campo) => {
    if (!campo?.hora) return null;
    try {
      const now = new Date();
      const [hh, mm, ss] = campo.hora.split(":").map(Number);
      now.setHours(hh, mm, ss || 0);
      return now;
    } catch {
      return null;
    }
  };

  // Función para parsear fecha y hora
  const parserFechaHora = (campo) => {
    if (!campo?.fecha || !campo?.hora) return null;
    try {
      const [year, month, day] = campo.fecha.split("-").map(Number);
      const [hh, mm, ss] = campo.hora.split(":").map(Number);
      return new Date(year, month - 1, day, hh, mm, ss || 0);
    } catch {
      return null;
    }
  };

  // Botón "Guardar"
  const handleGuardarLocal = () => {
    const stored = localStorage.getItem("demorasProcess");
    if (!stored) {
      Swal.fire("Error", "No se encontró demorasProcess en localStorage", "error");
      return;
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      Swal.fire("Error", "Datos en cache inválidos.", "error");
      return;
    }
    parsed.procesoFinal = {
      tiempoLlegadaPorteria,
      tiempoSalidaPlanta,
      porteriaSalida,
    };
    const primerProceso = parsed.primerProceso;
    const autorizacionDate = primerProceso.tiempoAutorizacion
      ? parserFechaHora(primerProceso.tiempoAutorizacion)
      : null;
    const salidaDate = parserHora(tiempoSalidaPlanta);
    let tiempoTotal = "";
    if (autorizacionDate && salidaDate) {
      const diffMillis = salidaDate.getTime() - autorizacionDate.getTime();
      tiempoTotal = formatTime(diffMillis);
    }
    parsed.tiempoTotal = tiempoTotal;
    localStorage.setItem("demorasProcess", JSON.stringify(parsed));
    if (primerProceso.tiempoAutorizacion && primerProceso.tiempoAutorizacion.hora) {
      setTimeSummary({
        autorizacion: primerProceso.tiempoAutorizacion.hora,
        salidaPlanta: tiempoSalidaPlanta.hora,
        total: tiempoTotal,
      });
    }
    cargarDatosDeLocalStorage();
    Swal.fire(
      "Guardado",
      `Los datos finales se han guardado en cache. Tiempo Total: ${tiempoTotal || "No calculado"}`,
      "success"
    );
  };

  // Validación de procesos
  function validarTodosLosProcesos() {
    if (!dataResumen) {
      return "No se encontraron datos en caché.";
    }
    const { primerProceso, segundoProceso, tercerProceso } = dataResumen;
    if (!primerProceso || !primerProceso.numeroTransaccion) {
      return "El Primer Proceso está incompleto o faltan campos obligatorios.";
    }
    if (!segundoProceso || !segundoProceso.enlonador || !segundoProceso.operador) {
      return "El Segundo Proceso está incompleto o faltan campos obligatorios.";
    }
    if (!tercerProceso || !tercerProceso.pesadorSalida || !tercerProceso.vueltas) {
      return "El Tercer Proceso está incompleto o faltan campos obligatorios.";
    }
    if (!tiempoLlegadaPorteria.hora || !tiempoSalidaPlanta.hora || !porteriaSalida) {
      return "Faltan datos de Llegada Portería, Portería Salida o Salida Planta.";
    }
    if (!primerProceso.tiempoAutorizacion || !primerProceso.tiempoAutorizacion.hora) {
      return "Falta el dato de Autorización en el Primer Proceso.";
    }
    return "";
  }

  // Botón "Enviar" con debug
  const handleEnviar = async () => {
    const errorProceso = validarTodosLosProcesos();
    if (errorProceso) {
      Swal.fire("Incompleto", errorProceso, "warning");
      return;
    }
    const confirmResult = await Swal.fire({
      title: "¿Enviar los datos?",
      text: "Se procederá a guardar la información definitivamente.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
    });
    if (confirmResult.isConfirmed) {
      Swal.fire({
        title: "Enviando datos...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      try {
        const stored = localStorage.getItem("demorasProcess");
        if (!stored) {
          Swal.close();
          Swal.fire("Error", "No se encontró demorasProcess en localStorage", "error");
          return;
        }
        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== "object") {
          Swal.close();
          Swal.fire("Error", "Datos en cache inválidos.", "error");
          return;
        }
        parsed.procesoFinal = {
          tiempoLlegadaPorteria,
          tiempoSalidaPlanta,
          porteriaSalida,
        };
        const primerProceso = parsed.primerProceso;
        const autorizacionDate = primerProceso.tiempoAutorizacion
          ? parserFechaHora(primerProceso.tiempoAutorizacion)
          : null;
        const salidaDate = parserHora(tiempoSalidaPlanta);
        let tiempoTotal = "";
        if (autorizacionDate && salidaDate) {
          const diffMillis = salidaDate.getTime() - autorizacionDate.getTime();
          tiempoTotal = formatTime(diffMillis);
        }
        parsed.tiempoTotal = tiempoTotal;
        localStorage.setItem("demorasProcess", JSON.stringify(parsed));

        // Debug: imprimir el payload a enviar
        console.log("Payload a enviar:", JSON.stringify({ demorasProcess: parsed }, null, 2));
        // debugger; // Descomenta para pausar el código y depurar

        const res = await fetch("/api/demoras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ demorasProcess: parsed }),
        });
        Swal.close();
        if (res.ok) {
          localStorage.removeItem("demorasProcess");
          Swal.fire("Enviado", "Datos enviados y guardados correctamente.", "success").then(() => {
            router.push("/");
          });
        } else {
          const errorResponse = await res.text();
          console.error("Error de respuesta:", errorResponse);
          try {
            const errorObj = JSON.parse(errorResponse);
            Swal.fire("Error", `Error al guardar en DB: ${errorObj.error || "Desconocido"}`, "error");
          } catch {
            Swal.fire("Error", "Error al guardar en DB: Respuesta inesperada.", "error");
          }
        }
      } catch (err) {
        console.error("Error en handleEnviar:", err);
        Swal.close();
        Swal.fire("Error", "Error de conexión al guardar los datos.", "error");
      }
    }
  };

  // Botón "Anterior"
  const handleAtras = () => {
    router.push("/proceso/iniciar/step3");
  };

  // Toggles de acordeón
  const toggleAccordion = (section) => {
    setAccordionOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Render de cada sección en acordeón
  function renderResumenAcordeon() {
    if (!dataResumen) {
      return <p className="text-gray-500">No se encontraron datos en caché.</p>;
    }
    const { fechaInicio, primerProceso = {}, segundoProceso = {}, tercerProceso = {}, procesoFinal = {} } = dataResumen;
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
          <strong className="text-blue-700">Fecha de Inicio:</strong>
          <span className="ml-2 text-blue-800">{fechaInicio || "N/A"}</span>
        </div>
        {timeSummary && (
          <div className="mt-2 p-3 border rounded">
            <p className="font-semibold">Resumen de Tiempos:</p>
            <p className="text-blue-600">
              Hora Autorización: <span>{timeSummary.autorizacion}</span>
            </p>
            <p className="text-green-600">
              Hora Salida Planta: <span>{timeSummary.salidaPlanta}</span>
            </p>
            <p className="text-red-600">
              Tiempo Total: <span>{timeSummary.total}</span>
            </p>
          </div>
        )}
        {/* Sección Primer Proceso */}
        <div className="border rounded">
          <button
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between transition-colors"
            onClick={() => toggleAccordion("primerProceso")}
          >
            <span className="font-semibold text-gray-700">Primer Proceso</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${accordionOpen.primerProceso ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {accordionOpen.primerProceso && (
            <div className="px-4 py-3 space-y-2 bg-white transition-all duration-300 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>N°Transaccion:</strong> {primerProceso.numeroTransaccion || "N/A"}
                </div>
                <div>
                  <strong>Portería:</strong> {primerProceso.porteriaEntrada || "N/A"}
                </div>
                <div>
                  <strong>Pesador:</strong> {primerProceso.pesadorEntrada || "N/A"}
                </div>
                <div>
                  <strong>Punto Despacho:</strong> {primerProceso.puntoDespacho || "N/A"}
                </div>
                <div>
                  <strong>Báscula Entrada:</strong> {primerProceso.basculaEntrada || "N/A"}
                </div>
                <div>
                  <strong>Método de Carga:</strong> {primerProceso.metodoCarga || "N/A"}
                </div>
                <div>
                  <strong>Numero de Ejes:</strong> {primerProceso.numeroEjes || "N/A"}
                </div>
              </div>
              <div className="mt-2">
                <p className="font-semibold text-gray-700">Tiempos</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>
                    <strong>Prechequeo:</strong> {primerProceso?.tiempoPrechequeo?.hora || "N/A"} | <em>{primerProceso?.tiempoPrechequeo?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Scanner:</strong> {primerProceso?.tiempoScanner?.hora || "N/A"} | <em>{primerProceso?.tiempoScanner?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Autorización:</strong> {primerProceso?.tiempoAutorizacion?.hora || "N/A"} | <em>{primerProceso?.tiempoAutorizacion?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Ingreso Planta:</strong> {primerProceso?.tiempoIngresoPlanta?.hora || "N/A"} | <em>{primerProceso?.tiempoIngresoPlanta?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Entrada Báscula:</strong> {primerProceso?.tiempoEntradaBascula?.hora || "N/A"} | <em>{primerProceso?.tiempoEntradaBascula?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Salida Báscula:</strong> {primerProceso?.tiempoSalidaBascula?.hora || "N/A"} | <em>{primerProceso?.tiempoSalidaBascula?.comentarios || ""}</em>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
        {/* Sección Segundo Proceso */}
        <div className="border rounded">
          <button
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between transition-colors"
            onClick={() => toggleAccordion("segundoProceso")}
          >
            <span className="font-semibold text-gray-700">Segundo Proceso</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${accordionOpen.segundoProceso ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {accordionOpen.segundoProceso && (
            <div className="px-4 py-3 space-y-2 bg-white transition-all duration-300 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Enlonador:</strong> {segundoProceso.enlonador || "N/A"}
                </div>
                <div>
                  <strong>Operador:</strong> {segundoProceso.operador || "N/A"}
                </div>
                <div>
                  <strong>Personal Asignado:</strong> {segundoProceso.personalAsignado || "N/A"}
                </div>
                <div>
                  <strong>Modelo Equipo:</strong> {segundoProceso.modeloEquipo || "N/A"}
                </div>
              </div>
              <div className="mt-2">
                <p className="font-semibold text-gray-700">Tiempos</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>
                    <strong>Llegada al Punto:</strong> {segundoProceso?.tiempoLlegadaPunto?.hora || "N/A"} | <em>{segundoProceso?.tiempoLlegadaPunto?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Llegada del Operador:</strong> {segundoProceso?.tiempoLlegadaOperador?.hora || "N/A"} | <em>{segundoProceso?.tiempoLlegadaOperador?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Llegada del Enlonador:</strong> {segundoProceso?.tiempoLlegadaEnlonador?.hora || "N/A"} | <em>{segundoProceso?.tiempoLlegadaEnlonador?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Llegada del Equipo:</strong> {segundoProceso?.tiempoLlegadaEquipo?.hora || "N/A"} | <em>{segundoProceso?.tiempoLlegadaEquipo?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Inicio de Carga:</strong> {segundoProceso?.tiempoInicioCarga?.hora || "N/A"} | <em>{segundoProceso?.tiempoInicioCarga?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Termina Carga:</strong> {segundoProceso?.tiempoTerminaCarga?.hora || "N/A"} | <em>{segundoProceso?.tiempoTerminaCarga?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Salida del Punto:</strong> {segundoProceso?.tiempoSalidaPunto?.hora || "N/A"} | <em>{segundoProceso?.tiempoSalidaPunto?.comentarios || ""}</em>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
        {/* Sección Tercer Proceso */}
        <div className="border rounded">
          <button
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between transition-colors"
            onClick={() => toggleAccordion("tercerProceso")}
          >
            <span className="font-semibold text-gray-700">Tercer Proceso</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${accordionOpen.tercerProceso ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {accordionOpen.tercerProceso && (
            <div className="px-4 py-3 space-y-2 bg-white transition-all duration-300 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <strong>Pesador:</strong> {tercerProceso.pesadorSalida || "N/A"}
                </div>
                <div>
                  <strong>Báscula de Salida:</strong> {tercerProceso.basculaSalida || "N/A"}
                </div>
              </div>
              <div className="mt-2">
                <p className="font-semibold text-gray-700">Tiempos Báscula</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>
                    <strong>Llegada a la Báscula:</strong> {tercerProceso?.tiempoLlegadaBascula?.hora || "N/A"} | <em>{tercerProceso?.tiempoLlegadaBascula?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Entrada Báscula:</strong> {tercerProceso?.tiempoEntradaBascula?.hora || "N/A"} | <em>{tercerProceso?.tiempoEntradaBascula?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Salida Báscula:</strong> {tercerProceso?.tiempoSalidaBascula?.hora || "N/A"} | <em>{tercerProceso?.tiempoSalidaBascula?.comentarios || ""}</em>
                  </li>
                </ul>
              </div>
              {Array.isArray(tercerProceso.vueltas) &&
                tercerProceso.vueltas.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-gray-700">
                      Registro de Vueltas
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {tercerProceso.vueltas.map((v, idx) => (
                        <li key={idx}>
                          <strong>Vuelta {v.numeroVuelta}:</strong> {v.hora} | <em>{v.comentarios}</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
        {/* Sección Proceso Final */}
        <div className="border rounded">
          <button
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between transition-colors"
            onClick={() => toggleAccordion("procesoFinal")}
          >
            <span className="font-semibold text-gray-700">Proceso Final</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${accordionOpen.procesoFinal ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {accordionOpen.procesoFinal && (
            <div className="px-4 py-3 space-y-2 bg-white transition-all duration-300 text-sm">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <strong>Portería Salida:</strong> {procesoFinal?.porteriaSalida || "N/A"}
                </div>
                <div>
                  <strong>Llegada Portería:</strong> {procesoFinal?.tiempoLlegadaPorteria?.hora || "N/A"} | <em>{procesoFinal?.tiempoLlegadaPorteria?.comentarios || ""}</em>
                </div>
                <div>
                  <strong>Salida Planta:</strong> {procesoFinal?.tiempoSalidaPlanta?.hora || "N/A"} | <em>{procesoFinal?.tiempoSalidaPlanta?.comentarios || ""}</em>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isEnviarHabilitado =
    !!tiempoLlegadaPorteria.hora && !!tiempoSalidaPlanta.hora && !!porteriaSalida;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center rounded-l-lg"></div>
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4 rounded-r-lg"></div>
        </div>
        <h2 className="text-xl font-bold mb-4 text-orange-600">Proceso Final</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-2 md:col-span-2">
            <label className="block font-semibold mb-1 text-sm">Portería Salida</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={porteriaOptions}
              placeholder="Seleccione Portería"
              value={porteriaSalida ? { value: porteriaSalida, label: porteriaSalida } : null}
              onChange={(option: OptionType | null) =>
                setPorteriaSalida(option ? option.value : "")
              }
            />
          </div>
          <div className="border rounded p-2">
            <label className="block font-semibold mb-1 text-sm">Llegada Portería</label>
            <div className="flex gap-2 mt-1">
              <input
                type="time"
                step="1"
                className="border p-1 w-full text-sm"
                value={tiempoLlegadaPorteria.hora}
                onChange={(e) =>
                  setTiempoLlegadaPorteria((prev) => ({
                    ...prev,
                    hora: e.target.value,
                  }))
                }
              />
              <button
                className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                onClick={() => handleSetNow(setTiempoLlegadaPorteria)}
              >
                Ahora
              </button>
            </div>
            <textarea
              className="border w-full mt-1 p-1 text-xs"
              placeholder="Comentarios..."
              value={tiempoLlegadaPorteria.comentarios}
              onChange={(e) =>
                setTiempoLlegadaPorteria((prev) => ({
                  ...prev,
                  comentarios: e.target.value,
                }))
              }
            />
          </div>
          <div className="border rounded p-2">
            <label className="block font-semibold mb-1 text-sm">Salida Planta</label>
            <div className="flex gap-2 mt-1">
              <input
                type="time"
                step="1"
                className="border p-1 w-full text-sm"
                value={tiempoSalidaPlanta.hora}
                onChange={(e) =>
                  setTiempoSalidaPlanta((prev) => ({
                    ...prev,
                    hora: e.target.value,
                  }))
                }
              />
              <button
                className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                onClick={() => handleSetNow(setTiempoSalidaPlanta)}
              >
                Ahora
              </button>
            </div>
            <textarea
              className="border w-full mt-1 p-1 text-xs"
              placeholder="Comentarios..."
              value={tiempoSalidaPlanta.comentarios}
              onChange={(e) =>
                setTiempoSalidaPlanta((prev) => ({
                  ...prev,
                  comentarios: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Resumen de la Información</h3>
          {renderResumenAcordeon()}
        </div>
        <div className="text-sm sm:text-base text-gray-600 mt-4">
          <strong>NOTA:</strong> Guardar los datos antes de enviar.
        </div>
        <div className="mt-6 flex flex-col md:flex-row justify-between gap-2">
          <div className="flex gap-2">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
              onClick={handleAtras}
            >
              Anterior
            </button>
            <button
              className="bg-orange-400 text-white px-4 py-2 rounded text-sm hover:bg-orange-500"
              onClick={handleGuardarLocal}
            >
              Guardar
            </button>
          </div>
          <button
            className={`px-4 py-2 rounded text-sm text-white ${
              isEnviarHabilitado
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            onClick={handleEnviar}
            disabled={!isEnviarHabilitado}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
