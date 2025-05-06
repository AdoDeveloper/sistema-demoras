"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaFilePdf, FaSignOutAlt } from "react-icons/fa";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default function Profile() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Estado general
  const [loading, setLoading] = useState(true);

  // Datos de API (solo para roles 1 y 2)
  const [apiUser, setApiUser] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [globalStatsEnv, setGlobalStatsEnv] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [envDailyStats, setEnvDailyStats] = useState([]);

  // Paginación unificada
  const [pagination, setPagination] = useState({
    demoras: { page: 1, totalPages: 1 },
    envasados: { page: 1, totalPages: 1 }
  });

  // Opciones de cantidad de registros por página
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const recordsPerPageOptions = [5, 10, 15, 20, 25, 50];

  // Pestaña activa: "demoras" o "envasados"
  const [activeTab, setActiveTab] = useState("demoras");

  // Filtros de fecha
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Estado PDF
  const [isGenerating, setIsGenerating] = useState(false);

  // Extraer roleId y datos de perfil desde session
  const roleId = session?.user?.roleId;
  const sessionName = session?.user?.nombreCompleto ?? "";
  const sessionRoleName = session?.user?.roleName ?? "";
  const sessionCode = session?.user?.codigo ?? "";

  // Determinar si debe cargar datos de estadísticas
  const canViewData = roleId === 1 || roleId === 2;

  // Fetch de API: solo cuando canViewData = true
  useEffect(() => {
    if (!canViewData) {
      setLoading(false);
      return;
    }
    
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      try {
        const url =
          `/api/user/profile?demorasPage=${pagination.demoras.page}` +
          `&envasadosPage=${pagination.envasados.page}` +
          `&limit=${recordsPerPage}` +
          `&startDate=${encodeURIComponent(startDate)}` +
          `&endDate=${encodeURIComponent(endDate)}`;

        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        // Perfil
        setApiUser(data.user);

        // Granel
        setGlobalStats(data.granel.stats);
        setDailyStats(data.granel.dailyStats || []);
        
        // Envasado
        setGlobalStatsEnv(data.envasado.stats);
        setEnvDailyStats(data.envasado.dailyStats || []);

        // Actualizar paginación
        setPagination(prev => ({
          demoras: {
            ...prev.demoras,
            totalPages: data.granel.pagination.totalPages || 1
          },
          envasados: {
            ...prev.envasados,
            totalPages: data.envasado.pagination.totalPages || 1
          }
        }));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron obtener los datos.",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [
    pagination.demoras.page, 
    pagination.envasados.page, 
    startDate, 
    endDate, 
    activeTab, 
    canViewData,
    recordsPerPage
  ]);

  // Handlers de paginación y filtro
  const handleFilter = (e) => {
    e.preventDefault();
    // Reiniciar ambas páginas al filtrar
    setPagination({
      demoras: { ...pagination.demoras, page: 1 },
      envasados: { ...pagination.envasados, page: 1 }
    });
  };

  const handlePrevPage = () => {
    setPagination(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        page: Math.max(prev[activeTab].page - 1, 1)
      }
    }));
  };

  const handleNextPage = () => {
    setPagination(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        page: Math.min(prev[activeTab].page + 1, prev[activeTab].totalPages)
      }
    }));
  };

  // Cambiar de pestaña
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Cambiar cantidad de registros por página
  const handleRecordsPerPageChange = (e) => {
    const newValue = parseInt(e.target.value);
    setRecordsPerPage(newValue);
    // Reiniciar a la primera página cuando cambia la cantidad de registros
    setPagination({
      demoras: { ...pagination.demoras, page: 1 },
      envasados: { ...pagination.envasados, page: 1 }
    });
  };

  // Util para espera
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    Swal.fire({
      title: "Generando reporte...",
      text: "Por favor espere mientras se genera el PDF.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const pdfDoc = await PDFDocument.create();
      let pagePDF = pdfDoc.addPage();
      const { width, height } = pagePDF.getSize();
      const margin = 50;
      const contentWidth = width - margin * 2;
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 10;
      const titleFontSize = 16;
      const subtitleFontSize = 14;

      const reportType = activeTab === "envasados" ? "Envasado" : "Granel";

      // Función para dibujar el encabezado
      const drawPDFHeader = (page, currentY) => {
        page.drawText("ALMAPAC S.A. de C.V.", {
          x:
            margin +
            contentWidth / 2 -
            boldFont.widthOfTextAtSize("ALMAPAC S.A. de C.V.", titleFontSize) /
              2,
          y: currentY,
          size: titleFontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        currentY -= 20;
        page.drawText("Reporte de Actividades", {
          x:
            margin +
            contentWidth / 2 -
            boldFont.widthOfTextAtSize("Reporte de Actividades", subtitleFontSize) /
              2,
          y: currentY,
          size: subtitleFontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        currentY -= 20;
        page.drawText(`Toma de Tiempos ${reportType}`, {
          x:
            margin +
            contentWidth / 2 -
            boldFont.widthOfTextAtSize(`Toma de Tiempos ${reportType}`, 12) /
              2,
          y: currentY,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        return currentY - 20;
      };

      let startY = drawPDFHeader(pagePDF, height - margin);

      // Información del usuario
      const userInfoY = startY;
      pagePDF.drawText(`${apiUser?.nombreCompleto || "N/A"}`, {
        x: margin,
        y: userInfoY,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      pagePDF.drawText(`Código: ${apiUser?.codigo || "N/A"}`, {
        x: margin,
        y: userInfoY - 20,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      pagePDF.drawText(`${apiUser?.role?.name || "N/A"}`, {
        x: margin,
        y: userInfoY - 40,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      let totalRegistros, totalCabaleo, totalCargaMaxima, dailyStatsData;
      if (activeTab === "demoras") {
        totalRegistros = globalStats?.totalRegistros || 0;
        totalCabaleo = globalStats?.totalCabaleo || 0;
        totalCargaMaxima = globalStats?.totalCargaMaxima || 0;
        dailyStatsData = dailyStats;
      } else {
        totalRegistros = globalStatsEnv?.totalRegistros || 0;
        totalCabaleo = globalStatsEnv?.totalCabaleo || 0;
        totalCargaMaxima = globalStatsEnv?.totalCargaMaxima || 0;
        dailyStatsData = envDailyStats;
      }

      if (apiUser?.role?.id === 1) {
        pagePDF.drawText(`Total Registros: ${totalRegistros}`, {
          x: margin,
          y: userInfoY - 60,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      } else {
        pagePDF.drawText(`Total Realizados: ${totalRegistros}`, {
          x: width - margin - 150,
          y: userInfoY,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        pagePDF.drawText(`Total Carga Máxima: ${totalCargaMaxima}`, {
          x: width - margin - 150,
          y: userInfoY - 20,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        pagePDF.drawText(`Total Cabaleo: ${totalCabaleo}`, {
          x: width - margin - 150,
          y: userInfoY - 40,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      }

      let startTableY = userInfoY - 80;
      const rowHeight = 20;
      const tableWidth = contentWidth;
      const colWidths = [
        Math.floor(tableWidth * 0.12),
        Math.floor(tableWidth * 0.10),
        Math.floor(tableWidth * 0.35),
        Math.floor(tableWidth * 0.12),
        Math.floor(tableWidth * 0.17),
        Math.floor(tableWidth * 0.14),
      ];

      dailyStatsData.forEach((stat, index) => {
        if (startTableY < margin + 100) {
          pagePDF = pdfDoc.addPage();
          startTableY = drawPDFHeader(pagePDF, height - margin);
          startTableY -= 20;
        }
        if (index > 0) startTableY -= 30;
        pagePDF.drawText(`Registro del día ${stat.fecha}`, {
          x: margin,
          y: startTableY,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        startTableY -= 20;
        const headers = [
          "Fecha",
          "Código",
          "Nombre",
          "Total",
          "Carga Máxima",
          "Cabaleo",
        ];
        let currentX = margin;
        pagePDF.drawRectangle({
          x: margin,
          y: startTableY - rowHeight,
          width: tableWidth,
          height: rowHeight,
          color: rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });
        headers.forEach((header, idx) => {
          const headerX =
            currentX +
            colWidths[idx] / 2 -
            boldFont.widthOfTextAtSize(header, fontSize) / 2;
          pagePDF.drawText(header, {
            x: headerX,
            y: startTableY - rowHeight + 6,
            size: fontSize,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
          if (idx > 0) {
            pagePDF.drawLine({
              start: { x: currentX, y: startTableY },
              end: { x: currentX, y: startTableY - rowHeight * 2 },
              color: rgb(0.8, 0.8, 0.8),
              thickness: 1,
            });
          }
          currentX += colWidths[idx];
        });
        pagePDF.drawLine({
          start: { x: margin + tableWidth, y: startTableY },
          end: { x: margin + tableWidth, y: startTableY - rowHeight * 2 },
          color: rgb(0.8, 0.8, 0.8),
          thickness: 1,
        });
        startTableY -= rowHeight;
        const rowData = [
          stat.fecha,
          apiUser?.codigo || "-",
          apiUser?.nombreCompleto || "-",
          stat.total?.toString() || "0",
          stat.cargaMaxima?.toString() || "0",
          stat.cabaleo?.toString() || "0",
        ];
        pagePDF.drawRectangle({
          x: margin,
          y: startTableY - rowHeight,
          width: tableWidth,
          height: rowHeight,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });
        currentX = margin;
        rowData.forEach((cell, idx) => {
          const cellWidth = font.widthOfTextAtSize(cell, fontSize);
          const cellX = currentX + colWidths[idx] / 2 - cellWidth / 2;
          pagePDF.drawText(cell, {
            x: cellX,
            y: startTableY - rowHeight + 6,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          currentX += colWidths[idx];
        });
        startTableY -= rowHeight;
      });

      const pages = pdfDoc.getPages();
      const currentPage = pages[pages.length - 1];
      const dateTime = new Date().toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const footerText = `Reporte generado el: ${dateTime}`;
      currentPage.drawText(footerText, {
        x:
          margin +
          contentWidth / 2 -
          font.widthOfTextAtSize(footerText, fontSize) / 2,
        y: margin / 2,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      pages.forEach((page, index) => {
        const pageSize = page.getSize();
        const pageText = `Página ${index + 1} de ${pages.length}`;
        page.drawText(pageText, {
          x: pageSize.width - margin - font.widthOfTextAtSize(pageText, fontSize),
          y: margin / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const urlBlob = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = `${reportType}-${apiUser?.codigo || "user"}-${new Date().toLocaleDateString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      Swal.close();
      await delay(300);
      await Swal.fire({
        icon: "success",
        title: "Reporte generado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.close();
      await delay(300);
      await Swal.fire({
        icon: "error",
        title: "Error al generar reporte",
        text: error?.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Mientras carga sesión
  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <FiLoader className="animate-spin" size={40} />
        <span className="ml-2 text-xl">Cargando Perfil...</span>
      </div>
    );
  }

  // Datos para mostrar en perfil (API o session)
  const displayName = canViewData && apiUser ? apiUser.nombreCompleto : sessionName;
  const displayRole = canViewData && apiUser ? apiUser.role.name : sessionRoleName;
  const displayCode = canViewData && apiUser ? apiUser.codigo : sessionCode;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-3 bg-white shadow">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white p-2 rounded-full mr-3 hover:bg-blue-800 transition-all duration-300 transform hover:scale-105"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Perfil de Usuario</h1>
        </div>
        <button
          onClick={() => signOut(localStorage.clear())}
          className="bg-red-600 hover:bg-red-800 p-2 rounded-md font-medium
          text-white transform hover:scale-105 active:scale-95 transition-transform
          flex items-center gap-1 justify-center"
        >
          <FaSignOutAlt /> Cerrar sesión
        </button>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Tarjeta de perfil */}
        <div className="bg-white shadow rounded-lg p-6 mb-8 text-center">
          <img
            src="/user.webp"
            alt="Avatar"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold">{displayName}</h2>
          <p className="text-gray-600 mt-1">{displayRole}</p>
          <p className="text-gray-600">Código: {displayCode}</p>
        </div>

        {/* Si role 1 o 2, mostrar filtros y estadísticas */}
        {canViewData && (
          <>
            {/* Filtros de fecha */}
            <section className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Filtrar por Fecha</h2>
              <form
                onSubmit={handleFilter}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block font-medium">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full border rounded-md shadow-sm focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium">Fecha Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full border rounded-md shadow-sm focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                  >
                    Filtrar
                  </button>
                </div>
              </form>
            </section>

            {/* Pestañas */}
            <div className="mb-6">
              <div className="flex border-b bg-white shadow p-2 rounded-t-lg">
                <button
                  onClick={() => handleTabChange("demoras")}
                  className={`py-2 px-4 ${
                    activeTab === "demoras"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  Granel
                </button>
                <button
                  onClick={() => handleTabChange("envasados")}
                  className={`py-2 px-4 ${
                    activeTab === "envasados"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  Envasado
                </button>
              </div>
            </div>

            {/* Estadísticas Globales y PDF */}
            <section className="flex-col md:flex-row bg-white shadow rounded-b-lg p-6 mb-8 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Estadísticas Globales</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <label htmlFor="recordsPerPage" className="mr-2 text-sm font-medium text-gray-700">
                    Mostrar:
                  </label>
                  <select
                    id="recordsPerPage"
                    value={recordsPerPage}
                    onChange={handleRecordsPerPageChange}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    {recordsPerPageOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  <FaFilePdf size={16} /> Descargar PDF
                </button>
              </div>
            </section>

            {/* Granel vs Envasado */}
            {activeTab === "demoras" && (
              <section className="mb-8">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <FiLoader className="animate-spin mr-2" size={24} />
                    <span className="text-gray-500">Cargando...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div className="p-6 bg-white shadow rounded-lg">
                      <p>Total Registros</p>
                      <p className="mt-2 text-2xl font-bold">
                        {globalStats?.total ?? 0}
                      </p>
                    </div>
                    <div className="p-6 bg-white shadow rounded-lg">
                      <p>Total Realizados</p>
                      <p className="mt-2 text-2xl font-bold">
                        {globalStats?.totalRegistros ?? 0}
                      </p>
                    </div>
                    <div className="p-6 bg-white shadow rounded-lg">
                      <p>Cabaleo</p>
                      <p className="mt-2 text-2xl font-bold">
                        {globalStats?.totalCabaleo ?? 0}
                      </p>
                    </div>
                    <div className="p-6 bg-white shadow rounded-lg">
                      <p>Carga Máxima</p>
                      <p className="mt-2 text-2xl font-bold">
                        {globalStats?.totalCargaMaxima ?? 0}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabla diaria */}
                {dailyStats.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4">
                      Estadísticas Diarias
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {["Fecha", "Código", "Nombre", "Total", "Carga Máxima", "Cabaleo"].map((h) => (
                              <th
                                key={h}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dailyStats.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-100">
                              <td className="px-6 py-4 whitespace-nowrap">{s.fecha}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{displayCode}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{displayName}</td>
                              <td className="px-6 py-4 text-center">{s.total}</td>
                              <td className="px-6 py-4 text-center">{s.cargaMaxima}</td>
                              <td className="px-6 py-4 text-center">{s.cabaleo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={handlePrevPage}
                        disabled={pagination.demoras.page === 1}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span>
                        Página {pagination.demoras.page} de {pagination.demoras.totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={pagination.demoras.page === pagination.demoras.totalPages}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </section>
                )}
              </section>
            )}

            {activeTab === "envasados" && (
              <section className="mb-8">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <FiLoader className="animate-spin mr-2" size={24} />
                    <span className="text-gray-500">Cargando...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <p>Total Registros</p>
                      <p className="mt-2 text-2xl font-bold">
                        {globalStatsEnv?.total ?? 0}
                      </p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <p>Total Realizados</p>
                      <p className="mt-2 text-2xl font-bold">
                        {globalStatsEnv?.totalRegistros ?? 0}
                      </p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <p>Cabaleo</p>
                      <p className="mt-2 text-2xl font-bold">
                        {globalStatsEnv?.totalCabaleo ?? 0}
                      </p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <p>Carga Máxima</p>
                      <p className="mt-2 text-2xl font-bold">
                        {globalStatsEnv?.totalCargaMaxima ?? 0}
                      </p>
                    </div>
                  </div>
                )}

                {envDailyStats.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4">
                      Estadísticas Diarias
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {["Fecha", "Código", "Nombre", "Total", "Carga Máxima", "Cabaleo"].map((h) => (
                              <th
                                key={h}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {envDailyStats.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-100">
                              <td className="px-6 py-4 whitespace-nowrap">{s.fecha}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{displayCode}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{displayName}</td>
                              <td className="px-6 py-4 text-center">{s.total}</td>
                              <td className="px-6 py-4 text-center">{s.cargaMaxima}</td>
                              <td className="px-6 py-4 text-center">{s.cabaleo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={handlePrevPage}
                        disabled={pagination.envasados.page === 1}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span>
                        Página {pagination.envasados.page} de {pagination.envasados.totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={pagination.envasados.page === pagination.envasados.totalPages}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </section>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}