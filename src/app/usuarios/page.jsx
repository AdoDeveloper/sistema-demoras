"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiRefreshCw,
  FiUsers,
  FiTag,
} from "react-icons/fi";
import { FaPlus } from "react-icons/fa";

export default function UserRoleManagement() {
  const router = useRouter();

  // Estado para pestañas: "users" o "roles"
  const [activeTab, setActiveTab] = useState("users");

  // Estados para usuarios y roles
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // Estados para búsquedas
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  // Estados para modales y formularios
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    nombreCompleto: "",
    codigo: "",
    email: "",
    password: "",
    roleId: "",
  });

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    id: null,
    username: "",
    nombreCompleto: "",
    codigo: "",
    email: "",
    password: "",
    roleId: "",
  });

  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [editRoleForm, setEditRoleForm] = useState({
    id: null,
    name: "",
  });

  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // Función para cargar usuarios
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoadingUsers(false);
  };

  // Función para cargar roles
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
    setLoadingRoles(false);
  };

  // Función para refrescar datos
  const refreshData = async () => {
    await Promise.all([fetchUsers(), fetchRoles()]);
    Swal.fire("Refrescado", "Datos actualizados", "success");
  };

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    async function loadAllData() {
      await Promise.all([fetchUsers(), fetchRoles()]);
      setAllLoaded(true);
    }
    loadAllData();
  }, []);

  // Filtrar usuarios según la búsqueda
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.nombreCompleto.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.codigo.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Filtrar roles según la búsqueda
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  // Manejo del switch de activo en la tabla de usuarios
  const handleToggleActivo = async (user) => {
    const newActivo = !user.activo;
    const payload = {
      username: user.username,
      nombreCompleto: user.nombreCompleto,
      codigo: user.codigo,
      email: user.email,
      roleId: user.role?.id,
      activo: newActivo,
    };
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
        Swal.fire("¡Éxito!", "Estado de activo actualizado", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Error", errorData.error || "No se pudo actualizar el estado de activo", "error");
      }
    } catch (error) {
      console.error("Error actualizando estado de activo:", error);
      Swal.fire("Error", "No se pudo actualizar el estado de activo", "error");
    }
  };

  // Función para asignar colores a la etiqueta de rol (colores distintos para cada rol)
  const getRoleBadgeClass = (roleName) => {
    if (!roleName) return "bg-yellow-200 text-yellow-800";
    const r = roleName.toLowerCase();
    if (r.includes("administrador")) return "bg-blue-200 text-blue-800 font-bold";
    if (r.includes("asistente")) return "bg-green-200 text-green-800 font-bold";
    if (r.includes("muellero")) return "bg-orange-200 text-orange-800 font-bold";
    if (r.includes("operador")) return "bg-cyan-200 text-cyan-800 font-bold";
    if (r.includes("supervisor")) return "bg-red-200 text-red-800 font-bold";
    if (r.includes("chequero")) return "bg-indigo-200 text-indigo-800 font-bold";
    if (r.includes("auditor")) return "bg-amber-200 text-amber-800 font-bold";
    return "bg-gray-200 text-gray-800";
  };

  // Abrir modal para crear usuario
  const openCreateUserModal = () => {
    setCreateUserForm({
      username: "",
      nombreCompleto: "",
      codigo: "",
      email: "",
      password: "",
      roleId: "",
    });
    setIsCreateUserModalOpen(true);
  };

  const handleCreateUserChange = (e) => {
    const { name, value } = e.target;
    setCreateUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Creando usuario...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createUserForm,
          roleId: parseInt(createUserForm.roleId, 10),
        }),
      });
      Swal.close();
      if (res.ok) {
        const createdUser = await res.json();
        setUsers((prev) => [...prev, createdUser]);
        setIsCreateUserModalOpen(false);
        Swal.fire("¡Éxito!", "Usuario creado correctamente", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Error", errorData.error || "No se pudo crear el usuario", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("Error creando usuario:", error);
      Swal.fire("Error", "No se pudo crear el usuario", "error");
    }
  };

  // Abrir modal para editar usuario
  const openEditUserModal = (user) => {
    setEditUserForm({
      id: user.id,
      username: user.username,
      nombreCompleto: user.nombreCompleto,
      codigo: user.codigo,
      email: user.email || "",
      password: "",
      roleId: user.role?.id.toString() || "",
    });
    setIsEditUserModalOpen(true);
  };

  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setEditUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    const { id, username, nombreCompleto, codigo, email, password, roleId } = editUserForm;
    const payload = {
      username,
      nombreCompleto,
      codigo,
      email,
      roleId: parseInt(roleId, 10),
    };
    if (password.trim() !== "") {
      payload.password = password;
    }
    Swal.fire({
      title: "Actualizando usuario...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      Swal.close();
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map((u) => (u.id === id ? updatedUser : u)));
        setIsEditUserModalOpen(false);
        Swal.fire("¡Éxito!", "Usuario actualizado correctamente", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Error", errorData.error || "No se pudo actualizar el usuario", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("Error actualizando usuario:", error);
      Swal.fire("Error", "No se pudo actualizar el usuario", "error");
    }
  };

  // Abrir modal para confirmar eliminación de usuario
  const openDeleteUserModal = (id) => {
    setUserToDelete(id);
    setIsDeleteUserModalOpen(true);
  };

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`/api/users/${userToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userToDelete));
        setIsDeleteUserModalOpen(false);
        Swal.fire("¡Éxito!", "Usuario eliminado correctamente", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Error", errorData.error || "No se pudo eliminar el usuario", "error");
      }
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      Swal.fire("Error", "No se pudo eliminar el usuario", "error");
    }
  };

  // Abrir modal para crear rol
  const openCreateRoleModal = () => {
    setNewRoleName("");
    setIsCreateRoleModalOpen(true);
  };

  const handleCreateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    Swal.fire({
      title: "Creando rol...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName }),
      });
      Swal.close();
      if (res.ok) {
        const createdRole = await res.json();
        setRoles((prev) => [...prev, createdRole]);
        setIsCreateRoleModalOpen(false);
        Swal.fire("¡Éxito!", "Rol creado correctamente", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Error", errorData.error || "No se pudo crear el rol", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("Error creando rol:", error);
      Swal.fire("Error", "No se pudo crear el rol", "error");
    }
  };

  // Abrir modal para editar rol
  const openEditRoleModal = (role) => {
    setEditRoleForm({
      id: role.id,
      name: role.name,
    });
    setIsEditRoleModalOpen(true);
  };

  const handleEditRoleChange = (e) => {
    setEditRoleForm({ ...editRoleForm, name: e.target.value });
  };

  const handleEditRoleSubmit = async (e) => {
    e.preventDefault();
    const { id, name } = editRoleForm;
    Swal.fire({
      title: "Actualizando rol...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      Swal.close();
      if (res.ok) {
        const updatedRole = await res.json();
        setRoles(roles.map((r) => (r.id === id ? updatedRole : r)));
        setIsEditRoleModalOpen(false);
        Swal.fire("¡Éxito!", "Rol actualizado correctamente", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Error", errorData.error || "No se pudo actualizar el rol", "error");
      }
    } catch (error) {
      Swal.close();
      console.error("Error actualizando rol:", error);
      Swal.fire("Error", "No se pudo actualizar el rol", "error");
    }
  };

  // Abrir modal para confirmar eliminación de rol
  const openDeleteRoleModal = (id) => {
    setRoleToDelete(id);
    setIsDeleteRoleModalOpen(true);
  };

  const handleDeleteRole = async () => {
    try {
      const res = await fetch(`/api/roles/${roleToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setRoles(roles.filter((r) => r.id !== roleToDelete));
        setIsDeleteRoleModalOpen(false);
        Swal.fire("¡Éxito!", "Rol eliminado correctamente", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Error", errorData.error || "No se pudo eliminar el rol", "error");
      }
    } catch (error) {
      console.error("Error eliminando rol:", error);
      Swal.fire("Error", "No se pudo eliminar el rol", "error");
    }
  };

  if (!allLoaded) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <FiLoader className="animate-spin mr-2" size={40} />
        <span className="text-xl text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Encabezado principal con azul oscuro */}
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
            <h1 className="text-xl font-bold">Usuarios & Roles</h1>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105"
            title="Actualizar"
          >
            <FiRefreshCw className="mr-2 animate-spin-slow" size={20} />
            Actualizar
          </button>
        </div>
      </div>
  </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6">
        <main className="space-y-8 bg-white p-4 border-b border-gray-300">
        {/* Barra de Tabs y Buscador */}
        <div>
          <nav className="flex items-center space-x-6 mb-4">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center space-x-1 pb-1 border-b-2 transition-all duration-300 ${
                activeTab === "users"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-600"
              }`}
            >
              <FiUsers size={18} />
              <span>Usuarios</span>
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`flex items-center space-x-1 pb-1 border-b-2 transition-all duration-300 ${
                activeTab === "roles"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-600"
              }`}
            >
              <FiTag size={18} />
              <span>Roles</span>
            </button>
          </nav>
          {activeTab === "users" && (
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full sm:max-w-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={openCreateUserModal}
                className="w-full sm:w-auto flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition"
              >
                <FaPlus className="mr-2" />
                Agregar
              </button>
            </div>
          )}
          {activeTab === "roles" && (
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                placeholder="Buscar roles..."
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                className="w-full sm:max-w-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={openCreateRoleModal}
                className="w-full sm:w-auto flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition"
              >
                <FaPlus className="mr-2" />
                Agregar
              </button>
            </div>
          )}
        </div>

          {/* Renderizar tabla según la pestaña activa */}
          {activeTab === "users" ? (
            <section>
              <div className="overflow-x-auto">
                {loadingUsers ? (
                  <p className="text-center text-gray-500">Cargando usuarios...</p>
                ) : (
                  <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-200 text-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left whitespace-nowrap">Username</th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">Nombre Completo</th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">Código</th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">Email</th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">Rol</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">Activo</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{user.username}</td>
                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{user.nombreCompleto}</td>
                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{user.codigo}</td>
                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{user.email}</td>
                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-md text-sm font-medium ${getRoleBadgeClass(
                                user.role?.name
                              )}`}
                            >
                              {user.role?.name}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={user.activo}
                                onChange={() => handleToggleActivo(user)}
                              />
                              <span className="slider round"></span>
                            </label>
                          </td>
                          <td className="px-4 py-2 text-center flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditUserModal(user)}
                              title="Editar usuario"
                              className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full transition-colors"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteUserModal(user.id)}
                              title="Eliminar usuario"
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : (
            <section>
              <div className="overflow-x-auto">
                {loadingRoles ? (
                  <p className="text-center text-gray-500">Cargando roles...</p>
                ) : (
                  <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-200 text-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left">Nombre</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRoles.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700">{role.name}</td>
                          <td className="px-4 py-2 text-center flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditRoleModal(role)}
                              title="Editar rol"
                              className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full transition-colors"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteRoleModal(role.id)}
                              title="Eliminar rol"
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modal: Crear Usuario */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Crear Usuario</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleCreateUserSubmit}>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    className="border p-2 rounded"
                    value={createUserForm.username}
                    onChange={handleCreateUserChange}
                    required
                  />
                  <input
                    type="text"
                    name="nombreCompleto"
                    placeholder="Nombre Completo"
                    className="border p-2 rounded"
                    value={createUserForm.nombreCompleto}
                    onChange={handleCreateUserChange}
                    required
                  />
                  <input
                    type="text"
                    name="codigo"
                    placeholder="Código Empleado"
                    className="border p-2 rounded"
                    value={createUserForm.codigo}
                    onChange={handleCreateUserChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="border p-2 rounded"
                    value={createUserForm.email}
                    onChange={handleCreateUserChange}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="border p-2 rounded"
                    value={createUserForm.password}
                    onChange={handleCreateUserChange}
                    required
                  />
                  <select
                    name="roleId"
                    className="border p-2 rounded"
                    value={createUserForm.roleId}
                    onChange={handleCreateUserChange}
                    required
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserModalOpen(false)}
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

      {/* Modal: Editar Usuario */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Editar Usuario</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleEditUserSubmit}>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    className="border p-2 rounded"
                    value={editUserForm.username}
                    onChange={handleEditUserChange}
                    required
                  />
                  <input
                    type="text"
                    name="nombreCompleto"
                    placeholder="Nombre Completo"
                    className="border p-2 rounded"
                    value={editUserForm.nombreCompleto}
                    onChange={handleEditUserChange}
                    required
                  />
                  <input
                    type="text"
                    name="codigo"
                    placeholder="Código Empleado"
                    className="border p-2 rounded"
                    value={editUserForm.codigo}
                    onChange={handleEditUserChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="border p-2 rounded"
                    value={editUserForm.email}
                    onChange={handleEditUserChange}
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (opcional)"
                    className="border p-2 rounded"
                    value={editUserForm.password}
                    onChange={handleEditUserChange}
                  />
                  <select
                    name="roleId"
                    className="border p-2 rounded"
                    value={editUserForm.roleId}
                    onChange={handleEditUserChange}
                    required
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditUserModalOpen(false)}
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

      {/* Modal: Confirmar Eliminación de Usuario */}
      {isDeleteUserModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Confirmar Eliminación</h3>
            </div>
            <div className="p-4">
              <p>¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede revertir.</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDeleteUserModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Rol */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Crear Rol</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleCreateRoleSubmit}>
                <input
                  type="text"
                  placeholder="Nombre del rol"
                  className="border p-2 rounded w-full"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateRoleModalOpen(false)}
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

      {/* Modal: Editar Rol */}
      {isEditRoleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Editar Rol</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleEditRoleSubmit}>
                <input
                  type="text"
                  placeholder="Nuevo nombre para el rol"
                  className="border p-2 rounded w-full"
                  value={editRoleForm.name}
                  onChange={handleEditRoleChange}
                  required
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditRoleModalOpen(false)}
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

      {/* Modal: Confirmar Eliminación de Rol */}
      {isDeleteRoleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-2 border-b">
              <h3 className="text-lg font-semibold">Confirmar Eliminación</h3>
            </div>
            <div className="p-4">
              <p>¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede revertir.</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDeleteRoleModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRole}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para el switch y animación */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 20px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #4caf50;
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );
}
