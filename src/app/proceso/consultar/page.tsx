"use client";

import { useState, useEffect } from "react";

/**
 * Parsea un string "HH:mm:ss" y retorna un Date(1970,0,1,HH,mm,ss).
 * Si falla, retorna null.
 */
function parseHora(hhmmss) {
  if (!hhmmss) return null;
  try {
    const [hh, mm, ss] = hhmmss.split(":").map(Number);
    return new Date(1970, 0, 1, hh, mm, ss);
  } catch {
    return null;
  }
}

/**
 * Calcula la diferencia en formato "HH:mm:ss" entre dos objetos Date.
 */
function diffHoras(t1, t2) {
  if (!t1 || !t2) return "";
  let diffMs = t2.getTime() - t1.getTime();
  let diffSegs = Math.floor(diffMs / 1000);
  let diffMins = Math.floor(diffSegs / 60);
  let diffHrs = Math.floor(diffMins / 60);

  diffSegs = diffSegs % 60;
  diffMins = diffMins % 60;
  diffHrs = diffHrs % 24;

  const hh = String(diffHrs).padStart(2, "0");
  const mm = String(diffMins).padStart(2, "0");
  const ss = String(diffSegs).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

/**
 * Convierte un string "HH:mm:ss" a segundos.
 */
function timeStrToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 3) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

/**
 * Convierte segundos a un string "HH:mm:ss".
 */
function secondsToTimeStr(totalSeconds) {
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function DemorasPage() {
  const [demoras, setDemoras] = useState([]);
  const [selectedDemora, setSelectedDemora] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar la lista de registros desde el endpoint /api/demoras
  useEffect(() => {
    async function fetchDemoras() {
      try {
        const res = await fetch("/api/demoras");
        if (!res.ok) {
          console.error("Error al obtener demoras:", res.status);
          return;
        }
        const data = await res.json();
        setDemoras(data);
      } catch (error) {
        console.error("Error de red o parse JSON:", error);
      }
    }
    fetchDemoras();
  }, []);

  const handleOpenModal = (item) => {
    setSelectedDemora(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDemora(null);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen text-gray-800">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">Registros de Demoras</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Regresar
          </button>
          <button
            onClick={() => window.open("/api/demoras/export-excel", "_blank")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="overflow-auto bg-white shadow rounded">
        <table className="min-w-full border text-xs">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Fecha Inicio</th>
              <th className="border px-2 py-1">Tiempo Total</th>
              <th className="border px-2 py-1">Usuario</th>
              <th className="border px-2 py-1">Nro. Transacción</th>
              <th className="border px-2 py-1">Método Carga</th>
              <th className="border px-2 py-1">Operador</th>
              <th className="border px-2 py-1">Bascula Salida</th>
              <th className="border px-2 py-1">Portería Salida</th>
              <th className="border px-2 py-1">Acción</th>
            </tr>
          </thead>
          <tbody>
            {demoras.map((item) => {
              const primer = item.primerProceso || {};
              const segundo = item.segundoProceso || {};
              const tercero = item.tercerProceso || {};
              const final = item.procesoFinal || {};
              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="border px-2 py-1">{item.fechaInicio}</td>
                  <td className="border px-2 py-1">
                    {item.tiempoTotal || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    {item.userName || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    {primer.numeroTransaccion || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    {primer.metodoCarga || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    {segundo.operador || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    {tercero.basculaSalida || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    {final.porteriaSalida || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal con información completa y análisis */}
      {showModal && selectedDemora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-11/12 max-w-4xl rounded shadow-lg p-6 relative overflow-y-auto max-h-screen">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">
              Detalle de la Demora
            </h2>
            <div className="space-y-4 text-sm text-gray-700">
              {/* Información General */}
              <div>
                <h3 className="text-lg font-semibold text-blue-700">
                  Información General
                </h3>
                <p>
                  <strong>Fecha Inicio:</strong> {selectedDemora.fechaInicio}
                </p>
                <p>
                  <strong>Tiempo Total:</strong>{" "}
                  {selectedDemora.tiempoTotal || "-"}
                </p>
                <p>
                  <strong>Usuario:</strong>{" "}
                  {selectedDemora.userName || "-"}
                </p>
              </div>
              {/* Primer Proceso */}
              {selectedDemora.primerProceso && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-700">
                    Primer Proceso
                  </h3>
                  <p>
                    <strong>Número de Transacción:</strong>{" "}
                    {selectedDemora.primerProceso.numeroTransaccion}
                  </p>
                  <p>
                    <strong>Pesador Entrada:</strong>{" "}
                    {selectedDemora.primerProceso.pesadorEntrada}
                  </p>
                  <p>
                    <strong>Portería Entrada:</strong>{" "}
                    {selectedDemora.primerProceso.porteriaEntrada}
                  </p>
                  <p>
                    <strong>Método Carga:</strong>{" "}
                    {selectedDemora.primerProceso.metodoCarga}
                  </p>
                  <p>
                    <strong>Punto Despacho:</strong>{" "}
                    {selectedDemora.primerProceso.puntoDespacho}
                  </p>
                  <p>
                    <strong>Báscula Entrada:</strong>{" "}
                    {selectedDemora.primerProceso.basculaEntrada}
                  </p>
                  <p>
                    <strong>Tiempo Prechequeo:</strong>{" "}
                    {selectedDemora.primerProceso.tiempoPrechequeo || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Scanner:</strong>{" "}
                    {selectedDemora.primerProceso.tiempoScanner || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Autorización:</strong>{" "}
                    {selectedDemora.primerProceso.tiempoAutorizacion || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Ingreso Planta:</strong>{" "}
                    {selectedDemora.primerProceso.tiempoIngresoPlanta || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Entrada Báscula:</strong>{" "}
                    {selectedDemora.primerProceso.tiempoEntradaBascula || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Salida Báscula:</strong>{" "}
                    {selectedDemora.primerProceso.tiempoSalidaBascula || "-"}
                  </p>
                </div>
              )}
              {/* Segundo Proceso */}
              {selectedDemora.segundoProceso && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-700">
                    Segundo Proceso
                  </h3>
                  <p>
                    <strong>Operador:</strong>{" "}
                    {selectedDemora.segundoProceso.operador}
                  </p>
                  <p>
                    <strong>Enlonador:</strong>{" "}
                    {selectedDemora.segundoProceso.enlonador}
                  </p>
                  <p>
                    <strong>Modelo Equipo:</strong>{" "}
                    {selectedDemora.segundoProceso.modeloEquipo}
                  </p>
                  <p>
                    <strong>Personal Asignado:</strong>{" "}
                    {selectedDemora.segundoProceso.personalAsignado}
                  </p>
                  <p>
                    <strong>Tiempo Llegada Punto:</strong>{" "}
                    {selectedDemora.segundoProceso.tiempoLlegadaPunto || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Llegada Operador:</strong>{" "}
                    {selectedDemora.segundoProceso.tiempoLlegadaOperador || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Llegada Enlonador:</strong>{" "}
                    {selectedDemora.segundoProceso.tiempoLlegadaEnlonador || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Llegada Equipo:</strong>{" "}
                    {selectedDemora.segundoProceso.tiempoLlegadaEquipo || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Inicio Carga:</strong>{" "}
                    {selectedDemora.segundoProceso.tiempoInicioCarga || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Termina Carga:</strong>{" "}
                    {selectedDemora.segundoProceso.tiempoTerminaCarga || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Salida Punto:</strong>{" "}
                    {selectedDemora.segundoProceso.tiempoSalidaPunto || "-"}
                  </p>
                </div>
              )}
              {/* Tercer Proceso */}
              {selectedDemora.tercerProceso && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-700">
                    Tercer Proceso
                  </h3>
                  <p>
                    <strong>Báscula Salida:</strong>{" "}
                    {selectedDemora.tercerProceso.basculaSalida}
                  </p>
                  <p>
                    <strong>Pesador Salida:</strong>{" "}
                    {selectedDemora.tercerProceso.pesadorSalida}
                  </p>
                  <p>
                    <strong>Tiempo Llegada Báscula:</strong>{" "}
                    {selectedDemora.tercerProceso.tiempoLlegadaBascula || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Entrada Báscula:</strong>{" "}
                    {selectedDemora.tercerProceso.tiempoEntradaBascula || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Salida Báscula:</strong>{" "}
                    {selectedDemora.tercerProceso.tiempoSalidaBascula || "-"}
                  </p>
                  {/* Vueltas */}
                  {selectedDemora.tercerProceso.vueltas &&
                    selectedDemora.tercerProceso.vueltas.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-semibold">Vueltas:</h4>
                        <ul className="list-disc list-inside">
                          {selectedDemora.tercerProceso.vueltas.map((vuelta) => (
                            <li key={vuelta.id}>
                              <p>
                                <strong>Número:</strong> {vuelta.numeroVuelta}
                              </p>
                              <p>
                                <strong>Tiempo Llegada Punto:</strong>{" "}
                                {vuelta.tiempoLlegadaPunto || "-"}
                              </p>
                              <p>
                                <strong>Tiempo Salida Punto:</strong>{" "}
                                {vuelta.tiempoSalidaPunto || "-"}
                              </p>
                              <p>
                                <strong>Tiempo Llegada Báscula:</strong>{" "}
                                {vuelta.tiempoLlegadaBascula || "-"}
                              </p>
                              <p>
                                <strong>Tiempo Entrada Báscula:</strong>{" "}
                                {vuelta.tiempoEntradaBascula || "-"}
                              </p>
                              <p>
                                <strong>Tiempo Salida Báscula:</strong>{" "}
                                {vuelta.tiempoSalidaBascula || "-"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
              {/* Proceso Final */}
              {selectedDemora.procesoFinal && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-700">
                    Proceso Final
                  </h3>
                  <p>
                    <strong>Portería Salida:</strong>{" "}
                    {selectedDemora.procesoFinal.porteriaSalida}
                  </p>
                  <p>
                    <strong>Tiempo Salida Planta:</strong>{" "}
                    {selectedDemora.procesoFinal.tiempoSalidaPlanta || "-"}
                  </p>
                  <p>
                    <strong>Tiempo Llegada Portería:</strong>{" "}
                    {selectedDemora.procesoFinal.tiempoLlegadaPorteria || "-"}
                  </p>
                </div>
              )}

              {/* Análisis de Intervalos entre procesos */}
              {(() => {
                // Extraer tiempos del primer proceso
                const p = selectedDemora.primerProceso || {};
                const s = selectedDemora.segundoProceso || {};
                const t = selectedDemora.tercerProceso || {};
                const f = selectedDemora.procesoFinal || {};

                // Calcular intervalos (se asume que los campos de tiempo usados en los cálculos existen y están en formato "HH:mm:ss")
                const diffPreToScan = diffHoras(
                  parseHora(p.tiempoPrechequeo),
                  parseHora(p.tiempoScanner)
                );
                const diffScanToAuto = diffHoras(
                  parseHora(p.tiempoScanner),
                  parseHora(p.tiempoAutorizacion)
                );
                const diffAutoToIng = diffHoras(
                  parseHora(p.tiempoAutorizacion),
                  parseHora(p.tiempoIngresoPlanta)
                );
                const diffIngToEnt = diffHoras(
                  parseHora(p.tiempoIngresoPlanta),
                  parseHora(p.tiempoEntradaBascula)
                );
                const diffEntToSal = diffHoras(
                  parseHora(p.tiempoEntradaBascula),
                  parseHora(p.tiempoSalidaBascula)
                );
                const diffLlegPuntoToOp = diffHoras(
                  parseHora(s.tiempoLlegadaPunto),
                  parseHora(s.tiempoLlegadaOperador)
                );
                const diffOpToEnl = diffHoras(
                  parseHora(s.tiempoLlegadaOperador),
                  parseHora(s.tiempoLlegadaEnlonador)
                );
                const diffEnlToEq = diffHoras(
                  parseHora(s.tiempoLlegadaEnlonador),
                  parseHora(s.tiempoLlegadaEquipo)
                );
                const diffEqToIni = diffHoras(
                  parseHora(s.tiempoLlegadaEquipo),
                  parseHora(s.tiempoInicioCarga)
                );
                const diffIniToTerm = diffHoras(
                  parseHora(s.tiempoInicioCarga),
                  parseHora(s.tiempoTerminaCarga)
                );
                const diffTermToSal = diffHoras(
                  parseHora(s.tiempoTerminaCarga),
                  parseHora(s.tiempoSalidaPunto)
                );
                const diffTT = diffHoras(
                  parseHora(t.tiempoEntradaBascula),
                  parseHora(t.tiempoSalidaBascula)
                );
                const diffFinal = diffHoras(
                  parseHora(f.tiempoLlegadaPorteria),
                  parseHora(f.tiempoSalidaPlanta)
                );

                // Arreglo de intervalos con propiedades definidas
                const intervals = [
                  {
                    name: "Prechequeo a Scanner",
                    timeStr: diffPreToScan,
                    seconds: timeStrToSeconds(diffPreToScan)
                  },
                  {
                    name: "Scanner a Autorización",
                    timeStr: diffScanToAuto,
                    seconds: timeStrToSeconds(diffScanToAuto)
                  },
                  {
                    name: "Autorización a Ingreso Planta",
                    timeStr: diffAutoToIng,
                    seconds: timeStrToSeconds(diffAutoToIng)
                  },
                  {
                    name: "Ingreso Planta a Entrada Báscula",
                    timeStr: diffIngToEnt,
                    seconds: timeStrToSeconds(diffIngToEnt)
                  },
                  {
                    name: "Entrada Báscula a Salida Báscula (P1)",
                    timeStr: diffEntToSal,
                    seconds: timeStrToSeconds(diffEntToSal)
                  },
                  {
                    name: "Llegada Punto a Operador",
                    timeStr: diffLlegPuntoToOp,
                    seconds: timeStrToSeconds(diffLlegPuntoToOp)
                  },
                  {
                    name: "Operador a Enlonador",
                    timeStr: diffOpToEnl,
                    seconds: timeStrToSeconds(diffOpToEnl)
                  },
                  {
                    name: "Enlonador a Llegada Equipo",
                    timeStr: diffEnlToEq,
                    seconds: timeStrToSeconds(diffEnlToEq)
                  },
                  {
                    name: "Llegada Equipo a Inicio Carga",
                    timeStr: diffEqToIni,
                    seconds: timeStrToSeconds(diffEqToIni)
                  },
                  {
                    name: "Inicio a Termina Carga",
                    timeStr: diffIniToTerm,
                    seconds: timeStrToSeconds(diffIniToTerm)
                  },
                  {
                    name: "Termina Carga a Salida Punto",
                    timeStr: diffTermToSal,
                    seconds: timeStrToSeconds(diffTermToSal)
                  },
                  {
                    name: "Entrada a Salida Báscula (P3)",
                    timeStr: diffTT,
                    seconds: timeStrToSeconds(diffTT)
                  },
                  {
                    name: "Llegada Portería a Salida Planta",
                    timeStr: diffFinal,
                    seconds: timeStrToSeconds(diffFinal)
                  }
                ];

                // Sumar todos los segundos de los intervalos
                const totalIntervalSeconds = intervals.reduce(
                  (acc, interval) => acc + interval.seconds,
                  0
                );
                const totalIntervalStr = secondsToTimeStr(totalIntervalSeconds);

                // Determinar el intervalo con mayor retraso
                const maxInterval = intervals.reduce(
                  (max, interval) =>
                    interval.seconds > max.seconds ? interval : max,
                  { name: "", timeStr: "", seconds: 0 }
                );

                return (
                  <div className="p-4 border border-orange-500 bg-orange-50 rounded">
                    <h3 className="text-lg font-semibold text-orange-600">
                      Intervalos entre Procesos
                    </h3>
                    <ul className="list-disc list-inside">
                      {intervals.map((intv, idx) => (
                        <li key={idx}>
                          <strong>{intv.name}:</strong> {intv.timeStr || "-"}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <h4 className="font-semibold">Análisis de Intervalos</h4>
                      <p>
                        <strong>Total acumulado de intervalos:</strong>{" "}
                        {totalIntervalStr}
                      </p>
                      <p>
                        <strong>Actividad con mayor retraso:</strong>{" "}
                        {maxInterval.name} con {maxInterval.timeStr}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        Se observa que la actividad{" "}
                        <strong>{maxInterval.name}</strong> tuvo el mayor
                        retraso. Se recomienda revisar este proceso para
                        identificar y corregir posibles cuellos de botella.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
