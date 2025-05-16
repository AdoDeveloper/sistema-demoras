"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal, { SweetAlertIcon } from "sweetalert2";
import dynamic from "next/dynamic";
import { FiTrash2, FiEdit } from "react-icons/fi";

const CreatableSelect = dynamic(() => import("react-select/creatable"), {
  ssr: false,
});

interface OptionType {
  value: string;
  label: string;
}

type AcontecimientoItem = {
  razon: string;
  horaInicio: string;
  horaFinal: string;
  tiempoTotal: string;
  observaciones: string;
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
  }).then((res) => {
    if (res.isDenied) {
      generarNota();
    } else if (res.isConfirmed) {
      onConfirm();
    } else {
      onCancel();
    }
  });
}

// Genera y descarga un archivo .txt con la bitácora actual,
// incluyendo el evento en edición y el que está en el formulario si tienen datos.
function generarNota() {
  const draftRaw = localStorage.getItem("acontecimientoDraft");
  let draft: any = null;
  if (draftRaw) {
    try {
      draft = JSON.parse(draftRaw);
    } catch {
      draft = null;
    }
  }
  const fecha = draft?.fecha || nowDate();
  const hora = nowTime();
  const turno = draft?.turno || "-";
  const condicion = draft?.condicion || "-";
  const puntosDescarga: string[] = Array.isArray(draft?.puntosDescarga)
    ? draft.puntosDescarga
    : [];
  const operadores = draft?.operadores ?? "";
  const enlonadores = draft?.enlonadores ?? "";
  const equipos = draft?.equipos ?? "";
  const basculas: string[] = Array.isArray(draft?.basculas)
    ? draft.basculas
    : [];
  const bitacoras: AcontecimientoItem[] = Array.isArray(draft?.acontecimientos)
    ? draft.acontecimientos
    : [];
  // Evento en edición (si existe índice)
  const editIdx: number | null =
    typeof draft?.editIdx === "number" ? draft.editIdx : null;
  const opEditing: AcontecimientoItem | null =
    editIdx != null ? draft.evtForm || null : null;
  // Evento en formulario (en creación), siempre que haya al menos razón u horas
  const opForm: AcontecimientoItem | null =
    draft?.evtForm &&
    (draft.evtForm.razon ||
      draft.evtForm.horaInicio ||
      draft.evtForm.horaFinal)
      ? draft.evtForm
      : null;

  const lines: string[] = [];
  lines.push("===== RESUMEN =====");
  lines.push(`Fecha          : ${fecha}`);
  lines.push(`Hora           : ${hora}`);
  lines.push(`Turno          : ${turno}`);
  lines.push(`Condición      : ${condicion}`);
  lines.push(`Punto Descarga : ${puntosDescarga.join(", ") || "-"}`);
  lines.push(`Operadores     : ${operadores}`);
  lines.push(`Enlonadores    : ${enlonadores}`);
  lines.push(`Equipos        : ${equipos}`);
  lines.push(`Básculas       : ${basculas.join(", ") || "-"}`);
  lines.push("");
  lines.push("----- Acontecimientos/Interrupciones -----");
  bitacoras.forEach((it, i) => {
    lines.push(` ${i + 1}) Razón          : ${it.razon}`);
    lines.push(`    Hora Inicio   : ${it.horaInicio}`);
    lines.push(`    Hora Final    : ${it.horaFinal}`);
    lines.push(`    Total Tiempo  : ${it.tiempoTotal}`);
    lines.push(`    Observaciones : ${it.observaciones || "-"}`);
    lines.push("");
  });

  if (opEditing) {
    lines.push("----- Acontecimiento en edición -----");
    lines.push(` Razón          : ${opEditing.razon}`);
    lines.push(`    Hora Inicio   : ${opEditing.horaInicio}`);
    lines.push(`    Hora Final    : ${opEditing.horaFinal}`);
    lines.push(`    Total Tiempo  : ${opEditing.tiempoTotal}`);
    lines.push(`    Observaciones : ${opEditing.observaciones || "-"}`);
    lines.push("");
  }

  if (opForm) {
    lines.push("----- Acontecimiento en creación -----");
    lines.push(` Razón          : ${opForm.razon}`);
    lines.push(`    Hora Inicio   : ${opForm.horaInicio}`);
    lines.push(`    Hora Final    : ${opForm.horaFinal}`);
    lines.push(`    Total Tiempo  : ${opForm.tiempoTotal}`);
    lines.push(`    Observaciones : ${opForm.observaciones || "-"}`);
    lines.push("");
  }

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Acontecimientos_Interrupciones_${fecha.replace(/-/g, "")}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CreateAcontecimientosPage() {
  const router = useRouter();

  // Fecha fija
  const [fecha] = useState(nowDate());

  // Opciones iniciales
  const turnoOptions: OptionType[] = [
    { value: "Turno 1", label: "Turno 1" },
    { value: "Turno 2", label: "Turno 2" },
  ];
  const condicionOptions: OptionType[] = [
    { value: "NORMAL", label: "NORMAL" },
    { value: "LLUVIA", label: "LLUVIA" },
    { value: "RECEPECION DE MELAZA", label: "RECEPECION DE MELAZA" },
    {
      value: "RECEPECION DE CEREALES/BARCO",
      label: "RECEPECION DE CEREALES/BARCO",
    },
  ];
  const puntosDescargaOptions: OptionType[] = [
    { value: "Banda 44", label: "Banda 44" },
    { value: "Terminal 1", label: "Terminal 1" },
    { value: "Terminal 2", label: "Terminal 2" },
    { value: "Terminal 3", label: "Terminal 3" },
    { value: "Banda 1", label: "Banda 1" },
    { value: "Volcador 2", label: "Volcador 2" },
    { value: "Módulo 1", label: "Módulo 1" },
    { value: "Módulo 2", label: "Módulo 2" },
    { value: "Módulo 3", label: "Módulo 3" },
  ];
  const basculaOptions: OptionType[] = [
    { value: "BASCULA 1", label: "BASCULA 1" },
    { value: "BASCULA 2", label: "BASCULA 2" },
    { value: "BASCULA 3", label: "BASCULA 3" },
    { value: "BASCULA 4", label: "BASCULA 4" },
    { value: "BASCULA 5", label: "BASCULA 5" },
    { value: "BASCULA 6", label: "BASCULA 6" },
  ];

  // Opciones de Razones (editable)
  const initialRazonOptions: OptionType[] = [
    { value: "Corte de energía eléctrica", label: "Corte de energía eléctrica" },
    { value: "Fallo en báscula", label: "Fallo en báscula" },
    { value: "Golpe en pluma", label: "Golpe en pluma" },
    { value: "Error en red", label: "Error en red" },
    {
      value: "Camión con problemas mecánicos",
      label: "Camión con problemas mecánicos",
    },
  ];
  const [razonOptions, setRazonOptions] = useState<OptionType[]>(initialRazonOptions);

  // Estados principales
  const [turno, setTurno] = useState<OptionType | null>(null);
  const [condicion, setCondicion] = useState<OptionType | null>(null);
  const [puntosDescarga, setPuntosDescarga] = useState<OptionType[]>([]);
  const [operadores, setOperadores] = useState<string>("");
  const [enlonadores, setEnlonadores] = useState<string>("");
  const [equipos, setEquipos] = useState<string>("");
  const [basculas, setBasculas] = useState<OptionType[]>([]);

  // Acontecimientos dinámicos
  const [acontecimientos, setAcontecimientos] = useState<AcontecimientoItem[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [evtForm, setEvtForm] = useState<AcontecimientoItem>({
    razon: "",
    horaInicio: "",
    horaFinal: "",
    tiempoTotal: "",
    observaciones: "",
  });

  // Cargar borrador de localStorage
  useEffect(() => {
    const draft = localStorage.getItem("acontecimientoDraft");
    if (draft) {
      try {
        const data = JSON.parse(draft);
        setTurno(
          data.turno
            ? turnoOptions.find((o) => o.value === data.turno) || null
            : null
        );
        setCondicion(
          data.condicion
            ? condicionOptions.find((o) => o.value === data.condicion) || null
            : null
        );
        setPuntosDescarga(
          Array.isArray(data.puntosDescarga)
            ? data.puntosDescarga.map((v: string) => ({ value: v, label: v }))
            : []
        );
        setOperadores(data.operadores || "");
        setEnlonadores(data.enlonadores || "");
        setEquipos(data.equipos || "");
        setBasculas(
          Array.isArray(data.basculas)
            ? data.basculas.map((v: string) => ({ value: v, label: v }))
            : []
        );
        setAcontecimientos(data.acontecimientos || []);
        if (data.evtForm) {
          setEvtForm(data.evtForm);
        }
        if (typeof data.editIdx === "number") {
          setEditIdx(data.editIdx);
        }
        if (Array.isArray(data.razonOptions)) {
          setRazonOptions(
            data.razonOptions.map((v: string) => ({ value: v, label: v }))
          );
        }
      } catch {}
    }
  }, []);

  // Persistir borrador en localStorage
  useEffect(() => {
    const draft = {
      turno: turno?.value,
      condicion: condicion?.value,
      puntosDescarga: puntosDescarga?.map((b) => b.value),
      operadores,
      enlonadores,
      equipos,
      basculas: basculas.map((b) => b.value),
      acontecimientos,
      evtForm,
      editIdx,
      razonOptions: razonOptions.map((o) => o.value),
      fecha,
    };
    localStorage.setItem("acontecimientoDraft", JSON.stringify(draft));
  }, [
    turno,
    condicion,
    puntosDescarga,
    operadores,
    enlonadores,
    equipos,
    basculas,
    acontecimientos,
    evtForm,
    editIdx,
    razonOptions,
    fecha,
  ]);

  function addOrUpdateEvento() {
    if (!evtForm.razon || !evtForm.horaInicio || !evtForm.horaFinal) {
      return Swal.fire("Error", "Completa razón e horas", "warning");
    }
    const nuevo = { ...evtForm };
    setAcontecimientos((arr) => {
      const copy = [...arr];
      if (editIdx != null) copy[editIdx] = nuevo;
      else copy.push(nuevo);
      return copy;
    });
    // limpiar formulario
    setEvtForm({
      razon: "",
      horaInicio: "",
      horaFinal: "",
      tiempoTotal: "",
      observaciones: "",
    });
    setEditIdx(null);
  }

  function deleteEvento(i: number) {
    Swal.fire({
      title: "¿Eliminar acontecimiento?",
      text: "Esta acción no se puede revertir.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((res) => {
      if (res.isConfirmed) {
        setAcontecimientos((arr) => arr.filter((_, idx) => idx !== i));
      }
    });
  }

  function handleCancelEdit() {
    setEvtForm({
      razon: "",
      horaInicio: "",
      horaFinal: "",
      tiempoTotal: "",
      observaciones: "",
    });
    setEditIdx(null);
  }

  function doCancel() {
    localStorage.removeItem("acontecimientoDraft");
    router.push("/proceso/iniciar");
  }

  async function doSubmit() {
    if (!turno || !condicion) {
      return Swal.fire("Error", "Selecciona turno y condición", "warning");
    }
    if (
      condicion.value === "RECEPECION DE CEREALES/BARCO" &&
      !puntosDescarga.length
    ) {
      return Swal.fire("Error", "Selecciona punto de descarga", "warning");
    }
    const payload = {
      fecha,
      turno: turno.value,
      condicion: condicion.value,
      puntosDescarga: puntosDescarga.map((b) => b.value),
      operadores,
      enlonadores,
      equipos,
      basculas: basculas.map((b) => b.value),
      acontecimientos,
    };
    Swal.fire({
      title: "Procesando solicitud...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    const res = await fetch("/api/acontecimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    Swal.close();
    if (res.ok) {
      localStorage.removeItem("acontecimientoDraft");
      Swal.fire("Éxito", "Turno terminado", "success").then(() => {
        router.push("/proceso/iniciar");
      });
    } else {
      Swal.fire("Error", "No se pudo guardar", "error");
    }
  }

  function handleCancel() {
    showModal(
      "¿Está seguro?",
      "Se perderán los cambios realizados. Esta acción no se puede revertir",
      "warning",
      () => doCancel(),
      () => {}
    );
  }

  function handleSubmit() {
    showModal(
      "¿Terminar turno?",
      "Enviar datos y terminar. Esta acción no se puede revertir.",
      "warning",
      () => {
        doSubmit();
      },
      () => {}
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#003E9B] px-4 py-6 text-white">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <img src="/logo.png" alt="ALMAPAC" className="h-16 w-auto" />
          <h1 className="text-2xl font-bold uppercase text-center">
            ACONTECIMIENTOS E INTERRUPCIONES
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Campos principales */}
        <section className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block mb-1 font-semibold">Fecha</label>
            <input
              type="date"
              value={fecha}
              readOnly
              className="w-full border rounded p-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Turno</label>
            <CreatableSelect
              isClearable
              options={turnoOptions}
              value={turno}
              onChange={(o) => setTurno(o as OptionType | null)}
              placeholder="Selecciona turno..."
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Condición</label>
            <CreatableSelect
              isClearable
              options={condicionOptions}
              value={condicion}
              onChange={(o) => {
                const opt = o as OptionType | null;
                setCondicion(opt);
                if (opt?.value !== "RECEPECION DE CEREALES/BARCO") {
                  setPuntosDescarga([]);
                }
              }}
              placeholder="Selecciona condición..."
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block mb-1 font-semibold">Puntos de Descarga</label>
            <CreatableSelect
              isMulti
              isClearable
              options={puntosDescargaOptions}
              value={puntosDescarga}
              onChange={(arr) => setPuntosDescarga(arr as OptionType[])}
              isDisabled={condicion?.value !== "RECEPECION DE CEREALES/BARCO"}
              placeholder="Selecciona puntos..."
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Operadores</label>
            <input
              type="number"
              value={operadores}
              onChange={(e) => setOperadores(e.target.value)}
              placeholder="Ingrese número de operadores"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Enlonadores</label>
            <input
              type="number"
              value={enlonadores}
              onChange={(e) => setEnlonadores(e.target.value)}
              placeholder="Ingrese número de enlonadores"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Equipos Frontales</label>
            <input
              type="number"
              value={equipos}
              onChange={(e) => setEquipos(e.target.value)}
              placeholder="Ingrese número de equipos"
              className="w-full border rounded p-2"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block mb-1 font-semibold">Básculas</label>
            <CreatableSelect
              isMulti
              options={basculaOptions}
              value={basculas}
              onChange={(arr) => setBasculas(arr as OptionType[])}
              placeholder="Selecciona básculas..."
            />
          </div>
        </section>

        {/* Acontecimientos */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold text-lg mb-4">Acontecimientos/Interrupciones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Razón</label>
              <CreatableSelect
                isClearable
                options={razonOptions}
                value={
                  evtForm.razon
                    ? { value: evtForm.razon, label: evtForm.razon }
                    : null
                }
                onChange={(o) =>
                  setEvtForm((ev) => ({
                    ...ev,
                    razon: (o as OptionType | null)?.value ?? "",
                  }))
                }
                onCreateOption={(inputValue) => {
                  const newOpt = { value: inputValue, label: inputValue };
                  setRazonOptions((prev) => [...prev, newOpt]);
                  setEvtForm((ev) => ({ ...ev, razon: inputValue }));
                }}
                placeholder="Selecciona o crea razón..."
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Hora Inicio</label>
              <div className="flex">
                <input
                  type="time"
                  step={1}
                  value={evtForm.horaInicio}
                  onChange={(e) => {
                    const hi = e.target.value;
                    setEvtForm((ev) => ({
                      ...ev,
                      horaInicio: hi,
                      tiempoTotal: diffTime(hi, ev.horaFinal),
                    }));
                  }}
                  className="w-full border rounded p-2"
                />
                <button
                  onClick={() => {
                    const now = nowTime();
                    setEvtForm((ev) => ({
                      ...ev,
                      horaInicio: now,
                      tiempoTotal: diffTime(now, ev.horaFinal),
                    }));
                  }}
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
                  value={evtForm.horaFinal}
                  onChange={(e) => {
                    const hf = e.target.value;
                    if (evtForm.horaInicio && hf < evtForm.horaInicio) {
                      return Swal.fire(
                        "Error",
                        "La hora final no puede ser menor",
                        "warning"
                      );
                    }
                    setEvtForm((ev) => ({
                      ...ev,
                      horaFinal: hf,
                      tiempoTotal: diffTime(ev.horaInicio, hf),
                    }));
                  }}
                  className="w-full border rounded p-2"
                />
                <button
                  onClick={() => {
                    const now = nowTime();
                    if (evtForm.horaInicio && now < evtForm.horaInicio) {
                      return Swal.fire(
                        "Error",
                        "La hora final no puede ser menor",
                        "warning"
                      );
                    }
                    setEvtForm((ev) => ({
                      ...ev,
                      horaFinal: now,
                      tiempoTotal: diffTime(ev.horaInicio, now),
                    }));
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
                value={evtForm.tiempoTotal}
                className="w-full border rounded p-2 bg-gray-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1 font-semibold">Observaciones</label>
              <textarea
                rows={2}
                value={evtForm.observaciones}
                onChange={(e) =>
                  setEvtForm((ev) => ({
                    ...ev,
                    observaciones: e.target.value,
                  }))
                }
                className="w-full border rounded p-2"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            {editIdx != null && (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={addOrUpdateEvento}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {editIdx != null ? "Actualizar" : "Agregar"}
            </button>
          </div>
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "Razón",
                    "Inicio",
                    "Final",
                    "Total",
                    "Observaciones",
                    "Acción",
                  ].map((h) => (
                    <th key={h} className="p-2 border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {acontecimientos.map((ac, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 whitespace-nowrap">{ac.razon}</td>
                    <td className="p-2 whitespace-nowrap">{ac.horaInicio}</td>
                    <td className="p-2 whitespace-nowrap">{ac.horaFinal}</td>
                    <td className="p-2 whitespace-nowrap">{ac.tiempoTotal}</td>
                    <td className="p-2 whitespace-nowrap">{ac.observaciones}</td>
                    <td className="p-2 flex justify-center gap-4 whitespace-nowrap">
                      <FiEdit
                        className="cursor-pointer text-green-600 text-2xl"
                        onClick={() => {
                          setEvtForm(ac);
                          setEditIdx(i);
                        }}
                      />
                      <FiTrash2
                        className="cursor-pointer text-red-600 text-2xl"
                        onClick={() => deleteEvento(i)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded"
          >
            Terminar Turno
          </button>
        </div>
      </main>
    </div>
  );
}