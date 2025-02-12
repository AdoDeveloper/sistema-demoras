"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2"; // Importamos sweetalert2
import React from "react";

export default function ProcesoFinal() {
  const router = useRouter();

  // Estados de campos en la pantalla final
  const [tiempoLlegadaTerminal, setTiempoLlegadaTerminal] = useState({
    hora: "",
    comentarios: "",
  });
  const [tiempoSalidaPlanta, setTiempoSalidaPlanta] = useState({
    hora: "",
    comentarios: "",
  });

  // Almacenará toda la información (resumen) de "demorasProcess"
  const [dataResumen, setDataResumen] = useState(null);

  // Control de acordeones
  const [accordionOpen, setAccordionOpen] = useState({
    primerProceso: false,
    segundoProceso: false,
    tercerProceso: false,
    procesoFinal: false,
  });

  // Al montar, verificar/crear "demorasProcess" y cargar datos
  useEffect(() => {
    cargarDatosDeLocalStorage();
  }, []);

  // -------------------------------------------
  // Función para CARGAR la info de localStorage
  // -------------------------------------------
  function cargarDatosDeLocalStorage() {
    let stored = localStorage.getItem("demorasProcess");
    if (!stored) {
      // Crear un objeto base si no existe
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
      setDataResumen(parsed);

      // Cargar campos de procesoFinal (si existen)
      if (parsed.procesoFinal) {
        setTiempoLlegadaTerminal(
          parsed.procesoFinal.tiempoLlegadaTerminal || {
            hora: "",
            comentarios: "",
          }
        );
        setTiempoSalidaPlanta(
          parsed.procesoFinal.tiempoSalidaPlanta || {
            hora: "",
            comentarios: "",
          }
        );
      }
    }
  }

  // Helper para setear la hora actual en formato HH:mm:ss con UTC-6
  const handleSetNow = (setter) => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setter((prev) => ({ ...prev, hora }));
  };

  // ------------------------------------------------------------
  //  Botón "Guardar" => almacena en localStorage y refresca
  // ------------------------------------------------------------
  const handleGuardarLocal = () => {
    const stored = localStorage.getItem("demorasProcess");
    if (!stored) {
      Swal.fire("Error", "No se encontró demorasProcess en localStorage", "error");
      return;
    }

    const parsed = JSON.parse(stored);

    // Actualizar procesoFinal
    parsed.procesoFinal = {
      tiempoLlegadaTerminal,
      tiempoSalidaPlanta,
    };

    // Guardar
    localStorage.setItem("demorasProcess", JSON.stringify(parsed));

    // Refrescar data para que el resumen se actualice
    cargarDatosDeLocalStorage();

    // Alerta de éxito
    Swal.fire("Guardado", "Los datos finales se han guardado en cache.", "success");
  };

  // ------------------------------------------------------------
  //  VALIDAR QUE TODOS LOS PROCESOS ESTÉN COMPLETOS
  // ------------------------------------------------------------
  function validarTodosLosProcesos() {
    if (!dataResumen) {
      // Si ni siquiera existe dataResumen, algo está mal
      return "No se encontraron datos en caché.";
    }

    const { primerProceso, segundoProceso, tercerProceso, procesoFinal } = dataResumen;

    // Verifica "primerProceso" (ejemplo: placa, cliente, etc.)
    // Aquí decides qué "datos mínimos" deben existir. Haré un check básico:
    if (!primerProceso || !primerProceso.placa || !primerProceso.cliente) {
      return "El Primer Proceso está incompleto o faltan campos obligatorios.";
    }

    // Verifica "segundoProceso"
    if (!segundoProceso || !segundoProceso.enlonador || !segundoProceso.operador) {
      return "El Segundo Proceso está incompleto o faltan campos obligatorios.";
    }

    // Verifica "tercerProceso"
    if (!tercerProceso || !tercerProceso.pesadorSalida || !tercerProceso.vueltas) {
      return "El Tercer Proceso está incompleto o faltan campos obligatorios.";
    }

    // Verifica "procesoFinal" => en particular, la hora
    if (!tiempoLlegadaTerminal.hora || !tiempoSalidaPlanta.hora) {
      return "Faltan datos de Llegada Terminal / Salida Planta";
    }

    // Si pasa todas las validaciones
    return "";
  }

  // ------------------------------------------------------------
  //  Botón "Enviar" => intenta enviar a la API
  // ------------------------------------------------------------
  const handleEnviar = async () => {
    // Primero valida todos los procesos
    const errorProceso = validarTodosLosProcesos();
    if (errorProceso) {
      // Muestra alerta con el mensaje
      Swal.fire("Incompleto", errorProceso, "warning");
      return;
    }

    // Confirmar con el usuario si realmente desea enviar
    Swal.fire({
      title: "¿Enviar los datos?",
      text: "Se procederá a guardar la información definitivamente.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const stored = localStorage.getItem("demorasProcess");
          if (!stored) {
            Swal.fire("Error", "No se encontró demorasProcess en localStorage", "error");
            return;
          }

          const parsed = JSON.parse(stored);
          // Actualiza info final
          parsed.procesoFinal = {
            tiempoLlegadaTerminal,
            tiempoSalidaPlanta,
          };
          localStorage.setItem("demorasProcess", JSON.stringify(parsed));

          // Enviar a la API
          const res = await fetch("/api/demoras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ demorasProcess: parsed }),
          });

          if (res.ok) {
            // Éxito: limpia localStorage, alerta y redirige
            localStorage.removeItem("demorasProcess");
            Swal.fire("Enviado", "Datos enviados y guardados correctamente.", "success")
              .then(() => {
                // Redirigir al home
                router.push("/");
              });
          } else {
            const { error } = await res.json();
            Swal.fire("Error", `Error al guardar en DB: ${error || "Desconocido"}`, "error");
          }
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Error de conexión al guardar los datos.", "error");
        }
      }
      // Si el usuario canceló, no hacemos nada
    });
  };

  // Botón "Anterior": vuelve a paso 3
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

  // ----------------------------------------------------------------
  // Render de cada sección en acordeón
  // ----------------------------------------------------------------
  function renderResumenAcordeon() {
    if (!dataResumen) {
      return <p className="text-gray-500">No se encontraron datos en caché.</p>;
    }

    const {
      fechaInicio,
      primerProceso = {},
      segundoProceso = {},
      tercerProceso = {},
      procesoFinal = {},
    } = dataResumen;

    return (
      <div className="space-y-4">
        {/* Fecha de Inicio */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
          <strong className="text-blue-700">Fecha de Inicio:</strong>
          <span className="ml-2 text-blue-800">{fechaInicio || "N/A"}</span>
        </div>

        {/* ================= PRIMER PROCESO ================= */}
        <div className="border rounded">
          <button
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between transition-colors"
            onClick={() => toggleAccordion("primerProceso")}
          >
            <span className="font-semibold text-gray-700">Primer Proceso</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                accordionOpen.primerProceso ? "rotate-180" : ""
              }`}
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
              {/* Info General */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Terminal:</strong> {primerProceso.terminal || "N/A"}
                </div>
                <div>
                  <strong>Cliente:</strong> {primerProceso.cliente || "N/A"}
                </div>
                <div>
                  <strong>Placa:</strong> {primerProceso.placa || "N/A"}
                </div>
                <div>
                  <strong>Remolque:</strong> {primerProceso.remolque || "N/A"}
                </div>
                <div>
                  <strong>Ejes:</strong> {primerProceso.ejes || "N/A"}
                </div>
                <div>
                  <strong>Pesador:</strong> {primerProceso.pesador || "N/A"}
                </div>
                <div>
                  <strong>Peso Inicial:</strong>{" "}
                  {primerProceso.pesoInicial || "N/A"}
                </div>
                <div>
                  <strong>Tipo Producto:</strong>{" "}
                  {primerProceso.tipoProducto || "N/A"}
                </div>
                <div>
                  <strong>Punto Despacho:</strong>{" "}
                  {primerProceso.puntoDespacho || "N/A"}
                </div>
                <div>
                  <strong>Báscula Entrada:</strong>{" "}
                  {primerProceso.basculaEntrada || "N/A"}
                </div>
                <div>
                  <strong>Tipo de Carga:</strong>{" "}
                  {primerProceso.tipoCarga || "N/A"}
                </div>
                <div>
                  <strong>Método de Carga:</strong>{" "}
                  {primerProceso.metodoCarga || "N/A"}
                </div>
              </div>

              {/* Tiempos primer proceso */}
              <div className="mt-2">
                <p className="font-semibold text-gray-700">Tiempos</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>
                    <strong>Prechequeo:</strong>{" "}
                    {primerProceso?.tiempoPrechequeo?.hora || "N/A"}
                    {" | "}
                    <em>
                      {primerProceso?.tiempoPrechequeo?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Scanner:</strong>{" "}
                    {primerProceso?.tiempoScanner?.hora || "N/A"}
                    {" | "}
                    <em>{primerProceso?.tiempoScanner?.comentarios || ""}</em>
                  </li>
                  <li>
                    <strong>Autorización:</strong>{" "}
                    {primerProceso?.tiempoAutorizacion?.hora || "N/A"}
                    {" | "}
                    <em>
                      {primerProceso?.tiempoAutorizacion?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Ingreso Planta:</strong>{" "}
                    {primerProceso?.tiempoIngresoPlanta?.hora || "N/A"}
                    {" | "}
                    <em>
                      {primerProceso?.tiempoIngresoPlanta?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Entrada Báscula:</strong>{" "}
                    {primerProceso?.tiempoEntradaBascula?.hora || "N/A"}
                    {" | "}
                    <em>
                      {primerProceso?.tiempoEntradaBascula?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Salida Báscula:</strong>{" "}
                    {primerProceso?.tiempoSalidaBascula?.hora || "N/A"}
                    {" | "}
                    <em>
                      {primerProceso?.tiempoSalidaBascula?.comentarios || ""}
                    </em>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ================= SEGUNDO PROCESO ================= */}
        <div className="border rounded">
          <button
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between transition-colors"
            onClick={() => toggleAccordion("segundoProceso")}
          >
            <span className="font-semibold text-gray-700">Segundo Proceso</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                accordionOpen.segundoProceso ? "rotate-180" : ""
              }`}
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
                  <strong>Enlonador:</strong>{" "}
                  {segundoProceso.enlonador || "N/A"}
                </div>
                <div>
                  <strong>Operador:</strong> {segundoProceso.operador || "N/A"}
                </div>
                <div>
                  <strong>Personal Asignado:</strong>{" "}
                  {segundoProceso.personalAsignado || "N/A"}
                </div>
                <div>
                  <strong>Modelo Equipo:</strong>{" "}
                  {segundoProceso.modeloEquipo || "N/A"}
                </div>
              </div>

              <div className="mt-2">
                <p className="font-semibold text-gray-700">Tiempos</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>
                    <strong>Llegada al Punto:</strong>{" "}
                    {segundoProceso?.tiempoLlegadaPunto?.hora || "N/A"}{" | "}
                    <em>
                      {segundoProceso?.tiempoLlegadaPunto?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Llegada del Operador:</strong>{" "}
                    {segundoProceso?.tiempoLlegadaOperador?.hora || "N/A"}{" | "}
                    <em>
                      {segundoProceso?.tiempoLlegadaOperador?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Llegada del Enlonador:</strong>{" "}
                    {segundoProceso?.tiempoLlegadaEnlonador?.hora || "N/A"}{" | "}
                    <em>
                      {segundoProceso?.tiempoLlegadaEnlonador?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Llegada del Equipo:</strong>{" "}
                    {segundoProceso?.tiempoLlegadaEquipo?.hora || "N/A"}{" | "}
                    <em>
                      {segundoProceso?.tiempoLlegadaEquipo?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Inicio de Carga:</strong>{" "}
                    {segundoProceso?.tiempoInicioCarga?.hora || "N/A"}{" | "}
                    <em>
                      {segundoProceso?.tiempoInicioCarga?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Termina Carga:</strong>{" "}
                    {segundoProceso?.tiempoTerminaCarga?.hora || "N/A"}{" | "}
                    <em>
                      {segundoProceso?.tiempoTerminaCarga?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Salida del Punto:</strong>{" "}
                    {segundoProceso?.tiempoSalidaPunto?.hora || "N/A"}{" | "}
                    <em>
                      {segundoProceso?.tiempoSalidaPunto?.comentarios || ""}
                    </em>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ================= TERCER PROCESO ================= */}
        <div className="border rounded">
          <button
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between transition-colors"
            onClick={() => toggleAccordion("tercerProceso")}
          >
            <span className="font-semibold text-gray-700">Tercer Proceso</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                accordionOpen.tercerProceso ? "rotate-180" : ""
              }`}
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
              {/* Info General */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <strong>Pesador:</strong>{" "}
                  {tercerProceso.pesadorSalida || "N/A"}
                </div>
                <div>
                  <strong>Báscula de Salida:</strong>{" "}
                  {tercerProceso.basculaSalida || "N/A"}
                </div>
                <div>
                  <strong>Peso Neto:</strong> {tercerProceso.pesoNeto || "N/A"}
                </div>
              </div>

              <div className="mt-2">
                <p className="font-semibold text-gray-700">Tiempos Báscula</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>
                    <strong>Entrada Báscula:</strong>{" "}
                    {tercerProceso?.tiempoEntradaBascula?.hora || "N/A"}{" | "}
                    <em>
                      {tercerProceso?.tiempoEntradaBascula?.comentarios || ""}
                    </em>
                  </li>
                  <li>
                    <strong>Salida Báscula:</strong>{" "}
                    {tercerProceso?.tiempoSalidaBascula?.hora || "N/A"}{" | "}
                    <em>
                      {tercerProceso?.tiempoSalidaBascula?.comentarios || ""}
                    </em>
                  </li>
                </ul>
              </div>

              {/* Vueltas */}
              {Array.isArray(tercerProceso.vueltas) &&
                tercerProceso.vueltas.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-gray-700">
                      Registro de Vueltas
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {tercerProceso.vueltas.map((v, idx) => (
                        <li key={idx}>
                          <strong>Vuelta {v.numeroVuelta}:</strong>{" "}
                          {v.hora} {" | "} <em>{v.comentarios}</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* ================= PROCESO FINAL ================= */}
        <div className="border rounded">
          <button
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-t flex items-center justify-between transition-colors"
            onClick={() => toggleAccordion("procesoFinal")}
          >
            <span className="font-semibold text-gray-700">Proceso Final</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                accordionOpen.procesoFinal ? "rotate-180" : ""
              }`}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Llegada Terminal:</strong>{" "}
                  {procesoFinal?.tiempoLlegadaTerminal?.hora || "N/A"}
                  {" | "}
                  <em>
                    {procesoFinal?.tiempoLlegadaTerminal?.comentarios || ""}
                  </em>
                </div>
                <div>
                  <strong>Salida Planta:</strong>{" "}
                  {procesoFinal?.tiempoSalidaPlanta?.hora || "N/A"}
                  {" | "}
                  <em>{procesoFinal?.tiempoSalidaPlanta?.comentarios || ""}</em>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Determina si el botón "Enviar" está habilitado
  // ----------------------------------------------------------------
  const isEnviarHabilitado =
    !!tiempoLlegadaTerminal.hora && !!tiempoSalidaPlanta.hora;

  // ----------------------------------------------------------------
  // Render principal
  // ----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6">
        {/* Barra de Progreso */}
        {/* <div className="flex items-center mb-4">
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center rounded-l-lg">Paso 1</div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center">Paso 2</div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center">Paso 3</div>
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4 rounded-r-lg">
            Paso 4 de 4
          </div>
        </div> */}
        <div className="flex items-center mb-4">
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center rounded-l-lg"></div>
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4 rounded-r-lg"></div>
        </div>
        <h2 className="text-xl font-bold mb-4 text-orange-600">
          Proceso Final
        </h2>

        {/* Campos de Tiempos (Llegada Terminal, Salida Planta) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Llegada Terminal */}
          <div className="border rounded p-2">
            <label className="block font-semibold mb-1 text-sm">
              Llegada Terminal
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="time"
                step="1"
                className="border p-1 w-full text-sm"
                value={tiempoLlegadaTerminal.hora}
                onChange={(e) =>
                  setTiempoLlegadaTerminal((prev) => ({
                    ...prev,
                    hora: e.target.value,
                  }))
                }
              />
              <button
                className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                onClick={() => handleSetNow(setTiempoLlegadaTerminal)}
              >
                Ahora
              </button>
            </div>
            <textarea
              className="border w-full mt-1 p-1 text-xs"
              placeholder="Comentarios..."
              value={tiempoLlegadaTerminal.comentarios}
              onChange={(e) =>
                setTiempoLlegadaTerminal((prev) => ({
                  ...prev,
                  comentarios: e.target.value,
                }))
              }
            />
          </div>

          {/* Salida de Planta */}
          <div className="border rounded p-2">
            <label className="block font-semibold mb-1 text-sm">
              Salida de Planta
            </label>
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

        {/* Acordeones con el Resumen */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Resumen de la Información</h3>
          {renderResumenAcordeon()}
        </div>

        <div className="text-sm sm:text-base text-gray-600 mt-4">
            <strong>NOTA:</strong> Guardar los datos antes de enviar.
        </div>

        {/* Botones */}
        <div className="mt-6 flex flex-col md:flex-row justify-between gap-2">
          {/* Zona Izquierda: Botón "Anterior" y "Guardar" */}
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

          {/* Zona Derecha: Botón "Enviar" (habilitado si hay hora en ambos campos) */}
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
