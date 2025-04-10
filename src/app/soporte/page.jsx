"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiCopy
} from "react-icons/fi";
import { FaPlusCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { CldImage } from "next-cloudinary";

// Función debounce para la búsqueda
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Función para leer un archivo como base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SoporteTickets() {
  const { data: session, status } = useSession();
  // Extraer roleId desde la sesión
  const roleId = session?.user?.roleId;

  const [tickets, setTickets] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");

  // Estados para el modal de creación de ticket
  const [showModal, setShowModal] = useState(false);
  // modalType: "mine" para ticket propio; "forUser" para ticket para otro usuario (solo admin)
  const [modalType, setModalType] = useState("mine");
  const [modalFecha, setModalFecha] = useState("");
  const [modalHora, setModalHora] = useState("");
  const [modalAsunto, setModalAsunto] = useState("");
  const [modalDescripcion, setModalDescripcion] = useState("");
  const [modalImageFile, setModalImageFile] = useState(null);
  const [modalImagePreview, setModalImagePreview] = useState(null);
  // Para ticket para otro usuario:
  const [modalForUserId, setModalForUserId] = useState("");
  const [modalForUserName, setModalForUserName] = useState("");
  // Para asignar el ticket a un admin:
  const [modalAssignedTo, setModalAssignedTo] = useState("");

  // Estados para el modal de edición (solo para admin)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTicket, setEditTicket] = useState(null);
  // Nuevo estado para editar el estado del ticket
  const [modalEstado, setModalEstado] = useState("");

  // Estado para imagen ampliada (zoom)
  const [zoomImage, setZoomImage] = useState(null);

  // Hook para la búsqueda debounced
  const debouncedSetSearch = useCallback(debounce((value) => setSearch(value), 500), []);

  // Función para obtener tickets desde la API
  async function fetchTickets() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tickets?search=${search}&page=${page}&limit=${limit}&fechaInicio=${fechaInicio}&fechaFinal=${fechaFinal}`
      );
      if (res.ok) {
        const data = await res.json();
        setTickets(data.data);
        setTotalCount(data.totalCount);
        if (data.admins) setAdmins(data.admins);
        if (data.users) setUsers(data.users);
      } else {
        Swal.fire("Error", "Error al obtener tickets", "error");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      Swal.fire("Error", "Error al obtener tickets", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, [search, page, limit, fechaInicio, fechaFinal]);

  const totalPages = Math.ceil(totalCount / limit);

  // Para usuarios que no son admin, se filtran los tickets que les pertenecen.
  // Se deshabilitará la creación de nuevo ticket si existe alguno cuyo estado no sea "completado".
  const userTickets =
    roleId !== 1 && session?.user
      ? tickets.filter((ticket) => ticket.userId === session.user.id)
      : [];
  const disableCreateTicketButton =
    roleId !== 1 && userTickets.some(ticket => ticket.estado !== "completado");

  // Función para copiar el número de ticket al portapapeles
  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number)
      .then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Número de ticket copiado',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          width: "18rem"
        });
      })
      .catch(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'No se pudo copiar el número',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          width: "18rem"
        });
      });
  };

  // Acciones de la vista
  const handleRefresh = async () => {
    setLoading(true);
    await fetchTickets();
    setLoading(false);
    Swal.fire("Refrescado", "Datos actualizados", "success");
  };

  // Función openModal: reinicia los campos para la creación de un nuevo ticket
  const openModal = (type = "mine") => {
    setModalType(type);
    const now = new Date();
    setModalFecha(now.toISOString().split("T")[0]);
    setModalHora(now.toTimeString().split(" ")[0].substring(0, 5));
    // Reiniciar los campos del formulario
    setModalAsunto("");
    setModalDescripcion("");
    setModalImageFile(null);
    setModalImagePreview(null);
    setModalForUserId("");
    setModalForUserName("");
    setModalAssignedTo("");
    setShowModal(true);
  };

  // Abrir modal de edición y precargar datos del ticket (solo para admin)
  const openEditModal = (ticket) => {
    setEditTicket(ticket);
    setModalFecha(ticket.fecha);
    setModalHora(ticket.hora);
    setModalAsunto(ticket.asunto);
    setModalDescripcion(ticket.descripcion);
    setModalEstado(ticket.estado); // Se inicializa el estado actual en el modal
    setModalImageFile(null);
    setModalImagePreview(ticket.imagenUrl);
    setModalAssignedTo(ticket.assignedTo ? ticket.assignedTo.toString() : "");
    setShowEditModal(true);
  };

  const handleOpenChat = (ticketId) => {
    window.location.href = `/soporte/chat?ticketId=${ticketId}`;
  };

  // Función para enviar el formulario del modal de creación
  async function handleModalSubmit(e) {
    e.preventDefault();

    Swal.fire({
      title: "Procesando solicitud...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const bodyObj = {
      fecha: modalFecha,
      hora: modalHora,
      asunto: modalAsunto,
      descripcion: modalDescripcion,
      estado: "pendiente"
    };

    if (modalType === "forUser") {
      bodyObj.forUserId = modalForUserId;
      bodyObj.forUserName = modalForUserName;
      if (modalAssignedTo) {
        bodyObj.assignedTo = modalAssignedTo;
      }
    }
    if (modalImageFile) {
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
      if (modalImageFile.size >= MAX_IMAGE_SIZE) {
        Swal.fire("Error", "La imagen debe ser menor a 10 MB", "error");
        return;
      }
      try {
        const base64 = await readFileAsBase64(modalImageFile);
        bodyObj.imageData = base64;
        bodyObj.imageSize = modalImageFile.size;
      } catch (err) {
        Swal.fire("Error", "Error al procesar la imagen", "error");
        return;
      }
    }
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj)
      });
      if (res.ok) {
        Swal.fire("Ticket creado", "El ticket se ha creado correctamente", "success");
        await fetchTickets();
        setShowModal(false);
        // Reiniciar campos (aunque ya se reinician al abrir el modal)
        setModalFecha("");
        setModalHora("");
        setModalAsunto("");
        setModalDescripcion("");
        setModalImageFile(null);
        setModalImagePreview(null);
        setModalForUserId("");
        setModalForUserName("");
        setModalAssignedTo("");
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Error al crear ticket", "error");
      }
    } catch (err) {
      console.error("Error en submit modal:", err);
      Swal.fire("Error", "Error al crear ticket", "error");
    }
  }

  // Función para manejar la previsualización de imagen
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setModalImageFile(file);
      setModalImagePreview(URL.createObjectURL(file));
    }
  };

  // Función para enviar el formulario del modal de edición (PUT)
  async function handleEditModalSubmit(e) {
    e.preventDefault();
    Swal.fire({
      title: "Procesando solicitud...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    const bodyObj = {
      fecha: modalFecha,
      hora: modalHora,
      asunto: modalAsunto,
      descripcion: modalDescripcion,
      estado: modalEstado, // Se envía el estado actualizado
      assignedTo: modalAssignedTo ? parseInt(modalAssignedTo, 10) : null
    };
    if (modalImageFile) {
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
      if (modalImageFile.size >= MAX_IMAGE_SIZE) {
        Swal.fire("Error", "La imagen debe ser menor a 10 MB", "error");
        return;
      }
      try {
        const base64 = await readFileAsBase64(modalImageFile);
        bodyObj.imageData = base64;
        bodyObj.imageSize = modalImageFile.size;
      } catch (err) {
        Swal.fire("Error", "Error al procesar la imagen", "error");
        return;
      }
    }
    try {
      const res = await fetch(`/api/tickets/${editTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj)
      });
      if (res.ok) {
        Swal.fire("Ticket actualizado", "El ticket se ha actualizado correctamente", "success");
        await fetchTickets();
        setShowEditModal(false);
        setEditTicket(null);
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Error al actualizar ticket", "error");
      }
    } catch (err) {
      console.error("Error en submit de edición:", err);
      Swal.fire("Error", "Error al actualizar ticket", "error");
    }
  }

  // Función para manejar la eliminación de un ticket (solo para admin)
  async function handleDeleteTicket(ticketId) {
    const result = await Swal.fire({
      title: "¿Está seguro?",
      text: "Esta acción eliminará el ticket de forma permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });
    if (result.isConfirmed) {
      Swal.fire({
        title: "Procesando solicitud...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      try {
        const res = await fetch(`/api/tickets/${ticketId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          Swal.fire("Eliminado", "El ticket ha sido eliminado", "success");
          await fetchTickets();
          setShowEditModal(false);
          setEditTicket(null);
        } else {
          const err = await res.json();
          Swal.fire("Error", err.error || "Error al eliminar ticket", "error");
        }
      } catch (err) {
        console.error("Error al eliminar ticket:", err);
        Swal.fire("Error", "Error al eliminar ticket", "error");
      }
    }
  }

  // Función para obtener estilos según el estado del ticket
  const getEstadoStyles = (estado) => {
    const estadoMapping = {
      pendiente: "bg-yellow-200 text-yellow-800",
      en_proceso: "bg-blue-200 text-blue-800",
      completado: "bg-green-200 text-green-800",
      detenido: "bg-red-200 text-red-800"
    };
    return estadoMapping[estado] || "bg-gray-200 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {status === "loading" ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
          <FiLoader className="animate-spin mr-2" size={40} />
          <span className="text-xl text-gray-600">Cargando...</span>
        </div>
      ) : (
        <>
          {/* Encabezado */}
          <header className="bg-[#003E9B] text-white shadow-lg md:sticky md:top-0 z-50">
            <div className="mx-auto px-4 py-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="bg-white hover:bg-gray-200 text-blue-600 p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
                    title="Volver"
                  >
                    <FiArrowLeft size={20} />
                  </button>
                  <h1 className="text-xl font-bold">Tickets de Soporte</h1>
                </div>
                <div className="grid grid-cols-2 md:flex md:flex-row items-center mt-4 md:mt-0 gap-3">
                  <button
                    onClick={handleRefresh}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded flex items-center gap-1 transition-all duration-300 transform hover:scale-105"
                    title="Refrescar"
                  >
                    <FiRefreshCw size={20} />
                    <span>Refrescar</span>
                  </button>
                  {roleId === 1 ? (
                    <button
                      onClick={() => openModal("forUser")}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-1 transition-all duration-300 transform hover:scale-105"
                      title="Crear Ticket para Usuario"
                    >
                      <FaPlusCircle size={20} />
                      <span>Crear Ticket</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openModal("mine")}
                      disabled={disableCreateTicketButton}
                      className={`bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1 transition-all duration-300 ${
                        disableCreateTicketButton ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                      }`}
                      title="Crear mi Ticket"
                    >
                      <FaPlusCircle size={20} />
                      <span>Crear Ticket</span>
                    </button>
                  )}
                </div>
              </div>
              {/* Filtros: Solo para administradores */}
              {roleId === 1 && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm">Fecha Inicio</label>
                    <input
                      type="date"
                      className="border text-black p-1 w-full rounded"
                      value={fechaInicio}
                      onChange={(e) => {
                        setFechaInicio(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm">Fecha Final</label>
                    <input
                      type="date"
                      className="border text-black p-1 w-full rounded"
                      value={fechaFinal}
                      onChange={(e) => {
                        setFechaFinal(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm">Buscar</label>
                    <input
                      type="text"
                      placeholder="Buscar ticket..."
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        debouncedSetSearch(e.target.value);
                        setPage(1);
                      }}
                      className="border text-black p-1 w-full rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Lista de Tickets */}
          <div className="p-4 max-w-6xl mx-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm bg-white">
                <thead className="bg-gray-300">
                  <tr>
                    <th className="p-2 border whitespace-nowrap">Número</th>
                    <th className="p-2 border whitespace-nowrap">Fecha y Hora</th>
                    <th className="p-2 border whitespace-nowrap">Asunto</th>
                    <th className="p-2 border whitespace-nowrap">Usuario</th>
                    <th className="p-2 border whitespace-nowrap">Imagen</th>
                    <th className="p-2 border whitespace-nowrap">Estado</th>
                    <th className="p-2 border whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="p-2 border text-center" colSpan={7}>
                        Cargando...
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td className="p-2 border text-center" colSpan={7}>
                        No hay registros
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b text-center">
                        <td className="p-2 border whitespace-nowrap">
                          <span className="bg-gray-200 text-gray-800 p-1 rounded inline-block">
                            {ticket.numero}
                          </span>
                          <button
                            onClick={() => handleCopyNumber(ticket.numero)}
                            title="Copiar número"
                            className="ml-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <FiCopy />
                          </button>
                        </td>
                        <td className="p-2 border whitespace-nowrap">
                          {ticket.fecha} {ticket.hora}
                        </td>
                        <td className="p-2 border whitespace-nowrap">{ticket.asunto}</td>
                        <td className="p-2 border whitespace-nowrap">{ticket.userName}</td>
                        <td className="p-2 border whitespace-nowrap">
                          {ticket.imagenUrl ? (
                            <div
                              className="cursor-pointer inline-block"
                              onClick={() => setZoomImage(ticket.imagenUrl)}
                            >
                              <CldImage
                                width="100"
                                height="100"
                                crop="scale"
                                className="object-contain border rounded"
                                src={ticket.imagenPublicId || ticket.imagenUrl}
                                alt="Ticket Imagen"
                                loading="lazy"
                                sizes="100vw"
                              />
                            </div>
                          ) : (
                            "Sin imagen"
                          )}
                        </td>
                        <td className="p-2 border whitespace-nowrap">
                          <span className={`px-2 py-1 rounded ${getEstadoStyles(ticket.estado)}`}>
                            {ticket.estado.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-2 border flex flex-col md:flex-row items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenChat(ticket.id)}
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                            title="Ver Chat"
                          >
                            <FiMessageSquare size={16} />
                          </button>
                          {roleId === 1 && (
                            <>
                              <button
                                onClick={() => openEditModal(ticket)}
                                className="bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700"
                                title="Editar Ticket"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteTicket(ticket.id)}
                                className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                                title="Eliminar Ticket"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
              <div className="flex overflow-x-auto space-x-2 w-full sm:w-auto">
                <button
                  className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                  onClick={() => setPage(Math.max(page - 1, 1))}
                  disabled={page === 1 || loading || totalCount === 0}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 border rounded ${page === index + 1 ? "bg-blue-500 text-white" : ""}`}
                    onClick={() => setPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages || loading || totalCount === 0}
                >
                  Siguiente
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 text-center">
                <span className="text-sm">
                  Mostrando {tickets.length} de {totalCount} registros
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
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de Zoom de Imagen (responsive) */}
          {zoomImage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
              onClick={() => setZoomImage(null)}
            >
              <div className="relative">
                <img
                  src={zoomImage}
                  alt="Zoomed Ticket"
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                />
                <button
                  className="absolute top-2 right-2 bg-white text-black rounded-full p-1"
                  onClick={() => setZoomImage(null)}
                >
                  X
                </button>
              </div>
            </div>
          )}

          {/* Modal de Creación de Ticket */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "mine" ? "Crear mi Ticket" : "Crear Ticket para Usuario"}
                </h2>
                <form onSubmit={handleModalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Fecha</label>
                    <input
                      type="date"
                      value={modalFecha}
                      onChange={(e) => setModalFecha(e.target.value)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Hora</label>
                    <input
                      type="time"
                      value={modalHora}
                      onChange={(e) => setModalHora(e.target.value)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Asunto</label>
                    <input
                      type="text"
                      value={modalAsunto}
                      onChange={(e) => setModalAsunto(e.target.value)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Descripción</label>
                    <textarea
                      value={modalDescripcion}
                      onChange={(e) => setModalDescripcion(e.target.value)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Imagen (opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full"
                    />
                    {modalImagePreview && (
                      <img
                        src={modalImagePreview}
                        alt="Previsualización"
                        className="mt-2 h-32 object-contain border"
                      />
                    )}
                  </div>
                  {modalType === "forUser" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium">Seleccionar Usuario</label>
                        <select
                          value={modalForUserId}
                          onChange={(e) => {
                            setModalForUserId(e.target.value);
                            const selected = users.find((u) => u.id.toString() === e.target.value);
                            setModalForUserName(selected ? selected.nombreCompleto : "");
                          }}
                          required
                          className="w-full border p-2 rounded"
                        >
                          <option value="">-- Seleccionar Usuario --</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.nombreCompleto} ({user.username})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Asignar a Administrador</label>
                        <select
                          value={modalAssignedTo}
                          onChange={(e) => setModalAssignedTo(e.target.value)}
                          className="w-full border p-2 rounded"
                        >
                          <option value="">-- Sin asignación --</option>
                          {admins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.nombreCompleto} ({admin.username})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 rounded"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                      Enviar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Edición de Ticket (solo para admin) */}
          {showEditModal && editTicket && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Editar Ticket</h2>
                <form onSubmit={handleEditModalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Fecha</label>
                    <input
                      type="date"
                      value={modalFecha}
                      onChange={(e) => setModalFecha(e.target.value)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Hora</label>
                    <input
                      type="time"
                      value={modalHora}
                      onChange={(e) => setModalHora(e.target.value)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Asunto</label>
                    <input
                      type="text"
                      value={modalAsunto}
                      onChange={(e) => setModalAsunto(e.target.value)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Descripción</label>
                    <textarea
                      value={modalDescripcion}
                      onChange={(e) => setModalDescripcion(e.target.value)}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Estado</label>
                    <select
                      value={modalEstado}
                      onChange={(e) => setModalEstado(e.target.value)}
                      className="w-full border p-2 rounded"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                      <option value="detenido">Detenido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Imagen (opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full"
                    />
                    {modalImagePreview && (
                      <img
                        src={modalImagePreview}
                        alt="Previsualización"
                        className="mt-2 h-32 object-contain border"
                      />
                    )}
                  </div>
                  {roleId === 1 && (
                    <div>
                      <label className="block text-sm font-medium">Asignar a Administrador</label>
                      <select
                        value={modalAssignedTo}
                        onChange={(e) => setModalAssignedTo(e.target.value)}
                        className="w-full border p-2 rounded"
                      >
                        <option value="">-- Sin asignación --</option>
                        {admins.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.nombreCompleto} ({admin.username})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditTicket(null);
                      }}
                      className="px-4 py-2 bg-gray-300 rounded"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                      Actualizar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
