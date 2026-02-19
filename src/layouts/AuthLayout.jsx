import React, { useState } from "react";
import { Card } from "../components/Card";
import { useAppStore } from "../app/store";
import { useNavigate } from "react-router-dom";

const MOCK_CLIENT_USER = {
  id: "client-001",
  name: "Juan Pérez",
  email: "juan.perez@ejemplo.com",
  phone: "+52 555 123 4567",
  role: "cliente",
  avatar: null,
};

const MOCK_THERAPIST_USER = {
  id: "therapist-001",
  name: "Dra. María García",
  email: "maria.garcia@ejemplo.com",
  phone: "+52 555 987 6543",
  role: "terapeuta",
  avatar: null,
};

const DEMO_CLIENT_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGllbnQtMDAxIiwiZW1haWwiOiJqdWFuLnBlcmV6QGVqZW1wbG8uY29tIiwicm9sZSI6ImNsaWVudGUiLCJpYXQiOjE3MDY3NjAwMDAsImV4cCI6MTczODI5NjAwMH0.demo";

const DEMO_THERAPIST_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0aGVyYXBpc3QtMDAxIiwiZW1haWwiOiJtYXJpYS5nYXJjaWFAZWplbXBsby5jb20iLCJyb2xlIjoidGVyYXBldXRhIiwiaWF0IjoxNzA2NzYwMDAwLCJleHAiOjE3MzgyOTYwMDB9.demo";

export const AuthLayout = ({
  children,
  userType: initialType = "profesional",
}) => {
  const [userType, setUserType] = useState(initialType);
  const setUser = useAppStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleDemoClientLogin = () => {
    localStorage.setItem("dhara-token", DEMO_CLIENT_JWT);
    localStorage.setItem("dhara-user", JSON.stringify(MOCK_CLIENT_USER));
    setUser(MOCK_CLIENT_USER);
    navigate("/app/cliente/home");
  };

  const handleDemoTherapistLogin = () => {
    localStorage.setItem("dhara-token", DEMO_THERAPIST_JWT);
    localStorage.setItem("dhara-user", JSON.stringify(MOCK_THERAPIST_USER));
    setUser(MOCK_THERAPIST_USER);
    navigate("/app/dashboard-profesional");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand to-sage/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sage rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-deep">
            Dhara Dimensión Humana
          </h1>
          <p className="text-sage mt-2">
            {userType === "profesional"
              ? "Panel Profesional"
              : "Portal Cliente"}
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-sand/30 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setUserType("profesional")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                userType === "profesional"
                  ? "bg-sage text-white"
                  : "text-deep/70 hover:text-deep"
              }`}
            >
              Profesional
            </button>
            <button
              type="button"
              onClick={() => setUserType("cliente")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                userType === "cliente"
                  ? "bg-sage text-white"
                  : "text-deep/70 hover:text-deep"
              }`}
            >
              Cliente
            </button>
          </div>
        </div>

        {userType === "cliente" ? (
          <div className="mb-4 p-3 bg-sage/10 rounded-lg">
            <p className="text-sm text-center text-deep mb-3">
              ¿Quieres probar el portal cliente?
            </p>
            <button
              type="button"
              onClick={handleDemoClientLogin}
              className="w-full py-2 px-4 bg-sage text-white rounded-lg font-medium hover:bg-sage/90 transition-colors text-sm"
            >
              Entrar como Cliente Demo
            </button>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-center text-deep mb-3">
              ¿Quieres probar el panel de terapeuta?
            </p>
            <button
              type="button"
              onClick={handleDemoTherapistLogin}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Entrar como Terapeuta Demo
            </button>
          </div>
        )}

        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { userType })
            : child,
        )}
      </Card>
    </div>
  );
};
