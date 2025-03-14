"use client"; // Asegura que este componente se renderice del lado del cliente

import { useEffect, useState } from "react";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Footer from "../../../../components/Footer";
import PDFBitacora from "../../../../components/PDFBitacora";
import { PDFDownloadLink } from "@react-pdf/renderer";

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

/** Convierte "HH:MM" a minutos numéricos */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hh, mm] = timeStr.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
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

  // Estado para renderizar condicionalmente el PDFDownloadLink
  const [renderPDFLink, setRenderPDFLink] = useState(false);

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

  // Efecto que utiliza polling para simular el clic en el PDFDownloadLink
  // tan pronto el PDF esté listo (cuando el enlace tenga el atributo href)
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

  // Manejo de checkboxes para "Tipo de Carga" y "Sistema Utilizado"
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

  // Estado para la nueva operación (fila de ingreso)
  const [newOperacion, setNewOperacion] = useState<Operacion>({
    bdsTs: "",
    inicio: "",
    final: "",
    minutos: "",
    actividad: "",
  });

  /** Maneja cambios en la nueva operación */
  const handleOperacionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewOperacion((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "inicio" || name === "final") {
        const start = parseTimeToMinutes(updated.inicio);
        const end = parseTimeToMinutes(updated.final);
        if (start && end && end >= start) {
          updated.minutos = String(end - start);
        } else {
          updated.minutos = "";
        }
      }
      if (name === "actividad") {
        if (value === "otro") {
          setIsOther(true);
          updated.actividad = "";
        } else {
          setIsOther(false);
          updated.actividad = value;
        }
      }
      return updated;
    });
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

  /** Agrega la nueva operación, validando campos y relación de horas */
  const addOperacion = () => {
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
    if (parseTimeToMinutes(newOperacion.final) < parseTimeToMinutes(newOperacion.inicio)) {
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
    setFormData((prev) => ({
      ...prev,
      operaciones: [...prev.operaciones, newOperacion],
    }));
    resetNewOperacion();
    Swal.fire({
      icon: "success",
      title: "Actividad agregada",
      showConfirmButton: false,
      timer: 1200,
    });
  };

  /** Botón "Cancelar" del formulario */
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
                        onClick={() => deleteOperacion(index)}
                        title="Eliminar"
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 size={23} />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Fila para ingreso de nueva operación */}
                <tr>
                  <td className="p-2 border">
                    <input
                      type="text"
                      name="bdsTs"
                      placeholder="BD-2"
                      value={newOperacion.bdsTs}
                      onChange={handleOperacionChange}
                      className="w-24 sm:w-20 h-7 border rounded-sm px-1 text-xs"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="time"
                      name="inicio"
                      value={newOperacion.inicio}
                      onChange={handleOperacionChange}
                      className="w-full h-7 border rounded-sm px-1"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="time"
                      name="final"
                      value={newOperacion.final}
                      onChange={handleOperacionChange}
                      className="w-full h-7 border rounded-sm px-1"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      name="minutos"
                      value={newOperacion.minutos}
                      readOnly
                      className="w-full sm:w-20 h-7 border rounded-sm px-1 bg-gray-50"
                    />
                  </td>
                  <td className="p-2 border flex flex-col w-50">
                    <select
                      name="actividad"
                      value={isOther ? "otro" : newOperacion.actividad}
                      onChange={handleOperacionChange}
                      className="w-full h-7 border rounded-sm px-1 mb-1"
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
                        placeholder="Especificar..."
                        value={newOperacion.actividad}
                        onChange={(e) =>
                          setNewOperacion((prev) => ({ ...prev, actividad: e.target.value }))
                        }
                        className="w-40 sm:w-full border rounded-sm px-1 mt-1 resize-x"
                        rows={2}
                      />
                    )}
                  </td>
                  <td className="p-2 border text-center">
                    {/* Celda vacía */}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={addOperacion}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md"
            >
              <FiPlus size={24} />
              Agregar
            </button>
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
        <div className="flex justify-end space-x-2 mt-4" style={{ transition: "none" }}>
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

          {/* Botón para generar el PDF */}
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            <FiSave size={24} />
            Generar PDF
          </button>

          {/* Renderizado condicional del PDFDownloadLink, oculto fuera del viewport */}
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
