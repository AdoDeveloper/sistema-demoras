"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiArrowLeft, FiEdit, FiTrash2 } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";

export default function UserRoleManagement() {
  const router = useRouter();

  // Estados para usuarios y roles
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

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

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Modal para crear usuario
  const handleShowCreateUserModal = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Crear Usuario",
      html: `
        <div class="flex flex-col gap-3">
          <input id="swal-input1" class="swal2-input" placeholder="Username">
          <input id="swal-input2" class="swal2-input" placeholder="Nombre Completo">
          <input id="swal-input3" class="swal2-input" placeholder="Código">
          <input id="swal-input4" class="swal2-input" placeholder="Email">
          <input id="swal-input5" class="swal2-input" type="password" placeholder="Password">
          <select id="swal-input6" class="swal2-input">
            <option value="">Seleccione un rol</option>
            ${roles.map((role) => `<option value="${role.id}">${role.name}</option>`).join("")}
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
      preConfirm: () => ({
        username: document.getElementById("swal-input1").value,
        nombreCompleto: document.getElementById("swal-input2").value,
        codigo: document.getElementById("swal-input3").value,
        email: document.getElementById("swal-input4").value,
        password: document.getElementById("swal-input5").value,
        roleId: document.getElementById("swal-input6").value,
      }),
    });
    if (formValues) {
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formValues,
            roleId: parseInt(formValues.roleId, 10),
          }),
        });
        if (res.ok) {
          const createdUser = await res.json();
          setUsers((prev) => [...prev, createdUser]);
          Swal.fire("¡Éxito!", "Usuario creado correctamente", "success");
        } else {
          Swal.fire("Error", "No se pudo crear el usuario", "error");
        }
      } catch (error) {
        console.error("Error creating user:", error);
        Swal.fire("Error", "No se pudo crear el usuario", "error");
      }
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (id) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede revertir.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar usuario!",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
          if (res.ok) {
            setUsers(users.filter((u) => u.id !== id));
            Swal.fire("Eliminado!", "El usuario ha sido eliminado.", "success");
          } else {
            Swal.fire("Error", "No se pudo eliminar el usuario.", "error");
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          Swal.fire("Error", "No se pudo eliminar el usuario.", "error");
        }
      }
    });
  };

  // Editar usuario
  const handleEditUser = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: "Editar Usuario",
      html: `
        <div class="flex flex-col gap-3">
          <input id="swal-input1" class="swal2-input" placeholder="Username" value="${user.username}">
          <input id="swal-input2" class="swal2-input" placeholder="Nombre Completo" value="${user.nombreCompleto}">
          <input id="swal-input3" class="swal2-input" placeholder="Código" value="${user.codigo}">
          <input id="swal-input4" class="swal2-input" placeholder="Email" value="${user.email || ""}">
          <input id="swal-input5" class="swal2-input" type="password" placeholder="Password (opcional)">
          <select id="swal-input6" class="swal2-input">
            <option value="">Seleccione un rol</option>
            ${roles
              .map(
                (role) =>
                  `<option value="${role.id}" ${role.id === user.role?.id ? "selected" : ""}>${role.name}</option>`
              )
              .join("")}
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Actualizar",
      cancelButtonText: "Cancelar",
      preConfirm: () => ({
        username: document.getElementById("swal-input1").value,
        nombreCompleto: document.getElementById("swal-input2").value,
        codigo: document.getElementById("swal-input3").value,
        email: document.getElementById("swal-input4").value,
        password: document.getElementById("swal-input5").value,
        roleId: document.getElementById("swal-input6").value,
      }),
    });
    if (formValues) {
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formValues,
            roleId: parseInt(formValues.roleId, 10),
            password: formValues.password ? formValues.password : user.password,
          }),
        });
        if (res.ok) {
          const updatedUser = await res.json();
          setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
          Swal.fire("¡Éxito!", "Usuario actualizado correctamente", "success");
        } else {
          Swal.fire("Error", "No se pudo actualizar el usuario", "error");
        }
      } catch (error) {
        console.error("Error updating user:", error);
        Swal.fire("Error", "No se pudo actualizar el usuario", "error");
      }
    }
  };

  // Modal para crear rol
  const handleShowCreateRoleModal = async () => {
    const { value: roleName } = await Swal.fire({
      title: "Crear Rol",
      input: "text",
      inputLabel: "Nombre del rol",
      inputPlaceholder: "Ingrese el nombre del rol",
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage("El nombre es requerido");
        }
        return value;
      },
    });
    if (roleName) {
      try {
        const res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: roleName }),
        });
        if (res.ok) {
          const createdRole = await res.json();
          setRoles((prev) => [...prev, createdRole]);
          Swal.fire("¡Éxito!", "Rol creado correctamente", "success");
        } else {
          Swal.fire("Error", "No se pudo crear el rol", "error");
        }
      } catch (error) {
        console.error("Error creating role:", error);
        Swal.fire("Error", "No se pudo crear el rol", "error");
      }
    }
  };

  // Eliminar rol
  const handleDeleteRole = async (id) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede revertir.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar rol!",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
          if (res.ok) {
            setRoles(roles.filter((r) => r.id !== id));
            Swal.fire("Eliminado!", "El rol ha sido eliminado.", "success");
          } else {
            Swal.fire("Error", "No se pudo eliminar el rol.", "error");
          }
        } catch (error) {
          console.error("Error deleting role:", error);
          Swal.fire("Error", "No se pudo eliminar el rol.", "error");
        }
      }
    });
  };

  // Editar rol
  const handleEditRole = async (role) => {
    const { value: newName } = await Swal.fire({
      title: "Editar Rol",
      input: "text",
      inputLabel: "Nuevo nombre para el rol",
      inputValue: role.name,
      showCancelButton: true,
      confirmButtonText: "Actualizar",
      cancelButtonText: "Cancelar",
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage("El nombre es requerido");
        }
        return value;
      },
    });
    if (newName) {
      try {
        const res = await fetch(`/api/roles/${role.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        if (res.ok) {
          const updatedRole = await res.json();
          setRoles(roles.map((r) => (r.id === role.id ? updatedRole : r)));
          Swal.fire("¡Éxito!", "Rol actualizado correctamente", "success");
        } else {
          Swal.fire("Error", "No se pudo actualizar el rol", "error");
        }
      } catch (error) {
        console.error("Error updating role:", error);
        Swal.fire("Error", "No se pudo actualizar el rol", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center pb-3">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
                title="Volver"
              >
              <FiArrowLeft size={20} />
          </button>
        <h1 className="text-xl font-bold">Gestion Usuarios</h1>
      </div>

      {/* Contenido principal */}
      <main className="space-y-8">
        {/* Sección de Usuarios */}
        <section>
          <div className="flex flex-row items-center justify-between mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Usuarios</h2>
            <button
              onClick={handleShowCreateUserModal}
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
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium">ID</th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium">Username</th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium">Nombre Completo</th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium">Código</th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium">Email</th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium">Rol</th>
                    <th className="px-4 py-2 whitespace-nowrap text-center font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{user.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{user.username}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{user.nombreCompleto}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{user.codigo}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{user.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{user.role?.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          title="Editar usuario"
                          className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full transition-colors"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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
          <div className="flex flex-row items-center justify-between mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Roles</h2>
            <button
              onClick={handleShowCreateRoleModal}
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
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium">ID</th>
                    <th className="px-4 py-2 whitespace-nowrap text-left font-medium">Nombre</th>
                    <th className="px-4 py-2 whitespace-nowrap text-center font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{role.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{role.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center space-x-2">
                        <button
                          onClick={() => handleEditRole(role)}
                          title="Editar rol"
                          className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full transition-colors"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
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
  );
}
