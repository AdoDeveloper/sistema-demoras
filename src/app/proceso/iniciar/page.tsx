"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

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
  const [tiempoPrechequeo, setTiempoPrechequeo] = useState({ hora: "", comentarios: "" });
  const [tiempoScanner, setTiempoScanner] = useState({ hora: "", comentarios: "" });
  const [tiempoAutorizacion, setTiempoAutorizacion] = useState({ hora: "", comentarios: "" });
  const [tiempoIngresoPlanta, setTiempoIngresoPlanta] = useState({ hora: "", comentarios: "" });
  const [tiempoEntradaBascula, setTiempoEntradaBascula] = useState({ hora: "", comentarios: "" });
  const [tiempoSalidaBascula, setTiempoSalidaBascula] = useState({ hora: "", comentarios: "" });

  // ----------------------------------------------------------------
  // useEffect: Cargar/crear "demorasProcess" en localStorage
  // ----------------------------------------------------------------
  useEffect(() => {
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

        setTiempoPrechequeo(p.tiempoPrechequeo || { hora: "", comentarios: "" });
        setTiempoScanner(p.tiempoScanner || { hora: "", comentarios: "" });
        setTiempoAutorizacion(p.tiempoAutorizacion || { hora: "", comentarios: "" });
        setTiempoIngresoPlanta(p.tiempoIngresoPlanta || { hora: "", comentarios: "" });
        setTiempoEntradaBascula(p.tiempoEntradaBascula || { hora: "", comentarios: "" });
        setTiempoSalidaBascula(p.tiempoSalidaBascula || { hora: "", comentarios: "" });
      }
    }
  }, []);

  // ----------------------------------------------------------------
  // Helper: Asignar "Ahora" a un campo (en formato HH:mm:ss) con step="1"
  // ----------------------------------------------------------------
  const handleSetNow = (setter) => {
    const now = new Date();
    // Convertir a HH:mm:ss
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const hora = `${hh}:${mm}:${ss}`;

    setter((prev) => ({ ...prev, hora }));
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

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-4 px-2 sm:px-4 text-slate-900">
      <div className="w-full max-w-2xl sm:max-w-4xl bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center mb-4">
          <div className="flex-1 bg-orange-500 text-white font-semibold py-2 px-4">
            Paso 1 de 4
          </div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center rounded-l-lg">
            Paso 2
          </div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center">Paso 3</div>
          <div className="flex-1 bg-gray-200 py-2 px-4 text-center rounded-r-lg">
            Paso 4
          </div>
        </div>

        <h2 className="text-lg sm:text-xl font-bold mb-4 text-orange-600 text-center sm:text-left">
          Primer Proceso
        </h2>

        {/* Campos Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Terminal */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Terminal</label>
            <select
              className="border w-full p-2 text-sm sm:text-base"
              value={terminal}
              onChange={(e) => setTerminal(e.target.value)}
            >
              <option disabled value="">Seleccione Terminal</option>
              <option value="Terminal 1">Terminal 1</option>
              <option value="Terminal 2">Terminal 2</option>
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Cliente</label>
            <select
            className="border w-full p-2 text-sm sm:text-base"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            >
            <option disabled value="">Seleccione Cliente</option>
            <option value="ADM EL SALVADOR LTDA DE C.V.">ADM EL SALVADOR LTDA DE C.V.</option>
            <option value="AGROINDUSTRIAS BUENAVISTA, S.A. DE C.V.">AGROINDUSTRIAS BUENAVISTA, S.A. DE C.V.</option>
            <option value="AGROPECUARIA DEL VALLE, S.A. DE C.V.">AGROPECUARIA DEL VALLE, S.A. DE C.V.</option>
            <option value="AVICOLA CAMPESTRE, S.A. DE C.V.">AVICOLA CAMPESTRE, S.A. DE C.V.</option>
            <option value="AVICOLA DEL SUR/PROSALCO">AVICOLA DEL SUR/PROSALCO</option>
            <option value="AVICOLA SALAZAR">AVICOLA SALAZAR</option>
            <option value="AVICOLA SAN BENITO, S.A. DE C.V.">AVICOLA SAN BENITO, S.A. DE C.V.</option>
            <option value="AVICULTOR Y PORCINOCULTORES S.A. DE C.V.">AVICULTOR Y PORCINOCULTORES S.A. DE C.V.</option>
            <option value="COOP. GANADERA DE SONSONATE">COOP. GANADERA DE SONSONATE</option>
            <option value="EL GRANJERO, S.A. DE C.V.">EL GRANJERO, S.A. DE C.V.</option>
            <option value="GRANJA CATALANA, S.A. DE C.V.">GRANJA CATALANA, S.A. DE C.V.</option>
            <option value="IMPORTADORES AGROPECUARIOS">IMPORTADORES AGROPECUARIOS</option>
            <option value="IMPORTADORES AGROPECUARIOS, S.A. DE C.V.">IMPORTADORES AGROPECUARIOS, S.A. DE C.V.</option>
            <option value="MARTIR VICTOR ANTONIO DERAS FLORES">MARTIR VICTOR ANTONIO DERAS FLORES</option>
            <option value="MONICA GROSS">MONICA GROSS</option>
            <option value="PRODUCTOS ALIMENTICIOS BOCADELI, S.A. DE C.V.">PRODUCTOS ALIMENTICIOS BOCADELI, S.A. DE C.V.</option>
            <option value="PRODUCTOS ALIMENTICIOS DIANA, S.A.">PRODUCTOS ALIMENTICIOS DIANA, S.A.</option>
            <option value="PRODUCTOS ALIMENTICIOS SELLO DE ORO, S.A. DE C.V.">PRODUCTOS ALIMENTICIOS SELLO DE ORO, S.A. DE C.V.</option>
            <option value="PROSALCO">PROSALCO</option>
            <option value="RAFAEL ANDRES JOVEL MIRANDA">RAFAEL ANDRES JOVEL MIRANDA</option>
            <option value="SALOMON GROSS">SALOMON GROSS</option>
            <option value="SARAM">SARAM</option>
            <option value="TIERRA FERTIL">TIERRA FERTIL</option>
            <option value="WALTER HERNANDEZ">WALTER HERNANDEZ</option>
            </select>

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
            <select
              className="border w-full p-2 text-sm sm:text-base"
              value={ejes}
              onChange={(e) => setEjes(e.target.value)}
            >
              <option value="">Seleccione Ejes</option>
              <option value="Camión">Camión</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
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
            <select
            className="border w-full p-2 text-sm sm:text-base"
            value={tipoProducto}
            onChange={(e) => setTipoProducto(e.target.value)}
            >
            <option disabled value="">Seleccione Producto</option>
            <option value="ACEITE ACIDULADO DE SOYA">ACEITE ACIDULADO DE SOYA</option>
            <option value="ACEITE DE SOYA">ACEITE DE SOYA</option>
            <option value="ACEITE DESGOMADO">ACEITE DESGOMADO</option>
            <option value="AFRECHO">AFRECHO</option>
            <option value="ARROZ EN GRANZA">ARROZ EN GRANZA</option>
            <option value="CASCARILLA DE SOYA">CASCARILLA DE SOYA</option>
            <option value="HARINA DE SOYA">HARINA DE SOYA</option>
            <option value="MAIZ AMARILLO">MAIZ AMARILLO</option>
            <option value="MAIZ AMARILLO BRASILEÑO">MAIZ AMARILLO BRASILEÑO</option>
            <option value="MAIZ BLANCO">MAIZ BLANCO</option>
            <option value="MAIZ DESTILADO">MAIZ DESTILADO</option>
            <option value="MALTA">MALTA</option>
            <option value="TRIGO">TRIGO</option>
            </select>
          </div>

          {/* Punto de Despacho */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Punto de Despacho
            </label>
            <select
            className="border w-full p-2 text-sm sm:text-base"
            value={puntoDespacho}
            onChange={(e) => setPuntoDespacho(e.target.value)}
            >
            <option disabled value="">Seleccione Punto</option>
            <optgroup label="Bodegas">
                <option value="BODEGA 1 PUERTA 1">BODEGA 1 PUERTA 1</option>
                <option value="BODEGA 1 PUERTA 2">BODEGA 1 PUERTA 2</option>
                <option value="BODEGA 1 PUERTA 3">BODEGA 1 PUERTA 3</option>
                <option value="BODEGA 2 PUERTA 1">BODEGA 2 PUERTA 1</option>
                <option value="BODEGA 2 PUERTA 2">BODEGA 2 PUERTA 2</option>
                <option value="BODEGA 3 PUERTA 1">BODEGA 3 PUERTA 1</option>
                <option value="BODEGA 3 PUERTA 2">BODEGA 3 PUERTA 2</option>
                <option value="BODEGA 4 PUERTA 1">BODEGA 4 PUERTA 1</option>
                <option value="BODEGA 4 PUERTA 3">BODEGA 4 PUERTA 3</option>
                <option value="BODEGA 5 PUERTA 1">BODEGA 5 PUERTA 1</option>
                <option value="BODEGA 6 PUERTA 3">BODEGA 6 PUERTA 3</option>
            </optgroup>
            <optgroup label="Silos">
                <option value="SILO 1 GRAVEDAD">SILO 1 GRAVEDAD</option>
                <option value="SILO 1 SISTEMA">SILO 1 SISTEMA</option>
                <option value="SILO 1 CADENA MOVIL">SILO 1 CADENA MOVIL</option>
                <option value="SILO 2 GRAVEDAD">SILO 2 GRAVEDAD</option>
                <option value="SILO 2 SISTEMA">SILO 2 SISTEMA</option>
                <option value="SILO 2 CADENA MOVIL">SILO 2 CADENA MOVIL</option>
                <option value="SILO 3 GRAVEDAD">SILO 3 GRAVEDAD</option>
                <option value="SILO 3 SISTEMA">SILO 3 SISTEMA</option>
                <option value="SILO 3 CADENA MOVIL">SILO 3 CADENA MOVIL</option>
                <option value="SILO 4 GRAVEDAD">SILO 4 GRAVEDAD</option>
                <option value="SILO 4 SISTEMA">SILO 4 SISTEMA</option>
                <option value="SILO 4 CADENA MOVIL">SILO 4 CADENA MOVIL</option>
                <option value="SILO 5 SISTEMA">SILO 5 SISTEMA</option>
                <option value="SILO 6 SISTEMA">SILO 6 SISTEMA</option>
                <option value="SILO 7 SISTEMA INDIVIDUAL">SILO 7 SISTEMA INDIVIDUAL</option>
                <option value="SILO 7 SISTEMA">SILO 7 SISTEMA</option>
                <option value="SILO 8 SISTEMA INDIVIDUAL">SILO 8 SISTEMA INDIVIDUAL</option>
                <option value="SILO 8 SISTEMA">SILO 8 SISTEMA</option>
                <option value="SILO 9 GRAVEDAD">SILO 9 GRAVEDAD</option>
                <option value="SILO 9 SISTEMA">SILO 9 SISTEMA</option>
                <option value="SILO 10 SISTEMA">SILO 10 SISTEMA</option>
                <option value="SILO 11 SISTEMA">SILO 11 SISTEMA</option>
                <option value="SILO 12 SISTEMA">SILO 12 SISTEMA</option>
                <option value="SILO 13 SISTEMA">SILO 13 SISTEMA</option>
                <option value="SILO 14 SISTEMA">SILO 14 SISTEMA</option>
                <option value="SILO 15 SISTEMA">SILO 15 SISTEMA</option>
                <option value="SILO 16 SISTEMA">SILO 16 SISTEMA</option>
                <option value="SILO 17 SISTEMA">SILO 17 SISTEMA</option>
            </optgroup>
            </select>
          </div>

          {/* Báscula de Entrada */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Báscula de Entrada
            </label>
            <select
              className="border w-full p-2 text-sm sm:text-base"
              value={basculaEntrada}
              onChange={(e) => setBasculaEntrada(e.target.value)}
            >
              <option disabled value="">Seleccione Báscula</option>
              <option value="Báscula 1">Báscula 1</option>
              <option value="Báscula 2">Báscula 2</option>
              <option value="Báscula 3">Báscula 3</option>
              <option value="Báscula 4">Báscula 4</option>
              <option value="Báscula 5">Báscula 5</option>
              <option value="Báscula 6">Báscula 6</option>
            </select>
          </div>

          {/* Tipo de Carga */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">Tipo de Carga</label>
            <select
              className="border w-full p-2 text-sm sm:text-base"
              value={tipoCarga}
              onChange={(e) => setTipoCarga(e.target.value)}
            >
              <option value="">Seleccione Tipo</option>
              <option value="Granel">Granel</option>
              <option value="Envasado">Envasado</option>
            </select>
          </div>

          {/* Método de Carga */}
          <div>
            <label className="block font-semibold mb-1 text-sm sm:text-base">
              Método de Carga
            </label>
            <select
              className="border w-full p-2 text-sm sm:text-base"
              value={metodoCarga}
              onChange={(e) => setMetodoCarga(e.target.value)}
            >
              <option value="">Seleccione Metodo</option>
              <option value="Cabaleo">Cabaleo</option>
              <option value="Carga Máxima">Carga Máxima</option>
            </select>
          </div>
        </div>

        {/* Tiempos */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Tiempos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prechequeo */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Tiempo Prechequeo
              </label>
              <div className="flex gap-2 mt-1">
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
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoPrechequeo.comentarios}
                onChange={(e) =>
                  setTiempoPrechequeo((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>

            {/* Scanner */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">Tiempo Scanner</label>
              <div className="flex gap-2 mt-1">
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
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoScanner.comentarios}
                onChange={(e) =>
                  setTiempoScanner((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>

            {/* Autorización */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Tiempo Autorización
              </label>
              <div className="flex gap-2 mt-1">
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
                className="border w-full mt-1 p-1 text-xs sm:text-sm"
                placeholder="Comentarios..."
                value={tiempoAutorizacion.comentarios}
                onChange={(e) =>
                  setTiempoAutorizacion((prev) => ({ ...prev, comentarios: e.target.value }))
                }
              />
            </div>

            {/* Ingreso Planta */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Tiempo Ingreso de Planta
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
                Tiempo Entrada Báscula
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
                  setTiempoEntradaBascula((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>

            {/* Salida Báscula */}
            <div className="border rounded p-2">
              <label className="block font-semibold text-sm sm:text-base">
                Tiempo Salida Báscula
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
                  setTiempoSalidaBascula((prev) => ({
                    ...prev,
                    comentarios: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-2">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded text-sm sm:text-base"
            onClick={handleCancelar}
          >
            Cancelar
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm sm:text-base"
            onClick={handleGuardarYContinuar}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
