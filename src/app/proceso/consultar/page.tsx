"use client";

import { useState, useEffect } from "react";
import Loader from "../../../components/Loader";
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
              <td className="px-2 py-1 font-bold bg-blue-50 whitespace-nowrap">{formatKey(key)}</td>
              <td className="px-2 py-1 whitespace-nowrap">{String(value || "-")}</td>
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
          <div className="bg-blue-50 px-2 py-1 font-bold text-xs whitespace-nowrap">
            Vuelta {index + 1}
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {Object.entries(vuelta).map(([key, value]) =>
                ["id", "tercerProcesoId", "createdAt", "updatedAt"].includes(key) ? null : (
                  <tr key={key} className="border-b">
                    <td className="px-2 py-1 font-bold bg-blue-50 whitespace-nowrap">{formatKey(key)}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{String(value || "-")}</td>
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
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDemora, setSelectedDemora] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para loader en botones
  const [exportLoading, setExportLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Estados para Filtros (se aplican en el frontend)
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [filterText, setFilterText] = useState("");
  const [filterTiempoTotal, setFilterTiempoTotal] = useState("");
  const [filterTransaccion, setFilterTransaccion] = useState("");
  const [filterCondicion, setFilterCondicion] = useState("");
  const [filterMetodo, setFilterMetodo] = useState("");

  // Estado para paginación (backend)
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // Función para obtener la data; sólo se envían al backend los parámetros de paginación
  const fetchDemoras = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
      });

      const res = await fetch(`/api/demoras?${queryParams.toString()}`);
      if (!res.ok) {
        Swal.fire("Error", "Error al obtener registros: " + res.status, "error");
        if (!isRefresh) setLoading(false);
        return;
      }
      const result = await res.json();
      setDemoras(result.data);
      setTotalCount(result.totalCount);
    } catch (error: any) {
      Swal.fire("Error", "Error de red o parse JSON: " + error.message, "error");
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  // Se dispara la consulta al backend únicamente cuando cambia la paginación
  useEffect(() => {
    fetchDemoras();
  }, [currentPage, recordsPerPage]);

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
      <p className="whitespace-nowrap">
        <strong>Báscula:</strong> {primer.basculaEntrada || "-"}
      </p>
      <p className="whitespace-nowrap">
        <strong>Entrada:</strong> {primer.tiempoEntradaBascula || "-"}
        {primer.entradaBasculaObservaciones ? ` (${primer.entradaBasculaObservaciones})` : ""}
      </p>
      <p className="whitespace-nowrap">
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
        <p className="whitespace-nowrap">
          <strong>Báscula:</strong> {tercero.basculaSalida || "-"}
        </p>
        <p className="whitespace-nowrap">
          <strong>Entrada:</strong> {entrada}
          {entradaObs ? ` (${entradaObs})` : ""}
        </p>
        <p className="whitespace-nowrap">
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
    // Usamos Courier para lograr un efecto monoespaciado (ideal para tablas)
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    let currentPagePdf = pdfDoc.addPage();
    const { width, height } = currentPagePdf.getSize();
    const margin = 50;
    let yPosition = height - margin;
    const lineHeight = 14;

    // Función auxiliar para dibujar texto; reemplaza "→" por "->"
    const drawText = (text: string, size: number = 10, font = timesRomanFont) => {
      const sanitizedText = text.replace(/→/g, "->");
      if (yPosition < margin + lineHeight) {
        currentPagePdf = pdfDoc.addPage();
        yPosition = currentPagePdf.getSize().height - margin;
      }
      currentPagePdf.drawText(sanitizedText, {
        x: margin,
        y: yPosition,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    };

    // Función para centrar texto
    const centerText = (text: string, size: number = 12, font = timesRomanFont) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      const x = (width - textWidth) / 2;
      if (yPosition < margin + lineHeight) {
        currentPagePdf = pdfDoc.addPage();
        yPosition = currentPagePdf.getSize().height - margin;
      }
      currentPagePdf.drawText(text, {
        x,
        y: yPosition,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    };

    // --- Encabezado ---
    centerText("ALMAPAC S.A de C.V. - PLANTA ACAJUTLA", 16, timesRomanFont);
    yPosition -= lineHeight * 0.5;
    centerText("Control de Tiempos Despacho", 14, timesRomanFont);
    yPosition -= lineHeight * 0.5;
    centerText(`Detalle del Registro #${selectedDemora.id}`, 14, timesRomanFont);
    yPosition -= lineHeight * 1.5;

    // Función para agregar una sección en formato de tabla
    const addTableSection = (sectionTitle: string, data: any) => {
      drawText(sectionTitle, 12, timesRomanFont);
      const header = `${"Campo".padEnd(30)} | Valor`;
      drawText(header, 10, courierFont);
      drawText("-".repeat(80), 10, courierFont);
      for (const [key, value] of Object.entries(data)) {
        const line = `${formatKey(key).padEnd(30)} | ${value || "-"}`;
        drawText(line, 10, courierFont);
      }
      yPosition -= lineHeight;
    };

    addTableSection("Información General", {
      Registro: selectedDemora.id,
      "Fecha Inicio": selectedDemora.fechaInicio,
      "Tiempo Total": selectedDemora.tiempoTotal || "-",
      "Nº Transacción": selectedDemora.primerProceso?.numeroTransaccion || "-",
      Realizado: selectedDemora.userName || "-",
    });

    if (selectedDemora.primerProceso) {
      addTableSection("Primer Proceso", filterDetailData(selectedDemora.primerProceso));
    }
    if (selectedDemora.segundoProceso) {
      addTableSection("Segundo Proceso", filterDetailData(selectedDemora.segundoProceso));
    }
    if (selectedDemora.tercerProceso) {
      addTableSection("Tercer Proceso", filterDetailData(selectedDemora.tercerProceso));
      if (selectedDemora.tercerProceso.vueltas) {
        drawText(`Total de Vueltas: ${selectedDemora.tercerProceso.vueltas.length}`, 12, timesRomanFont);
        selectedDemora.tercerProceso.vueltas.forEach((vuelta: any, index: number) => {
          addTableSection(`Vuelta ${index + 1}`, filterDetailData(vuelta));
        });
      }
    }
    if (selectedDemora.procesoFinal) {
      addTableSection("Proceso Final", filterDetailData(selectedDemora.procesoFinal));
    }
    const intervalos = calcularIntervalos(selectedDemora);
    addTableSection("Intervalos entre Procesos", {
      "B.E. (Entr → Sal)": intervalos.calc1,
      "Sal. B.E. → Lleg. Punto": intervalos.calc2,
      "Tiempo Total Carga": intervalos.calc3,
      "Sal. Punto → B.S. Entr.": intervalos.calc4,
      "B.S. (Entr → Sal)": intervalos.calc5,
      "B.S. → Salida Planta": intervalos.calc6,
    });

    currentPagePdf.drawText(`Reporte: ${new Date().toLocaleString()}`, {
      x: margin,
      y: margin / 2,
      size: 10,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Detalle-Registro-${selectedDemora.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Aplicación de filtros en el frontend sobre la data ya traída (paginada)
  const filteredDemoras = demoras.filter(item => {
    // Filtro de texto (busca en todos los campos)
    if (filterText) {
      const haystack = JSON.stringify(item).toLowerCase();
      if (!haystack.includes(filterText.toLowerCase())) return false;
    }
    // Filtro Tiempo Total
    if (filterTiempoTotal) {
      if (!(item.tiempoTotal && item.tiempoTotal.includes(filterTiempoTotal))) return false;
    }
    // Filtro Nº Transacción (buscando en primerProceso)
    if (filterTransaccion) {
      if (
        !(
          item.primerProceso &&
          item.primerProceso.numeroTransaccion &&
          item.primerProceso.numeroTransaccion.toString().includes(filterTransaccion)
        )
      )
        return false;
    }
    // Filtro Condición (en primerProceso)
    if (filterCondicion) {
      if (
        !(
          item.primerProceso &&
          item.primerProceso.condicion &&
          item.primerProceso.condicion.toLowerCase().includes(filterCondicion.toLowerCase())
        )
      )
        return false;
    }
    // Filtro Método de Carga (en primerProceso)
    if (filterMetodo) {
      if (
        !(
          item.primerProceso &&
          item.primerProceso.metodoCarga &&
          item.primerProceso.metodoCarga.toLowerCase().includes(filterMetodo.toLowerCase())
        )
      )
        return false;
    }
    // Filtro por fecha (comparando item.fechaInicio)
    if (fechaInicio) {
      if (!(item.fechaInicio && item.fechaInicio >= fechaInicio)) return false;
    }
    if (fechaFinal) {
      if (!(item.fechaInicio && item.fechaInicio <= fechaFinal)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(totalCount / recordsPerPage) || 1;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-1 bg-gray-50 min-h-screen text-gray-800 pb-6">
      {/* Encabezado */}
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
            <div className="grid grid-cols-2 md:flex md:flex-row items-center mt-4 md:mt-0 gap-3">
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
                <span className="md:inline">Exportar Excel</span>
              </button>
              <button
                onClick={handleRefresh}
                title="Refrescar"
                className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded flex items-center gap-1 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                {refreshLoading ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                ) : (
                  <FiRefreshCw size={20} />
                )}
                <span className="md:inline">Refrescar</span>
              </button>
            </div>
          </div>
          {/* Filtros */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm">Fecha Inicio</label>
              <input
                type="date"
                 className="border text-black p-1 w-full rounded"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Fecha Final</label>
              <input
                type="date"
                 className="border text-black p-1 w-full rounded"
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
      <div className="overflow-x-auto bg-white shadow-md mt-6">
        <table
          id="demoras-table"
          className="min-w-full border-collapse table-auto text-sm"
        >
          <thead>
            <tr className="bg-blue-50 text-blue-700 text-xs md:text-sm">
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Fecha Inicio
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Total
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                N° Transacción
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Condición
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Pesador Entrada
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Portería Entrada
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Método Carga
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                N° Ejes
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Punto Despacho
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Báscula Entrada
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Precheq.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Fecha Precheq.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Precheq.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Scanner
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Fecha Scanner
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Scanner
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Fecha Autorización
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Autorizac.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Fecha Autorizac.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Autorizac.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Ing. Planta
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Ingreso
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Lleg. Básq. (P1)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Básq. (P1)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Entr. Básq. (P1)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Entr. Básq. (P1)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Sal. Básq. (P1)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Sal. Básq. (P1)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Operador
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Enlonador
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Modelo Equipo
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Personal Asig.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Personal Asig.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Lleg. Punto
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Punto
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Lleg. Oper.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Oper.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Lleg. Enlon.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Enlon.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Lleg. Equipo
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Equipo
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Inicio Carga
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Inicio Carga
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Term. Carga
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Term. Carga
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Salida Punto
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Salida Punto
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Báscula Salida
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Pesador Salida
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Lleg. Básq. (P3)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Básq. (P3)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Entr. Básq. (P3)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Entr. Básq. (P3)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Sal. Básq. (P3)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Sal. Básq. (P3)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Últ. Vuelta - Nº
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Últ. Vuelta - Lleg. Punto
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Punto (V)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Últ. Vuelta - Sal. Punto
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Sal. Punto (V)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Últ. Vuelta - Lleg. Básq.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Básq. (V)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Últ. Vuelta - Entr. Básq.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Entr. Básq. (V)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Últ. Vuelta - Sal. Básq.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Sal. Básq. (V)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Salida Planta
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Salida Planta
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Portería Salida
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Lleg. Portería
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Obs Lleg. Portería
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                B.E. (Entr → Sal)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Sal. B.E. → Lleg. Punto
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Tiempo Total Carga
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                Sal. Punto → B.S. Entr.
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                B.S. (Entr → Sal)
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">
                B.S. → Salida Planta
              </th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Acción</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-xs md:text-sm">
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
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.personalAsignado != null ? segundo.personalAsignado : "-"}</td>
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

      {/* Fila del paginador y cantidad de registros mostrados */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
        <div className="flex space-x-2 mb-2 sm:mb-0">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`px-3 py-1 border rounded ${
                currentPage === index + 1 ? "bg-blue-500 text-white" : ""
              }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            Mostrando {filteredDemoras.length} de {totalCount} registros
          </span>
          <label htmlFor="recordsPerPage" className="text-sm">
            Mostrar:
          </label>
          <select
            id="recordsPerPage"
            value={recordsPerPage}
            onChange={(e) => {
              setRecordsPerPage(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="text-black px-2 py-1 rounded"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Modal Minimalista y Responsive */}
      {showModal && selectedDemora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white w-full max-w-md md:max-w-4xl shadow-lg p-4 relative max-h-full overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              title="Cerrar"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700 text-center">
              Detalle del Registro
            </h2>
            <div className="space-y-4">
              <DetailTable
                title="Información General"
                data={{
                  Registro: selectedDemora.id,
                  "Fecha Inicio": selectedDemora.fechaInicio,
                  "Tiempo Total": selectedDemora.tiempoTotal || "-",
                  "Nº Transaccion": selectedDemora.primerProceso?.numeroTransaccion || "-",
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
                  "Tiempo Total Carga": calcularIntervalos(selectedDemora).calc3,
                  "Sal. Punto → B.S. Entr.": calcularIntervalos(selectedDemora).calc4,
                  "B.S. (Entr → Sal)": calcularIntervalos(selectedDemora).calc5,
                  "B.S. → Salida Planta": calcularIntervalos(selectedDemora).calc6,
                }}
              />
            </div>
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
