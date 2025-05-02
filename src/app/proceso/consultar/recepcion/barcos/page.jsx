"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiRefreshCw,
  FiAnchor,
  FiBox,
  FiEye,
  FiUpload,
} from "react-icons/fi";
import { FaFileExcel, FaPlus } from "react-icons/fa";
import { PiBarnFill, PiTruckTrailerBold } from "react-icons/pi";

// importa dinámicamente react-select para evitar SSR
const Select = dynamic(() => import("react-select"), { ssr: false });

// Opciones fijas de puntos de descarga
const descargaOptions = [
  {
    label: "Bodegas",
    options: Array.from({ length: 6 }, (_, i) => ({
      value: `BODEGA ${i + 1}`,
      label: `BODEGA ${i + 1}`,
    })),
  },
  {
    label: "Silos",
    options: Array.from({ length: 17 }, (_, i) => ({
      value: `SILO ${i + 1}`,
      label: `SILO ${i + 1}`,
    })),
  },
  {
    label: "Modulos",
    options: [1, 2, 3].map((i) => ({
      value: `MODULO ${i}`,
      label: `MODULO ${i}`,
    })),
  },
  {
    label: "Adicional",
    options: [{ value: "NO APLICA", label: "NO APLICA" }],
  },
];

export default function BarcoProductoManagement() {
  const router = useRouter();

  // --- ESTADOS PRINCIPALES ---
  const [activeTab, setActiveTab] = useState("barcos");
  const [allLoaded, setAllLoaded] = useState(false);

  // Barcos
  const [barcos, setBarcos] = useState([]);
  const [loadingBarcos, setLoadingBarcos] = useState(false);
  const [barcoInput, setBarcoInput] = useState("");
  const [barcoSearchQuery, setBarcoSearchQuery] = useState("");
  const [barcoPage, setBarcoPage] = useState(1);
  const [barcoLimit, setBarcoLimit] = useState(10);
  const [barcoTotalCount, setBarcoTotalCount] = useState(0);

  // Productos
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [productoInput, setProductoInput] = useState("");
  const [productoSearchQuery, setProductoSearchQuery] = useState("");

  // Transportes existentes y opciones para Select
  const [existingTransportes, setExistingTransportes] = useState([]);
  const [loadingExistingTrans, setLoadingExistingTrans] = useState(false);
  const [transportesOptions, setTransportesOptions] = useState([]);

  // Upload / procesado Excel
  const fileInputRef = useRef(null);
  const [transportSheets, setTransportSheets] = useState([]);
  const [isTransportUploadModalOpen, setIsTransportUploadModalOpen] = useState(false);

  // Ver detalle transporte (solo lectura)
  const [isTransportViewModalOpen, setIsTransportViewModalOpen] = useState(false);
  const [selectedTransportView, setSelectedTransportView] = useState(null);

  // Editar transporte
  const [isTransportEditModalOpen, setIsTransportEditModalOpen] = useState(false);
  const [editTransportForm, setEditTransportForm] = useState({
    id: null,
    empresa: "",
    motoristas: [], // { nombre, placa }
  });

  // Formularios Barco
  const [isCreateBarcoModalOpen, setIsCreateBarcoModalOpen] = useState(false);
  const [isEditBarcoModalOpen, setIsEditBarcoModalOpen] = useState(false);
  const [isBarcoDetailModalOpen, setIsBarcoDetailModalOpen] = useState(false);
  const [selectedBarcoDetail, setSelectedBarcoDetail] = useState(null);
  const [createBarcoForm, setCreateBarcoForm] = useState({
    vaporBarco: "",
    observaciones: "",
    productos: [],
    puntosDescarga: [],
    transportes: [],
  });
  const [editBarcoForm, setEditBarcoForm] = useState({
    id: null,
    vaporBarco: "",
    observaciones: "",
    productos: [],
    puntosDescarga: [],
    transportes: [],
  });

  // Formularios Producto
  const [isCreateProductoModalOpen, setIsCreateProductoModalOpen] = useState(false);
  const [isEditProductoModalOpen, setIsEditProductoModalOpen] = useState(false);
  const [isProductoDetailModalOpen, setIsProductoDetailModalOpen] = useState(false);
  const [selectedProductoDetail, setSelectedProductoDetail] = useState(null);
  const [createProductoForm, setCreateProductoForm] = useState({ nombre: "", descripcion: "" });
  const [editProductoForm, setEditProductoForm] = useState({ id: null, nombre: "", descripcion: "" });

  // --- EFECTOS Y FETCH ---
  useEffect(() => {
    const h = setTimeout(() => {
      setBarcoSearchQuery(barcoInput);
      setBarcoPage(1);
    }, 500);
    return () => clearTimeout(h);
  }, [barcoInput]);

  useEffect(() => {
    const h = setTimeout(() => setProductoSearchQuery(productoInput), 500);
    return () => clearTimeout(h);
  }, [productoInput]);

  const fetchBarcos = async () => {
    setLoadingBarcos(true);
    try {
      const res = await fetch(
        `/api/recepcion/barcos?page=${barcoPage}&limit=${barcoLimit}&search=${encodeURIComponent(
          barcoSearchQuery
        )}`
      );
      const data = await res.json();
      setBarcos(data.data || data);
      setBarcoTotalCount(data.totalCount || 0);
    } catch {
      console.error("Error fetching barcos");
    }
    setLoadingBarcos(false);
  };

  const fetchProductos = async () => {
    setLoadingProductos(true);
    try {
      const res = await fetch("/api/recepcion/productos");
      const data = await res.json();
      setProductos(data.data || data);
    } catch {
      console.error("Error fetching productos");
    }
    setLoadingProductos(false);
  };

  const fetchExistingTransportes = async () => {
    setLoadingExistingTrans(true);
    try {
      const res = await fetch("/api/recepcion/transportes");
      const data = await res.json();
      setExistingTransportes(data);
      setTransportesOptions(data.map((t) => ({ value: t.id, label: t.nombre })));
    } catch {
      console.error("Error fetching transportes");
    }
    setLoadingExistingTrans(false);
  };

  useEffect(() => {
    setTransportesOptions(existingTransportes.map((t) => ({ value: t.id, label: t.nombre })));
  }, [existingTransportes]);

  const refreshData = async () => {
    try {
      await Promise.all([fetchBarcos(), fetchProductos(), fetchExistingTransportes()]);
      Swal.close();
      Swal.fire({
        title: "Refrescado",
        text: "Datos actualizados",
        icon: "success",
        confirmButtonColor: "#007BFF",
      });
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "No se pudieron actualizar los datos", "error");
    }
  };

  useEffect(() => {
    fetchBarcos();
    fetchProductos();
    fetchExistingTransportes();
  }, [barcoPage, barcoLimit, barcoSearchQuery]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchBarcos(), fetchProductos(), fetchExistingTransportes()]);
      setAllLoaded(true);
    })();
  }, []);

  const filteredBarcos = barcos;
  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(productoSearchQuery.toLowerCase())
  );
  const productoOptions = productos.map((p) => ({ value: p.nombre, label: p.nombre }));

  // Upload Excel handlers
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const processFile = async (file) => {
    if (!file.name.endsWith(".xlsx")) {
      return Swal.fire("Error", "Solo Excel permitido", "error");
    }
    const form = new FormData();
    form.append("file", file);

    Swal.fire({
      title: "Procesando archivo...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch("/api/transportes", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        Swal.close();
        setIsTransportUploadModalOpen(false);
        setTransportSheets([]);
        return Swal.fire("Error", data.error || "Error al procesar archivo, intente de nuevo", "error");
      }

      const { sheets } = data;
      Swal.close();
      setIsTransportUploadModalOpen(true);
      setTransportSheets(
        sheets.map((s) => ({
          uid: crypto.randomUUID(),
          sheetName: s.sheetName,
          empresa: s.sheetName,
          rows: s.rows.map((r) => ({ uid: crypto.randomUUID(), ...r })),
        }))
      );
    } catch {
      Swal.close();
      setIsTransportUploadModalOpen(false);
      setTransportSheets([]);
      Swal.fire("Error", "Error al procesar archivo, intente de nuevo", "error");
    }
  };

  const updateEmpresa = (uid, name) =>
    setTransportSheets((ts) => ts.map((s) => (s.uid === uid ? { ...s, empresa: name } : s)));
  const updateRow = (sUid, rUid, f, v) =>
    setTransportSheets((ts) =>
      ts.map((s) =>
        s.uid !== sUid ? s : { ...s, rows: s.rows.map((r) => (r.uid === rUid ? { ...r, [f]: v } : r)) }
      )
    );
  const addRow = (sUid) =>
    setTransportSheets((ts) =>
      ts.map((s) =>
        s.uid !== sUid
          ? s
          : { ...s, rows: [...s.rows, { uid: crypto.randomUUID(), nombre: "", placa: "" }] }
      )
    );
  const removeRow = (sUid, rUid) =>
    setTransportSheets((ts) =>
      ts.map((s) => (s.uid !== sUid ? s : { ...s, rows: s.rows.filter((r) => r.uid !== rUid) }))
    );
  const removeSheet = (uid) => {
    setTransportSheets((ts) => {
      const newSheets = ts.filter((s) => s.uid !== uid);
      if (newSheets.length === 0) {
        setIsTransportUploadModalOpen(false);
      }
      return newSheets;
    });
  };

  const handleSaveTransportes = async () => {
    const totalRows = transportSheets.reduce((sum, s) => sum + s.rows.length, 0);
    if (totalRows === 0) {
      return Swal.fire("Error", "No hay filas, por favor carga de nuevo el archivo", "error");
    }

    Swal.fire({
      title: "Procesando solicitud...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const payload = transportSheets.map(({ empresa, rows }) => ({
        nombre: empresa,
        motoristas: rows.map(({ nombre, placa }) => ({ nombre, placa })),
      }));

      const res = await fetch("/api/recepcion/transportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        Swal.close();
        return Swal.fire("Error", err.error || "Error al guardar transportes", "error");
      }

      Swal.close();
      Swal.fire({
        title: "¡Éxito!",
        text: "Transportes registrados",
        icon: "success",
        confirmButtonColor: "#007BFF",
      });

      setTransportSheets([]);
      setIsTransportUploadModalOpen(false);
      fetchExistingTransportes();
    } catch {
      Swal.close();
      Swal.fire("Error", "No se pudo guardar transportes", "error");
    }
  };

  const openTransportViewModal = (t) => {
    setSelectedTransportView(t);
    setIsTransportViewModalOpen(true);
  };

  const openTransportEditModal = (t) => {
    setEditTransportForm({
      id: t.id,
      empresa: t.nombre,
      motoristas: t.motoristas.map((m) => ({ ...m })),
    });
    setIsTransportEditModalOpen(true);
  };

  const handleEditTransportChange = (field, value) =>
    setEditTransportForm((p) => ({ ...p, [field]: value }));
  const updateTransportRow = (idx, field, value) =>
    setEditTransportForm((p) => ({
      ...p,
      motoristas: p.motoristas.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    }));
  const addTransportRow = () =>
    setEditTransportForm((p) => ({ ...p, motoristas: [...p.motoristas, { nombre: "", placa: "" }] }));
  const removeTransportRow = (idx) =>
    setEditTransportForm((p) => ({
      ...p,
      motoristas: p.motoristas.filter((_, i) => i !== idx),
    }));

  const handleSaveTransportEdit = async () => {
    const { id, empresa, motoristas } = editTransportForm;
    try {
      Swal.fire({ title: "Procesando solicitud...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await fetch(`/api/recepcion/transportes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: empresa, motoristas }),
      });
      if (res.status === 409) {
        const err = await res.json();
        Swal.close();
        return Swal.fire("Error", err.error || "Ya existe una empresa con ese nombre", "error");
      }
      if (!res.ok) {
        const err = await res.json();
        Swal.close();
        return Swal.fire("Error", err.error || "Error al actualizar transportes", "error");
      }

      Swal.close();
      Swal.fire({
        title: "¡Actualizado!",
        text: "Transporte modificado",
        icon: "success",
        confirmButtonColor: "#007BFF",
      });
      setIsTransportEditModalOpen(false);
      fetchExistingTransportes();
    } catch {
      Swal.fire("Error", "No se pudo actualizar transporte", "error");
    }
  };

  const handleDeleteTransport = (id) => {
    Swal.fire({
      title: "Confirmar eliminación",
      text: "Se eliminará este transporte",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        const res = await fetch(`/api/recepcion/transportes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        Swal.fire({
          title: "¡Eliminado!",
          icon: "success",
          confirmButtonColor: "#007BFF",
        });
        fetchExistingTransportes();
      } catch {
        Swal.fire("Error", "No se pudo eliminar", "error");
      }
    });
  };

  const openCreateBarcoModal = () => {
    setCreateBarcoForm({
      vaporBarco: "",
      observaciones: "",
      productos: [],
      puntosDescarga: [],
      transportes: [],
    });
    setIsCreateBarcoModalOpen(true);
  };
  const handleCreateBarcoChange = (e) =>
    setCreateBarcoForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCreateBarcoProductosChange = (opts) =>
    setCreateBarcoForm((prev) => ({ ...prev, productos: (opts || []).map((o) => o.value) }));
  const handleCreateBarcoPuntosChange = (opts) =>
    setCreateBarcoForm((prev) => ({ ...prev, puntosDescarga: (opts || []).map((o) => o.value) }));
  const handleCreateBarcoTransportesChange = (opts) =>
    setCreateBarcoForm((prev) => ({
      ...prev,
      transportes: (opts || []).map((o) => ({ id: o.value, nombre: o.label })),
    }));

  const handleCreateBarcoSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({ title: "Procesando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const res = await fetch("/api/recepcion/barcos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBarcoForm),
      });
      if (!res.ok) throw new Error();
      await refreshData();
      setIsCreateBarcoModalOpen(false);
      Swal.fire({
        title: "¡Éxito!",
        text: "Barco creado",
        icon: "success",
        confirmButtonColor: "#007BFF",
      });
    } catch {
      Swal.fire("Error", "No se pudo crear el barco", "error");
    }
  };

  // AJUSTE CLAVE: filtramos productos y transportes eliminados al editar
  const openEditBarcoModal = (b) => {
    // filtrar productos que aún existen
    const existingProductoValues = productoOptions.map((opt) => opt.value);
    const filteredProductosEnForm = Array.isArray(b.productos)
      ? b.productos.filter((prod) => existingProductoValues.includes(prod))
      : [];

    // filtrar transportes que aún existen
    const existingTransIds = existingTransportes.map((t) => t.id);
    const filteredTransportesEnForm = Array.isArray(b.transportes)
      ? b.transportes.filter((t) => existingTransIds.includes(t.id))
      : [];

    setEditBarcoForm({
      id: b.id,
      vaporBarco: b.vaporBarco,
      observaciones: b.observaciones,
      productos: filteredProductosEnForm,
      puntosDescarga: Array.isArray(b.puntosDescarga) ? b.puntosDescarga : [],
      transportes: filteredTransportesEnForm,
    });
    setIsEditBarcoModalOpen(true);
  };
  const handleEditBarcoChange = handleCreateBarcoChange;
  const handleEditBarcoProductosChange = (opts) =>
    setEditBarcoForm((prev) => ({ ...prev, productos: (opts || []).map((o) => o.value) }));
  const handleEditBarcoPuntosChange = (opts) =>
    setEditBarcoForm((prev) => ({ ...prev, puntosDescarga: (opts || []).map((o) => o.value) }));
  const handleEditBarcoTransportesChange = (opts) =>
    setEditBarcoForm((prev) => ({
      ...prev,
      transportes: (opts || []).map((o) => ({ id: o.value, nombre: o.label })),
    }));

  const handleEditBarcoSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({ title: "Procesando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const { id, ...payload } = editBarcoForm;
    try {
      const res = await fetch(`/api/recepcion/barcos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      await refreshData();
      setIsEditBarcoModalOpen(false);
      Swal.fire({
        title: "¡Éxito!",
        text: "Barco actualizado",
        icon: "success",
        confirmButtonColor: "#007BFF",
      });
    } catch {
      Swal.fire("Error", "No se pudo actualizar el barco", "error");
    }
  };

  const openDeleteBarcoModal = (id) => {
    Swal.fire({
      title: "Confirmar eliminación",
      text: "No se puede revertir",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        const res = await fetch(`/api/recepcion/barcos/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const mensaje = data.error ?? data.message ?? "No se pudo eliminar";
          throw new Error(mensaje);
        }
        await refreshData();
        Swal.fire({
          title: "¡Eliminado!",
          icon: "success",
          confirmButtonColor: "#007BFF",
        });
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    });
  };

  const openCreateProductoModal = () => setIsCreateProductoModalOpen(true);
  const handleCreateProductoChange = (e) =>
    setCreateProductoForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const openEditProductoModal = (p) => {
    setEditProductoForm({ id: p.id, nombre: p.nombre, descripcion: p.descripcion });
    setIsEditProductoModalOpen(true);
  };
  const handleEditProductoChange = (e) =>
    setEditProductoForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreateProductoSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({ title: "Procesando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const res = await fetch("/api/recepcion/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createProductoForm),
      });
      if (!res.ok) throw new Error();
      await refreshData();
      setIsCreateProductoModalOpen(false);
      Swal.fire({
        title: "¡ÉxITO!",
        text: "Producto creado",
        icon: "success",
        confirmButtonColor: "#007BFF",
      });
    } catch {
      Swal.fire("Error", "No se pudo crear el producto", "error");
    }
  };

  const handleEditProductoSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({ title: "Procesando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const { id, ...payload } = editProductoForm;
    try {
      const res = await fetch(`/api/recepcion/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      await refreshData();
      setIsEditProductoModalOpen(false);
      Swal.fire({
        title: "¡ÉxITO!",
        text: "Producto actualizado",
        icon: "success",
        confirmButtonColor: "#007BFF",
      });
    } catch {
      Swal.fire("Error", "No se pudo actualizar el producto", "error");
    }
  };

  const openDeleteProductoModal = (id) => {
    Swal.fire({
      title: "Confirmar eliminación",
      text: "No se puede revertir",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        const w = await fetch(`/api/recepcion/productos/${id}`, { method: "DELETE" });
        if (!w.ok) throw new Error();
        await refreshData();
        Swal.fire({
          title: "¡Eliminado!",
          icon: "success",
          confirmButtonColor: "#007BFF",
        });
      } catch {
        Swal.fire("Error", "No se pudo eliminar el producto", "error");
      }
    });
  };

  const totalPages = Math.ceil(barcoTotalCount / barcoLimit);
  const handlePrevPage = () => barcoPage > 1 && setBarcoPage(barcoPage - 1);
  const handleNextPage = () => barcoPage < totalPages && setBarcoPage(barcoPage + 1);
  const handleLimitChange = (e) => {
    setBarcoLimit(+e.target.value);
    setBarcoPage(1);
  };

  if (!allLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <FiLoader className="animate-spin mr-2" size={40} />
        <span className="text-xl text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ========== HEADER ========== */}
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
              <h1 className="text-xl font-bold">Barcos Recepción</h1>
            </div>
            <div className="grid grid-cols-2 md:flex md:flex-row items-center mt-4 md:mt-0 gap-3">
              <button
                onClick={() => router.push("/proceso/consultar/recepcion")}
                className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded flex items-center"
              >
                <PiBarnFill className="mr-1" /> Registros
              </button>
              <button
                onClick={refreshData}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded flex items-center"
              >
                <FiRefreshCw className="mr-2 animate-spin-slow" /> Actualizar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========== CONTENIDO PRINCIPAL ========== */}
      <div className="container mx-auto px-4 py-6">
        {/* TABS */}
        <nav className="flex space-x-6 mb-4 border-b">
          <button
            onClick={() => setActiveTab("barcos")}
            className={`pb-2 ${
              activeTab === "barcos"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            <FiAnchor className="inline mr-1" /> Barcos
          </button>
          <button
            onClick={() => setActiveTab("productos")}
            className={`pb-2 ${
              activeTab === "productos"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            <FiBox className="inline mr-1" /> Productos
          </button>
          <button
            onClick={() => setActiveTab("transportes")}
            className={`pb-2 ${
              activeTab === "transportes"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            <PiTruckTrailerBold className="inline mr-1" /> Transportes
          </button>
        </nav>

        {/* ========== TRANSPORTES ========== */}
        {activeTab === "transportes" && (
          <section className="bg-white p-4 rounded-lg shadow space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-lg font-semibold mb-4 md:mb-0">Transportes</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                {/* Botón Descargar Formato */}
                <a
                  href="https://res.cloudinary.com/dw7txgvbh/raw/upload/v1745432798/resources/Formato.xlsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition"
                >
                  <FaFileExcel className="mr-1" /> Descargar Formato
                </a>
                {/* Botón Agregar Transportes */}
                <button
                  onClick={() => setIsTransportUploadModalOpen(true)}
                  className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  <FaPlus className="mr-1" /> Agregar Transportes
                </button>
              </div>
            </div>

            <div className="overflow-x-auto bg-white py-2">
              <table className="w-full table-auto bg-white rounded-lg shadow whitespace-nowrap">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Empresa</th>
                    <th className="px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingExistingTrans ? (
                    <tr>
                      <td colSpan={2} className="text-center py-4">
                        Cargando Transportes...
                      </td>
                    </tr>
                  ) : existingTransportes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-medium italic">
                        No hay registros.
                      </td>
                    </tr>
                  ) : (
                    existingTransportes.map((et) => (
                      <tr key={et.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{et.nombre}</td>
                        <td className="px-4 py-2 text-center space-x-2">
                          <button
                            onClick={() => openTransportViewModal(et)}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => openTransportEditModal(et)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTransport(et.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ========== BARCOS ========== */}
        {activeTab === "barcos" && (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar barcos..."
                value={barcoInput}
                onChange={(e) => setBarcoInput(e.target.value)}
                className="w-full sm:max-w-xs border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={openCreateBarcoModal}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
              >
                <FaPlus className="mr-2" /> Agregar Barco
              </button>
            </div>
            <section className="overflow-x-auto bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4 mt-2">Barcos Recepción</h2>
              <table className="w-full table-auto bg-white rounded-lg shadow whitespace-nowrap">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Vapor Barco</th>
                    <th className="px-4 py-3 text-left">Producto(s)</th>
                    <th className="px-4 py-3 text-left">Puntos Descarga</th>
                    <th className="px-4 py-3 text-left">Transportes</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingBarcos ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500">
                        Cargando Barcos...
                      </td>
                    </tr>
                  ) : filteredBarcos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-medium italic">
                        No hay registros.
                      </td>
                    </tr>
                  ) : (
                    filteredBarcos.map((barco) => (
                      <tr key={barco.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{barco.vaporBarco}</td>
                        <td className="px-4 py-2">
                          {Array.isArray(barco.productos)
                            ? barco.productos.join(", ")
                            : barco.productos}
                        </td>
                        <td className="px-4 py-2">
                          {Array.isArray(barco.puntosDescarga)
                            ? barco.puntosDescarga.join(", ")
                            : barco.puntosDescarga}
                        </td>
                        <td className="px-4 py-2">
                          {Array.isArray(barco.transportes)
                            ? barco.transportes.map((t) => t.nombre).join(", ")
                            : barco.transportes}
                        </td>
                        <td className="px-4 py-2 text-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBarcoDetail(barco);
                              setIsBarcoDetailModalOpen(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => openEditBarcoModal(barco)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteBarcoModal(barco.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* PAGINACIÓN */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
                <div className="flex space-x-2 overflow-x-auto">
                  <button
                    onClick={handlePrevPage}
                    disabled={barcoPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setBarcoPage(i + 1)}
                      className={`px-3 py-1 border rounded ${
                        barcoPage === i + 1 ? "bg-blue-500 text-white" : ""
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={handleNextPage}
                    disabled={barcoPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-2 sm:mt-0">
                  <span className="text-sm">
                    Mostrando {barcos.length} de {barcoTotalCount} registros
                  </span>
                  <div className="flex items-center gap-1">
                    <label htmlFor="limitSelect" className="text-sm">
                      Mostrar:
                    </label>
                    <select
                      id="limitSelect"
                      value={barcoLimit}
                      onChange={handleLimitChange}
                      className="border p-1 rounded"
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ========== PRODUCTOS ========== */}
        {activeTab === "productos" && (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={productoInput}
                onChange={(e) => setProductoInput(e.target.value)}
                className="w-full sm:max-w-xs border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={openCreateProductoModal}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
              >
                <FaPlus className="mr-2" /> Agregar Producto
              </button>
            </div>
            <section className="overflow-x-auto bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4 mt-2">Productos</h2>
              <table className="w-full table-auto bg-white rounded-lg shadow whitespace-nowrap">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingProductos ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-gray-500">
                        Cargando productos...
                      </td>
                    </tr>
                  ) : filteredProductos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-medium italic">
                        No hay registros.
                      </td>
                    </tr>
                  ) : (
                    filteredProductos.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{prod.nombre}</td>
                        <td className="px-4 py-2">{prod.descripcion}</td>
                        <td className="px-4 py-2 text-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProductoDetail(prod);
                              setIsProductoDetailModalOpen(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => openEditProductoModal(prod)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteProductoModal(prod.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>

      {/* ========== MODALES ========== */}

      {/* MODALES DE TRANSPORTES */}
      {isTransportUploadModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl p-6 space-y-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-semibold">Cargar Excel de Transportes</h3>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current.click()}
              className="cursor-pointer border-4 border-dashed border-gray-400 bg-white rounded-lg h-32 w-full flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
            >
              <FiUpload size={32} className="text-gray-400 mb-2" />
              <span className="text-gray-600">Arrastra o haz click para subir .xlsx</span>
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />

            {transportSheets.map(({ uid, sheetName, empresa, rows }) => (
              <div key={uid} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-3/4">
                    <label htmlFor={`empresa-${uid}`} className="block font-medium mb-1">
                      Empresa
                    </label>
                    <input
                      id={`empresa-${uid}`}
                      type="text"
                      value={empresa}
                      onChange={(e) => updateEmpresa(uid, e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">Hoja: {sheetName}</p>
                  </div>
                  <button
                    onClick={() => removeSheet(uid)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar empresa entera"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
                <table className="w-full table-auto bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Nombre Motorista</th>
                      <th className="px-2 py-1 text-left">Placa</th>
                      <th className="px-2 py-1">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.uid} className="hover:bg-gray-50">
                        <td className="p-2">  
                          <input
                            type="text"
                            value={r.nombre}
                            onChange={(e) => updateRow(uid, r.uid, "nombre", e.target.value)}
                            className="w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.placa}
                            onChange={(e) => updateRow(uid, r.uid, "placa", e.target.value)}
                            className="w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button onClick={() => removeRow(uid, r.uid)} className="text-red-500 hover:text-red-700">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => addRow(uid)} className="flex items-center text-blue-600 hover:underline text-sm">
                  <FaPlus className="mr-1" /> Agregar fila
                </button>
              </div>
            ))}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={() => {
                  setIsTransportUploadModalOpen(false);
                  setTransportSheets([]);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTransportes}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={!transportSheets.length}
              >
                Guardar transportes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VER DETALLE TRANSPORTE */}
      {isTransportViewModalOpen && selectedTransportView && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50 overflow-auto">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-xl font-semibold">Detalle Transporte</h3>
              <button onClick={() => setIsTransportViewModalOpen(false)} className="text-gray-600 hover:text-gray-900">
                Cerrar
              </button>
            </div>
            <div>
              <label className="block font-medium mb-1">Empresa</label>
              <input
                type="text"
                value={selectedTransportView.nombre}
                readOnly
                className="w-full border rounded px-3 py-2 bg-gray-50"
              />
            </div>
            <table className="w-full table-auto bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">Nombre Motorista</th>
                  <th className="px-2 py-1 text-left">Placa</th>
                </tr>
              </thead>
              <tbody>
                {selectedTransportView.motoristas.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        readOnly
                        value={m.nombre}
                        className="w-full border rounded px-2 py-1 bg-gray-50"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        readOnly
                        value={m.placa}
                        className="w-full border rounded px-2 py-1 bg-gray-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDITAR TRANSPORTE */}
      {isTransportEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50 overflow-auto">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-xl font-semibold">Editar Transporte</h3>
              <button onClick={() => setIsTransportEditModalOpen(false)} className="text-gray-600 hover:text-gray-900">
                Cerrar
              </button>
            </div>
            <div>
              <label className="block font-medium mb-1">Empresa</label>
              <input
                type="text"
                value={editTransportForm.empresa}
                onChange={(e) => handleEditTransportChange("empresa", e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <table className="w-full table-auto bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">Nombre Motorista</th>
                  <th className="px-2 py-1 text-left">Placa</th>
                  <th className="px-2 py-1 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {editTransportForm.motoristas.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="text"
                        value={m.nombre}
                        onChange={(e) => updateTransportRow(i, "nombre", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={m.placa}
                        onChange={(e) => updateTransportRow(i, "placa", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => removeTransportRow(i)} className="text-red-500 hover:text-red-700">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addTransportRow} className="flex items-center text-blue-600 hover:underline text-sm">
              <FaPlus className="mr-1" /> Agregar fila
            </button>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsTransportEditModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTransportEdit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREAR BARCO */}
      {isCreateBarcoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl">
            <div className="p-4 border-b">
              <h3 className="text-2xl font-semibold">Crear Barco</h3>
            </div>
            <div className="p-4 space-y-4">
              <form onSubmit={handleCreateBarcoSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Vapor Barco</label>
                  <input
                    name="vaporBarco"
                    value={createBarcoForm.vaporBarco}
                    onChange={handleCreateBarcoChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={createBarcoForm.observaciones}
                    onChange={handleCreateBarcoChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Productos</label>
                  <Select
                    isMulti
                    options={productoOptions}
                    value={productoOptions.filter((opt) =>
                      createBarcoForm.productos.includes(opt.value)
                    )}
                    onChange={handleCreateBarcoProductosChange}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    placeholder="Selecciona productos..."
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Puntos Descarga</label>
                  <Select
                    isMulti
                    options={descargaOptions}
                    value={descargaOptions
                      .flatMap((g) => g.options)
                      .filter((opt) =>
                        createBarcoForm.puntosDescarga.includes(opt.value)
                      )}
                    onChange={handleCreateBarcoPuntosChange}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    placeholder="Selecciona puntos..."
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Transportes</label>
                  <Select
                    isMulti
                    options={transportesOptions}
                    value={createBarcoForm.transportes.map((t) => ({
                      value: t.id,
                      label: t.nombre,
                    }))}
                    onChange={handleCreateBarcoTransportesChange}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    placeholder="Selecciona transportes..."
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateBarcoModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDITAR BARCO */}
      {isEditBarcoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl">
            <div className="p-4 border-b">
              <h3 className="text-2xl font-semibold">Editar Barco</h3>
            </div>
            <div className="p-4 space-y-4">
              <form onSubmit={handleEditBarcoSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Vapor Barco</label>
                  <input
                    name="vaporBarco"
                    value={editBarcoForm.vaporBarco}
                    onChange={handleEditBarcoChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={editBarcoForm.observaciones}
                    onChange={handleEditBarcoChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Productos</label>
                  <Select
                    isMulti
                    options={productoOptions}
                    value={productoOptions.filter((opt) =>
                      editBarcoForm.productos.includes(opt.value)
                    )}
                    onChange={handleEditBarcoProductosChange}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    placeholder="Selecciona productos..."
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Puntos Descarga</label>
                  <Select
                    isMulti
                    options={descargaOptions}
                    value={descargaOptions
                      .flatMap((g) => g.options)
                      .filter((opt) =>
                        editBarcoForm.puntosDescarga.includes(opt.value)
                      )}
                    onChange={handleEditBarcoPuntosChange}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    placeholder="Selecciona puntos..."
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Transportes</label>
                  <Select
                    isMulti
                    options={transportesOptions}
                    value={editBarcoForm.transportes.map((t) => ({
                      value: t.id,
                      label: t.nombre,
                    }))}
                    onChange={handleEditBarcoTransportesChange}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    placeholder="Selecciona transportes..."
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditBarcoModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DETALLE BARCO */}
      {isBarcoDetailModalOpen && selectedBarcoDetail && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-2xl font-bold">Detalles del Barco</h3>
              <button onClick={() => setIsBarcoDetailModalOpen(false)} className="text-gray-600 hover:text-gray-900">
                Cerrar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">Vapor Barco</label>
                <input
                  readOnly
                  value={selectedBarcoDetail.vaporBarco}
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Observaciones</label>
                <textarea
                  readOnly
                  value={selectedBarcoDetail.observaciones}
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Productos</label>
                <div className="w-full border rounded px-3 py-2 bg-gray-50">
                  {Array.isArray(selectedBarcoDetail.productos)
                    ? selectedBarcoDetail.productos.join(", ")
                    : selectedBarcoDetail.productos}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Puntos Descarga</label>
                <div className="w-full border rounded px-3 py-2 bg-gray-50">
                  {Array.isArray(selectedBarcoDetail.puntosDescarga)
                    ? selectedBarcoDetail.puntosDescarga.join(", ")
                    : selectedBarcoDetail.puntosDescarga}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Transportes</label>
                <div className="w-full border rounded px-3 py-2 bg-gray-50">
                  {Array.isArray(selectedBarcoDetail.transportes)
                    ? selectedBarcoDetail.transportes.map((t) => t.nombre).join(", ")
                    : selectedBarcoDetail.transportes}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREAR PRODUCTO */}
      {isCreateProductoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
            <div className="p-4 border-b">
              <h3 className="text-2xl font-semibold">Crear Producto</h3>
            </div>
            <div className="p-4 space-y-4">
              <form onSubmit={handleCreateProductoSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Nombre</label>
                  <input
                    name="nombre"
                    value={createProductoForm.nombre}
                    onChange={handleCreateProductoChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Descripción</label>
                  <input
                    name="descripcion"
                    value={createProductoForm.descripcion}
                    onChange={handleCreateProductoChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateProductoModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDITAR PRODUCTO */}
      {isEditProductoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
            <div className="p-4 border-b">
              <h3 className="text-2xl font-semibold">Editar Producto</h3>
            </div>
            <div className="p-4 space-y-4">
              <form onSubmit={handleEditProductoSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Nombre</label>
                  <input
                    name="nombre"
                    value={editProductoForm.nombre}
                    onChange={handleEditProductoChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Descripción</label>
                  <input
                    name="descripcion"
                    value={editProductoForm.descripcion}
                    onChange={handleEditProductoChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditProductoModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DETALLE PRODUCTO */}
      {isProductoDetailModalOpen && selectedProductoDetail && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center;border-b pb-4 mb-4">
              <h3 className="text-2xl font-bold">Detalles del Producto</h3>
              <button onClick={() => setIsProductoDetailModalOpen(false)} className="text-gray-600 hover:text-gray-900">
                Cerrar
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Nombre</label>
                <input
                  readOnly
                  value={selectedProductoDetail.nombre}
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Descripción</label>
                <input
                  readOnly
                  value={selectedProductoDetail.descripcion}
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global styles */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
