"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiArrowLeft, FiEdit, FiTrash2, FiLoader } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";

export default function UserRoleManagement() {
  const router = useRouter();

  // Estados para usuarios y roles
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

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

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    async function loadAllData() {
      await Promise.all([fetchUsers(), fetchRoles()]);
      setAllLoaded(true);
    }
    loadAllData();
  }, []);

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
    // Mostrar alerta de carga
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
        Swal.fire("Error", "No se pudo crear el usuario", "error");
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
    // Mostrar alerta de carga
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
        Swal.fire("Error", "No se pudo actualizar el usuario", "error");
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
        Swal.fire("Error", "No se pudo eliminar el usuario", "error");
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
    // Mostrar alerta de carga
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
        Swal.fire("Error", "No se pudo crear el rol", "error");
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
    // Mostrar alerta de carga
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
        Swal.fire("Error", "No se pudo actualizar el rol", "error");
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
        Swal.fire("Error", "No se pudo eliminar el rol", "error");
      }
    } catch (error) {
      console.error("Error eliminando rol:", error);
      Swal.fire("Error", "No se pudo eliminar el rol", "error");
    }
  };

  // Loader global hasta que se carguen todos los datos
  if (!allLoaded) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <FiLoader className="animate-spin mr-2" size={40} />
        <span className="text-xl text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-4 sm:p-6">
      {/* Contenedor principal responsive */}
      {/* Header */}
      <div className="flex items-center pb-3">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
          title="Volver"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Gestión de Usuarios</h1>
      </div>

      <div className="max-w-7xl mx-auto">

        {/* Contenido principal */}
        <main className="space-y-8">
          {/* Sección de Usuarios */}
          <section>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Usuarios</h2>
              <button
                onClick={openCreateUserModal}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition"
              >
                <FaPlus className="mr-2" />
                Nuevo Usuario
              </button>
            </div>
            <div className="overflow-x-auto">
              {loadingUsers ? (
                <p className="text-center text-gray-500">Cargando usuarios...</p>
              ) : (
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-gray-300 text-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">ID</th>
                      <th className="px-4 py-2 text-left font-medium">Username</th>
                      <th className="px-4 py-2 text-left font-medium">Nombre Completo</th>
                      <th className="px-4 py-2 text-left font-medium">Código</th>
                      <th className="px-4 py-2 text-left font-medium">Email</th>
                      <th className="px-4 py-2 text-left font-medium">Rol</th>
                      <th className="px-4 py-2 text-center font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700 text-nowrap">{user.id}</td>
                        <td className="px-4 py-2 text-gray-700 text-nowrap">{user.username}</td>
                        <td className="px-4 py-2 text-gray-700 text-nowrap">{user.nombreCompleto}</td>
                        <td className="px-4 py-2 text-gray-700 text-nowrap">{user.codigo}</td>
                        <td className="px-4 py-2 text-gray-700 text-nowrap">{user.email}</td>
                        <td className="px-4 py-2 text-gray-700 text-nowrap">{user.role?.name}</td>
                        <td className="px-4 py-2 text-center space-x-2 flex items-center justify-center">
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

          {/* Sección de Roles */}
          <section>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Roles</h2>
              <button
                onClick={openCreateRoleModal}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition"
              >
                <FaPlus className="mr-2" />
                Nuevo Rol
              </button>
            </div>
            <div className="overflow-x-auto">
              {loadingRoles ? (
                <p className="text-center text-gray-500">Cargando roles...</p>
              ) : (
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-gray-300 text-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">ID</th>
                      <th className="px-4 py-2 text-left font-medium">Nombre</th>
                      <th className="px-4 py-2 text-center font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700 text-nowrap">{role.id}</td>
                        <td className="px-4 py-2 text-gray-700 text-nowrap">{role.name}</td>
                        <td className="px-4 py-2 text-center space-x-2">
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
                    placeholder="Código"
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
                    placeholder="Código"
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
              <p>
                ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede revertir.
              </p>
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
              <p>
                ¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede revertir.
              </p>
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
    </div>
  );
}
