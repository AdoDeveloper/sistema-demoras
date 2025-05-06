"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal, { SweetAlertIcon } from "sweetalert2";
import dynamic from "next/dynamic";
import { FiTrash2, FiEdit, FiRefreshCw, FiLoader } from "react-icons/fi";

const CreatableSelect = dynamic(
  () => import("react-select/creatable"),
  { ssr: false }
);

interface OptionType {
  value: string | number;
  label: string;
}

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
  id: number | null; // ID de la recepción
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

export default function EditRecepcionPage() {
  const router = useRouter();
  const recepcionId =
    typeof window !== "undefined"
      ? localStorage.getItem("recepcionId")
      : null;

  const [loading, setLoading] = useState(true);
  const [barcos, setBarcos] = useState<BarcoDetail[]>([]);
  const [selectedBarco, setSelectedBarco] = useState<BarcoDetail | null>(null);

  const [optsProductos, setOptsProductos] = useState<OptionType[]>([]);
  const [optsPuntos, setOptsPuntos] = useState<OptionType[]>([]);
  const [optsTransportes, setOptsTransportes] = useState<OptionType[]>([]);
  const [optsPlacas, setOptsPlacas] = useState<OptionType[]>([]);
  const [currentMotoristas, setCurrentMotoristas] = useState<
    { nombre: string; placa: string }[]
  >([]);

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inicializar: leer recepcion y barcos
  useEffect(() => {
    if (!recepcionId) {
      Swal.fire("Error", "No se encontró el ID de recepción.", "error");
      router.push("/proceso/consultar/recepcion");
      return;
    }

    fetchBarcos();

    fetch(`/api/recepcion/${recepcionId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(({ data }) => {
        const {
          id: recepcionIdFromApi,
          nombreBarco,
          producto,
          fecha,
          hora,
          chequero,
          turnoInicio,
          turnoFin,
          puntoCarga,
          puntoDescarga,
          bitacoras,
          barcoId,
        } = data;
        setBitacora({
          id: recepcionIdFromApi,
          nombreBarco,
          producto,
          fecha,
          hora,
          chequero,
          turnoInicio,
          turnoFin,
          puntoCarga: puntoCarga || "",
          puntoDescarga: puntoDescarga || "NO APLICA",
          bitacoras: bitacoras || [],
        });
        fetchBarcoDetail(barcoId, true);
      })
      .catch((err) => {
        Swal.fire(
          "Error",
          "No se pudo cargar la recepción: " + err.message,
          "error"
        );
        router.push("/proceso/consultar/recepcion");
      })
      .finally(() => setLoading(false));
  }, []);

  async function fetchBarcos() {
    try {
      const res = await fetch("/api/recepcion/barcos");
      const json = await res.json();
      setBarcos(json.data || []);
    } catch {
      Swal.fire("Error", "No se pudo cargar barcos", "error");
    }
  }

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

      setOptsProductos(detalle.productos.map((p) => ({ value: p, label: p })));
      setOptsPuntos(
        [...detalle.puntosDescarga, "NO APLICA"].map((p) => ({
          value: p,
          label: p,
        }))
      );
      setOptsTransportes(
        detalle.transportes.map((t) => ({ value: t.id, label: t.nombre }))
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

      setBitacora((b) => ({
        ...b,
        nombreBarco: detalle.vaporBarco,
        producto: keepLogs ? b.producto : data.producto || "",
        turnoInicio: keepLogs ? b.turnoInicio : data.turnoInicio || "",
        turnoFin: keepLogs ? b.turnoFin : data.turnoFin || "",
        puntoCarga: keepLogs ? b.puntoCarga : data.puntoCarga || "",
        puntoDescarga: keepLogs
          ? b.puntoDescarga
          : data.puntoDescarga || "NO APLICA",
        bitacoras: keepLogs ? b.bitacoras : data.bitacoras || [],
      }));
    } catch {
      Swal.fire("Error", "No se pudo cargar datos del barco", "error");
    }
  }

  function onBarcoChange(opt: OptionType | null) {
    if (!opt) {
      setSelectedBarco(null);
      setBitacora((b) => ({ ...b, id: null, nombreBarco: "", bitacoras: [] }));
      return;
    }
    if (typeof opt.value === "number") {
      const newId = opt.value as number;
      // si ya hay bitácoras, preguntar conservación
      if (bitacora.bitacoras.length > 0) {
        Swal.fire({
          title: "¿Conservar bitácoras?",
          text: "¿Deseas conservar las bitácoras actuales al cambiar de barco?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, conservar",
          cancelButtonText: "No, descartar",
        }).then((res) => {
          const keep = res.isConfirmed;
          setBitacora((b) => ({
            ...b,
            id: newId,
            nombreBarco: opt.label,
            bitacoras: keep ? b.bitacoras : [],
          }));
          fetchBarcoDetail(newId, keep);
        });
      } else {
        setBitacora((b) => ({ ...b, id: newId, nombreBarco: opt.label, bitacoras: [] }));
        fetchBarcoDetail(newId, false);
      }
    } else {
      // creación manual de barco
      setSelectedBarco(null);
      setOptsProductos([]);
      setOptsPuntos([]);
      setOptsTransportes([]);
      setOptsPlacas([]);
      setCurrentMotoristas([]);
      setBitacora((b) => ({
        ...b,
        id: null,
        nombreBarco: opt.label,
        bitacoras: [],
      }));
    }
  }

  function onCrearBarco(input: string) {
    const newOpt = { value: input, label: input };
    setBarcos((prev) => [
      ...prev,
      { id: -1, vaporBarco: input, productos: [], puntosDescarga: [], transportes: [] },
    ]);
    onBarcoChange(newOpt);
  }

  function onProductoChange(opt: OptionType | null) {
    if (!opt) {
      setBitacora((b) => ({ ...b, producto: "" }));
      return;
    }
    const v = opt.value as string;
    if (!optsProductos.find((o) => o.value === v)) {
      setOptsProductos((prev) => [...prev, { value: v, label: v }]);
    }
    setBitacora((b) => ({ ...b, producto: v }));
  }

  function onCrearProducto(input: string) {
    const newOpt = { value: input, label: input };
    setOptsProductos((prev) => [...prev, newOpt]);
    setBitacora((b) => ({ ...b, producto: input }));
  }

  function onPuntoChange(opt: OptionType | null) {
    if (!opt) {
      setBitacora((b) => ({ ...b, puntoDescarga: "", puntoCarga: "" }));
      return;
    }
    const v = opt.value as string;
    if (!optsPuntos.find((o) => o.value === v)) {
      setOptsPuntos((prev) => [...prev, { value: v, label: v }]);
    }
    setBitacora((b) => ({
      ...b,
      puntoDescarga: v,
      puntoCarga: "NO APLICA",
    }));
  }

  function onCrearPunto(input: string) {
    const newOpt = { value: input, label: input };
    setOptsPuntos((prev) => [...prev, newOpt]);
    setBitacora((b) => ({ ...b, puntoDescarga: input, puntoCarga: "NO APLICA" }));
  }

  function onPuntoCargaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase();
    setBitacora((b) => ({
      ...b,
      puntoCarga: v,
      puntoDescarga: "NO APLICA",
    }));
  }

  function onOpTransporteChange(opt: OptionType | null) {
    if (!opt || !selectedBarco) {
      setOp((o) => ({ ...o, transporte: "", placa: "", motorista: "" }));
      setOptsPlacas([]);
      setCurrentMotoristas([]);
      return;
    }
    const tId = typeof opt.value === "number" ? (opt.value as number) : -1;
    const trans = selectedBarco.transportes.find((t) => t.id === tId);
    if (trans) {
      setCurrentMotoristas(trans.motoristas);
      setOptsPlacas(trans.motoristas.map((m) => ({ value: m.placa, label: m.placa })));
      setOp((o) => ({ ...o, transporte: trans.nombre, placa: "", motorista: "" }));
    } else {
      const v = opt.value as string;
      setOp((o) => ({ ...o, transporte: v, placa: "", motorista: "" }));
      setOptsPlacas([]);
      setCurrentMotoristas([]);
    }
  }

  function onCrearTransporte(input: string) {
    const newOpt = { value: input, label: input };
    setOptsTransportes((prev) => [...prev, newOpt]);
    setOp((o) => ({ ...o, transporte: input, placa: "", motorista: "" }));
  }

  function onOpPlacaChange(opt: OptionType | null) {
    if (!opt) {
      setOp((o) => ({ ...o, placa: "", motorista: "" }));
      return;
    }
    const placa = opt.value as string;
    if (!optsPlacas.find((o) => o.value === placa)) {
      setOptsPlacas((prev) => [...prev, { value: placa, label: placa }]);
    }
    const m = currentMotoristas.find((x) => x.placa === placa);
    setOp((o) => ({ ...o, placa, motorista: m?.nombre || "" }));
  }

  function onCrearPlaca(input: string) {
    const newOpt = { value: input, label: input };
    setOptsPlacas((prev) => [...prev, newOpt]);
    setOp((o) => ({ ...o, placa: input, motorista: "" }));
  }

  function addOrUpdateOp() {
    const { ticket, transporte, placa, horaInicio, horaFinal } = op;
    if (!ticket || !transporte || !placa)
      return Swal.fire("Error", "Rellena Ticket, Transporte y Placa", "warning");
    if (!horaInicio || !horaFinal)
      return Swal.fire("Error", "Completa horas", "warning");
    if (horaFinal < horaInicio)
      return Swal.fire("Error", "La hora final no puede ser menor", "warning");

    const nueva = { ...op, tiempoTotal: diffTime(horaInicio, horaFinal) };
    setBitacora((b) => {
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
    }).then((res) => {
      if (res.isConfirmed) {
        setBitacora((b) => ({
          ...b,
          bitacoras: b.bitacoras.filter((_, idx) => idx !== i),
        }));
      }
    });
  }

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
      lines.push(
        `    Horas        : ${it.horaInicio} → ${it.horaFinal}  [Total: ${it.tiempoTotal}]`
      );
      lines.push(`    Observaciones: ${it.observaciones}`);
      lines.push("");
    });
    if (editIdx != null) {
      lines.push("----- Operación en edición -----");
      lines.push(` Ticket       : ${op.ticket}`);
      lines.push(` Transporte   : ${op.transporte}`);
      lines.push(` Placa        : ${op.placa}`);
      lines.push(` Motorista    : ${op.motorista}`);
      lines.push(
        `    Horas        : ${op.horaInicio} → ${op.horaFinal}  [Total: ${op.tiempoTotal}]`
      );
      lines.push(`    Observaciones: ${op.observaciones}`);
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
    }).then((res) => {
      if (res.isDenied) generarNota();
      else if (res.isConfirmed) onConfirm();
      else onCancel();
    });
  }

  function handleCancel() {
    showModal(
      "¿Cancelar edición?",
      "Se descartarán todos los cambios.",
      "warning",
      () => {
        localStorage.removeItem("recepcionId");
        router.push("/proceso/consultar/recepcion");
      },
      () => {}
    );
  }

  function handleUpdate() {
    const {
      producto,
      turnoInicio,
      turnoFin,
      bitacoras,
      puntoDescarga,
      puntoCarga,
    } = bitacora;

    const barcoId = selectedBarco?.id ?? null;

    if (puntoDescarga === "NO APLICA" && !puntoCarga)
      return Swal.fire("Error", "Selecciona un punto de descarga", "warning");
    if (!recepcionId)
      return Swal.fire("Error", "ID de recepción inválido", "warning");
    if (!producto) return Swal.fire("Error", "Selecciona un producto", "warning");
    if (!turnoInicio || !turnoFin)
      return Swal.fire("Error", "Define turno inicio y fin", "warning");
    if (bitacoras.length === 0)
      return Swal.fire("Error", "Agrega al menos una bitácora", "warning");

    showModal(
      "¿Guardar cambios?",
      "Esto actualizará la recepción existente.",
      "warning",
      () => {
        Swal.fire({
          title: "Actualizando...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        fetch(`/api/recepcion/${recepcionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcoId,
            userId: localStorage.getItem("userId"),
            fecha: bitacora.fecha,
            hora: bitacora.hora,
            producto,
            nombreBarco: bitacora.nombreBarco,
            chequero: bitacora.chequero,
            turnoInicio,
            turnoFin,
            puntoCarga: puntoCarga || null,
            puntoDescarga,
            bitacoras,
          }),
        })
          .then((r) => {
            Swal.close();
            if (r.ok) {
              Swal.fire("Éxito", "Recepción actualizada", "success");
              localStorage.removeItem("recepcionId");
              router.push("/proceso/consultar/recepcion");
            } else {
              Swal.fire("Error", "No se pudo actualizar", "error");
            }
          })
          .catch(() => Swal.fire("Error", "Error de red", "error"));
      },
      () => {}
    );
  }

  async function handleRefreshClick() {
    if (!selectedBarco?.id) {
      return Swal.fire("Error", "Seleccione un barco primero", "warning");
    }
    try {
      setIsRefreshing(true);
      await fetchBarcoDetail(selectedBarco.id, true);
      Swal.fire("Éxito", "Datos actualizados correctamente", "success");
    } catch {
      Swal.fire("Error", "No se pudieron actualizar los datos", "error");
    } finally {
      setIsRefreshing(false);
    }
  }

  if (loading) {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
          <FiLoader className="animate-spin mr-2" size={40} />
          <span className="text-xl text-gray-600">Cargando...</span>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#003E9B] px-4 py-6 text-white">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 relative">
          <img src="/logo.png" alt="ALMAPAC" className="h-16 w-auto" />
          <h1 className="text-2xl font-bold uppercase text-center">
            EDITAR RECEPCIÓN Y TRASLADO
          </h1>
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="absolute top-6 right-6 flex items-center gap-2 p-2 bg-blue-700 hover:bg-blue-800 rounded"
          >
            <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} />
            <span>Actualizar Barco</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Formulario Principal */}
        <section className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block mb-1 font-semibold">Vapor / Barco</label>
            <CreatableSelect
              isClearable
              options={barcos.map((b) => ({
                value: b.id,
                label: b.vaporBarco,
              }))}
              value={
                bitacora.nombreBarco
                  ? { value: selectedBarco?.id ?? bitacora.nombreBarco, label: bitacora.nombreBarco }
                  : null
              }
              onChange={onBarcoChange}
              onCreateOption={onCrearBarco}
              placeholder="Selecciona o escribe barco..."
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Chequero</label>
            <input
              type="text"
              value={bitacora.chequero}
              onChange={(e) =>
                setBitacora((b) => ({ ...b, chequero: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Fecha</label>
            <input
              type="date"
              value={bitacora.fecha}
              onChange={(e) =>
                setBitacora((b) => ({ ...b, fecha: e.target.value }))
              }
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Hora</label>
            <input
              type="time"
              value={bitacora.hora}
              onChange={(e) =>
                setBitacora((b) => ({ ...b, hora: e.target.value }))
              }
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Turno Inicio</label>
            <input
              type="time"
              value={bitacora.turnoInicio}
              onChange={(e) =>
                setBitacora((b) => ({ ...b, turnoInicio: e.target.value }))
              }
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Turno Fin</label>
            <input
              type="time"
              value={bitacora.turnoFin}
              onChange={(e) =>
                setBitacora((b) => ({ ...b, turnoFin: e.target.value }))
              }
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Producto</label>
            <CreatableSelect
              isClearable
              options={optsProductos}
              value={
                bitacora.producto
                  ? { value: bitacora.producto, label: bitacora.producto }
                  : null
              }
              onChange={onProductoChange}
              onCreateOption={onCrearProducto}
              placeholder="Selecciona o escribe producto..."
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">
              Punto de Descarga
            </label>
            <CreatableSelect
              isClearable
              options={optsPuntos}
              value={
                bitacora.puntoDescarga
                  ? { value: bitacora.puntoDescarga, label: bitacora.puntoDescarga }
                  : null
              }
              onChange={onPuntoChange}
              onCreateOption={onCrearPunto}
              placeholder="Selecciona o escribe punto..."
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
              <label className="block mb-1 font-semibold">
                Ticket Autorización
              </label>
              <input
                type="number"
                value={op.ticket}
                onChange={(e) =>
                  setOp((o) => ({ ...o, ticket: e.target.value }))
                }
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Transporte</label>
              <CreatableSelect
                isClearable
                options={optsTransportes}
                value={
                  op.transporte
                    ? { value: op.transporte, label: op.transporte }
                    : null
                }
                onChange={onOpTransporteChange}
                onCreateOption={onCrearTransporte}
                placeholder="Selecciona o escribe transporte..."
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Placa</label>
              <CreatableSelect
                isClearable
                options={optsPlacas}
                value={
                  op.placa
                    ? { value: op.placa, label: op.placa }
                    : null
                }
                onChange={onOpPlacaChange}
                onCreateOption={onCrearPlaca}
                placeholder="Selecciona o escribe placa..."
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Motorista</label>
              <input
                type="text"
                value={op.motorista}
                onChange={(e) =>
                  setOp((o) => ({ ...o, motorista: e.target.value }))
                }
                className="w-full border rounded p-2"
                placeholder="Escribe o elige motorista"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Hora Inicio</label>
              <div className="flex">
                <input
                  type="time"
                  step={1}
                  value={op.horaInicio}
                  onChange={(e) =>
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
                  onChange={(e) => {
                    if (op.horaInicio && e.target.value < op.horaInicio) {
                      Swal.fire(
                        "Error",
                        "La hora final no puede ser menor",
                        "warning"
                      );
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
                      Swal.fire(
                        "Error",
                        "La hora final no puede ser menor",
                        "warning"
                      );
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
                onChange={(e) =>
                  setOp((o) => ({ ...o, observaciones: e.target.value }))
                }
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
            <button
              onClick={addOrUpdateOp}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
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
                ].map((h) => (
                  <th key={h} className="border p-2">
                    {h}
                  </th>
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
                    <FiEdit
                      className="cursor-pointer text-green-600 text-2xl"
                      onClick={() => {
                        setOp(r);
                        setEditIdx(i);
                      }}
                    />
                    <FiTrash2
                      className="cursor-pointer text-red-600 text-2xl"
                      onClick={() => confirmDeleteOp(i)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Botones finales */}
        <div className="flex justify-between">
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-red-600 text-white rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpdate}
            className="px-6 py-2 bg-green-600 text-white rounded"
          >
            Guardar Cambios
          </button>
        </div>
      </main>
    </div>
  );
}
