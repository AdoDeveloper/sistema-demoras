"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";

// Loader dinámico para no romper el SSR
const Loader = dynamic(() => import("./Loader"), { ssr: false });

// Componente encargado de la lógica relacionada con useSearchParams
function LoginFormContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [timer, setTimer] = useState(30);
  const lockIntervalRef = useRef(null);

  const { data: session, status } = useSession({ required: false });
  const router = useRouter();
  const params = useSearchParams();

  // 1️⃣ Si ya está autenticado, guardamos datos y vamos a /
  useEffect(() => {
    if (status === "authenticated") {
      localStorage.clear();
      localStorage.setItem("userId", session.user.id);
      localStorage.setItem("userName", session.user.username);
      localStorage.setItem("roleId", session.user.roleId);
      localStorage.setItem("userNameAll", session.user.nombreCompleto || "");
      router.replace("/");
    }
  }, [status, session, router]);

  // 2️⃣ Si vinimos por falta de sesión (SessionRequired), mostramos toast
  useEffect(() => {
    if (params.get("authorize") === "SessionRequired") {
      Swal.fire({
        icon: "warning",
        title: "Sesión expirada, por favor inicie sesión nuevamente",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  }, [params]);

  // 3️⃣ Al montar, comprobar si hay bloqueo en curso
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem("loginAttempts") || "0", 10);
    const lockStart = parseInt(localStorage.getItem("loginLockoutStart") || "0", 10);

    if (lockStart) {
      const elapsed = Math.floor((Date.now() - lockStart) / 1000);
      if (elapsed < 30) {
        setLocked(true);
        setTimer(30 - elapsed);
      } else {
        localStorage.removeItem("loginLockoutStart");
        localStorage.removeItem("loginAttempts");
      }
    }
  }, []);

  // 4️⃣ Contador regresivo durante el bloqueo
  useEffect(() => {
    if (locked) {
      lockIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(lockIntervalRef.current);
            localStorage.removeItem("loginLockoutStart");
            localStorage.removeItem("loginAttempts");
            setLocked(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
    };
  }, [locked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;

    setError("");
    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (result?.error) {
      // Registramos intento fallido
      const prev = parseInt(localStorage.getItem("loginAttempts") || "0", 10) + 1;
      localStorage.setItem("loginAttempts", String(prev));

      if (prev >= 3) {
        // Iniciar bloqueo de 30 s
        const now = Date.now();
        localStorage.setItem("loginLockoutStart", String(now));
        setLocked(true);
        setTimer(30);

        // Swal con barra de progreso y contador
        let toastInterval;
        Swal.fire({
          icon: "error",
          title: "Demasiados intentos fallidos",
          html: 'Reintentar en <b>30</b> segundos.',
          toast: true,
          position: "top-end",
          timer: 30000,
          timerProgressBar: true,
          showConfirmButton: false,
          didOpen: (toast) => {
            const b = toast.querySelector("b");
            toastInterval = setInterval(() => {
              const remaining = Math.ceil(Swal.getTimerLeft() / 1000);
              if (b) b.textContent = String(remaining);
            }, 100);
          },
          willClose: () => {
            clearInterval(toastInterval);
          }
        });
      } else {
        setError(result.error);
      }
    }
  };

  // Loader mientras NextAuth carga el estado
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
            src="https://res.cloudinary.com/dw7txgvbh/image/upload/f_auto,q_auto/almapac-logo"
            alt="Almapac Logo"
            width={250}
            height={120}
            style={{ width: "100%", height: "auto" }}
            className="object-contain"
            priority
          />
        </div>

        {/* Título */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-4 text-cyan-700">
          Control de Tiempos
        </h2>

        {/* Error */}
        {error && !locked && (
          <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded-md mb-4">
            {error}
          </p>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre de usuario"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={locked}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={locked}
          />
          <button
            type="submit"
            className={`w-full font-bold py-3 rounded-lg shadow-md transform active:translate-y-1 active:shadow-sm transition-all
              ${locked
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            disabled={locked}
          >
            {locked ? `Intentar de nuevo en ${timer}s` : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Componente fallback simple para Suspense
function LoginFormFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r">
      <Loader />
    </div>
  );
}

// Componente principal que implementa Suspense
export default function LoginForm() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginFormContent />
    </Suspense>
  );
}