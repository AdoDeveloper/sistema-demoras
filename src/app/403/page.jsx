// pages/403.jsx
import Head from "next/head";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css?family=Montserrat:500,700,900"
          rel="stylesheet"
        />
        <title>Error 403 - Prohibido</title>
      </Head>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center font-montserrat">
          <h1 className="text-4xl font-bold text-red-600 mb-4">ERROR 403</h1>
          <p className="text-lg text-gray-700 mb-8">
            No tienes permiso para acceder a esta página.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            Regresar
          </Link>
        </div>
      </div>
    </>
  );
}
