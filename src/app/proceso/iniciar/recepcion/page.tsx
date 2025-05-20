"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal, { SweetAlertIcon } from "sweetalert2";
import dynamic from "next/dynamic";
import { FiTrash2, FiEdit, FiRefreshCw } from "react-icons/fi";

const Select = dynamic(() => import("react-select"), { ssr: false });

interface OptionType { value: string | number; label: string; }

type Operacion = {
  ticket: string;
  transporte: string;
  placa: string;
  motorista: string;
  horaInicio: string;
  horaFinal: string;
  tiempoTotal: string;
  observaciones: string;
};

type BitacoraData = {
  id: number | null;
  nombreBarco: string;
  producto: string;
  fecha: string;
  hora: string;
  chequero: string;
  turnoInicio: string;
  turnoFin: string;
  puntoCarga: string;
  puntoDescarga: string;
  bitacoras: Operacion[];
};

type BarcoDetail = {
  id: number;
  vaporBarco: string;
  productos: string[];
  puntosDescarga: string[];
  transportes: {
    id: number;
    nombre: string;
    motoristas: { placa: string; nombre: string }[];
  }[];
};

const TIME_ZONE = "America/El_Salvador";
function nowDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}
function nowTime() {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: TIME_ZONE,
    hour12: false,
  });
}
function diffTime(start: string, end: string) {
  if (!start || !end) return "00:00:00";
  const toSec = (t: string) => {
    const [h, m, s = "0"] = t.split(":");
    return +h * 3600 + +m * 60 + +s;
  };
  const d = toSec(end) - toSec(start);
  if (d < 0) return "00:00:00";
  const hh = String(Math.floor(d / 3600)).padStart(2, "0");
  const mm = String(Math.floor((d % 3600) / 60)).padStart(2, "0");
  const ss = String(d % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function Bitacora() {
  const router = useRouter();

  // Dropdown de barcos
  const [barcos, setBarcos] = useState<BarcoDetail[]>([]);
  const [selectedBarco, setSelectedBarco] = useState<BarcoDetail | null>(null);

  // Opciones selects
  const [optsProductos, setOptsProductos] = useState<OptionType[]>([]);
  const [optsPuntos, setOptsPuntos] = useState<OptionType[]>([]);
  const [optsTransportes, setOptsTransportes] = useState<OptionType[]>([]);
  const [optsPlacas, setOptsPlacas] = useState<OptionType[]>([]);
  const [currentMotoristas, setCurrentMotoristas] = useState<
    { nombre: string; placa: string }[]
  >([]);

  // Estado bitácora general
  const [bitacora, setBitacora] = useState<BitacoraData>({
    id: null,
    nombreBarco: "",
    producto: "",
    fecha: nowDate(),
    hora: nowTime(),
    chequero: "",
    turnoInicio: "",
    turnoFin: "",
    puntoCarga: "",
    puntoDescarga: "NO APLICA",
    bitacoras: [],
  });

  // Estado operación individual
  const [op, setOp] = useState<Operacion>({
    ticket: "",
    transporte: "",
    placa: "",
    motorista: "",
    horaInicio: "",
    horaFinal: "",
    tiempoTotal: "",
    observaciones: "",
  });
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Animación refresco
  const [isRefreshing, setIsRefreshing] = useState(false);

  // -- Persistencia + fetch inicial: siempre cargar lo guardado en localStorage --
  useEffect(() => {
    fetchBarcos();

    // Restaurar bitácora completa
    const savedBit = localStorage.getItem("bitacora");
    if (savedBit) {
      const parsed: BitacoraData = JSON.parse(savedBit);
      setBitacora(parsed);
      if (parsed.id != null) {
        fetchBarcoDetail(parsed.id, true);
      }
    }

    // Restaurar op y editIdx
    const savedOp = localStorage.getItem("op");
    if (savedOp) {
      setOp(JSON.parse(savedOp));
    }
    const savedIdx = localStorage.getItem("editIdx");
    if (savedIdx) {
      setEditIdx(Number(savedIdx));
    }

    // Chequero
    setBitacora(b => ({
      ...b,
      chequero: localStorage.getItem("userNameAll") || "",
    }));
  }, []);

  // Guardar cambios
  useEffect(() => {
    localStorage.setItem("bitacora", JSON.stringify(bitacora));
  }, [bitacora]);
  useEffect(() => {
    localStorage.setItem("op", JSON.stringify(op));
  }, [op]);
  useEffect(() => {
    if (editIdx == null) localStorage.removeItem("editIdx");
    else localStorage.setItem("editIdx", String(editIdx));
  }, [editIdx]);

  // Interceptar salida accidental / botón Atrás (sin borrar localStorage)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const handlePopState = () => {
      Swal.fire({
        title: "¿Estás seguro?",
        text: "Si retrocedes, perderás los cambios no guardados.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Quedarme",
        cancelButtonText: "Salir",
      }).then(result => {
        if (!result.isConfirmed) {
          window.removeEventListener("beforeunload", handleBeforeUnload);
          router.back();
        } else {
          window.history.pushState(null, document.title, window.location.href);
        }
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  // Repoblar placas si transporte u barco cambian
  useEffect(() => {
    if (selectedBarco && op.transporte) {
      const t = selectedBarco.transportes.find(x => x.nombre === op.transporte);
      if (t) {
        setCurrentMotoristas(t.motoristas);
        setOptsPlacas(t.motoristas.map(m => ({ value: m.placa, label: m.placa })));
      }
    }
  }, [selectedBarco, op.transporte]);

  // Fetch barcos
  async function fetchBarcos() {
    try {
      const res = await fetch("/api/recepcion/barcos");
      const json = await res.json();
      setBarcos(json.data || []);
    } catch {
      Swal.fire("Error", "No se pudo cargar barcos", "error");
    }
  }

  // Fetch detalle barco
  async function fetchBarcoDetail(id: number, keepLogs: boolean) {
    try {
      const res = await fetch(`/api/recepcion/bitacoras/${id}`);
      const { data } = await res.json();
      const detalle: BarcoDetail = {
        id: data.id,
        vaporBarco: data.vaporBarco,
        productos: data.productos,
        puntosDescarga: data.puntosDescarga,
        transportes: data.transportes,
      };
      setSelectedBarco(detalle);

      setOptsProductos(detalle.productos.map(p => ({ value: p, label: p })));
      setOptsPuntos(
        [...detalle.puntosDescarga, "NO APLICA"].map(p => ({
          value: p,
          label: p,
        }))
      );
      setOptsTransportes(
        detalle.transportes.map(t => ({ value: t.id, label: t.nombre }))
      );

      if (!keepLogs) {
        setOp({
          ticket: "",
          transporte: "",
          placa: "",
          motorista: "",
          horaInicio: "",
          horaFinal: "",
          tiempoTotal: "",
          observaciones: "",
        });
        setEditIdx(null);
      }

      setOptsPlacas([]);
      setCurrentMotoristas([]);

      setBitacora(b => ({
        ...b,
        nombreBarco: detalle.vaporBarco,
        producto: keepLogs ? b.producto : data.producto || "",
        turnoInicio: keepLogs ? b.turnoInicio : data.turnoInicio || "",
        turnoFin: keepLogs ? b.turnoFin : data.turnoFin || "",
        puntoCarga: keepLogs ? b.puntoCarga : data.puntoCarga || "",
        puntoDescarga: keepLogs ? b.puntoDescarga : data.puntoDescarga || "NO APLICA",
        bitacoras: keepLogs ? b.bitacoras : data.bitacoras || [],
      }));
    } catch {
      Swal.fire("Error", "No se pudo cargar datos del barco", "error");
    }
  }

  // Cambio de barco
  function onBarcoChange(opt: OptionType | null) {
    const newId = opt ? Number(opt.value) : null;
    if (
      bitacora.id != null &&
      newId !== bitacora.id &&
      bitacora.bitacoras.length > 0
    ) {
      Swal.fire({
        title: "¿Desea conservar las bitacoras?",
        text: "Si las conserva, deberá actualizarlas manualmente.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, conservar", 
        cancelButtonText: "No, vaciar",
      }).then(result => {
        if (result.isConfirmed) {
          setBitacora(b => ({ ...b, id: newId! }));
          Swal.fire({
            title: "Cargando datos...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });
          fetchBarcoDetail(newId!, true)
            .finally(() => {
              Swal.fire("Actualice las bitacoras existentes", "", "info");
            });
        } else {
          setBitacora(b => ({ ...b, id: newId!, bitacoras: [] }));
          Swal.fire({
            title: "Cargando datos...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });
          fetchBarcoDetail(newId!, false)
            .finally(() => {
              Swal.close();
            });
        }
      });
    } else {
      setBitacora(b => ({ ...b, id: newId, bitacoras: [] }));
      if (newId != null) {
        Swal.fire({
          title: "Cargando datos...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
        fetchBarcoDetail(newId, false)
          .finally(() => {
            Swal.close();
          });
      } else {
        setSelectedBarco(null);
        setOptsProductos([]);
        setOptsPuntos([]);
      }
    }
  }

  // Campos bitacora
  function onProductoChange(opt: OptionType | null) {
    setBitacora(b => ({ ...b, producto: (opt?.value as string) || "" }));
  }
  function onPuntoChange(opt: OptionType | null) {
    const v = (opt?.value as string) || "";
    setBitacora(b => ({
      ...b,
      puntoDescarga: v,
      puntoCarga: v && v !== "NO APLICA" ? "NO APLICA" : "",
    }));
  }
  function onPuntoCargaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase();
    setBitacora(b => ({
      ...b,
      puntoCarga: v,
      puntoDescarga: v ? "NO APLICA" : "",
    }));
  }

  // Transporte / Placa
  function onOpTransporteChange(opt: OptionType | null) {
    if (!opt || !selectedBarco) {
      setOp(o => ({ ...o, transporte: "", placa: "", motorista: "" }));
      setOptsPlacas([]);
      setCurrentMotoristas([]);
      return;
    }
    const tId = Number(opt.value);
    const trans = selectedBarco.transportes.find(t => t.id === tId)!;
    setCurrentMotoristas(trans.motoristas);
    setOptsPlacas(trans.motoristas.map(m => ({ value: m.placa, label: m.placa })));
    setOp(o => ({ ...o, transporte: trans.nombre, placa: "", motorista: "" }));
  }
  function onOpPlacaChange(opt: OptionType | null) {
    const placa = (opt?.value as string) || "";
    const m = currentMotoristas.find(x => x.placa === placa);
    setOp(o => ({ ...o, placa, motorista: m?.nombre || "" }));
  }

  // Agregar o actualizar registro
  function addOrUpdateOp() {
    const { ticket, transporte, placa, horaInicio, horaFinal } = op;
    if (!ticket || !transporte || !placa) {
      return Swal.fire("Error", "Rellena Ticket, Transporte y Placa", "warning");
    }
    if (!horaInicio || !horaFinal) {
      return Swal.fire("Error", "Completa horas", "warning");
    }
    if (horaFinal < horaInicio) {
      return Swal.fire(
        "Error",
        "La hora final no puede ser menor que la de inicio",
        "warning"
      );
    }
    const nueva = { ...op, tiempoTotal: diffTime(horaInicio, horaFinal) };
    setBitacora(b => {
      const arr = [...b.bitacoras];
      if (editIdx != null) arr[editIdx] = nueva;
      else arr.push(nueva);
      return { ...b, bitacoras: arr };
    });
    setOp({
      ticket: "",
      transporte: "",
      placa: "",
      motorista: "",
      horaInicio: "",
      horaFinal: "",
      tiempoTotal: "",
      observaciones: "",
    });
    setEditIdx(null);
  }

  // Borrar registro
  function confirmDeleteOp(i: number) {
    Swal.fire({
      title: "¿Eliminar esta bitácora?",
      text: "Esta acción no se puede revertir.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(res => {
      if (res.isConfirmed) {
        setBitacora(b => ({
          ...b,
          bitacoras: b.bitacoras.filter((_, idx) => idx !== i),
        }));
      }
    });
  }

  // Generar nota legible
  function generarNota() {
    const lines: string[] = [];
    lines.push("===== RESUMEN DE BITÁCORA =====");
    lines.push(`Fecha         : ${bitacora.fecha}`);
    lines.push(`Hora          : ${bitacora.hora}`);
    lines.push(`Barco         : ${bitacora.nombreBarco} (ID: ${bitacora.id ?? "-"})`);
    lines.push(`Chequero      : ${bitacora.chequero}`);
    lines.push(`Turno         : ${bitacora.turnoInicio} → ${bitacora.turnoFin}`);
    lines.push(`Producto      : ${bitacora.producto}`);
    lines.push(`Pto. Carga    : ${bitacora.puntoCarga}`);
    lines.push(`Pto. Descarga : ${bitacora.puntoDescarga}`);
    lines.push("");
    lines.push("----- Operaciones -----");
    bitacora.bitacoras.forEach((it, i) => {
      lines.push(` ${i + 1}) Ticket       : ${it.ticket}`);
      lines.push(`    Transporte   : ${it.transporte}`);
      lines.push(`    Placa        : ${it.placa}`);
      lines.push(`    Motorista    : ${it.motorista}`);
      lines.push(`    Horas        : ${it.horaInicio} → ${it.horaFinal}  [Total: ${it.tiempoTotal}]`);
      lines.push(`    Observaciones: ${it.observaciones}`);
      lines.push("");
    });
    if (editIdx != null) {
      lines.push("----- Operación en edición -----");
      lines.push(` Ticket       : ${op.ticket}`);
      lines.push(` Transporte   : ${op.transporte}`);
      lines.push(` Placa        : ${op.placa}`);
      lines.push(` Motorista    : ${op.motorista}`);
      lines.push(` Horas        : ${op.horaInicio} → ${op.horaFinal}  [Total: ${op.tiempoTotal}]`);
      lines.push(` Observaciones: ${op.observaciones}`);
      lines.push("");
    }
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bitacora_${bitacora.fecha}_${bitacora.nombreBarco || "nota"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Helper para confirmaciones con 'Generar Nota'
  function showModal(
    title: string,
    text: string,
    icon: SweetAlertIcon,
    onConfirm: () => void,
    onCancel: () => void
  ) {
    Swal.fire({
      title,
      text,
      icon,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Sí, Confirmar",
      cancelButtonText: "No, Cancelar",
      denyButtonText: "Generar Nota",
      customClass: {
        actions: "grid grid-cols-2 grid-rows-2 gap-2",
        denyButton: "bg-green-600 col-span-2 row-start-1",
        confirmButton: "bg-blue-600 row-start-2 col-start-1",
        cancelButton: "bg-red-600 row-start-2 col-start-2",
      },
    }).then(res => {
      if (res.isDenied) {
        generarNota();
      } else if (res.isConfirmed) {
        onConfirm();
      } else {
        onCancel();
      }
    });
  }

  // Cancelar todo
  function handleCancel() {
    showModal(
      "¿Está seguro?",
      "Se perderán los cambios realizados. Esta acción no se puede revertir",
      "warning",
      () => {
        localStorage.removeItem("bitacora");
        localStorage.removeItem("op");
        localStorage.removeItem("editIdx");
        router.push("/proceso/iniciar");
      },
      () => {}
    );
  }

  // Enviar final
  function terminarTurno() {
    const {
      id,
      producto,
      turnoInicio,
      turnoFin,
      bitacoras,
      puntoDescarga,
      puntoCarga,
    } = bitacora;
    if (puntoDescarga === "NO APLICA" && !puntoCarga) {
      return Swal.fire("Error", "Selecciona un punto de descarga", "warning");
    }
    if (!id) return Swal.fire("Error", "Selecciona un barco", "warning");
    if (!producto) return Swal.fire("Error", "Selecciona un producto", "warning");
    if (!turnoInicio || !turnoFin)
      return Swal.fire("Error", "Define turno inicio y fin", "warning");
    if (bitacoras.length === 0)
      return Swal.fire("Error", "Agrega al menos una bitácora", "warning");

    showModal(
      "¿Terminar turno?",
      "Enviar datos y terminar. Esta acción no se puede revertir.",
      "warning",
      () => {
        Swal.fire({ title: "Procesando solicitud...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        fetch("/api/recepcion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcoId: id,
            userId: localStorage.getItem("userId"),
            fecha: bitacora.fecha,
            hora: bitacora.hora,
            producto,
            nombreBarco: bitacora.nombreBarco,
            chequero: bitacora.chequero,
            turnoInicio,
            turnoFin,
            puntoCarga: bitacora.puntoCarga || null,
            puntoDescarga: bitacora.puntoDescarga,
            bitacoras,
          }),
        })
          .then(r => {
            Swal.close();
            if (r.ok) {
              Swal.fire("Éxito", "Datos guardados", "success");
              localStorage.removeItem("bitacora");
              localStorage.removeItem("op");
              localStorage.removeItem("editIdx");
              router.push("/proceso/iniciar");
            } else Swal.fire("Error", "No se pudo guardar", "error");
          })
          .catch(() => Swal.fire("Error", "Error de red", "error"));
      },
      () => {}
    );
  }

  // Refrescar datos
  async function handleRefreshClick() {
    if (!bitacora.id) {
      return Swal.fire("Error", "Seleccione un barco primero", "warning");
    }

    try {
      setIsRefreshing(true);
      await fetchBarcoDetail(bitacora.id, true);
      Swal.fire("Éxito", "Datos actualizados correctamente", "success");
    } catch {
      Swal.fire("Error", "No se pudieron actualizar los datos", "error");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#003E9B] px-4 py-6 text-white">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-between gap-4">
          <img src="/logo.png" alt="ALMAPAC" className="h-12 sm:h-16 w-auto object-contain" />
          <h1 className="text-xl sm:text-2xl font-bold text-center uppercase">
            RECEPCIÓN Y TRASLADO DE CEREALES
          </h1>
          <div className="w-full flex items-center justify-end">
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="w-full sm:w-auto sm:absolute sm:right-4 sm:top-4 flex items-center justify-center gap-2 p-3 sm:p-2 rounded bg-blue-700 hover:bg-blue-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              aria-label="Actualizar datos del barco"
            >
              <FiRefreshCw className={`text-white text-xl ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 space-y-6">

        {/* Formulario Principal */}
        <section className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block mb-1 font-semibold">Vapor / Barco</label>
            <Select
              options={barcos.map(b => ({ value: b.id, label: b.vaporBarco }))}
              value={bitacora.id != null ? { value: bitacora.id, label: bitacora.nombreBarco } : null}
              onChange={onBarcoChange}
              placeholder="Selecciona barco..."
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Chequero</label>
            <input readOnly value={bitacora.chequero} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Fecha</label>
            <input readOnly type="date" value={bitacora.fecha} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Hora</label>
            <input readOnly type="time" value={bitacora.hora} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Turno Inicio</label>
            <input
              type="time"
              value={bitacora.turnoInicio}
              onChange={e => setBitacora(b => ({ ...b, turnoInicio: e.target.value }))}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Turno Fin</label>
            <input
              type="time"
              value={bitacora.turnoFin}
              onChange={e => setBitacora(b => ({ ...b, turnoFin: e.target.value }))}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Producto</label>
            <Select
              options={optsProductos}
              value={optsProductos.find(o => o.value === bitacora.producto) || null}
              onChange={onProductoChange}
              placeholder="Selecciona producto..."
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Punto de Descarga</label>  
            <Select
              options={optsPuntos}
              value={optsPuntos.find(o => o.value === bitacora.puntoDescarga) || null}
              onChange={onPuntoChange}
              placeholder="Selecciona punto..."
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Punto de Carga</label>
            <input
              type="text"
              value={bitacora.puntoCarga}
              onChange={onPuntoCargaChange}
              className="w-full border rounded p-2"
            />
          </div>
        </section>

        {/* Formulario Bitácoras */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold text-lg mb-4">Bitácoras</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Ticket Autorización</label>
              <input
                type="number"
                value={op.ticket}
                onChange={e => setOp({ ...op, ticket: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Transporte</label>
              <Select
                options={optsTransportes}
                value={optsTransportes.find(o => o.label === op.transporte) || null}
                onChange={onOpTransporteChange}
                placeholder="Selecciona transporte..."
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Placa</label>
              <Select
                options={optsPlacas}
                value={optsPlacas.find(o => o.value === op.placa) || null}
                onChange={onOpPlacaChange}
                isDisabled={!optsPlacas.length}
                placeholder={optsPlacas.length ? "Selecciona placa..." : "Seleccione transporte primero"}
                noOptionsMessage={() =>
                  optsPlacas.length ? "Sin placas" : "Seleccione transporte primero"
                }
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Motorista</label>
              <input
                readOnly
                value={op.motorista}
                className="w-full border rounded p-2"
                placeholder="Se carga al elegir placa"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Hora Inicio</label>
              <div className="flex">
                <input
                  type="time"
                  step={1}
                  value={op.horaInicio}
                  onChange={e =>
                    setOp({
                      ...op,
                      horaInicio: e.target.value,
                      tiempoTotal: diffTime(e.target.value, op.horaFinal),
                    })
                  }
                  className="w-full border rounded p-2"
                />
                <button
                  onClick={() =>
                    setOp({
                      ...op,
                      horaInicio: nowTime(),
                      tiempoTotal: diffTime(nowTime(), op.horaFinal),
                    })
                  }
                  className="ml-2 px-2 bg-blue-600 text-white rounded"
                >
                  Ahora
                </button>
              </div>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Hora Final</label>
              <div className="flex">
                <input
                  type="time"
                  step={1}
                  value={op.horaFinal}
                  onChange={e => {
                    if (op.horaInicio && e.target.value < op.horaInicio) {
                      Swal.fire("Error", "La hora final no puede ser menor", "warning");
                      return;
                    }
                    setOp({
                      ...op,
                      horaFinal: e.target.value,
                      tiempoTotal: diffTime(op.horaInicio, e.target.value),
                    });
                  }}
                  className="w-full border rounded p-2"
                />
                <button
                  onClick={() => {
                    const now = nowTime();
                    if (op.horaInicio && now < op.horaInicio) {
                      Swal.fire("Error", "La hora final no puede ser menor", "warning");
                      return;
                    }
                    setOp({
                      ...op,
                      horaFinal: now,
                      tiempoTotal: diffTime(op.horaInicio, now),
                    });
                  }}
                  className="ml-2 px-2 bg-blue-600 text-white rounded"
                >
                  Ahora
                </button>
              </div>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Tiempo Total</label>
              <input
                readOnly
                value={op.tiempoTotal}
                className="w-full border rounded p-2 bg-gray-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1 font-semibold">Observaciones</label>
              <textarea
                rows={2}
                value={op.observaciones}
                onChange={e => setOp({ ...op, observaciones: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            {editIdx != null && (
              <button
                onClick={() => {
                  setOp({
                    ticket: "",
                    transporte: "",
                    placa: "",
                    motorista: "",
                    horaInicio: "",
                    horaFinal: "",
                    tiempoTotal: "",
                    observaciones: "",
                  });
                  setEditIdx(null);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancelar
              </button>
            )}
            <button onClick={addOrUpdateOp} className="px-4 py-2 bg-blue-600 text-white rounded">
              {editIdx != null ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </section>

        {/* Tabla de bitácoras */}
        <section className="bg-white p-6 rounded shadow overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "Ticket",
                  "Transporte",
                  "Placa",
                  "Motorista",
                  "Inicio",
                  "Final",
                  "Total",
                  "Observaciones",
                  "Acción",
                ].map(h => (
                  <th key={h} className="border p-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bitacora.bitacoras.map((r, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 whitespace-nowrap">{r.ticket}</td>
                  <td className="p-2 whitespace-nowrap">{r.transporte}</td>
                  <td className="p-2 whitespace-nowrap">{r.placa}</td>
                  <td className="p-2 whitespace-nowrap">{r.motorista}</td>
                  <td className="p-2 whitespace-nowrap">{r.horaInicio}</td>
                  <td className="p-2 whitespace-nowrap">{r.horaFinal}</td>
                  <td className="p-2 whitespace-nowrap">{r.tiempoTotal}</td>
                  <td className="p-2 whitespace-nowrap">{r.observaciones}</td>
                  <td className="p-2 flex justify-center gap-4">
                    <FiEdit className="cursor-pointer text-green-600 text-2xl" onClick={() => { setOp(r); setEditIdx(i); }} />
                    <FiTrash2 className="cursor-pointer text-red-600 text-2xl" onClick={() => confirmDeleteOp(i)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Botones finales */}
        <div className="flex justify-between">
          <button onClick={handleCancel} className="px-6 py-2 bg-red-600 text-white rounded">
            Cancelar
          </button>
          <button onClick={terminarTurno} className="px-6 py-2 bg-green-600 text-white rounded">
            Terminar turno
          </button>
        </div>
      </main>
    </div>
  );
}
