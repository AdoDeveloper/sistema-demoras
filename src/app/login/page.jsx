"use client";
import Footer from "../../components/Footer";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 relative">
      <div className="flex items-center justify-center min-h-screen">
        <LoginForm />
      </div>
      <div className="fixed bottom-0 left-0 right-0">
        <Footer />
      </div>
    </div>
  );
}
