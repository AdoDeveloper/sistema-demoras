"use client";

import { useState, useEffect } from "react";
import React from "react";
import { FaEye, FaEdit } from "react-icons/fa";
import Loader from "../../../../../components/Loader";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";
import Swal from "sweetalert2";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Función auxiliar para mostrar valores (si es null, undefined o cadena vacía, devuelve "-")
function displayValue(value: any): string {
  return value == null || value === "" ? "-" : String(value);
}

// Componente para mostrar una tabla con información general en el modal
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
              <td className="px-2 py-1 font-bold bg-blue-50 whitespace-nowrap">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </td>
              <td className="px-2 py-1 whitespace-nowrap">{displayValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente para listar los detalles de cada actividad en el modal
function ActividadDetails({ detalles }: { detalles: any[] }) {
  if (!detalles || detalles.length === 0) return null;
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-blue-700 mb-1">Actividades</h3>
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="bg-blue-50 text-blue-700">
            <th className="border px-2 py-1">Actividad</th>
            <th className="border px-2 py-1">Inicio</th>
            <th className="border px-2 py-1">Fin</th>
            <th className="border px-2 py-1">Duración</th>
            <th className="border px-2 py-1">Responsables</th>
          </tr>
        </thead>
        <tbody>
          {detalles.map((detalle) => (
            <tr key={detalle.id} className="border-b">
              <td className="border px-2 py-1">{detalle.activity || "-"}</td>
              <td className="border px-2 py-1">{detalle.startTime || "-"}</td>
              <td className="border px-2 py-1">{detalle.endTime || "-"}</td>
              <td className="border px-2 py-1">{detalle.duration || "-"}</td>
              <td className="border px-2 py-1">{detalle.responsables || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente Principal: ActividadesPage
export default function ActividadesPage() {
  const [actividades, setActividades] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedActividad, setSelectedActividad] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para botones
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Estados para filtros (se simplifican a fecha y búsqueda general)
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [filterText, setFilterText] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // Rol y usuario
  const [roleId, setRoleId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRoleId = localStorage.getItem("roleId");
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) setUserId(Number(storedUserId));
      if (storedRoleId) setRoleId(Number(storedRoleId));
    }
  }, []);

  // Obtener data desde el backend (endpoint "/api/actividades")
  const fetchActividades = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
      });
      const res = await fetch(`/api/demoras/actividad?${queryParams.toString()}`);
      if (!res.ok) {
        Swal.fire("Error", "Error al obtener registros: " + res.status, "error");
        if (!isRefresh) setLoading(false);
        return;
      }
      const result = await res.json();
      setActividades(result.data);
      setTotalCount(result.totalCount);
    } catch (error: any) {
      Swal.fire("Error", "Error de red o parse JSON: " + error.message, "error");
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    fetchActividades();
  }, [currentPage, recordsPerPage]);

  const handleOpenModal = (item: any) => {
    setSelectedActividad(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedActividad(null);
  };

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
        `/api/demoras/actividad/export-excel?fechaInicio=${fechaInicio}&fechaFinal=${fechaFinal}`
      );
      if (!response.ok) {
        Swal.fire("Error", "Error en la exportación: " + response.status, "error");
        setExportLoading(false);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `Actividades-${fechaInicio}-${fechaFinal}.xlsx`;
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

  // Refrescar data
  const handleRefresh = async () => {
    setRefreshLoading(true);
    await fetchActividades(true);
    setRefreshLoading(false);
    Swal.fire("Actualizado", "Datos actualizados", "success");
  };

  // Generación y descarga de PDF para la actividad
  const handleDescargarPDF = async () => {
    if (!selectedActividad) {
      Swal.fire("Error", "No hay registro seleccionado", "error");
      return;
    }
    Swal.fire({
      title: "Generando PDF...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const pdfDoc = await PDFDocument.create();
      const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      let currentPagePdf = pdfDoc.addPage();
      const { width, height } = currentPagePdf.getSize();
      const margin = 40;
      let yPosition = height - margin;
      const lineHeight = 14;

      const drawWrappedText = (text: string, size: number = 10, font = timesRomanFont, x = margin) => {
        const lines = text.split("\n");
        lines.forEach((line) => {
          if (yPosition < margin + lineHeight) {
            currentPagePdf = pdfDoc.addPage();
            yPosition = currentPagePdf.getSize().height - margin;
          }
          currentPagePdf.drawText(line, { x, y: yPosition, size, font, color: rgb(0, 0, 0) });
          yPosition -= lineHeight;
        });
      };

      // Encabezado del PDF
      drawWrappedText("Reporte de Actividades", 16, timesRomanFont);
      drawWrappedText(`Detalle del Registro #${selectedActividad.id}`, 14, timesRomanFont);
      drawWrappedText("-----------------------------------------------------", 10, courierFont);

      // Información General
      const generalInfo = `Registro: ${selectedActividad.id}
      Fecha: ${selectedActividad.fecha}
      Total Actividades: ${selectedActividad.totalActividades}
      Duración Total: ${selectedActividad.totalDuracion}
      Usuario: ${selectedActividad.userName}`;
      drawWrappedText(generalInfo, 10, courierFont);
      drawWrappedText("-----------------------------------------------------", 10, courierFont);

      // Detalles
      drawWrappedText("Detalles de la Actividad:", 12, timesRomanFont);
      selectedActividad.detalles.forEach((detalle: any, index: number) => {
        const detalleText = `Detalle ${index + 1}:
      Actividad: ${detalle.activity}
      Inicio: ${detalle.startTime}
      Fin: ${detalle.endTime}
      Duración: ${detalle.duration}
      Responsables: ${detalle.responsables}
      -----------------------------------------------------`;
        drawWrappedText(detalleText, 10, courierFont);
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Detalle-Actividad-${selectedActividad.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      Swal.close();
      Swal.fire("Éxito", "Archivo generado correctamente.", "success");
    } catch (error: any) {
      Swal.close();
      Swal.fire("Error", "Error generando PDF: " + error.message, "error");
    }
  };

  // Filtro de actividades basado en fecha y búsqueda general
  const filteredActividades = actividades.filter((item) => {
    if (filterText && !JSON.stringify(item).toLowerCase().includes(filterText.toLowerCase())) return false;
    if (fechaInicio && item.fecha < fechaInicio) return false;
    if (fechaFinal && item.fecha > fechaFinal) return false;
    return true;
  });

  const totalPages = Math.ceil(totalCount / recordsPerPage) || 1;

  // Función para editar registro
  const handleEditRecord = (record: any) => {
    Swal.fire({
      title: `¿Desea editar el registro #${record.id}?`,
      html: `<p><strong>Usuario:</strong> ${record.userName}</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, editar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.setItem("actividadId", record.id);
        router.push(`/proceso/editar/actividades`);
      }
    });
  };

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
      <div className="mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex items-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
                title="Volver"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">Registros Actividades</h1>
            </div>
            <div className="grid grid-cols-2 md:flex md:flex-row items-center gap-3 mt-4 md:mt-0">
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
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4">
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
              <label className="text-sm">Buscar</label>
              <input
                type="text"
                placeholder="Buscar..."
                className="text-black px-2 py-1 rounded"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Tabla de Registros */}
      <div className="overflow-x-auto bg-white shadow-md mt-6">
        <table id="actividades-table" className="min-w-full border-collapse table-auto text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-700 text-xs md:text-sm">
              <th className="border px-2 py-1 whitespace-nowrap text-left">Fecha</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Total Actividades</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Duración Total</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Acción</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-xs md:text-sm">
            {filteredActividades.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="border px-2 py-1 whitespace-nowrap">{item.fecha || "-"}</td>
                <td className="border px-2 py-1 whitespace-nowrap">{item.totalActividades || "-"}</td>
                <td className="border px-2 py-1 whitespace-nowrap">{item.totalDuracion || "-"}</td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  <button
                    onClick={() => handleOpenModal(item)}
                    title="Ver Detalle"
                    className="bg-indigo-700 hover:bg-indigo-800 text-white p-2 rounded transition-all duration-300 transform hover:scale-105 text-xs"
                  >
                    <FaEye size={18} />
                  </button>
                  {(roleId === 1 || userId === item.userId) && (
                    <button
                      onClick={() => handleEditRecord(item)}
                      title="Editar"
                      hidden
                      className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded ml-2 transition-all duration-300 transform hover:scale-105 text-xs"
                    >
                      <FaEdit size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
        <div className="flex overflow-x-auto space-x-2 w-full sm:w-auto">
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
              className={`px-3 py-1 border rounded ${currentPage === index + 1 ? "bg-blue-500 text-white" : ""}`}
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
        <div className="flex flex-col sm:flex-row items-center gap-1 text-center">
          <span className="text-sm">
            Mostrando {filteredActividades.length} de {totalCount} registros
          </span>
          <div className="flex items-center gap-1">
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
              <option value="200">200</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      {showModal && selectedActividad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white w-full max-w-md md:max-w-4xl shadow-lg p-4 relative max-h-full overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              title="Cerrar"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700 text-center">Detalles del Registro</h2>
            <div className="space-y-4">
              <DetailTable
                title="Información General"
                data={{
                  Registro: selectedActividad.id,
                  Fecha: selectedActividad.fecha,
                  "Total Actividades": selectedActividad.totalActividades,
                  "Duración Total": selectedActividad.totalDuracion,
                  Usuario: selectedActividad.userName,
                }}
              />
              <ActividadDetails detalles={selectedActividad.detalles} />
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
