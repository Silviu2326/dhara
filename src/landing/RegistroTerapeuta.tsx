import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Briefcase,
  Shield,
  Sparkles,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  Upload,
  X,
  GraduationCap,
  ScanLine,
  ChevronDown,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import logoImage from "./WhatsApp_Image_2025-08-15_at_13.59.22__1_-removebg-preview.png";

interface Especialidad {
  id: number;
  nombre: string;
  descripcion_corta: string;
}

interface RegistroTerapeutaProps {
  // Props if needed
}

const STEPS = {
  PERSONAL: 1,
  PROFESIONAL: 2,
  PAGO: 3,
  CONFIRMACION: 4,
};

const RegistroTerapeuta: React.FC<RegistroTerapeutaProps> = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEPS.PERSONAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Especialidades cargadas desde backend
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [cargandoEspecialidades, setCargandoEspecialidades] = useState(true);
  const [busquedaEspecialidad, setBusquedaEspecialidad] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Datos personales
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Datos profesionales
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] =
    useState<string[]>([]);
  const [titulacion, setTitulacion] = useState("");
  const [numeroColegiado, setNumeroColegiado] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [sobreMi, setSobreMi] = useState("");

  // Documentos de titulación
  const [documentosTitulacion, setDocumentosTitulacion] = useState<File[]>([]);
  const [analisisAI, setAnalisisAI] = useState<any[]>([]);
  const [analizandoDocumento, setAnalizandoDocumento] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Términos
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);

  // Popup de verificación de documentos
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "success" | "warning" | null
  >(null);

  // Cargar especialidades desde el backend
  useEffect(() => {
    const cargarEspecialidades = async () => {
      try {
        const baseUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${baseUrl}/terapias`);
        const data = await response.json();
        if (data.success) {
          setEspecialidades(data.data.especialidades);
        }
      } catch (err) {
        console.error("Error cargando especialidades:", err);
      } finally {
        setCargandoEspecialidades(false);
      }
    };
    cargarEspecialidades();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrar especialidades según búsqueda y excluir las ya seleccionadas
  const especialidadesFiltradas = especialidades.filter(
    (esp) =>
      esp.nombre.toLowerCase().includes(busquedaEspecialidad.toLowerCase()) &&
      !especialidadesSeleccionadas.includes(esp.nombre),
  );

  const handleSeleccionarEspecialidad = (nombre: string) => {
    if (!especialidadesSeleccionadas.includes(nombre)) {
      setEspecialidadesSeleccionadas([...especialidadesSeleccionadas, nombre]);
    }
    setBusquedaEspecialidad("");
    setMostrarDropdown(false);
  };

  const handleEliminarEspecialidad = (nombre: string) => {
    setEspecialidadesSeleccionadas(
      especialidadesSeleccionadas.filter((esp) => esp !== nombre),
    );
  };

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const validateStep1 = () => {
    if (!nombre.trim() || !apellidos.trim()) {
      setError("Por favor, introduce tu nombre y apellidos");
      return false;
    }
    if (!validateEmail(email)) {
      setError("Por favor, introduce un correo electrónico válido");
      return false;
    }
    if (!telefono.trim()) {
      setError("Por favor, introduce tu número de teléfono");
      return false;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (especialidadesSeleccionadas.length === 0) {
      setError("Por favor, selecciona al menos una especialidad");
      return false;
    }
    if (!titulacion.trim()) {
      setError("Por favor, indica tu titulación");
      return false;
    }
    if (documentosTitulacion.length === 0) {
      setError("Por favor, sube al menos un documento de titulación");
      return false;
    }

    // Verificar que los documentos han sido analizados por Gemini
    if (analisisAI.length === 0) {
      setError("Los documentos están siendo analizados. Por favor, espera...");
      return false;
    }

    // Verificar que todos los documentos subidos tienen análisis
    if (analisisAI.length < documentosTitulacion.length) {
      setError(
        "Algunos documentos aún se están analizando. Por favor, espera...",
      );
      return false;
    }

    // Verificar si hay documentos que requieren revisión manual
    const documentosConProblemas = analisisAI.filter(
      (a) => a.aiAnalysis?.recomendacion === "revisar_manualmente",
    );

    if (documentosConProblemas.length > 0) {
      setError(
        "Algunos documentos requieren revisión manual. Por favor, contacta con soporte.",
      );
      return false;
    }

    if (!sobreMi.trim() || sobreMi.length < 50) {
      setError(
        "Por favor, escribe una descripción sobre ti (mínimo 50 caracteres)",
      );
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!aceptaTerminos || !aceptaPrivacidad) {
      setError(
        "Debes aceptar los términos y condiciones y la política de privacidad",
      );
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === STEPS.PERSONAL && validateStep1()) {
      setCurrentStep(STEPS.PROFESIONAL);
    } else if (currentStep === STEPS.PROFESIONAL && validateStep2()) {
      const documentosRevisar = analisisAI.filter(
        (a) => a.aiAnalysis?.recomendacion === "revisar_manualmente",
      );

      if (documentosRevisar.length > 0) {
        setVerificationStatus("warning");
      } else {
        setVerificationStatus("success");
      }
      setShowVerificationPopup(true);
    }
  };

  const handleConfirmVerification = () => {
    setShowVerificationPopup(false);
    setCurrentStep(STEPS.PAGO);
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === STEPS.PROFESIONAL) {
      setCurrentStep(STEPS.PERSONAL);
    } else if (currentStep === STEPS.PAGO) {
      setCurrentStep(STEPS.PROFESIONAL);
    }
  };

  // Manejar subida de documentos de titulación
  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor, sube solo imágenes (JPEG, PNG, GIF)");
      return;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 10MB.");
      return;
    }

    // Crear preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrls((prev) => [...prev, previewUrl]);
    setDocumentosTitulacion((prev) => [...prev, file]);
    setError(null);

    // Analizar con AI
    await analizarDocumento(file);
  };

  // Analizar documento con Gemini
  const analizarDocumento = async (file: File) => {
    setAnalizandoDocumento(true);

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("nombre", `${nombre} ${apellidos}`);
      formData.append("especialidad", especialidadesSeleccionadas.join(", "));
      formData.append("titulacion", titulacion);

      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(
        `${baseUrl}/verification/analizar-titulacion`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (data.success) {
        setAnalisisAI((prev) => [...prev, data.data]);

        // Si el análisis indica que no es válido, mostrar advertencia
        if (
          data.data.aiAnalysis &&
          data.data.aiAnalysis.esTitulacionValida === false
        ) {
          setError(
            "El documento no parece ser una titulación válida. Por favor, verifica que hayas subido el documento correcto.",
          );
        }
      } else {
        console.error("Error en análisis:", data.message);
      }
    } catch (err) {
      console.error("Error analizando documento:", err);
    } finally {
      setAnalizandoDocumento(false);
    }
  };

  // Eliminar documento
  const removeDocument = (index: number) => {
    setDocumentosTitulacion((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setAnalisisAI((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Crear usuario en Supabase Auth
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error("El servicio de autenticación no está disponible");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: `${nombre} ${apellidos}`,
            telefono,
            tipo_usuario: "terapeuta",
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Error al crear el usuario");
      }

      // 2. Crear perfil de terapeuta en la base de datos
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          nombre,
          apellidos,
          email,
          telefono,
          tipo_usuario: "terapeuta",
          especialidades: especialidadesSeleccionadas,
          titulacion,
          numero_colegiado: numeroColegiado || null,
          experiencia_anos: experiencia ? parseInt(experiencia) : null,
          sobre_mi: sobreMi,
          estado_verificacion: "pendiente",
          plan_suscripcion: "avanzado",
          trial_activo: true,
          trial_fin: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          documentos_titulacion: analisisAI.map((a) => ({
            temp_id: a.tempId,
            original_name: a.originalName,
            analysis: a.aiAnalysis,
          })),
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // No lanzamos error, el usuario puede completar el perfil después
      }

      // 3. Procesar documentos de titulación temporales
      if (analisisAI.length > 0) {
        try {
          const tempIds = analisisAI.map((a) => a.tempId).filter(Boolean);
          if (tempIds.length > 0) {
            await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/terapeutas/procesar-documentos`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tempIds,
                  userId: authData.user.id,
                  email,
                }),
              },
            );
          }
        } catch (docError) {
          console.error("Error procesando documentos:", docError);
          // No bloqueamos el registro por error en documentos
        }
      }

      // 4. Crear suscripción en Stripe con trial de 3 meses
      // Esto se hace a través del backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/terapeutas/suscribir`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            nombre: `${nombre} ${apellidos}`,
            userId: authData.user.id,
            trialDays: 90, // 3 meses
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating subscription:", errorData);
        // Mostrar error pero permitir continuar
        setError(
          "No se pudo iniciar el proceso de pago. Puedes configurarlo más tarde desde tu perfil.",
        );
        setTimeout(() => {
          setCurrentStep(STEPS.CONFIRMACION);
        }, 3000);
        return;
      }

      const data = await response.json();

      if (data.success && data.data?.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.data.url;
        return;
      }

      // Si no hay redirección a Stripe, mostrar confirmación
      setCurrentStep(STEPS.CONFIRMACION);
    } catch (err: any) {
      console.error("Registration error:", err);

      let errorMessage =
        err.message ||
        "Error al procesar el registro. Por favor, inténtalo de nuevo.";

      if (err.message?.includes("rate limit")) {
        errorMessage =
          "Has hecho demasiados intentos de registro. Por favor, espera 1 hora e intenta de nuevo con un email diferente.";
      } else if (
        err.message?.includes("email") &&
        err.message?.includes("invalid")
      ) {
        errorMessage =
          "El email proporcionado no es válido. Por favor, usa un email real.";
      } else if (err.message?.includes("already been registered")) {
        errorMessage =
          "Este email ya está registrado. Por favor, inicia sesión o usa otro email.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-2">
        {[STEPS.PERSONAL, STEPS.PROFESIONAL, STEPS.PAGO].map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                currentStep >= step
                  ? "bg-[#8CA48F] text-white"
                  : "bg-stone-200 text-stone-500"
              }`}
            >
              {step}
            </div>
            {index < 2 && (
              <div
                className={`w-16 h-1 transition-colors ${
                  currentStep > step ? "bg-[#8CA48F]" : "bg-stone-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Nombre *
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              size={20}
            />
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
              placeholder="Tu nombre"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Apellidos *
          </label>
          <input
            type="text"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
            placeholder="Tus apellidos"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Correo electrónico *
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            size={20}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Teléfono *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">
            +34
          </span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
            placeholder="612 345 678"
            maxLength={9}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Contraseña *
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            size={20}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Confirmar contraseña *
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            size={20}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
            placeholder="Repite tu contraseña"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Especialidad principal *
        </label>
        <div className="relative" ref={dropdownRef}>
          <Briefcase
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 z-10"
            size={20}
          />
          <input
            type="text"
            value={busquedaEspecialidad}
            onChange={(e) => {
              setBusquedaEspecialidad(e.target.value);
              setMostrarDropdown(true);
            }}
            onFocus={() => setMostrarDropdown(true)}
            placeholder="Busca tu especialidad..."
            className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
          />
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 cursor-pointer"
            size={20}
            onClick={() => setMostrarDropdown(!mostrarDropdown)}
          />

          {mostrarDropdown && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {cargandoEspecialidades ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#8CA48F]" />
                  <span className="ml-2 text-sm text-stone-500">
                    Cargando especialidades...
                  </span>
                </div>
              ) : especialidadesFiltradas.length === 0 ? (
                <div className="px-4 py-3 text-sm text-stone-500">
                  No se encontraron más especialidades
                </div>
              ) : (
                especialidadesFiltradas.map((esp) => (
                  <button
                    key={esp.id}
                    type="button"
                    onClick={() => handleSeleccionarEspecialidad(esp.nombre)}
                    className="w-full px-4 py-3 text-left hover:bg-[#8CA48F]/10 transition-colors border-b border-stone-100 last:border-b-0"
                  >
                    <div className="font-medium text-stone-800">
                      {esp.nombre}
                    </div>
                    <div className="text-xs text-stone-500 line-clamp-1">
                      {esp.descripcion_corta}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Especialidades seleccionadas como chips */}
        {especialidadesSeleccionadas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {especialidadesSeleccionadas.map((esp) => (
              <span
                key={esp}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8CA48F]/20 text-[#8CA48F] rounded-full text-sm font-medium"
              >
                {esp}
                <button
                  type="button"
                  onClick={() => handleEliminarEspecialidad(esp)}
                  className="ml-1 hover:bg-[#8CA48F]/30 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {especialidadesSeleccionadas.length === 0 && (
          <p className="mt-1 text-xs text-stone-500">
            Puedes seleccionar varias especialidades
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Titulación / Formación *
        </label>
        <input
          type="text"
          value={titulacion}
          onChange={(e) => setTitulacion(e.target.value)}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
          placeholder="Ej: Diplomada en Naturopatía por la Universidad de..."
        />
      </div>

      {/* Subida de documentos de titulación */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} />
            Documento de titulación *
          </div>
        </label>

        {/* Área de subida */}
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleDocumentUpload}
            disabled={analizandoDocumento || documentosTitulacion.length >= 3}
            className="hidden"
            id="document-upload"
          />
          <label
            htmlFor="document-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              analizandoDocumento || documentosTitulacion.length >= 3
                ? "border-stone-300 bg-stone-100 cursor-not-allowed"
                : "border-[#8CA48F]/40 bg-[#8CA48F]/5 hover:bg-[#8CA48F]/10 hover:border-[#8CA48F]"
            }`}
          >
            {analizandoDocumento ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-[#8CA48F] animate-spin mb-2" />
                <span className="text-sm text-stone-600">
                  Analizando documento con AI...
                </span>
              </div>
            ) : documentosTitulacion.length >= 3 ? (
              <div className="flex flex-col items-center">
                <Check className="w-8 h-8 text-[#8CA48F] mb-2" />
                <span className="text-sm text-stone-600">
                  Máximo de documentos alcanzado
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-[#8CA48F] mb-2" />
                <span className="text-sm text-stone-600 font-medium">
                  Haz clic para subir tu titulación
                </span>
                <span className="text-xs text-stone-500 mt-1">
                  JPEG, PNG o GIF (máx. 10MB)
                </span>
              </div>
            )}
          </label>
        </div>

        {/* Previews de documentos subidos */}
        {previewUrls.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-stone-700">
              Documentos subidos:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-stone-200">
                    <img
                      src={url}
                      alt={`Documento ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => removeDocument(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <X size={14} />
                  </button>

                  {/* Indicador de análisis AI */}
                  {analisisAI[index] && (
                    <div
                      className={`absolute bottom-2 left-2 right-2 px-2 py-1 rounded text-xs font-medium text-center ${
                        analisisAI[index].aiAnalysis?.esTitulacionValida ===
                        true
                          ? "bg-green-500/90 text-white"
                          : analisisAI[index].aiAnalysis?.esTitulacionValida ===
                              false
                            ? "bg-red-500/90 text-white"
                            : "bg-amber-500/90 text-white"
                      }`}
                    >
                      {analisisAI[index].aiAnalysis?.esTitulacionValida === true
                        ? "✓ Válido"
                        : analisisAI[index].aiAnalysis?.esTitulacionValida ===
                            false
                          ? "✗ Revisar"
                          : "⏳ Analizando..."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultado del análisis AI */}
        {analisisAI.length > 0 &&
          analisisAI[analisisAI.length - 1]?.aiAnalysis?.analizadoPorAI && (
            <div
              className={`mt-4 p-4 rounded-xl border ${
                analisisAI[analisisAI.length - 1].aiAnalysis.esTitulacionValida
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <ScanLine
                  className={`flex-shrink-0 mt-0.5 ${
                    analisisAI[analisisAI.length - 1].aiAnalysis
                      .esTitulacionValida
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                  size={20}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      analisisAI[analisisAI.length - 1].aiAnalysis
                        .esTitulacionValida
                        ? "text-green-800"
                        : "text-amber-800"
                    }`}
                  >
                    Análisis AI:{" "}
                    {analisisAI[analisisAI.length - 1].aiAnalysis
                      .esTitulacionValida
                      ? "Documento válido detectado"
                      : "Revisión necesaria"}
                  </p>
                  {analisisAI[analisisAI.length - 1].aiAnalysis
                    .observaciones && (
                    <p className="text-xs text-stone-600 mt-1">
                      {
                        analisisAI[analisisAI.length - 1].aiAnalysis
                          .observaciones
                      }
                    </p>
                  )}
                  {analisisAI[analisisAI.length - 1].aiAnalysis
                    .nombreTitulo && (
                    <p className="text-xs text-stone-600 mt-1">
                      <strong>Título detectado:</strong>{" "}
                      {
                        analisisAI[analisisAI.length - 1].aiAnalysis
                          .nombreTitulo
                      }
                    </p>
                  )}
                  {analisisAI[analisisAI.length - 1].aiAnalysis
                    .entidadEmisora && (
                    <p className="text-xs text-stone-600 mt-1">
                      <strong>Entidad:</strong>{" "}
                      {
                        analisisAI[analisisAI.length - 1].aiAnalysis
                          .entidadEmisora
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        <p className="text-xs text-stone-500 mt-2">
          Sube una foto clara de tu título, diploma o certificado. Nuestro
          sistema AI verificará que sea un documento válido.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Número de colegiado (opcional)
        </label>
        <input
          type="text"
          value={numeroColegiado}
          onChange={(e) => setNumeroColegiado(e.target.value)}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all"
          placeholder="Si aplica a tu profesión"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Años de experiencia (opcional)
        </label>
        <select
          value={experiencia}
          onChange={(e) => setExperiencia(e.target.value)}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all appearance-none"
        >
          <option value="">Selecciona...</option>
          <option value="0-1">Menos de 1 año</option>
          <option value="1-3">1-3 años</option>
          <option value="3-5">3-5 años</option>
          <option value="5-10">5-10 años</option>
          <option value="10+">Más de 10 años</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Cuéntanos sobre ti y tu práctica *
        </label>
        <textarea
          value={sobreMi}
          onChange={(e) => setSobreMi(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8CA48F]/50 focus:border-[#8CA48F] outline-none transition-all resize-none"
          placeholder="Describe tu enfoque terapéutico, tu filosofía de trabajo, qué te motiva... (mínimo 50 caracteres)"
        />
        <p className="text-xs text-stone-500 mt-1">
          {sobreMi.length} / 50 caracteres mínimo
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Resumen del plan */}
      <div className="bg-gradient-to-br from-[#8CA48F]/10 to-[#8CA48F]/5 p-6 rounded-2xl border border-[#8CA48F]/20">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-[#8CA48F]" size={24} />
          <h3 className="text-lg font-bold text-stone-800">
            Plan Avanzado - Oferta Founder
          </h3>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold text-[#8CA48F]">0€</span>
          <span className="text-stone-600">/mes durante 3 meses</span>
        </div>

        <div className="bg-white/60 p-4 rounded-xl mb-4">
          <p className="text-sm text-stone-600">
            Después del periodo de prueba:{" "}
            <span className="font-bold text-stone-800">38,99€/mes</span>
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Sin permanencia. Cancela cuando quieras.
          </p>
        </div>

        <ul className="space-y-2">
          {[
            "Agenda digital con disponibilidad personalizada",
            "Gestión automática de citas y reservas",
            "Creación ilimitada de servicios y packs",
            "Base de datos de clientes y documentos",
            "Chat privado y seguro (adiós WhatsApp)",
            "Reseñas verificadas de tus clientes",
            "Visibilidad en el mapa nacional de bienestar",
          ].map((feature, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-stone-600"
            >
              <Check size={16} className="text-[#8CA48F] flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Información de pago */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <CreditCard
            className="text-blue-500 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Pago seguro con Stripe
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Te pediremos los datos de tu tarjeta para verificar tu cuenta.
              <strong>
                {" "}
                No se realizará ningún cargo durante los primeros 3 meses.
              </strong>
              Pasado este periodo, se cargarán 38,99€ mensuales automáticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Términos */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-stone-300 text-[#8CA48F] focus:ring-[#8CA48F] cursor-pointer"
          />
          <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
            Acepto los{" "}
            <button
              type="button"
              className="text-[#8CA48F] underline hover:no-underline"
            >
              Términos y Condiciones
            </button>{" "}
            de Dhara *
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={aceptaPrivacidad}
            onChange={(e) => setAceptaPrivacidad(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-stone-300 text-[#8CA48F] focus:ring-[#8CA48F] cursor-pointer"
          />
          <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
            He leído y acepto la{" "}
            <button
              type="button"
              className="text-[#8CA48F] underline hover:no-underline"
            >
              Política de Privacidad
            </button>{" "}
            *
          </span>
        </label>
      </div>
    </div>
  );

  const renderConfirmacion = () => (
    <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6">
        <Check size={40} className="text-[#166534]" />
      </div>
      <h2 className="text-2xl font-bold text-stone-800 mb-4">
        ¡Bienvenido a Dhara!
      </h2>
      <p className="text-stone-600 mb-6">
        Tu cuenta ha sido creada correctamente. Te hemos enviado un email de
        confirmación a <strong>{email}</strong>.
      </p>
      <div className="bg-[#8CA48F]/10 p-6 rounded-2xl mb-6">
        <p className="text-sm text-stone-700">
          <strong>¿Y ahora qué?</strong>
          <br />
          1. Verifica tu email haciendo clic en el enlace que te hemos enviado
          <br />
          2. Completa la configuración de pago para activar tus 3 meses gratis
          <br />
          3. ¡Empieza a configurar tu perfil profesional!
        </p>
      </div>
      <button
        onClick={() => navigate("/login")}
        className="px-8 py-3 bg-[#8CA48F] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
      >
        Ir a iniciar sesión
      </button>
    </div>
  );

  if (currentStep === STEPS.CONFIRMACION) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3EEE9] via-[#F5F1EC] to-[#F8F5F2] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            {renderConfirmacion()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EEE9] via-[#F5F1EC] to-[#F8F5F2] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={logoImage}
            alt="Dhara"
            className="h-20 w-auto mx-auto mb-4 cursor-pointer"
            onClick={() => navigate("/")}
          />
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
            Registro de Terapeuta
          </h1>
          <p className="text-stone-600 mt-2">
            Únete a Dhara y disfruta de{" "}
            <span className="text-[#8CA48F] font-semibold">3 meses gratis</span>
          </p>
        </div>

        {/* Progress */}
        {renderProgressBar()}

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Step Header */}
          <div className="bg-gradient-to-r from-[#8CA48F] to-[#6b856e] px-8 py-4">
            <h2 className="text-white font-semibold text-lg">
              {currentStep === STEPS.PERSONAL && "Datos Personales"}
              {currentStep === STEPS.PROFESIONAL && "Información Profesional"}
              {currentStep === STEPS.PAGO && "Plan y Pago"}
            </h2>
          </div>

          <div className="p-8">
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle
                  className="text-red-500 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step Content */}
            {currentStep === STEPS.PERSONAL && renderStep1()}
            {currentStep === STEPS.PROFESIONAL && renderStep2()}
            {currentStep === STEPS.PAGO && renderStep3()}

            {/* Popup de Verificación de Documentos */}
            {showVerificationPopup && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
                  <div className="text-center">
                    {verificationStatus === "success" ? (
                      <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 mb-2">
                          ¡Documentos Verificados!
                        </h3>
                        <p className="text-stone-600 mb-2">
                          Tu documento de titulación ha sido verificado
                          correctamente por nuestro sistema de IA.
                        </p>
                        <p className="text-sm text-stone-500 mb-6">
                          Puedes continuar con el proceso de registro.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle size={32} className="text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-800 mb-2">
                          Verificación en Proceso
                        </h3>
                        <p className="text-stone-600 mb-2">
                          Tu documento ha sido recibido y será revisado
                          manualmente por nuestro equipo.
                        </p>
                        <p className="text-sm text-stone-500 mb-6">
                          Puedes continuar con el registro. Te notificaremos
                          cuando tu verificación esté completa.
                        </p>
                      </>
                    )}
                    <button
                      onClick={handleConfirmVerification}
                      className="w-full px-6 py-3 bg-[#8CA48F] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > STEPS.PERSONAL && (
                <button
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-6 py-3 border-2 border-stone-200 text-stone-600 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all duration-200 flex items-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Atrás
                </button>
              )}

              {currentStep < STEPS.PAGO ? (
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-[#8CA48F] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#8CA48F] to-[#6b856e] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Completar registro
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#8CA48F]" />
            <span>Pago seguro SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#8CA48F]" />
            <span>3 meses sin cargo</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={16} className="text-[#8CA48F]" />
            <span>Sin permanencia</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 mt-6">
          ¿Ya tienes una cuenta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#8CA48F] hover:underline"
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegistroTerapeuta;
