"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";

// Importar react-select de forma dinámica para evitar problemas de SSR/hidratación
const Select = dynamic(() => import("react-select"), { ssr: false });

// Definición del tipo de opción para react-select
interface OptionType {
  value: string;
  label: string;
}

// Opciones para los selects
const porteriaOptions: OptionType[] = [
  { value: "Porteria 1", label: "Porteria 1" },
  { value: "Porteria 2", label: "Porteria 2" },
  { value: "Porteria 3", label: "Porteria 3" },
  { value: "Porteria 4", label: "Porteria 4" },
  { value: "Porteria 5", label: "Porteria 5" },
  { value: "Porteria 6", label: "Porteria 6" },
];

const cribaOptions: OptionType[] = [
  { value: "3/16", label: "3/16" },
  { value: "5/16", label: "5/16" },
  { value: "9/64", label: "9/64" },
];

const molinoOptions: OptionType[] = [
  { value: "Molino 1", label: "Molino 1" },
  { value: "Molino 2", label: "Molino 2" },
];

const ejesOptions: OptionType[] = [
  { value: "Camión", label: "Camión" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

const condicionOptions: OptionType[] = [
  { value: "NORMAL", label: "NORMAL" },
  { value: "LLUVIA", label: "LLUVIA" },
  { value: "RECEPECION DE MELAZA", label: "RECEPECION DE MELAZA" },
  { value: "RECEPECION DE CEREALES/BARCO", label: "RECEPECION DE CEREALES/BARCO" },
];

const puntoDespachoOptions = [
  {
    label: "Bodegas",
    options: [
      { value: "BODEGA 1 PUERTA 1", label: "BODEGA 1 PUERTA 1" },
      { value: "BODEGA 1 PUERTA 2", label: "BODEGA 1 PUERTA 2" },
      { value: "BODEGA 1 PUERTA 3", label: "BODEGA 1 PUERTA 3" },
      { value: "BODEGA 2 PUERTA 1", label: "BODEGA 2 PUERTA 1" },
      { value: "BODEGA 2 PUERTA 2", label: "BODEGA 2 PUERTA 2" },
      { value: "BODEGA 3 PUERTA 1", label: "BODEGA 3 PUERTA 1" },
      { value: "BODEGA 3 PUERTA 2", label: "BODEGA 3 PUERTA 2" },
      { value: "BODEGA 3 SISTEMA", label: "BODEGA 3 SISTEMA" },
      { value: "BODEGA 4 PUERTA 1", label: "BODEGA 4 PUERTA 1" },
      { value: "BODEGA 4 PUERTA 3", label: "BODEGA 4 PUERTA 3" },
      { value: "BODEGA 5 PUERTA 1", label: "BODEGA 5 PUERTA 1" },
      { value: "BODEGA 6 PUERTA 3", label: "BODEGA 6 PUERTA 3" },
    ],
  },
  {
    label: "Silos",
    options: [
      { value: "SILO 1 GRAVEDAD", label: "SILO 1 GRAVEDAD" },
      { value: "SILO 1 SISTEMA", label: "SILO 1 SISTEMA" },
      { value: "SILO 1 CADENA MOVIL", label: "SILO 1 CADENA MOVIL" },
      { value: "SILO 2 GRAVEDAD", label: "SILO 2 GRAVEDAD" },
      { value: "SILO 2 SISTEMA", label: "SILO 2 SISTEMA" },
      { value: "SILO 2 CADENA MOVIL", label: "SILO 2 CADENA MOVIL" },
      { value: "SILO 3 GRAVEDAD", label: "SILO 3 GRAVEDAD" },
      { value: "SILO 3 SISTEMA", label: "SILO 3 SISTEMA" },
      { value: "SILO 3 CADENA MOVIL", label: "SILO 3 CADENA MOVIL" },
      { value: "SILO 4 GRAVEDAD", label: "SILO 4 GRAVEDAD" },
      { value: "SILO 4 SISTEMA", label: "SILO 4 SISTEMA" },
      { value: "SILO 4 CADENA MOVIL", label: "SILO 4 CADENA MOVIL" },
      { value: "SILO 5 SISTEMA", label: "SILO 5 SISTEMA" },
      { value: "SILO 6 SISTEMA", label: "SILO 6 SISTEMA" },
      { value: "SILO 7 SISTEMA INDIVIDUAL", label: "SILO 7 SISTEMA INDIVIDUAL" },
      { value: "SILO 7 SISTEMA", label: "SILO 7 SISTEMA" },
      { value: "SILO 8 SISTEMA INDIVIDUAL", label: "SILO 8 SISTEMA INDIVIDUAL" },
      { value: "SILO 8 SISTEMA", label: "SILO 8 SISTEMA" },
      { value: "SILO 9 GRAVEDAD", label: "SILO 9 GRAVEDAD" },
      { value: "SILO 9 SISTEMA", label: "SILO 9 SISTEMA" },
      { value: "SILO 10 SISTEMA", label: "SILO 10 SISTEMA" },
      { value: "SILO 11 SISTEMA", label: "SILO 11 SISTEMA" },
      { value: "SILO 12 SISTEMA", label: "SILO 12 SISTEMA" },
      { value: "SILO 13 SISTEMA", label: "SILO 13 SISTEMA" },
      { value: "SILO 14 SISTEMA", label: "SILO 14 SISTEMA" },
      { value: "SILO 15 SISTEMA", label: "SILO 15 SISTEMA" },
      { value: "SILO 16 SISTEMA", label: "SILO 16 SISTEMA" },
      { value: "SILO 17 SISTEMA", label: "SILO 17 SISTEMA" },
    ],
  },
  {
    label: "Modulos",
    options: [
      { value: "MODULO 1", label: "MODULO 1" },
      { value: "MODULO 2", label: "MODULO 2" },
      { value: "MODULO 3", label: "MODULO 3" },
    ],
  },
];

const puntoEnvasadoOptions = [
  { value: "MOLINO", label: "MOLINO" },
  { value: "TERMINAL 1", label: "TERMINAL 1" },
  { value: "TERMINAL 2", label: "TERMINAL 2" },
  { value: "ZONA BANDA 1", label: "ZONA BANDA 1" },
  { value: "ZONA BODEGA 2 PUERTA 2", label: "ZONA BODEGA 2 PUERTA 2" },
  { value: "ZONA BODEGA 5", label: "ZONA BODEGA 5" },
  { value: "ZONA BODEGA 6", label: "ZONA BODEGA 6" },
  { value: "ZONA BOULEVAR", label: "ZONA BOULEVAR" },
  { value: "ZONA MODULO 1 Y 2", label: "ZONA MODULO 1 Y 2" },
  { value: "ZONA MODULO 3", label: "ZONA MODULO 3" }
];

const basculaEntradaOptions: OptionType[] = [
  { value: "Báscula 1", label: "Báscula 1" },
  { value: "Báscula 2", label: "Báscula 2" },
  { value: "Báscula 3", label: "Báscula 3" },
  { value: "Báscula 4", label: "Báscula 4" },
  { value: "Báscula 5", label: "Báscula 5" },
  { value: "Báscula 6", label: "Báscula 6" },
];

const presentacionOptions: OptionType[] = [
  { value: "Envasado", label: "Envasado" },
  { value: "Granel", label: "Granel" },
];

const metodoCargaOptions: OptionType[] = [
  { value: "Cabaleo", label: "Cabaleo" },
  { value: "Carga Máxima", label: "Carga Máxima" },
];

// Helper para asignar la fecha actual (formato YYYY-MM-DD)
const handleSetNowDate = (setter: Function) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const fecha = `${year}-${month}-${day}`;
  setter((prev: any) => ({ ...prev, fecha }));
};

export default function PrimerProceso() {
  const router = useRouter();

  useEffect(() => {
    // Agregar un estado al historial para interceptar la navegación atrás
    window.history.pushState(null, "", window.location.href);

    // Interceptar el botón "atrás"
    const handlePopState = (event) => {
      Swal.fire({
        title: "¿Está seguro?",
        text: "Debe cancelar para salir. Se perderán los cambios realizados.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "No, continuar",
      }).then((result) => {
        if (result.isConfirmed) {
          // Si confirma, removemos el listener y navegamos a la ruta de salida
          window.removeEventListener("popstate", handlePopState);
          localStorage.removeItem("editMolino");
          localStorage.removeItem("molinoId");
          router.push("/proceso/consultar/molino");
        } else {
          // Si decide quedarse, se vuelve a insertar un estado en el historial
          window.history.pushState(null, "", window.location.href);
        }
      });
    };

    window.addEventListener("popstate", handlePopState);

    // Interceptar recargas o cierre de la pestaña
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router]);

  // Estados para campos principales
  const [numeroTransaccion, setNumeroTransaccion] = useState("");
  const [numeroOrden, setNumeroOrden] = useState("");
  const [numeroCriba, setNumeroCriba] = useState("");
  const [numeroMolino, setNumeroMolino] = useState("");
  const [pesadorEntrada, setPesadorEntrada] = useState("");
  const [porteriaEntrada, setPorteriaEntrada] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const [puntoDespacho, setPuntoDespacho] = useState("");
  const [puntoEnvasado, setPuntoEnvasado] = useState("");
  const [basculaEntrada, setBasculaEntrada] = useState("");
  const [metodoCarga, setMetodoCarga] = useState("");
  const [numeroEjes, setNumeroEjes] = useState("");
  const [condicion, setCondicion] = useState("");

  // Estados para los tiempos
  const [tiempoPrechequeo, setTiempoPrechequeo] = useState({ fecha: "", hora: "", comentarios: "" });
  const [tiempoScanner, setTiempoScanner] = useState({ fecha: "", hora: "", comentarios: "" });
  const [tiempoAutorizacion, setTiempoAutorizacion] = useState({ fecha: "", hora: "", comentarios: "" });
  const [tiempoIngresoPlanta, setTiempoIngresoPlanta] = useState({ hora: "", comentarios: "" });
  const [tiempoLlegadaBascula, setTiempoLlegadaBascula] = useState({ hora: "", comentarios: "" });
  const [tiempoEntradaBascula, setTiempoEntradaBascula] = useState({ hora: "", comentarios: "" });
  const [tiempoSalidaBascula, setTiempoSalidaBascula] = useState({ hora: "", comentarios: "" });

  const [editMolino, setEditMolino] = useState<any>(null);

  // Función para consultar la API, transformar la respuesta y almacenar en localStorage con la key "editMolino"
  async function fetchDemora() {
    try {
      const storedId = localStorage.getItem("molinoId") || "0";
      const userId = localStorage.getItem("userId");
      const roleId = localStorage.getItem("roleId");
  
      const response = await fetch(`/api/demoras/molino/${parseInt(storedId)}`, {
        headers: {
          userId,
          roleId,
        },
      });
  
      if (response.status === 403) {
        Swal.fire({
          title: "Acceso Denegado",
          text: "No tienes permiso de editar este registro",
          icon: "error",
          confirmButtonText: "OK",
        }).then(() => {
          localStorage.removeItem("editMolino");
          localStorage.removeItem("molinoId");
          setTimeout(() => {
            window.location.href = "/proceso/consultar/molino";
          }, 3000);
        });
        return;
      }
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Error en API:", errorData);
        Swal.fire("Error", errorData, "error");
        return;
      }
  
      const result = await response.json();
  
      if (result.molino) {
        const d = result.molino;
        const formattedEditMolino = {
          // Campos de cabecera
          fechaInicio: d.fechaInicio,
          userId: String(d.userId),
          userName: d.userName,
          // Primer Proceso (Molino)
          primerProceso: {
            numeroTransaccion: d.primerProceso?.numeroTransaccion || "",
            numeroOrden: d.primerProceso?.numeroOrden || "",
            numeroCriba: d.primerProceso?.numeroCriba || "",
            numeroMolino: d.primerProceso?.numeroMolino || "",
            pesadorEntrada: d.primerProceso?.pesadorEntrada || "",
            porteriaEntrada: d.primerProceso?.porteriaEntrada || "",
            presentacion: d.primerProceso?.presentacion || "",
            puntoDespacho: d.primerProceso?.puntoDespacho || "",
            puntoEnvasado: d.primerProceso?.puntoEnvasado || "",
            basculaEntrada: d.primerProceso?.basculaEntrada || "",
            metodoCarga: d.primerProceso?.metodoCarga || "",
            numeroEjes: d.primerProceso?.numeroEjes || "",
            condicion: d.primerProceso?.condicion || "",
            tiempoPrechequeo: {
              fecha: d.primerProceso?.fechaPrechequeo || "",
              hora: d.primerProceso?.tiempoPrechequeo || "",
              comentarios: d.primerProceso?.prechequeoObservaciones || "",
            },
            tiempoScanner: {
              fecha: d.primerProceso?.fechaScanner || "",
              hora: d.primerProceso?.tiempoScanner || "",
              comentarios: d.primerProceso?.scannerObservaciones || "",
            },
            tiempoAutorizacion: {
              fecha: d.primerProceso?.fechaAutorizacion || "",
              hora: d.primerProceso?.tiempoAutorizacion || "",
              comentarios: d.primerProceso?.autorizacionObservaciones || "",
            },
            tiempoIngresoPlanta: {
              hora: d.primerProceso?.tiempoIngresoPlanta || "",
              comentarios: d.primerProceso?.ingresoPlantaObservaciones || "",
            },
            tiempoLlegadaBascula: {
              hora: d.primerProceso?.tiempoLlegadaBascula || "",
              comentarios: d.primerProceso?.llegadaBasculaObservaciones || "",
            },
            tiempoEntradaBascula: {
              hora: d.primerProceso?.tiempoEntradaBascula || "",
              comentarios: d.primerProceso?.entradaBasculaObservaciones || "",
            },
            tiempoSalidaBascula: {
              hora: d.primerProceso?.tiempoSalidaBascula || "",
              comentarios: d.primerProceso?.salidaBasculaObservaciones || "",
            },
          },
          // Segundo Proceso
          segundoProceso: {
            grupo: d.segundoProceso?.grupo || "",
            operador: d.segundoProceso?.operador || "",
            personalAsignado: String(d.segundoProceso?.personalAsignado || ""),
            personalAsignadoObservaciones: d.segundoProceso?.personalAsignadoObservaciones || "",
            modeloEquipo: d.segundoProceso?.modeloEquipo || "",
            tiempoLlegadaPunto: {
              hora: d.segundoProceso?.tiempoLlegadaPunto || "",
              comentarios: d.segundoProceso?.llegadaPuntoObservaciones || "",
            },
            tiempoLlegadaOperador: {
              hora: d.segundoProceso?.tiempoLlegadaOperador || "",
              comentarios: d.segundoProceso?.llegadaOperadorObservaciones || "",
            },
            tiempoLlegadaGrupo: {
              hora: d.segundoProceso?.tiempoLlegadaGrupo || "",
              comentarios: d.segundoProceso?.llegadaGrupoObservaciones || "",
            },
            tiempoLlegadaEquipo: {
              hora: d.segundoProceso?.tiempoLlegadaEquipo || "",
              comentarios: d.segundoProceso?.llegadaEquipoObservaciones || "",
            },
            tiempoInicioCarga: {
              hora: d.segundoProceso?.tiempoInicioCarga || "",
              comentarios: d.segundoProceso?.inicioCargaObservaciones || "",
            },
            tiempoTerminaCarga: {
              hora: d.segundoProceso?.tiempoTerminaCarga || "",
              comentarios: d.segundoProceso?.terminaCargaObservaciones || "",
            },
            tiempoInicioMolido: {
              hora: d.segundoProceso?.tiempoInicioMolido || "",
              comentarios: d.segundoProceso?.inicioMolidoObservaciones || "",
            },
            tiempoTerminaMolido: {
              hora: d.segundoProceso?.tiempoTerminaMolido || "",
              comentarios: d.segundoProceso?.terminaMolidoObservaciones || "",
            },
            tiempoSalidaPunto: {
              hora: d.segundoProceso?.tiempoSalidaPunto || "",
              comentarios: d.segundoProceso?.salidaPuntoObservaciones || "",
            },
            paros: (d.segundoProceso?.parosMol || []).map((paro: any) => ({
              inicio: paro.inicio,
              fin: paro.fin,
              razon: paro.razon,
              diffCargaInicio: paro.diffCargaInicio,
              duracionParo: paro.duracionParo,
            })),
            parosStats: {
              totalParos: d.segundoProceso?.parosStatsTotalParos || 0,
              tiempoTotalParos: d.segundoProceso?.parosStatsTiempoTotalParos || "",
            },
          },
          // Tercer Proceso
          tercerProceso: {
            pesadorSalida: d.tercerProceso?.pesadorSalida || "",
            basculaSalida: d.tercerProceso?.basculaSalida || "",
            tiempoLlegadaBascula: {
              hora: d.tercerProceso?.tiempoLlegadaBascula || "",
              comentarios: d.tercerProceso?.llegadaBasculaObservaciones || "",
            },
            tiempoEntradaBascula: {
              hora: d.tercerProceso?.tiempoEntradaBascula || "",
              comentarios: d.tercerProceso?.entradaBasculaObservaciones || "",
            },
            tiempoSalidaBascula: {
              hora: d.tercerProceso?.tiempoSalidaBascula || "",
              comentarios: d.tercerProceso?.salidaBasculaObservaciones || "",
            },
            vueltas: (d.tercerProceso?.vueltasEnv || []).map((vuelta: any) => ({
              numeroVuelta: vuelta.numeroVuelta,
              llegadaPunto: {
                hora: vuelta.tiempoLlegadaPunto || "",
                comentarios: vuelta.llegadaPuntoObservaciones || "",
              },
              salidaPunto: {
                hora: vuelta.tiempoSalidaPunto || "",
                comentarios: vuelta.salidaPuntoObservaciones || "",
              },
              llegadaBascula: {
                hora: vuelta.tiempoLlegadaBascula || "",
                comentarios: vuelta.llegadaBasculaObservaciones || "",
              },
              entradaBascula: {
                hora: vuelta.tiempoEntradaBascula || "",
                comentarios: vuelta.entradaBasculaObservaciones || "",
              },
              salidaBascula: {
                hora: vuelta.tiempoSalidaBascula || "",
                comentarios: vuelta.salidaBasculaObservaciones || "",
              },
            })),
          },
          // Proceso Final
          procesoFinal: {
            tiempoLlegadaPorteria: {
              hora: d.procesoFinal?.tiempoLlegadaPorteria || "",
              comentarios: d.procesoFinal?.llegadaPorteriaObservaciones || "",
            },
            tiempoSalidaPlanta: {
              hora: d.procesoFinal?.tiempoSalidaPlanta || "",
              comentarios: d.procesoFinal?.salidaPlantaObservaciones || "",
            },
            porteriaSalida: d.procesoFinal?.porteriaSalida || "",
          },
          tiempoTotal: d.tiempoTotal || "",
        };
      
        localStorage.setItem("editMolino", JSON.stringify(formattedEditMolino));
        setEditMolino(formattedEditMolino);
      }      
    } catch (error: any) {
      console.error("Error al obtener la demora:", error);
      Swal.fire("Error", "Error al obtener la demora: " + error.message, "error");
    }
  }

  // useEffect: Consultar la API y luego cargar los datos desde localStorage ("editMolino")
  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem("editMolino");
      if (!stored) {
        await fetchDemora();
      }
      cargarDatosDeLocalStorage();
    })();
  }, []);

  // Función para cargar datos desde localStorage y actualizar los estados
  function cargarDatosDeLocalStorage() {
    const stored = localStorage.getItem("editMolino");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.primerProceso) {
        const p = parsed.primerProceso;
        setNumeroTransaccion(p.numeroTransaccion || "");
        setNumeroOrden(p.numeroOrden || "");
        setNumeroCriba(p.numeroCriba || "");
        setNumeroMolino(p.numeroMolino || "");
        setPesadorEntrada(p.pesadorEntrada || "");
        setPorteriaEntrada(p.porteriaEntrada || "");
        setPresentacion(p.presentacion || "");
        setPuntoDespacho(p.puntoDespacho || "");
        setPuntoEnvasado(p.puntoEnvasado || "");
        setBasculaEntrada(p.basculaEntrada || "");
        setMetodoCarga(p.metodoCarga || "");
        setNumeroEjes(p.numeroEjes || "");
        setCondicion(p.condicion || "");
        setTiempoPrechequeo(p.tiempoPrechequeo || { fecha: "", hora: "", comentarios: "" });
        setTiempoScanner(p.tiempoScanner || { fecha: "", hora: "", comentarios: "" });
        setTiempoAutorizacion(p.tiempoAutorizacion || { fecha: "", hora: "", comentarios: "" });
        setTiempoIngresoPlanta(p.tiempoIngresoPlanta || { hora: "", comentarios: "" });
        setTiempoLlegadaBascula(p.tiempoLlegadaBascula || { hora: "", comentarios: "" });
        setTiempoEntradaBascula(p.tiempoEntradaBascula || { hora: "", comentarios: "" });
        setTiempoSalidaBascula(p.tiempoSalidaBascula || { hora: "", comentarios: "" });
      }
    }
  }

  // Helper: Asignar "Ahora" a un campo de tiempo (HH:mm:ss)
  const handleSetNow = (setter: Function) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const hora = `${hh}:${mm}:${ss}`;
    setter((prev: any) => ({ ...prev, hora }));
  };

  // Guardar cambios actualizando editMolino en localStorage y continuar a la siguiente etapa
  const handleGuardarYContinuar = () => {
    const stored = localStorage.getItem("editMolino");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.primerProceso = {
        numeroTransaccion,
        numeroOrden,
        numeroCriba,
        numeroMolino,
        pesadorEntrada,
        porteriaEntrada,
        presentacion,
        puntoDespacho,
        puntoEnvasado,
        basculaEntrada,
        metodoCarga,
        numeroEjes,
        condicion,
        tiempoPrechequeo,
        tiempoScanner,
        tiempoAutorizacion,
        tiempoIngresoPlanta,
        tiempoLlegadaBascula,
        tiempoEntradaBascula,
        tiempoSalidaBascula,
      };
      localStorage.setItem("editMolino", JSON.stringify(parsed));
    }
    router.push("/proceso/editar/molino/step2");
  };

  // Cancelar: confirmar y limpiar storage para regresar a la consulta
  const handleCancelar = () => {
    Swal.fire({
      title: "¿Está seguro?",
      text: "Se perderán los cambios realizados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, continuar",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("editMolino");
        localStorage.removeItem("molinoId");
        router.push("/proceso/consultar/molino");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6">
        {/* Barra de Progreso */}
        <div className="flex items-center mb-4">
          <div className="flex-1 bg-orange-500 py-2 px-4 rounded-l-lg"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center rounded-r-lg"></div>
        </div>
        <h2 className="text-xl font-bold mb-4 text-orange-600">
          Primer Proceso de Molino <span className="text-lg text-gray-400">[Modo Edición]</span>
        </h2>

        {/* Campos Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Número de Transacción */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Número de Transacción
            </label>
            <input
              type="number"
              className="border w-full p-2 text-sm sm:text-base"
              value={numeroTransaccion}
              onChange={(e) => setNumeroTransaccion(e.target.value)}
            />
          </div>

          {/* Número de Orden */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Número de Orden
            </label>
            <input
              type="number"
              className="border w-full p-2 text-sm sm:text-base"
              value={numeroOrden}
              onChange={(e) => setNumeroOrden(e.target.value)}
            />
          </div>

          {/* Pesador Entrada */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Pesador Entrada
            </label>
            <input
              type="text"
              className="border w-full p-2 text-sm sm:text-base"
              value={pesadorEntrada}
              onChange={(e) => setPesadorEntrada(e.target.value)}
            />
          </div>

          {/* Portería Entrada */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Portería Entrada
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={porteriaOptions}
              placeholder="Seleccione Portería"
              value={porteriaEntrada ? { value: porteriaEntrada, label: porteriaEntrada } : null}
              onChange={(option: OptionType | null) =>
                setPorteriaEntrada(option ? option.value : "")
              }
            />
          </div>

          {/* Báscula de Entrada */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Báscula de Entrada
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={basculaEntradaOptions}
              placeholder="Seleccione Báscula"
              value={basculaEntrada ? { value: basculaEntrada, label: basculaEntrada } : null}
              onChange={(option: OptionType | null) =>
                setBasculaEntrada(option ? option.value : "")
              }
            />
          </div>

          {/* Número de Molino */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Molino
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={molinoOptions}
              placeholder="Seleccione Molino"
              value={numeroMolino ? { value: numeroMolino, label: numeroMolino } : null}
              onChange={(option: OptionType | null) =>
                setNumeroMolino(option ? option.value : "")
              }
            />
          </div>

          {/* Número de Criba */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Número de Criba
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={cribaOptions}
              placeholder="Seleccione Criba"
              value={numeroCriba ? { value: numeroCriba, label: numeroCriba } : null}
              onChange={(option: OptionType | null) =>
                setNumeroCriba(option ? option.value : "")
              }
            />
          </div>


          {/* Presentación */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Presentación
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={presentacionOptions}
              placeholder="Seleccione Presentación"
              value={presentacion ? { value: presentacion, label: presentacion } : null}
              onChange={(option: OptionType | null) =>
                setPresentacion(option ? option.value : "")
              }
            />
          </div>



          {/* Punto de Despacho */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Punto de Despacho
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={puntoDespachoOptions}
              placeholder="Seleccione Punto"
              value={puntoDespacho ? { value: puntoDespacho, label: puntoDespacho } : null}
              onChange={(option: OptionType | null) =>
                setPuntoDespacho(option ? option.value : "")
              }
            />
          </div>

          {/* Punto de Envasado */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Punto de Envasado
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={puntoEnvasadoOptions}
              placeholder="Seleccione Punto"
              value={puntoEnvasado ? { value: puntoEnvasado, label: puntoEnvasado } : null}
              onChange={(option: OptionType | null) =>
                setPuntoEnvasado(option ? option.value : "")
              }
            />
          </div>

          {/* Método de Carga */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Método de Carga
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={metodoCargaOptions}
              placeholder="Seleccione Método"
              value={metodoCarga ? { value: metodoCarga, label: metodoCarga } : null}
              onChange={(option: OptionType | null) =>
                setMetodoCarga(option ? option.value : "")
              }
            />
          </div>

          {/* Número de Ejes */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Número de Ejes
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={ejesOptions}
              placeholder="Seleccione Ejes"
              value={numeroEjes ? { value: numeroEjes, label: numeroEjes } : null}
              onChange={(option: OptionType | null) =>
                setNumeroEjes(option ? option.value : "")
              }
            />
          </div>

          {/* Condición */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Condición
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={condicionOptions}
              placeholder="Seleccione Condición"
              value={condicion ? { value: condicion, label: condicion } : null}
              onChange={(option: OptionType | null) =>
                setCondicion(option ? option.value : "")
              }
            />
          </div>

          <div>
            <div className="text-sm sm:text-base text-blue-600 mb-2">
              <strong>NORMAL:</strong> Flujo normal sin afectar el despacho.
            </div>
            <div className="text-sm sm:text-base text-orange-600 mt-2 mb-1">
              <strong>LLUVIA:</strong> Condición meteorológica que afecta el despacho.
            </div>
            <div className="text-sm sm:text-base text-blue-600 mb-2">
              <strong>MELAZA:</strong> Flujo que requiere báscula adicional y afecta el despacho.
            </div>
            <div className="text-sm sm:text-base text-orange-600 mb-2">
              <strong>CEREALES:</strong> Recepción de cereales provenientes de barcos.
            </div>
          </div>
        </div>

        {/* Tiempos */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2 sm:text-sm">Tiempos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prechequeo */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Prechequeo</label>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="border p-1 w-full text-sm sm:text-base"
                    value={tiempoPrechequeo.fecha}
                    onChange={(e) =>
                      setTiempoPrechequeo((prev) => ({ ...prev, fecha: e.target.value }))
                    }
                  />
                  <button
                    className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                    onClick={() => handleSetNowDate(setTiempoPrechequeo)}
                  >
                    Ahora
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    step="1"
                    className="border p-1 w-full text-sm sm:text-base"
                    value={tiempoPrechequeo.hora}
                    onChange={(e) =>
                      setTiempoPrechequeo((prev) => ({ ...prev, hora: e.target.value }))
                    }
                  />
                  <button
                    className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                    onClick={() => handleSetNow(setTiempoPrechequeo)}
                  >
                    Ahora
                  </button>
                </div>
                <textarea
                  className="border w-full p-1 text-xs sm:text-sm"
                  placeholder="Comentarios..."
                  value={tiempoPrechequeo.comentarios}
                  onChange={(e) =>
                    setTiempoPrechequeo((prev) => ({ ...prev, comentarios: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Scanner */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Scanner</label>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="border p-1 w-full text-sm sm:text-base"
                    value={tiempoScanner.fecha}
                    onChange={(e) =>
                      setTiempoScanner((prev) => ({ ...prev, fecha: e.target.value }))
                    }
                  />
                  <button
                    className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                    onClick={() => handleSetNowDate(setTiempoScanner)}
                  >
                    Ahora
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    step="1"
                    className="border p-1 w-full text-sm sm:text-base"
                    value={tiempoScanner.hora}
                    onChange={(e) =>
                      setTiempoScanner((prev) => ({ ...prev, hora: e.target.value }))
                    }
                  />
                  <button
                    className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                    onClick={() => handleSetNow(setTiempoScanner)}
                  >
                    Ahora
                  </button>
                </div>
                <textarea
                  className="border w-full p-1 text-xs sm:text-sm"
                  placeholder="Comentarios..."
                  value={tiempoScanner.comentarios}
                  onChange={(e) =>
                    setTiempoScanner((prev) => ({ ...prev, comentarios: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Autorización */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Autorización</label>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="border p-1 w-full text-sm sm:text-base"
                    value={tiempoAutorizacion.fecha}
                    onChange={(e) =>
                      setTiempoAutorizacion((prev) => ({ ...prev, fecha: e.target.value }))
                    }
                  />
                  <button
                    className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                    onClick={() => handleSetNowDate(setTiempoAutorizacion)}
                  >
                    Ahora
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    step="1"
                    className="border p-1 w-full text-sm sm:text-base"
                    value={tiempoAutorizacion.hora}
                    onChange={(e) =>
                      setTiempoAutorizacion((prev) => ({ ...prev, hora: e.target.value }))
                    }
                  />
                  <button
                    className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                    onClick={() => handleSetNow(setTiempoAutorizacion)}
                  >
                    Ahora
                  </button>
                </div>
                <textarea
                  className="border w-full p-1 text-xs sm:text-sm"
                  placeholder="Comentarios..."
                  value={tiempoAutorizacion.comentarios}
                  onChange={(e) =>
                    setTiempoAutorizacion((prev) => ({ ...prev, comentarios: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Ingreso de Planta */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Ingreso de Planta</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoIngresoPlanta.hora}
                  onChange={(e) =>
                    setTiempoIngresoPlanta((prev) => ({ ...prev, hora: e.target.value }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoIngresoPlanta)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoIngresoPlanta.comentarios}
                onChange={(e) =>
                  setTiempoIngresoPlanta((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>

            {/* Llegada a la Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Llegada a la Báscula</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoLlegadaBascula.hora}
                  onChange={(e) =>
                    setTiempoLlegadaBascula((prev) => ({ ...prev, hora: e.target.value }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoLlegadaBascula)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoLlegadaBascula.comentarios}
                onChange={(e) =>
                  setTiempoLlegadaBascula((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>

            {/* Entrada a la Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Entrada Báscula</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoEntradaBascula.hora}
                  onChange={(e) =>
                    setTiempoEntradaBascula((prev) => ({ ...prev, hora: e.target.value }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoEntradaBascula)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoEntradaBascula.comentarios}
                onChange={(e) =>
                  setTiempoEntradaBascula((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>

            {/* Salida a la Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Salida Báscula</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="time"
                  step="1"
                  className="border p-1 w-full text-sm sm:text-base"
                  value={tiempoSalidaBascula.hora}
                  onChange={(e) =>
                    setTiempoSalidaBascula((prev) => ({ ...prev, hora: e.target.value }))
                  }
                />
                <button
                  className="bg-orange-500 text-white px-3 rounded text-sm sm:text-base"
                  onClick={() => handleSetNow(setTiempoSalidaBascula)}
                >
                  Ahora
                </button>
              </div>
              <textarea
                className="border w-full p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoSalidaBascula.comentarios}
                onChange={(e) =>
                  setTiempoSalidaBascula((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Botones de Navegación */}
        <div className="mt-6 flex justify-between">
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleCancelar}>
            Cancelar
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleGuardarYContinuar}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
