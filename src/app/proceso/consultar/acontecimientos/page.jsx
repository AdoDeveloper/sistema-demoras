"use client";

import { useState, useEffect, useRef, Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiArrowLeft, FiFileText, FiRefreshCw } from "react-icons/fi";
import Swal from "sweetalert2";
import PDFAcontecimiento from "../../../../components/PDFAcontecimiento";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FaEdit, FaEye, FaFilePdf } from "react-icons/fa";

// debounce helper
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Componente oculto que dispara la descarga del PDF
function DownloadPDF({ viewData, pdfKey, fileName, onDownload }) {
  const downloadTriggered = useRef(false);

  return (
    <div style={{ display: "none" }}>
      <PDFDownloadLink
        key={pdfKey}
        document={<PDFAcontecimiento data={viewData} />}
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
            setTimeout(onDownload, 0);
          }
          return null;
        }}
      </PDFDownloadLink>
    </div>
  );
}

export default function AcontecimientosPage() {
  const { data: session } = useSession();
  const roleId = session?.user?.roleId ?? null;

  const [acontecimientos, setAcontecimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState([]);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [renderPDFLink, setRenderPDFLink] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  const debouncedSetSearch = useCallback(
    debounce((v) => setSearch(v), 500),
    []
  );

  const router = useRouter();

  // Función para obtener datos desde la API acontecimientos
  async function fetchAcontecimientos() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/acontecimientos?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`
      );
      const { data, totalCount } = await res.json();
      setAcontecimientos(data);
      setTotalCount(totalCount);
    } catch (e) {
      console.error("Error fetching acontecimientos:", e);
      Swal.fire("Error", "No se pudieron cargar los acontecimientos.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Corre fetch al cambiar búsqueda, página o límite
  useEffect(() => {
    fetchAcontecimientos();
  }, [search, page, limit]);

  const handleRefresh = async () => {
    setRefreshLoading(true);
    await fetchAcontecimientos();
    setRefreshLoading(false);
    Swal.fire("Refrescado", "Datos actualizados", "success");
  };

  // Nota: No tienes API para exportar Excel, si la agregas, adapta este código
  const handleExportarExcel = async () => {
    if (!fechaInicio || !fechaFinal) {
      return Swal.fire(
        "Información",
        "Debe seleccionar fecha Inicio y Final.",
        "warning"
      );
    }
    setExportLoading(true);
    Swal.fire({
      title: "Generando Reporte",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const resp = await fetch(
        `/api/acontecimientos/export-excel?fechaInicio=${fechaInicio}&fechaFinal=${fechaFinal}`
      );
      if (!resp.ok) throw new Error(resp.statusText);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Acontecimientos_Interrupciones_${fechaInicio}_${fechaFinal}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Swal.fire("Éxito", "Archivo generado correctamente.", "success");
    } catch (err) {
      Swal.fire("Error", "Error exportando Excel: " + err.message, "error");
    } finally {
      setExportLoading(false);
    }
  };

  const toggleRow = (id) =>
    setExpandedRows((rs) =>
      rs.includes(id) ? rs.filter((x) => x !== id) : [...rs, id]
    );

  const handleViewDetails = (item) => {
    setViewData(item);
    setShowViewModal(true);
    setRenderPDFLink(false);
  };

  const handleGenerarPDF = () => {
    Swal.fire({
      title: "Generando PDF",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    setRenderPDFLink(true);
    setPdfKey((k) => k + 1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  // Filtrar por fechas en cliente (opcional)
  const filtered = acontecimientos.filter((r) => {
    const f = new Date(r.fecha);
    const i = fechaInicio ? new Date(fechaInicio) : null;
    const j = fechaFinal ? new Date(fechaFinal) : null;
    if (i && j) return f >= i && f <= j;
    if (i) return f >= i;
    if (j) return f <= j;
    return true;
  });

//   const handleEditRecord = (item) => {
//     localStorage.setItem("acontecimientoId", item.id);
//     router.push(`/proceso/editar/acontecimiento`);
//   };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
        <div className="mx-auto px-4 py-4 flex flex-col md:flex-row justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="bg-white text-blue-900 p-2 rounded-full mr-3 hover:bg-gray-200 transition"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Acontecimientos e Interrupciones</h1>
          </div>
          <div className="flex gap-3 mt-3 md:mt-0">
            {(roleId === 1 || roleId === 8) && (
              <button
                onClick={handleExportarExcel}
                className="bg-green-700 hover:bg-green-800 px-3 py-2 rounded flex items-center gap-1"
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                ) : (
                  <FiFileText size={20} />
                )}
                <span>Exportar Excel</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded flex items-center gap-1"
              disabled={refreshLoading}
            >
              {refreshLoading ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
              ) : (
                <FiRefreshCw size={20} />
              )}
              <span>Refrescar</span>
            </button>
          </div>
        </div>
        {/* Filters */}
        <div className="mx-auto px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm">Fecha Inicio</label>
            <input
              type="date"
              className="w-full p-1 rounded border text-black"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-sm">Fecha Final</label>
            <input
              type="date"
              className="w-full p-1 rounded border text-black"
              value={fechaFinal}
              onChange={(e) => {
                setFechaFinal(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-sm">Buscar</label>
            <input
              type="text"
              className="w-full p-1 rounded border text-black"
              placeholder="Filtrar por fecha, turno, condición..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSetSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </header>

      {/* Table */}
      <main className="p-4 max-w-7xl mx-auto">
        <div className="overflow-x-auto bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border whitespace-nowrap">Fecha</th>
                <th className="p-2 border whitespace-nowrap">Turno</th>
                <th className="p-2 border whitespace-nowrap">Condición</th>
                <th className="p-2 border whitespace-nowrap">Operadores</th>
                <th className="p-2 border whitespace-nowrap">Enlonadores</th>
                <th className="p-2 border whitespace-nowrap">Equipos</th>
                <th className="p-2 border whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-4 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-4 text-center">
                    No hay registros
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <Fragment key={item.id}>
                    <tr className="border-b text-center align-middle">
                      <td className="p-2 whitespace-nowrap">{item.fecha}</td>
                      <td className="p-2 whitespace-nowrap">{item.turno || "-"}</td>
                      <td className="p-2 whitespace-nowrap">{item.condicion || "-"}</td>
                      <td className="p-2 whitespace-nowrap">{item.operadores ?? "-"}</td>
                      <td className="p-2 whitespace-nowrap">{item.enlonadores ?? "-"}</td>
                      <td className="p-2 whitespace-nowrap">{item.equipos ?? "-"}</td>
                      <td className="p-2 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="bg-blue-500 text-white p-2 rounded mr-1"
                          title="Ver modal detalle"
                        >
                          <FaEye size={18} />
                        </button>
                        {/* {roleId === 1 && (
                          <button
                            onClick={() => handleEditRecord(item)}
                            title="Editar"
                            className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded ml-1"
                          >
                            <FaEdit size={18} />
                          </button>
                        )} */}
                      </td>
                    </tr>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  page === i + 1 ? "bg-blue-500 text-white" : ""
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className="text-sm">
              Mostrando {filtered.length} de {totalCount}
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(+e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 border rounded"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </main>

      {/* Detalles Modal */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg overflow-auto max-h-[90vh] p-6">
            <h2 className="text-2xl font-bold mb-4">
              Detalle de Acontecimiento #{viewData.id}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block font-semibold">Fecha</label>
                <p>{viewData.fecha}</p>
              </div>
              <div>
                <label className="block font-semibold">Turno</label>
                <p>{viewData.turno || "-"}</p>
              </div>
              <div>
                <label className="block font-semibold">Condición</label>
                <p>{viewData.condicion || "-"}</p>
              </div>
              <div>
                <label className="block font-semibold">Operadores</label>
                <p>{viewData.operadores ?? "-"}</p>
              </div>
              <div>
                <label className="block font-semibold">Enlonadores</label>
                <p>{viewData.enlonadores ?? "-"}</p>
              </div>
              <div>
                <label className="block font-semibold">Equipos</label>
                <p>{viewData.equipos ?? "-"}</p>
              </div>
              <div>
                <label className="block font-semibold">Puntos Descarga</label>
                <p>
                  {Array.isArray(viewData.puntosDescarga)
                    ? viewData.puntosDescarga.join(", ")
                    : "-"}
                </p>
              </div>
              <div>
                <label className="block font-semibold">Básculas</label>
                <p>
                  {Array.isArray(viewData.basculas)
                    ? viewData.basculas.join(", ")
                    : "-"}
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-3">Acontecimientos Detallados</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 border whitespace-nowrap">Razón</th>
                    <th className="px-4 py-2 border whitespace-nowrap">Hora Inicio</th>
                    <th className="px-4 py-2 border whitespace-nowrap">Hora Final</th>
                    <th className="px-4 py-2 border whitespace-nowrap">Tiempo Total</th>
                    <th className="px-4 py-2 border whitespace-nowrap">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(viewData.acontecimientos) && viewData.acontecimientos.length > 0 ? (
                    viewData.acontecimientos.map((ac, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 border whitespace-nowrap">{ac.razon || "-"}</td>
                        <td className="px-4 py-2 border whitespace-nowrap">{ac.horaInicio || "-"}</td>
                        <td className="px-4 py-2 border whitespace-nowrap">{ac.horaFinal || "-"}</td>
                        <td className="px-4 py-2 border whitespace-nowrap">{ac.tiempoTotal || "-"}</td>
                        <td className="px-4 py-2 border">{ac.observaciones || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center">
                        No hay registros de acontecimientos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              {(roleId === 1 || roleId === 8) && (
                <button
                  onClick={handleGenerarPDF}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Generar PDF <FaFilePdf />
                </button>
              )}
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setRenderPDFLink(false);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cerrar
              </button>
            </div>

            {renderPDFLink && (
              <DownloadPDF
                key={pdfKey}
                pdfKey={pdfKey}
                viewData={viewData}
                fileName={`Acontecimientos_Interrupciones_${viewData.id}_${new Date().toISOString()}.pdf`}
                onDownload={() => setRenderPDFLink(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
