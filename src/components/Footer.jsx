"use client";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 fixed bottom-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-gray-600 text-sm">
          © {new Date().getFullYear()} Todos los derechos reservados.
        </p>
        <p className="text-gray-600 text-sm">
          Desarrollado por{" "}
          <a
            href="https://github.com/AdoDeveloper"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold hover:underline"
          >
            Adolfo Cortez
          </a>
        </p>
      </div>
    </footer>
  );
}
