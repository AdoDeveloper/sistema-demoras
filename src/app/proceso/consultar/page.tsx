"use client";

import { useEffect, useState } from "react";

/** 
 * Parsea un string "HH:mm:ss" y retorna un Date(1970,0,1,HH,mm,ss).
 * Si falla, retorna null.
 */
function parseHora(hhmmss) {
  if (!hhmmss) return null;
  try {
    const [hh, mm, ss] = hhmmss.split(":").map((v) => parseInt(v, 10));
    return new Date(1970, 0, 1, hh, mm, ss);
  } catch {
    return null;
  }
}

/**
 * Calcula la diferencia en formato HH:mm:ss entre 2 Date(1970,0,1,HH,mm,ss).
 */
function diffHoras(t1, t2) {
  if (!t1 || !t2) return "";
  let diffMs = t2.getTime() - t1.getTime();
  let diffSegs = Math.floor(diffMs / 1000);
  let diffMins = Math.floor(diffSegs / 60);
  let diffHoras = Math.floor(diffMins / 60);

  diffSegs = diffSegs % 60;
  diffMins = diffMins % 60;
  diffHoras = diffHoras % 24;

  const hh = String(diffHoras).padStart(2, "0");
  const mm = String(diffMins).padStart(2, "0");
  const ss = String(diffSegs).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

/**
 * Formatea una vuelta para mostrarla en texto normal.
 * Por cada propiedad (excepto "numeroVuelta"), si el valor es un objeto y tiene la propiedad "hora",
 * se muestra esa hora; de lo contrario se muestra "N/A".
 */
function formatVuelta(vuelta) {
  if (typeof vuelta !== "object" || vuelta === null) {
    return String(vuelta);
  }
  const parts = [];
  for (const key in vuelta) {
    if (key === "numeroVuelta") continue; // No mostrar el campo numeroVuelta
    let displayValue = "N/A";
    const val = vuelta[key];
    if (typeof val === "object" && val !== null) {
      displayValue = val.hora || "N/A";
    } else if (val !== undefined && val !== null && val !== "") {
      displayValue = val;
    }
    parts.push(`${key}: ${displayValue}`);
  }
  return parts.join(", ");
}

export default function DemorasPage() {
  const [demoras, setDemoras] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDemora, setSelectedDemora] = useState(null);

  // Cargar la lista de demoras desde la API
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

  // Botón para exportar Excel
  const handleExportExcel = () => {
    window.open("/api/demoras/export-excel", "_blank");
  };

  // Botón para regresar al Dashboard
  const handleRegresarDashboard = () => {
    window.location.href = "/";
  };

  // Abrir modal con detalle del registro
  const handleOpenModal = (item) => {
    setSelectedDemora(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDemora(null);
  };

  return (
    <div className="p-4 bg-slate-200 min-h-screen text-slate-800">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Registros de Demoras</h1>
        <button
          onClick={handleRegresarDashboard}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Regresar
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={handleExportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Exportar Excel
        </button>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="overflow-auto bg-white shadow rounded">
        <table className="min-w-full border text-xs">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Fecha Inicio</th>
              <th className="border px-2 py-1">Tiempo Total</th>
              {/* Primer Proceso */}
              <th className="border px-2 py-1">Terminal</th>
              <th className="border px-2 py-1">Cliente</th>
              <th className="border px-2 py-1">Placa</th>
              <th className="border px-2 py-1">Remolque</th>
              <th className="border px-2 py-1">Ejes</th>
              <th className="border px-2 py-1">Pesador</th>
              <th className="border px-2 py-1">Peso Inicial</th>
              <th className="border px-2 py-1">Producto</th>
              <th className="border px-2 py-1">Punto Despacho</th>
              <th className="border px-2 py-1">Báscula Entrada</th>
              <th className="border px-2 py-1">Tipo Carga</th>
              <th className="border px-2 py-1">Método Carga</th>

              <th className="border px-2 py-1">Prechequeo</th>
              <th className="border px-2 py-1">Scanner</th>
              <th className="border px-2 py-1">Autorizado</th>
              <th className="border px-2 py-1">Ingreso Planta</th>
              <th className="border px-2 py-1">Entrada Báscula</th>
              <th className="border px-2 py-1">Salida Báscula</th>

              {/* Segundo Proceso */}
              <th className="border px-2 py-1">Enlonador</th>
              <th className="border px-2 py-1">Operador</th>
              <th className="border px-2 py-1">Personal</th>
              <th className="border px-2 py-1">Modelo Equipo</th>

              <th className="border px-2 py-1">Llegada Punto</th>
              <th className="border px-2 py-1">Llegada Operador</th>
              <th className="border px-2 py-1">Llegada Enlonador</th>
              <th className="border px-2 py-1">Llegada Equipo</th>
              <th className="border px-2 py-1">Inicio Carga</th>
              <th className="border px-2 py-1">Termina Carga</th>
              <th className="border px-2 py-1">Salida Punto</th>

              {/* Tercer Proceso */}
              <th className="border px-2 py-1">Pesador Salida</th>
              <th className="border px-2 py-1">Báscula Salida</th>
              <th className="border px-2 py-1">Peso Neto</th>

              <th className="border px-2 py-1">Entrada Báscula</th>
              <th className="border px-2 py-1">Salida Báscula</th>

              {/* Vueltas */}
              <th className="border px-2 py-1">Vueltas</th>

              {/* Proceso Final */}
              <th className="border px-2 py-1">Llegada Terminal</th>
              <th className="border px-2 py-1">Salida Planta</th>

              <th className="border px-2 py-1">Acción</th>
            </tr>
          </thead>
          <tbody>
            {demoras.map((item) => {
              const d = item.data || {};
              const p = d.primerProceso || {};
              const s = d.segundoProceso || {};
              const t = d.tercerProceso || {};
              const f = d.procesoFinal || {};

              // Tiempos Primer Proceso
              const tpPre = p.tiempoPrechequeo || {};
              const tpScan = p.tiempoScanner || {};
              const tpAuto = p.tiempoAutorizacion || {};
              const tpIng = p.tiempoIngresoPlanta || {};
              const tpEnt = p.tiempoEntradaBascula || {};
              const tpSal = p.tiempoSalidaBascula || {};

              // Tiempos Segundo Proceso
              const tsLlegPunto = s.tiempoLlegadaPunto || {};
              const tsLlegOp = s.tiempoLlegadaOperador || {};
              const tsLlegEnl = s.tiempoLlegadaEnlonador || {};
              const tsLlegEq = s.tiempoLlegadaEquipo || {};
              const tsIni = s.tiempoInicioCarga || {};
              const tsTerm = s.tiempoTerminaCarga || {};
              const tsSal = s.tiempoSalidaPunto || {};

              // Tiempos Tercer Proceso
              const ttEnt = t.tiempoEntradaBascula || {};
              const ttSal = t.tiempoSalidaBascula || {};

              // Tiempos Proceso Final
              const tfLleg = f.tiempoLlegadaTerminal || {};
              const tfSal = f.tiempoSalidaPlanta || {};

              // Calcular "tiempo total" (entre prechequeo y salida de planta)
              const prechequeoDate = parseHora(tpPre.hora);
              const salidaPlantaDate = parseHora(tfSal.hora);
              const tiempoTotal = diffHoras(prechequeoDate, salidaPlantaDate);

              return (
                <tr key={item.id} className="border-b hover:bg-slate-100">
                  <td className="border px-2 py-1">{d.fechaInicio}</td>
                  <td className="border px-2 py-1">{tiempoTotal}</td>

                  {/* Primer Proceso */}
                  <td className="border px-2 py-1">{p.terminal}</td>
                  <td className="border px-2 py-1">{p.cliente}</td>
                  <td className="border px-2 py-1">{p.placa}</td>
                  <td className="border px-2 py-1">{p.remolque}</td>
                  <td className="border px-2 py-1">{p.ejes}</td>
                  <td className="border px-2 py-1">{p.pesador}</td>
                  <td className="border px-2 py-1">{p.pesoInicial}</td>
                  <td className="border px-2 py-1">{p.tipoProducto}</td>
                  <td className="border px-2 py-1">{p.puntoDespacho}</td>
                  <td className="border px-2 py-1">{p.basculaEntrada}</td>
                  <td className="border px-2 py-1">{p.tipoCarga}</td>
                  <td className="border px-2 py-1">{p.metodoCarga}</td>

                  <td className="border px-2 py-1">{tpPre.hora}</td>
                  <td className="border px-2 py-1">{tpScan.hora}</td>
                  <td className="border px-2 py-1">{tpAuto.hora}</td>
                  <td className="border px-2 py-1">{tpIng.hora}</td>
                  <td className="border px-2 py-1">{tpEnt.hora}</td>
                  <td className="border px-2 py-1">{tpSal.hora}</td>

                  {/* Segundo Proceso */}
                  <td className="border px-2 py-1">{s.enlonador}</td>
                  <td className="border px-2 py-1">{s.operador}</td>
                  <td className="border px-2 py-1">{s.personalAsignado}</td>
                  <td className="border px-2 py-1">{s.modeloEquipo}</td>

                  <td className="border px-2 py-1">{tsLlegPunto.hora}</td>
                  <td className="border px-2 py-1">{tsLlegOp.hora}</td>
                  <td className="border px-2 py-1">{tsLlegEnl.hora}</td>
                  <td className="border px-2 py-1">{tsLlegEq.hora}</td>
                  <td className="border px-2 py-1">{tsIni.hora}</td>
                  <td className="border px-2 py-1">{tsTerm.hora}</td>
                  <td className="border px-2 py-1">{tsSal.hora}</td>

                  {/* Tercer Proceso */}
                  <td className="border px-2 py-1">{t.pesadorSalida}</td>
                  <td className="border px-2 py-1">{t.basculaSalida}</td>
                  <td className="border px-2 py-1">{t.pesoNeto}</td>

                  <td className="border px-2 py-1">{ttEnt.hora}</td>
                  <td className="border px-2 py-1">{ttSal.hora}</td>

                  {/* Vueltas */}
                  <td className="border px-2 py-1 text-center">
                    {Array.isArray(t.vueltas) && t.vueltas.length > 0 ? (
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                        {t.vueltas.length}
                      </span>
                    ) : (
                      "0"
                    )}
                  </td>

                  {/* Proceso Final */}
                  <td className="border px-2 py-1">{tfLleg.hora}</td>
                  <td className="border px-2 py-1">{tfSal.hora}</td>

                  {/* Acción */}
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

      {/* Modal de detalle */}
      {showModal && selectedDemora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-11/12 max-w-2xl rounded shadow-lg p-6 relative overflow-y-auto max-h-screen">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">
              Detalle de la Demora
            </h2>
            {selectedDemora && selectedDemora.data && (() => {
              const d = selectedDemora.data;
              const p = d.primerProceso || {};
              const s = d.segundoProceso || {};
              const t = d.tercerProceso || {};
              const f = d.procesoFinal || {};

              const tpPre = p.tiempoPrechequeo || {};
              const tpScan = p.tiempoScanner || {};
              const tpAuto = p.tiempoAutorizacion || {};
              const tpIng = p.tiempoIngresoPlanta || {};
              const tpEnt = p.tiempoEntradaBascula || {};
              const tpSal = p.tiempoSalidaBascula || {};

              const tsLlegPunto = s.tiempoLlegadaPunto || {};
              const tsLlegOp = s.tiempoLlegadaOperador || {};
              const tsLlegEnl = s.tiempoLlegadaEnlonador || {};
              const tsLlegEq = s.tiempoLlegadaEquipo || {};
              const tsIni = s.tiempoInicioCarga || {};
              const tsTerm = s.tiempoTerminaCarga || {};
              const tsSal = s.tiempoSalidaPunto || {};

              const ttEnt = t.tiempoEntradaBascula || {};
              const ttSal = t.tiempoSalidaBascula || {};

              const tfLleg = f.tiempoLlegadaTerminal || {};
              const tfSal = f.tiempoSalidaPlanta || {};

              // Calcular tiempo total (entre prechequeo y salida de planta)
              const prechequeoDate = parseHora(tpPre.hora);
              const salidaPlantaDate = parseHora(tfSal.hora);
              const tiempoTotal = diffHoras(prechequeoDate, salidaPlantaDate);

              // Calcular intervalos en Primer Proceso
              const diffPreToScan = diffHoras(parseHora(tpPre.hora), parseHora(tpScan.hora));
              const diffScanToAuto = diffHoras(parseHora(tpScan.hora), parseHora(tpAuto.hora));
              const diffAutoToIng = diffHoras(parseHora(tpAuto.hora), parseHora(tpIng.hora));
              const diffIngToEnt = diffHoras(parseHora(tpIng.hora), parseHora(tpEnt.hora));
              const diffEntToSal = diffHoras(parseHora(tpEnt.hora), parseHora(tpSal.hora));

              // Calcular intervalos en Segundo Proceso
              const diffLlegPuntoToOp = diffHoras(parseHora(tsLlegPunto.hora), parseHora(tsLlegOp.hora));
              const diffOpToEnl = diffHoras(parseHora(tsLlegOp.hora), parseHora(tsLlegEnl.hora));
              const diffEnlToEq = diffHoras(parseHora(tsLlegEnl.hora), parseHora(tsLlegEq.hora));
              const diffEqToIni = diffHoras(parseHora(tsLlegEq.hora), parseHora(tsIni.hora));
              const diffIniToTerm = diffHoras(parseHora(tsIni.hora), parseHora(tsTerm.hora));
              const diffTermToSal = diffHoras(parseHora(tsTerm.hora), parseHora(tsSal.hora));

              // Calcular intervalo en Tercer Proceso
              const diffTT = diffHoras(parseHora(ttEnt.hora), parseHora(ttSal.hora));

              // Calcular intervalo en Proceso Final
              const diffFinal = diffHoras(parseHora(tfLleg.hora), parseHora(tfSal.hora));

              return (
                <div className="space-y-4 text-sm text-slate-700">
                  {/* Información General */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">Información General</h3>
                    <p>
                      <strong>Fecha Inicio:</strong> {d.fechaInicio}
                    </p>
                    <p>
                      <strong>Tiempo Total:</strong> {tiempoTotal}
                    </p>
                  </div>
                  {/* Primer Proceso */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">Primer Proceso</h3>
                    <p>
                      <strong>Terminal:</strong> {p.terminal}
                    </p>
                    <p>
                      <strong>Cliente:</strong> {p.cliente}
                    </p>
                    <p>
                      <strong>Placa:</strong> {p.placa}
                    </p>
                    <p>
                      <strong>Remolque:</strong> {p.remolque}
                    </p>
                    <p>
                      <strong>Ejes:</strong> {p.ejes}
                    </p>
                    <p>
                      <strong>Pesador:</strong> {p.pesador}
                    </p>
                    <p>
                      <strong>Peso Inicial:</strong> {p.pesoInicial}
                    </p>
                    <p>
                      <strong>Producto:</strong> {p.tipoProducto}
                    </p>
                    <p>
                      <strong>Punto Despacho:</strong> {p.puntoDespacho}
                    </p>
                    <p>
                      <strong>Báscula Entrada:</strong> {p.basculaEntrada}
                    </p>
                    <p>
                      <strong>Tipo Carga:</strong> {p.tipoCarga}
                    </p>
                    <p>
                      <strong>Método Carga:</strong> {p.metodoCarga}
                    </p>
                    <div className="mt-2">
                      <h4 className="font-semibold">Tiempos:</h4>
                      <p>
                        <strong>Prechequeo:</strong> {tpPre.hora || "N/A"}{" "}
                        {tpPre.comentarios && <span>({tpPre.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Scanner:</strong> {tpScan.hora || "N/A"}{" "}
                        {tpScan.comentarios && <span>({tpScan.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Autorizado:</strong> {tpAuto.hora || "N/A"}{" "}
                        {tpAuto.comentarios && <span>({tpAuto.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Ingreso Planta:</strong> {tpIng.hora || "N/A"}{" "}
                        {tpIng.comentarios && <span>({tpIng.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Entrada Báscula:</strong> {tpEnt.hora || "N/A"}{" "}
                        {tpEnt.comentarios && <span>({tpEnt.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Salida Báscula:</strong> {tpSal.hora || "N/A"}{" "}
                        {tpSal.comentarios && <span>({tpSal.comentarios})</span>}
                      </p>
                    </div>
                  </div>
                  {/* Segundo Proceso */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">Segundo Proceso</h3>
                    <p>
                      <strong>Enlonador:</strong> {s.enlonador}
                    </p>
                    <p>
                      <strong>Operador:</strong> {s.operador}
                    </p>
                    <p>
                      <strong>Personal Asignado:</strong> {s.personalAsignado}
                    </p>
                    <p>
                      <strong>Modelo Equipo:</strong> {s.modeloEquipo}
                    </p>
                    <div className="mt-2">
                      <h4 className="font-semibold">Tiempos:</h4>
                      <p>
                        <strong>Llegada Punto:</strong> {tsLlegPunto.hora || "N/A"}{" "}
                        {tsLlegPunto.comentarios && <span>({tsLlegPunto.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Llegada Operador:</strong> {tsLlegOp.hora || "N/A"}{" "}
                        {tsLlegOp.comentarios && <span>({tsLlegOp.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Llegada Enlonador:</strong> {tsLlegEnl.hora || "N/A"}{" "}
                        {tsLlegEnl.comentarios && <span>({tsLlegEnl.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Llegada Equipo:</strong> {tsLlegEq.hora || "N/A"}{" "}
                        {tsLlegEq.comentarios && <span>({tsLlegEq.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Inicio Carga:</strong> {tsIni.hora || "N/A"}{" "}
                        {tsIni.comentarios && <span>({tsIni.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Termina Carga:</strong> {tsTerm.hora || "N/A"}{" "}
                        {tsTerm.comentarios && <span>({tsTerm.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Salida Punto:</strong> {tsSal.hora || "N/A"}{" "}
                        {tsSal.comentarios && <span>({tsSal.comentarios})</span>}
                      </p>
                    </div>
                  </div>
                  {/* Tercer Proceso */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">Tercer Proceso</h3>
                    <p>
                      <strong>Pesador Salida:</strong> {t.pesadorSalida}
                    </p>
                    <p>
                      <strong>Báscula Salida:</strong> {t.basculaSalida}
                    </p>
                    <p>
                      <strong>Peso Neto:</strong> {t.pesoNeto}
                    </p>
                    <div className="mt-2">
                      <h4 className="font-semibold">Tiempos:</h4>
                      <p>
                        <strong>Entrada Báscula:</strong> {ttEnt.hora || "N/A"}{" "}
                        {ttEnt.comentarios && <span>({ttEnt.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Salida Báscula:</strong> {ttSal.hora || "N/A"}{" "}
                        {ttSal.comentarios && <span>({ttSal.comentarios})</span>}
                      </p>
                    </div>
                  </div>
                  {/* Vueltas */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">Vueltas</h3>
                    {Array.isArray(t.vueltas) && t.vueltas.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {t.vueltas.map((vuelta, index) => (
                          <li key={index}>{formatVuelta(vuelta)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No hay vueltas registradas.</p>
                    )}
                  </div>
                  {/* Proceso Final */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">Proceso Final</h3>
                    <div className="mt-2">
                      <h4 className="font-semibold">Tiempos:</h4>
                      <p>
                        <strong>Llegada Terminal:</strong> {tfLleg.hora || "N/A"}{" "}
                        {tfLleg.comentarios && <span>({tfLleg.comentarios})</span>}
                      </p>
                      <p>
                        <strong>Salida Planta:</strong> {tfSal.hora || "N/A"}{" "}
                        {tfSal.comentarios && <span>({tfSal.comentarios})</span>}
                      </p>
                    </div>
                  </div>
                  {/* Intervalos entre Procesos */}
                  <div className="p-4 border border-orange-500 bg-orange-50 rounded">
                    <h3 className="text-lg font-semibold text-orange-600">Intervalos entre Procesos</h3>
                    <div className="mt-2">
                      <h4 className="font-semibold text-orange-600">Primer Proceso</h4>
                      <ul className="list-disc list-inside">
                        <li><strong>Prechequeo a Scanner:</strong> {diffPreToScan || '-'}</li>
                        <li><strong>Scanner a Autorizado:</strong> {diffScanToAuto || '-'}</li>
                        <li><strong>Autorizado a Ingreso Planta:</strong> {diffAutoToIng || '-'}</li>
                        <li><strong>Ingreso Planta a Entrada Báscula:</strong> {diffIngToEnt || '-'}</li>
                        <li><strong>Entrada Báscula a Salida Báscula:</strong> {diffEntToSal || '-'}</li>
                      </ul>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-semibold text-orange-600">Segundo Proceso</h4>
                      <ul className="list-disc list-inside">
                        <li><strong>Llegada Punto a Operador:</strong> {diffLlegPuntoToOp || '-'}</li>
                        <li><strong>Operador a Enlonador:</strong> {diffOpToEnl || '-'}</li>
                        <li><strong>Enlonador a Equipo:</strong> {diffEnlToEq || '-'}</li>
                        <li><strong>Equipo a Inicio Carga:</strong> {diffEqToIni || '-'}</li>
                        <li><strong>Inicio a Termina Carga:</strong> {diffIniToTerm || '-'}</li>
                        <li><strong>Termina Carga a Salida Punto:</strong> {diffTermToSal || '-'}</li>
                      </ul>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-semibold text-orange-600">Tercer Proceso</h4>
                      <ul className="list-disc list-inside">
                        <li><strong>Entrada a Salida Báscula:</strong> {diffTT || '-'}</li>
                      </ul>
                    </div>
                    <div className="mt-2">
                      <h4 className="font-semibold text-orange-600">Proceso Final</h4>
                      <ul className="list-disc list-inside">
                        <li><strong>Llegada Terminal a Salida Planta:</strong> {diffFinal || '-'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
