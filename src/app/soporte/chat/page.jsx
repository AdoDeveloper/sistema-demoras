"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import {
  FiArrowLeft,
  FiLoader,
  FiSend,
  FiPaperclip,
  FiCheck,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import Swal from "sweetalert2";

export default function ChatSoporte() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ticketId, setTicketId] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploadImage, setUploadImage] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef(null);
  // Ref para el contenedor de mensajes (para scroll personalizado)
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  // Ref para la instancia del socket
  const socketRef = useRef(null);
  // Ref para controlar el timeout de la animación de "escribiendo"
  const typingAnimationTimeoutRef = useRef(null);

  const currentUserId = session?.user?.id;
  const isSupport = session?.user?.roleId === 1;

  // Función de easing para la animación del scroll
  const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

  // Función para animar el scroll con duración personalizada
  const smoothScroll = (container, to, duration) => {
    const start = container.scrollTop;
    const change = to - start;
    const startTime = performance.now();
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollTop = start + change * easeInOutQuad(progress);
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    requestAnimationFrame(animateScroll);
  };

  // Detectar si el dispositivo es móvil
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Extraer ticketId de la URL y cargar datos del ticket
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tId = urlParams.get("ticketId");
    setTicketId(tId);
    if (!tId) {
      Swal.fire("Error", "No se proporcionó ticketId en la URL", "error");
      setLoading(false);
      return;
    }
    fetchTicketData(tId);
  }, []);

  async function fetchTicketData(tId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/${tId}`);
      if (res.status === 403 || res.status === 401 || res.status === 404) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al obtener ticket");
      }
      const data = await res.json();
      setTicketInfo(data);
      setSelectedStatus(data.estado);
      setLoading(false);
    } catch (error) {
      console.error("fetchTicketData error:", error);
      setLoading(false);
      Swal.fire("Error", error.message, "error");
    }
  }

  // Función para mostrar mensajes del sistema (ej. al actualizar estado)
  const addSystemMessage = (text) => {
    const message = {
      id: `${Date.now()}-estado`,
      isSystemMessage: true,
      text,
      createdAt: new Date(),
      fading: false,
      read: true,
    };
    setMessages((prev) => [...prev, message]);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, fading: true } : msg
        )
      );
      setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
      }, 1000);
    }, 5000);
  };

  // Función para actualizar el estado del ticket (solo para soporte)
  const updateTicketStatus = async () => {
    if (!ticketId) return;
    if (selectedStatus === ticketInfo.estado) {
      Swal.fire("Información", "El ticket ya tiene este estado", "info");
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/estatus/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus: selectedStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar el estado del ticket");
      }
      const updatedRes = await fetch(`/api/chat/${ticketId}`);
      if (!updatedRes.ok) throw new Error("Error al obtener el ticket actualizado");
      const updatedTicket = await updatedRes.json();
      setTicketInfo(updatedTicket);
      setSelectedStatus(updatedTicket.estado);
      if (socketRef.current) {
        socketRef.current.emit("broadcastTicketStatus", {
          ticketId,
          updatedTicket,
        });
      }
      Swal.fire({
        toast: true,
        position: "top-end",
        timer: 3000,
        timerProgressBar: true,
        icon: "success",
        title: "Estado actualizado correctamente",
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error al actualizar ticket:", error);
      Swal.fire("Error", error.message, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case "en_proceso":
        return "En Proceso";
      case "completado":
        return "Completado";
      case "detenido":
        return "Detenido";
      default:
        return "Pendiente";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "en_proceso":
        return "bg-blue-600 text-white";
      case "completado":
        return "bg-green-600 text-white";
      case "detenido":
        return "bg-red-600 text-white";
      default:
        return "bg-yellow-600 text-white";
    }
  };

  const getMessageBubbleClass = (msg) => {
    if (msg.isSystemMessage) return "bg-indigo-600 text-white fade-in";
    if (msg.senderId === currentUserId) return "bg-blue-800 text-white fade-in";
    return "bg-gray-100 text-gray-800 fade-in";
  };

  // Función para inicializar el socket; se conecta y se une a la sala
  const initializeSocket = (tId) => {
    if (!currentUserId || !tId) {
      console.error("No se puede inicializar el socket: Falta ticketId o userId", tId, currentUserId);
      return;
    }
    // Se solicita la ruta del socket
    fetch("/api/socketio").catch((err) =>
      console.error("Error al obtener /api/socketio:", err)
    );
    const socket = io({
      path: "/api/socketio",
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Chat Socket conectado:", socket.id);
      setSocketConnected(true);
      socket.emit("joinTicketRoom", {
        ticketId: tId,
        userId: currentUserId,
        isSupport,
      });
    });

    // Listener para nuevos mensajes (evitando duplicados)
    socket.on("newMessage", (nuevoMensaje) => {
      console.log("Nuevo mensaje recibido:", nuevoMensaje);
      setMessages((prev) => {
        if (prev.find((m) => m.id === nuevoMensaje.id)) return prev;
        return [...prev, nuevoMensaje];
      });
    });

    socket.on("connect_error", (err) => {
      console.error("Error de conexión:", err);
      Swal.fire({
        title: "Error de conexión",
        text: "No se pudo establecer conexión. Intente recargar la página.",
        icon: "error",
      });
    });

    socket.on("ticketInfo", (ticket) => {
      setTicketInfo(ticket);
      setSelectedStatus(ticket.estado);
    });

    socket.on("previousMessages", (oldMsgs) => {
      if (oldMsgs && Array.isArray(oldMsgs)) {
        console.log("Mensajes anteriores recibidos:", oldMsgs.length);
        setMessages(oldMsgs);
      } else {
        console.error("Formato incorrecto de mensajes anteriores:", oldMsgs);
      }
    });

    socket.on("errorMessage", (error) => {
      Swal.fire("Error", error.message, "error");
    });

    socket.on("ticketStatusUpdated", (updatedTicket) => {
      console.log("ticketStatusUpdated recibido:", updatedTicket);
      setTicketInfo(updatedTicket);
      setSelectedStatus(updatedTicket.estado);
      addSystemMessage(
        `El estado del ticket se ha actualizado a ${translateStatus(updatedTicket.estado)}.`
      );
    });

    socket.on("messagesDelivered", ({ messageIds }) => {
      console.log("Recibido messagesDelivered:", messageIds);
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, delivered: true } : msg
        )
      );
    });

    socket.on("messagesRead", ({ messageIds }) => {
      console.log("Recibido messagesRead:", messageIds);
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        )
      );
    });

    socket.on("typing", ({ userId, isTyping }) => {
      if (currentUserId && userId !== currentUserId) {
        setIsTyping(isTyping);
        if (isTyping) setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socket.on("disconnect", () => {
      console.log("Chat Socket desconectado");
      setSocketConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Chat Socket reconectado después de ${attemptNumber} intentos`);
      setSocketConnected(true);
      if (tId && currentUserId) {
        socket.emit("joinTicketRoom", {
          ticketId: tId,
          userId: currentUserId,
          isSupport,
        });
      }
    });

    socket.on("reconnect_failed", () => {
      Swal.fire({
        title: "Error de conexión",
        text: "No se pudo restablecer la conexión. Por favor, recargue la página.",
        icon: "error",
      });
    });
  };

  // useEffect para inicializar el socket solo una vez y desconectarlo al desmontar
  useEffect(() => {
    if (ticketId && status === "authenticated" && session && !socketRef.current) {
      initializeSocket(ticketId);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, status, session]);

  // Función para marcar como entregados y leídos los mensajes visibles
  const handleVisibleMessages = useCallback(() => {
    if (!socketRef.current) return;
    const msgsToMarkDelivered = messages
      .filter((msg) => msg.senderId !== currentUserId && !msg.delivered)
      .map((msg) => msg.id);
    const msgsToMarkRead = messages
      .filter((msg) => msg.senderId !== currentUserId && !msg.read)
      .map((msg) => msg.id);
    if (msgsToMarkDelivered.length > 0) {
      socketRef.current.emit("messageDelivered", {
        ticketId,
        messageIds: msgsToMarkDelivered,
      });
    }
    if (msgsToMarkRead.length > 0) {
      socketRef.current.emit("messageRead", {
        ticketId,
        messageIds: msgsToMarkRead,
      });
    }
  }, [messages, currentUserId, ticketId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (!socketRef.current) return;
    const msgsToMarkDelivered = messages
      .filter((msg) => msg.senderId !== currentUserId && !msg.delivered)
      .map((msg) => msg.id);
    if (msgsToMarkDelivered.length > 0) {
      socketRef.current.emit("messageDelivered", {
        ticketId,
        messageIds: msgsToMarkDelivered,
      });
    }
  }, [messages, currentUserId, ticketId]);

  const onMessagesContainerInteraction = () => {
    handleVisibleMessages();
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit("typing", { userId: currentUserId, isTyping: true });
    }
  };

  // useEffect para animar el scroll mientras se escribe
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    // Solo se ejecuta si hay texto en el input
    if (newMessage.trim() === "") return;
    if (typingAnimationTimeoutRef.current) {
      clearTimeout(typingAnimationTimeoutRef.current);
    }
    const container = messagesContainerRef.current;
    let originalScroll = container.scrollTop;
    const targetScroll = container.scrollHeight;
    // Si el contenedor ya está al final, forzamos un pequeño desplazamiento (20px hacia arriba)
    if (Math.abs(targetScroll - (originalScroll + container.clientHeight)) < 1) {
      originalScroll = Math.max(originalScroll - 20, 0);
    }
    // Animar hacia abajo rápidamente (300ms)
    smoothScroll(container, targetScroll, 300);
    // Después de 200ms, regresar a la posición original con animación de 300ms
    typingAnimationTimeoutRef.current = setTimeout(() => {
      smoothScroll(container, originalScroll, 300);
    }, 200);
    return () => {
      if (typingAnimationTimeoutRef.current) {
        clearTimeout(typingAnimationTimeoutRef.current);
      }
    };
  }, [newMessage]);

  // Función para enviar mensaje, incluyendo receiverId según rol
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !uploadImage) return;
    if (!socketRef.current || !socketConnected) {
      Swal.fire("Error", "Conexión no establecida con el chat.", "error");
      return;
    }
    try {
      let base64 = null;
      if (uploadImage) {
        base64 = await readFileAsBase64(uploadImage);
      }
      const receiverId =
        isSupport
          ? ticketInfo.user?.id || null
          : ticketInfo.admin?.id || null;
      socketRef.current.emit("sendMessage", {
        ticketId,
        senderId: currentUserId,
        receiverId,
        text: newMessage.trim(),
        imageData: base64,
        imageSize: uploadImage ? uploadImage.size : null,
        read: false,
      });
      // Al enviar, se borra el contenido del input para reiniciar la animación al volver a escribir
      setNewMessage("");
      setUploadImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      Swal.fire("Error", "No se pudo enviar el mensaje", "error");
    }
  };

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getInitials(name) {
    if (!name) return "";
    return name
      .trim()
      .split(" ")
      .map((p) => p[0].toUpperCase())
      .join("");
  }

  function formatTimeAgo(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 10) return "hace un momento";
    if (diffInSeconds < 60)
      return `hace ${diffInSeconds} ${diffInSeconds === 1 ? "segundo" : "segundos"}`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60)
      return `hace ${diffInMinutes} ${diffInMinutes === 1 ? "minuto" : "minutos"}`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `hace ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;
    const days = Math.floor(diffInHours / 24);
    return `hace ${days} ${days === 1 ? "día" : "días"}`;
  }

  function formatMessageTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-SV", {
      timeZone: "America/El_Salvador",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const finalMessages = searchTerm.trim()
    ? messages.filter((msg) =>
        (msg.text &&
          msg.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (msg.imageUrl &&
          msg.imageUrl.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : messages;

  if (status === "loading" || loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <FiLoader className="animate-spin mr-2" size={40} />
        <span className="text-xl text-gray-600">Cargando chat...</span>
      </div>
    );
  }

  if (!ticketInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200 p-4 rounded-md">
        <p className="text-red-500">Ticket no encontrado.</p>
      </div>
    );
  }

  // Determinar el partner del chat:
  // Para soporte, el partner es el usuario (ticketInfo.user)
  // Para cliente, el partner es el soporte (ticketInfo.admin)
  const chatPartner = isSupport
    ? ticketInfo.user
    : ticketInfo.admin || { username: "Soporte" };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Encabezado */}
      <header className="bg-[#003E9B] text-white p-3 md:p-4 flex items-center shadow-md">
        <button
          onClick={() => (window.location.href = "/soporte")}
          className="bg-white hover:bg-gray-200 text-[#003E9B] p-2 rounded-full mr-3 transition duration-200"
          title="Volver"
        >
          <FiArrowLeft size={18} />
        </button>
        <h1 className="text-base md:text-lg font-bold">Chat de Soporte</h1>
        {!socketConnected && (
          <span className="ml-3 bg-red-500 text-white text-xs py-1 px-2 rounded-full animate-pulse">
            Desconectado
          </span>
        )}
      </header>

      {/* Información del Ticket */}
      <div className="max-w-6xl mx-auto w-full px-3 md:px-4 py-3 md:py-4">
        <div className="bg-white shadow rounded-md p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="flex items-center mb-2 md:mb-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                Ticket {ticketInfo.numero}
              </h2>
              <span className={`ml-3 px-2 py-1 text-xs font-medium rounded ${getStatusColor(ticketInfo.estado)}`}>
                {translateStatus(ticketInfo.estado)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="flex items-center text-xs md:text-sm">
                <FiCalendar className="mr-1" /> {ticketInfo.fecha}
              </span>
              <span className="flex items-center text-xs md:text-sm">
                <FiClock className="mr-1" /> {ticketInfo.hora}
              </span>
            </div>
          </div>
          <h3 className="text-base md:text-lg font-semibold mt-2 text-gray-800">
            {ticketInfo.asunto}
          </h3>
          <p className="text-sm md:text-base text-gray-700 mt-1">
            {ticketInfo.descripcion}
          </p>

          {/* Información adicional del ticket */}
          <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-4 md:gap-6">
            {ticketInfo.user && (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-2">
                  {getInitials(ticketInfo.user.username)}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {ticketInfo.user.username}
                  </p>
                  <p className="text-xs text-gray-500">Creado por</p>
                </div>
              </div>
            )}
            {ticketInfo.admin && (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-2">
                  {getInitials(ticketInfo.admin.username)}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {ticketInfo.admin.username}
                  </p>
                  <p className="text-xs text-gray-500">Asignado a</p>
                </div>
              </div>
            )}
          </div>

          {/* Opción para actualizar el estado del ticket (solo para soporte) */}
          {isSupport && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Actualizar Estado</label>
              <div className="flex gap-2 mt-1">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm text-gray-700"
                  disabled={updatingStatus}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                  <option value="detenido">Detenido</option>
                </select>
                <button
                  onClick={updateTicketStatus}
                  className={`px-4 py-2 rounded-md flex items-center justify-center min-w-24 transition-colors ${
                    updatingStatus ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  disabled={updatingStatus || selectedStatus === ticketInfo.estado}
                >
                  {updatingStatus ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <>
                      <FiCheck className="mr-1" /> Actualizar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Área de búsqueda */}
      <div className="max-w-6xl mx-auto w-full px-3 md:px-4 mb-4">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Buscar mensajes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border rounded p-2 text-gray-700"
          />
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="max-w-6xl mx-auto w-full px-3 md:px-4 pb-3 md:pb-4">
        <div
          className="bg-white shadow rounded-md flex flex-col"
          style={{ maxHeight: "70vh" }}
          onMouseEnter={onMessagesContainerInteraction}
          onScroll={onMessagesContainerInteraction}
        >
          {/* Se asigna el ref para el contenedor de mensajes (scroll personalizado) */}
          <div ref={messagesContainerRef} className="p-3 md:p-4 flex-1 overflow-y-auto">
            {finalMessages.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-500">
                <p>No hay mensajes. Envía el primer mensaje para iniciar la conversación.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {finalMessages.map((msg, index) => {
                  const isCurrentUserMessage = msg.senderId === currentUserId;
                  const isSystemMessage = msg.isSystemMessage;
                  let senderName = "";
                  if (isSystemMessage) {
                    senderName = "Sistema";
                  } else if (isCurrentUserMessage) {
                    senderName = isSupport ? "Soporte" : session.user.username;
                  } else {
                    senderName = isSupport
                      ? (ticketInfo.user?.username || "Sin nombre")
                      : "Soporte";
                  }
                  const senderInitials = getInitials(senderName);
                  let showDateSeparator = false;
                  if (index === 0) {
                    showDateSeparator = true;
                  } else {
                    const currentDate = new Date(msg.createdAt).toLocaleDateString();
                    const prevDate = new Date(finalMessages[index - 1].createdAt).toLocaleDateString();
                    if (currentDate !== prevDate) {
                      showDateSeparator = true;
                    }
                  }
                  return (
                    <div key={`message-${msg.id}-${index}`}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {new Date(msg.createdAt).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      )}
                      {isSystemMessage ? (
                        <div className="flex justify-center my-2">
                          <div className={`text-white text-xs px-3 py-1 rounded-full max-w-xs text-center transition-opacity duration-1000 ${msg.fading ? "opacity-0" : "opacity-100"} bg-indigo-600 fade-in`}>
                            {msg.text}
                          </div>
                        </div>
                      ) : (
                        <div className={`flex ${isCurrentUserMessage ? "justify-end" : "justify-start"}`}>
                          <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isCurrentUserMessage ? "items-end" : "items-start"} fade-in`}>
                            <div className="text-xs text-gray-500 mb-1 px-2">
                              {formatTimeAgo(msg.createdAt)} · {senderName}
                              {!msg.read && !isCurrentUserMessage && (
                                <span className="ml-1 text-xs font-bold text-green-500">Nuevo</span>
                              )}
                            </div>
                            <div className="flex items-start">
                              {!isCurrentUserMessage && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-2 flex-shrink-0">
                                  {senderInitials}
                                </div>
                              )}
                              <div className={`${getMessageBubbleClass(msg)} rounded-lg py-2 px-3 break-words`}>
                                {msg.text && (
                                  <p className="whitespace-pre-wrap">
                                    {isCurrentUserMessage ? (
                                      <span className="text-white">{msg.text}</span>
                                    ) : (
                                      <span className="text-gray-800">{msg.text}</span>
                                    )}
                                  </p>
                                )}
                                {msg.imageUrl && (
                                  <div className="mt-2">
                                    <img
                                      src={msg.imageUrl}
                                      alt="Imagen adjunta"
                                      className="rounded max-h-48 object-contain"
                                      onClick={() => window.open(msg.imageUrl, "_blank")}
                                      style={{ cursor: "pointer" }}
                                    />
                                  </div>
                                )}
                                <div className={`text-xs mt-1 flex items-center ${isCurrentUserMessage ? "text-blue-200" : "text-gray-500"}`}>
                                  <span>{formatMessageTime(msg.createdAt)}</span>
                                  {isCurrentUserMessage && (
                                    <span className="ml-2 flex items-center">
                                      {msg.read ? (
                                        <>
                                          <FiCheck size={isMobile ? 16 : 12} className="flex-shrink-0" />
                                          <FiCheck size={isMobile ? 16 : 12} className="flex-shrink-0" />
                                        </>
                                      ) : msg.delivered ? (
                                        <FiCheck size={isMobile ? 16 : 12} className="flex-shrink-0" />
                                      ) : null}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isCurrentUserMessage && (
                                <div className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold ml-2 flex-shrink-0">
                                  {senderInitials}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isTyping && newMessage.trim() !== "" && (
                  <div className="flex justify-start py-4 px-2">
                    <div className="flex items-center">
                      <div className="typing-indicator">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Área de envío de mensajes */}
          <div className="border-t p-3 md:p-4">
            {ticketInfo.estado === "en_proceso" ? (
              <>
                {uploadImage && (
                  <div className="mb-2 p-2 bg-gray-50 rounded-md flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden mr-2">
                        <img
                          src={URL.createObjectURL(uploadImage)}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm truncate text-gray-800">
                        {uploadImage.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setUploadImage(null)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="flex items-start gap-2 border border-gray-300 rounded-md p-2 bg-white">
                  <textarea
                    placeholder="Escribe tu mensaje..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 text-gray-700 border-none outline-none resize min-h-[45px] max-h-[160px] px-2 py-2 leading-5 text-sm"
                  />
                  <button
                    type="button"
                    title="Adjuntar imagen"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-100 text-gray-600 rounded transition border border-gray-200"
                  >
                    <FiPaperclip size={18} />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadImage(e.target.files[0]);
                        }
                      }}
                    />
                  </button>
                  <button
                    type="button"
                    title="Enviar"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && !uploadImage}
                    className={`flex items-center justify-center w-10 h-10 rounded transition ${
                      !newMessage.trim() && !uploadImage
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4">
                {(() => {
                  const { message, className } = {
                    message:
                      ticketInfo.estado === "completado"
                        ? "El ticket se ha completado. Gracias por contactarnos, su solicitud ha sido atendida satisfactoriamente."
                        : ticketInfo.estado === "detenido"
                        ? "La conversación se encuentra detenida debido a inconvenientes. Inténtalo más tarde."
                        : "El ticket está pendiente. Su solicitud fue recibida y está en espera de asignación. Manténgase atento a futuras actualizaciones.",
                    className:
                      ticketInfo.estado === "completado"
                        ? "bg-green-100 text-green-800 px-3 py-2 rounded"
                        : ticketInfo.estado === "detenido"
                        ? "bg-red-100 text-red-800 px-3 py-2 rounded"
                        : "bg-yellow-100 text-yellow-800 px-3 py-2 rounded",
                  };
                  return <div className={`text-center ${className}`}>{message}</div>;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #4b5563;
          border-radius: 50%;
          animation: dotPulse 1.4s infinite ease-in-out;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes dotPulse {
          0%, 20%, 50%, 80%, 100% {
            opacity: 0.2;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-4px);
          }
          60% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
}
