"use client";

import { useState, useEffect } from "react";
import { Bar, Doughnut, Pie, Line, Radar, PolarArea } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  FaPrint,
  FaFilePdf,
  FaTable,
} from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import AnalysisLoader from "../../../components/AnalysisLoader";

// Registrar elementos para Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

// Función para redondear a 2 decimales
function round2(num) {
  return Math.round(num * 100) / 100;
}

// Funciones auxiliares para manejo de tiempos
function parseTimeToSeconds(timeStr) {
  if (!timeStr || timeStr === "-") return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 3) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function secondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Filtrar campos no deseados (omitir "id", "createdAt" y "updatedAt")
function filterDetailData(data) {
  if (!data) return data;
  const excludedKeys = ["id", "createdAt", "updatedAt"];
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !excludedKeys.includes(key))
  );
}

// Mapeo de columnas para la tabla según el campo seleccionado
const columnMapping = {
  Todos: ["Registro", "Fecha Autorización", "Número de Transacción", "Tiempo Total"],
  "Fecha Autorización": ["Registro", "Fecha Autorización", "Número de Transacción", "Tiempo Total", "Usuario"],
  Condición: ["Registro", "Fecha Autorización", "Número de Transacción", "Condición", "Tiempo Total", "Usuario"],
  "Método Carga": ["Registro", "Fecha Autorización", "Número de Transacción", "Método Carga", "Tiempo Total", "Usuario"],
  "Báscula Entrada": ["Registro", "Fecha Autorización", "Número de Transacción", "Báscula Entrada", "Tiempo Total", "Usuario"],
  "Pesador Entrada": ["Registro", "Fecha Autorización", "Número de Transacción", "Pesador Entrada", "Tiempo Total", "Usuario"],
  "Báscula Salida": ["Registro", "Fecha Autorización", "Número de Transacción", "Báscula Salida", "Tiempo Total", "Usuario"],
  "Pesador Salida": ["Registro", "Fecha Autorización", "Número de Transacción", "Pesador Salida", "Tiempo Total", "Usuario"],
  "Portería Entrada": ["Registro", "Fecha Autorización", "Número de Transacción", "Portería Entrada", "Tiempo Total", "Usuario"],
  "Portería Salida": ["Registro", "Fecha Autorización", "Número de Transacción", "Portería Salida", "Tiempo Total", "Usuario"],
  "Número de Ejes": ["Registro", "Fecha Autorización", "Número de Transacción", "Número de Ejes", "Tiempo Total", "Usuario"],
  "Punto Despacho": ["Registro", "Fecha Autorización", "Número de Transacción", "Punto Despacho", "Tiempo Total", "Usuario"],
  Operador: ["Registro", "Fecha Autorización", "Número de Transacción", "Operador", "Tiempo Total", "Usuario"],
  Enlonador: ["Registro", "Fecha Autorización", "Número de Transacción", "Enlonador", "Tiempo Total", "Usuario"],
  "Modelo Equipo": ["Registro", "Fecha Autorización", "Número de Transacción", "Modelo Equipo", "Tiempo Total", "Usuario"],
  "Personal Asignado": ["Registro", "Fecha Autorización", "Número de Transacción", "Personal Asignado", "Tiempo Total", "Usuario"],
  Usuario: ["Registro", "Fecha Autorización", "Número de Transacción", "Tiempo Total", "Usuario"],
};

function getCellValue(column, item) {
  switch (column) {
    case "Registro":
      return item.id;
    case "Fecha Autorización":
      return item.primerProceso?.fechaAutorizacion || "N/A";
    case "Número de Transacción":
      return item.primerProceso?.numeroTransaccion || "N/A";
    case "Tiempo Total":
      return item.tiempoTotal;
    case "Usuario":
      return item.userName || "N/A";
    case "Condición":
      return item.primerProceso?.condicion || "N/A";
    case "Método Carga":
      return item.primerProceso?.metodoCarga || "N/A";
    case "Báscula Entrada":
      return item.primerProceso?.basculaEntrada || "N/A";
    case "Pesador Entrada":
      return item.primerProceso?.pesadorEntrada || "N/A";
    case "Báscula Salida":
      return item.tercerProceso?.basculaSalida || "N/A";
    case "Pesador Salida":
      return item.tercerProceso?.pesadorSalida || "N/A";
    case "Portería Entrada":
      return item.primerProceso?.porteriaEntrada || "N/A";
    case "Portería Salida":
      return item.procesoFinal?.porteriaSalida || "N/A";
    case "Número de Ejes":
      return item.primerProceso?.numeroEjes || "N/A";
    case "Punto Despacho":
      return item.primerProceso?.puntoDespacho || "N/A";
    case "Operador":
      return item.segundoProceso?.operador || "N/A";
    case "Enlonador":
      return item.segundoProceso?.enlonador || "N/A";
    case "Modelo Equipo":
      return item.segundoProceso?.modeloEquipo || "N/A";
    case "Personal Asignado":
      return item.segundoProceso?.personalAsignado || "N/A";
    default:
      return "";
  }
}

export default function AnalisisPage() {
  // Estados para los datos y filtros
  const [allDemoras, setAllDemoras] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [condicionFil, setCondicionFil] = useState("");
  const [generalFilter, setGeneralFilter] = useState("");
  const [selectedField, setSelectedField] = useState("Todos");

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Cargar data desde /api/demoras con paginación
  useEffect(() => {
    setLoading(true);
    fetch(`/api/demoras?page=${currentPage}&limit=${recordsPerPage}`)
      .then((res) => res.json())
      .then((result) => {
        // Se asume que el endpoint retorna { data, totalCount }
        setAllDemoras(result.data);
        setFilteredData(result.data);
        setTotalCount(result.totalCount);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [currentPage, recordsPerPage]);

  // Aplicar filtros (se aplican solo sobre la data cargada de la página actual)
  useEffect(() => {
    let tempFiltered = allDemoras;
    if (startDate) {
      const sDate = new Date(startDate);
      tempFiltered = tempFiltered.filter((item) => {
        const authDate = item.primerProceso?.fechaAutorizacion;
        if (!authDate) return false;
        return new Date(authDate) >= sDate;
      });
    }
    if (endDate) {
      const eDate = new Date(endDate);
      tempFiltered = tempFiltered.filter((item) => {
        const authDate = item.primerProceso?.fechaAutorizacion;
        if (!authDate) return false;
        return new Date(authDate) <= eDate;
      });
    }
    if (condicionFil) {
      tempFiltered = tempFiltered.filter(
        (item) =>
          item.primerProceso &&
          item.primerProceso.condicion &&
          item.primerProceso.condicion.toLowerCase().includes(condicionFil.toLowerCase())
      );
    }
    if (generalFilter) {
      tempFiltered = tempFiltered.filter((item) => {
        let value = "";
        switch (selectedField) {
          case "Fecha Autorización":
            value = item.primerProceso?.fechaAutorizacion || "";
            break;
          case "Condición":
            value = item.primerProceso?.condicion || "";
            break;
          case "Método Carga":
            value = item.primerProceso?.metodoCarga || "";
            break;
          case "Báscula Entrada":
            value = item.primerProceso?.basculaEntrada || "";
            break;
          case "Pesador Entrada":
            value = item.primerProceso?.pesadorEntrada || "";
            break;
          case "Báscula Salida":
            value = item.tercerProceso?.basculaSalida || "";
            break;
          case "Pesador Salida":
            value = item.tercerProceso?.pesadorSalida || "";
            break;
          case "Portería Entrada":
            value = item.primerProceso?.porteriaEntrada || "";
            break;
          case "Portería Salida":
            value = item.procesoFinal?.porteriaSalida || "";
            break;
          case "Número de Ejes":
            value = item.primerProceso?.numeroEjes || "";
            break;
          case "Punto Despacho":
            value = item.primerProceso?.puntoDespacho || "";
            break;
          case "Operador":
            value = item.segundoProceso?.operador || "";
            break;
          case "Enlonador":
            value = item.segundoProceso?.enlonador || "";
            break;
          case "Modelo Equipo":
            value = item.segundoProceso?.modeloEquipo || "";
            break;
          case "Personal Asignado":
            value = item.segundoProceso?.personalAsignado || "";
            break;
          case "Usuario":
            value = item.userName || "";
            break;
          default:
            value = JSON.stringify(item);
        }
        return value.toLowerCase().includes(generalFilter.toLowerCase());
      });
    }
    setFilteredData(tempFiltered);
  }, [startDate, endDate, condicionFil, generalFilter, selectedField, allDemoras]);

  // Reiniciar la página actual cuando cambie algún filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, condicionFil, generalFilter, selectedField]);

  // Calcular promedio del tiempo total (en segundos)
  let totalTimeSec = 0;
  let recordCount = 0;
  filteredData.forEach((item) => {
    const secs = parseTimeToSeconds(item.tiempoTotal);
    totalTimeSec += secs;
    recordCount++;
  });
  const avgTimeSec = recordCount ? totalTimeSec / recordCount : 0;

  // Calcular intervalos entre procesos (en segundos)
  const computeIntervals = (item) => {
    const proc1 = item.primerProceso || {};
    const proc2 = item.segundoProceso || {};
    const proc3 = item.tercerProceso || {};
    const proc4 = item.procesoFinal || {};

    const time1 = parseTimeToSeconds(proc1.tiempoEntradaBascula);
    const time2 = parseTimeToSeconds(proc1.tiempoSalidaBascula);
    const interval1 = time2 - time1;

    const time3 = parseTimeToSeconds(proc1.tiempoSalidaBascula);
    const time4 = parseTimeToSeconds(proc2.tiempoLlegadaPunto);
    const interval2 = time4 - time3;

    const time5 = parseTimeToSeconds(proc2.tiempoInicioCarga);
    const time6 = parseTimeToSeconds(proc2.tiempoTerminaCarga);
    const interval3 = time6 - time5;

    let time7 = parseTimeToSeconds(proc2.tiempoSalidaPunto);
    let time8 = 0;
    if (proc3.vueltas && proc3.vueltas.length > 0) {
      const lastLoop = proc3.vueltas[proc3.vueltas.length - 1];
      time8 = parseTimeToSeconds(lastLoop.tiempoEntradaBascula);
    }
    const interval4 = time8 - time7;

    let interval5 = 0;
    if (proc3.vueltas && proc3.vueltas.length > 0) {
      const lastLoop = proc3.vueltas[proc3.vueltas.length - 1];
      const time9 = parseTimeToSeconds(lastLoop.tiempoEntradaBascula);
      const time10 = parseTimeToSeconds(lastLoop.tiempoSalidaBascula);
      interval5 = time10 - time9;
    }
    let time11 = proc3.vueltas && proc3.vueltas.length > 0 ? parseTimeToSeconds(proc3.vueltas[proc3.vueltas.length - 1].tiempoSalidaBascula) : 0;
    const time12 = parseTimeToSeconds(proc4.tiempoSalidaPlanta);
    const interval6 = time12 - time11;

    return { interval1, interval2, interval3, interval4, interval5, interval6 };
  };

  let intervalsTotal = { interval1: 0, interval2: 0, interval3: 0, interval4: 0, interval5: 0, interval6: 0 };
  let intervalsCount = 0;
  filteredData.forEach((item) => {
    const ints = computeIntervals(item);
    intervalsTotal.interval1 += ints.interval1;
    intervalsTotal.interval2 += ints.interval2;
    intervalsTotal.interval3 += ints.interval3;
    intervalsTotal.interval4 += ints.interval4;
    intervalsTotal.interval5 += ints.interval5;
    intervalsTotal.interval6 += ints.interval6;
    intervalsCount++;
  });
  const avgIntervalsSec = {};
  if (intervalsCount) {
    for (const key in intervalsTotal) {
      avgIntervalsSec[key] = intervalsTotal[key] / intervalsCount;
    }
  }

  // Convertir promedios de intervalos a horas (para gráficos)
  const avgIntervalsHrs = {
    interval1: round2((avgIntervalsSec.interval1 || 0) / 3600),
    interval2: round2((avgIntervalsSec.interval2 || 0) / 3600),
    interval3: round2((avgIntervalsSec.interval3 || 0) / 3600),
    interval4: round2((avgIntervalsSec.interval4 || 0) / 3600),
    interval5: round2((avgIntervalsSec.interval5 || 0) / 3600),
    interval6: round2((avgIntervalsSec.interval6 || 0) / 3600),
  };

  // Convertir tiempo total promedio a horas (para gráficos)
  const avgTotalHrs = round2(avgTimeSec / 3600);

  // Calcular promedios por proceso (usando nombres únicos)
  let sumProcP1Unique = 0,
    sumProcP2Unique = 0,
    sumProcP3Unique = 0,
    sumProcP4Unique = 0,
    procCountUnique = 0;
  filteredData.forEach((item) => {
    const proc1 = item.primerProceso || {};
    const proc2 = item.segundoProceso || {};
    const proc3 = item.tercerProceso || {};
    const proc4 = item.procesoFinal || {};
    const procTime1 = parseTimeToSeconds(proc1.tiempoSalidaBascula) - parseTimeToSeconds(proc1.tiempoEntradaBascula);
    const procTime2 = parseTimeToSeconds(proc2.tiempoTerminaCarga) - parseTimeToSeconds(proc2.tiempoInicioCarga);
    let procTime3 = 0;
    if (proc3.vueltas && proc3.vueltas.length > 0) {
      const lastLoop = proc3.vueltas[proc3.vueltas.length - 1];
      procTime3 = parseTimeToSeconds(lastLoop.tiempoSalidaBascula) - parseTimeToSeconds(lastLoop.tiempoEntradaBascula);
    }
    const procTime4 = parseTimeToSeconds(proc4.tiempoSalidaPlanta) - parseTimeToSeconds(proc4.tiempoLlegadaPorteria);
    sumProcP1Unique += procTime1;
    sumProcP2Unique += procTime2;
    sumProcP3Unique += procTime3;
    sumProcP4Unique += procTime4;
    procCountUnique++;
  });
  const avgProcP1Unique = procCountUnique ? sumProcP1Unique / procCountUnique : 0;
  const avgProcP2Unique = procCountUnique ? sumProcP2Unique / procCountUnique : 0;
  const avgProcP3Unique = procCountUnique ? sumProcP3Unique / procCountUnique : 0;
  const avgProcP4Unique = procCountUnique ? sumProcP4Unique / procCountUnique : 0;
  const avgProcP1Hrs = round2(avgProcP1Unique / 3600);
  const avgProcP2Hrs = round2(avgProcP2Unique / 3600);
  const avgProcP3Hrs = round2(avgProcP3Unique / 3600);
  const avgProcP4Hrs = round2(avgProcP4Unique / 3600);

  // Gráfico 1: Bar Chart - Promedio de Intervalos (horas)
  const chartBarData = {
    labels: [
      "Int. Báscula (Ent-Sal)",
      "Int. Traslado a Punto",
      "Int. Tiempo Carga",
      "Int. Traslado a Báscula",
      "Int. Báscula (Vuelta)",
      "Int. Salida Planta",
    ],
    datasets: [
      {
        label: "Promedio (horas)",
        data: [
          avgIntervalsHrs.interval1,
          avgIntervalsHrs.interval2,
          avgIntervalsHrs.interval3,
          avgIntervalsHrs.interval4,
          avgIntervalsHrs.interval5,
          avgIntervalsHrs.interval6,
        ],
        backgroundColor: "rgba(75,192,192,0.6)",
      },
    ],
  };

  const chartBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Promedio de Intervalos Entre Procesos (horas)" },
    },
  };

  // Gráfico 2: Doughnut Chart - Tiempo Total Promedio (horas)
  const chartDoughnutData = {
    labels: ["Tiempo Total Promedio"],
    datasets: [
      {
        label: "Tiempo Total (horas)",
        data: [avgTotalHrs],
        backgroundColor: ["rgba(255,99,132,0.6)"],
      },
    ],
  };

  const chartDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Tiempo Total Promedio (horas)" },
    },
  };

  // Gráfico 3: Pie Chart - Distribución de Condiciones
  const conditionCountObj = {};
  filteredData.forEach((item) => {
    const cond = item.primerProceso?.condicion ? item.primerProceso.condicion : "Sin condición";
    conditionCountObj[cond] = (conditionCountObj[cond] || 0) + 1;
  });
  const chartPieData = {
    labels: Object.keys(conditionCountObj),
    datasets: [
      {
        label: "Cantidad",
        data: Object.values(conditionCountObj),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8BC34A", "#FF9800", "#9C27B0"],
      },
    ],
  };

  const chartPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Distribución de Condiciones Registradas" },
    },
  };

  // Gráfico 4: Line Chart - Tiempo Total por Registro (horas)
  const chartLineData = {
    labels: filteredData.map((item) => `Reg ${item.id}`),
    datasets: [
      {
        label: "Tiempo Total (horas)",
        data: filteredData.map((item) =>
          round2(parseTimeToSeconds(item.tiempoTotal) / 3600)
        ),
        fill: false,
        borderColor: "#42A5F5",
        tension: 0.1,
      },
    ],
  };

  const chartLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Tiempo Total por Registro (horas)" },
    },
  };

  // Gráfico 5: Radar Chart - Promedio de Intervalos (horas)
  const chartRadarData = {
    labels: ["Int. 1", "Int. 2", "Int. 3", "Int. 4", "Int. 5", "Int. 6"],
    datasets: [
      {
        label: "Promedio (horas)",
        data: [
          avgIntervalsHrs.interval1,
          avgIntervalsHrs.interval2,
          avgIntervalsHrs.interval3,
          avgIntervalsHrs.interval4,
          avgIntervalsHrs.interval5,
          avgIntervalsHrs.interval6,
        ],
        backgroundColor: "rgba(153,102,255,0.2)",
        borderColor: "rgba(153,102,255,1)",
        borderWidth: 1,
      },
    ],
  };

  const chartRadarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Radar - Promedio de Intervalos (horas)" },
    },
  };

  // Gráfico 6: Polar Area Chart - Distribución de Condiciones
  const chartPolarData = {
    labels: Object.keys(conditionCountObj),
    datasets: [
      {
        label: "Cantidad",
        data: Object.values(conditionCountObj),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8BC34A", "#FF9800", "#9C27B0"],
      },
    ],
  };

  const chartPolarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Polar - Distribución de Condiciones" },
    },
  };

  // Gráfico 7: Bar Chart - Promedio de Tiempo por Proceso (horas)
  const chartProcessBarData = {
    labels: ["Primer Proceso", "Segundo Proceso", "Tercer Proceso", "Final Proceso"],
    datasets: [
      {
        label: "Tiempo Promedio (horas)",
        data: [avgProcP1Hrs, avgProcP2Hrs, avgProcP3Hrs, avgProcP4Hrs],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8BC34A"],
      },
    ],
  };

  const chartProcessBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Promedio de Tiempo por Proceso (horas)" },
    },
  };

  // Gráfico 8: Radar Chart - Tiempo por Proceso (horas)
  const chartProcessRadarData = {
    labels: ["Primer", "Segundo", "Tercer", "Final"],
    datasets: [
      {
        label: "Tiempo (horas)",
        data: [avgProcP1Hrs, avgProcP2Hrs, avgProcP3Hrs, avgProcP4Hrs],
        backgroundColor: "rgba(255,159,64,0.2)",
        borderColor: "rgba(255,159,64,1)",
        borderWidth: 1,
      },
    ],
  };

  const chartProcessRadarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Radar - Tiempo por Proceso (horas)" },
    },
  };

  // Sección explicativa de Intervalos y Procesos
  const descripcion = (
    <div className="mb-8 mt-4">
      <h2 className="text-xl font-bold mb-2">Descripción de Intervalos y Procesos</h2>
      <ul className="list-disc pl-6">
        <li>
          <strong>Intervalo 1:</strong> Tiempo entre la entrada y salida en la báscula del <em>Primer Proceso</em> (control inicial de pesaje).
        </li>
        <li>
          <strong>Intervalo 2:</strong> Tiempo entre la salida de la báscula del <em>Primer Proceso</em> y la llegada al punto del <em>Segundo Proceso</em> (traslado).
        </li>
        <li>
          <strong>Intervalo 3:</strong> Tiempo dedicado a la carga en el <em>Segundo Proceso</em>.
        </li>
        <li>
          <strong>Intervalo 4:</strong> Tiempo entre la salida del punto del <em>Segundo Proceso</em> y la entrada a la báscula en el <em>Tercer Proceso</em> (traslado a báscula de salida).
        </li>
        <li>
          <strong>Intervalo 5:</strong> Tiempo de pesaje en la báscula durante la última vuelta en el <em>Tercer Proceso</em>.
        </li>
        <li>
          <strong>Intervalo 6:</strong> Tiempo entre la salida de la báscula del <em>Tercer Proceso</em> y la salida de la unidad en el <em>Proceso Final</em>.
        </li>
        <li>
          <strong>Primer Proceso:</strong> Control inicial que incluye báscula de entrada, prechequeo y autorización.
        </li>
        <li>
          <strong>Segundo Proceso:</strong> Proceso de carga, que abarca traslado al punto, inicio y término de la carga.
        </li>
        <li>
          <strong>Tercer Proceso:</strong> Control final en la báscula de salida (puede incluir varias vueltas de pesaje).
        </li>
        <li>
          <strong>Proceso Final:</strong> Registro de la salida de la unidad de la planta, con control en portería.
        </li>
      </ul>
    </div>
  );

  // Función para imprimir la página actual (incluye gráficos tal como aparecen en pantalla)
  const handleImprimir = () => {
    window.print();
  };

  // Función para descargar en PDF un resumen textual de la vista (los gráficos se imprimirán vía window.print)
  const handleDescargarPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    let currentPagePdf = pdfDoc.addPage();
    const { width, height } = currentPagePdf.getSize();
    const margin = 50;
    let yPos = height - margin;
    const lineH = 14;

    const drawText = (text, size = 10, font = timesRomanFont) => {
      const sanitizedText = text.replace(/→/g, "->");
      if (yPos < margin + lineH) {
        currentPagePdf = pdfDoc.addPage();
        yPos = currentPagePdf.getSize().height - margin;
      }
      currentPagePdf.drawText(sanitizedText, {
        x: margin,
        y: yPos,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      yPos -= lineH;
    };

    const centerText = (text, size = 12, font = timesRomanFont) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      const x = (width - textWidth) / 2;
      if (yPos < margin + lineH) {
        currentPagePdf = pdfDoc.addPage();
        yPos = currentPagePdf.getSize().height - margin;
      }
      currentPagePdf.drawText(text, { x, y: yPos, size, font, color: rgb(0, 0, 0) });
      yPos -= lineH;
    };

    // Encabezado del PDF
    centerText("ALMAPAC S.A de C.V. - PLANTA ACAJUTLA", 16, timesRomanFont);
    centerText("Control de Tiempos Despacho", 14, timesRomanFont);
    yPos -= lineH * 0.5;
    centerText("Análisis de Datos", 14, timesRomanFont);
    yPos -= lineH * 1.5;

    // Sección: Resumen de Promedios (formato HH:mm:ss)
    drawText("Resumen de Promedios:", 12, timesRomanFont);
    drawText(`Tiempo Total Promedio: ${secondsToHMS(Math.round(avgTimeSec))} (${(avgTimeSec/3600).toFixed(2)} hrs)`, 10, courierFont);
    drawText(`Intervalo 1 Promedio: ${secondsToHMS(Math.round(avgIntervalsSec.interval1))}`, 10, courierFont);
    drawText(`Intervalo 2 Promedio: ${secondsToHMS(Math.round(avgIntervalsSec.interval2))}`, 10, courierFont);
    drawText(`Intervalo 3 Promedio: ${secondsToHMS(Math.round(avgIntervalsSec.interval3))}`, 10, courierFont);
    drawText(`Intervalo 4 Promedio: ${secondsToHMS(Math.round(avgIntervalsSec.interval4))}`, 10, courierFont);
    drawText(`Intervalo 5 Promedio: ${secondsToHMS(Math.round(avgIntervalsSec.interval5))}`, 10, courierFont);
    drawText(`Intervalo 6 Promedio: ${secondsToHMS(Math.round(avgIntervalsSec.interval6))}`, 10, courierFont);
    drawText(`Primer Proceso: ${secondsToHMS(Math.round(avgProcP1Unique))} (${avgProcP1Hrs.toFixed(2)} hrs)`, 10, courierFont);
    drawText(`Segundo Proceso: ${secondsToHMS(Math.round(avgProcP2Unique))} (${avgProcP2Hrs.toFixed(2)} hrs)`, 10, courierFont);
    drawText(`Tercer Proceso: ${secondsToHMS(Math.round(avgProcP3Unique))} (${avgProcP3Hrs.toFixed(2)} hrs)`, 10, courierFont);
    drawText(`Final Proceso: ${secondsToHMS(Math.round(avgProcP4Unique))} (${avgProcP4Hrs.toFixed(2)} hrs)`, 10, courierFont);
    yPos -= lineH;

    // Sección: Detalle de Registros Filtrados
    drawText("Detalle de Registros Filtrados:", 12, timesRomanFont);
    drawText("Registro | Fecha Autorización         | Número Transacción | Tiempo Total", 10, courierFont);
    drawText("-".repeat(80), 10, courierFont);
    filteredData.forEach((item) => {
      const authDate = item.primerProceso?.fechaAutorizacion || "N/A";
      const numTrans = item.primerProceso?.numeroTransaccion || "N/A";
      const line = `${String(item.id).padEnd(8)} | ${authDate.padEnd(25)} | ${numTrans.padEnd(20)} | ${item.tiempoTotal}`;
      drawText(line, 10, courierFont);
    });
    yPos -= lineH;

    drawText("Nota: Para ver los gráficos, imprima la página web completa.", 10, timesRomanFont);

    // Pie de página: Fecha y hora del reporte
    const repFecha = new Date();
    const repFechaHora = `Reporte: ${repFecha.toLocaleDateString()} ${repFecha.toLocaleTimeString()}`;
    currentPagePdf.drawText(repFechaHora, {
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
    a.download = "Analisis_Datos.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Si aún se cargan los datos, se muestra el Loader
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <AnalysisLoader />
      </div>
    );
  }

  // Determinar las columnas a mostrar según el filtro seleccionado
  const displayColumns = columnMapping[selectedField] || columnMapping["Todos"];

  // Cálculo del número total de páginas (según el total de registros en el backend)
  const totalPages = Math.ceil(totalCount / recordsPerPage) || 1;

  return (
    <div className="p-4">
      {/* Botón Regresar */}
      <button
        onClick={() => (window.location.href = "/")}
        className="mb-4 rounded-full inline-flex items-center"
      >
        <span className="bg-blue-600 p-2 rounded-full text-white flex items-center justify-center">
          <FiArrowLeft size={20} />
        </span>
        <span className="ml-2 text-blue-600 font-semibold">Análisis de Datos</span>
      </button>

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block mb-1">Fecha Inicio (Autorización)</label>
          <input
            type="date"
            className="border p-2 w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1">Fecha Fin (Autorización)</label>
          <input
            type="date"
            className="border p-2 w-full"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1">Condición</label>
          <input
            type="text"
            className="border p-2 w-full"
            placeholder="Ej: NORMAL, LLUVIA, etc."
            value={condicionFil}
            onChange={(e) => setCondicionFil(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1">Filtrar por Campo</label>
          <select
            className="border p-2 w-full"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Fecha Autorización">Fecha Autorización</option>
            <option value="Condición">Condición</option>
            <option value="Método Carga">Método Carga</option>
            <option value="Báscula Entrada">Báscula Entrada</option>
            <option value="Pesador Entrada">Pesador Entrada</option>
            <option value="Báscula Salida">Báscula Salida</option>
            <option value="Pesador Salida">Pesador Salida</option>
            <option value="Portería Entrada">Portería Entrada</option>
            <option value="Portería Salida">Portería Salida</option>
            <option value="Número de Ejes">Número de Ejes</option>
            <option value="Punto Despacho">Punto Despacho</option>
            <option value="Operador">Operador</option>
            <option value="Enlonador">Enlonador</option>
            <option value="Modelo Equipo">Modelo Equipo</option>
            <option value="Personal Asignado">Personal Asignado</option>
            <option value="Usuario">Usuario</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block mb-1">Filtro General</label>
          <input
            type="text"
            className="border p-2 w-full"
            placeholder="Buscar en el campo seleccionado"
            value={generalFilter}
            onChange={(e) => setGeneralFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Selector de cantidad de registros por página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="mb-2 sm:mb-0">
          <span className="text-sm">Total de registros: {totalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm" htmlFor="recordsPerPage">Mostrar:</label>
          <select
            id="recordsPerPage"
            value={recordsPerPage}
            onChange={(e) => {
              setRecordsPerPage(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="border p-2 text-sm"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
            <option value="2000">2000</option>
            <option value="4000">4000</option>
          </select>
        </div>
      </div>

      {/* Tabla de registros filtrados */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {displayColumns.map((col) => (
                <th key={col} className="border p-2">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                {displayColumns.map((col) => (
                  <td key={col} className="border p-2">
                    {getCellValue(col, item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-sm">
          Total de registros en esta página: {filteredData.length}
        </div>
      </div>

      {/* Paginador */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pb-4 border-b">
        <div className="flex space-x-2 mb-2 sm:mb-0">
          <button
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded mr-2 disabled:opacity-50"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 border rounded mx-1 ${
                currentPage === i + 1 ? "bg-blue-500 text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded ml-2 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="text-sm">
          Página {currentPage} de {totalPages}
        </div>
      </div>

      {/* Sección de Gráficos (8 gráficos, más grandes y responsivos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Gráfico 1: Bar Chart - Promedio de Intervalos (horas) */}
        <div className="border p-4 h-80">
          <Bar data={chartBarData} options={chartBarOptions} />
        </div>
        {/* Gráfico 2: Doughnut Chart - Tiempo Total Promedio (horas) */}
        <div className="border p-4 h-80">
          <Doughnut data={chartDoughnutData} options={chartDoughnutOptions} />
        </div>
        {/* Gráfico 3: Pie Chart - Distribución de Condiciones */}
        <div className="border p-4 h-80">
          <Pie data={chartPieData} options={chartPieOptions} />
        </div>
        {/* Gráfico 4: Line Chart - Tiempo Total por Registro (horas) */}
        <div className="border p-4 h-80">
          <Line data={chartLineData} options={chartLineOptions} />
        </div>
        {/* Gráfico 5: Radar Chart - Promedio de Intervalos (horas) */}
        <div className="border p-4 h-80">
          <Radar data={chartRadarData} options={chartRadarOptions} />
        </div>
        {/* Gráfico 6: Polar Area Chart - Distribución de Condiciones */}
        <div className="border p-4 h-80">
          <PolarArea data={chartPolarData} options={chartPolarOptions} />
        </div>
        {/* Gráfico 7: Bar Chart - Promedio de Tiempo por Proceso (horas) */}
        <div className="border p-4 h-80">
          <Bar data={chartProcessBarData} options={chartProcessBarOptions} />
        </div>
        {/* Gráfico 8: Radar Chart - Tiempo por Proceso (horas) */}
        <div className="border p-4 h-80">
          <Radar data={chartProcessRadarData} options={chartProcessRadarOptions} />
        </div>
      </div>

      {/* Sección de Descripción de Intervalos y Procesos */}
      {descripcion}

      {/* Resumen de Promedios (en formato HH:mm:ss) */}
      <div className="mb-4">
        <h2 className="text-xl flex items-center mb-4">
          <FaTable className="mr-2" /> Resumen de Promedios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <p className="text-lg">Tiempo Total Promedio: {secondsToHMS(Math.round(avgTimeSec))}</p>
          <p className="text-lg">Intervalo 1 Promedio: {secondsToHMS(Math.round(avgIntervalsSec.interval1))}</p>
          <p className="text-lg">Intervalo 2 Promedio: {secondsToHMS(Math.round(avgIntervalsSec.interval2))}</p>
          <p className="text-lg">Intervalo 3 Promedio: {secondsToHMS(Math.round(avgIntervalsSec.interval3))}</p>
          <p className="text-lg">Intervalo 4 Promedio: {secondsToHMS(Math.round(avgIntervalsSec.interval4))}</p>
          <p className="text-lg">Intervalo 5 Promedio: {secondsToHMS(Math.round(avgIntervalsSec.interval5))}</p>
          <p className="text-lg">Intervalo 6 Promedio: {secondsToHMS(Math.round(avgIntervalsSec.interval6))}</p>
          <p className="text-lg">Primer Proceso: {secondsToHMS(Math.round(avgProcP1Unique))}</p>
          <p className="text-lg">Segundo Proceso: {secondsToHMS(Math.round(avgProcP2Unique))}</p>
          <p className="text-lg">Tercer Proceso: {secondsToHMS(Math.round(avgProcP3Unique))}</p>
          <p className="text-lg">Final Proceso: {secondsToHMS(Math.round(avgProcP4Unique))}</p>
        </div>
      </div>

      {/* Botones para Imprimir y Descargar PDF */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleImprimir}
          className="bg-yellow-600 text-white px-4 py-2 rounded inline-flex items-center"
        >
          <FaPrint className="mr-2" /> Imprimir
        </button>
        <button
          onClick={handleDescargarPDF}
          className="bg-green-600 text-white px-4 py-2 rounded inline-flex items-center"
        >
          <FaFilePdf className="mr-2" /> Descargar PDF
        </button>
      </div>
    </div>
  );
}
