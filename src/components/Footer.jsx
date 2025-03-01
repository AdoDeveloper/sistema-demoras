"use client";

export default function Footer() {
    return (
      <footer className="fixed bottom-0 left-0 right-0 bg-white py-3 shadow-inner">
        <div className="max-w-7xl mx-auto text-center text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} Todos los derechos reservados.
        </div>
      </footer>
    );
}