"use client";

import { useState, useEffect, useRef, Fragment, useCallback } from "react";
import { FiArrowLeft, FiFileText, FiRefreshCw } from "react-icons/fi";
import Swal from "sweetalert2";
import PDFEquipo from "../../../../components/PDFEquipo";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FaEye, FaFilePdf } from "react-icons/fa";

// Función debounce
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Definición de interfaces para la data
interface Inspeccion {
  id: number;
  titulo: string;
  cumple: boolean;
  observaciones?: string;
  equipoId: number;
  createdAt: string;
  updatedAt: string;
}

interface Equipo {
  id: number;
  userId: number | null;
  userName: string | null;
  equipo: string;
  horometro: string;
  operador: string;
  fecha: string;
  hora: string;
  horaDe: string;
  horaA: string;
  recomendaciones?: string;
  createdAt: string;
  updatedAt: string;
  inspecciones: Inspeccion[];
}

// Componente auxiliar que se encarga de descargar el PDF
function DownloadPDF({
  viewData,
  pdfKey,
  fileName,
  onDownload,
}: {
  viewData: Equipo;
  pdfKey: number;
  fileName: string;
  onDownload: () => void;
}) {
  const downloadTriggered = useRef(false);

  return (
    <div style={{ display: "none" }}>
      <PDFDownloadLink
        key={pdfKey}
        document={<PDFEquipo formData={viewData} />}
        fileName={fileName}
      >
        {({ loading, blob, url, error }) => {
          if (error && !downloadTriggered.current) {
            downloadTriggered.current = true;
            Swal.close();
            Swal.fire("Error", "Error generando PDF: " + error, "error");
          }
          if (!loading && blob && url && !downloadTriggered.current) {
            downloadTriggered.current = true;
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Swal.close();
            Swal.fire("Éxito", "PDF generado correctamente.", "success");
            setTimeout(() => {
              onDownload();
            }, 0);
          }
          return null;
        }}
      </PDFDownloadLink>
    </div>
  );
}

export default function EquiposPage() {
  // Estados para listado de equipos, paginación y búsqueda
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  // "searchInput" guarda el valor inmediato del input,
  // "search" se actualizará con debounce para disparar la consulta.
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Estados para filtros de fecha (para consulta y exportación)
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  
  // Estados para loading de exportación y refresco
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Estados para el modal de detalles y para la generación del PDF
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState<Equipo | null>(null);
  // Estado para mostrar el componente de descarga
  const [renderPDFLink, setRenderPDFLink] = useState(false);
  // Estado para forzar el re-montaje del componente DownloadPDF
  const [pdfKey, setPdfKey] = useState(0);

  // Función debounced para actualizar el estado de búsqueda
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
    }, 500),
    []
  );

  // Función para iniciar la descarga del PDF con alerta de carga
  const handleGenerarPDF = () => {
    Swal.fire({
      title: "Generando PDF",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    setRenderPDFLink(true);
    setPdfKey((prev) => prev + 1);
  };

  // Función para obtener equipos de la API
  async function fetchEquipos() {
    setLoading(true);
    try {
      const res = await fetch(`/api/equipos?search=${search}&page=${page}&limit=${limit}`);
      const data = await res.json();
      setEquipos(data.data);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error fetching equipos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Exportar Excel
  const handleExportarExcel = async () => {
    if (!fechaInicio || !fechaFinal) {
      Swal.fire("Información", "Debe seleccionar la fecha de Inicio y Final.", "warning");
      return;
    }
    setExportLoading(true);
    Swal.fire({
      title: "Generando Reporte",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const response = await fetch(
        `/api/equipos/export-excel?fechaInicio=${fechaInicio}&fechaFinal=${fechaFinal}`
      );
      if (!response.ok) {
        Swal.fire("Error", "Error en la exportación: " + response.status, "error");
        setExportLoading(false);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `Equipos-${fechaInicio}-${fechaFinal}.xlsx`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Swal.fire("Éxito", "Archivo generado correctamente.", "success");
    } catch (error: any) {
      Swal.fire("Error", "Error exportando Excel: " + error.message, "error");
    } finally {
      setExportLoading(false);
    }
  };
  
  const filteredEquipos = equipos.filter((b) => {
    const fechaEquipo = new Date(b.fecha);
    const inicio = fechaInicio ? new Date(fechaInicio) : null;
    const fin = fechaFinal ? new Date(fechaFinal) : null;
  
    if (inicio && fin) {
      return fechaEquipo >= inicio && fechaEquipo <= fin;
    } else if (inicio) {
      return fechaEquipo >= inicio;
    } else if (fin) {
      return fechaEquipo <= fin;
    }
    return true;
  });

  // Función para refrescar la lista de equipos y mostrar alerta al finalizar
  const handleRefresh = async () => {
    setRefreshLoading(true);
    await fetchEquipos();
    setRefreshLoading(false);
    Swal.fire("Refrescado", "Datos actualizados", "success");
  };

  useEffect(() => {
    fetchEquipos();
  }, [search, page, limit]);

  // Función para expandir/contraer la lista de inspecciones en la tabla principal
  const toggleRow = (id: number) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter((rid) => rid !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  // Paginación
  const totalPages = Math.ceil(totalCount / limit);

  // Abre el modal de ver detalles con la data del equipo seleccionado
  const handleViewDetails = (equipo: Equipo) => {
    setViewData(equipo);
    setShowViewModal(true);
    setRenderPDFLink(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Encabezado */}
      <header className="bg-[#003E9B] text-white shadow-lg md:sticky md:top-0 z-50">
        <div className="mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex items-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-white hover:bg-gray-200 text-blue-600 p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
                title="Volver"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">Historial de Equipos</h1>
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
          {/* Filtros de fecha */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm">Fecha Inicio</label>
              <input
                type="date"
                className="border text-black p-1 w-full rounded"
                placeholder="dd/mm/aaaa"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Fecha Final</label>
              <input
                type="date"
                className="border text-black p-1 w-full rounded"
                placeholder="dd/mm/aaaa"
                value={fechaFinal}
                onChange={(e) => {
                  setFechaFinal(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {/* Campo de búsqueda en el header */}
            <div className="flex flex-col">
              <label className="text-sm">Buscar</label>
              <input
                type="text"
                placeholder="Escriba aquí..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSetSearch(e.target.value);
                  setPage(1);
                }}
                className="border text-black p-1 w-full rounded"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="p-4 max-w-6xl mx-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm bg-white">
            <thead className="bg-gray-300">
              <tr>
                <th className="p-2 border whitespace-nowrap">Fecha</th>
                <th className="p-2 border whitespace-nowrap">Equipo</th>
                <th className="p-2 border whitespace-nowrap">Operador</th>
                <th className="p-2 border whitespace-nowrap">Turno</th>
                <th className="p-2 border whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-2 border text-center" colSpan={6}>
                    Cargando...
                  </td>
                </tr>
              ) : equipos.length === 0 ? (
                <tr>
                  <td className="p-2 border text-center" colSpan={6}>
                    No hay registros
                  </td>
                </tr>
              ) : (
                filteredEquipos.map((eq) => (
                  <Fragment key={eq.id}>
                    <tr className="border-b text-center">
                      <td className="p-2 border whitespace-nowrap">{eq.fecha} {eq.hora}</td>
                      <td className="p-2 border whitespace-nowrap">{eq.equipo}</td>
                      <td className="p-2 border whitespace-nowrap">{eq.operador}</td>
                      <td className="p-2 border whitespace-nowrap">{eq.horaDe} - {eq.horaA}</td>
                      <td className="p-2 border flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(eq)}
                          className="bg-blue-500 text-white p-2 rounded"
                          title="Ver detalles"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                    {expandedRows.includes(eq.id) && (
                      <tr>
                        <td colSpan={6} className="p-2 border bg-gray-50">
                          <strong>Inspecciones:</strong>
                          <ul className="list-disc pl-5">
                            {eq.inspecciones.map((insp) => (
                              <li key={insp.id}>
                                {insp.titulo} – {insp.cumple ? "Cumple" : "No cumple"}
                                {insp.observaciones && ` (${insp.observaciones})`}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación y opción de registros por página */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
          <div className="flex overflow-x-auto space-x-2 w-full sm:w-auto">
            <button
              className="px-3 py-1 bg-white border rounded disabled:opacity-50 flex-shrink-0"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={page === 1 || loading || totalCount === 0}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`px-3 py-1 border rounded flex-shrink-0 ${
                  page === index + 1 ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 bg-white border rounded disabled:opacity-50 flex-shrink-0"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page === totalPages || loading || totalCount === 0}
            >
              Siguiente
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center">
            <span className="text-sm">
              Mostrando {equipos.length} de {totalCount} registros
            </span>
            <div className="flex items-center gap-1">
              <label htmlFor="recordsPerPage" className="text-sm">
                Mostrar:
              </label>
              <select
                id="recordsPerPage"
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="text-black px-2 py-1 rounded"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="400">400</option>
                <option value="800">800</option>
                <option value="1200">1200</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de ver detalles */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white w-full max-w-7xl shadow-lg p-4 relative max-h-[98vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Detalles del Equipo</h2>
            </div>
            <div className="mb-6">
              <table className="min-w-full border-collapse table-auto">
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-2 border-gray-500">
                      <div className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
                        <div className="sm:flex-1">
                          <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                            Equipo
                          </label>
                          <input
                            type="text"
                            value={viewData.equipo}
                            readOnly
                            className="w-full p-2 text-base border-2 border-gray-500 rounded-md"
                          />
                        </div>
                        <div className="sm:flex-1">
                          <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                            Horómetro
                          </label>
                          <input
                            type="text"
                            value={viewData.horometro}
                            readOnly
                            className="w-full p-2 text-base border-2 border-gray-500 rounded-md"
                          />
                        </div>
                        <div className="sm:flex-1">
                          <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                            Fecha
                          </label>
                          <input
                            type="text"
                            value={`${viewData.fecha} ${viewData.hora}`}
                            readOnly
                            className="w-full p-2 text-base border-2 border-gray-500 rounded-md"
                          />
                        </div>
                        <div className="sm:flex-1">
                          <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                            Operador
                          </label>
                          <input
                            type="text"
                            value={viewData.operador}
                            readOnly
                            className="w-full p-2 text-base border-2 border-gray-500 rounded-md"
                            placeholder="Ingrese nombre del operador"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-2 border-gray-500" colSpan={3}>
                      <div className="flex flex-col sm:flex-row sm:space-x-4">
                        <div className="flex-1">
                          <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                            Turno de
                          </label>
                          <input
                            type="time"
                            name="turnoInicio"
                            value={viewData.horaDe}
                            readOnly
                            className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                            a
                          </label>
                          <input
                            type="time"
                            name="turnoFin"
                            value={viewData.horaA}
                            readOnly
                            className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Inspecciones</h3>
              <div className="block md:hidden">
                {viewData.inspecciones.map((item, index) => (
                  <div key={item.id} className="p-4 border-2 border-gray-500 rounded-md mb-4">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-600 text-white text-base mr-2">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-800 text-base">{item.titulo}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-800 text-base">¿Cumple condición?</span>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-1 text-gray-800 text-base">
                          <input
                            type="checkbox"
                            checked={item.cumple === true}
                            readOnly
                            className="form-checkbox h-6 w-6 accent-orange-500"
                          />
                          <span>SI</span>
                        </label>
                        <label className="flex items-center space-x-1 text-gray-800 text-base">
                          <input
                            type="checkbox"
                            checked={item.cumple === false}
                            readOnly
                            className="form-checkbox h-6 w-6 accent-orange-500"
                          />
                          <span>NO</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-800 font-semibold text-base mb-1">
                        Observaciones:
                      </label>
                      <textarea
                        placeholder="Sin observaciones."
                        value={item.observaciones || ""}
                        readOnly
                        className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y min-h-[10px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                        N°
                      </th>
                      <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                        Parte Evaluada
                      </th>
                      <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                        Cumple
                      </th>
                      <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewData.inspecciones.map((item, index) => (
                      <tr key={item.id}>
                        <th scope="row" className="px-4 py-3 border-2 border-gray-500 text-base text-gray-700">
                          {index + 1}
                        </th>
                        <td className="px-4 py-3 border-2 border-gray-500 text-base text-gray-700">
                          {item.titulo}
                        </td>
                        <td className="px-4 py-3 border-2 border-gray-500 text-base text-gray-700">
                          <div className="flex justify-center items-center space-x-4">
                            <label className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                checked={item.cumple === true}
                                readOnly
                                className="form-checkbox h-6 w-6 accent-orange-500"
                              />
                              <span className="text-base">SI</span>
                            </label>
                            <label className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                checked={item.cumple === false}
                                readOnly
                                className="form-checkbox h-6 w-6 accent-orange-500"
                              />
                              <span className="text-base">NO</span>
                            </label>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-2 border-gray-500 text-base text-gray-700">
                          <textarea
                            value={item.observaciones || ""}
                            readOnly
                            className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y min-h-[10px]"
                            placeholder="Sin observaciones."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-base font-semibold text-gray-800">
                Recomendaciones:
              </label>
              <textarea
                value={viewData.recomendaciones || ""}
                readOnly
                className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y min-h-[120px]"
                placeholder="Ingrese recomendaciones aquí..."
              />
            </div>
            <div className="mt-4 flex justify-end gap-4">
              <button
                onClick={handleGenerarPDF}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Generar PDF
                <FaFilePdf size={24} />
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setRenderPDFLink(false);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cerrar
              </button>
            </div>
            {renderPDFLink && viewData && (
              <DownloadPDF
                key={pdfKey}
                pdfKey={pdfKey}
                viewData={viewData}
                fileName={`Equipo-${viewData.id}-${new Date().toISOString()}.pdf`}
                onDownload={() => setRenderPDFLink(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
