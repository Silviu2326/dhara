import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, ArrowRight, User, Briefcase } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import logoImage from "./WhatsApp_Image_2025-08-15_at_13.59.22__1_-removebg-preview.png";

interface UneteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserType = "professional" | "client" | null;

const problems = [
  "Gestionar mi agenda y citas",
  "Conseguir nuevos clientes",
  "Organizar mis documentos y notas",
  "Separar vida personal del trabajo",
  "Profesionalizar mi negocio",
  "Otro",
];

const UneteModal: React.FC<UneteModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>(null);
  const [mainProblem, setMainProblem] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [honeyPot, setHoneyPot] = useState(""); // Security: Honeypot for bots

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Security: Honeypot check
    if (honeyPot) {
      console.log("Bot detected");
      onClose();
      return;
    }

    // Validación de campos requeridos
    if (!name.trim()) {
      alert("Por favor, introduce tu nombre.");
      return;
    }

    if (!email || !userType) return;

    if (!validateEmail(email)) {
      alert("Por favor, introduce un correo electrónico válido.");
      return;
    }

    try {
      const leadData = {
        email,
        user_type: userType,
        created_at: new Date().toISOString(),
        name: name.trim() || null,
        main_problem: mainProblem || null,
      };

      let supabaseError = null;

      // Guardar en Supabase solo si está configurado
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from("leads").insert([leadData]);

        if (error) {
          console.error("Error inserting lead to Supabase:", error);
          supabaseError = error;
        }
      } else {
        console.log("Supabase not configured, skipping Supabase insert");
      }

      // Enviar al backend (siempre intentar esto)
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/leads`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leadData),
          },
        );

        if (!response.ok) {
          throw new Error("Backend error");
        }
      } catch (backendError) {
        console.log("Backend no disponible");
        // Si tanto Supabase como backend fallan, mostrar error
        if (supabaseError || !isSupabaseConfigured()) {
          alert(
            "Hubo un error al guardar tu información. Por favor inténtalo de nuevo.",
          );
          return;
        }
      }

      console.log("Submitted:", { email, userType, name, mainProblem });
      setIsSubmitted(true);

      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setName("");
        setEmail("");
        setMainProblem("");
        setUserType(null);
      }, 2000);
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Hubo un error inesperado. Por favor inténtalo de nuevo.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20 max-h-[90vh] overflow-y-auto">
        {/* Decorative Header Background */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-br transition-colors duration-500 ${
            userType === "client"
              ? "from-[#A2B2C2] to-[#8a9aa8]"
              : "from-[#8CA48F] to-[#6b856e]"
          }`}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -top-6 -right-6 w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-8 left-12 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full blur-lg"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 z-10 backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        <div className="relative px-5 pt-6 pb-8 md:px-8 md:pt-8 md:pb-10">
          {/* Logo Badge */}
          <div className="mx-auto w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 transform -translate-y-2 md:-translate-y-4">
            <img
              src={logoImage}
              alt="Dhara"
              className="w-16 h-16 md:w-20 md:h-20 object-contain"
            />
          </div>

          {!isSubmitted ? (
            <div className="text-center space-y-5 md:space-y-6">
              <div className="space-y-2 md:space-y-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide uppercase border ${
                    userType === "client"
                      ? "bg-blue-50 text-blue-800 border-blue-100"
                      : "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]"
                  }`}
                >
                  Oferta de Lanzamiento
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-stone-800 leading-tight">
                  Sé parte fundadora <br />
                  <span
                    className={`text-transparent bg-clip-text bg-gradient-to-r ${
                      userType === "client"
                        ? "from-[#A2B2C2] to-[#7a8a98]"
                        : "from-[#8CA48F] to-[#5d7a60]"
                    }`}
                  >
                    de Dhara
                  </span>
                </h3>
                <p className="text-stone-600 text-sm md:text-base">
                  {userType === "client"
                    ? "Encuentra bienestar antes que nadie."
                    : "Disfruta de 3 meses gratis del plan avanzado."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                {/* User Type Selection */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/registro-terapeuta");
                    }}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      userType === "professional"
                        ? "border-[#8CA48F] bg-[#8CA48F]/5 shadow-md scale-[1.02]"
                        : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <Briefcase
                      size={24}
                      className={
                        userType === "professional"
                          ? "text-[#8CA48F]"
                          : "text-stone-400"
                      }
                    />
                    <span
                      className={`text-xs md:text-sm font-semibold ${userType === "professional" ? "text-[#8CA48F]" : "text-stone-500"}`}
                    >
                      Soy Profesional
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("client")}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      userType === "client"
                        ? "border-[#A2B2C2] bg-[#A2B2C2]/5 shadow-md scale-[1.02]"
                        : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <User
                      size={24}
                      className={
                        userType === "client"
                          ? "text-[#A2B2C2]"
                          : "text-stone-400"
                      }
                    />
                    <span
                      className={`text-xs md:text-sm font-semibold ${userType === "client" ? "text-[#A2B2C2]" : "text-stone-500"}`}
                    >
                      Soy Cliente
                    </span>
                  </button>
                </div>

                <div
                  className={`transition-all duration-300 ${userType ? "opacity-100 translate-y-0" : "opacity-50 translate-y-2 pointer-events-none"}`}
                >
                  {/* Campo de nombre para profesionales y clientes */}
                  {userType && (
                    <div className="group relative mb-5 md:mb-6">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`h-5 w-5 text-stone-400 transition-colors ${userType === "client" ? "group-focus-within:text-[#A2B2C2]" : "group-focus-within:text-[#8CA48F]"}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Tu nombre completo"
                        className={`w-full pl-11 pr-4 py-3.5 md:py-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 outline-none transition-all placeholder:text-stone-400 text-stone-800 text-sm md:text-base ${userType === "client" ? "focus:ring-[#A2B2C2]/50 focus:border-[#A2B2C2]" : "focus:ring-[#8CA48F]/50 focus:border-[#8CA48F]"}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="group relative mb-5 md:mb-6">
                    {/* Security: Honeypot Hidden Field */}
                    <input
                      type="text"
                      name="website_url_check"
                      value={honeyPot}
                      onChange={(e) => setHoneyPot(e.target.value)}
                      style={{ display: "none" }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className={`h-5 w-5 text-stone-400 transition-colors ${
                          userType === "client"
                            ? "group-focus-within:text-[#A2B2C2]"
                            : "group-focus-within:text-[#8CA48F]"
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      disabled={!userType}
                      placeholder={
                        !userType
                          ? "Selecciona una opción arriba"
                          : userType === "client"
                            ? "nombre@ejemplo.com"
                            : "correo@profesional.com"
                      }
                      className={`w-full pl-11 pr-4 py-3.5 md:py-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 outline-none transition-all placeholder:text-stone-400 text-stone-800 text-sm md:text-base ${
                        userType === "client"
                          ? "focus:ring-[#A2B2C2]/50 focus:border-[#A2B2C2]"
                          : "focus:ring-[#8CA48F]/50 focus:border-[#8CA48F]"
                      }`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Campo: ¿Qué problema principal deseas que te solucione Dhara? - Solo para profesionales */}
                  {userType === "professional" && (
                    <div className="mb-5 md:mb-6">
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        ¿Qué problema principal deseas que te solucione Dhara?
                      </label>
                      <select
                        value={mainProblem}
                        onChange={(e) => setMainProblem(e.target.value)}
                        className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all text-stone-800 text-sm md:text-base"
                      >
                        <option value="">Selecciona una opción</option>
                        {problems.map((problem, index) => (
                          <option key={index} value={problem}>
                            {problem}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-stone-50 to-white p-4 md:p-5 rounded-2xl border border-stone-100 shadow-sm text-left mb-5 md:mb-6">
                    <p className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 md:mb-3 ml-1">
                      Beneficios {userType === "client" ? "Cliente" : "Founder"}
                    </p>
                    <ul className="space-y-2 md:space-y-3">
                      {(userType === "client"
                        ? [
                            "Encuentra terapeutas verificados",
                            "Reserva citas sin llamadas",
                            "Gestiona tu bienestar",
                          ]
                        : [
                            "Acceso anticipado a la plataforma",
                            "Beneficios exclusivos de por vida",
                          ]
                      ).map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start text-xs md:text-sm text-stone-600"
                        >
                          <div
                            className={`flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                              userType === "client"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-[#dcfce7] text-[#166534]"
                            }`}
                          >
                            <Check
                              size={10}
                              className="md:w-3 md:h-3"
                              strokeWidth={3}
                            />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={!userType || !email || !name.trim()}
                    className={`w-full py-3.5 md:py-4 text-white font-bold text-base md:text-lg rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 group ${
                      !userType || !email || !name.trim()
                        ? "bg-stone-300 cursor-not-allowed"
                        : userType === "client"
                          ? "bg-gradient-to-r from-[#A2B2C2] to-[#8a9aa8]"
                          : "bg-gradient-to-r from-[#8CA48F] to-[#759178]"
                    }`}
                  >
                    {userType === "client"
                      ? "Unirme como Cliente"
                      : "Unirme como Profesional"}
                    <ArrowRight
                      size={18}
                      className="md:w-5 md:h-5 group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  userType === "client"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-[#dcfce7] text-[#166534]"
                }`}
              >
                <Check size={32} className="md:w-10 md:h-10" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-stone-800 mb-2">
                ¡Estás dentro!
              </h3>
              <p className="text-sm md:text-base text-stone-600">
                Gracias por unirte a Dhara
                {userType === "client"
                  ? " como cliente"
                  : " como profesional"}. <br />
                Revisa tu correo pronto.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UneteModal;
