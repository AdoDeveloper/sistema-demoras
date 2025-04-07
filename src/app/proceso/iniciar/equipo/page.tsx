"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";
import { FaSave, FaBroom } from "react-icons/fa";

// Importar react-select de forma dinámica para evitar problemas de SSR/hidratación
const Select = dynamic(() => import("react-select"), { ssr: false });

// Definición del tipo de opción para react-select
interface OptionType {
  value: string;
  label: string;
}

// Opciones de equipo para react-select
const equipoOptions: OptionType[] = [
  { value: "CAT 1", label: "CAT 1" },
  { value: "CAT 2", label: "CAT 2" },
  { value: "CAT 3", label: "CAT 3" },
  { value: "J 1", label: "J 1" },
  { value: "J 2", label: "J 2" },
  { value: "J 3", label: "J 3" },
  { value: "K-II", label: "K-II" },
  { value: "621 H", label: "621 H" },
  { value: "544 H", label: "544 H" },
];

// Definición del tipo para cada ítem de inspección usando el campo "cumple"
interface InspeccionItem {
  id: number;
  titulo: string;
  cumple: boolean | null;
  observaciones: string;
}

// Lista de inspecciones inicial (cumple inicia en null, es decir, sin selección)
const inspeccionInicial: InspeccionItem[] = [
  { id: 1, titulo: "Inspección de llantas", cumple: null, observaciones: "" },
  {
    id: 2,
    titulo:
      "Inspección visual general (no existan fugas en los diferentes sistemas, partes sueltas)",
    cumple: null,
    observaciones: "",
  },
  { id: 3, titulo: "Inspección de luces de traslado", cumple: null, observaciones: "" },
  { id: 4, titulo: "Inspección de luces de trabajo", cumple: null, observaciones: "" },
  { id: 5, titulo: "Inspección de luces de señal de cruce", cumple: null, observaciones: "" },
  { id: 6, titulo: "Estado de luces de stop (frenos) y luces de parqueo", cumple: null, observaciones: "" },
  {
    id: 7,
    titulo:
      "Verificación que todos los mandos estén funcionando. (Movimiento de: cucharón, dirección, frenos, velocidades, etc.)",
    cumple: null,
    observaciones: "",
  },
  { id: 8, titulo: "Verificar las condiciones de los espejos", cumple: null, observaciones: "" },
  { id: 9, titulo: "Funcionamiento de alarma de retroceso", cumple: null, observaciones: "" },
  { id: 10, titulo: "Funcionamiento del pito o claxon", cumple: null, observaciones: "" },
  { id: 11, titulo: "Verificación de lubricación en los puntos móviles", cumple: null, observaciones: "" },
  { id: 12, titulo: "Inspección de daños estructurales", cumple: null, observaciones: "" },
  { id: 13, titulo: "Adecuadas condiciones de limpieza", cumple: null, observaciones: "" },
  { id: 14, titulo: "Ruidos o condiciones no normales del equipo durante su operación", cumple: null, observaciones: "" },
];

export default function InspeccionDeEquipo() {
  const router = useRouter();
  // Estados para campos principales
  const [equipo, setEquipo] = useState<string>("");
  const [operador, setOperador] = useState<string>("");
  const [fecha, setFecha] = useState<string>("");
  const [hora, setHora] = useState<string>("");
  const [horaDe, setHoraDe] = useState<string>("");
  const [horaA, setHoraA] = useState<string>("");
  const [recomendaciones, setRecomendaciones] = useState<string>("");

  // Estado para la lista de inspecciones
  const [inspecciones, setInspecciones] = useState<InspeccionItem[]>(inspeccionInicial);

  // Precargar datos desde localStorage al montar el componente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().split("T")[0];
      const currentTime = new Date(); // Hora actual
      const hours = currentTime.getHours().toString().padStart(2, '0'); // Asegura que la hora tenga 2 dígitos
      const minutes = currentTime.getMinutes().toString().padStart(2, '0'); // Asegura que los minutos tengan 2 dígitos
      const hourToday = `${hours}:${minutes}`; // Formato HH:mm
      const userName = localStorage.getItem("userNameAll") || "";
      const storedData = localStorage.getItem("inspeccionData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setEquipo(parsedData.equipo || "");
        setOperador(parsedData.operador || userName);
        setFecha(parsedData.fecha || today);
        setHora(parsedData.hora || hourToday);
        setHoraDe(parsedData.horaDe || "");
        setHoraA(parsedData.horaA || "");
        setRecomendaciones(parsedData.recomendaciones || "");
        setInspecciones(parsedData.inspecciones || inspeccionInicial);
      } else {
        // Si no hay datos almacenados, se asigna el operador y la fecha predeterminados.
        setOperador(userName);
        setFecha(today);
        setHora(hourToday);
      }
    }
  }, []);

  // Guardar en localStorage cada vez que cambien los datos
  useEffect(() => {
    const data = {
      equipo,
      operador,
      fecha,
      hora,
      horaDe,
      horaA,
      recomendaciones,
      inspecciones,
    };
    localStorage.setItem("inspeccionData", JSON.stringify(data));
  }, [equipo, operador, fecha, hora, horaDe, horaA, recomendaciones, inspecciones]);

  // Evitar la salida o actualización accidental de la página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Función para manejar el cambio del campo "cumple"
  // Si el valor ya está seleccionado, se deselecciona (se asigna null)
  const handleCumpleChange = (id: number, value: boolean) => {
    setInspecciones(prev =>
      prev.map(item =>
        item.id === id ? { ...item, cumple: item.cumple === value ? null : value } : item
      )
    );
  };

  // Maneja el cambio en el campo "observaciones"
  const handleObservacionesChange = (id: number, value: string) => {
    setInspecciones(prev =>
      prev.map(item => (item.id === id ? { ...item, observaciones: value } : item))
    );
  };

  // Botón "Guardar": enviar data a /api/equipos
  const handleGuardar = async () => {
    // Validar que los campos principales estén completos
    if (!equipo || !operador || !fecha || !hora || !horaDe || !horaA) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, complete todos los campos principales.",
      });
      return;
    }

    // Validar que ninguna inspección esté vacía
    const inspeccionesIncompletas = inspecciones.filter(
      item => item.cumple === null
    );
    if (inspeccionesIncompletas.length > 0) {
      const mensajes = inspeccionesIncompletas.map(item => {
        const camposFaltantes = [];
        if (item.cumple === null) camposFaltantes.push("Cumple");
        return `[${item.titulo}] ,`;
      });
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Por favor, complete las siguientes inspecciones:\n${mensajes.join("\n")}`,
      });
      return;
    }

    // Preguntar si se desea guardar y advertir que la acción no se puede revertir
    const confirmResult = await Swal.fire({
      title: "Confirmar guardado",
      text: "Los datos se enviarán y la acción no se puede revertir. ¿Desea continuar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmResult.isConfirmed) return;

    // Mostrar alerta de cargando
    Swal.fire({
      title: "Procesando solicitud...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Transformar datos de inspecciones para enviar solo el campo "cumple"
    const payload = {
      equipo,
      operador,
      fecha,
      hora,
      horaDe,
      horaA,
      recomendaciones,
      inspecciones: inspecciones.map(item => ({
        id: item.id,
        titulo: item.titulo,
        cumple: item.cumple, // true, false o null
        observaciones: item.observaciones,
      })),
    };

    try {
      const res = await fetch("/api/equipos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      // Cerrar la alerta de cargando
      Swal.close();
      if (res.ok) {
        localStorage.removeItem("inspeccionData");
        Swal.fire("Enviado", "Datos enviados y guardados correctamente.", "success").then(() => {
          router.push("/proceso/iniciar");
        });
      } else {
        // Extraer el mensaje de error del response
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.error || "No se pudo guardar la inspección.",
        });
      }
    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar la inspección.",
      });
    }
  };

  // Botón "Cancelar": confirmación para salir y borrar la data almacenada
  const handleCancelar = () => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Se perderán todos los datos guardados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem("inspeccionData");
        router.push("/proceso/iniciar");
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-white">
      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-6 text-center">
        Inspección de Equipo
      </h1>

      {/* Formulario de datos principales */}
      {/* Vista para dispositivos móviles */}
      <div className="md:hidden flex flex-col space-y-4 mb-6">
        <div className="border-2 border-gray-500 p-2 rounded-md">
          <label className="block mb-1 text-base font-semibold text-gray-800">Equipo:</label>
          <Select
            className="react-select-container text-base border-2 border-gray-500 rounded-md"
            classNamePrefix="react-select"
            options={equipoOptions}
            placeholder="Seleccione Equipo"
            value={equipo ? { value: equipo, label: equipo } : null}
            onChange={(option: OptionType | null) =>
              setEquipo(option ? option.value : "")
            }
          />
        </div>
        <div className="border-2 border-gray-500 p-2 rounded-md">
          <label className="block mb-1 text-base font-semibold text-gray-800">Operador:</label>
          <input
            type="text"
            value={operador}
            readOnly
            onChange={e => setOperador(e.target.value)}
            className="w-full p-2 text-base border-2 border-gray-500 rounded-md"
            placeholder="Ingrese nombre del operador"
          />
        </div>
        <div className="border-2 border-gray-500 p-2 rounded-md">
          <label className="block mb-1 text-base font-semibold text-gray-800">Fecha:</label>
          <input
            type="date"
            value={fecha}
            readOnly
            onChange={e => setFecha(e.target.value)}
            className="w-full h-9 text-base border-2 border-gray-500 rounded-md px-2 py-1"
          />
        </div>
        <div className="border-2 border-gray-500 p-2 rounded-md">
          <label className="block mb-1 text-base font-semibold text-gray-800">Hora:</label>
          <input
            type="time"
            value={hora}
            readOnly
            onChange={e => setHora(e.target.value)}
            className="w-full h-9 text-base border-2 border-gray-500 rounded-md px-2 py-1"
          />
        </div>
        <div className="border-2 border-gray-500 p-2 rounded-md">
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                Turno de
              </label>
              <input
                type="time"
                name="turnoInicio"
                value={horaDe}
                onChange={e => setHoraDe(e.target.value)}
                className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                a
              </label>
              <input
                type="time"
                name="turnoFin"
                value={horaA}
                onChange={e => setHoraA(e.target.value)}
                className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vista para PC: Formulario de datos principales en tabla */}
      <div className="hidden md:block mb-6">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                Equipo
              </th>
              <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                Fecha
              </th>
              <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                Hora
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 border-2 border-gray-500">
                <Select
                  className="react-select-container text-base border-2 border-gray-500 rounded-md"
                  classNamePrefix="react-select"
                  options={equipoOptions}
                  placeholder="Seleccione Equipo"
                  value={equipo ? { value: equipo, label: equipo } : null}
                  onChange={(option: OptionType | null) =>
                    setEquipo(option ? option.value : "")
                  }
                />
              </td>
              <td className="px-4 py-3 border-2 border-gray-500">
                <input
                  type="date"
                  value={fecha}
                  readOnly
                  onChange={e => setFecha(e.target.value)}
                  className="w-full h-9 text-base border-2 border-gray-500 rounded-md px-2 py-1"
                />
              </td>
              <td className="px-4 py-3 border-2 border-gray-500">
                <input
                  type="time"
                  value={hora}
                  readOnly
                  onChange={e => setHora(e.target.value)}
                  className="w-full h-9 text-base border-2 border-gray-500 rounded-md px-2 py-1"
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 border-2 border-gray-500">
                <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                 Operador
                </label>
                <input
                  type="text"
                  value={operador}
                  readOnly
                  onChange={e => setOperador(e.target.value)}
                  className="w-full p-2 text-base border-2 border-gray-500 rounded-md"
                  placeholder="Ingrese nombre del operador"
                />
              </td>
              <td className="px-4 py-3 border-2 border-gray-500" colSpan={3}>
                <div className="flex flex-row space-x-4">
                  <div className="flex-1">
                    <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                      Turno de
                    </label>
                    <input
                      type="time"
                      name="turnoInicio"
                      value={horaDe}
                      onChange={e => setHoraDe(e.target.value)}
                      className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-base font-semibold text-gray-800 mb-1 uppercase">
                      a
                    </label>
                    <input
                      type="time"
                      name="turnoFin"
                      value={horaA}
                      onChange={e => setHoraA(e.target.value)}
                      className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1"
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Inspecciones */}
      {/* Vista para dispositivos móviles */}
      <div className="block md:hidden mb-6">
        {inspecciones.map((item, index) => (
          <div key={item.id} className="p-4 border-2 border-gray-500 rounded-md mb-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-600 text-white text-base mr-2">
                {index + 1}
              </div>
              <span className="font-semibold text-gray-800 text-base">{item.titulo}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-800 text-base">¿Cumple condición?</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1 text-gray-800 text-base">
                  <input
                    type="checkbox"
                    checked={item.cumple === true}
                    onChange={() => handleCumpleChange(item.id, true)}
                    className="form-checkbox h-6 w-6 accent-orange-500"
                  />
                  <span>SI</span>
                </label>
                <label className="flex items-center space-x-1 text-gray-800 text-base">
                  <input
                    type="checkbox"
                    checked={item.cumple === false}
                    onChange={() => handleCumpleChange(item.id, false)}
                    className="form-checkbox h-6 w-6 accent-orange-500"
                  />
                  <span>NO</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-gray-800 font-semibold text-base mb-1">
                Observaciones:
              </label>
              <textarea
                placeholder="Agregar observación..."
                value={item.observaciones}
                onChange={e => handleObservacionesChange(item.id, e.target.value)}
                className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y min-h-[10px]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Vista para PC: Inspecciones en tabla */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                N°
              </th>
              <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                Parte Evaluada
              </th>
              <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                Cumple
              </th>
              <th scope="col" className="px-4 py-3 border-2 border-gray-500 text-base font-bold text-gray-800">
                Observaciones
              </th>
            </tr>
          </thead>
          <tbody>
            {inspecciones.map((item, index) => (
              <tr key={item.id}>
                <th scope="row" className="px-4 py-3 border-2 border-gray-500 text-base text-gray-700">
                  {index + 1}
                </th>
                <td className="px-4 py-3 border-2 border-gray-500 text-base text-gray-700">
                  {item.titulo}
                </td>
                <td className="px-4 py-3 border-2 border-gray-500 text-base text-gray-700">
                  <div className="flex justify-center items-center space-x-4">
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={item.cumple === true}
                        onChange={() => handleCumpleChange(item.id, true)}
                        className="form-checkbox h-6 w-6 accent-orange-500"
                      />
                      <span className="text-base">SI</span>
                    </label>
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={item.cumple === false}
                        onChange={() => handleCumpleChange(item.id, false)}
                        className="form-checkbox h-6 w-6 accent-orange-500"
                      />
                      <span className="text-base">NO</span>
                    </label>
                  </div>
                </td>
                <td className="px-4 py-3 border-2 border-gray-500 text-base text-gray-700">
                  <textarea
                    value={item.observaciones}
                    onChange={e => handleObservacionesChange(item.id, e.target.value)}
                    className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y min-h-[10px]"
                    placeholder="Agregar observación"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recomendaciones */}
      <div className="mb-6">
        <label className="block mb-1 text-base font-semibold text-gray-800">
          Recomendaciones:
        </label>
        <textarea
          value={recomendaciones}
          onChange={e => setRecomendaciones(e.target.value)}
          className="w-full text-base border-2 border-gray-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y min-h-[120px]"
          placeholder="Ingrese recomendaciones aquí..."
        />
      </div>

      {/* Botones de acción */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleCancelar}
          className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-base font-semibold transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-base font-semibold transition-colors"
        >
          <FaSave className="mr-2" />
          Guardar
        </button>
      </div>
    </div>
  );
}