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

  // Almacenará toda la información (resumen) de "molidoProcess"
  const [dataResumen, setDataResumen] = useState<any>(null);

  // Estado para almacenar el resumen de tiempos calculado
  const [timeSummary, setTimeSummary] = useState<{
    autorizacion: string;
    salidaPlanta: string;
    total: string;
  } | null>(null);

  // Estado para habilitar el botón Guardar Nota
  const [notaHabilitada, setNotaHabilitada] = useState(false);

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
    let stored = localStorage.getItem("molidoProcess");
    if (!stored) {
      const initialData = {
        fechaInicio: new Date().toLocaleString("en-GB", { timeZone: "America/El_Salvador" }),
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
        primerProceso: {},
        segundoProceso: {},
        tercerProceso: {},
        procesoFinal: {},
      };
      localStorage.setItem("molidoProcess", JSON.stringify(initialData));
      stored = localStorage.getItem("molidoProcess");
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      setDataResumen(parsed);
      if (parsed.procesoFinal) {
        setTiempoLlegadaPorteria(parsed.procesoFinal.tiempoLlegadaPorteria || { hora: "", comentarios: "" });
        setTiempoSalidaPlanta(parsed.procesoFinal.tiempoSalidaPlanta || { hora: "", comentarios: "" });
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

  // Función para parsear una hora (campo con {hora, comentarios})
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

  // Función para parsear fecha y hora (en caso de tener fecha y hora separados)
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

  // Función para generar el contenido legible del TXT (se incluyen TODOS los campos)
  const generateReadableNote = (data: any): string => {
    let note = "";
    note += "=== Resumen del Proceso ===\n\n";
    note += `Fecha de Inicio: ${data.fechaInicio}\n`;
    note += `Usuario: ${data.userName} (ID: ${data.userId})\n\n`;

    note += ">> Primer Proceso:\n";
    const primer = data.primerProceso;
    note += `  Número de Transacción: ${primer.numeroTransaccion || "N/A"}\n`;
    note += `  Número de Orden: ${primer.numeroOrden || "N/A"}\n`;
    note += `  Pesador Entrada: ${primer.pesadorEntrada || "N/A"}\n`;
    note += `  Portería Entrada: ${primer.porteriaEntrada || "N/A"}\n`;
    note += `  Báscula Entrada: ${primer.basculaEntrada || "N/A"}\n`;
    note += `  Molino: ${primer.numeroMolino || "N/A"}\n`;
    note += `  Número Criba: ${primer.numeroCriba || "N/A"}\n`;
    note += `  Presentación: ${primer.presentacion || "N/A"}\n`;
    note += `  Punto Despacho: ${primer.puntoDespacho || "N/A"}\n`;
    note += `  Punto Envasado: ${primer.puntoEnvasado || "N/A"}\n`;
    note += `  Método de Carga: ${primer.metodoCarga || "N/A"}\n`;
    note += `  Número de Ejes: ${primer.numeroEjes || "N/A"}\n`;
    note += `  Condición: ${primer.condicion || "N/A"}\n\n`;

    note += "  Tiempos:\n";
    note += `    Prechequeo: ${primer.tiempoPrechequeo?.fecha || "N/A"} ${primer.tiempoPrechequeo?.hora || "N/A"} - ${primer.tiempoPrechequeo?.comentarios || ""}\n`;
    note += `    Scanner: ${primer.tiempoScanner?.fecha || "N/A"} ${primer.tiempoScanner?.hora || "N/A"} - ${primer.tiempoScanner?.comentarios || ""}\n`;
    note += `    Autorización: ${primer.tiempoAutorizacion?.fecha || "N/A"} ${primer.tiempoAutorizacion?.hora || "N/A"} - ${primer.tiempoAutorizacion?.comentarios || ""}\n`;
    note += `    Ingreso Planta: ${primer.tiempoIngresoPlanta?.hora || "N/A"} - ${primer.tiempoIngresoPlanta?.comentarios || ""}\n`;
    note += `    Llegada a Báscula: ${primer.tiempoLlegadaBascula?.hora || "N/A"} - ${primer.tiempoLlegadaBascula?.comentarios || ""}\n`;
    note += `    Entrada Báscula: ${primer.tiempoEntradaBascula?.hora || "N/A"} - ${primer.tiempoEntradaBascula?.comentarios || ""}\n`;
    note += `    Salida Báscula: ${primer.tiempoSalidaBascula?.hora || "N/A"} - ${primer.tiempoSalidaBascula?.comentarios || ""}\n\n`;

    note += ">> Segundo Proceso:\n";
    const segundo = data.segundoProceso;
    note += `  Grupo: ${segundo.grupo || "N/A"}\n`;
    note += `  Operador: ${segundo.operador || "N/A"}\n`;
    note += `  Personal Asignado: ${segundo.personalAsignado || "N/A"}\n`;
    note += `  Observaciones: ${segundo.personalAsignadoObservaciones || "N/A"}\n`;
    note += `  Modelo de Equipo: ${segundo.modeloEquipo || "N/A"}\n\n`;

    note += "  Tiempos:\n";
    note += `    Llegada al Punto: ${segundo.tiempoLlegadaPunto?.hora || "N/A"} - ${segundo.tiempoLlegadaPunto?.comentarios || ""}\n`;
    note += `    Llegada del Operador: ${segundo.tiempoLlegadaOperador?.hora || "N/A"} - ${segundo.tiempoLlegadaOperador?.comentarios || ""}\n`;
    note += `    Llegada del Grupo: ${segundo.tiempoLlegadaGrupo?.hora || "N/A"} - ${segundo.tiempoLlegadaGrupo?.comentarios || ""}\n`;
    note += `    Llegada del Equipo: ${segundo.tiempoLlegadaEquipo?.hora || "N/A"} - ${segundo.tiempoLlegadaEquipo?.comentarios || ""}\n`;
    note += `    Inicia Molino: ${segundo.tiempoInicioMolido?.hora || "N/A"} - ${segundo.tiempoInicioMolido?.comentarios || ""}\n`;
    note += `    Inicio de Carga: ${segundo.tiempoInicioCarga?.hora || "N/A"} - ${segundo.tiempoInicioCarga?.comentarios || ""}\n`;
    note += `    Termina Carga: ${segundo.tiempoTerminaCarga?.hora || "N/A"} - ${segundo.tiempoTerminaCarga?.comentarios || ""}\n`;
    note += `    Termina Molino: ${segundo.tiempoTerminaMolido?.hora || "N/A"} - ${segundo.tiempoTerminaMolido?.comentarios || ""}\n`;
    note += `    Salida del Punto: ${segundo.tiempoSalidaPunto?.hora || "N/A"} - ${segundo.tiempoSalidaPunto?.comentarios || ""}\n`;
    if (Array.isArray(segundo.paros)) {
      note += `    Paros/Actividades:\n`;
      segundo.paros.forEach((p, idx) => {
        note += `      Paro/Actividad ${idx + 1}: Inicio ${p.inicio}, Fin ${p.fin}, Razón: ${p.razon}, Diff: ${p.diffCargaInicio}, Duración: ${p.duracionParo}\n`;
      });
    }
    if (segundo.parosStats) {
      note += `    Estadísticas de Paros: Total: ${segundo.parosStats.totalParos || "N/A"}, Tiempo Total: ${segundo.parosStats.tiempoTotalParos || "N/A"}\n`;
    }
    note += "\n";

    note += ">> Tercer Proceso:\n";
    const tercer = data.tercerProceso;
    note += `  Pesador Salida: ${tercer.pesadorSalida || "N/A"}\n`;
    note += `  Báscula Salida: ${tercer.basculaSalida || "N/A"}\n\n`;
    note += "  Tiempos Báscula:\n";
    note += `    Llegada a Báscula: ${tercer.tiempoLlegadaBascula?.hora || "N/A"} - ${tercer.tiempoLlegadaBascula?.comentarios || ""}\n`;
    note += `    Entrada a Báscula: ${tercer.tiempoEntradaBascula?.hora || "N/A"} - ${tercer.tiempoEntradaBascula?.comentarios || ""}\n`;
    note += `    Salida de Báscula: ${tercer.tiempoSalidaBascula?.hora || "N/A"} - ${tercer.tiempoSalidaBascula?.comentarios || ""}\n\n`;
    if (Array.isArray(tercer.vueltas)) {
      note += "  Registro de Vueltas:\n";
      tercer.vueltas.forEach((v, idx) => {
        note += `    Vuelta ${v.numeroVuelta}:\n`;
        note += `      Llegada al Punto: ${v.llegadaPunto?.hora || "N/A"} - ${v.llegadaPunto?.comentarios || ""}\n`;
        note += `      Salida del Punto: ${v.salidaPunto?.hora || "N/A"} - ${v.salidaPunto?.comentarios || ""}\n`;
        note += `      Llegada a Báscula: ${v.llegadaBascula?.hora || "N/A"} - ${v.llegadaBascula?.comentarios || ""}\n`;
        note += `      Entrada a Báscula: ${v.entradaBascula?.hora || "N/A"} - ${v.entradaBascula?.comentarios || ""}\n`;
        note += `      Salida de Báscula: ${v.salidaBascula?.hora || "N/A"} - ${v.salidaBascula?.comentarios || ""}\n\n`;
      });
    }

    note += ">> Proceso Final:\n";
    const final = data.procesoFinal;
    note += `  Llegada a Portería: ${final.tiempoLlegadaPorteria?.hora || "N/A"} - ${final.tiempoLlegadaPorteria?.comentarios || ""}\n`;
    note += `  Salida de Planta: ${final.tiempoSalidaPlanta?.hora || "N/A"} - ${final.tiempoSalidaPlanta?.comentarios || ""}\n`;
    note += `  Portería Salida: ${final.porteriaSalida || "N/A"}\n\n`;

    note += `Tiempo Total: ${data.tiempoTotal || "N/A"}\n`;

    return note;
  };

  // Función para guardar los datos del Proceso Final en localStorage (sin mostrar alertas)
  const guardarDatosProcesoFinal = () => {
    const stored = localStorage.getItem("molidoProcess");
    if (!stored) {
      console.error("No se encontró molidoProcess en localStorage");
      return;
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      console.error("Datos en cache inválidos.");
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
    localStorage.setItem("molidoProcess", JSON.stringify(parsed));
  };

  // Botón "Guardar" (para guardar datos en caché)
  const handleGuardarLocal = () => {
    const stored = localStorage.getItem("molidoProcess");
    if (!stored) {
      Swal.fire("Error", "No se encontró molidoProcess en localStorage", "error");
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
    localStorage.setItem("molidoProcess", JSON.stringify(parsed));
    if (primerProceso.tiempoAutorizacion && primerProceso.tiempoAutorizacion.hora) {
      setTimeSummary({
        autorizacion: primerProceso.tiempoAutorizacion.hora,
        salidaPlanta: tiempoSalidaPlanta.hora,
        total: tiempoTotal,
      });
    }
    cargarDatosDeLocalStorage();
    // Se activa la opción para Guardar Nota
    setNotaHabilitada(true);
    Swal.fire(
      "Guardado",
      `Los datos finales se han guardado localmente. Tiempo Total: ${tiempoTotal || "No calculado"}`,
      "success"
    );
  };

  // Botón "Guardar Nota": descarga un archivo TXT con la info formateada
  const handleGuardarNota = () => {
    const stored = localStorage.getItem("molidoProcess");
    if (!stored) {
      Swal.fire("Error", "No se encontró molidoProcess en localStorage", "error");
      return;
    }
    const parsed = JSON.parse(stored);
    const content = generateReadableNote(parsed);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    // Generar nombre de archivo: <userName>-YYYY-MM-DD-HH-MM-SS.txt
    const userName = localStorage.getItem("userName") || "Usuario";
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10);
    const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, "-");
    const fileName = `${userName}-${formattedDate}-${formattedTime}.txt`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Swal.fire("Nota guardada", "Archivo txt generado.", "success");
  };

  // Validación de procesos
  function validarTodosLosProcesos() {
    if (!dataResumen) {
      return "No se encontraron datos en caché.";
    }
    const { primerProceso, segundoProceso, tercerProceso } = dataResumen;
    if (
      !primerProceso ||
      !primerProceso.numeroTransaccion ||
      !primerProceso.numeroEjes ||
      !primerProceso.metodoCarga ||
      !primerProceso.porteriaEntrada ||
      !primerProceso.pesadorEntrada ||
      !primerProceso.condicion ||
      !primerProceso.basculaEntrada ||
      !primerProceso.puntoDespacho
    ) {
      return "El Primer Proceso está incompleto o faltan campos obligatorios.";
    }
    if (
      !segundoProceso ||
      !segundoProceso.grupo ||
      !segundoProceso.operador ||
      !segundoProceso.personalAsignado ||
      !segundoProceso.modeloEquipo
    ) {
      return "El Segundo Proceso está incompleto o faltan campos obligatorios.";
    }
    if (
      !tercerProceso ||
      !tercerProceso.pesadorSalida ||
      !tercerProceso.vueltas ||
      !tercerProceso.basculaSalida
    ) {
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
        title: "Procesando solicitud...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      try {
        const stored = localStorage.getItem("molidoProcess");
        if (!stored) {
          Swal.close();
          Swal.fire("Error", "No se encontró molidoProcess en localStorage", "error");
          return;
        }
        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== "object") {
          Swal.close();
          Swal.fire("Error", "Datos en caché inválidos.", "error");
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
        localStorage.setItem("molidoProcess", JSON.stringify(parsed));

        // Debug: imprimir el payload a enviar
        console.log("Payload a enviar:", JSON.stringify({ molinoProcess: parsed }, null, 2));

        const res = await fetch("/api/demoras/molino", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ molinoProcess: parsed }),
        });
        Swal.close();
        if (res.ok) {
          localStorage.removeItem("molidoProcess");
          localStorage.removeItem("parosCache");
          Swal.fire("Enviado", "Datos enviados y guardados correctamente.", "success").then(() => {
            router.push("/proceso/iniciar");
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

  // Botón "Anterior": guardar datos en localStorage y navegar a la etapa anterior
  const handleAtras = () => {
    // Guardamos los datos del Proceso Final en localStorage
    guardarDatosProcesoFinal();
    // Luego, navegamos a la página del Tercer Proceso
    router.push("/proceso/iniciar/molino/step3");
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
                  <strong>N° Transacción:</strong> {primerProceso.numeroTransaccion || "N/A"}
                </div>
                <div>
                  <strong>N° Orden:</strong> {primerProceso.numeroOrden || "N/A"}
                </div>
                <div>
                  <strong>Pesador Entrada:</strong> {primerProceso.pesadorEntrada || "N/A"}
                </div>
                <div>
                  <strong>Portería Entrada:</strong> {primerProceso.porteriaEntrada || "N/A"}
                </div>
                <div>
                  <strong>Punto Despacho:</strong> {primerProceso.puntoDespacho || "N/A"}
                </div>
                <div>
                  <strong>Punto Envasado:</strong> {primerProceso.puntoEnvasado || "N/A"}
                </div>
                <div>
                  <strong>Báscula Entrada:</strong> {primerProceso.basculaEntrada || "N/A"}
                </div>
                <div>
                  <strong>Método de Carga:</strong> {primerProceso.metodoCarga || "N/A"}
                </div>
                <div>
                  <strong>Número de Ejes:</strong> {primerProceso.numeroEjes || "N/A"}
                </div>
                <div>
                  <strong>Condición:</strong> {primerProceso.condicion || "N/A"}
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
                    <strong>Llegada a Báscula:</strong> {primerProceso?.tiempoLlegadaBascula?.hora || "N/A"} | <em>{primerProceso?.tiempoLlegadaBascula?.comentarios || ""}</em>
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
                  <strong>Grupo:</strong> {segundoProceso.grupo || "N/A"}
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
                    <strong>Llegada del Grupo:</strong> {segundoProceso?.tiempoLlegadaGrupo?.hora || "N/A"} | <em>{segundoProceso?.tiempoLlegadaGrupo?.comentarios || ""}</em>
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
                {Array.isArray(segundoProceso.paros) && segundoProceso.paros.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Paros:</p>
                    <ul className="list-disc list-inside">
                      {segundoProceso.paros.map((p, idx) => (
                        <li key={idx}>
                          <strong>Paro {idx + 1}:</strong> Inicio: {p.inicio}, Fin: {p.fin}, Razón: {p.razon}, Diff: {p.diffCargaInicio}, Duración: {p.duracionParo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {segundoProceso.parosStats && (
                  <div className="mt-2">
                    <strong>Estadísticas de Paros:</strong> Total: {segundoProceso.parosStats.totalParos}, Tiempo Total: {segundoProceso.parosStats.tiempoTotalParos}
                  </div>
                )}
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
                          <strong>Vuelta {v.numeroVuelta}:</strong> {v.llegadaPunto?.hora || "N/A"} | <em>{v.llegadaPunto?.comentarios || ""}</em>
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
            {notaHabilitada && (
              <button
                className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
                onClick={handleGuardarNota}
              >
                Guardar Nota
              </button>
            )}
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
