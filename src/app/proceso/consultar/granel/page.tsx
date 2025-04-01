"use client";

import { useState, useEffect } from "react";
import React from "react";
import { FaEye, FaEdit, FaRegUser } from "react-icons/fa";
import Loader from "../../../../components/Loader";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiLogIn,
  FiLogOut,
  FiPlayCircle,
  FiRefreshCw,
  FiStopCircle,
  FiX,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { HiOutlineCalendarDateRange } from "react-icons/hi2";

function displayValue(value: any): string {
  return value == null || value === "" ? "-" : String(value);
}

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
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(
    ss
  ).padStart(2, "0")}`;
}

// Para el modal, se omiten llaves de relación y campos innecesarios
function filterModalDetailData(data: any) {
  if (!data) return data;
  const excludeKeys = [
    "id",
    "createdAt",
    "updatedAt",
    "vueltas",
    "demoraId",
    "tercerProcesoId",
  ];
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !excludeKeys.includes(key))
  );
}

function timeStrToSeconds(timeStr: string) {
  if (!timeStr || timeStr === "-") return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 3) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
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
      {title && (
        <h3 className="text-base font-semibold text-blue-700 mb-2">{title}</h3>
      )}
      <div className="border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <tbody className="divide-y">
            {entries.map(([key, value], i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-2 py-2 font-semibold text-gray-600 whitespace-nowrap w-1/2">
                  {formatKey(key)}
                </td>
                <td className="px-2 py-2 text-gray-800 whitespace-nowrap w-1/2">
                  {displayValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VueltasDetail({ vueltas }: { vueltas: any[] }) {
  if (!vueltas || vueltas.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-blue-700">Vueltas</h3>
      {vueltas.map((vuelta, index) => (
        <div key={vuelta.id} className="border rounded-lg">
          <div className="font-bold text-xs p-2">Vuelta {index + 1}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <tbody>
                {Object.entries(vuelta)
                  .filter(
                    ([key]) =>
                      !["id", "createdAt", "updatedAt", "tercerProcesoId"].includes(key)
                  )
                  .map(([key, value]) => (
                    <tr key={key} className="border-b border-t">
                      <td className="px-2 py-1 font-bold bg-orange-50 whitespace-nowrap">
                        {formatKey(key)}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {displayValue(value)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// -------------------------
// Función para calcular intervalos
// -------------------------
const calcularIntervalos = (item: any) => {
  const primer = item.primerProceso || {};
  const segundo = item.segundoProceso || {};
  const tercero = item.tercerProceso || {};
  const final = item.procesoFinal || {};

  // Cálculos del primer proceso
  const calc1 = formatInterval(
    diffEnHoras(parseHora(primer.tiempoEntradaBascula), parseHora(primer.tiempoSalidaBascula))
  );
  const calc2 = formatInterval(
    diffEnHoras(parseHora(primer.tiempoSalidaBascula), parseHora(segundo.tiempoLlegadaPunto))
  );
  // Cálculo nuevo: Punto → Inicio Carga (segundo proceso)
  const calc7 = formatInterval(
    diffEnHoras(parseHora(segundo.tiempoLlegadaPunto), parseHora(segundo.tiempoInicioCarga))
  );
  const calc3 = formatInterval(
    diffEnHoras(parseHora(segundo.tiempoInicioCarga), parseHora(segundo.tiempoTerminaCarga))
  );

  // Cálculos del tercer proceso: se basan en la última vuelta
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

  // Cálculos adicionales ya existentes
  const calc8 = formatInterval(
    diffEnHoras(parseHora(primer.tiempoAutorizacion), parseHora(primer.tiempoIngresoPlanta))
  );
  const calc12 = formatInterval(
    diffEnHoras(parseHora(segundo.tiempoTerminaCarga), parseHora(segundo.tiempoSalidaPunto))
  );
  const calcIngresoBascula = formatInterval(
    diffEnHoras(parseHora(primer.tiempoIngresoPlanta), parseHora(primer.tiempoLlegadaBascula))
  );

  // Nuevos cálculos solicitados
  const calcExtra1 = formatInterval(
    diffEnHoras(parseHora(primer.tiempoLlegadaBascula), parseHora(primer.tiempoEntradaBascula))
  );
  const calcExtra2 = formatInterval(
    diffEnHoras(parseHora(tercero.tiempoLlegadaBascula), parseHora(tercero.tiempoEntradaBascula))
  );
  let calcExtra3 = "-";
  if (tercero.vueltas && tercero.vueltas.length > 0) {
    const firstVueltaEntrada = parseHora(tercero.vueltas[0].tiempoEntradaBascula);
    const lastVueltaSalida = parseHora(tercero.vueltas[tercero.vueltas.length - 1].tiempoSalidaBascula);
    calcExtra3 = formatInterval(diffEnHoras(firstVueltaEntrada, lastVueltaSalida));
  }

  return {
    calc1,
    calc2,
    calc7,
    calc3,
    calc4,
    calc5,
    calc6,
    calc8,
    calc12,
    calcIngresoBascula,
    calcExtra1,
    calcExtra2,
    calcExtra3,
  };
};

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

  // Estado para rol del usuario (tomado de la caché)
  const [roleId, setRoleId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();

  // Tabs del modal
  const [activeTab, setActiveTab] = useState<"procesos" | "vueltas" | "intervalos">(
    "procesos"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRoleId = localStorage.getItem("roleId");
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        setUserId(Number(storedUserId));
      }
      if (storedRoleId) {
        setRoleId(Number(storedRoleId));
      }
    }
  }, []);

  // Función para obtener la data; sólo se envían al backend los parámetros de paginación
  const fetchDemoras = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
      });

      const res = await fetch(`/api/demoras/granel?${queryParams.toString()}`);
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

  // Función para exportar el reporte completo con alerta y spinner
  const handleExportarExcel = async () => {
    if (!fechaInicio || !fechaFinal) {
      Swal.fire("Información", "Debe seleccionar la fecha de Inicio y Final.", "warning");
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
        `/api/demoras/granel/export-excel?fechaInicio=${fechaInicio}&fechaFinal=${fechaFinal}`
      );
      if (!response.ok) {
        Swal.fire("Error", "Error en la exportación: " + response.status, "error");
        setExportLoading(false);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `Granel-${fechaInicio}-${fechaFinal}.xlsx`;
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

  // Función para retrasar la ejecución
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Función auxiliar para envolver texto según un ancho máximo
  const wrapText = (
    text: string,
    maxWidth: number,
    font: any,
    size: number
  ): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    words.forEach((word) => {
      const testLine = currentLine ? currentLine + " " + word : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Generación y descarga de PDF
  const handleDescargarPDF = async (selectedDemora: any) => {
    if (!selectedDemora) {
      Swal.fire("Error", "No hay registro seleccionado", "error");
      return;
    }
    Swal.fire({
      title: "Generando PDF...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
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
      const maxTextWidth = width - margin * 2;

      // Función para dibujar texto con ajuste de salto de página y envolvimiento de líneas
      const drawWrappedText = (
        text: string,
        size: number = 10,
        font = timesRomanFont,
        x = margin
      ) => {
        // Envuelve el texto si es muy largo
        const lines = wrapText(text, maxTextWidth, font, size);
        lines.forEach((line) => {
          if (yPosition < margin + lineHeight * 2) {
            // Agrega nueva página y dibuja el pie de página en la anterior
            currentPagePdf = pdfDoc.addPage();
            yPosition = currentPagePdf.getSize().height - margin;
          }
          currentPagePdf.drawText(line, { x, y: yPosition, size, font, color: rgb(0, 0, 0) });
          yPosition -= lineHeight;
        });
      };

      // Función para centrar texto
      const centerText = (text: string, size: number = 12, font = timesRomanFont) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        const x = (width - textWidth) / 2;
        if (yPosition < margin + lineHeight * 2) {
          currentPagePdf = pdfDoc.addPage();
          yPosition = currentPagePdf.getSize().height - margin;
        }
        currentPagePdf.drawText(text, { x, y: yPosition, size, font, color: rgb(0, 0, 0) });
        yPosition -= lineHeight;
      };

      // Función para dibujar un separador
      const drawSeparator = () => {
        drawWrappedText("=".repeat(86), 10, courierFont);
      };

      // Encabezado del reporte (se dibuja en la primera página)
      centerText("ALMAPAC S.A de C.V. - PLANTA ACAJUTLA", 16, timesRomanFont);
      centerText("Control de Tiempos Despacho", 14, timesRomanFont);
      centerText(`Detalle del Registro #${selectedDemora.id}`, 14, timesRomanFont);
      yPosition -= lineHeight;
      drawSeparator();

      // Función para agregar una sección en formato de "tabla"
      const addTableSection = (sectionTitle: string, data: any) => {
        drawWrappedText(sectionTitle, 12, timesRomanFont);
        // Encabezado de la “tabla”
        drawWrappedText(`${"Campo".padEnd(30)} : Valor`, 10, courierFont);
        drawWrappedText("-".repeat(86), 10, courierFont);
        for (const [key, value] of Object.entries(data)) {
          const line = `${formatKey(key).padEnd(30)} : ${value || "-"}`;
          drawWrappedText(line, 10, courierFont);
        }
        drawSeparator();
        yPosition -= lineHeight;
      };

      // Secciones del reporte
      addTableSection("Información General - Granel", {
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
          drawWrappedText(`Total de Vueltas: ${selectedDemora.tercerProceso.vueltas.length}`, 12, timesRomanFont);
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
        "B.E. (Entr -> Sal)": intervalos.calc1,
        "Sal. B.E. -> Lleg. Punto": intervalos.calc2,
        "Llegada Punto -> Inicio Carga": intervalos.calc7,
        "Tiempo Total Carga": intervalos.calc3,
        "Salida Punto -> B.S. Entr.": intervalos.calc4,
        "B.S. (Entr -> Sal)": intervalos.calc5,
        "B.S. -> Salida Planta": intervalos.calc6,
        "Autorizac -> Ing. Planta": intervalos.calc8,
        "Termina Carga -> Salida Punto": intervalos.calc12,
        "Ing. Planta -> Lleg. Básq.": intervalos.calcIngresoBascula,
        "Llegada -> Entrada Básq. (P1)": intervalos.calcExtra1,
        "Llegada -> Entrada Básq. (P3)": intervalos.calcExtra2,
        "Entrada (P3) 1ra -> Salida (P3) Última": intervalos.calcExtra3,
      });

      // En lugar de "Fin del Reporte", se agregará el pie de página en cada página.
      // Agregamos pie de página a todas las páginas con la fecha y hora de generación.
      const pages = pdfDoc.getPages();
      pages.forEach((page) => {
        page.drawText(`Reporte generado: ${new Date().toLocaleString()}`, {
          x: margin,
          y: margin / 2,
          size: 10,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Detalle-Granel-N-${selectedDemora.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      Swal.close();
      await new Promise((resolve) => setTimeout(resolve, 300));
      Swal.fire("Éxito", "Archivo generado correctamente.", "success");
    } catch (error: any) {
      Swal.close();
      await new Promise((resolve) => setTimeout(resolve, 300));
      Swal.fire("Error", "Error generando PDF: " + error.message, "error");
    }
  };

  // Aplicación de filtros en el frontend sobre la data ya traída (paginada)
  const filteredDemoras = demoras.filter((item) => {
    if (filterText) {
      const haystack = JSON.stringify(item).toLowerCase();
      if (!haystack.includes(filterText.toLowerCase())) return false;
    }
    if (filterTiempoTotal) {
      if (!(item.tiempoTotal && item.tiempoTotal.includes(filterTiempoTotal)))
        return false;
    }
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
    if (fechaInicio) {
      if (!(item.primerProceso.fechaAutorizacion && item.primerProceso.fechaAutorizacion >= fechaInicio))
        return false;
    }
    if (fechaFinal) {
      if (!(item.primerProceso.fechaAutorizacion && item.primerProceso.fechaAutorizacion <= fechaFinal))
        return false;
    }
    return true;
  });

  const totalPages = Math.ceil(totalCount / recordsPerPage) || 1;

  // Función para iniciar la edición del registro
  const handleEditRecord = (record: any) => {
    const transactionNumber = record.primerProceso?.numeroTransaccion || "-";
    const userName = record.userName || "-";
    Swal.fire({
      title: `¿Desea editar el registro #${record.id}?`,
      html: `<p><strong>N° Transacción:</strong> ${transactionNumber}</p>
            <p><strong>Realizado por:</strong> ${userName}</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, editar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.setItem("demoraId", record.id);
        router.push(`/proceso/editar/granel`);
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

    // -----------------------
    // Componente para la línea de tiempo con iconos de colores
    // -----------------------
    const TimelineItem = ({
      label,
      time,
      iconColor,
      icon,
    }: {
      label: string;
      time: string;
      iconColor: string;
      icon: React.ReactNode;
    }) => {
      return (
        <div className="flex items-center space-x-2 text-base text-gray-700">
          <div style={{ color: iconColor }}>{icon}</div>
          <div>
            <strong>{label}:</strong> {time || "-"}
          </div>
        </div>
      );
    };

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
              <h1 className="text-xl font-bold">Registros Granel</h1>
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
                placeholder="dd/mm/aaaa"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm">Fecha Final</label>
              <input
                type="date"
                className="border text-black p-1 w-full rounded"
                placeholder="dd/mm/aaaa"
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
              <label className="text-sm">General</label>
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

      {/* Tabla de Registros */}
      <div className="overflow-x-auto bg-white shadow-md mt-6">
        <table
          id="demoras-table"
          className="min-w-full border-collapse table-auto text-sm"
        >
          <thead>
            <tr className="bg-blue-50 text-blue-700 text-xs md:text-sm">
              <th className="border px-2 py-1 whitespace-nowrap text-left">Fecha Inicio</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Tiempo Total</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">N° Transacción</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Fecha Autorización</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Hora Autorización</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Hora Ingreso Planta</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Hora Inicio Carga</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Hora Termina Carga</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Condición</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Método Carga</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Punto Despacho</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Hora Salida Planta</th>
              <th className="border px-2 py-1 whitespace-nowrap text-left">Acción</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-xs md:text-sm">
            {filteredDemoras.map((item) => {
              const primer = item.primerProceso || {};
              const segundo = item.segundoProceso || {};
              const final = item.procesoFinal || {};
              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="border px-2 py-1 whitespace-nowrap">{item.fechaInicio}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{item.tiempoTotal || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.numeroTransaccion || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.fechaAutorizacion || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoAutorizacion || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.tiempoIngresoPlanta || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoInicioCarga || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{segundo.tiempoTerminaCarga || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.condicion || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.metodoCarga || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{primer.puntoDespacho || "-"}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{final.tiempoSalidaPlanta || "-"}</td>
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
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded ml-2 transition-all duration-300 transform hover:scale-105 text-xs"
                      >
                        <FaEdit size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
        <div className="flex overflow-x-auto space-x-2 w-full sm:w-auto">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50 flex-shrink-0"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`px-3 py-1 border rounded flex-shrink-0 ${
                currentPage === index + 1 ? "bg-blue-500 text-white" : ""
              }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 border rounded disabled:opacity-50 flex-shrink-0"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center">
          <span className="text-sm">
            Mostrando {filteredDemoras.length} de {totalCount} registros
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
              <option value="400">400</option>
              <option value="800">800</option>
              <option value="1200">1200</option>
            </select>
          </div>
        </div>
      </div>

    {/* Modal de Detalle */}
    {showModal && selectedDemora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-4 relative max-h-[95vh] overflow-y-auto">
            {/* Encabezado del Modal */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleCloseModal}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                title="Regresar"
              >
                <FiArrowLeft className="mr-2" /> Regresar
              </button>
              <button
                onClick={handleCloseModal}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                title="Cerrar"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <FiFileText className="text-blue-700 mb-2" size={20} />
                <span className="font-semibold text-sm">Transacción</span>
                <span className="text-sm">
                  {selectedDemora.primerProceso?.numeroTransaccion || "-"}
                </span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <FiFileText className="text-blue-700 mb-2" size={20} />
                <span className="font-semibold text-sm">Orden</span>
                <span className="text-sm">
                  {selectedDemora.primerProceso?.numeroOrden || "-"}
                </span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <HiOutlineCalendarDateRange  className="text-blue-700 mb-2" size={20} />
                <span className="font-semibold text-sm">Fecha</span>
                <span className="text-sm">{selectedDemora.fechaInicio || "-"}</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm flex flex-col items-center">
                <FiClock className="text-blue-700 mb-2" size={20} />
                <span className="font-semibold text-sm">Tiempo Total</span>
                <span className="text-sm">{selectedDemora.tiempoTotal || "-"}</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm flex flex-col items-center md:col-span-2">
                <FaRegUser className="text-blue-700 mb-2" size={20} />
                <span className="font-semibold text-sm">Usuario</span>
                <span className="text-sm">{selectedDemora.userName || "-"}</span>
              </div>
            </div>

            {/* Línea de Tiempo (con iconos de colores) */}
            <div className="border rounded-lg p-4 mb-6 hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold text-blue-700 mb-2">
                Línea de Tiempo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <TimelineItem
                  label="Autorización"
                  time={selectedDemora.primerProceso?.tiempoAutorizacion || "-"}
                  iconColor="#22c55e" // verde
                  icon={<FiCheckCircle />}
                />
                <TimelineItem
                  label="Ingreso Planta"
                  time={selectedDemora.primerProceso?.tiempoIngresoPlanta || "-"}
                  iconColor="#3b82f6" // azul
                  icon={<FiLogIn />}
                />
                <TimelineItem
                  label="Inicio Carga"
                  time={selectedDemora.segundoProceso?.tiempoInicioCarga || "-"}
                  iconColor="#f97316" // naranja
                  icon={<FiPlayCircle />}
                />
                <TimelineItem
                  label="Termina Carga"
                  time={selectedDemora.segundoProceso?.tiempoTerminaCarga || "-"}
                  iconColor="#ef4444" // rojo
                  icon={<FiStopCircle />}
                />
                <TimelineItem
                  label="Salida Planta"
                  time={selectedDemora.procesoFinal?.tiempoSalidaPlanta || "-"}
                  iconColor="#a855f7" // morado
                  icon={<FiLogOut />}
                />
              </div>
            </div>

            {/* Pestañas */}
            <div>
              <div className="flex space-x-2 border-b mb-4">
                <button
                  onClick={() => setActiveTab("procesos")}
                  className={`px-3 py-2 text-sm font-medium ${
                    activeTab === "procesos"
                      ? "text-blue-700 border-b-2 border-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Procesos
                </button>
                <button
                  onClick={() => setActiveTab("vueltas")}
                  className={`px-3 py-2 text-sm font-medium ${
                    activeTab === "vueltas"
                      ? "text-blue-700 border-b-2 border-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Vueltas
                </button>
                <button
                  onClick={() => setActiveTab("intervalos")}
                  className={`px-3 py-2 text-sm font-medium ${
                    activeTab === "intervalos"
                      ? "text-blue-700 border-b-2 border-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Intervalos
                </button>
              </div>

              <div>
                {/* Tab: Procesos */}
                {activeTab === "procesos" && (
                  <div className="space-y-4">
                    <DetailTable
                      title="Primer Proceso"
                      data={filterModalDetailData(selectedDemora.primerProceso)}
                    />
                    <DetailTable
                      title="Segundo Proceso"
                      data={filterModalDetailData(selectedDemora.segundoProceso)}
                    />
                    <DetailTable
                      title="Tercer Proceso"
                      data={filterModalDetailData(selectedDemora.tercerProceso)}
                    />
                    <DetailTable
                      title="Proceso Final"
                      data={filterModalDetailData(selectedDemora.procesoFinal)}
                    />
                  </div>
                )}

                {/* Tab: Vueltas */}
                {activeTab === "vueltas" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700">Tercer Proceso</h3>
                    <DetailTable
                      title=""
                      data={filterModalDetailData(selectedDemora.tercerProceso)}
                    />
                    {selectedDemora.tercerProceso?.vueltas &&
                      selectedDemora.tercerProceso.vueltas.length > 0 && (
                        <VueltasDetail vueltas={selectedDemora.tercerProceso.vueltas} />
                      )}
                  </div>
                )}

                {/* Tab: Intervalos */}
                {activeTab === "intervalos" && (
                  <DetailTable
                    title="Intervalos entre Procesos"
                    data={{
                      "B.E. (Entr -> Sal)": calcularIntervalos(selectedDemora).calc1,
                      "Sal. B.E. -> Lleg. Punto": calcularIntervalos(selectedDemora).calc2,
                      "Punto -> Inicio Carga": calcularIntervalos(selectedDemora).calc7,
                      "Tiempo Total Carga": calcularIntervalos(selectedDemora).calc3,
                      "Sal. Punto -> B.S. Entr.": calcularIntervalos(selectedDemora).calc4,
                      "B.S. (Entr -> Sal)": calcularIntervalos(selectedDemora).calc5,
                      "B.S. -> Salida Planta": calcularIntervalos(selectedDemora).calc6,
                      "Autorizac -> Ing. Planta": calcularIntervalos(selectedDemora).calc8,
                      "Termina Carga -> Salida Punto": calcularIntervalos(selectedDemora).calc12,
                      "Ing. Planta -> Lleg. Básq.":
                        calcularIntervalos(selectedDemora).calcIngresoBascula,
                      "Llegada -> Entrada Básq. (P1)":
                        calcularIntervalos(selectedDemora).calcExtra1,
                      "Llegada -> Entrada Básq. (P3)":
                        calcularIntervalos(selectedDemora).calcExtra2,
                      "Entrada (P3) 1ra -> Salida (P3) Última":
                        calcularIntervalos(selectedDemora).calcExtra3,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Botones al final */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => handleDescargarPDF(selectedDemora)}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                <FiDownload className="mr-2" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
