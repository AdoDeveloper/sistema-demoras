"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaFilePdf } from "react-icons/fa";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FiArrowLeft, FiLoader } from "react-icons/fi";

export default function Profile() {
  const router = useRouter();

  // Estados generales
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Estados para Demoras (Granel)
  const [globalStats, setGlobalStats] = useState(null);
  const [globalStatsEnv, setGlobalStatsEnv] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [records, setRecords] = useState([]);
  // Estados de paginación para demoras (granel)
  const [demorasPage, setDemorasPage] = useState(1);
  const [demorasTotalPages, setDemorasTotalPages] = useState(1);

  // Estados para Envasados
  const [envDailyStats, setEnvDailyStats] = useState([]);
  const [envRecords, setEnvRecords] = useState([]);
  // Estados de paginación para envasados
  const [envasadosPage, setEnvasadosPage] = useState(1);
  const [envasadosTotalPages, setEnvasadosTotalPages] = useState(1);

  // Estado para pestañas: "demoras" (Granel) o "envasados"
  const [activeTab, setActiveTab] = useState("demoras");

  // Estado para dashboard (usuario y rol)
  const [cachedUser, setCachedUser] = useState(null);
  const [roleId, setRoleId] = useState(null);

  // Estado para PDF
  const [isGenerating, setIsGenerating] = useState(false);
  const limit = 10;

  // Función para obtener los datos (se envían los parámetros de paginación para cada modelo)
  const fetchData = async () => {
    setLoading(true);
    try {
      // Se asume que el endpoint acepta demorasPage y envasadosPage por separado
      const url = `/api/user/profile?demorasPage=${demorasPage}&envasadosPage=${envasadosPage}&limit=${limit}&startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}`;
      const res = await fetch(url);
      const data = await res.json();

      // Datos de Demoras (Granel)
      setGlobalStats(data.granel.stats);
      setGlobalStatsEnv(data.envasado.stats);
      setDailyStats(data.granel.dailyStats || []);
      setRecords(data.granel.registros || []);
      // Actualizamos la paginación para Demoras
      setDemorasPage(data.granel.pagination.page);
      setDemorasTotalPages(data.granel.pagination.totalPages);

      // Datos de Envasados
      if (data.envasado) {
        setEnvDailyStats(data.envasado.dailyStats || []);
        setEnvRecords(data.envasado.registros || []);
        setEnvasadosPage(data.envasado.pagination.page);
        setEnvasadosTotalPages(data.envasado.pagination.totalPages);
      }

      setUserData(data.user);
    } catch (error) {
      console.error("Error fetching data", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron obtener los datos.",
      });
    }
    setLoading(false);
  };

  // Al inicio y cada vez que cambien los filtros o la paginación, se vuelve a llamar a fetchData
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demorasPage, envasadosPage, startDate, endDate]);

  // Actualiza usuario y roleId desde cache/localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("user");
      if (cached) {
        setCachedUser(JSON.parse(cached));
      }
      const storedRoleId = localStorage.getItem("roleId");
      if (storedRoleId) {
        setRoleId(Number(storedRoleId));
      }
    }
  }, []);

  // Funciones de paginación según la pestaña activa
  const handlePrevPage = () => {
    if (activeTab === "demoras") {
      if (demorasPage > 1) {
        setDemorasPage(prev => prev - 1);
      }
    } else {
      if (envasadosPage > 1) {
        setEnvasadosPage(prev => prev - 1);
      }
    }
  };
  const handleNextPage = () => {
    if (activeTab === "demoras") {
      if (demorasPage < demorasTotalPages) {
        setDemorasPage(prev => prev + 1);
      }
    } else {
      if (envasadosPage < envasadosTotalPages) {
        setEnvasadosPage(prev => prev + 1);
      }
    }
  };

  // Función para filtrar por fechas: se reinician ambas paginaciones a 1
  const handleFilter = (e) => {
    e.preventDefault();
    setDemorasPage(1);
    setEnvasadosPage(1);
    fetchData();
  };

  // Cálculos globales para envasados a partir de envDailyStats
  const envTotalCabaleo = envDailyStats.reduce(
    (acc, stat) => acc + (parseInt(stat.cabaleo) || 0),
    0
  );
  const envTotalCargaMaxima = envDailyStats.reduce(
    (acc, stat) => acc + (parseInt(stat.cargaMaxima) || 0),
    0
  );

  // Función para introducir una demora (delay para PDF, por ejemplo)
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Función para generar reporte PDF según la pestaña activa
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

      // Determinamos el tipo de reporte según la pestaña activa
      const reportType = activeTab === "envasados" ? "Envasado" : "Granel";

      // Función para dibujar el encabezado en cada página
      const drawPDFHeader = (page, currentY) => {
        page.drawText("ALMAPAC S.A. de C.V.", {
          x:
            margin +
            contentWidth / 2 -
            boldFont.widthOfTextAtSize("ALMAPAC S.A. de C.V.", titleFontSize) / 2,
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
            boldFont.widthOfTextAtSize("Reporte de Actividades", subtitleFontSize) / 2,
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
            boldFont.widthOfTextAtSize(`Toma de Tiempos ${reportType}`, 12) / 2,
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
      pagePDF.drawText(`${userData?.nombreCompleto || "N/A"}`, {
        x: margin,
        y: userInfoY,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      pagePDF.drawText(`Código: ${userData?.codigo || "N/A"}`, {
        x: margin,
        y: userInfoY - 20,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      pagePDF.drawText(`${userData?.role?.name || "N/A"}`, {
        x: margin,
        y: userInfoY - 40,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Seleccionar datos según pestaña activa
      let totalRegistros, totalCabaleo, totalCargaMaxima, dailyStatsData;
      if (activeTab === "demoras") {
        totalRegistros = globalStats?.totalRegistros || 0;
        totalCabaleo = globalStats?.totalCabaleo || 0;
        totalCargaMaxima = globalStats?.totalCargaMaxima || 0;
        dailyStatsData = dailyStats;
      } else {
        totalRegistros =  globalStatsEnv?.totalRegistros|| 0;
        totalCabaleo = globalStatsEnv?.totalCabaleo|| 0;
        totalCargaMaxima = globalStatsEnv?.totalCargaMaxima|| 0;
        dailyStatsData = envDailyStats;
      }

      if (userData?.role?.id === 1) {
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

      // Reporte detallado (tabla) de estadísticas diarias
      let startTableY = userInfoY - 80;
      const rowHeight = 20;
      const tableWidth = contentWidth;
      const colWidths = [
        Math.floor(tableWidth * 0.12), // Fecha
        Math.floor(tableWidth * 0.10), // Código
        Math.floor(tableWidth * 0.35), // Nombre
        Math.floor(tableWidth * 0.12), // Total
        Math.floor(tableWidth * 0.17), // Carga Máxima
        Math.floor(tableWidth * 0.14), // Cabaleo
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
          userData?.codigo || "-",
          userData?.nombreCompleto || "-",
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
      a.download = `${reportType}-${
        userData?.codigo || "user"
      }-${new Date().toLocaleDateString()}.pdf`;
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

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Loader global */}
      {loading && !userData && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
          <FiLoader className="animate-spin mr-2" size={40} />
          <span className="text-xl text-gray-600">Cargando...</span>
        </div>
      )}

      {/* Encabezado con flecha para volver */}
      <div className="flex items-center py-4 px-3">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
          title="Volver"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Perfil de Usuario</h1>
      </div>

      <main className="container mx-auto px-4 sm:px-4 lg:px-4 py-1">
        {/* Tarjeta de perfil */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 flex flex-col items-center">
          <img
            src="/user.webp"
            alt="Avatar"
            className="w-32 h-32 rounded-full mb-4"
          />
          {userData ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {userData.nombreCompleto}
              </h2>
              <p className="text-gray-600 mt-2">
                {userData.role?.name || "N/A"}
              </p>
              <p className="text-gray-600">
                Código: {userData.codigo || "N/A"}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 flex items-center justify-center gap-2">
              <FiLoader className="animate-spin" /> Cargando perfil...
            </p>
          )}
        </div>

        {(roleId !== 3 ) && (
        <>
        {/* Filtro por fechas */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Filtrar por Fecha
          </h2>
          <form
            onSubmit={handleFilter}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-gray-700 font-medium">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Fecha Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition"
              >
                Filtrar
              </button>
            </div>
          </form>
        </section>

        {/* Pestañas para Demoras (Granel) y Envasados */}
        <div className="mb-6">
          <div className="flex border-b">
            <button
              className={`py-2 px-4 focus:outline-none ${
                activeTab === "demoras"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("demoras")}
            >
              Granel
            </button>
            <button
              className={`py-2 px-4 focus:outline-none ${
                activeTab === "envasados"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("envasados")}
            >
              Envasado
            </button>
          </div>
        </div>

        {/* Contenido de la pestaña de Demoras (Granel) */}
        {activeTab === "demoras" && (
          <>
            {/* Estadísticas Globales para Demoras */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Estadísticas Globales
              </h2>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <FiLoader className="animate-spin mr-2" size={24} />
                  <span className="text-gray-500">Cargando...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">Total Registros</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                      {globalStats?.total || 0}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">Total Realizados</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                      {globalStats?.totalRegistros || 0}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">Cabaleo</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                      {globalStats?.totalCabaleo || 0}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">Carga Máxima</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                      {globalStats?.totalCargaMaxima || 0}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Estadísticas Diarias y opción para PDF en Demoras */}
            {dailyStats?.length > 0 && userData && (
              <section className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Estadísticas Diarias
                  </h2>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition mt-4 sm:mt-0"
                  >
                    <FaFilePdf size={16} /> Descargar PDF
                  </button>
                </div>
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Carga Máxima
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cabaleo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyStats.map((stat, idx) => (
                        <tr key={idx} className="hover:bg-gray-100">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {stat.fecha}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {userData.codigo || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {userData.nombreCompleto || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {stat.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {stat.cargaMaxima}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {stat.cabaleo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {/* Contenido de la pestaña de Envasados */}
        {activeTab === "envasados" && (
          <>
            {/* Estadísticas Globales para Envasados */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Estadísticas Globales
              </h2>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <FiLoader className="animate-spin mr-2" size={24} />
                  <span className="text-gray-500">Cargando...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">Total Registros</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                      {globalStatsEnv?.total}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">Total Realizados</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                      {globalStatsEnv?.totalRegistros}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">Cabaleo</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                    {globalStatsEnv?.totalCabaleo}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">Carga Máxima</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                      {globalStatsEnv?.totalCargaMaxima}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Estadísticas Diarias y opción para PDF en Envasados */}
            {envDailyStats?.length > 0 && userData && (
              <section className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Estadísticas Diarias
                  </h2>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition mt-4 sm:mt-0"
                  >
                    <FaFilePdf size={16} /> Descargar PDF
                  </button>
                </div>
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Carga Máxima
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cabaleo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {envDailyStats.map((stat, idx) => (
                        <tr key={idx} className="hover:bg-gray-100">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {stat.fecha}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {userData.codigo || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {userData.nombreCompleto || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {stat.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {stat.cargaMaxima}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {stat.cabaleo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
        </>
        )}
      </main>
    </div>
  );
}
