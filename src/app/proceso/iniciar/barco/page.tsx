"use client";
import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";

// Importar react-select de forma dinámica para evitar problemas de SSR/hidratación
const Select = dynamic(() => import("react-select"), { ssr: false });

// Definición del tipo de opción para react-select
interface OptionType {
  value: string;
  label: string;
}

/** Estructura para una operación en la tabla */
type Operacion = {
  bodega: string;
  inicio: string;
  final: string;
  minutos: string;
  actividad: string;
};

/** Datos del Barco */
/* Se agrega el campo opcional id para identificar el barco al actualizar */
type BarcoData = {
  id?: number;
  bValue: string;           // Muelle (no editable)
  valorMuelle: string;      // Vapor/Barco (editable para cambiar de barco)
  arriboFecha: string;
  arriboHora: string;
  atraqueFecha: string;
  atraqueHora: string;
  recibidoFecha: string;
  recibidoHora: string;
  inicioOperacionesFecha: string;
  inicioOperacionesHora: string;
  finOperacionesFecha: string;
  finOperacionesHora: string;
  tipoCarga: string[];      // No editable
  sistemaUtilizado: string[];
};

/** Datos de la Bitácora */
type BitacoraData = {
  fechaInicio: string;
  fecha: string;
  nombreMuellero: string;
  turnoInicio: string;
  turnoFin: string;
  operaciones: Operacion[];
  observaciones: string;
};

/** Formulario completo */
export type FormDataType = {
  barco: BarcoData;
  bitacora: BitacoraData;
};

const bodegaOptions: OptionType[] = [
  { value: "Bodega 1", label: "Bodega 1" },
  { value: "Bodega 2", label: "Bodega 2" },
  { value: "Bodega 3", label: "Bodega 3" },
  { value: "Bodega 4", label: "Bodega 4" },
  { value: "Bodega 5", label: "Bodega 5" },
];

const validOptions: OptionType[] = [
  { value: "Acumulando producto en bodegas", label: "Acumulando producto en bodegas" },
  { value: "Apertura de bodega", label: "Apertura de bodega" },
  { value: "Amenaza de lluvia", label: "Amenaza de lluvia" },
  { value: "Cierre de bodega", label: "Cierre de bodega" },
  { value: "Colocando almeja", label: "Colocando almeja" },
  { value: "Colocando equipo a bordo", label: "Colocando equipo a bordo" },
  { value: "Desperfecto de equipo", label: "Desperfecto de equipo" },
  { value: "Desperfecto de grúa de buque", label: "Desperfecto de grúa de buque" },
  { value: "Esperando instrucciones", label: "Esperando instrucciones" },
  { value: "Esperando instrucciones cepa", label: "Esperando instrucciones cepa" },
  { value: "Esperando material", label: "Esperando material" },
  { value: "Falla en bascula", label: "Falla en bascula" },
  { value: "Falla en el sistema", label: "Falla en el sistema" },
  { value: "Falta de camiones (camiones asignados por transporte insuficientes)", label: "Falta de camiones (camiones asignados por transporte insuficientes)" },
  { value: "Falta de tolveros", label: "Falta de tolveros" },
  { value: "Haciendo prueba de sistema", label: "Haciendo prueba de sistema" },
  { value: "Limpieza de tolva", label: "Limpieza de tolva" },
  { value: "Lluvia", label: "Lluvia" },
  { value: "Maniobras por marineros", label: "Maniobras por marineros" },
  { value: "Movilizando tolva", label: "Movilizando tolva" },
  { value: "Quitando almeja", label: "Quitando almeja" },
  { value: "Quitando alambres", label: "Quitando alambres" },
  { value: "Sacando equipo a bordo", label: "Sacando equipo a bordo" },
  { value: "Tiempo de comida", label: "Tiempo de comida" }
];

function getFechaInicio() {
  const now = new Date();
  return now.toLocaleString("en-CA", {
    timeZone: "America/El_Salvador",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getFecha() {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: "America/El_Salvador" });
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 3600 + parts[1] * 60;
  }
  return 0;
}

function calcularDuracion(inicio: string, final: string): string {
  const startSeconds = parseTimeToSeconds(inicio);
  const endSeconds = parseTimeToSeconds(final);
  if (startSeconds && endSeconds && endSeconds >= startSeconds) {
    const diffSeconds = endSeconds - startSeconds;
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return "00:00:00";
}

function actualizarDuracion(operacion: Operacion): Operacion {
  return {
    ...operacion,
    minutos: calcularDuracion(operacion.inicio, operacion.final),
  };
}

/** Tipo para manejar cada pestaña (barco) */
type Tab = {
  id: number;
  label: string;
  formData: FormDataType;
};

const initialFormData: FormDataType = {
  barco: {
    bValue: "",
    valorMuelle: "",
    arriboFecha: "",
    arriboHora: "",
    atraqueFecha: "",
    atraqueHora: "",
    recibidoFecha: "",
    recibidoHora: "",
    inicioOperacionesFecha: "",
    inicioOperacionesHora: "",
    finOperacionesFecha: "",
    finOperacionesHora: "",
    tipoCarga: [],
    sistemaUtilizado: [],
  },
  bitacora: {
    fechaInicio: getFechaInicio(),
    fecha: getFecha(),
    nombreMuellero: "",
    turnoInicio: "",
    turnoFin: "",
    operaciones: [],
    observaciones: "",
  },
};

export default function Bitacora() {
  const router = useRouter();

  // Estados para manejar las pestañas
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [userNameLoaded, setUserNameLoaded] = useState(false);

  // Estado para la lista de barcos proveniente de la API
  const [barcosList, setBarcosList] = useState<any[]>([]);

  // Cargar pestañas desde localStorage al montar
  useEffect(() => {
    const storedTabs = localStorage.getItem("tabsList");
    if (storedTabs) {
      const parsedTabs: Tab[] = JSON.parse(storedTabs);
      if (parsedTabs.length > 0) {
        setTabs(parsedTabs);
        setActiveTab(parsedTabs[0].id);
      } else {
        const initialTab: Tab = { id: 1, label: "Barco 1", formData: { ...initialFormData } };
        setTabs([initialTab]);
        setActiveTab(1);
        localStorage.setItem("tabsList", JSON.stringify([initialTab]));
        localStorage.setItem("barcoData_1", JSON.stringify(initialTab.formData.barco));
        localStorage.setItem("bitacoraData_1", JSON.stringify(initialTab.formData.bitacora));
      }
    } else {
      const initialTab: Tab = { id: 1, label: "Barco 1", formData: { ...initialFormData } };
      setTabs([initialTab]);
      setActiveTab(1);
      localStorage.setItem("tabsList", JSON.stringify([initialTab]));
      localStorage.setItem("barcoData_1", JSON.stringify(initialTab.formData.barco));
      localStorage.setItem("bitacoraData_1", JSON.stringify(initialTab.formData.bitacora));
    }
  }, []);

  // Guarda la lista de pestañas en localStorage cada vez que cambie "tabs"
  useEffect(() => {
    localStorage.setItem("tabsList", JSON.stringify(tabs));
  }, [tabs]);

  // Obtiene el formData de la pestaña activa
  const activeFormData = tabs.find((tab) => tab.id === activeTab)?.formData;

  // Funciones para actualizar datos de cada sección
  const updateBarcoData = (newBarco: BarcoData) => {
    if (!activeFormData) return;
    const updated = { ...activeFormData, barco: newBarco };
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab ? { ...tab, formData: updated } : tab
      )
    );
    localStorage.setItem(`barcoData_${activeTab}`, JSON.stringify(newBarco));
  };

  const updateBitacoraData = (newBitacora: BitacoraData) => {
    if (!activeFormData) return;
    const updated = { ...activeFormData, bitacora: newBitacora };
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab ? { ...tab, formData: updated } : tab
      )
    );
    localStorage.setItem(`bitacoraData_${activeTab}`, JSON.stringify(newBitacora));
  };

  // Al cambiar de pestaña, carga los datos almacenados en las claves separadas
  useEffect(() => {
    const storedBarco = localStorage.getItem(`barcoData_${activeTab}`);
    const storedBitacora = localStorage.getItem(`bitacoraData_${activeTab}`);
    if (storedBarco && activeFormData) {
      const parsedBarco = JSON.parse(storedBarco);
      updateBarcoData({ ...activeFormData.barco, ...parsedBarco });
    }
    if (storedBitacora && activeFormData) {
      const parsedBitacora = JSON.parse(storedBitacora);
      updateBitacoraData({ ...activeFormData.bitacora, ...parsedBitacora });
    }
    // Para el primer tab, precarga el nombre del muellero desde "userNameAll"
    if (activeTab === 1 && activeFormData) {
      const muellero = localStorage.getItem("userNameAll");
      if (muellero && activeFormData.bitacora.nombreMuellero !== muellero) {
        updateBitacoraData({ ...activeFormData.bitacora, nombreMuellero: muellero });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Precargar las horas de turno al agregar un nuevo barco, tomando los datos del tab activo
  useEffect(() => {
    if (activeFormData) {
      const currentTurnoInicio = activeFormData.bitacora.turnoInicio;
      const currentTurnoFin = activeFormData.bitacora.turnoFin;
      localStorage.setItem("turnoInicio", currentTurnoInicio);
      localStorage.setItem("turnoFin", currentTurnoFin);
    }
  }, [activeFormData]);

  useEffect(() => {
    if (!userNameLoaded && tabs.length > 0) {
      const muellero = localStorage.getItem("userNameAll");
      if (muellero && tabs[0].formData.bitacora.nombreMuellero === "") {
        const updatedTabs = tabs.map((tab) =>
          tab.id === 1
            ? {
                ...tab,
                formData: {
                  ...tab.formData,
                  bitacora: { ...tab.formData.bitacora, nombreMuellero: muellero },
                },
              }
            : tab
        );
        setTabs(updatedTabs);
        localStorage.setItem("bitacoraData_1", JSON.stringify(updatedTabs[0].formData.bitacora));
      }
      setUserNameLoaded(true);
    }
  }, [tabs, userNameLoaded]);

  // UseEffect para obtener la lista de barcos desde /api/barcos
  useEffect(() => {
    const fetchBarcosList = async () => {
      try {
        const res = await fetch("/api/barcos");
        const data = await res.json();
        setBarcosList(data.data || []);
      } catch (error) {
        console.error("Error fetching barcos", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo obtener la lista de barcos",
        });
      }
    };
    fetchBarcosList();
  }, []);

  // Función para obtener información actualizada de un barco desde la API (GET /api/barcos/[id])
  const fetchBarcoInfo = async (id: number): Promise<BarcoData | null> => {
    try {
      const res = await fetch(`/api/barcos/${id}`);
      if (!res.ok) throw new Error("Error al obtener barco");
      const data = await res.json();
      return {
        id: data.id,
        bValue: data.muelle,
        valorMuelle: data.vaporBarco,
        arriboFecha: data.fechaArribo,
        arriboHora: data.horaArribo,
        atraqueFecha: data.fechaAtraque,
        atraqueHora: data.horaAtraque,
        recibidoFecha: data.fechaRecibido,
        recibidoHora: data.horaRecibido,
        inicioOperacionesFecha: data.fechaInicioOperaciones,
        inicioOperacionesHora: data.horaInicioOperaciones,
        finOperacionesFecha: data.fechaFinOperaciones,
        finOperacionesHora: data.horaFinOperaciones,
        tipoCarga: JSON.parse(data.tipoCarga),
        sistemaUtilizado: JSON.parse(data.sistemaUtilizado),
      };
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la información actualizada del barco",
      });
      return null;
    }
  };

  // Función para actualizar la información del Barco mediante PUT a /api/barcos/[id]
  // Luego se vuelve a consultar la API para obtener la información actualizada
  const handleActualizarBarco = async () => {
    if (activeFormData && activeFormData.barco.id) {
      const body = {
        muelle: activeFormData.barco.bValue,
        vaporBarco: activeFormData.barco.valorMuelle,
        fechaArribo: activeFormData.barco.arriboFecha,
        horaArribo: activeFormData.barco.arriboHora,
        fechaAtraque: activeFormData.barco.atraqueFecha,
        horaAtraque: activeFormData.barco.atraqueHora,
        fechaRecibido: activeFormData.barco.recibidoFecha,
        horaRecibido: activeFormData.barco.recibidoHora,
        fechaInicioOperaciones: activeFormData.barco.inicioOperacionesFecha,
        horaInicioOperaciones: activeFormData.barco.inicioOperacionesHora,
        fechaFinOperaciones: activeFormData.barco.finOperacionesFecha,
        horaFinOperaciones: activeFormData.barco.finOperacionesHora,
        tipoCarga: activeFormData.barco.tipoCarga,
        sistemaUtilizado: activeFormData.barco.sistemaUtilizado,
      };
      Swal.fire({
        title: "Actualizar información del barco",
        text: "¿Desea actualizar la información del barco?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, actualizar",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Mostrar alerta de "Enviando datos..."
          Swal.fire({
            title: "Enviando datos...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
          try {
            const res = await fetch(`/api/barcos/${activeFormData.barco.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Error al actualizar barco");
            // Luego de PUT, consultamos la API para obtener la información actualizada
            if (!activeFormData.barco.id) return;
            const updatedInfo = await fetchBarcoInfo(activeFormData.barco.id);
            if (updatedInfo) {
              updateBarcoData(updatedInfo);
              Swal.close();
              Swal.fire({
                icon: "success",
                title: "Información del barco actualizada",
                showConfirmButton: false,
                timer: 1200,
              });
            }
          } catch (error: any) {
            console.error(error);
            Swal.close();
            Swal.fire({
              icon: "error",
              title: "Error",
              text: error.message || "Error al actualizar barco",
            });
          }
        }
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "Barco no seleccionado",
        text: "Debe seleccionar un barco para actualizar",
      });
    }
  };

  // Estados para la sección de operaciones (Bitácora)
  const [isOther, setIsOther] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newOperacion, setNewOperacion] = useState<Operacion>({
    bodega: "",
    inicio: "",
    final: "",
    minutos: "",
    actividad: "",
  });
  const [customActividad, setCustomActividad] = useState("");

  // Efecto para cargar del localStorage la información de la nueva operación por pestaña
  useEffect(() => {
    const key = `newOperacion_${activeTab}`;
    const storedNewOperacion = localStorage.getItem(key);
    const defaultOperacion: Operacion = {
      bodega: "",
      inicio: "",
      final: "",
      minutos: "",
      actividad: "",
    };
    if (storedNewOperacion) {
      try {
        const parsed = JSON.parse(storedNewOperacion);
        // Fusionamos con los valores por defecto para asegurarnos que todos los campos existan
        setNewOperacion({ ...defaultOperacion, ...parsed });
      } catch (error) {
        console.error("Error parsing stored newOperacion:", error);
      }
    } else {
      setNewOperacion(defaultOperacion);
    }
  }, [activeTab]);

  // *Efecto para almacenar en localStorage la información de bodega, inicio, final y actividad de cada pestaña*
  useEffect(() => {
    const key = `newOperacion_${activeTab}`;
    const dataToStore = {
      bodega: newOperacion.bodega,
      inicio: newOperacion.inicio,
      final: newOperacion.final,
      minutos: newOperacion.minutos,
      actividad: newOperacion.actividad,
    };
    localStorage.setItem(key, JSON.stringify(dataToStore));
  }, [newOperacion.bodega, newOperacion.inicio, newOperacion.final, newOperacion.minutos, newOperacion.actividad, activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!activeFormData) return;
    if (
      [
        "bValue",
        "valorMuelle",
        "arriboFecha",
        "arriboHora",
        "atraqueFecha",
        "atraqueHora",
        "recibidoFecha",
        "recibidoHora",
        "inicioOperacionesFecha",
        "inicioOperacionesHora",
        "finOperacionesFecha",
        "finOperacionesHora",
        "tipoCarga",
        "sistemaUtilizado",
      ].includes(name)
    ) {
      updateBarcoData({ ...activeFormData.barco, [name]: value });
    } else {
      updateBitacoraData({ ...activeFormData.bitacora, [name]: value });
    }
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    groupKey: "tipoCarga" | "sistemaUtilizado"
  ) => {
    const { value, checked } = e.target;
    if (!activeFormData) return;
    const current = activeFormData.barco[groupKey];
    updateBarcoData({
      ...activeFormData.barco,
      [groupKey]: checked ? [...current, value] : current.filter((item) => item !== value),
    });
  };

  const handleOperacionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewOperacion((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "inicio" || name === "final") {
        updated = actualizarDuracion(updated);
      }
      return updated;
    });
  };

  const handleSelectActividadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "otro") {
      setIsOther(true);
      setCustomActividad("");
      setNewOperacion((prev) => ({ ...prev, actividad: "" }));
    } else {
      setIsOther(false);
      setNewOperacion((prev) => ({ ...prev, actividad: value }));
    }
  };

  const resetNewOperacion = () => {
    setNewOperacion({
      bodega: "",
      inicio: "",
      final: "",
      minutos: "",
      actividad: "",
    });
    setIsOther(false);
    setCustomActividad("");
    localStorage.removeItem(`newOperacion_${activeTab}`);
  };

  const deleteOperacion = (index: number) => {
    Swal.fire({
      title: "¿Eliminar actividad?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    }).then((result) => {
      if (result.isConfirmed && activeFormData) {
        updateBitacoraData({
          ...activeFormData.bitacora,
          operaciones: activeFormData.bitacora.operaciones.filter((_, i) => i !== index),
        });
        Swal.fire({
          icon: "success",
          title: "Actividad eliminada",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    });
  };

  const addOrUpdateOperacion = () => {
    if (!newOperacion.inicio) {
      Swal.fire({
        icon: "error",
        title: "Falta INICIO",
        text: "Debe completar el campo INICIO.",
      });
      return;
    }
    if (!newOperacion.final) {
      Swal.fire({
        icon: "error",
        title: "Falta FINAL",
        text: "Debe completar el campo FINAL.",
      });
      return;
    }
    if (parseTimeToSeconds(newOperacion.final) < parseTimeToSeconds(newOperacion.inicio)) {
      Swal.fire({
        icon: "error",
        title: "Hora final inválida",
        text: "La hora final no puede ser menor que la hora de inicio.",
      });
      return;
    }
    if (!newOperacion.actividad) {
      Swal.fire({
        icon: "error",
        title: "Falta ACTIVIDAD",
        text: "Debe seleccionar o especificar una ACTIVIDAD.",
      });
      return;
    }
    if (
      activeFormData &&
      activeFormData.bitacora.operaciones.some((op, index) => {
        if (editingIndex !== null && index === editingIndex) return false;
        return op.inicio === newOperacion.inicio && op.actividad === newOperacion.actividad;
      })
    ) {
      Swal.fire({
        icon: "error",
        title: "Actividad duplicada",
        text: "Esta actividad ya fue agregada.",
      });
      return;
    }
    if (activeFormData) {
      if (editingIndex !== null) {
        const updatedOperaciones = [...activeFormData.bitacora.operaciones];
        updatedOperaciones[editingIndex] = newOperacion;
        updateBitacoraData({ ...activeFormData.bitacora, operaciones: updatedOperaciones });
        Swal.fire({
          icon: "success",
          title: "Actividad actualizada",
          showConfirmButton: false,
          timer: 1200,
        });
        setEditingIndex(null);
      } else {
        updateBitacoraData({ ...activeFormData.bitacora, operaciones: [...activeFormData.bitacora.operaciones, newOperacion] });
        Swal.fire({
          icon: "success",
          title: "Actividad agregada",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    }
    resetNewOperacion();
  };

  const handleEditOperacion = (index: number) => {
    if (activeFormData) {
      const operacion = activeFormData.bitacora.operaciones[index];
      if (!validOptions.some(option => option.value === operacion.actividad)) {
        setIsOther(true);
        setCustomActividad(operacion.actividad);
      } else {
        setIsOther(false);
        setCustomActividad("");
      }
      setNewOperacion(operacion);
      setEditingIndex(index);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "¿Está seguro de cancelar?",
      text: "Se borrarán los datos del formulario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "No, volver",
    }).then((result) => {
      if (result.isConfirmed) {
        tabs.forEach((tab) => {
          localStorage.removeItem(`barcoData_${tab.id}`);
          localStorage.removeItem(`bitacoraData_${tab.id}`);
          localStorage.removeItem(`newOperacion_${tab.id}`);
        });
        localStorage.removeItem("tabsList");
        localStorage.removeItem("turnoInicio");
        localStorage.removeItem("turnoFin");
        router.push("/proceso/iniciar");
      }
    });
  };

  const handleEndTurn = async () => {
    // Preguntar al usuario si desea finalizar el turno
    const confirmResult = await Swal.fire({
      icon: "question",
      title: "¿Desea terminar el turno?",
      text: "Una vez finalizado, no podrá realizar cambios.",
      showCancelButton: true,
      confirmButtonText: "Sí, terminar",
      cancelButtonText: "Cancelar",
    });
  
    if (!confirmResult.isConfirmed) {
      return;
    }
  
    // Verifica que en cada pestaña se haya seleccionado un barco (barco.id debe existir)
    const tabSinBarco = tabs.find((tab) => !tab.formData.barco.id);
    if (tabSinBarco) {
      Swal.fire({
        icon: "warning",
        title: "Falta Barco",
        text: `Debe seleccionar un barco para ${tabSinBarco.label}`,
      });
      return;
    }
  
    // Verifica que en cada pestaña se hayan agregado operaciones
    const tabSinOperaciones = tabs.find(
      (tab) =>
        !tab.formData.bitacora.operaciones ||
        tab.formData.bitacora.operaciones.length === 0
    );
    if (tabSinOperaciones) {
      Swal.fire({
        icon: "warning",
        title: "Falta Actividades",
        text: `Debe agregar al menos una actividad en ${tabSinOperaciones.label}`,
      });
      return;
    }
  
    // Verifica que se haya ingresado el turno (turnoInicio y turnoFin) en cada pestaña
    const tabSinTurno = tabs.find(
      (tab) =>
        !tab.formData.bitacora.turnoInicio ||
        !tab.formData.bitacora.turnoFin ||
        tab.formData.bitacora.turnoInicio.trim() === "" ||
        tab.formData.bitacora.turnoFin.trim() === ""
    );
    if (tabSinTurno) {
      const { value: turno } = await Swal.fire({
        title: `Ingrese el turno para ${tabSinTurno.label}`,
        text: "Formato: HH:MM - HH:MM (Ejemplo: 06:00 - 14:00)",
        input: "text",
        inputPlaceholder: "06:00 - 14:00",
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value || !value.includes("-")) {
            return "Debe ingresar el turno en el formato correcto.";
          }
        },
      });
  
      if (!turno) {
        return; // Se cancela el proceso
      } else {
        const [inicio, fin] = turno.split("-").map((s) => s.trim());
        // Asignamos el turno ingresado a la bitácora de la pestaña faltante
        tabSinTurno.formData.bitacora.turnoInicio = inicio;
        tabSinTurno.formData.bitacora.turnoFin = fin;
      }
    }
  
    // Capturamos la fecha y hora actuales para la finalización del turno
    const now = new Date();
    const fechaCierre = now.toLocaleString("en-CA", {
      timeZone: "America/El_Salvador",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  
    // Mostrar alerta de "Enviando datos..."
    Swal.fire({
      title: "Procesando solicitud...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    try {
      // Recorremos cada pestaña (cada bitácora)
      for (const tab of tabs) {
        const { bitacora, barco } = tab.formData;
  
        // Preparamos los datos a enviar. Se asocia la bitácora al barco mediante su id
        const requestData = {
          fechaInicio: bitacora.fechaInicio,
          fecha: bitacora.fecha,
          fechaCierre, // Agregamos la fecha y hora de finalización del turno
          nombreMuellero: bitacora.nombreMuellero,
          turnoInicio: bitacora.turnoInicio,
          turnoFin: bitacora.turnoFin,
          observaciones: bitacora.observaciones,
          barcoId: barco.id, // Se envía el id del barco
          operaciones: bitacora.operaciones, // Arreglo de operaciones
        };

        console.log(requestData);

        const res = await fetch("/api/bitacoras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!res.ok) {
          throw new Error(`Error al guardar la bitácora para ${tab.label}`);
        }
      }
  
      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Turno finalizado y bitácoras guardadas",
        showConfirmButton: false,
        timer: 1500,
      });
  
      tabs.forEach((tab) => {
        localStorage.removeItem(`barcoData_${tab.id}`);
        localStorage.removeItem(`bitacoraData_${tab.id}`);
        localStorage.removeItem(`newOperacion_${tab.id}`);
      });
      localStorage.removeItem("tabsList");
      localStorage.removeItem("turnoInicio");
      localStorage.removeItem("turnoFin");
  
      // Redirige a la ruta deseada o limpia los datos
      router.push("/proceso/iniciar");
    } catch (error: any) {
      console.error(error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error al guardar bitácoras",
        text: error.message,
      });
    }
  };

  const addTab = () => {
    const newId = tabs.length ? Math.max(...tabs.map((t) => t.id)) + 1 : 1;
    const currentTurnoInicio = activeFormData ? activeFormData.bitacora.turnoInicio : "";
    const currentTurnoFin = activeFormData ? activeFormData.bitacora.turnoFin : "";
    const storedMuellero = localStorage.getItem("userNameAll") || "";
    const newTab: Tab = {
      id: newId,
      label: `Barco ${newId}`,
      formData: {
        barco: {
          ...initialFormData.barco,
          bValue: "",
          valorMuelle: "",
          arriboFecha: "",
          arriboHora: "",
          atraqueFecha: "",
          atraqueHora: "",
          recibidoFecha: "",
          recibidoHora: "",
          inicioOperacionesFecha: "",
          inicioOperacionesHora: "",
          finOperacionesFecha: "",
          finOperacionesHora: "",
          tipoCarga: [],
          sistemaUtilizado: [],
        },
        bitacora: {
          ...initialFormData.bitacora,
          nombreMuellero: storedMuellero,
          turnoInicio: currentTurnoInicio,
          turnoFin: currentTurnoFin,
        },
      },
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
    localStorage.setItem(`barcoData_${newId}`, JSON.stringify(newTab.formData.barco));
    localStorage.setItem(`bitacoraData_${newId}`, JSON.stringify(newTab.formData.bitacora));
  };

  const deleteTab = (id: number) => {
    if (tabs.length === 1) return;
    Swal.fire({
      title: "¿Eliminar pestaña?",
      text: "¿Estás seguro de eliminar esta pestaña?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem(`barcoData_${id}`);
        localStorage.removeItem(`bitacoraData_${id}`);
        const filtered = tabs.filter((tab) => tab.id !== id);
        setTabs(filtered);
        if (activeTab === id && filtered.length > 0) {
          setActiveTab(filtered[0].id);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Encabezado: Logo y Título */}
      <header className="bg-[#003E9B] px-4 md:px-40 py-4 text-white flex flex-col items-center">
        <img src="/logo.png" alt="ALMAPAC" className="h-16 object-contain mb-2" />
        <h1 className="text-2xl font-bold uppercase text-center">
          Bitácora de Operaciones en Muelle y Abordo
        </h1>
      </header>

      {/* Sección: Información del Barco */}
      <section className="max-w-5xl mx-auto bg-white shadow-md mt-4 p-4 mb-4 rounded-md">
        <h2 className="text-xl font-bold mb-4">Barco</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-1">MUELLE</label>
            <input
              type="text"
              name="bValue"
              value={activeFormData?.barco.bValue || ""}
              onChange={handleChange}
              placeholder="B-4"
              className="w-full h-9 border border-gray-300 rounded-md px-2 py-1 text-black"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">VAPOR/BARCO</label>
            <select
              name="valorMuelle"
              value={activeFormData?.barco.valorMuelle || ""}
              onChange={(e) => {
                const selectedValue = e.target.value;
                const selectedBoat = barcosList.find((b) => b.vaporBarco === selectedValue);
                if (selectedBoat) {
                  // Se consulta la API para obtener la información actualizada del barco seleccionado
                  fetch(`/api/barcos/${selectedBoat.id}`)
                    .then((res) => res.json())
                    .then((data) => {
                      // Actualizamos la información con la respuesta de la API
                      updateBarcoData({
                        id: data.id,
                        bValue: data.muelle,
                        valorMuelle: data.vaporBarco,
                        arriboFecha: data.fechaArribo,
                        arriboHora: data.horaArribo,
                        atraqueFecha: data.fechaAtraque,
                        atraqueHora: data.horaAtraque,
                        recibidoFecha: data.fechaRecibido,
                        recibidoHora: data.horaRecibido,
                        inicioOperacionesFecha: data.fechaInicioOperaciones,
                        inicioOperacionesHora: data.horaInicioOperaciones,
                        finOperacionesFecha: data.fechaFinOperaciones,
                        finOperacionesHora: data.horaFinOperaciones,
                        tipoCarga: JSON.parse(data.tipoCarga),
                        sistemaUtilizado: JSON.parse(data.sistemaUtilizado),
                      });
                      Swal.fire({
                        icon: "success",
                        title: "Barco cargado",
                        showConfirmButton: false,
                        timer: 1200,
                      });
                    })
                    .catch((err) => {
                      console.error(err);
                      Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "No se pudo obtener la información actualizada del barco",
                      });
                    });
                }
              }}
              className="w-full h-9 border border-gray-300 rounded-md px-2 py-1 text-black"
            >
              <option value="">Seleccione Vapor/Barco</option>
              {barcosList.map((boat) => (
                <option key={boat.id} value={boat.vaporBarco}>
                  {boat.vaporBarco}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Tarjetas: Tipo de Carga y Sistema Utilizado */}
        <div className="sm:col-span-2 mb-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border rounded-md">
              <div className="bg-gray-200 text-center py-2">
                <h3 className="text-sm font-semibold uppercase text-gray-700">
                  TIPO DE CARGA
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {["CEREALES", "AZÚCAR CRUDA", "CARBÓN", "MELAZA", "GRASA AMARILLA", "YESO"].map((tipo) => (
                    <label key={tipo} className="inline-flex items-center space-x-1">
                      <input
                        type="checkbox"
                        value={tipo}
                        checked={activeFormData?.barco.tipoCarga.includes(tipo) || false}
                        onChange={(e) => handleCheckboxChange(e, "tipoCarga")}
                        className="h-4 w-4"
                        disabled
                      />
                      <span className="text-xs whitespace-nowrap">{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="border rounded-md">
              <div className="bg-gray-200 text-center py-2">
                <h3 className="text-sm font-semibold uppercase text-gray-700">
                  SISTEMA UTILIZADO
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {["UNIDAD DE CARGA", "SUCCIONADORA", "ALMEJA", "CHINGUILLOS", "EQUIPO BULHER", "ALAMBRE"].map((sistema) => (
                    <label key={sistema} className="inline-flex items-center space-x-1">
                      <input
                        type="checkbox"
                        value={sistema}
                        checked={activeFormData?.barco.sistemaUtilizado.includes(sistema) || false}
                        onChange={(e) => handleCheckboxChange(e, "sistemaUtilizado")}
                        className="h-4 w-4"
                      />
                      <span className="text-xs whitespace-nowrap">{sistema}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Campos de fechas y horas del Barco */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* ARRIBO */}
          <div className="border rounded-md p-4">
            <label className="block text-base font-semibold mb-2 uppercase">
              ARRIBO
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha Arribo</label>
                <input
                  type="date"
                  name="arriboFecha"
                  value={activeFormData?.barco.arriboFecha || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Hora Arribo</label>
                <input
                  type="time"
                  name="arriboHora"
                  value={activeFormData?.barco.arriboHora || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* ATRAQUE */}
          <div className="border rounded-md p-4">
            <label className="block text-base font-semibold mb-2 uppercase">
              ATRAQUE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha Atraque</label>
                <input
                  type="date"
                  name="atraqueFecha"
                  value={activeFormData?.barco.atraqueFecha || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Hora Atraque</label>
                <input
                  type="time"
                  name="atraqueHora"
                  value={activeFormData?.barco.atraqueHora || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* RECIBIDO */}
          <div className="border rounded-md p-4">
            <label className="block text-base font-semibold mb-2 uppercase">
              RECIBIDO
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha Recibido</label>
                <input
                  type="date"
                  name="recibidoFecha"
                  value={activeFormData?.barco.recibidoFecha || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Hora Recibido</label>
                <input
                  type="time"
                  name="recibidoHora"
                  value={activeFormData?.barco.recibidoHora || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* INICIO OPERACIONES */}
          <div className="border rounded-md p-4">
            <label className="block text-base font-semibold mb-2 uppercase">
              INICIO OPERACIONES
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  name="inicioOperacionesFecha"
                  value={activeFormData?.barco.inicioOperacionesFecha || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Hora Inicio</label>
                <input
                  type="time"
                  name="inicioOperacionesHora"
                  value={activeFormData?.barco.inicioOperacionesHora || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* FIN OPERACIONES */}
          <div className="border rounded-md p-4">
            <label className="block text-base font-semibold mb-2 uppercase">
              FIN OPERACIONES
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha Fin</label>
                <input
                  type="date"
                  name="finOperacionesFecha"
                  value={activeFormData?.barco.finOperacionesFecha || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Hora Fin</label>
                <input
                  type="time"
                  name="finOperacionesHora"
                  value={activeFormData?.barco.finOperacionesHora || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-2 py-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleActualizarBarco}
            className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-md hover:bg-blue-50"
          >
            Actualizar
          </button>
        </div>
      </section>

      {/* Sección: Bitácoras de Operaciones */}
      <section className="max-w-5xl mx-auto bg-white shadow-md mt-4 p-4 mb-4 rounded-md">
        <h2 className="text-xl font-bold mb-4">Bitácoras</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase">
              FECHA
            </label>
            <input
              type="date"
              name="fecha"
              value={activeFormData?.bitacora.fecha || ""}
              onChange={(e) =>
                updateBitacoraData({ ...activeFormData!.bitacora, fecha: e.target.value })
              }
              className="w-full h-9 border border-gray-300 rounded-md px-2 py-1 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase">
              Nombre del Muellero
            </label>
            <input
              type="text"
              name="nombreMuellero"
              value={activeFormData?.bitacora.nombreMuellero || ""}
              onChange={(e) =>
                updateBitacoraData({ ...activeFormData!.bitacora, nombreMuellero: e.target.value })
              }
              placeholder="Ej: Juan Pérez"
              className="w-full border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase">
              Turno de
            </label>
            <input
              type="time"
              name="turnoInicio"
              value={activeFormData?.bitacora.turnoInicio || ""}
              onChange={(e) =>
                updateBitacoraData({ ...activeFormData!.bitacora, turnoInicio: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase">
              a
            </label>
            <input
              type="time"
              name="turnoFin"
              value={activeFormData?.bitacora.turnoFin || ""}
              onChange={(e) =>
                updateBitacoraData({ ...activeFormData!.bitacora, turnoFin: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
        </div>

        {/* Sección: Nueva Operación */}
        <section className="mb-6 border rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2 uppercase">Nueva Operación</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold">BODEGA</label>
              <Select
                className="react-select-container"
                classNamePrefix="react-select"
                options={bodegaOptions}
                placeholder="-- Seleccione Bodega --"
                value={bodegaOptions.find((opt) => opt.value === newOperacion.bodega) || null}
                onChange={(option: OptionType | null) =>
                  setNewOperacion((prev) => ({ ...prev, bodega: option ? option.value : "" }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Inicio</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  name="inicio"
                  value={newOperacion.inicio}
                  onChange={handleOperacionChange}
                  className="w-full h-10 border rounded-sm px-2 whitespace-nowrap"
                  step="1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const hora = now.toLocaleTimeString("en-GB", {
                      hour12: false,
                      timeZone: "America/El_Salvador",
                    });
                    setNewOperacion((prev) => actualizarDuracion({ ...prev, inicio: hora }));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md whitespace-nowrap"
                >
                  Ahora
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold">Final</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  name="final"
                  value={newOperacion.final}
                  onChange={handleOperacionChange}
                  className="w-full h-10 border rounded-sm px-2 whitespace-nowrap"
                  step="1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const hora = now.toLocaleTimeString("en-GB", {
                      hour12: false,
                      timeZone: "America/El_Salvador",
                    });
                    setNewOperacion((prev) => actualizarDuracion({ ...prev, final: hora }));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md whitespace-nowrap"
                >
                  Ahora
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold">Minutos</label>
              <input
                type="text"
                name="minutos"
                value={newOperacion.minutos}
                readOnly
                className="w-full h-10 border rounded-sm px-2 bg-gray-50 whitespace-nowrap"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold">Actividad</label>
              <Select
                className="react-select-container"
                classNamePrefix="react-select"
                options={[...validOptions, { value: "Otro", label: "Otro" }]}
                placeholder="-- Seleccione Actividad --"
                value={
                  isOther
                    ? { value: "Otro", label: "Otro" }
                    : validOptions.find((opt) => opt.value === newOperacion.actividad) || null
                }
                onChange={(option: OptionType | null) => {
                  if (option) {
                    if (option.value === "Otro") {
                      setIsOther(true);
                      setNewOperacion((prev) => ({ ...prev, actividad: "" }));
                    } else {
                      setIsOther(false);
                      setNewOperacion((prev) => ({ ...prev, actividad: option.value }));
                    }
                  }
                }}
              />
              {isOther && (
                <textarea
                  name="actividad"
                  placeholder="Especificar..."
                  value={customActividad}
                  onChange={(e) => {
                    setCustomActividad(e.target.value);
                    setNewOperacion((prev) => ({ ...prev, actividad: e.target.value }));
                  }}
                  className="w-full border rounded-sm px-2 mt-1 resize-x whitespace-nowrap"
                  rows={2}
                />
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addOrUpdateOperacion}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md whitespace-nowrap"
            >
              {editingIndex !== null ? (
                <>
                  <FiEdit size={24} />
                  Actualizar
                </>
              ) : (
                <>
                  <FiPlus size={24} />
                  Agregar
                </>
              )}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                onClick={() => {
                  resetNewOperacion();
                  setEditingIndex(null);
                }}
                className="flex items-center ml-2 gap-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md whitespace-nowrap"
              >
                Cancelar
              </button>
            )}
          </div>
        </section>

        {/* Sección: Tabla de Operaciones */}
        <section className="mb-6 border rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2 uppercase">Bitácora de Operaciones</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border whitespace-nowrap">BODEGA</th>
                  <th className="p-2 border whitespace-nowrap">INICIO</th>
                  <th className="p-2 border whitespace-nowrap">FINAL</th>
                  <th className="p-2 border whitespace-nowrap">MINUTOS</th>
                  <th className="p-2 border whitespace-nowrap">ACTIVIDAD</th>
                  <th className="p-2 border whitespace-nowrap">ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {activeFormData?.bitacora.operaciones.map((op, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 border whitespace-nowrap">{op.bodega}</td>
                    <td className="p-2 border whitespace-nowrap">{op.inicio}</td>
                    <td className="p-2 border whitespace-nowrap">{op.final}</td>
                    <td className="p-2 border whitespace-nowrap">{op.minutos}</td>
                    <td className="p-2 border whitespace-nowrap">{op.actividad}</td>
                    <td className="p-2 border text-center flex items-center justify-center gap-2 whitespace-nowrap">
                      <button
                        onClick={() => handleEditOperacion(index)}
                        title="Actualizar"
                        className="text-green-500 hover:text-green-700"
                      >
                        <FiEdit size={23} />
                      </button>
                      <button
                        onClick={() => deleteOperacion(index)}
                        title="Eliminar"
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 size={23} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sección: Observaciones */}
        <section className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={activeFormData?.bitacora.observaciones || ""}
            onChange={(e) =>
              updateBitacoraData({ ...activeFormData!.bitacora, observaciones: e.target.value })
            }
            rows={3}
            className="w-full border border-gray-300 rounded-md px-2 py-1 resize-y whitespace-nowrap"
            placeholder="Escribe aquí..."
          />
        </section>
      </section>

      {/* Navegación de pestañas */}
      <div className="p-2 border-t flex flex-wrap items-center justify-center gap-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`px-3 py-2 cursor-pointer rounded-md shadow-sm flex items-center gap-1 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTab(tab.id);
                }}
                className="flex items-center justify-center bg-white rounded-full p-0.5 text-red-500 shadow"
                title="Eliminar pestaña"
              >
                <FiTrash2 size={20} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTab}
          className="flex items-center justify-center p-2 bg-green-500 rounded-full hover:bg-green-600 text-white"
          title="Agregar pestaña"
        >
          <FiPlus size={20} />
        </button>
      </div>

      {/* Acciones: Cancelar y Terminar Turno */}
      <div className="px-4 pb-4 flex justify-between items-center">
        <button
          onClick={handleCancel}
          className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleEndTurn}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Terminar Turno
        </button>
      </div>
    </div>
  );
}
