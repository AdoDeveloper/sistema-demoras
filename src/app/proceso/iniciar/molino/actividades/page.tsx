"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiTrash2, FiEdit, FiPlus, FiClock } from "react-icons/fi";
import dynamic from "next/dynamic";

// Importar react-select de forma dinámica
const Select = dynamic(() => import("react-select"), { ssr: false });

// Definición del tipo de opción para react-select
interface OptionType {
  value: string;
  label: string;
}

interface Activity {
  id: number;
  date: string;
  activity: string;
  startTime: string;
  endTime: string;
  duration: string;
  responsables: string;
}

const activitiesOptions: OptionType[] = [
  { value: "Limpieza de molino", label: "Limpieza de molino" },
  { value: "Lavado de molino", label: "Lavado de molino" },
  { value: "Lavado del area de trabajo", label: "Lavado del area de trabajo" },
  {
    value: "Cambio de ducto de alimentacion de la cadena de envasado",
    label: "Cambio de ducto de alimentacion de la cadena de envasado",
  },
  { value: "Sacando terrones", label: "Sacando terrones" },
  { value: "Separando el ducto de alimentcion", label: "Separando el ducto de alimentcion" },
  { value: "Cambio de criba", label: "Cambio de criba" },
  {
    value: "Detencion del molino por cambio de criba",
    label: "Detencion del molino por cambio de criba",
  },
  { value: "Cambio de chapaleta del molino 1", label: "Cambio de chapaleta del molino 1" },
  { value: "Cambio de chapaleta del molino 2", label: "Cambio de chapaleta del molino 2" },
  {
    value: "Limpieza en el costado poniende del silo 12",
    label: "Limpieza en el costado poniende del silo 12",
  },
  { value: "Otro", label: "Otro" },
];

const timeStringToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(":");
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
  return hours * 3600 + minutes * 60 + seconds;
};

const secondsToTimeString = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function Actividades() {
  const router = useRouter();

  // Estados
  const [generalDate, setGeneralDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [customActivity, setCustomActivity] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [responsables, setResponsables] = useState<string>("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Cargar datos de "activitiesProcess"
  useEffect(() => {
    const storedData = localStorage.getItem("activitiesProcess");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.generalDate) setGeneralDate(parsedData.generalDate);
      if (parsedData.actividades) setActivities(parsedData.actividades);
    }
  }, []);

  // Cargar cache de formulario
  useEffect(() => {
    const cachedForm = localStorage.getItem("activityFormCache");
    if (cachedForm) {
      const data = JSON.parse(cachedForm);
      if (data.generalDate) setGeneralDate(data.generalDate);
      if (data.selectedActivity) setSelectedActivity(data.selectedActivity);
      if (data.customActivity) setCustomActivity(data.customActivity);
      if (data.startTime) setStartTime(data.startTime);
      if (data.endTime) setEndTime(data.endTime);
      if (data.responsables) setResponsables(data.responsables);
    }
  }, []);

  // Actualizar cache de formulario al cambiar campos
  useEffect(() => {
    const formCache = {
      generalDate,
      selectedActivity,
      customActivity,
      startTime,
      endTime,
      responsables,
    };
    localStorage.setItem("activityFormCache", JSON.stringify(formCache));
  }, [generalDate, selectedActivity, customActivity, startTime, endTime, responsables]);

  // Calcular el tiempo total acumulado
  const totalSeconds = activities.reduce((acc, act) => acc + timeStringToSeconds(act.duration), 0);
  const totalDuration = secondsToTimeString(totalSeconds);

  // Transformar la lista para quitar id y date y agregar responsables
  const transformActivities = (acts: Activity[]) =>
    acts.map(({ activity, startTime, endTime, duration, responsables }) => ({
      activity,
      startTime,
      endTime,
      duration,
      responsables,
    }));

  // Guardar la información en "activitiesProcess"
  useEffect(() => {
    const dataToStore = {
      generalDate,
      actividades: transformActivities(activities),
      totalActivities: activities.length,
      totalDuration,
    };
    localStorage.setItem("activitiesProcess", JSON.stringify(dataToStore));
  }, [activities, generalDate, totalDuration]);

  const handleSetNowTime = (setter: (value: string) => void) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    setter(`${hh}:${mm}:${ss}`);
  };

  const resetForm = () => {
    setSelectedActivity("");
    setCustomActivity("");
    setStartTime("");
    setEndTime("");
    setResponsables("");
    setEditingId(null);
    localStorage.removeItem("activityFormCache");
  };

  const handleAddOrUpdateActivity = (): void => {
    // Validar campos obligatorios
    if (!selectedActivity || !startTime || !endTime || !responsables) {
      Swal.fire("Error", "Por favor complete todos los campos", "error");
      return;
    }
    // Si se seleccionó "Otro", se requiere ingresar la actividad manualmente
    const activityToUse = selectedActivity === "Otro" ? customActivity : selectedActivity;
    if (!activityToUse) {
      Swal.fire("Error", "Por favor ingrese la actividad personalizada", "error");
      return;
    }
    const startSec = timeStringToSeconds(startTime);
    const endSec = timeStringToSeconds(endTime);
    const diffSec = endSec - startSec;
    if (diffSec < 0) {
      Swal.fire("Error", "La hora final debe ser mayor que la hora de inicio", "error");
      return;
    }
    const duration = secondsToTimeString(diffSec);
    if (editingId === null) {
      const newActivity: Activity = {
        id: Date.now(),
        date: generalDate,
        activity: activityToUse,
        startTime,
        endTime,
        duration,
        responsables,
      };
      setActivities([...activities, newActivity]);
    } else {
      const updatedActivities = activities.map((act) =>
        act.id === editingId
          ? { ...act, activity: activityToUse, startTime, endTime, duration, date: generalDate, responsables }
          : act
      );
      setActivities(updatedActivities);
    }
    resetForm(); // Limpia el formulario y remueve la cache
  };

  const handleEditActivity = (activity: Activity): void => {
    // Verificar si la actividad se encuentra en las opciones predefinidas
    const predefinedOption = activitiesOptions.find((option) => option.value === activity.activity);
    if (predefinedOption) {
      setSelectedActivity(activity.activity);
      setCustomActivity("");
    } else {
      setSelectedActivity("Otro");
      setCustomActivity(activity.activity);
    }
    setStartTime(activity.startTime);
    setEndTime(activity.endTime);
    setResponsables(activity.responsables);
    setEditingId(activity.id);
  };

  const handleDeleteActivity = (id: number): void => {
    Swal.fire({
      title: "¿Está seguro?",
      text: "Esta acción eliminará la actividad.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        setActivities(activities.filter((act) => act.id !== id));
      }
    });
  };

  // Confirmación antes de enviar
  const handleSendData = async () => {
    Swal.fire({
      title: "¿Desea enviar los datos?",
      text: "Los datos se guardarán definitivamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "No, cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Mostrar alerta de "Enviando datos" con loading
        Swal.fire({
          title: "Enviando datos",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
  
        const dataToSend = {
          actividadProcess: {
            generalDate,
            totalActivities: activities.length,
            totalDuration,
            actividades: transformActivities(activities),
          },
        };
  
        try {
          const response = await fetch("/api/demoras/actividad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSend),
          });
  
          Swal.close(); // Cerrar alerta de loading
  
          if (response.ok) {
            Swal.fire("Éxito", "Datos enviados correctamente", "success").then(() => {
              // Borrar las keys del storage
              localStorage.removeItem("activitiesProcess");
              localStorage.removeItem("activityFormCache");
              // Redirigir a /proceso/iniciar
              router.push("/proceso/iniciar");
            });
          } else {
            Swal.fire("Error", "Hubo un problema al enviar los datos", "error");
          }
        } catch (error) {
          console.error(error);
          Swal.close();
          Swal.fire("Error", "Error al enviar los datos", "error");
        }
      }
    });
  };

  const handleCancel = () => {
    Swal.fire({
      title: "¿Está seguro de cancelar?",
      text: "Se borrará la información almacenada y se retornará.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, continuar",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("activitiesProcess");
        localStorage.removeItem("activityFormCache");
        router.push("/proceso/iniciar");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-2 text-slate-900">
      <div className="w-full max-w-7xl bg-white rounded-lg shadow p-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="mr-2 bg-orange-100 text-white rounded-full p-1">
            <FiClock className="text-orange-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-blue-800">Actividades</h2>
        </div>
        {/* Fecha general */}
        <div className="mb-6">
          <label className="block font-semibold mb-1 text-sm">Fecha</label>
          <input
            type="date"
            value={generalDate}
            onChange={(e) => setGeneralDate(e.target.value)}
            className="border p-2 text-sm rounded w-full" // Se agrega w-full
          />
        </div>
        {/* Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block font-semibold mb-1 text-sm">Actividad</label>
            <Select
              options={activitiesOptions}
              value={activitiesOptions.find((option) => option.value === selectedActivity) || null}
              onChange={(option: OptionType | null) =>
                setSelectedActivity(option ? option.value : "")
              }
              placeholder="Seleccione actividad"
            />
            {/* Si se selecciona "Otro", mostrar campo para actividad personalizada */}
            {selectedActivity === "Otro" && (
              <input
                type="text"
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                placeholder="Ingrese la actividad"
                className="border p-2 text-sm rounded mt-2 w-full"
              />
            )}
          </div>
          <div className="flex flex-col">
            <label className="block font-semibold mb-1 text-sm">Responsables</label>
            <textarea
              value={responsables}
              onChange={(e) => setResponsables(e.target.value)}
              placeholder="Ingrese responsables"
              className="border p-2 text-sm rounded w-full resize-none" // Textarea para responsables
            />
          </div>
          <div className="flex flex-col">
            <label className="block font-semibold mb-1 text-sm">Hora de inicio</label>
            <div className="flex gap-2">
              <input
                type="time"
                step="1"
                className="border p-2 text-sm rounded w-full"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <button
                className="bg-orange-500 text-white px-3 rounded text-sm"
                onClick={() => handleSetNowTime(setStartTime)}
                type="button"
              >
                Ahora
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block font-semibold mb-1 text-sm">Hora final</label>
            <div className="flex gap-2">
              <input
                type="time"
                step="1"
                className="border p-2 text-sm rounded w-full"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              <button
                className="bg-orange-500 text-white px-3 rounded text-sm"
                onClick={() => handleSetNowTime(setEndTime)}
                type="button"
              >
                Ahora
              </button>
            </div>
          </div>
        </div>
        {/* Agregar/Actualizar */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleAddOrUpdateActivity}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
          >
            {editingId === null ? (
              <>
                <FiPlus className="mr-2" />
                Agregar
              </>
            ) : (
              <>
                <FiEdit className="mr-2" />
                Actualizar
              </>
            )}
          </button>
          {editingId !== null && (
            <button
              onClick={resetForm}
              className="ml-2 flex items-center bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded shadow transition"
              type="button"
            >
              Cancelar Edición
            </button>
          )}
        </div>
        {/* Tabla de actividades */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100 text-blue-800">
              <tr>
                <th className="px-4 py-2 border">Actividad</th>
                <th className="px-4 py-2 border">Responsables</th>
                <th className="px-4 py-2 border">Inicio</th>
                <th className="px-4 py-2 border">Final</th>
                <th className="px-4 py-2 border">Duración</th>
                <th className="px-4 py-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No hay actividades registradas.
                  </td>
                </tr>
              ) : (
                activities.map((act, index) => (
                  <tr key={act.id || index}>
                    <td className="px-4 py-2 border">{act.activity}</td>
                    <td className="px-4 py-2 border">{act.responsables}</td>
                    <td className="px-4 py-2 border">{act.startTime}</td>
                    <td className="px-4 py-2 border">{act.endTime}</td>
                    <td className="px-4 py-2 border">{act.duration}</td>
                    <td className="px-4 py-2 border">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditActivity(act)}
                          className="text-blue-600 hover:text-blue-700 p-2"
                          title="Editar"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Eliminar"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Resumen y botones de acción */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-700">
          <div>
            <strong>Total de actividades:</strong> {activities.length}
          </div>
          <div>
            <strong>Tiempo total acumulado:</strong> {totalDuration}
          </div>
        </div>
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSendData}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
