"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

/** Estructura para { hora, comentarios } */
function crearSubtiempo(hora = "", comentarios = "") {
  return { hora, comentarios };
}

/** Estructura de Vuelta (4 sub-tiempos):
    - llegadaPunto
    - salidaPunto
    - llegadaBascula
    - salidaBascula
*/
function crearNuevaVuelta(
  numeroVuelta,
  llegadaPunto,
  salidaPunto,
  llegadaBascula,
  salidaBascula
) {
  return {
    numeroVuelta,
    llegadaPunto: llegadaPunto || crearSubtiempo(),
    salidaPunto: salidaPunto || crearSubtiempo(),
    llegadaBascula: llegadaBascula || crearSubtiempo(),
    salidaBascula: salidaBascula || crearSubtiempo(),
  };
}

export default function TercerProceso() {
  const router = useRouter();

  // ----- Campos Principales (Tercer Proceso) -----
  const [pesadorSalida, setPesadorSalida] = useState("");
  const [basculaSalida, setBasculaSalida] = useState("");
  const [pesoNeto, setPesoNeto] = useState("");

  // Tiempos de Entrada/Salida de Báscula (Tercer Proceso)
  const [tiempoEntradaBascula, setTiempoEntradaBascula] = useState(crearSubtiempo());
  const [tiempoSalidaBascula, setTiempoSalidaBascula] = useState(crearSubtiempo());

  // Registro de vueltas
  const [vueltas, setVueltas] = useState([]);

  // ----------------------------------------------------------------
  // useEffect al montar => carga datos y sincroniza vuelta 1
  // ----------------------------------------------------------------
  useEffect(() => {
    cargarDatosDeLocalStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------
  // Carga desde localStorage y sincroniza la vuelta 1
  // ----------------------------------------------------------------
  function cargarDatosDeLocalStorage() {
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

    const parsed = JSON.parse(stored);

    // 1) Cargar Tercer Proceso
    if (parsed.tercerProceso) {
      const t = parsed.tercerProceso;
      setPesadorSalida(t.pesadorSalida || "");
      setBasculaSalida(t.basculaSalida || "");
      setPesoNeto(t.pesoNeto || "");
      setTiempoEntradaBascula(t.tiempoEntradaBascula || crearSubtiempo());
      setTiempoSalidaBascula(t.tiempoSalidaBascula || crearSubtiempo());
    }

    // 2) Extraer datos de Proceso 2 => (tiempoLlegadaPunto, tiempoSalidaPunto)
    const s = parsed.segundoProceso || {};
    const tsLlegPunto = s.tiempoLlegadaPunto || crearSubtiempo();
    const tsSalidaPunto = s.tiempoSalidaPunto || crearSubtiempo();

    // 3) Del Tercer Proceso => (tiempoEntradaBascula, tiempoSalidaBascula)
    const tProc = parsed.tercerProceso || {};
    const entradaBascula = tProc.tiempoEntradaBascula || crearSubtiempo();
    const salidaBascula = tProc.tiempoSalidaBascula || crearSubtiempo();

    // 4) Cargar vueltas
    let vueltasLS = [];
    if (parsed.tercerProceso && Array.isArray(parsed.tercerProceso.vueltas)) {
      vueltasLS = parsed.tercerProceso.vueltas;
    }

    // 5) Si NO hay vueltas => crear la Vuelta 1 con los datos del segundo y tercer proceso
    if (vueltasLS.length === 0) {
      const v1 = crearNuevaVuelta(
        1,
        tsLlegPunto,    // => llegadaPunto
        tsSalidaPunto,  // => salidaPunto
        entradaBascula, // => llegadaBascula
        salidaBascula   // => salidaBascula
      );
      setVueltas([v1]);
    } else {
      // 6) Ya hay vueltas => Forzamos que la vuelta #1 se sincronice
      //    con Proceso 2 y 3 (para evitar inconsistencias)
      const updated = [...vueltasLS];

      // Buscamos la Vuelta 1
      const idxV1 = updated.findIndex((x) => x.numeroVuelta === 1);
      if (idxV1 >= 0) {
        updated[idxV1].llegadaPunto = tsLlegPunto;    // no editable
        updated[idxV1].salidaPunto = tsSalidaPunto;
        updated[idxV1].llegadaBascula = entradaBascula;
        updated[idxV1].salidaBascula = salidaBascula;
      } else {
        // Si no existe, la creamos y la ponemos al inicio
        const v1 = crearNuevaVuelta(
          1,
          tsLlegPunto,
          tsSalidaPunto,
          entradaBascula,
          salidaBascula
        );
        updated.unshift(v1);
      }
      setVueltas(updated);
    }
  }

  // ----------------------------------------------------------------
  // Guarda en localStorage, forzando sincronización de vuelta 1
  // ----------------------------------------------------------------
  function guardarDatosEnLocalStorage() {
    // Primero sincronizamos la vuelta 1 (por si Proceso 2 o 3 se cambiaron en este step)
    const stored = localStorage.getItem("demorasProcess");
    if (!stored) return;

    const parsed = JSON.parse(stored);

    // - Reextraemos de nuevo, por si el usuario cambió algo en este paso
    const s = parsed.segundoProceso || {};
    const tsLlegPunto = s.tiempoLlegadaPunto || crearSubtiempo();
    const tsSalidaPunto = s.tiempoSalidaPunto || crearSubtiempo();

    const tProc = parsed.tercerProceso || {};
    const entradaBascula = tProc.tiempoEntradaBascula || crearSubtiempo();
    const salidaBascula = tProc.tiempoSalidaBascula || crearSubtiempo();

    // - Actualizamos vuelta 1 en nuestro estado
    setVueltas((prev) => {
      const updated = [...prev];
      const idxV1 = updated.findIndex((x) => x.numeroVuelta === 1);
      if (idxV1 >= 0) {
        updated[idxV1].llegadaPunto = tsLlegPunto;
        updated[idxV1].salidaPunto = tsSalidaPunto;
        updated[idxV1].llegadaBascula = entradaBascula;
        updated[idxV1].salidaBascula = salidaBascula;
      } else {
        // Caso extraño: no existe V1, la creamos
        const v1 = crearNuevaVuelta(
          1,
          tsLlegPunto,
          tsSalidaPunto,
          entradaBascula,
          salidaBascula
        );
        updated.unshift(v1);
      }
      return updated;
    });

    // - Esperamos a que setVueltas se actualice => sincrónicamente
    //   Para evitar problemas, guardamos en un "efecto colateral" o
    //   sencillamente lo hacemos con la versión final del estado
    //   en un setTimeout(0) o similar. O, de forma rápida:
    setTimeout(() => {
      // Volvemos a leer con la V1 ya forzada
      const finalV1State = [...vueltas];
      // Escribimos en parsed.tercerProceso
      parsed.tercerProceso = {
        pesadorSalida,
        basculaSalida,
        pesoNeto,
        tiempoEntradaBascula,
        tiempoSalidaBascula,
        vueltas: finalV1State,
      };
      // Guardar
      localStorage.setItem("demorasProcess", JSON.stringify(parsed));
    }, 0);
  }

  // ----------------------------------------------------------------
  // Helper: asignar "Ahora" en "HH:mm:ss"
  // ----------------------------------------------------------------
  const handleSetNow = (setter) => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setter((prev) => ({ ...prev, hora }));
  };

  // ----------------------------------------------------------------
  // Helper sub-tiempo => Asigna "Ahora" a un campo en la vuelta
  // ----------------------------------------------------------------
  const handleSetNowSubtiempo = (indexVuelta, tiempoKey) => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setVueltas((prev) => {
      const updated = [...prev];
      const tmp = updated[indexVuelta][tiempoKey];
      updated[indexVuelta][tiempoKey] = { ...tmp, hora };
      return updated;
    });
  };

  // ----------------------------------------------------------------
  // Cambiar algún sub-tiempo en vueltas (excepto vuelta1)
  // ----------------------------------------------------------------
  const handleChangeVueltaTiempo = (indexVuelta, tiempoKey, field, value) => {
    setVueltas((prev) => {
      const updated = [...prev];
      const obj = updated[indexVuelta][tiempoKey];
      updated[indexVuelta][tiempoKey] = { ...obj, [field]: value };
      return updated;
    });
  };

  // ----------------------------------------------------------------
  // Agregar una vuelta adicional (#2, #3, etc.)
  // ----------------------------------------------------------------
  const handleAgregarVuelta = () => {
    setVueltas((prev) => [
      ...prev,
      crearNuevaVuelta(
        prev.length + 1,
        crearSubtiempo(),
        crearSubtiempo(),
        crearSubtiempo(),
        crearSubtiempo()
      ),
    ]);
  };

  // ----------------------------------------------------------------
  // Botón "Siguiente": guarda y va a paso 4
  // ----------------------------------------------------------------
  const handleGuardarYContinuar = () => {
    guardarDatosEnLocalStorage();
    router.push("/proceso/iniciar/step4");
  };

  // ----------------------------------------------------------------
  // Botón "Anterior": guarda y regresa a paso 2
  // ----------------------------------------------------------------
  const handleAtras = () => {
    guardarDatosEnLocalStorage();
    router.push("/proceso/iniciar/step2");
  };

  // ----------------------------------------------------------------
  // Render principal
  // ----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-4 sm:p-6">
        {/* Barra de Progreso */}
        {/* <div className="flex items-center mb-4">
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center rounded-l-lg">Paso 1</div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center">Paso 2</div>
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4">
            Paso 3 de 4
          </div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center rounded-r-lg">Paso 4</div>
        </div> */}
        <div className="flex items-center mb-4">
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center rounded-l-lg"></div>
          <div className="flex-1 bg-orange-500 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center rounded-r-lg"></div>
        </div>
        <h2 className="text-xl font-bold mb-4 text-orange-600">
          Tercer Proceso
        </h2>

        {/* Campos Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pesador Salida */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Pesador
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
            <select
              className="border w-full p-2 text-sm sm:text-base"
              value={basculaSalida}
              onChange={(e) => setBasculaSalida(e.target.value)}
            >
              <option disabled value="">
                Seleccione Báscula
              </option>
              <option value="Báscula 1">Báscula 1</option>
              <option value="Báscula 2">Báscula 2</option>
              <option value="Báscula 3">Báscula 3</option>
              <option value="Báscula 4">Báscula 4</option>
              <option value="Báscula 5">Báscula 5</option>
              <option value="Báscula 6">Báscula 6</option>
            </select>
          </div>

          {/* Peso Neto */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Peso Neto
            </label>
            <input
              type="number"
              className="border w-full p-2 text-sm sm:text-base"
              value={pesoNeto}
              onChange={(e) => setPesoNeto(e.target.value)}
            />
          </div>
        </div>

        {/* Tiempos de Entrada/Salida de Báscula (Tercer Proceso) */}
        <div className="mt-6">
        <h3 className="font-bold text-lg mb-2 text-sm sm:text-base">Tiempos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entrada Báscula (Tercer Proceso) */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Entrada Báscula
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoEntradaBascula.hora}
                  onChange={(e) =>
                    setTiempoEntradaBascula((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
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
                  setTiempoEntradaBascula((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>

            {/* Salida Báscula (Tercer Proceso) */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Salida Báscula
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoSalidaBascula.hora}
                  onChange={(e) =>
                    setTiempoSalidaBascula((prev) => ({
                      ...prev,
                      hora: e.target.value,
                    }))
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
                  setTiempoSalidaBascula((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Registro de Vueltas */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2 text-sm sm:text-base">
            Registro de Vueltas
          </h3>
          <div className="text-sm sm:text-base text-gray-600 mb-2">
            <strong>NOTA:</strong> El proceso normal cuenta como la Vuelta 1.
            <br />
            Cada vez que el camión deba volver a punto de carga o descarga,
            agrega una nueva vuelta.
            <div className="mt-1 ml-2 list-disc list-inside">
              <li>Si el camión no alcanzó la carga requerida y debe regresar.</li>
              <li>Si el camión lleva peso en exceso y debe regresar.</li>
              <li>Registra cada vuelta aquí.</li>
            </div>
          </div>
          <button
            className="bg-orange-500 text-white px-4 py-1 rounded text-sm sm:text-base"
            onClick={handleAgregarVuelta}
          >
            + Agregar Vuelta
          </button>

          {vueltas.map((v, index) => {
            const esVuelta1 = v.numeroVuelta === 1;

            return (
              <div
                key={v.numeroVuelta}
                className="border rounded p-2 mt-2 bg-gray-50"
              >
                <label className="block font-semibold mb-2 text-sm sm:text-base">
                  <span className="text-orange-700">Vuelta {v.numeroVuelta}</span>
                </label>

                {/* Llegada Punto */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Llegada Punto
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.llegadaPunto.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(
                          index,
                          "llegadaPunto",
                          "hora",
                          e.target.value
                        )
                      }
                      disabled={esVuelta1}
                    />
                    {/* Botón "Ahora" solo en vueltas 2+ */}
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
                      handleChangeVueltaTiempo(
                        index,
                        "llegadaPunto",
                        "comentarios",
                        e.target.value
                      )
                    }
                    disabled={esVuelta1}
                  />
                </div>

                {/* Salida Punto */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Salida Punto
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.salidaPunto.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(
                          index,
                          "salidaPunto",
                          "hora",
                          e.target.value
                        )
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
                      handleChangeVueltaTiempo(
                        index,
                        "salidaPunto",
                        "comentarios",
                        e.target.value
                      )
                    }
                    disabled={esVuelta1}
                  />
                </div>

                {/* Llegada Báscula */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Llegada Báscula
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.llegadaBascula.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(
                          index,
                          "llegadaBascula",
                          "hora",
                          e.target.value
                        )
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
                      handleChangeVueltaTiempo(
                        index,
                        "llegadaBascula",
                        "comentarios",
                        e.target.value
                      )
                    }
                    disabled={esVuelta1}
                  />
                </div>

                {/* Salida Báscula */}
                <div className="mt-2">
                  <label className="block text-sm sm:text-base font-semibold">
                    Salida Báscula
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="time"
                      step="1"
                      className="border p-1 w-full text-sm sm:text-base"
                      value={v.salidaBascula.hora}
                      onChange={(e) =>
                        !esVuelta1 &&
                        handleChangeVueltaTiempo(
                          index,
                          "salidaBascula",
                          "hora",
                          e.target.value
                        )
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
                      handleChangeVueltaTiempo(
                        index,
                        "salidaBascula",
                        "comentarios",
                        e.target.value
                      )
                    }
                    disabled={esVuelta1}
                  />
                </div>
              </div>
            );
          })}
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
