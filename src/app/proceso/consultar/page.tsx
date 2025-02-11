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
 * Calcula la diferencia en horas (decimal) entre 2 Date(1970,0,1,HH,mm,ss).
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

    const hh = String(diffHoras).padStart(2, '0');
    const mm = String(diffMins).padStart(2, '0');
    const ss = String(diffSegs).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
}

export default function DemorasPage() {
  const [demoras, setDemoras] = useState([]);

  // Para el modal
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

  // Botones para exportar
  const handleExportCSV = () => {
    window.open("/api/demoras/export-csv", "_blank");
  };

  const handleExportExcel = () => {
    window.open("/api/demoras/export-excel", "_blank");
  };

  // Botón "Regresar al Dashboard"
  const handleRegresarDashboard = () => {
    window.location.href = "/";
  };

  // Función para abrir modal al hacer clic en una fila
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
        {/* Botón para regresar al Dashboard */}
        <button
          onClick={handleRegresarDashboard}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Regresar
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        {/* <button
          onClick={handleExportCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Exportar CSV
        </button> */}
        <button
          onClick={handleExportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Exportar Excel
        </button>
      </div>

      {/* Tabla con scroll horizontal para acomodar todas las columnas */}
      <div className="overflow-auto text-cyan-900 bg-white">
        <table className="min-w-max border text-xs">
          <thead className="bg-gray-200">
            <tr>
              {/* Fecha de Inicio */}
              <th className="border px-2 py-1">Fecha Inicio</th>
              {/* Tiempo Total */}
              <th className="border px-2 py-1">Tiempo Total</th>

              {/* ---------- Primer Proceso ---------- */}
              <th className="border px-2 py-1">Terminal</th>
              <th className="border px-2 py-1">Cliente</th>
              <th className="border px-2 py-1">Placa</th>
              <th className="border px-2 py-1">Remolque</th>
              <th className="border px-2 py-1">Ejes</th>
              <th className="border px-2 py-1">Pesador</th>
              <th className="border px-2 py-1">Peso Inicial</th>
              <th className="border px-2 py-1">Producto</th>
              <th className="border px-2 py-1">Punto Despacho</th>
              <th className="border px-2 py-1">Bascula Entrada</th>
              <th className="border px-2 py-1">Tipo Carga</th>
              <th className="border px-2 py-1">Metodo Carga</th>

              {/* Tiempos Primer Proceso */}
              <th className="border px-2 py-1">Prechequeo</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Scanner</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Autorizado</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Ingreso Planta</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Entrada Bascula</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Salida Bascula</th>
              <th className="border px-2 py-1">Coment</th>

              {/* ---------- Segundo Proceso ---------- */}
              <th className="border px-2 py-1">Enlonador</th>
              <th className="border px-2 py-1">Operador</th>
              <th className="border px-2 py-1">Personal</th>
              <th className="border px-2 py-1">Modelo Equipo</th>

              <th className="border px-2 py-1">Lleg Punto</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Lleg Operador</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Lleg Enlonador</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Lleg Equipo</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Ini Carga</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Term Carga</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Salida Punto</th>
              <th className="border px-2 py-1">Coment</th>

              {/* ---------- Tercer Proceso ---------- */}
              <th className="border px-2 py-1">Pesador Salida</th>
              <th className="border px-2 py-1">Bascula Salida</th>
              <th className="border px-2 py-1">Peso Neto</th>

              <th className="border px-2 py-1">Entrada Bascula(T)</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Salida Bascula(T)</th>
              <th className="border px-2 py-1">Coment</th>

              <th className="border px-2 py-1">Vueltas</th>

              {/* ---------- Proceso Final ---------- */}
              <th className="border px-2 py-1">Lleg Terminal</th>
              <th className="border px-2 py-1">Coment</th>
              <th className="border px-2 py-1">Salida Planta</th>
              <th className="border px-2 py-1">Coment</th>

              {/* Botón: "Ver Detalle" */}
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

              // Tiempos Primer
              const tpPre = p.tiempoPrechequeo || {};
              const tpScan = p.tiempoScanner || {};
              const tpAuto = p.tiempoAutorizacion || {};
              const tpIng = p.tiempoIngresoPlanta || {};
              const tpEnt = p.tiempoEntradaBascula || {};
              const tpSal = p.tiempoSalidaBascula || {};

              // Tiempos Segundo
              const tsLlegPunto = s.tiempoLlegadaPunto || {};
              const tsLlegOp = s.tiempoLlegadaOperador || {};
              const tsLlegEnl = s.tiempoLlegadaEnlonador || {};
              const tsLlegEq = s.tiempoLlegadaEquipo || {};
              const tsIni = s.tiempoInicioCarga || {};
              const tsTerm = s.tiempoTerminaCarga || {};
              const tsSal = s.tiempoSalidaPunto || {};

              // Tiempos Tercer
              const ttEnt = t.tiempoEntradaBascula || {};
              const ttSal = t.tiempoSalidaBascula || {};

              // Tiempos Final
              const tfLleg = f.tiempoLlegadaTerminal || {};
              const tfSal = f.tiempoSalidaPlanta || {};

              // Calcular "tiempo total" en horas
              // => entre "tiempoPrechequeo.hora" y "tiempoSalidaPlanta.hora"
              const prechequeoDate = parseHora(tpPre.hora);
              const salidaPlantaDate = parseHora(tfSal.hora);
              const tiempoTotal = diffHoras(prechequeoDate, salidaPlantaDate);

              // Vueltas (array)
              let vueltasStr = "";
              if (Array.isArray(t.vueltas) && t.vueltas.length > 0) {
                vueltasStr = `${t.vueltas.length} vueltas`;
              }

              return (
                <tr key={item.id} className="border-b hover:bg-slate-100">
                  {/* Fecha Inicio */}
                  <td className="border px-2 py-1">{d.fechaInicio}</td>
                  {/* Tiempo Total */}
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
                  <td className="border px-2 py-1">{tpPre.comentarios}</td>
                  <td className="border px-2 py-1">{tpScan.hora}</td>
                  <td className="border px-2 py-1">{tpScan.comentarios}</td>
                  <td className="border px-2 py-1">{tpAuto.hora}</td>
                  <td className="border px-2 py-1">{tpAuto.comentarios}</td>
                  <td className="border px-2 py-1">{tpIng.hora}</td>
                  <td className="border px-2 py-1">{tpIng.comentarios}</td>
                  <td className="border px-2 py-1">{tpEnt.hora}</td>
                  <td className="border px-2 py-1">{tpEnt.comentarios}</td>
                  <td className="border px-2 py-1">{tpSal.hora}</td>
                  <td className="border px-2 py-1">{tpSal.comentarios}</td>

                  {/* Segundo Proceso */}
                  <td className="border px-2 py-1">{s.enlonador}</td>
                  <td className="border px-2 py-1">{s.operador}</td>
                  <td className="border px-2 py-1">{s.personalAsignado}</td>
                  <td className="border px-2 py-1">{s.modeloEquipo}</td>

                  <td className="border px-2 py-1">{tsLlegPunto.hora}</td>
                  <td className="border px-2 py-1">{tsLlegPunto.comentarios}</td>
                  <td className="border px-2 py-1">{tsLlegOp.hora}</td>
                  <td className="border px-2 py-1">{tsLlegOp.comentarios}</td>
                  <td className="border px-2 py-1">{tsLlegEnl.hora}</td>
                  <td className="border px-2 py-1">{tsLlegEnl.comentarios}</td>
                  <td className="border px-2 py-1">{tsLlegEq.hora}</td>
                  <td className="border px-2 py-1">{tsLlegEq.comentarios}</td>
                  <td className="border px-2 py-1">{tsIni.hora}</td>
                  <td className="border px-2 py-1">{tsIni.comentarios}</td>
                  <td className="border px-2 py-1">{tsTerm.hora}</td>
                  <td className="border px-2 py-1">{tsTerm.comentarios}</td>
                  <td className="border px-2 py-1">{tsSal.hora}</td>
                  <td className="border px-2 py-1">{tsSal.comentarios}</td>

                  {/* Tercer Proceso */}
                  <td className="border px-2 py-1">{t.pesadorSalida}</td>
                  <td className="border px-2 py-1">{t.basculaSalida}</td>
                  <td className="border px-2 py-1">{t.pesoNeto}</td>

                  <td className="border px-2 py-1">{ttEnt.hora}</td>
                  <td className="border px-2 py-1">{ttEnt.comentarios}</td>
                  <td className="border px-2 py-1">{ttSal.hora}</td>
                  <td className="border px-2 py-1">{ttSal.comentarios}</td>

                  {/* Vueltas */}
                  <td className="border px-2 py-1">{vueltasStr}</td>

                  {/* Proceso Final */}
                  <td className="border px-2 py-1">{tfLleg.hora}</td>
                  <td className="border px-2 py-1">{tfLleg.comentarios}</td>
                  <td className="border px-2 py-1">{tfSal.hora}</td>
                  <td className="border px-2 py-1">{tfSal.comentarios}</td>

                  {/* Botón: Ver Detalle => abre modal */}
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

      {/* Modal */}
      {showModal && selectedDemora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-11/12 max-w-lg rounded shadow p-4 relative">
            <h2 className="text-xl font-bold mb-2 text-center text-blue-700">
              Detalle de la Demora
            </h2>
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              X
            </button>

            {/* Mostrar data de 'selectedDemora' de forma amigable */}
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>
                <strong>Fecha Inicio:</strong>{" "}
                {selectedDemora.data?.fechaInicio}
              </p>
              <p>
                <strong>Terminal:</strong>{" "}
                {selectedDemora.data?.primerProceso?.terminal}
              </p>
              <p>
                <strong>Cliente:</strong>{" "}
                {selectedDemora.data?.primerProceso?.cliente}
              </p>
              <p>
                <strong>Placa:</strong>{" "}
                {selectedDemora.data?.primerProceso?.placa}
              </p>
              {/* ...más campos... */}
              <hr className="my-2" />
              <p>
                <strong>Pesador Salida:</strong>{" "}
                {selectedDemora.data?.tercerProceso?.pesadorSalida}
              </p>
              <p>
                <strong>Peso Neto:</strong>{" "}
                {selectedDemora.data?.tercerProceso?.pesoNeto}
              </p>
              {/* ...etc... */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
