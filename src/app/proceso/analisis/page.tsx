"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "motion/react";
import { FiArrowLeft } from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Footer from "../../../components/Footer";
import {
  RefreshCw,
  FileSpreadsheet,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
} from "lucide-react";

// IMPORTS PARA CHARTS
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

/* =========================
   FUNCIONES AUXILIARES
   ========================= */

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  const [hh, mm, ss] = parts;
  return (hh || 0) * 60 + (mm || 0) + ((ss || 0) / 60);
}

function convertMinutesToHHMMSS(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

function getTimeDistribution(data: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    "0-15": 0,
    "15-30": 0,
    "30-45": 0,
    "45-60": 0,
    "60-90": 0,
    "90+": 0,
  };
  data.forEach((item) => {
    if (!item.tiempoTotal) return;
    const [hh, mm, ss] = item.tiempoTotal.split(":");
    const totalMins = parseInt(hh) * 60 + parseInt(mm) + (parseInt(ss || "0") / 60);
    if (totalMins < 15) distribution["0-15"]++;
    else if (totalMins < 30) distribution["15-30"]++;
    else if (totalMins < 45) distribution["30-45"]++;
    else if (totalMins < 60) distribution["45-60"]++;
    else if (totalMins < 90) distribution["60-90"]++;
    else distribution["90+"]++;
  });
  return distribution;
}

function getParosDistribution(envasadoData: any[]): Record<string, { totalMinutes: number; count: number }> {
  const result: Record<string, { totalMinutes: number; count: number }> = {};
  envasadoData.forEach((item) => {
    if (!item.segundoProceso?.parosEnv) return;
    item.segundoProceso.parosEnv.forEach((paro: any) => {
      const { razon, duracionParo } = paro;
      const minutes = parseTimeToMinutes(duracionParo);
      if (!result[razon]) result[razon] = { totalMinutes: 0, count: 0 };
      result[razon].totalMinutes += minutes;
      result[razon].count += 1;
    });
  });
  return result;
}

function computeStatsForType(records: any[]) {
  if (records.length === 0) {
    return { totalProcesses: 0, avgTime: "00:00:00", avgMinutes: 0, delayedCount: 0, completedToday: 0 };
  }
  const times = records.map(proc => parseTimeToMinutes(proc.tiempoTotal || "00:00:00"));
  const totalMinutes = times.reduce((sum, m) => sum + m, 0);
  const avg = totalMinutes / records.length;
  const delayedCount = times.filter(time => time > avg).length;
  const todayDate = new Date().toLocaleDateString();
  const completedToday = records.filter(proc => new Date(proc.createdAt).toLocaleDateString() === todayDate).length;
  return { totalProcesses: records.length, avgTime: convertMinutesToHHMMSS(avg), avgMinutes: avg, delayedCount, completedToday };
}

function computeStandardizationGranel(demoras: any[]) {
  const groups: Record<string, { total: number; count: number }> = {};
  demoras.forEach((proc) => {
    if (!proc.primerProceso) return;
    const puntoDespacho = proc.primerProceso.puntoDespacho || "Sin despacho";
    const condicion = proc.primerProceso.condicion || "Sin condición";
    const key = `${puntoDespacho} | ${condicion}`;
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
    groups[key].total += proc.tiempoTotalMin;
    groups[key].count++;
  });
  const standardization: Record<string, string> = {};
  Object.keys(groups).forEach((key) => {
    const group = groups[key];
    const avg = group.total / group.count;
    standardization[key] = convertMinutesToHHMMSS(avg);
  });
  return standardization;
}

function computeAggregatesByMetodo(records: any[]) {
  const groups: Record<string, { total: number; count: number }> = {};
  records.forEach((record) => {
    if (!record.primerProceso) return;
    const metodo = record.primerProceso.metodoCarga || "Desconocido";
    if (!groups[metodo]) groups[metodo] = { total: 0, count: 0 };
    groups[metodo].total += record.tiempoTotalMin;
    groups[metodo].count++;
  });
  const aggregates: Record<string, { count: number; avgTime: string }> = {};
  Object.keys(groups).forEach((key) => {
    const group = groups[key];
    const avg = group.total / group.count;
    aggregates[key] = { count: group.count, avgTime: convertMinutesToHHMMSS(avg) };
  });
  return aggregates;
}

/* =========================
   COMPONENTES DE INTERFAZ
   ========================= */

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "outline" | "destructive" | "ghost" | string;
  disabled?: boolean;
  className?: string;
};
const Button = ({ children, onClick, variant = "outline", disabled = false, className = "" }: ButtonProps) => {
  const base = "px-3 py-2 rounded-md font-medium focus:outline-none transition-colors";
  let variantClass = "";
  if (variant === "outline") {
    variantClass = "bg-white text-[#FF9B4D] hover:bg-gray-100";
  } else if (variant === "destructive") {
    variantClass = "bg-red-600 text-white hover:bg-red-700";
  } else if (variant === "ghost") {
    variantClass = "bg-transparent hover:bg-gray-100";
  } else {
    variantClass = "bg-gray-200 hover:bg-gray-300";
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variantClass} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string; }) => (
  <div className={`bg-white p-4 rounded shadow-md ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string; }) => (
  <div className={`mb-2 flex items-center justify-between ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string; }) => (
  <h3 className={`text-sm font-medium ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string; }) => (
  <div className={className}>{children}</div>
);

const TabsList = ({ children, className = "" }: { children: React.ReactNode; className?: string; }) => (
  <div className={`inline-flex flex-wrap space-x-2 ${className}`}>{children}</div>
);
type TabValue = "granel" | "envasado";
type TabsTriggerProps = {
  value: TabValue;
  activeTab: TabValue;
  onClick: (value: TabValue) => void;
  children: React.ReactNode;
  activeBg: string;
  inactiveBg: string;
  activeTextColor: string;
  inactiveTextColor: string;
};
const TabsTrigger = ({ value, activeTab, onClick, children, activeBg, inactiveBg, activeTextColor, inactiveTextColor }: TabsTriggerProps) => (
  <button
    onClick={() => onClick(value)}
    className={`px-4 py-2 rounded transition-colors ${
      activeTab === value ? `${activeBg} ${activeTextColor}` : `${inactiveBg} ${inactiveTextColor}`
    }`}
  >
    {children}
  </button>
);

type SubTabValue = "timeStats" | "distribution" | "efficiency" | "global" | "standards" | "aggregates" | "paros";
type SubTabTriggerProps = {
  label: string;
  value: SubTabValue;
  activeSubTab: SubTabValue;
  onClick: (value: SubTabValue) => void;
};
const SubTabTrigger = ({ label, value, activeSubTab, onClick }: SubTabTriggerProps) => (
  <button
    onClick={() => onClick(value)}
    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
      activeSubTab === value ? "bg-gray-200 text-gray-800" : "bg-white hover:bg-gray-100 text-gray-600"
    }`}
  >
    {label}
  </button>
);
const SubTabsList = ({ children }: { children: React.ReactNode; }) => (
  <div className="flex flex-wrap gap-2 mb-4">{children}</div>
);

/* =========================
   COMPONENTES DE GRÁFICOS Y REPORTES
   ========================= */

function TimeStandardsReport({ data, type }: { data: any[]; type: TabValue; }) {
  const barData = {
    labels: data.map((d) =>
      d.primerProceso?.numeroTransaccion ? `TX ${d.primerProceso.numeroTransaccion}` : `ID ${d.id}`
    ),
    datasets: [
      {
        label: "Tiempo Total (min)",
        data: data.map((d) => {
          if (!d.tiempoTotal) return 0;
          const [hh, mm, ss] = d.tiempoTotal.split(":");
          return parseInt(hh) * 60 + parseInt(mm) + (parseInt(ss || "0") / 60);
        }),
        backgroundColor: type === "granel" ? "rgba(255, 155, 77, 0.6)" : "rgba(59, 79, 228, 0.6)",
        borderColor: type === "granel" ? "rgba(255, 155, 77, 1)" : "rgba(59, 79, 228, 1)",
        borderWidth: 1,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: `Estadísticas de Tiempos (${type.toUpperCase()})` },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Minutos" } },
      x: { title: { display: true, text: "Procesos" } },
    },
  };
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="relative h-72 w-full">
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
}

function ProcessTimeDistribution({ data, type }: { data: any[]; type: TabValue; }) {
  const distribution = getTimeDistribution(data);
  const pieData = {
    labels: Object.keys(distribution),
    datasets: [
      {
        data: Object.values(distribution),
        backgroundColor: ["#FF9B4D", "#FFCD56", "#4BC0C0", "#36A2EB", "#9966FF", "#FF6384"],
      },
    ],
  };
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: `Distribución de Tiempos (${type.toUpperCase()})` },
      legend: { position: "bottom" as const },
    },
  };
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="relative h-72 w-full">
        <Pie data={pieData} options={pieOptions} />
      </div>
    </div>
  );
}

function ProcessEfficiencyMetrics({ data, type, targetTime }: { data: any[]; type: TabValue; targetTime: number; }) {
  const times = data.map((d) => {
    if (!d.tiempoTotal) return 0;
    const [hh, mm, ss] = d.tiempoTotal.split(":");
    return parseInt(hh) * 60 + parseInt(mm) + (parseInt(ss || "0") / 60);
  });
  const lineData = {
    labels: data.map((d) =>
      d.primerProceso?.numeroTransaccion ? `TX ${d.primerProceso.numeroTransaccion}` : `ID ${d.id}`
    ),
    datasets: [
      {
        label: "Tiempo Proceso (min)",
        data: times,
        fill: false,
        borderColor: type === "granel" ? "rgba(255, 155, 77, 1)" : "rgba(59, 79, 228, 1)",
        tension: 0.1,
      },
      {
        label: "Tiempo Objetivo (Promedio)",
        data: new Array(times.length).fill(targetTime),
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        borderDash: [5, 5],
        tension: 0.1,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: `Métricas de Eficiencia (${type.toUpperCase()})` },
      legend: { position: "bottom" as const },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Minutos" } },
      x: { title: { display: true, text: "Procesos" } },
    },
  };
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="relative h-72 w-full">
        <Line data={lineData} options={lineOptions} />
      </div>
    </div>
  );
}

function ParosChart({ data }: { data: any[]; }) {
  const distribution = getParosDistribution(data);
  const labels = Object.keys(distribution);
  const barData = {
    labels,
    datasets: [
      {
        label: "Total Minutos de Paro",
        data: labels.map((razon) => distribution[razon].totalMinutes),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Cantidad de Paros",
        data: labels.map((razon) => distribution[razon].count),
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: `Paros (total minutos y cantidad)` },
      legend: { position: "bottom" as const },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Valor" } },
      x: { title: { display: true, text: "Razón del Paro" } },
    },
  };
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="relative h-72 w-full">
        {labels.length > 0 ? (
          <Bar data={barData} options={barOptions} />
        ) : (
          <p className="text-center text-gray-500">No se registran paros en estos procesos.</p>
        )}
      </div>
    </div>
  );
}

function GlobalStatsChart({ stats }: { stats: { totalProcesses: number; delayedCount: number; }; }) {
  const dataGlobal = {
    labels: ["A Tiempo", "Retrasados"],
    datasets: [
      {
        data: [stats.totalProcesses - stats.delayedCount, stats.delayedCount],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  };
  const optionsGlobal = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: "Global: A Tiempo vs Retrasados" },
      legend: { position: "bottom" as const },
    },
  };
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="relative h-72 w-full">
        <Pie data={dataGlobal} options={optionsGlobal} />
      </div>
    </div>
  );
}

function StandardizationReport({ standardization }: { standardization: any; }) {
  if (!standardization) return <p className="text-gray-500">No hay datos de estandarización.</p>;
  return (
    <div className="space-y-4">
      {Object.entries(standardization).map(([group, avgTime]) => (
        <div key={group} className="bg-white p-4 rounded shadow-md">
          <h3 className="font-semibold mb-2">{group.toUpperCase()}</h3>
          <p className="text-sm text-gray-700">Tiempo Promedio: {String(avgTime)}</p>
        </div>
      ))}
    </div>
  );
}

function AggregatesReport({ aggregates }: { aggregates: Record<string, { count: number; avgTime: string }>; }) {
  if (!aggregates) return <p className="text-gray-500">No hay datos de agregados.</p>;
  return (
    <div className="space-y-4">
      {Object.entries(aggregates).map(([metodo, data]) => (
        <div key={metodo} className="bg-white p-4 rounded shadow-md">
          <h3 className="font-semibold mb-2">Método: {metodo}</h3>
          <p className="text-sm text-gray-700">Cantidad: {data.count}</p>
          <p className="text-sm text-gray-700">Tiempo Promedio: {data.avgTime}</p>
        </div>
      ))}
    </div>
  );
}

/* =========================
   DASHBOARD DE ANÁLISIS COMPLETO
   ========================= */

type ProcessData = {
  granel: any[];
  envasado: any[];
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProcessData>({ granel: [], envasado: [] });
  const [stats, setStats] = useState({
    granel: { avgTime: "00:00:00", avgMinutes: 0, totalProcesses: 0, delayedCount: 0, completedToday: 0 },
    envasado: { avgTime: "00:00:00", avgMinutes: 0, totalProcesses: 0, delayedCount: 0, completedToday: 0 },
  });
  const [standardization, setStandardization] = useState<any>(null);
  const [aggregates, setAggregates] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"granel" | "envasado">("granel");
  const [subTab, setSubTab] = useState<SubTabValue>("timeStats");
  const [isLive, setIsLive] = useState<boolean>(false);
  const [filters, setFilters] = useState<{ condicion: string; puntoDespacho: string; metodoCarga: string }>({
    condicion: "",
    puntoDespacho: "",
    metodoCarga: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analysis");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        const granelStats = computeStatsForType(json.data.granel);
        const envasadoStats = computeStatsForType(json.data.envasado);
        setStats({ granel: granelStats, envasado: envasadoStats });
        setStandardization(json.standardization);
        setAggregates(json.aggregates);
        Swal.fire({
          title: "Datos actualizados",
          text: `Granel: ${json.data.granel.length} registros. Envasado: ${json.data.envasado.length} registros.`,
          icon: "success",
        });
      } else {
        throw new Error(json.error);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        title: "Error al cargar datos",
        text: "No se pudieron cargar los datos. Intente nuevamente.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentData = data[activeTab];

  const uniqueCondiciones = Array.from(
    new Set(currentData.map((item) => item.primerProceso?.condicion).filter(Boolean))
  );
  const uniquePuntoDespachos = Array.from(
    new Set(currentData.map((item) => item.primerProceso?.puntoDespacho).filter(Boolean))
  );
  const uniqueMetodos = Array.from(
    new Set(currentData.map((item) => item.primerProceso?.metodoCarga).filter(Boolean))
  );

  const filteredData = currentData.filter((item) => {
    if (filters.condicion && item.primerProceso?.condicion !== filters.condicion) return false;
    if (filters.puntoDespacho && item.primerProceso?.puntoDespacho !== filters.puntoDespacho) return false;
    if (filters.metodoCarga && item.primerProceso?.metodoCarga !== filters.metodoCarga) return false;
    return true;
  });

  const filteredStats = computeStatsForType(filteredData);

  const toggleLiveUpdates = () => {
    if (isLive) {
      setIsLive(false);
      Swal.fire({
        title: "Actualizaciones en vivo desactivadas",
        text: "Los datos ya no se actualizarán automáticamente.",
        icon: "info",
      });
    } else {
      const interval = window.setInterval(fetchData, 30000);
      setIsLive(true);
      Swal.fire({
        title: "Actualizaciones en vivo activadas",
        text: "Los datos se actualizarán cada 30 segundos.",
        icon: "info",
      });
      return () => clearInterval(interval);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ENCABEZADO */}
      <div className="bg-orange-400 text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
              title="Volver"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Analisis de Tiempos</h1>
          </div>
          <div className="flex flex-wrap flex-row">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-sm transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refrescar
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filtros Mejorados */}
        <div className="bg-white p-4 rounded shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Condición</label>
            <select
              value={filters.condicion}
              onChange={(e) => setFilters({ ...filters, condicion: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Todos</option>
              {uniqueCondiciones.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Punto Despacho</label>
            <select
              value={filters.puntoDespacho}
              onChange={(e) => setFilters({ ...filters, puntoDespacho: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Todos</option>
              {uniquePuntoDespachos.map((pd) => (
                <option key={pd} value={pd}>
                  {pd}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Método de Carga</label>
            <select
              value={filters.metodoCarga}
              onChange={(e) => setFilters({ ...filters, metodoCarga: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Todos</option>
              {uniqueMetodos.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs principales */}
        <TabsList className="bg-white border shadow-sm mb-6">
          <TabsTrigger
            value="granel"
            activeTab={activeTab}
            onClick={setActiveTab}
            activeBg="bg-[#FF9B4D]"
            inactiveBg="bg-white"
            activeTextColor="text-white"
            inactiveTextColor="text-[#FF9B4D]"
          >
            Granel
          </TabsTrigger>
          <TabsTrigger
            value="envasado"
            activeTab={activeTab}
            onClick={setActiveTab}
            activeBg="bg-[#3B4FE4]"
            inactiveBg="bg-white"
            activeTextColor="text-white"
            inactiveTextColor="text-[#3B4FE4]"
          >
            Envasado
          </TabsTrigger>
        </TabsList>

        {/* Tarjetas de Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <AnimatePresence mode="sync">
            <motion.div key={`stat-1-${activeTab}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Card>
                <div className={`h-1 w-full ${activeTab === "granel" ? "bg-[#FF9B4D]" : "bg-[#3B4FE4]"}`} />
                <CardHeader>
                  <CardTitle>Tiempo Promedio</CardTitle>
                  <Clock className={`h-4 w-4 ${activeTab === "granel" ? "text-[#FF9B4D]" : "text-[#3B4FE4]"}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredStats.avgTime}</div>
                  <p className="text-xs text-gray-500">Basado en {filteredStats.totalProcesses} registros</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div key={`stat-2-${activeTab}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card>
                <div className={`h-1 w-full ${activeTab === "granel" ? "bg-[#FF9B4D]" : "bg-[#3B4FE4]"}`} />
                <CardHeader>
                  <CardTitle>Procesos Retrasados</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredStats.delayedCount}</div>
                  <p className="text-xs text-gray-500">
                    {filteredStats.totalProcesses > 0
                      ? `${((filteredStats.delayedCount / filteredStats.totalProcesses) * 100).toFixed(1)}% del total`
                      : "0%"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div key={`stat-3-${activeTab}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card>
                <div className={`h-1 w-full ${activeTab === "granel" ? "bg-[#FF9B4D]" : "bg-[#3B4FE4]"}`} />
                <CardHeader>
                  <CardTitle>Completados Hoy</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredStats.completedToday}</div>
                  <p className="text-xs text-gray-500">Procesos finalizados hoy</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div key={`stat-4-${activeTab}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <Card>
                <div className={`h-1 w-full ${activeTab === "granel" ? "bg-[#FF9B4D]" : "bg-[#3B4FE4]"}`} />
                <CardHeader>
                  <CardTitle>Eficiencia</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredStats.totalProcesses > 0
                      ? `${(((filteredStats.totalProcesses - filteredStats.delayedCount) / filteredStats.totalProcesses) * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                  <p className="text-xs text-gray-500">Procesos en tiempo esperado</p>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subpestañas para Gráficos y Reportes */}
        <SubTabsList>
          <SubTabTrigger label="Estadísticas" value="timeStats" activeSubTab={subTab} onClick={setSubTab} />
          <SubTabTrigger label="Distribución" value="distribution" activeSubTab={subTab} onClick={setSubTab} />
          <SubTabTrigger label="Eficiencia" value="efficiency" activeSubTab={subTab} onClick={setSubTab} />
          <SubTabTrigger label="Global" value="global" activeSubTab={subTab} onClick={setSubTab} />
          {activeTab !== "envasado" && (
            <SubTabTrigger label="Estándares" value="standards" activeSubTab={subTab} onClick={setSubTab} />
          )}
          <SubTabTrigger label="Agregados" value="aggregates" activeSubTab={subTab} onClick={setSubTab} />
          {activeTab === "envasado" && (
            <SubTabTrigger label="Paros" value="paros" activeSubTab={subTab} onClick={setSubTab} />
          )}
        </SubTabsList>

        {/* Contenido de las Subpestañas */}
        <div className="mb-6 space-y-4">
          {subTab === "timeStats" && <TimeStandardsReport data={filteredData} type={activeTab} />}
          {subTab === "distribution" && <ProcessTimeDistribution data={filteredData} type={activeTab} />}
          {subTab === "efficiency" && <ProcessEfficiencyMetrics data={filteredData} type={activeTab} targetTime={filteredStats.avgMinutes || 0} />}
          {subTab === "global" && <GlobalStatsChart stats={filteredStats} />}
          {subTab === "standards" && activeTab === "granel" && (
            <StandardizationReport standardization={standardization?.granel} />
          )}
          {subTab === "aggregates" && <AggregatesReport aggregates={aggregates[activeTab]} />}
          {subTab === "paros" && activeTab === "envasado" && <ParosChart data={filteredData} />}
        </div>
      </div>
      <Footer />
    </div>
  );
}
