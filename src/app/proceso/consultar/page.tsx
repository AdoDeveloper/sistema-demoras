"use client";

import { useState, useEffect } from "react";
import Loader from "../../../components/Loader"; // Ajusta la ruta según tu estructura
import * as XLSX from "xlsx";

// -------------------------
// Funciones de Utilidad
// -------------------------
function parseHora(hhmmss) {
  if (!hhmmss) return null;
  try {
    const [hh, mm, ss] = hhmmss.split(":").map(Number);
    return new Date(1970, 0, 1, hh, mm, ss);
  } catch {
    return null;
  }
}

function diffHoras(t1, t2) {
  if (!t1 || !t2) return "-";
  let diffMs = t2.getTime() - t1.getTime();
  if (diffMs < 0) return "-";
  let diffSegs = Math.floor(diffMs / 1000);
  let diffMins = Math.floor(diffSegs / 60);
  let diffHrs = Math.floor(diffMins / 60);
  diffSegs %= 60;
  diffMins %= 60;
  diffHrs %= 24;
  return `${String(diffHrs).padStart(2, "0")}:${String(diffMins).padStart(2, "0")}:${String(diffSegs).padStart(2, "0")}`;
}

function timeStrToSeconds(timeStr) {
  if (!timeStr || timeStr === "-") return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 3) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function secondsToTimeStr(totalSeconds) {
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// Filtra los campos para el modal (se excluyen id, createdAt, updatedAt y en caso de TercerProceso la propiedad "vueltas")
function filterDetailData(data) {
  if (!data) return data;
  // Campos a excluir por defecto
  const excludedKeys = ["id", "createdAt", "updatedAt", "demoraId"];
  // Si el objeto contiene la propiedad "vueltas", se omite (ya que se muestra aparte)
  if (data.hasOwnProperty("vueltas")) {
    excludedKeys.push("vueltas");
  }
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !excludedKeys.includes(key))
  );
}

// -------------------------
// Componentes para el Modal
// -------------------------

// Formatea las claves para mostrarlas de forma amigable
function formatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Muestra los detalles de un objeto en formato de tabla
function DetailTable({ title, data }) {
  if (!data) return null;
  const entries = Object.entries(data);
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-blue-700 mb-1">{title}</h3>
      <table className="w-full text-xs border-collapse">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b">
              <td className="px-2 py-1 font-bold bg-blue-50">{formatKey(key)}</td>
              <td className="px-2 py-1">{String(value || "-")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Muestra la información de las vueltas en una tabla, omitiendo los campos id, tercerProcesoId, createdAt y updatedAt
function VueltasDetail({ vueltas }) {
  if (!vueltas || vueltas.length === 0) return null;
  return (
    <div className="mb-4">
      {vueltas.map((vuelta, index) => (
        <div key={vuelta.id} className="mb-2 border rounded">
          <div className="bg-blue-50 px-2 py-1 font-bold text-xs">
            Vuelta {index + 1}
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {Object.entries(vuelta).map(([key, value]) =>
                ["id", "tercerProcesoId", "createdAt", "updatedAt"].includes(key) ? null : (
                  <tr key={key} className="border-b">
                    <td className="px-2 py-1 font-bold bg-blue-50">{formatKey(key)}</td>
                    <td className="px-2 py-1">{String(value || "-")}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// -------------------------
// Componente Principal: DemorasPage
// -------------------------
export default function DemorasPage() {
  const [demoras, setDemoras] = useState([]);
  const [selectedDemora, setSelectedDemora] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  // Filtros de fechas (interfaz)
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");

  useEffect(() => {
    async function fetchDemoras() {
      try {
        const res = await fetch("/api/demoras");
        if (!res.ok) {
          console.error("Error al obtener demoras:", res.status);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setDemoras(data);
      } catch (error) {
        console.error("Error de red o parse JSON:", error);
      } finally {
        setLoading(false);
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

  // Función que descarga la vista (tabla HTML) a Excel
  const handleDescargarVista = () => {
    const table = document.getElementById("demoras-table");
    if (!table) {
      console.error("Tabla no encontrada");
      return;
    }
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Demoras" });
    XLSX.writeFile(workbook, "demoras.xlsx");
  };

  // Función que exporta el estado 'demoras' a un Excel a partir del JSON
  const handleExportarExcel = () => {
    const filteredData = demoras.map((item) => {
      const newItem = {};
      for (const key in item) {
        if (typeof item[key] === "object" && item[key] !== null) {
          newItem[key] = JSON.stringify(item[key]);
        } else {
          newItem[key] = item[key];
        }
      }
      return newItem;
    });
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Demoras");
    XLSX.writeFile(workbook, "demoras_export.xlsx");
  };

  // Funciones para campos compuestos en la tabla principal
  const renderBasculaEntrada = (primer) => {
    return (
      <div>
        <p>
          <strong>Báscula:</strong> {primer.basculaEntrada || "-"}
        </p>
        <p>
          <strong>Entrada:</strong> {primer.tiempoEntradaBascula || "-"}
          {primer.entradaBasculaObservaciones ? ` (${primer.entradaBasculaObservaciones})` : ""}
        </p>
        <p>
          <strong>Salida:</strong> {primer.tiempoSalidaBascula || "-"}
          {primer.salidaBasculaObservaciones ? ` (${primer.salidaBasculaObservaciones})` : ""}
        </p>
      </div>
    );
  };

  const renderBasculaSalida = (tercero) => {
    let entrada = tercero.tiempoEntradaBascula || "-";
    let entradaObs = "";
    let salida = tercero.tiempoSalidaBascula || "-";
    let salidaObs = "";
    if (tercero.vueltas && tercero.vueltas.length > 0) {
      const lastVuelta = tercero.vueltas[tercero.vueltas.length - 1];
      entrada = lastVuelta.entradaBascula || entrada;
      entradaObs = lastVuelta.entradaBasculaObservaciones || "";
      salida = lastVuelta.salidaBascula || salida;
      salidaObs = lastVuelta.salidaBasculaObservaciones || "";
    }
    return (
      <div>
        <p>
          <strong>Báscula:</strong> {tercero.basculaSalida || "-"}
        </p>
        <p>
          <strong>Entrada:</strong> {entrada}
          {entradaObs ? ` (${entradaObs})` : ""}
        </p>
        <p>
          <strong>Salida:</strong> {salida}
          {salidaObs ? ` (${salidaObs})` : ""}
        </p>
      </div>
    );
  };

  const calcularIntervalos = (item) => {
    const primer = item.primerProceso || {};
    const segundo = item.segundoProceso || {};
    const tercero = item.tercerProceso || {};
    const final = item.procesoFinal || {};

    const calc1 = diffHoras(
      parseHora(primer.tiempoEntradaBascula),
      parseHora(primer.tiempoSalidaBascula)
    );
    const calc2 = diffHoras(
      parseHora(primer.tiempoSalidaBascula),
      parseHora(segundo.tiempoLlegadaPunto)
    );
    const calc3 = diffHoras(
      parseHora(segundo.tiempoInicioCarga),
      parseHora(segundo.tiempoTerminaCarga)
    );
    let entradaBS = null;
    if (tercero.vueltas && tercero.vueltas.length > 0) {
      const lastVuelta = tercero.vueltas[tercero.vueltas.length - 1];
      entradaBS = parseHora(lastVuelta.tiempoEntradaBascula);
    }
    const calc4 = diffHoras(
      parseHora(segundo.tiempoSalidaPunto),
      entradaBS
    );
    let salidaBS = null;
    if (tercero.vueltas && tercero.vueltas.length > 0) {
      const lastVuelta = tercero.vueltas[tercero.vueltas.length - 1];
      //console.log(lastVuelta);
      salidaBS = parseHora(lastVuelta.tiempoSalidaBascula);
    }
    const calc5 = diffHoras(entradaBS, salidaBS);
    const calc6 = diffHoras(salidaBS, parseHora(final.tiempoSalidaPlanta));

    return { calc1, calc2, calc3, calc4, calc5, calc6 };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen text-gray-800">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-xs md:text-sm"
          >
            Regresar
          </button>
          <h1 className="text-2xl font-bold text-blue-800">Registros de Demoras</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-col">
            <label className="text-xs font-bold">Fecha Inicio</label>
            <input
              type="date"
              className="border px-1 py-1 text-xs rounded"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold">Fecha Final</label>
            <input
              type="date"
              className="border px-1 py-1 text-xs rounded"
              value={fechaFinal}
              onChange={(e) => setFechaFinal(e.target.value)}
            />
          </div>
          <button
            onClick={handleDescargarVista}
            className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-xs md:text-sm"
          >
            Descargar Vista
          </button>
          <button
            onClick={handleExportarExcel}
            className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-xs md:text-sm"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table id="demoras-table" className="min-w-max border-collapse table-auto text-xs md:text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-700">
              <th className="border px-1 py-1">Fecha Inicio</th>
              <th className="border px-1 py-1">Tiempo Total</th>
              <th className="border px-1 py-1">Nº Transacción</th>
              <th className="border px-1 py-1">Condicion</th>
              <th className="border px-1 py-1">Pesador Entrada</th>
              <th className="border px-1 py-1">Portería Entrada</th>
              <th className="border px-1 py-1">Método Carga</th>
              <th className="border px-1 py-1">Nº Ejes</th>
              <th className="border px-1 py-1">Punto Despacho</th>
              <th className="border px-1 py-1">Báscula Entrada</th>
              <th className="border px-1 py-1">Tiempo Precheq.</th>
              <th className="border px-1 py-1">Fecha Precheq.</th>
              <th className="border px-1 py-1">Obs Precheq.</th>
              <th className="border px-1 py-1">Tiempo Scanner</th>
              <th className="border px-1 py-1">Fecha Scanner</th>
              <th className="border px-1 py-1">Obs Scanner</th>
              <th className="border px-1 py-1">Fecha Autorizacion</th>
              <th className="border px-1 py-1">Tiempo Autorizac.</th>
              <th className="border px-1 py-1">Fecha Autorizac.</th>
              <th className="border px-1 py-1">Obs Autorizac.</th>
              <th className="border px-1 py-1">Tiempo Ing. Planta</th>
              <th className="border px-1 py-1">Obs Ingreso</th>
              <th className="border px-1 py-1">Tiempo Lleg. Básq. (P1)</th>
              <th className="border px-1 py-1">Obs Lleg. Básq. (P1)</th>
              <th className="border px-1 py-1">Tiempo Entr. Básq. (P1)</th>
              <th className="border px-1 py-1">Obs Entr. Básq. (P1)</th>
              <th className="border px-1 py-1">Tiempo Sal. Básq. (P1)</th>
              <th className="border px-1 py-1">Obs Sal. Básq. (P1)</th>
              <th className="border px-1 py-1">Operador</th>
              <th className="border px-1 py-1">Enlonador</th>
              <th className="border px-1 py-1">Modelo Equipo</th>
              <th className="border px-1 py-1">Personal Asig.</th>
              <th className="border px-1 py-1">Obs Personal Asig.</th>
              <th className="border px-1 py-1">Tiempo Lleg. Punto</th>
              <th className="border px-1 py-1">Obs Lleg. Punto</th>
              <th className="border px-1 py-1">Tiempo Lleg. Oper.</th>
              <th className="border px-1 py-1">Obs Lleg. Oper.</th>
              <th className="border px-1 py-1">Tiempo Lleg. Enlon.</th>
              <th className="border px-1 py-1">Obs Lleg. Enlon.</th>
              <th className="border px-1 py-1">Tiempo Lleg. Equipo</th>
              <th className="border px-1 py-1">Obs Lleg. Equipo</th>
              <th className="border px-1 py-1">Tiempo Inicio Carga</th>
              <th className="border px-1 py-1">Obs Inicio Carga</th>
              <th className="border px-1 py-1">Tiempo Term. Carga</th>
              <th className="border px-1 py-1">Obs Term. Carga</th>
              <th className="border px-1 py-1">Tiempo Salida Punto</th>
              <th className="border px-1 py-1">Obs Salida Punto</th>
              <th className="border px-1 py-1">Báscula Salida</th>
              <th className="border px-1 py-1">Pesador Salida</th>
              <th className="border px-1 py-1">Tiempo Lleg. Básq. (P3)</th>
              <th className="border px-1 py-1">Obs Lleg. Básq. (P3)</th>
              <th className="border px-1 py-1">Tiempo Entr. Básq. (P3)</th>
              <th className="border px-1 py-1">Obs Entr. Básq. (P3)</th>
              <th className="border px-1 py-1">Tiempo Sal. Básq. (P3)</th>
              <th className="border px-1 py-1">Obs Sal. Básq. (P3)</th>
              <th className="border px-1 py-1">Últ. Vuelta - Nº</th>
              <th className="border px-1 py-1">Últ. Vuelta - Lleg. Punto</th>
              <th className="border px-1 py-1">Obs Lleg. Punto (V)</th>
              <th className="border px-1 py-1">Últ. Vuelta - Sal. Punto</th>
              <th className="border px-1 py-1">Obs Sal. Punto (V)</th>
              <th className="border px-1 py-1">Últ. Vuelta - Lleg. Básq.</th>
              <th className="border px-1 py-1">Obs Lleg. Básq. (V)</th>
              <th className="border px-1 py-1">Últ. Vuelta - Entr. Básq.</th>
              <th className="border px-1 py-1">Obs Entr. Básq. (V)</th>
              <th className="border px-1 py-1">Últ. Vuelta - Sal. Básq.</th>
              <th className="border px-1 py-1">Obs Sal. Básq. (V)</th>
              <th className="border px-1 py-1">Tiempo Salida Planta</th>
              <th className="border px-1 py-1">Obs Salida Planta</th>
              <th className="border px-1 py-1">Portería Salida</th>
              <th className="border px-1 py-1">Tiempo Lleg. Portería</th>
              <th className="border px-1 py-1">Obs Lleg. Portería</th>
              <th className="border px-1 py-1">B.E. (Entr → Sal)</th>
              <th className="border px-1 py-1">Sal. B.E. → Lleg. Punto</th>
              <th className="border px-1 py-1">Carga</th>
              <th className="border px-1 py-1">Sal. Punto → B.S. Entr.</th>
              <th className="border px-1 py-1">B.S. (Entr → Sal)</th>
              <th className="border px-1 py-1">B.S. → Planta</th>
              <th className="border px-1 py-1">Acción</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {demoras.map((item) => {
              const primer = item.primerProceso || {};
              const segundo = item.segundoProceso || {};
              const tercero = item.tercerProceso || {};
              const final = item.procesoFinal || {};
              const { calc1, calc2, calc3, calc4, calc5, calc6 } = calcularIntervalos(item);
              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="border px-1 py-1 whitespace-nowrap">{item.fechaInicio}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{item.tiempoTotal || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.numeroTransaccion || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.condicion || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.pesadorEntrada || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.porteriaEntrada || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.metodoCarga || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.numeroEjes || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.puntoDespacho || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.basculaEntrada || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.tiempoPrechequeo || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.fechaPrechequeo || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.prechequeoObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.tiempoScanner || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.fechaScanner || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.scannerObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.fechaAutorizacion || "-"} {primer.tiempoAutorizacion || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.tiempoAutorizacion || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.fechaAutorizacion || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.autorizacionObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.tiempoIngresoPlanta || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.ingresoPlantaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.tiemporLlegadaBascula || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.llegadaBasculaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.tiempoEntradaBascula || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.entradaBasculaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.tiempoSalidaBascula || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{primer.salidaBasculaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.operador || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.enlonador || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.modeloEquipo || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.personalAsignado != null ? segundo.personalAsignado : "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.personalAsignadoObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.tiempoLlegadaPunto || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.llegadaPuntoObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.tiempoLlegadaOperador || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.llegadaOperadorObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.tiempoLlegadaEnlonador || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.llegadaEnlonadorObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.tiempoLlegadaEquipo || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.llegadaEquipoObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.tiempoInicioCarga || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.inicioCargaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.tiempoTerminaCarga || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.terminaCargaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.tiempoSalidaPunto || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{segundo.salidaPuntoObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{tercero.basculaSalida || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{tercero.pesadorSalida || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{tercero.tiempoLlegadaBascula || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{tercero.llegadaBasculaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{tercero.tiempoEntradaBascula || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{tercero.entradaBasculaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{tercero.tiempoSalidaBascula || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{tercero.salidaBasculaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].numeroVuelta
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoLlegadaPunto
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].llegadaPuntoObservaciones
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoSalidaPunto
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].salidaPuntoObservaciones
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoLlegadaBascula
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].llegadaBasculaObservaciones
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoEntradaBascula
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].entradaBasculaObservaciones
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoSalidaBascula
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].salidaBasculaObservaciones
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 whitespace-nowrap">{final.tiempoSalidaPlanta || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{final.salidaPlantaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{final.porteriaSalida || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{final.tiempoLlegadaPorteria || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{final.llegadaPorteriaObservaciones || "-"}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{calcularIntervalos(item).calc1}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{calcularIntervalos(item).calc2}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{calcularIntervalos(item).calc3}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{calcularIntervalos(item).calc4}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{calcularIntervalos(item).calc5}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">{calcularIntervalos(item).calc6}</td>
                  <td className="border px-1 py-1 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="bg-indigo-500 text-white px-1 py-1 rounded hover:bg-indigo-600 text-xs"
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

      {/* Modal de Detalle */}
      {showModal && selectedDemora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl p-6 relative overflow-y-auto max-h-screen">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <div className="mb-4">
              <button
                onClick={handleCloseModal}
                className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-xs md:text-sm"
              >
                Regresar
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">
              Detalle de la Demora
            </h2>
            <div className="space-y-6">
              {/* Información General */}
              <DetailTable
                title="Información General"
                data={{
                  "Registro": selectedDemora.id,
                  "Fecha Inicio": selectedDemora.fechaInicio,
                  "Tiempo Total": selectedDemora.tiempoTotal || "-",
                  "Nº Transaccion": selectedDemora.primerProceso.numeroTransaccion || "-",
                  "Realizado": selectedDemora.userName || "-",
                }}
              />
              {/* Primer Proceso */}
              <DetailTable
                title="Primer Proceso"
                data={filterDetailData(selectedDemora.primerProceso)}
              />
              {/* Segundo Proceso */}
              <DetailTable
                title="Segundo Proceso"
                data={filterDetailData(selectedDemora.segundoProceso)}
              />
              {/* Tercer Proceso (sin el objeto "vueltas") */}
              <DetailTable
                title="Tercer Proceso"
                data={filterDetailData(selectedDemora.tercerProceso)}
              />
              {/* Detalle de Vueltas (mostrando solo la información de las vueltas) */}
              {selectedDemora.tercerProceso &&
                selectedDemora.tercerProceso.vueltas && (
                  <div>
                    <p className="text-sm font-bold mb-2">
                      Total de Vueltas: {selectedDemora.tercerProceso.vueltas.length}
                    </p>
                    <VueltasDetail vueltas={selectedDemora.tercerProceso.vueltas} />
                  </div>
              )}
              {/* Proceso Final */}
              <DetailTable
                title="Proceso Final"
                data={filterDetailData(selectedDemora.procesoFinal)}
              />
              {/* Intervalos */}
              <DetailTable
                title="Intervalos entre Procesos"
                data={{
                  "B.E. (Entr → Sal)": calcularIntervalos(selectedDemora).calc1,
                  "Sal. B.E. → Lleg. Punto": calcularIntervalos(selectedDemora).calc2,
                  "Carga": calcularIntervalos(selectedDemora).calc3,
                  "Sal. Punto → B.S. Entr.": calcularIntervalos(selectedDemora).calc4,
                  "B.S. (Entr → Sal)": calcularIntervalos(selectedDemora).calc5,
                  "B.S. → Planta": calcularIntervalos(selectedDemora).calc6
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
