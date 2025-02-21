"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  FiArrowLeft,
  FiUser,
  FiSettings,
  FiLogOut,
  FiHelpCircle,
} from "react-icons/fi";
import { FaPlay, FaList, FaChartBar, FaPlus } from "react-icons/fa";
import { HiOutlineUserCircle } from "react-icons/hi";

export default function UserRoleManagement() {
  const router = useRouter();

  // Estados para usuarios
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Estados para roles
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Funciones para cargar datos
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
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="Username" value="">` +
        `<input id="swal-input2" class="swal2-input" placeholder="Nombre Completo" value="">` +
        `<input id="swal-input3" class="swal2-input" placeholder="Código" value="">` +
        `<input id="swal-input4" class="swal2-input" placeholder="Email" value="">` +
        `<input id="swal-input5" class="swal2-input" type="password" placeholder="Password">` +
        `<select id="swal-input6" class="swal2-input">
           <option value="">Seleccione un rol</option>
           ${roles
             .map(
               (role) =>
                 `<option value="${role.id}">${role.name}</option>`
             )
             .join("")}
         </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        return {
          username: document.getElementById("swal-input1").value,
          nombreCompleto: document.getElementById("swal-input2").value,
          codigo: document.getElementById("swal-input3").value,
          email: document.getElementById("swal-input4").value,
          password: document.getElementById("swal-input5").value,
          roleId: document.getElementById("swal-input6").value,
        };
      },
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
      text: "¡Esta acción no se puede revertir!",
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
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="Username" value="${user.username}">` +
        `<input id="swal-input2" class="swal2-input" placeholder="Nombre Completo" value="${user.nombreCompleto}">` +
        `<input id="swal-input3" class="swal2-input" placeholder="Código" value="${user.codigo}">` +
        `<input id="swal-input4" class="swal2-input" placeholder="Email" value="${user.email || ""}">` +
        `<input id="swal-input5" class="swal2-input" type="password" placeholder="Password (dejar en blanco para no cambiar)">` +
        `<select id="swal-input6" class="swal2-input">
           <option value="">Seleccione un rol</option>
           ${roles
             .map(
               (role) =>
                 `<option value="${role.id}" ${
                   role.id === user.role?.id ? "selected" : ""
                 }>${role.name}</option>`
             )
             .join("")}
         </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Actualizar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        return {
          username: document.getElementById("swal-input1").value,
          nombreCompleto: document.getElementById("swal-input2").value,
          codigo: document.getElementById("swal-input3").value,
          email: document.getElementById("swal-input4").value,
          password: document.getElementById("swal-input5").value,
          roleId: document.getElementById("swal-input6").value,
        };
      },
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
      text: "¡Esta acción no se puede revertir!",
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
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header con flecha de retorno */}
      <header className="flex items-center mb-8">
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 hover:bg-blue-900 text-white p-2 rounded-full mr-3 transition-all duration-300 transform hover:scale-105"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Gestión de Usuarios y Roles</h1>
      </header>

      {/* Sección de Gestión de Usuarios */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <button
            onClick={handleShowCreateUserModal}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow transition"
          >
            <FaPlus className="mr-2" />
            Agregar Usuario
          </button>
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4">Lista de Usuarios</h3>
          {loadingUsers ? (
            <p>Cargando usuarios...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Username
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Nombre Completo
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Código
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Rol
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {user.id}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {user.username}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {user.nombreCompleto}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {user.codigo}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {user.role?.name}
                    </td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Sección de Gestión de Roles */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Gestión de Roles</h2>
          <button
            onClick={handleShowCreateRoleModal}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow transition"
          >
            <FaPlus className="mr-2" />
            Agregar Rol
          </button>
        </div>
        {/* Lista de Roles */}
        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4">Lista de Roles</h3>
          {loadingRoles ? (
            <p>Cargando roles...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {role.id}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {role.name}
                    </td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
