"use client";

import { useState, useEffect } from "react";
import Loader from "../../../components/Loader"; // Ajusta la ruta según tu estructura
import * as XLSX from "xlsx";
import { FiArrowLeft, FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";
import Swal from "sweetalert2";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// -------------------------
// Funciones de Utilidad
// -------------------------
function parseHora(hhmmss: string) {
  if (!hhmmss) return null;
  try {
    const [hh, mm, ss] = hhmmss.split(":").map(Number);
    return new Date(1970, 0, 1, hh, mm, ss);
  } catch {
    return null;
  }
}

function diffEnHoras(dateA: Date | null, dateB: Date | null): number {
  if (!dateA || !dateB) return 0;
  return (dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60);
}

function formatInterval(hoursDecimal: number): string {
  const seconds = Math.round(hoursDecimal * 3600);
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function timeStrToSeconds(timeStr: string) {
  if (!timeStr || timeStr === "-") return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 3) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function secondsToTimeStr(totalSeconds: number) {
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function filterDetailData(data: any) {
  if (!data) return data;
  const excludedKeys = ["id", "createdAt", "updatedAt", "demoraId"];
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
function formatKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function DetailTable({ title, data }: { title: string; data: any }) {
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

function VueltasDetail({ vueltas }: { vueltas: any[] }) {
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
  const [demoras, setDemoras] = useState<any[]>([]);
  const [selectedDemora, setSelectedDemora] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para loader en botones
  const [exportLoading, setExportLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [filterText, setFilterText] = useState("");
  const [filterTiempoTotal, setFilterTiempoTotal] = useState("");
  const [filterTransaccion, setFilterTransaccion] = useState("");
  const [filterCondicion, setFilterCondicion] = useState("");
  const [filterMetodo, setFilterMetodo] = useState("");

  // Función para obtener la data; en refresco no se muestra el loader de pantalla
  const fetchDemoras = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await fetch("/api/demoras");
      if (!res.ok) {
        Swal.fire("Error", "Error al obtener registros: " + res.status, "error");
        if (!isRefresh) setLoading(false);
        return;
      }
      const data = await res.json();
      setDemoras(data);
    } catch (error: any) {
      Swal.fire("Error", "Error de red o parse JSON: " + error.message, "error");
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoras();
  }, []);

  const handleOpenModal = (item: any) => {
    setSelectedDemora(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDemora(null);
  };

  // Función para descargar la vista a Excel
  const handleDescargarVista = () => {
    setDownloadLoading(true);
    const table = document.getElementById("demoras-table");
    if (!table) {
      Swal.fire("Error", "Tabla no encontrada", "error");
      setDownloadLoading(false);
      return;
    }
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Demoras" });
    const now = new Date();
    const formattedDateTime = now
      .toISOString()
      .replace(/T/, "-")
      .replace(/\..+/, "")
      .replace(/:/g, "-");
    XLSX.writeFile(workbook, `Data-View-${formattedDateTime}.xlsx`);
    setDownloadLoading(false);
  };

  // Función para exportar el reporte completo con alerta y spinner
  const handleExportarExcel = async () => {
    if (!fechaInicio || !fechaFinal) {
      Swal.fire("Información", "Debe seleccionar las fechas de inicio y final", "warning");
      return;
    }
    setExportLoading(true);
    Swal.fire({
      title: "Generando Reporte",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const response = await fetch(
        `/api/demoras/export-excel?fechaInicio=${fechaInicio}&fechaFinal=${fechaFinal}`
      );
      if (!response.ok) {
        Swal.fire("Error", "Error en la exportación: " + response.status, "error");
        setExportLoading(false);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `Data-${fechaInicio}-${fechaFinal}.xlsx`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Swal.fire("Éxito", "Archivo exportado correctamente", "success");
    } catch (error: any) {
      Swal.fire("Error", "Error exportando Excel: " + error.message, "error");
    } finally {
      setExportLoading(false);
    }
  };

  // Función para refrescar la data sin mostrar el loader de pantalla completa
  const handleRefresh = async () => {
    setRefreshLoading(true);
    await fetchDemoras(true);
    setRefreshLoading(false);
    Swal.fire("Actualizado", "Datos actualizados", "success");
  };

  // Funciones para campos compuestos en la tabla
  const renderBasculaEntrada = (primer: any) => (
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

  const renderBasculaSalida = (tercero: any) => {
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

  const calcularIntervalos = (item: any) => {
    const primer = item.primerProceso || {};
    const segundo = item.segundoProceso || {};
    const tercero = item.tercerProceso || {};
    const final = item.procesoFinal || {};

    const calc1 = formatInterval(
      diffEnHoras(parseHora(primer.tiempoEntradaBascula), parseHora(primer.tiempoSalidaBascula))
    );
    const calc2 = formatInterval(
      diffEnHoras(parseHora(primer.tiempoSalidaBascula), parseHora(segundo.tiempoLlegadaPunto))
    );
    const calc3 = formatInterval(
      diffEnHoras(parseHora(segundo.tiempoInicioCarga), parseHora(segundo.tiempoTerminaCarga))
    );
    let entradaBS = null;
    let salidaBS = null;
    if (tercero.vueltas && tercero.vueltas.length > 0) {
      const lastVuelta = tercero.vueltas[tercero.vueltas.length - 1];
      entradaBS = parseHora(lastVuelta.tiempoEntradaBascula);
      salidaBS = parseHora(lastVuelta.tiempoSalidaBascula);
    }
    const calc4 = formatInterval(diffEnHoras(parseHora(segundo.tiempoSalidaPunto), entradaBS));
    const calc5 = formatInterval(diffEnHoras(entradaBS, salidaBS));
    const calc6 = formatInterval(diffEnHoras(salidaBS, parseHora(final.tiempoSalidaPlanta)));

    return { calc1, calc2, calc3, calc4, calc5, calc6 };
  };

  // Función para descargar el detalle del registro actual en PDF usando pdf-lib
  const handleDescargarPDF = async () => {
    if (!selectedDemora) {
      Swal.fire("Error", "No hay registro seleccionado", "error");
      return;
    }
    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    let currentPage = pdfDoc.addPage();
    const { width, height } = currentPage.getSize();
    let yPosition = height - 40;
    const lineHeight = 12;

    // Función auxiliar para dibujar texto y crear nuevas páginas si es necesario.
    // Se reemplaza el carácter "→" por "->" para evitar errores de codificación.
    const drawText = (text: string, size: number = 10) => {
      const sanitizedText = text.replace(/→/g, "->");
      if (yPosition < 50) {
        currentPage = pdfDoc.addPage();
        yPosition = currentPage.getSize().height - 50;
      }
      currentPage.drawText(sanitizedText, {
        x: 50,
        y: yPosition,
        size,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    };

    // Agregar título
    drawText("Detalle de la Demora", 18);
    yPosition -= lineHeight;

    // Función para agregar secciones al PDF
    const addSection = (title: string, data: any) => {
      drawText(title, 12);
      for (const [key, value] of Object.entries(data)) {
        drawText(`${formatKey(key)}: ${value || "-"}`, 10);
      }
      yPosition -= lineHeight;
    };

    // Secciones a agregar
    addSection("Información General", {
      Registro: selectedDemora.id,
      "Fecha Inicio": selectedDemora.fechaInicio,
      "Tiempo Total": selectedDemora.tiempoTotal || "-",
      "Nº Transacción": selectedDemora.primerProceso?.numeroTransaccion || "-",
      Realizado: selectedDemora.userName || "-",
    });

    if (selectedDemora.primerProceso) {
      addSection("Primer Proceso", filterDetailData(selectedDemora.primerProceso));
    }
    if (selectedDemora.segundoProceso) {
      addSection("Segundo Proceso", filterDetailData(selectedDemora.segundoProceso));
    }
    if (selectedDemora.tercerProceso) {
      addSection("Tercer Proceso", filterDetailData(selectedDemora.tercerProceso));
      if (selectedDemora.tercerProceso.vueltas) {
        drawText(`Total de Vueltas: ${selectedDemora.tercerProceso.vueltas.length}`, 12);
        selectedDemora.tercerProceso.vueltas.forEach((vuelta: any, index: number) => {
          addSection(`Vuelta ${index + 1}`, vuelta);
        });
      }
    }
    if (selectedDemora.procesoFinal) {
      addSection("Proceso Final", filterDetailData(selectedDemora.procesoFinal));
    }
    const intervalos = calcularIntervalos(selectedDemora);
    addSection("Intervalos entre Procesos", {
      "B.E. (Entr → Sal)": intervalos.calc1,
      "Sal. B.E. → Lleg. Punto": intervalos.calc2,
      "Carga": intervalos.calc3,
      "Sal. Punto → B.S. Entr.": intervalos.calc4,
      "B.S. (Entr → Sal)": intervalos.calc5,
      "B.S. → Planta": intervalos.calc6,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Detalle-Demora-${selectedDemora.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Filtros aplicados a los registros (filtra por texto, tiempo, transacción, condición, método y rango de fechas)
  const filteredDemoras = demoras.filter((item) => {
    const itemString = JSON.stringify(item).toLowerCase();
    const textMatch = filterText === "" || itemString.includes(filterText.toLowerCase());
    const tiempoMatch =
      filterTiempoTotal === "" ||
      (item.tiempoTotal && item.tiempoTotal.toLowerCase().includes(filterTiempoTotal.toLowerCase()));
    const transMatch =
      filterTransaccion === "" ||
      (item.primerProceso?.numeroTransaccion &&
        item.primerProceso.numeroTransaccion.toLowerCase().includes(filterTransaccion.toLowerCase()));
    const condicionMatch =
      filterCondicion === "" ||
      (item.primerProceso?.condicion &&
        item.primerProceso.condicion.toLowerCase().includes(filterCondicion.toLowerCase()));
    const metodoMatch =
      filterMetodo === "" ||
      (item.primerProceso?.metodoCarga &&
        item.primerProceso.metodoCarga.toLowerCase().includes(filterMetodo.toLowerCase()));
    let dateMatch = true;
    if (fechaInicio && fechaFinal) {
      // Se filtra según la fecha de autorización (ajusta según lo que necesites)
      const itemDate = new Date(item.primerProceso.fechaAutorizacion);
      const start = new Date(fechaInicio);
      const end = new Date(fechaFinal);
      dateMatch = itemDate >= start && itemDate <= end;
    }
    return textMatch && tiempoMatch && transMatch && condicionMatch && metodoMatch && dateMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-1 bg-gray-50 min-h-screen text-gray-800">
      {/* Encabezado - Nuevo Diseño */}
      <header className="bg-gradient-to-r bg-orange-400 text-white shadow-lg md:sticky md:top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
                title="Volver"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold">Registro de Tiempos</h1>
            </div>
            <div className="grid grid-cols-3 md:flex md:flex-row items-center mt-4 md:mt-0 gap-3">
              <button
                onClick={handleDescargarVista}
                title="Descargar Vista"
                className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-2 rounded flex items-center gap-1 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                {downloadLoading ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                ) : (
                  <FiDownload size={20} />
                )}
                <span className="hidden md:inline">Descargar Vista</span>
              </button>

              <button
                onClick={handleExportarExcel}
                title="Exportar Excel"
                className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded flex items-center gap-1 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                {exportLoading ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                ) : (
                  <FiFileText size={20} />
                )}
                <span className="hidden md:inline">Exportar Excel</span>
              </button>

              <button
                onClick={handleRefresh}
                title="Refrescar"
                className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded flex items-center gap-1 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                {refreshLoading ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                ) : (
                  <FiRefreshCw size={20} />
                )}
                <span className="hidden md:inline">Refrescar</span>
              </button>
            </div>
          </div>
          {/* Filtros */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm">Fecha Inicio</label>
              <input
                type="date"
                className="text-black px-2 py-1 rounded"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Fecha Final</label>
              <input
                type="date"
                className="text-black px-2 py-1 rounded"
                value={fechaFinal}
                onChange={(e) => setFechaFinal(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Nº Transacción</label>
              <input
                type="text"
                placeholder="Buscar transacción..."
                className="text-black px-2 py-1 rounded"
                value={filterTransaccion}
                onChange={(e) => setFilterTransaccion(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Condición</label>
              <input
                type="text"
                placeholder="Buscar condición..."
                className="text-black px-2 py-1 rounded"
                value={filterCondicion}
                onChange={(e) => setFilterCondicion(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Método de Carga</label>
              <input
                type="text"
                placeholder="Buscar método..."
                className="text-black px-2 py-1 rounded"
                value={filterMetodo}
                onChange={(e) => setFilterMetodo(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Texto</label>
              <input
                type="text"
                placeholder="Buscar en todos los campos..."
                className="text-black px-2 py-1 rounded"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Tiempo Total</label>
              <input
                type="text"
                placeholder="Ej: 00:30:00"
                className="text-black px-2 py-1 rounded"
                value={filterTiempoTotal}
                onChange={(e) => setFilterTiempoTotal(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Tabla Principal */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg mt-6">
        <table id="demoras-table" className="min-w-full border-collapse table-auto text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-700">
              <th className="border px-2 py-1">Fecha Inicio</th>
              <th className="border px-2 py-1">Tiempo Total</th>
              <th className="border px-2 py-1">Nº Transacción</th>
              <th className="border px-2 py-1">Condición</th>
              <th className="border px-2 py-1">Pesador Entrada</th>
              <th className="border px-2 py-1">Portería Entrada</th>
              <th className="border px-2 py-1">Método Carga</th>
              <th className="border px-2 py-1">Nº Ejes</th>
              <th className="border px-2 py-1">Punto Despacho</th>
              <th className="border px-2 py-1">Báscula Entrada</th>
              <th className="border px-2 py-1">Tiempo Precheq.</th>
              <th className="border px-2 py-1">Fecha Precheq.</th>
              <th className="border px-2 py-1">Obs Precheq.</th>
              <th className="border px-2 py-1">Tiempo Scanner</th>
              <th className="border px-2 py-1">Fecha Scanner</th>
              <th className="border px-2 py-1">Obs Scanner</th>
              <th className="border px-2 py-1">Fecha Autorización</th>
              <th className="border px-2 py-1">Tiempo Autorizac.</th>
              <th className="border px-2 py-1">Fecha Autorizac.</th>
              <th className="border px-2 py-1">Obs Autorizac.</th>
              <th className="border px-2 py-1">Tiempo Ing. Planta</th>
              <th className="border px-2 py-1">Obs Ingreso</th>
              <th className="border px-2 py-1">Tiempo Lleg. Básq. (P1)</th>
              <th className="border px-2 py-1">Obs Lleg. Básq. (P1)</th>
              <th className="border px-2 py-1">Tiempo Entr. Básq. (P1)</th>
              <th className="border px-2 py-1">Obs Entr. Básq. (P1)</th>
              <th className="border px-2 py-1">Tiempo Sal. Básq. (P1)</th>
              <th className="border px-2 py-1">Obs Sal. Básq. (P1)</th>
              <th className="border px-2 py-1">Operador</th>
              <th className="border px-2 py-1">Enlonador</th>
              <th className="border px-2 py-1">Modelo Equipo</th>
              <th className="border px-2 py-1">Personal Asig.</th>
              <th className="border px-2 py-1">Obs Personal Asig.</th>
              <th className="border px-2 py-1">Tiempo Lleg. Punto</th>
              <th className="border px-2 py-1">Obs Lleg. Punto</th>
              <th className="border px-2 py-1">Tiempo Lleg. Oper.</th>
              <th className="border px-2 py-1">Obs Lleg. Oper.</th>
              <th className="border px-2 py-1">Tiempo Lleg. Enlon.</th>
              <th className="border px-2 py-1">Obs Lleg. Enlon.</th>
              <th className="border px-2 py-1">Tiempo Lleg. Equipo</th>
              <th className="border px-2 py-1">Obs Lleg. Equipo</th>
              <th className="border px-2 py-1">Tiempo Inicio Carga</th>
              <th className="border px-2 py-1">Obs Inicio Carga</th>
              <th className="border px-2 py-1">Tiempo Term. Carga</th>
              <th className="border px-2 py-1">Obs Term. Carga</th>
              <th className="border px-2 py-1">Tiempo Salida Punto</th>
              <th className="border px-2 py-1">Obs Salida Punto</th>
              <th className="border px-2 py-1">Báscula Salida</th>
              <th className="border px-2 py-1">Pesador Salida</th>
              <th className="border px-2 py-1">Tiempo Lleg. Básq. (P3)</th>
              <th className="border px-2 py-1">Obs Lleg. Básq. (P3)</th>
              <th className="border px-2 py-1">Tiempo Entr. Básq. (P3)</th>
              <th className="border px-2 py-1">Obs Entr. Básq. (P3)</th>
              <th className="border px-2 py-1">Tiempo Sal. Básq. (P3)</th>
              <th className="border px-2 py-1">Obs Sal. Básq. (P3)</th>
              <th className="border px-2 py-1">Últ. Vuelta - Nº</th>
              <th className="border px-2 py-1">Últ. Vuelta - Lleg. Punto</th>
              <th className="border px-2 py-1">Obs Lleg. Punto (V)</th>
              <th className="border px-2 py-1">Últ. Vuelta - Sal. Punto</th>
              <th className="border px-2 py-1">Obs Sal. Punto (V)</th>
              <th className="border px-2 py-1">Últ. Vuelta - Lleg. Básq.</th>
              <th className="border px-2 py-1">Obs Lleg. Básq. (V)</th>
              <th className="border px-2 py-1">Últ. Vuelta - Entr. Básq.</th>
              <th className="border px-2 py-1">Obs Entr. Básq. (V)</th>
              <th className="border px-2 py-1">Últ. Vuelta - Sal. Básq.</th>
              <th className="border px-2 py-1">Obs Sal. Básq. (V)</th>
              <th className="border px-2 py-1">Tiempo Salida Planta</th>
              <th className="border px-2 py-1">Obs Salida Planta</th>
              <th className="border px-2 py-1">Portería Salida</th>
              <th className="border px-2 py-1">Tiempo Lleg. Portería</th>
              <th className="border px-2 py-1">Obs Lleg. Portería</th>
              <th className="border px-2 py-1">B.E. (Entr → Sal)</th>
              <th className="border px-2 py-1">Sal. B.E. → Lleg. Punto</th>
              <th className="border px-2 py-1">Carga</th>
              <th className="border px-2 py-1">Sal. Punto → B.S. Entr.</th>
              <th className="border px-2 py-1">B.S. (Entr → Sal)</th>
              <th className="border px-2 py-1">B.S. → Planta</th>
              <th className="border px-2 py-1">Acción</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredDemoras.map((item) => {
              const primer = item.primerProceso || {};
              const segundo = item.segundoProceso || {};
              const tercero = item.tercerProceso || {};
              const final = item.procesoFinal || {};
              const { calc1, calc2, calc3, calc4, calc5, calc6 } = calcularIntervalos(item);
              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="border px-2 py-1 whitespace-nowrap">{item.fechaInicio}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{item.tiempoTotal || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.numeroTransaccion || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.condicion || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.pesadorEntrada || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.porteriaEntrada || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.metodoCarga || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.numeroEjes || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.puntoDespacho || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.basculaEntrada || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoPrechequeo || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.fechaPrechequeo || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.prechequeoObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoScanner || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.fechaScanner || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.scannerObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {primer.fechaAutorizacion || "-"} {primer.tiempoAutorizacion || "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoAutorizacion || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.fechaAutorizacion || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.autorizacionObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoIngresoPlanta || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.ingresoPlantaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoLlegadaBascula || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.llegadaBasculaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoEntradaBascula || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.entradaBasculaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoSalidaBascula || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.salidaBasculaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.operador || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.enlonador || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.modeloEquipo || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {segundo.personalAsignado != null ? segundo.personalAsignado : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.personalAsignadoObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoLlegadaPunto || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.llegadaPuntoObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoLlegadaOperador || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.llegadaOperadorObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoLlegadaEnlonador || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.llegadaEnlonadorObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoLlegadaEquipo || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.llegadaEquipoObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoInicioCarga || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.inicioCargaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoTerminaCarga || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.terminaCargaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoSalidaPunto || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.salidaPuntoObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{tercero.basculaSalida || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{tercero.pesadorSalida || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{tercero.tiempoLlegadaBascula || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{tercero.llegadaBasculaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{tercero.tiempoEntradaBascula || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{tercero.entradaBasculaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{tercero.tiempoSalidaBascula || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{tercero.salidaBasculaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].numeroVuelta
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoLlegadaPunto
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].llegadaPuntoObservaciones
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoSalidaPunto
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].salidaPuntoObservaciones
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoLlegadaBascula
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].llegadaBasculaObservaciones
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoEntradaBascula
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].entradaBasculaObservaciones
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].tiempoSalidaBascula
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {tercero.vueltas && tercero.vueltas.length > 0
                      ? tercero.vueltas[tercero.vueltas.length - 1].salidaBasculaObservaciones
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 whitespace-nowrap">{final.tiempoSalidaPlanta || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{final.salidaPlantaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{final.porteriaSalida || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{final.tiempoLlegadaPorteria || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{final.llegadaPorteriaObservaciones || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{calcularIntervalos(item).calc1}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{calcularIntervalos(item).calc2}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{calcularIntervalos(item).calc3}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{calcularIntervalos(item).calc4}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{calcularIntervalos(item).calc5}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{calcularIntervalos(item).calc6}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="bg-indigo-700 hover:bg-indigo-800 text-white px-2 py-1 rounded transition-all duration-300 transform hover:scale-105 text-xs"
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

      {/* Modal Minimalista y Responsive */}
      {showModal && selectedDemora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white w-full max-w-md md:max-w-4xl rounded-lg shadow-lg p-4 relative max-h-full overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              title="Cerrar"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700 text-center">
              Detalle de la Demora
            </h2>
            <div className="space-y-4">
              <DetailTable
                title="Información General"
                data={{
                  Registro: selectedDemora.id,
                  "Fecha Inicio": selectedDemora.fechaInicio,
                  "Tiempo Total": selectedDemora.tiempoTotal || "-",
                  "Nº Transacción": selectedDemora.primerProceso?.numeroTransaccion || "-",
                  Realizado: selectedDemora.userName || "-",
                }}
              />
              <DetailTable
                title="Primer Proceso"
                data={filterDetailData(selectedDemora.primerProceso)}
              />
              <DetailTable
                title="Segundo Proceso"
                data={filterDetailData(selectedDemora.segundoProceso)}
              />
              <DetailTable
                title="Tercer Proceso"
                data={filterDetailData(selectedDemora.tercerProceso)}
              />
              {selectedDemora.tercerProceso &&
                selectedDemora.tercerProceso.vueltas && (
                  <div>
                    <p className="text-sm font-bold mb-2">
                      Total de Vueltas: {selectedDemora.tercerProceso.vueltas.length}
                    </p>
                    <VueltasDetail vueltas={selectedDemora.tercerProceso.vueltas} />
                  </div>
              )}
              <DetailTable
                title="Proceso Final"
                data={filterDetailData(selectedDemora.procesoFinal)}
              />
              <DetailTable
                title="Intervalos entre Procesos"
                data={{
                  "B.E. (Entr → Sal)": calcularIntervalos(selectedDemora).calc1,
                  "Sal. B.E. → Lleg. Punto": calcularIntervalos(selectedDemora).calc2,
                  "Carga": calcularIntervalos(selectedDemora).calc3,
                  "Sal. Punto → B.S. Entr.": calcularIntervalos(selectedDemora).calc4,
                  "B.S. (Entr → Sal)": calcularIntervalos(selectedDemora).calc5,
                  "B.S. → Planta": calcularIntervalos(selectedDemora).calc6,
                }}
              />
            </div>
            {/* Botones de Regresar y Descargar PDF */}
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCloseModal}
                className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                <FiArrowLeft size={20} />
                <span>Regresar</span>
              </button>
              <button
                onClick={handleDescargarPDF}
                className="bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                <FiDownload size={20} />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
