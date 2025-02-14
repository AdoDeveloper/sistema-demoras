"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Loader from "./Loader"; // Ajusta la ruta según la ubicación de tu Loader.jsx

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirigir si ya hay una sesión activa
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Guardar en localStorage el id y username del usuario cuando se inicie sesión
  useEffect(() => {
    if (session?.user) {
      localStorage.setItem("userId", session.user.id);
      localStorage.setItem("userName", session.user.username);
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (result?.error) {
      setError("Usuario o contraseña incorrectos");
    } else {
      router.push("/");
    }
  };

  // Mientras se verifica la sesión, mostramos el Loader a pantalla completa
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r p-4">
      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-8 border-orange-500">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="Almapac Logo"
            width={250}
            height={120}
            className="object-contain"
          />
        </div>

        {/* Título */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-4 text-cyan-700">
          Control de Tiempos
        </h2>

        {/* Mensaje de error */}
        {error && (
          <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded-md mb-4">
            {error}
          </p>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Nombre de usuario"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Botón de inicio de sesión */}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg shadow-md transform active:translate-y-1 active:shadow-sm transition-all hover:bg-orange-600"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
