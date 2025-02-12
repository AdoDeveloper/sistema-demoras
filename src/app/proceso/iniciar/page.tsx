"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Importar react-select de forma dinámica para evitar problemas de SSR/hidratación
const Select = dynamic(() => import("react-select"), { ssr: false });

// Definición del tipo de opción para react-select
interface OptionType {
  value: string;
  label: string;
}

// Opciones para los selects con búsqueda
const terminalOptions: OptionType[] = [
  { value: "Terminal 1", label: "Terminal 1" },
  { value: "Terminal 2", label: "Terminal 2" },
];

const clienteOptions: OptionType[] = [
  { value: "ADM EL SALVADOR LTDA DE C.V.", label: "ADM EL SALVADOR LTDA DE C.V." },
  { value: "AGROINDUSTRIAS BUENAVISTA, S.A. DE C.V.", label: "AGROINDUSTRIAS BUENAVISTA, S.A. DE C.V." },
  { value: "AGROPECUARIA DEL VALLE, S.A. DE C.V.", label: "AGROPECUARIA DEL VALLE, S.A. DE C.V." },
  { value: "ARROCERA OMOA, S.A. DE C.V.", label: "ARROCERA OMOA, S.A. DE C.V." },
  { value: "AVICOLA CAMPESTRE, S.A. DE C.V.", label: "AVICOLA CAMPESTRE, S.A. DE C.V." },
  { value: "AVICOLA DEL SUR/PROSALCO", label: "AVICOLA DEL SUR" },
  { value: "AVICOLA SALAZAR", label: "AVICOLA SALAZAR" },
  { value: "AVICOLA SAN BENITO, S.A. DE C.V.", label: "AVICOLA SAN BENITO, S.A. DE C.V." },
  { value: "AVICULTOR Y PORCINOCULTORES S.A. DE C.V.", label: "AVICULTOR Y PORCINOCULTORES S.A. DE C.V." },
  { value: "COOP. GANADERA DE SONSONATE", label: "COOP. GANADERA DE SONSONATE" },
  { value: "EL GRANJERO, S.A. DE C.V.", label: "EL GRANJERO, S.A. DE C.V." },
  { value: "GRANJA CATALANA, S.A. DE C.V.", label: "GRANJA CATALANA, S.A. DE C.V." },
  { value: "IMPORTADORES AGROPECUARIOS", label: "IMPORTADORES AGROPECUARIOS" },
  { value: "IMPORTADORES AGROPECUARIOS, S.A. DE C.V.", label: "IMPORTADORES AGROPECUARIOS, S.A. DE C.V." },
  { value: "MARTIR VICTOR ANTONIO DERAS FLORES", label: "MARTIR VICTOR ANTONIO DERAS FLORES" },
  { value: "MONICA GROSS", label: "MONICA GROSS" },
  { value: "PRODUCTOS ALIMENTICIOS BOCADELI, S.A. DE C.V.", label: "PRODUCTOS ALIMENTICIOS BOCADELI, S.A. DE C.V." },
  { value: "PRODUCTOS ALIMENTICIOS DIANA, S.A.", label: "PRODUCTOS ALIMENTICIOS DIANA, S.A." },
  { value: "PRODUCTOS ALIMENTICIOS SELLO DE ORO, S.A. DE C.V.", label: "PRODUCTOS ALIMENTICIOS SELLO DE ORO, S.A. DE C.V." },
  { value: "PROSALCO", label: "PROSALCO" },
  { value: "RAFAEL ANDRES JOVEL MIRANDA", label: "RAFAEL ANDRES JOVEL MIRANDA" },
  { value: "SALOMON GROSS", label: "SALOMON GROSS" },
  { value: "SARAM", label: "SARAM" },
  { value: "TECNICA EN NUTRICION ANIMAL S.A. DE C.V.", label: "TECNICA EN NUTRICION ANIMAL S.A. DE C.V." },
  { value: "TIERRA FERTIL", label: "TIERRA FERTIL" },
  { value: "WALTER HERNANDEZ", label: "WALTER HERNANDEZ" },
];

const ejesOptions: OptionType[] = [
  { value: "", label: "Seleccione Ejes" },
  { value: "Camión", label: "Camión" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

const tipoProductoOptions: OptionType[] = [
  { value: "ACEITE ACIDULADO DE SOYA", label: "ACEITE ACIDULADO DE SOYA" },
  { value: "ACEITE DE SOYA", label: "ACEITE DE SOYA" },
  { value: "ACEITE DESGOMADO", label: "ACEITE DESGOMADO" },
  { value: "AFRECHO", label: "AFRECHO" },
  { value: "ARROZ EN GRANZA", label: "ARROZ EN GRANZA" },
  { value: "CASCARILLA DE SOYA", label: "CASCARILLA DE SOYA" },
  { value: "HARINA DE SOYA", label: "HARINA DE SOYA" },
  { value: "MAIZ AMARILLO", label: "MAIZ AMARILLO" },
  { value: "MAIZ AMARILLO BRASILEÑO", label: "MAIZ AMARILLO BRASILEÑO" },
  { value: "MAIZ BLANCO", label: "MAIZ BLANCO" },
  { value: "MAIZ DESTILADO", label: "MAIZ DESTILADO" },
  { value: "MALTA", label: "MALTA" },
  { value: "TRIGO", label: "TRIGO" },
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
];

const basculaEntradaOptions: OptionType[] = [
  { value: "", label: "Seleccione Báscula" },
  { value: "Báscula 1", label: "Báscula 1" },
  { value: "Báscula 2", label: "Báscula 2" },
  { value: "Báscula 3", label: "Báscula 3" },
  { value: "Báscula 4", label: "Báscula 4" },
  { value: "Báscula 5", label: "Báscula 5" },
  { value: "Báscula 6", label: "Báscula 6" },
];

const tipoCargaOptions: OptionType[] = [
  { value: "Granel", label: "Granel" },
  { value: "Envasado", label: "Envasado" },
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

  // ----- Campos principales -----
  const [terminal, setTerminal] = useState("");
  const [cliente, setCliente] = useState("");
  const [placa, setPlaca] = useState("");
  const [remolque, setRemolque] = useState("");
  const [ejes, setEjes] = useState("");
  const [pesador, setPesador] = useState("");
  const [pesoInicial, setPesoInicial] = useState("");
  const [tipoProducto, setTipoProducto] = useState("");
  const [puntoDespacho, setPuntoDespacho] = useState("");
  const [basculaEntrada, setBasculaEntrada] = useState("");
  const [tipoCarga, setTipoCarga] = useState("");
  const [metodoCarga, setMetodoCarga] = useState("");
  // const [tipoSistema, setTipoSistema] = useState("");

  // ----- Tiempos -----
  // Para Prechequeo, Scanner y Autorización se incluye fecha, hora y comentarios.
  const [tiempoPrechequeo, setTiempoPrechequeo] = useState({ fecha: "", hora: "", comentarios: "" });
  const [tiempoScanner, setTiempoScanner] = useState({ fecha: "", hora: "", comentarios: "" });
  const [tiempoAutorizacion, setTiempoAutorizacion] = useState({ fecha: "", hora: "", comentarios: "" });
  // Los otros tiempos se mantienen sin fecha.
  const [tiempoIngresoPlanta, setTiempoIngresoPlanta] = useState({ hora: "", comentarios: "" });
  const [tiempoEntradaBascula, setTiempoEntradaBascula] = useState({ hora: "", comentarios: "" });
  const [tiempoSalidaBascula, setTiempoSalidaBascula] = useState({ hora: "", comentarios: "" });

  // ----------------------------------------------------------------
  // useEffect: Cargar/crear "demorasProcess" en localStorage
  // ----------------------------------------------------------------
  useEffect(() => {
    cargarDatosDeLocalStorage();
  }, []);

  function cargarDatosDeLocalStorage(){
    let stored = localStorage.getItem("demorasProcess");
    if (!stored) {
      const initialData = {
        fechaInicio: new Date().toLocaleString("en-GB", {
          timeZone: "America/El_Salvador",
        }),
        primerProceso: {},
        segundoProceso: {},
        tercerProceso: {},
        procesoFinal: {},
      };
      localStorage.setItem("demorasProcess", JSON.stringify(initialData));
      stored = localStorage.getItem("demorasProcess");
    }

    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.primerProceso) {
        const p = parsed.primerProceso;
        setTerminal(p.terminal || "");
        setCliente(p.cliente || "");
        setPlaca(p.placa || "");
        setRemolque(p.remolque || "");
        setEjes(p.ejes || "");
        setPesador(p.pesador || "");
        setPesoInicial(p.pesoInicial || "");
        setTipoProducto(p.tipoProducto || "");
        setPuntoDespacho(p.puntoDespacho || "");
        setBasculaEntrada(p.basculaEntrada || "");
        setTipoCarga(p.tipoCarga || "");
        setMetodoCarga(p.metodoCarga || "");
        // setTipoSistema(p.tipoSistema || "");

        setTiempoPrechequeo(p.tiempoPrechequeo || { fecha: "", hora: "", comentarios: "" });
        setTiempoScanner(p.tiempoScanner || { fecha: "", hora: "", comentarios: "" });
        setTiempoAutorizacion(p.tiempoAutorizacion || { fecha: "", hora: "", comentarios: "" });
        setTiempoIngresoPlanta(p.tiempoIngresoPlanta || { hora: "", comentarios: "" });
        setTiempoEntradaBascula(p.tiempoEntradaBascula || { hora: "", comentarios: "" });
        setTiempoSalidaBascula(p.tiempoSalidaBascula || { hora: "", comentarios: "" });
      }
    }
  }
  // ----------------------------------------------------------------
  // Helper: Asignar "Ahora" a un campo de tiempo (formato HH:mm:ss)
  // ----------------------------------------------------------------
  const handleSetNow = (setter: Function) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const hora = `${hh}:${mm}:${ss}`;
    setter((prev: any) => ({ ...prev, hora }));
  };

  // ----------------------------------------------------------------
  // Guardar y Continuar
  // ----------------------------------------------------------------
  const handleGuardarYContinuar = () => {
    const stored = localStorage.getItem("demorasProcess");
    if (stored) {
      const parsed = JSON.parse(stored);

      // Insertamos/actualizamos primerProceso
      parsed.primerProceso = {
        terminal,
        cliente,
        placa,
        remolque,
        ejes,
        pesador,
        pesoInicial,
        tipoProducto,
        puntoDespacho,
        basculaEntrada,
        tipoCarga,
        metodoCarga,
        // tipoSistema,

        tiempoPrechequeo,
        tiempoScanner,
        tiempoAutorizacion,
        tiempoIngresoPlanta,
        tiempoEntradaBascula,
        tiempoSalidaBascula,
      };

      localStorage.setItem("demorasProcess", JSON.stringify(parsed));
    }

    router.push("/proceso/iniciar/step2");
  };

  // ----------------------------------------------------------------
  // Cancelar (elimina localStorage y regresa Home)
  // ----------------------------------------------------------------
  const handleCancelar = () => {
    localStorage.removeItem("demorasProcess");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-4 px-2 sm:px-4 text-slate-900">
      <div className="w-full max-w-2xl sm:max-w-4xl bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4 rounded-l-lg text-center"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center"></div>
          <div className="flex-1 bg-blue-600 py-2 px-4 text-center rounded-r-lg"></div>
        </div>
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-orange-600 text-center sm:text-left">
          Primer Proceso
        </h2>

        {/* Campos Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Terminal */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Terminal</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={terminalOptions}
              placeholder="Seleccione Terminal"
              value={terminal ? { value: terminal, label: terminal } : null}
              onChange={(option: OptionType | null) =>
                setTerminal(option ? option.value : "")
              }
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Cliente</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={clienteOptions}
              placeholder="Seleccione Cliente"
              value={cliente ? { value: cliente, label: cliente } : null}
              onChange={(option: OptionType | null) =>
                setCliente(option ? option.value : "")
              }
            />
          </div>

          {/* Placa */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Placa</label>
            <input
              className="border w-full p-2 text-sm sm:text-base"
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
            />
          </div>

          {/* Remolque */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Remolque</label>
            <input
              className="border w-full p-2 text-sm sm:text-base"
              type="text"
              value={remolque}
              onChange={(e) => setRemolque(e.target.value)}
            />
          </div>

          {/* Ejes */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Ejes</label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={ejesOptions}
              placeholder="Seleccione Ejes"
              value={ejes ? { value: ejes, label: ejes } : null}
              onChange={(option: OptionType | null) =>
                setEjes(option ? option.value : "")
              }
            />
          </div>

          {/* Pesador */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Pesador</label>
            <input
              className="border w-full p-2 text-sm sm:text-base"
              type="text"
              value={pesador}
              onChange={(e) => setPesador(e.target.value)}
            />
          </div>

          {/* Peso Inicial */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Peso Inicial</label>
            <input
              className="border w-full p-2 text-sm sm:text-base"
              type="number"
              value={pesoInicial}
              onChange={(e) => setPesoInicial(e.target.value)}
            />
          </div>

          {/* Tipo de Producto */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Tipo de Producto
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={tipoProductoOptions}
              placeholder="Seleccione Producto"
              value={tipoProducto ? { value: tipoProducto, label: tipoProducto } : null}
              onChange={(option: OptionType | null) =>
                setTipoProducto(option ? option.value : "")
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

          {/* Tipo de Carga */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Tipo de Carga
            </label>
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              options={tipoCargaOptions}
              placeholder="Seleccione Tipo"
              value={tipoCarga ? { value: tipoCarga, label: tipoCarga } : null}
              onChange={(option: OptionType | null) =>
                setTipoCarga(option ? option.value : "")
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
        </div>

        {/* Tiempos */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2 sm:text-sm">Tiempos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prechequeo */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Prechequeo
              </label>
              <div className="flex flex-col gap-2 mt-1">
                {/* Campo de Fecha */}
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
                {/* Campo de Hora */}
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
                {/* Campo de Fecha */}
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
                {/* Campo de Hora */}
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
              <label className="block font-semibold text-sm sm:text-base">
                Autorización
              </label>
              <div className="flex flex-col gap-2 mt-1">
                {/* Campo de Fecha */}
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
                {/* Campo de Hora */}
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

            {/* Ingreso Planta */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Ingreso de Planta
              </label>
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
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoIngresoPlanta.comentarios}
                onChange={(e) =>
                  setTiempoIngresoPlanta((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>

            {/* Entrada Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Entrada Báscula
              </label>
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
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoEntradaBascula.comentarios}
                onChange={(e) =>
                  setTiempoEntradaBascula((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>

            {/* Salida Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Salida Báscula
              </label>
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
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
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
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleCancelar}
          >
            Cancelar
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleGuardarYContinuar}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
