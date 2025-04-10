"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { FaEye, FaEdit } from "react-icons/fa";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";

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

  // Función para ver detalles completos del barco
  async function handleView(id: number) {
    try {
      const res = await fetch(`/api/barcos/${id}`);
      if (!res.ok) throw new Error("Barco no encontrado");
      const data = await res.json();
      setViewData(data);
      setShowViewModal(true);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar los detalles del barco",
      });
    }
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
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-white hover:bg-gray-200 text-blue-600 p-2 rounded-full transition-all duration-300 transform hover:scale-105"
                title="Volver"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">Registros Barco</h1>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2">
          <div className="bg-white w-full max-w-3xl p-4 rounded-md overflow-y-auto max-h-screen">
            <h2 className="text-xl font-bold mb-4">Información del Barco</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* MUELLE y VAPOR/BARCO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">MUELLE</label>
                  <input
                    type="text"
                    value={muelle}
                    onChange={(e) => setMuelle(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">VAPOR/BARCO</label>
                  <input
                    type="text"
                    value={vaporBarco}
                    onChange={(e) => setVaporBarco(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
              </div>

              {/* Tipo de Carga y Sistema Utilizado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">TIPO DE CARGA</h3>
                  {TIPO_CARGA_OPCIONES.map((item) => (
                    <label key={item} className="block text-xs">
                      <input
                        type="checkbox"
                        checked={tipoCarga.includes(item)}
                        onChange={() => toggleCheckTipoCarga(item)}
                        className="mr-1"
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">SISTEMA UTILIZADO</h3>
                  {SISTEMA_UTILIZADO_OPCIONES.map((item) => (
                    <label key={item} className="block text-xs">
                      <input
                        type="checkbox"
                        checked={sistemaUtilizado.includes(item)}
                        onChange={() => toggleCheckSistema(item)}
                        className="mr-1"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              {/* ARRIBO, ATRAQUE, RECIBIDO, INICIO OP, FIN OP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ARRIBO */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">ARRIBO</h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Arribo</label>
                  <input
                    type="date"
                    value={fechaArribo}
                    onChange={(e) => setFechaArribo(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Arribo</label>
                  <input
                    type="time"
                    value={horaArribo}
                    onChange={(e) => setHoraArribo(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                {/* ATRAQUE */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">ATRAQUE</h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Atraque</label>
                  <input
                    type="date"
                    value={fechaAtraque}
                    onChange={(e) => setFechaAtraque(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Atraque</label>
                  <input
                    type="time"
                    value={horaAtraque}
                    onChange={(e) => setHoraAtraque(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                {/* RECIBIDO */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">RECIBIDO</h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Recibido</label>
                  <input
                    type="date"
                    value={fechaRecibido}
                    onChange={(e) => setFechaRecibido(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Recibido</label>
                  <input
                    type="time"
                    value={horaRecibido}
                    onChange={(e) => setHoraRecibido(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                {/* INICIO OPERACIONES */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">
                    INICIO OPERACIONES
                  </h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={fechaInicioOp}
                    onChange={(e) => setFechaInicioOp(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicioOp}
                    onChange={(e) => setHoraInicioOp(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                {/* FIN OPERACIONES */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">
                    FIN OPERACIONES
                  </h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={fechaFinOp}
                    onChange={(e) => setFechaFinOp(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={horaFinOp}
                    onChange={(e) => setHoraFinOp(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER (detalles del barco) */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2">
          <div className="bg-white w-full max-w-3xl p-6 rounded-md overflow-y-auto max-h-screen">
            <h2 className="text-2xl font-bold mb-4">Detalles del Barco</h2>
            <div className="space-y-4">
              {/* Primera fila: MUELLE y VAPOR/BARCO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">MUELLE</label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.muelle || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">VAPOR/BARCO</label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.vaporBarco || "-"}
                  </div>
                </div>
              </div>
              {/* Segunda fila: Fecha Arribo y Hora Arribo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Fecha Arribo</label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.fechaArribo || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Hora Arribo</label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.horaArribo || "-"}
                  </div>
                </div>
              </div>
              {/* Tercera fila: Fecha Atraque y Hora Atraque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Fecha Atraque</label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.fechaAtraque || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Hora Atraque</label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.horaAtraque || "-"}
                  </div>
                </div>
              </div>
              {/* Cuarta fila: Fecha Recibido y Hora Recibido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Fecha Recibido</label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.fechaRecibido || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Hora Recibido</label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.horaRecibido || "-"}
                  </div>
                </div>
              </div>
              {/* Quinta fila: Fecha Inicio y Hora Inicio Operaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Fecha Inicio Operaciones
                  </label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.fechaInicioOperaciones || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Hora Inicio Operaciones
                  </label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.horaInicioOperaciones || "-"}
                  </div>
                </div>
              </div>
              {/* Sexta fila: Fecha Fin y Hora Fin Operaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Fecha Fin Operaciones
                  </label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.fechaFinOperaciones || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Hora Fin Operaciones
                  </label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.horaFinOperaciones || "-"}
                  </div>
                </div>
              </div>
              {/* Séptima fila: Tipo de Carga y Sistema Utilizado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Tipo de Carga
                  </label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.tipoCarga
                      ? JSON.parse(viewData.tipoCarga).join(", ")
                      : "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Sistema Utilizado
                  </label>
                  <div className="w-full border rounded-md px-2 py-1">
                    {viewData.sistemaUtilizado
                      ? JSON.parse(viewData.sistemaUtilizado).join(", ")
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2">
          <div className="bg-white w-full max-w-3xl p-4 rounded-md overflow-y-auto max-h-screen">
            <h2 className="text-xl font-bold mb-4">Editar Barco</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              {/* MUELLE y VAPOR/BARCO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">MUELLE</label>
                  <input
                    type="text"
                    value={muelle}
                    onChange={(e) => setMuelle(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">VAPOR/BARCO</label>
                  <input
                    type="text"
                    value={vaporBarco}
                    onChange={(e) => setVaporBarco(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
              </div>

              {/* Tipo de Carga y Sistema Utilizado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">TIPO DE CARGA</h3>
                  {TIPO_CARGA_OPCIONES.map((item) => (
                    <label key={item} className="block text-xs">
                      <input
                        type="checkbox"
                        checked={tipoCarga.includes(item)}
                        onChange={() => toggleCheckTipoCarga(item)}
                        className="mr-1"
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2">SISTEMA UTILIZADO</h3>
                  {SISTEMA_UTILIZADO_OPCIONES.map((item) => (
                    <label key={item} className="block text-xs">
                      <input
                        type="checkbox"
                        checked={sistemaUtilizado.includes(item)}
                        onChange={() => toggleCheckSistema(item)}
                        className="mr-1"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              {/* ARRIBO, ATRAQUE, RECIBIDO, INICIO OP, FIN OP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ARRIBO */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">ARRIBO</h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Arribo</label>
                  <input
                    type="date"
                    value={fechaArribo}
                    onChange={(e) => setFechaArribo(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Arribo</label>
                  <input
                    type="time"
                    value={horaArribo}
                    onChange={(e) => setHoraArribo(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                {/* ATRAQUE */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">ATRAQUE</h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Atraque</label>
                  <input
                    type="date"
                    value={fechaAtraque}
                    onChange={(e) => setFechaAtraque(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Atraque</label>
                  <input
                    type="time"
                    value={horaAtraque}
                    onChange={(e) => setHoraAtraque(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                {/* RECIBIDO */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">RECIBIDO</h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Recibido</label>
                  <input
                    type="date"
                    value={fechaRecibido}
                    onChange={(e) => setFechaRecibido(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Recibido</label>
                  <input
                    type="time"
                    value={horaRecibido}
                    onChange={(e) => setHoraRecibido(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                {/* INICIO OPERACIONES */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">
                    INICIO OPERACIONES
                  </h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={fechaInicioOp}
                    onChange={(e) => setFechaInicioOp(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicioOp}
                    onChange={(e) => setHoraInicioOp(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
                {/* FIN OPERACIONES */}
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-2 uppercase">
                    FIN OPERACIONES
                  </h3>
                  <label className="block text-xs font-semibold mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={fechaFinOp}
                    onChange={(e) => setFechaFinOp(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 mb-2"
                  />
                  <label className="block text-xs font-semibold mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={horaFinOp}
                    onChange={(e) => setHoraFinOp(e.target.value)}
                    className="w-full border rounded-md px-2 py-1"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
