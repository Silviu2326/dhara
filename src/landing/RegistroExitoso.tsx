import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2, AlertCircle, Calendar, Sparkles } from "lucide-react";
import logoImage from "./WhatsApp_Image_2025-08-15_at_13.59.22__1_-removebg-preview.png";

const RegistroExitoso: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verificando tu registro...");

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage(
        "No se encontró la sesión de pago. Por favor, contacta con soporte.",
      );
      return;
    }

    // Verificar el estado del registro con el backend
    const verifyRegistration = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "https://dharaback-production.up.railway.app/api"}/terapeutas/verificar-registro?session_id=${sessionId}`,
        );

        if (!response.ok) {
          throw new Error("Error al verificar el registro");
        }

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("¡Tu registro se ha completado correctamente!");
        } else {
          setStatus("error");
          setMessage(data.message || "Hubo un problema con tu registro.");
        }
      } catch (error) {
        console.error("Error verifying registration:", error);
        setStatus("error");
        setMessage(
          "Error al verificar tu registro. Por favor, contacta con soporte.",
        );
      }
    };

    verifyRegistration();
  }, [sessionId]);

  const getTrialEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EEE9] via-[#F5F1EC] to-[#F8F5F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logoImage}
            alt="Dhara"
            className="h-20 w-auto mx-auto mb-4 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {status === "loading" && (
            <div className="py-10">
              <Loader2
                size={48}
                className="text-[#8CA48F] mx-auto mb-6 animate-spin"
              />
              <h2 className="text-xl font-semibold text-stone-800 mb-2">
                Procesando tu registro...
              </h2>
              <p className="text-stone-600">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-[#166534]" />
              </div>

              <h2 className="text-2xl font-bold text-stone-800 mb-4">
                ¡Bienvenido a Dhara!
              </h2>

              <p className="text-stone-600 mb-6">
                Tu cuenta ha sido creada y tu suscripción está activa.
              </p>

              <div className="bg-gradient-to-br from-[#8CA48F]/10 to-[#8CA48F]/5 p-6 rounded-2xl border border-[#8CA48F]/20 mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="text-[#8CA48F]" size={24} />
                  <span className="font-semibold text-stone-800">
                    Plan Avanzado Activo
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-stone-600 mb-2">
                  <Calendar size={16} className="text-[#8CA48F]" />
                  <span>
                    Período de prueba: <strong>3 meses gratis</strong>
                  </span>
                </div>

                <p className="text-xs text-stone-500">
                  Tu período de prueba termina el{" "}
                  <strong>{getTrialEndDate()}</strong>. Después, se cargarán
                  38,99€ mensuales.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-stone-600">
                  Te hemos enviado un email con los detalles de tu cuenta.
                </p>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full px-6 py-3 bg-[#8CA48F] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                >
                  Iniciar sesión
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="w-full px-6 py-3 border-2 border-stone-200 text-stone-600 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all duration-200"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="py-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-stone-800 mb-4">
                Ha ocurrido un problema
              </h2>

              <p className="text-stone-600 mb-6">{message}</p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/registro-terapeuta")}
                  className="w-full px-6 py-3 bg-[#8CA48F] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                >
                  Intentar de nuevo
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="w-full px-6 py-3 border-2 border-stone-200 text-stone-600 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all duration-200"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistroExitoso;
