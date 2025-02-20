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

  // Función para generar el PDF de reporte diario
  const handleDownloadPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const pagePDF = pdfDoc.addPage();
    const { width, height } = pagePDF.getSize();
    const margin = 50;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    // Título del PDF
    pagePDF.drawText("Reporte Diario", {
      x: margin,
      y: height - margin,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    const headers = ["Fecha", "Código", "Nombre", "Total", "Carga Máxima", "Cabaleo"];
    const colWidths = [80, 60, 150, 80, 80, 80];
    let tableY = height - margin - 40;
    const rowHeight = 20;
    let currentX = margin;

    // Dibujar encabezado de tabla
    headers.forEach((header, idx) => {
      pagePDF.drawText(header, {
        x: currentX + 2,
        y: tableY - rowHeight + 5,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      currentX += colWidths[idx];
    });

    tableY -= rowHeight;
    dailyStats.forEach((stat) => {
      currentX = margin;
      const rowData = [
        stat.fecha,
        userData?.codigo || "-",
        userData?.nombreCompleto || "-",
        stat.total?.toString() || "0",
        stat.cargaMaxima?.toString() || "0",
        stat.cabaleo?.toString() || "0",
      ];
      rowData.forEach((cell, idx) => {
        pagePDF.drawText(cell, {
          x: currentX + 2,
          y: tableY - rowHeight + 5,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        currentX += colWidths[idx];
      });
      tableY -= rowHeight;
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
            className="text-blue-600 hover:text-blue-800 transition-colors"
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
