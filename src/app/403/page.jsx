// pages/403.jsx
"use client";

import Head from "next/head";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock, FaArrowLeft, FaHome, FaSignInAlt } from "react-icons/fa";

export default function ForbiddenPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const handleGoBack = () => router.back();
  const goToHome = () => router.push("/");
  const goToLogin = () => router.push("/login");

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full"
        />
      </motion.div>
    );
  }

  return (
    <>
      <Head>
        <title>Acceso restringido | Error 403</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto overflow-hidden"
          >
            <motion.div 
              variants={itemVariants}
              className="bg-red-50 p-6 text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 2 
                }}
                className="inline-block p-4 bg-white rounded-full shadow-md"
              >
                <FaLock className="text-red-500 text-4xl" />
              </motion.div>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              className="p-6 sm:p-8 space-y-6"
            >
              <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
                  Acceso restringido
                </h1>
                <p className="text-gray-600 text-center mt-2">
                  No tienes permiso para acceder a este recurso. Ponte en contacto con el administrador.
                </p>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-3 justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoBack}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-all hover:cursor-pointer"
                >
                  <FaArrowLeft /> Volver
                </motion.button>

                {session ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToHome}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:cursor-pointer"
                  >
                    <FaHome /> Inicio
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToLogin}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:cursor-pointer"
                  >
                    <FaSignInAlt /> Ingresar
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}