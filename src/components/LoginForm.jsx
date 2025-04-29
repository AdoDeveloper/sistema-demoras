'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Swal from 'sweetalert2';
import dynamic from 'next/dynamic';

// Dynamic loader to avoid SSR issues
const Loader = dynamic(() => import('./Loader'), { ssr: false });

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [timer, setTimer] = useState(30);
  const lockIntervalRef = useRef(null);

  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  // Redirect authenticated users
  useEffect(() => {
    if (status === 'authenticated') {
      localStorage.clear();
      localStorage.setItem('userId', session.user.id);
      localStorage.setItem('userName', session.user.username);
      localStorage.setItem('roleId', session.user.roleId);
      localStorage.setItem('userNameAll', session.user.nombreCompleto || '');
      router.replace('/');
    }
  }, [status, session, router]);

  // Show warning if redirected due to expired session
  useEffect(() => {
    if (params.get('authorize') === 'SessionRequired') {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión expirada, por favor inicie sesión nuevamente',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      });
    }
  }, [params]);

  // Check for existing lock on mount
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);
    const lockStart = parseInt(localStorage.getItem('loginLockoutStart') || '0', 10);

    if (lockStart) {
      const elapsed = Math.floor((Date.now() - lockStart) / 1000);
      if (elapsed < 30) {
        setLocked(true);
        setTimer(30 - elapsed);
      } else {
        localStorage.removeItem('loginLockoutStart');
        localStorage.removeItem('loginAttempts');
      }
    }
  }, []);

  // Countdown during lock
  useEffect(() => {
    if (!locked) return;

    lockIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(lockIntervalRef.current);
          localStorage.removeItem('loginLockoutStart');
          localStorage.removeItem('loginAttempts');
          setLocked(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(lockIntervalRef.current);
  }, [locked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;

    setError('');
    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10) + 1;
        localStorage.setItem('loginAttempts', String(attempts));

        if (attempts >= 3) {
          const now = Date.now();
          localStorage.setItem('loginLockoutStart', String(now));
          setLocked(true);
          setTimer(30);

          let interval;
          Swal.fire({
            icon: 'error',
            title: 'Demasiados intentos fallidos',
            html: 'Reintentar en <b>30</b> segundos.',
            toast: true,
            position: 'top-end',
            timer: 30000,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: (toast) => {
              const b = toast.querySelector('b');
              interval = setInterval(() => {
                if (b) b.textContent = String(Math.ceil(Swal.getTimerLeft() / 1000));
              }, 100);
            },
            willClose: () => clearInterval(interval),
          });
        } else {
          setError(result.error);
        }
      } else {
        router.replace('/');
      }
    } catch (err) {
      console.error('Login error', err);
      setError('Error inesperado, inténtalo de nuevo');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-cyan-100 to-cyan-300">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-cyan-100 to-cyan-300 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border-t-4 border-orange-500">
        <div className="flex justify-center mb-6">
          <Image
            src="https://res.cloudinary.com/dw7txgvbh/image/upload/f_auto,q_auto/almapac-logo"
            alt="Almapac Logo"
            width={250}
            height={120}
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-3xl font-extrabold text-center mb-4 text-cyan-700">Control de Tiempos</h2>

        {error && !locked && (
          <p className="text-red-600 text-center bg-red-100 p-2 rounded mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={locked}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={locked}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="submit"
            disabled={locked}
            className={`w-full py-3 font-bold rounded-lg shadow transform active:translate-y-1 transition-all ${
              locked ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {locked ? `Intentar de nuevo en ${timer}s` : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}