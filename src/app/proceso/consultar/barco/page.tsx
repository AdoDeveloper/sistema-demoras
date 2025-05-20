"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { FaEye, FaEdit } from "react-icons/fa";
import { FiArrowLeft, FiTrash2, FiRefreshCw } from "react-icons/fi";

// Función debounce
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Interfaz de un Barco (ajusta campos según tu modelo)
interface Barco {
  id: number;
  muelle: string | null;
  vaporBarco: string | null;
  fechaArribo: string | null;
  horaArribo: string | null;
  fechaAtraque: string | null;
  horaAtraque: string | null;
  fechaRecibido: string | null;
  horaRecibido: string | null;
  fechaInicioOperaciones: string | null;
  horaInicioOperaciones: string | null;
  fechaFinOperaciones?: string | null;
  horaFinOperaciones?: string | null;
  tipoCarga: string | null;
  sistemaUtilizado: string | null;
}

// Opciones para checks
const TIPO_CARGA_OPCIONES = [
  "CEREALES",
  "AZÚCAR CRUDA",
  "CARBÓN",
  "MELAZA",
  "GRASA AMARILLA",
  "YESO",
];
const SISTEMA_UTILIZADO_OPCIONES = [
  "UNIDAD DE CARGA",
  "SUCCIONADORA",
  "ALMEJA",
  "CHINGUILLOS",
  "EQUIPO BULHER",
  "ALAMBRE",
];

export default function BarcosPage() {
  // Estados para la lista y paginación
  const [barcos, setBarcos] = useState<Barco[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Datos del formulario para crear/editar
  const [editId, setEditId] = useState<number | null>(null);
  const [muelle, setMuelle] = useState("");
  const [vaporBarco, setVaporBarco] = useState("");
  const [fechaArribo, setFechaArribo] = useState("");
  const [horaArribo, setHoraArribo] = useState("");
  const [fechaAtraque, setFechaAtraque] = useState("");
  const [horaAtraque, setHoraAtraque] = useState("");
  const [fechaRecibido, setFechaRecibido] = useState("");
  const [horaRecibido, setHoraRecibido] = useState("");
  const [fechaInicioOp, setFechaInicioOp] = useState("");
  const [horaInicioOp, setHoraInicioOp] = useState("");
  const [fechaFinOp, setFechaFinOp] = useState("");
  const [horaFinOp, setHoraFinOp] = useState("");
  const [tipoCarga, setTipoCarga] = useState<string[]>([]);
  const [sistemaUtilizado, setSistemaUtilizado] = useState<string[]>([]);

  // Estado para datos a visualizar en el modal de ver detalles
  const [viewData, setViewData] = useState<Barco | null>(null);

  // Función debounced para actualizar el estado de búsqueda
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
    }, 500),
    []
  );

  // Función para cargar datos de la API
  async function fetchBarcos() {
    setLoading(true);
    try {
      const pageParam = page < 1 ? 1 : page;
      const res = await fetch(
        `/api/barcos?search=${search}&page=${pageParam}&limit=${limit}`
      );
      const data = await res.json();
      setBarcos(data.data || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error("Error al listar barcos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la lista de barcos",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBarcos();
  }, [search, page, limit]);

  // Función para refrescar la lista
  async function handleRefresh() {
    setRefreshLoading(true);
    await fetchBarcos();
    setRefreshLoading(false);
    Swal.fire("Refrescado", "Datos actualizados", "success");
  }

  // Función para ver detalles completos del barco (usa datos de la lista)
  function handleView(id: number) {
    const barcoFound = barcos.find((b) => b.id === id);
    if (!barcoFound) {
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "Barco no encontrado",
      });
    }
    setViewData(barcoFound);
    setShowViewModal(true);
  }

  // Abre el modal de creación y resetea los campos
  function openCreateModal() {
    setEditId(null);
    setMuelle("");
    setVaporBarco("");
    setFechaArribo("");
    setHoraArribo("");
    setFechaAtraque("");
    setHoraAtraque("");
    setFechaRecibido("");
    setHoraRecibido("");
    setFechaInicioOp("");
    setHoraInicioOp("");
    setFechaFinOp("");
    setHoraFinOp("");
    setTipoCarga([]);
    setSistemaUtilizado([]);
    setShowCreateModal(true);
  }

  // Crea un nuevo barco (POST)
  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    
    const missingFields: string[] = [];
    if (!muelle.trim()) missingFields.push("muelle");
    if (!vaporBarco.trim()) missingFields.push("vapor/barco");
    if (tipoCarga.length === 0) missingFields.push("tipo de carga");
  
    if (missingFields.length > 0) {
      return Swal.fire({
        icon: "warning",
        title: "Campos obligatorios faltantes",
        text: `Falta ingresar: ${missingFields.join(", ")}`,
      });
    }
    
    try {
      Swal.fire({
        title: "Procesando solicitud...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const body = {
        muelle,
        vaporBarco,
        fechaArribo,
        horaArribo,
        fechaAtraque,
        horaAtraque,
        fechaRecibido,
        horaRecibido,
        fechaInicioOperaciones: fechaInicioOp,
        horaInicioOperaciones: horaInicioOp,
        fechaFinOperaciones: fechaFinOp,
        horaFinOperaciones: horaFinOp,
        tipoCarga,
        sistemaUtilizado,
      };
      const res = await fetch("/api/barcos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      Swal.close();
      if (!res.ok) throw new Error("Error al crear barco");
      setShowCreateModal(false);
      fetchBarcos();
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Barco creado exitosamente",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.close();
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al crear barco",
      });
    }
  }

  // Abre el modal de edición precargando los datos del registro actual
  function openEditModal(id: number) {
    const barcoData = barcos.find((b) => b.id === id);
    if (!barcoData) {
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "Barco no encontrado",
      });
    }
    setEditId(barcoData.id);
    setMuelle(barcoData.muelle || "");
    setVaporBarco(barcoData.vaporBarco || "");
    setFechaArribo(barcoData.fechaArribo || "");
    setHoraArribo(barcoData.horaArribo || "");
    setFechaAtraque(barcoData.fechaAtraque || "");
    setHoraAtraque(barcoData.horaAtraque || "");
    setFechaRecibido(barcoData.fechaRecibido || "");
    setHoraRecibido(barcoData.horaRecibido || "");
    setFechaInicioOp(barcoData.fechaInicioOperaciones || "");
    setHoraInicioOp(barcoData.horaInicioOperaciones || "");
    setFechaFinOp(barcoData.fechaFinOperaciones || "");
    setHoraFinOp(barcoData.horaFinOperaciones || "");
    const tc = barcoData.tipoCarga ? JSON.parse(barcoData.tipoCarga) : [];
    const su = barcoData.sistemaUtilizado ? JSON.parse(barcoData.sistemaUtilizado) : [];
    setTipoCarga(tc);
    setSistemaUtilizado(su);
    setShowEditModal(true);
  }

  // Actualiza un barco (PUT)
  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    try {
      Swal.fire({
        title: "Actualizando...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const body = {
        muelle,
        vaporBarco,
        fechaArribo,
        horaArribo,
        fechaAtraque,
        horaAtraque,
        fechaRecibido,
        horaRecibido,
        fechaInicioOperaciones: fechaInicioOp,
        horaInicioOperaciones: horaInicioOp,
        fechaFinOperaciones: fechaFinOp,
        horaFinOperaciones: horaFinOp,
        tipoCarga,
        sistemaUtilizado,
      };
      const res = await fetch(`/api/barcos/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      Swal.close();
      if (!res.ok) throw new Error("Error al actualizar barco");
      setShowEditModal(false);
      fetchBarcos();
      Swal.fire({
        icon: "success",
        title: "Actualizado",
        text: "Barco actualizado exitosamente",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.close();
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al actualizar barco",
      });
    }
  }

  // Elimina un barco (DELETE)
  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "¿Eliminar este barco?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/barcos/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar barco");
        fetchBarcos();
        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "Barco eliminado exitosamente",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al eliminar barco:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al eliminar barco",
        });
      }
    }
  }

  // Paginación
  const totalPages = Math.ceil(totalCount / limit);

  // Toggle checks
  function toggleCheckTipoCarga(item: string) {
    setTipoCarga((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }
  function toggleCheckSistema(item: string) {
    setSistemaUtilizado((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#003E9B] text-white shadow-lg md:sticky md:top-0 z-50">
        <div className="mx-auto px-4 py-4">
          <div className="flex flex-row justify-between">
            <div className="flex items-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-white hover:bg-gray-200 text-blue-600 p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
                title="Volver"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">Registros Barco</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleRefresh}
                title="Refrescar"
                className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded flex items-center gap-1 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                {refreshLoading ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                ) : (
                  <FiRefreshCw size={20} />
                )}
                <span className="md:inline">Refrescar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="p-4 max-w-6xl mx-auto">
        {/* Fila de búsqueda y nuevo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSetSearch(e.target.value);
              setPage(1);
            }}
            className="border px-2 py-1 rounded-md"
          />
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            + Agregar
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm bg-white">
            <thead className="bg-gray-300">
              <tr>
                <th className="p-2 border whitespace-nowrap">Muelle</th>
                <th className="p-2 border whitespace-nowrap">Vapor/Barco</th>
                <th className="p-2 border whitespace-nowrap">Arribo</th>
                <th className="p-2 border whitespace-nowrap">Atraque</th>
                <th className="p-2 border whitespace-nowrap">Recibido</th>
                <th className="p-2 border whitespace-nowrap">Inicio Operaciones</th>
                <th className="p-2 border whitespace-nowrap">Fin Operaciones</th>
                <th className="p-2 border whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {barcos.length === 0 ? (
                <tr>
                  <td className="p-2 border text-center" colSpan={7}>
                    No hay registros
                  </td>
                </tr>
              ) : (
                barcos.map((barco) => (
                  <tr key={barco.id} className="border-b text-center">
                    <td className="p-2 border whitespace-nowrap">{barco.muelle}</td>
                    <td className="p-2 border whitespace-nowrap">{barco.vaporBarco}</td>
                    <td className="p-2 border whitespace-nowrap">
                      {barco.fechaArribo} {barco.horaArribo}
                    </td>
                    <td className="p-2 border whitespace-nowrap">
                      {barco.fechaAtraque} {barco.horaAtraque}
                    </td>
                    <td className="p-2 border whitespace-nowrap">
                      {barco.fechaRecibido} {barco.horaRecibido}
                    </td>
                    <td className="p-2 border whitespace-nowrap">
                      {barco.fechaInicioOperaciones} {barco.horaInicioOperaciones}
                    </td>
                    <td className="p-2 border whitespace-nowrap">
                      {barco.fechaFinOperaciones} {barco.horaFinOperaciones}
                    </td>
                    <td className="p-2 border text-center whitespace-nowrap flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(barco.id)}
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md text-xl"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => openEditModal(barco.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md text-xl"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(barco.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md text-xl"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación y opción de registros por página */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
          <div className="flex overflow-x-auto space-x-2 w-full sm:w-auto">
            <button
              className="px-3 py-1 bg-white border rounded disabled:opacity-50 flex-shrink-0"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={page === 1 || loading || totalCount === 0}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`px-3 py-1 border rounded flex-shrink-0 ${
                  page === index + 1 ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 bg-white border rounded disabled:opacity-50 flex-shrink-0"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page === totalPages || loading || totalCount === 0}
            >
              Siguiente
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center">
            <span className="text-sm">
              Mostrando {barcos.length} de {totalCount} registros.
            </span>
            <div className="flex items-center gap-1">
              <label htmlFor="recordsPerPage" className="text-sm">
                Mostrar:
              </label>
              <select
                id="recordsPerPage"
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="text-black px-2 py-1 rounded"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="400">400</option>
                <option value="800">800</option>
                <option value="1200">1200</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CREAR */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl lg:max-w-4xl p-6 rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Nuevo Barco</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-6">
                {/* MUELLE y VAPOR/BARCO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">MUELLE</label>
                    <input
                      type="text"
                      value={muelle}
                      onChange={(e) => setMuelle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese muelle"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">VAPOR/BARCO</label>
                    <input
                      type="text"
                      value={vaporBarco}
                      onChange={(e) => setVaporBarco(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese nombre del barco"
                      required
                    />
                  </div>
                </div>

                {/* Tipo de Carga y Sistema Utilizado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <fieldset className="border p-4 rounded-xl">
                    <legend className="text-sm font-medium text-gray-700 px-2">TIPO DE CARGA</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {TIPO_CARGA_OPCIONES.map((item) => (
                        <label key={item} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={tipoCarga.includes(item)}
                            onChange={() => toggleCheckTipoCarga(item)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="border p-4 rounded-xl">
                    <legend className="text-sm font-medium text-gray-700 px-2">SISTEMA UTILIZADO</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {SISTEMA_UTILIZADO_OPCIONES.map((item) => (
                        <label key={item} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={sistemaUtilizado.includes(item)}
                            onChange={() => toggleCheckSistema(item)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* Sección de Fechas y Horas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* ARRIBO */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">ARRIBO</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaArribo}
                          onChange={(e) => setFechaArribo(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaArribo}
                          onChange={(e) => setHoraArribo(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ATRAQUE */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">ATRAQUE</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaAtraque}
                          onChange={(e) => setFechaAtraque(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaAtraque}
                          onChange={(e) => setHoraAtraque(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RECIBIDO */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">RECIBIDO</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaRecibido}
                          onChange={(e) => setFechaRecibido(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaRecibido}
                          onChange={(e) => setHoraRecibido(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* INICIO OPERACIONES */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">INICIO OPERACIONES</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaInicioOp}
                          onChange={(e) => setFechaInicioOp(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaInicioOp}
                          onChange={(e) => setHoraInicioOp(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FIN OPERACIONES */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">FIN OPERACIONES</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaFinOp}
                          onChange={(e) => setFechaFinOp(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaFinOp}
                          onChange={(e) => setHoraFinOp(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="border-2 px-5 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Guardar Barco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl lg:max-w-4xl p-6 rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Detalles del Barco</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">MUELLE</label>
                  <div className="w-full px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                    <span className={viewData.muelle ? "text-gray-800" : "text-gray-400"}>{viewData.muelle || "-"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">VAPOR/BARCO</label>
                  <div className="w-full px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                    <span className={viewData.vaporBarco ? "text-gray-800" : "text-gray-400"}>{viewData.vaporBarco || "-"}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ARRIBO */}
                <div className="border p-3 rounded-xl bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">ARRIBO</h3>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm text-gray-600">Fecha: </span>
                      <span className={viewData.fechaArribo ? "text-gray-800" : "text-gray-400"}>{viewData.fechaArribo || "-"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Hora: </span>
                      <span className={viewData.horaArribo ? "text-gray-800" : "text-gray-400"}>{viewData.horaArribo || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* ATRAQUE */}
                <div className="border p-3 rounded-xl bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">ATRAQUE</h3>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm text-gray-600">Fecha: </span>
                      <span className={viewData.fechaAtraque ? "text-gray-800" : "text-gray-400"}>{viewData.fechaAtraque || "-"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Hora: </span>
                      <span className={viewData.horaAtraque ? "text-gray-800" : "text-gray-400"}>{viewData.horaAtraque || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* RECIBIDO */}
                <div className="border p-3 rounded-xl bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">RECIBIDO</h3>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm text-gray-600">Fecha: </span>
                      <span className={viewData.fechaRecibido ? "text-gray-800" : "text-gray-400"}>{viewData.fechaRecibido || "-"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Hora: </span>
                      <span className={viewData.horaRecibido ? "text-gray-800" : "text-gray-400"}>{viewData.horaRecibido || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* INICIO OPERACIONES */}
                <div className="border p-3 rounded-xl bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">INICIO OPERACIONES</h3>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm text-gray-600">Fecha: </span>
                      <span className={viewData.fechaInicioOperaciones ? "text-gray-800" : "text-gray-400"}>{viewData.fechaInicioOperaciones || "-"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Hora: </span>
                      <span className={viewData.horaInicioOperaciones ? "text-gray-800" : "text-gray-400"}>{viewData.horaInicioOperaciones || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* FIN OPERACIONES */}
                <div className="border p-3 rounded-xl bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">FIN OPERACIONES</h3>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm text-gray-600">Fecha: </span>
                      <span className={viewData.fechaFinOperaciones ? "text-gray-800" : "text-gray-400"}>{viewData.fechaFinOperaciones || "-"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Hora: </span>
                      <span className={viewData.horaFinOperaciones ? "text-gray-800" : "text-gray-400"}>{viewData.horaFinOperaciones || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">TIPO DE CARGA</label>
                  <div className="w-full px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                    <span className={viewData.tipoCarga ? "text-gray-800" : "text-gray-400"}>
                      {viewData.tipoCarga ? JSON.parse(viewData.tipoCarga).join(", ") : "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">SISTEMA UTILIZADO</label>
                  <div className="w-full px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                    <span className={viewData.sistemaUtilizado ? "text-gray-800" : "text-gray-400"}>
                      {viewData.sistemaUtilizado ? JSON.parse(viewData.sistemaUtilizado).join(", ") : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl lg:max-w-4xl p-6 rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Editar Barco</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="space-y-6">
                {/* MUELLE y VAPOR/BARCO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">MUELLE</label>
                    <input
                      type="text"
                      value={muelle}
                      onChange={(e) => setMuelle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese muelle"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">VAPOR/BARCO</label>
                    <input
                      type="text"
                      value={vaporBarco}
                      onChange={(e) => setVaporBarco(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ingrese nombre del barco"
                      required
                    />
                  </div>
                </div>

                {/* Tipo de Carga y Sistema Utilizado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <fieldset className="border p-4 rounded-xl">
                    <legend className="text-sm font-medium text-gray-700 px-2">TIPO DE CARGA</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {TIPO_CARGA_OPCIONES.map((item) => (
                        <label key={item} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={tipoCarga.includes(item)}
                            onChange={() => toggleCheckTipoCarga(item)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="border p-4 rounded-xl">
                    <legend className="text-sm font-medium text-gray-700 px-2">SISTEMA UTILIZADO</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {SISTEMA_UTILIZADO_OPCIONES.map((item) => (
                        <label key={item} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={sistemaUtilizado.includes(item)}
                            onChange={() => toggleCheckSistema(item)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* Sección de Fechas y Horas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* ARRIBO */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">ARRIBO</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaArribo}
                          onChange={(e) => setFechaArribo(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaArribo}
                          onChange={(e) => setHoraArribo(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ATRAQUE */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">ATRAQUE</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaAtraque}
                          onChange={(e) => setFechaAtraque(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaAtraque}
                          onChange={(e) => setHoraAtraque(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RECIBIDO */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">RECIBIDO</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaRecibido}
                          onChange={(e) => setFechaRecibido(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaRecibido}
                          onChange={(e) => setHoraRecibido(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* INICIO OPERACIONES */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">INICIO OPERACIONES</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaInicioOp}
                          onChange={(e) => setFechaInicioOp(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaInicioOp}
                          onChange={(e) => setHoraInicioOp(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FIN OPERACIONES */}
                  <div className="border p-4 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">FIN OPERACIONES</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={fechaFinOp}
                          onChange={(e) => setFechaFinOp(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaFinOp}
                          onChange={(e) => setHoraFinOp(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="border-2 px-5 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Actualizar Barco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
