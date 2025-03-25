"use client"; // Asegura que este componente se renderice del lado del cliente

import { useEffect, useState } from "react";
import { FiPlus, FiSave, FiTrash2, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Footer from "../../../../components/Footer";
import PDFBitacora from "../../../../components/PDFBitacora";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FaFilePdf } from "react-icons/fa";

/** Estructura para una operación en la tabla */
type Operacion = {
  bdsTs: string;
  inicio: string;
  final: string;
  minutos: string;
  actividad: string;
};

/** Estructura del formulario completo */
type FormDataType = {
  bValue: string;
  valorMuelle: string;
  fecha: string;
  fechaInicio: string;
  nombreMuellero: string;
  turnoInicio: string;
  turnoFin: string;
  tipoCarga: string[];
  sistemaUtilizado: string[];
  operaciones: Operacion[];
  observaciones: string;
};

const validOptions = ["CARGA", "DESCARGA", "PARO"];

/** Función para obtener la fecha de inicio formateada */
function getFechaInicio() {
  return new Date().toLocaleString("en-GB", { timeZone: "America/El_Salvador" });
}

/** Convierte un string de tiempo (HH:MM o HH:MM:SS) a segundos */
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

/** Calcula la duración entre dos tiempos en formato "X min Y seg" */
function calcularDuracion(inicio: string, final: string): string {
  const startSeconds = parseTimeToSeconds(inicio);
  const endSeconds = parseTimeToSeconds(final);
  if (startSeconds && endSeconds && endSeconds >= startSeconds) {
    const diffSeconds = endSeconds - startSeconds;
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `${minutes} min ${seconds} seg`;
  }
  return "";
}

/** Actualiza la operación con la duración calculada */
function actualizarDuracion(operacion: Operacion): Operacion {
  return {
    ...operacion,
    minutos: calcularDuracion(operacion.inicio, operacion.final),
  };
}

export default function Bitacora() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormDataType>({
    bValue: "",
    valorMuelle: "",
    fecha: "",
    fechaInicio: getFechaInicio(),
    nombreMuellero: "",
    turnoInicio: "",
    turnoFin: "",
    tipoCarga: [],
    sistemaUtilizado: [],
    operaciones: [],
    observaciones: "",
  });

  // Estado para controlar si se muestra el textarea para "OTRO"
  const [isOther, setIsOther] = useState(false);
  // Estado para identificar si se está editando una operación (índice) o agregando una nueva
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // Estado para renderizar condicionalmente el PDFDownloadLink
  const [renderPDFLink, setRenderPDFLink] = useState(false);

  // Estado para la nueva operación (fila de ingreso)
  const [newOperacion, setNewOperacion] = useState<Operacion>({
    bdsTs: "",
    inicio: "",
    final: "",
    minutos: "",
    actividad: "",
  });

  // Estado para la actividad personalizada
  const [customActividad, setCustomActividad] = useState("");

  // Funciones "Ahora" para cada campo
  const handleAhoraInicio = () => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setNewOperacion((prev) => actualizarDuracion({ ...prev, inicio: hora }));
  };

  const handleAhoraFinal = () => {
    const now = new Date();
    const hora = now.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "America/El_Salvador",
    });
    setNewOperacion((prev) => actualizarDuracion({ ...prev, final: hora }));
  };

  // Función para cancelar la edición de una operación
  const handleCancelEdit = () => {
    resetNewOperacion();
    setEditingIndex(null);
  };

  // Cargar datos desde localStorage al montar el componente
  useEffect(() => {
    const storedData = localStorage.getItem("bitacoraData");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setFormData({
        ...parsed,
        fechaInicio: parsed.fechaInicio || getFechaInicio(),
        operaciones: parsed.operaciones || [],
      });
    } else {
      setFormData((prev) => ({ ...prev, fechaInicio: getFechaInicio() }));
    }
    const muellero = localStorage.getItem("userNameAll");
    if (muellero) {
      setFormData((prev) => ({ ...prev, nombreMuellero: muellero }));
    }
  }, []);

  // Actualizar localStorage cada vez que cambie formData
  useEffect(() => {
    localStorage.setItem("bitacoraData", JSON.stringify(formData));
  }, [formData]);

  // Efecto para simular el clic en el PDFDownloadLink
  useEffect(() => {
    if (renderPDFLink) {
      const interval = setInterval(() => {
        const link = document.getElementById("pdfDownloadLink");
        if (link && link.getAttribute("href")) {
          link.click();
          clearInterval(interval);
          setRenderPDFLink(false);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [renderPDFLink]);

  // Manejo de inputs generales
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de checkboxes
  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    groupKey: "tipoCarga" | "sistemaUtilizado"
  ) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const current = prev[groupKey];
      return checked
        ? { ...prev, [groupKey]: [...current, value] }
        : { ...prev, [groupKey]: current.filter((item) => item !== value) };
    });
  };

  /** Maneja cambios en los campos de la nueva operación (excepto actividad) */
  const handleOperacionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  /** Manejador específico para el select de actividad */
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

  /** Resetea los campos de la nueva operación */
  const resetNewOperacion = () => {
    setNewOperacion({
      bdsTs: "",
      inicio: "",
      final: "",
      minutos: "",
      actividad: "",
    });
    setIsOther(false);
    setCustomActividad("");
  };

  /** Función para eliminar una operación */
  const deleteOperacion = (index: number) => {
    Swal.fire({
      title: "¿Eliminar actividad?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData((prev) => ({
          ...prev,
          operaciones: prev.operaciones.filter((_, i) => i !== index),
        }));
        Swal.fire({
          icon: "success",
          title: "Operación eliminada",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    });
  };

  /** Función para agregar o actualizar la operación */
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

    if (editingIndex !== null) {
      // Actualizar operación existente
      setFormData((prev) => {
        const updatedOperaciones = [...prev.operaciones];
        updatedOperaciones[editingIndex] = newOperacion;
        return { ...prev, operaciones: updatedOperaciones };
      });
      Swal.fire({
        icon: "success",
        title: "Actividad actualizada",
        showConfirmButton: false,
        timer: 1200,
      });
      setEditingIndex(null);
    } else {
      // Agregar nueva operación
      setFormData((prev) => ({
        ...prev,
        operaciones: [...prev.operaciones, newOperacion],
      }));
      Swal.fire({
        icon: "success",
        title: "Actividad agregada",
        showConfirmButton: false,
        timer: 1200,
      });
    }
    resetNewOperacion();
  };

  /** Carga datos de una operación en el formulario para editarla */
  const handleEditOperacion = (index: number) => {
    const operacion = formData.operaciones[index];
    // Si la actividad de la operación no es una de las opciones válidas, activar modo "otro"
    if (!validOptions.includes(operacion.actividad)) {
      setIsOther(true);
      setCustomActividad(operacion.actividad);
    } else {
      setIsOther(false);
      setCustomActividad("");
    }
    setNewOperacion(operacion);
    setEditingIndex(index);
  };

  /** Botón "Cancelar" del formulario principal */
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
        localStorage.removeItem("bitacoraData");
        router.push("/proceso/iniciar");
      }
    });
  };

  /** Botón "Guardar Bitácora" */
  const handleSubmit = () => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const payload = {
      ...formData,
      userId,
      userName,
    };
    console.log("Payload a enviar:", payload);
    Swal.fire({
      icon: "success",
      title: "Bitácora guardada",
      text: "Los datos se han guardado exitosamente.",
    });
  };

  /** Función para activar la generación del PDF */
  const handleGeneratePDF = () => {
    setRenderPDFLink(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Encabezado */}
      <header className="bg-[#003E9B] px-4 md:px-40 py-4 text-white">
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="ALMAPAC" className="h-16 object-contain mb-2" />
          <h1 className="text-2xl font-bold uppercase text-center">
            Bitácora de Operaciones en Muelle y Abordo
          </h1>
        </div>
        <div className="mx-auto mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold mb-1">CÓDIGO</label>
            <input
              type="text"
              name="bValue"
              value={formData.bValue}
              onChange={handleChange}
              placeholder="B-4"
              className="w-full h-9 border border-gray-300 rounded-md px-2 py-1 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">VAPOR/MUELLE</label>
            <input
              type="text"
              name="valorMuelle"
              value={formData.valorMuelle}
              onChange={handleChange}
              placeholder="Ingrese Vapor/Muelle"
              className="w-full h-9 border border-gray-300 rounded-md px-2 py-1 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">FECHA</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="w-full h-9 border border-gray-300 rounded-md px-2 py-1 text-black"
            />
          </div>
        </div>
      </header>

      {/* Contenedor principal */}
      <main className="max-w-5xl mx-auto bg-white shadow-md mt-4 p-4 mb-4 rounded-md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase">
              Nombre del Muellero
            </label>
            <input
              type="text"
              name="nombreMuellero"
              value={formData.nombreMuellero}
              onChange={handleChange}
              readOnly
              disabled
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
              value={formData.turnoInicio}
              onChange={handleChange}
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
              value={formData.turnoFin}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
        </div>

        {/* Tarjetas para Tipo de Carga y Sistema Utilizado */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
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
                      checked={formData.tipoCarga.includes(tipo)}
                      onChange={(e) => handleCheckboxChange(e, "tipoCarga")}
                      className="h-4 w-4"
                    />
                    <span className="text-xs">{tipo}</span>
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
                {["UNIDAD DE CARGA", "SUCCIONADORA", "ALMEJA", "CHINGUILLOS", "EQUIPO BULHER"].map((sistema) => (
                  <label key={sistema} className="inline-flex items-center space-x-1">
                    <input
                      type="checkbox"
                      value={sistema}
                      checked={formData.sistemaUtilizado.includes(sistema)}
                      onChange={(e) => handleCheckboxChange(e, "sistemaUtilizado")}
                      className="h-4 w-4"
                    />
                    <span className="text-xs">{sistema}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de ingreso de nueva operación */}
        <section className="mb-6 border rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2 uppercase">Nueva Operación</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold">BDS TS</label>
              <input
                type="text"
                name="bdsTs"
                placeholder="BD-2"
                value={newOperacion.bdsTs}
                onChange={handleOperacionChange}
                className="w-full h-10 border rounded-sm px-2 text-xs"
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
                  className="w-full h-10 border rounded-sm px-2"
                  step="1"
                />
                <button
                  type="button"
                  onClick={handleAhoraInicio}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded"
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
                  className="w-full h-10 border rounded-sm px-2"
                  step="1"
                />
                <button
                  type="button"
                  onClick={handleAhoraFinal}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded"
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
                className="w-full h-10 border rounded-sm px-2 bg-gray-50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold">Actividad</label>
              <select
                name="actividad"
                value={isOther ? "otro" : newOperacion.actividad}
                onChange={handleSelectActividadChange}
                className="w-full h-10 border rounded-sm px-2 mb-1"
              >
                <option value="">-- Seleccione --</option>
                {validOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="otro">OTRO</option>
              </select>
              {isOther && (
                <textarea
                  name="actividad"
                  placeholder="Especificar..."
                  value={customActividad}
                  onChange={(e) => {
                    setCustomActividad(e.target.value);
                    setNewOperacion((prev) => ({ ...prev, actividad: e.target.value }));
                  }}
                  className="w-full border rounded-sm px-2 mt-1 resize-x"
                  rows={2}
                />
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addOrUpdateOperacion}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
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
                onClick={handleCancelEdit}
                className="flex items-center ml-2 gap-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
            )}
          </div>
        </section>

        {/* Tabla de operaciones */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
            Descripción de la Actividad o Demora
          </label>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-xs">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">BDS TS</th>
                  <th className="p-2 border">INICIO</th>
                  <th className="p-2 border">FINAL</th>
                  <th className="p-2 border">MINUTOS</th>
                  <th className="p-2 border">ACTIVIDAD</th>
                  <th className="p-2 border">ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {formData.operaciones.map((op, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 border">{op.bdsTs}</td>
                    <td className="p-2 border">{op.inicio}</td>
                    <td className="p-2 border">{op.final}</td>
                    <td className="p-2 border">{op.minutos}</td>
                    <td className="p-2 border">{op.actividad}</td>
                    <td className="p-2 border text-center flex items-center justify-center gap-2">
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
        </div>

        {/* Observaciones */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-2 py-1 resize-y"
            placeholder="Escribe aquí..."
          />
        </div>

        {/* Botones finales */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4" style={{ transition: "none" }}>
          <button 
            onClick={handleCancel} 
            className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            <FiSave size={24} />
            Guardar Bitácora
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            <FaFilePdf size={24} />
            Generar PDF
          </button>
          {renderPDFLink && (
            <PDFDownloadLink
              document={<PDFBitacora formData={formData} />}
              fileName="Bitacora.pdf"
              id="pdfDownloadLink"
              style={{ position: "absolute", top: "-9999px" }}
            >
              {({ loading, error }) =>
                loading ? "Cargando PDF..." : "Listo para descargar"
              }
            </PDFDownloadLink>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
