"use client";

import { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { FaArrowLeft, FaArrowRight, FaFilePdf } from "react-icons/fa";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default function Profile() {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [userData, setUserData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Paginación
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const url = `/api/user/profile?id=${userId}&page=${pageToLoad}&limit=${limit}&startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}`;
      const res = await fetch(url);
      const data = await res.json();

      setGlobalStats(data.stats);
      setDailyStats(data.dailyStats);
      setRecords(data.registros || []);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setUserData(data.user);
    } catch (error) {
      console.error("Error fetching data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchData(1);
  };

  const handlePrevPage = () => {
    if (page > 1) fetchData(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) fetchData(page + 1);
  };

// Función para generar el PDF de reporte diario con márgenes adecuados
const handleDownloadPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const pagePDF = pdfDoc.addPage();
    const { width, height } = pagePDF.getSize();
    const margin = 50;
    const contentWidth = width - (margin * 2);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 10;
    const titleFontSize = 16;
    const subtitleFontSize = 14;
  
    // Encabezado corporativo - centrado correctamente
    pagePDF.drawText("ALMAPAC S.A. de C.V.", {
      x: margin + (contentWidth / 2) - boldFont.widthOfTextAtSize("ALMAPAC S.A. de C.V.", titleFontSize) / 2,
      y: height - margin,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  
    // Subtítulo del documento - centrado correctamente
    pagePDF.drawText("Reporte de Actividades", {
      x: margin + (contentWidth / 2) - boldFont.widthOfTextAtSize("Reporte de Actividades", subtitleFontSize) / 2,
      y: height - margin - 25,
      size: subtitleFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Subtítulo adicional - centrado correctamente
    pagePDF.drawText("Toma de Tiempos", {
      x: margin + (contentWidth / 2) - font.widthOfTextAtSize("Toma de Tiempos", 12) / 2,
      y: height - margin - 45,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  
    // Información del usuario y resumen - alineado correctamente con margen
    const userInfoY = height - margin - 80;
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
    
    // Calcular totales - alineado a la derecha respetando el margen
    const totalActivities = globalStats?.totalRegistros || 0;
    const totalCargaMaxima = globalStats?.totalCargaMaxima || 0;
    const totalCabaleo = globalStats?.totalCabaleo || 0;
    
    pagePDF.drawText(`Total Realizados: ${totalActivities}`, {
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
    
    // Línea separadora - respetando márgenes
    pagePDF.drawLine({
      start: { x: margin, y: userInfoY - 60 },
      end: { x: width - margin, y: userInfoY - 60 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
  
    // Dibujar cada registro con su propio encabezado
    let startY = userInfoY - 80;
    const rowHeight = 20;
    
    // Ajustamos los anchos de columna para que se ajusten al contenido disponible
    const tableWidth = contentWidth;
    const colWidths = [
      Math.floor(tableWidth * 0.12), // Fecha (12%)
      Math.floor(tableWidth * 0.10), // Código (10%)
      Math.floor(tableWidth * 0.35), // Nombre (35%)
      Math.floor(tableWidth * 0.12), // Total (12%)
      Math.floor(tableWidth * 0.17), // Carga Máxima (17%)
      Math.floor(tableWidth * 0.14)  // Cabaleo (14%)
    ];
    
    dailyStats.forEach((stat, index) => {
      // Verificar si necesitamos una nueva página
      if (startY < margin + 100) {
        // Añadir nueva página
        pagePDF = pdfDoc.addPage();
        startY = height - margin - 40;
        
        // Añadir encabezado reducido en la nueva página
        pagePDF.drawText("ALMAPAC S.A. de C.V. - Reporte de Actividades", {
          x: margin,
          y: height - margin,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        
        startY -= 30;
      }
      
      // Espacio entre tablas
      if (index > 0) {
        startY -= 30;
      }
      
      // Título de la tabla individual
      pagePDF.drawText(`Registro del día ${stat.fecha}`, {
        x: margin,
        y: startY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      startY -= 20;
      
      // Dibujar encabezados
      const headers = ["Fecha", "Código", "Nombre", "Total", "Carga Máxima", "Cabaleo"];
      let currentX = margin;
      
      // Fondo gris para los encabezados
      pagePDF.drawRectangle({
        x: margin,
        y: startY - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      
      headers.forEach((header, idx) => {
        // Dibujar texto centrado en cada columna
        const headerX = currentX + (colWidths[idx] / 2) - (font.widthOfTextAtSize(header, fontSize) / 2);
        pagePDF.drawText(header, {
          x: headerX,
          y: startY - rowHeight + 6,
          size: fontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        
        // Dibujar líneas verticales de la tabla
        if (idx > 0) {
          pagePDF.drawLine({
            start: { x: currentX, y: startY },
            end: { x: currentX, y: startY - rowHeight * 2 },
            color: rgb(0.8, 0.8, 0.8),
            thickness: 1,
          });
        }
        
        currentX += colWidths[idx];
      });
      
      // Dibujar línea vertical final
      pagePDF.drawLine({
        start: { x: margin + tableWidth, y: startY },
        end: { x: margin + tableWidth, y: startY - rowHeight * 2 },
        color: rgb(0.8, 0.8, 0.8),
        thickness: 1,
      });
      
      // Dibujar datos de fila
      startY -= rowHeight;
      const rowData = [
        stat.fecha,
        userData?.codigo || "-",
        userData?.nombreCompleto || "-",
        stat.total?.toString() || "0",
        stat.cargaMaxima?.toString() || "0",
        stat.cabaleo?.toString() || "0",
      ];
      
      // Fondo blanco para los datos
      pagePDF.drawRectangle({
        x: margin,
        y: startY - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      
      currentX = margin;
      rowData.forEach((cell, idx) => {
        // Centrar el texto en la celda
        const cellWidth = font.widthOfTextAtSize(cell, fontSize);
        const cellX = currentX + (colWidths[idx] / 2) - (cellWidth / 2);
        
        pagePDF.drawText(cell, {
          x: cellX,
          y: startY - rowHeight + 6,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        currentX += colWidths[idx];
      });
      
      startY -= rowHeight;
    });
    
    // Obtener la página actual para agregar el pie de página
    const pages = pdfDoc.getPages();
    const currentPage = pages[pages.length - 1];
    
    // Agregar pie de página con fecha y hora
    const dateTime = new Date().toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const footerText = `Reporte generado el: ${dateTime}`;
    currentPage.drawText(footerText, {
      x: margin + (contentWidth / 2) - (font.widthOfTextAtSize(footerText, fontSize) / 2),
      y: margin / 2,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Agregar numeración de página en cada página
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
    a.download = `Reporte-${userData?.nombreCompleto || "user"}-${new Date().toLocaleDateString()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabecera */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = "/")}
                className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
                title="Volver"
          >
            <FiArrowLeft size={24} />
          </button>
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Perfil de Usuario</h1>
            {userData && (
              <p className="text-gray-600">
                {userData.nombreCompleto} <span className="font-medium">(Código: {userData.codigo})</span>
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtro */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por Fecha</h2>
          <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-medium">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Fecha Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition">
                Filtrar
              </button>
            </div>
          </form>
        </section>

        {/* Estadísticas Globales */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas Globales</h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">Cargando...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-sm text-gray-500">Total Registros</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">{globalStats?.total || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-sm text-gray-500">Total Realizados</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">{globalStats?.totalRegistros || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-sm text-gray-500">Cabaleo</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">{globalStats?.totalCabaleo || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-sm text-gray-500">Carga Máxima</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">{globalStats?.totalCargaMaxima || 0}</p>
              </div>
            </div>
          )}
        </section>

        {/* Registros */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Registros</h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">Cargando registros...</p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Inicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método Carga
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.length > 0 ? (
                    records.map((reg, idx) => (
                      <tr key={idx} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{reg.fechaInicio}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {reg.primerProceso?.metodoCarga || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan="2">
                        No hay registros
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition"
            >
              Anterior
            </button>
            <span className="text-gray-700">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition"
            >
              Siguiente
            </button>
          </div>
        </section>

        {/* Estadísticas Diarias y PDF */}
        {dailyStats?.length > 0 && userData && (
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Estadísticas Diarias</h2>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{stat.fecha}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{userData.codigo || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{userData.nombreCompleto || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{stat.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{stat.cargaMaxima}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{stat.cabaleo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
