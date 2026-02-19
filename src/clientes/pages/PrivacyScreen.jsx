import React, { useState, useEffect } from "react";
import {
  IoShieldCheckmarkOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoTrashOutline,
  IoDocumentTextOutline,
  IoLockClosedOutline,
  IoChevronForward,
  IoRefresh,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoWarningOutline,
  IoTimeOutline,
} from "react-icons/io5";

const MOCK_PRIVACY_SETTINGS = {
  profileVisibility: "terapeutas",
  showOnlineStatus: true,
  showActivity: true,
  allowMessages: true,
  showProgress: true,
  shareWithInsurance: false,
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
};

const MOCK_ACTIVITY_LOG = [
  {
    id: 1,
    action: "Actualización de perfil",
    details: "Cambiaste tu información de contacto",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    ip: "192.168.1.xxx",
  },
  {
    id: 2,
    action: "Inicio de sesión",
    details: "Nuevo dispositivo: Chrome en Windows",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    ip: "192.168.1.xxx",
  },
  {
    id: 3,
    action: "Cambio de privacidad",
    details: "Visibilidad del perfil cambiada a 'Solo terapeutas'",
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    ip: "192.168.1.xxx",
  },
  {
    id: 4,
    action: "Descarga de datos",
    details: "Solicitaste una copia de tus datos personales",
    date: new Date(Date.now() - 86400000 * 15).toISOString(),
    ip: "192.168.1.xxx",
  },
];

const PrivacyScreen = ({ user }) => {
  const [settings, setSettings] = useState(MOCK_PRIVACY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setActivityLog(MOCK_ACTIVITY_LOG);
    } catch (error) {
      console.error("Error loading privacy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    await saveSettings();
  };

  const handleProfileVisibilityChange = async (value) => {
    setSettings((prev) => ({ ...prev, profileVisibility: value }));
    await saveSettings();
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccessMessage("Configuración guardada");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const dataStr = JSON.stringify(
      {
        user: user || { name: "Usuario", email: "email@ejemplo.com" },
        settings: settings,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mis_datos_dharaterapeutas.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportModal(false);
    setSuccessMessage("Datos exportados correctamente");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") return;

    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    alert("Tu cuenta ha sido eliminada. Serás redirigido...");
    setShowDeleteModal(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVisibilityLabel = (value) => {
    switch (value) {
      case "public":
        return "Público";
      case "terapeutas":
        return "Solo terapeutas";
      case "private":
        return "Solo yo";
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">Cargando configuración de privacidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-deep">
            Privacidad y Seguridad
          </h1>
          <p className="text-muted mt-1">
            Controla quién puede ver tu información
          </p>
        </div>
        {successMessage && (
          <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg">
            <IoCheckmarkCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}
      </div>

      {saving && (
        <div className="mb-4 flex items-center gap-2 bg-sage/10 text-sage px-4 py-2 rounded-lg">
          <div className="animate-spin w-4 h-4 border-2 border-sage border-t-transparent rounded-full"></div>
          <span className="text-sm">Guardando cambios...</span>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
              <IoEyeOutline className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-deep">
                Visibilidad del Perfil
              </h2>
              <p className="text-sm text-muted">
                Controla quién puede ver tu información
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-deep mb-2">
                ¿Quién puede ver tu perfil?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {["public", "terapeutas", "private"].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleProfileVisibilityChange(value)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      settings.profileVisibility === value
                        ? "border-sage bg-sage/5"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <p className="font-medium text-deep">
                      {getVisibilityLabel(value)}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {value === "public" && "Cualquier persona"}
                      {value === "terapeutas" && "Solo profesionales"}
                      {value === "private" && "Solo tú"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-4">
              <ToggleSetting
                icon={IoEyeOutline}
                title="Mostrar estado en línea"
                description="Permite que otros vean cuándo estás conectado"
                enabled={settings.showOnlineStatus}
                onToggle={() => handleToggle("showOnlineStatus")}
              />
              <ToggleSetting
                icon={IoTimeOutline}
                title="Mostrar actividad"
                description="Permite ver tu actividad reciente en la plataforma"
                enabled={settings.showActivity}
                onToggle={() => handleToggle("showActivity")}
              />
              <ToggleSetting
                icon={IoChevronForward}
                title="Mostrar progreso del tratamiento"
                description="Permite a tus terapeutas ver tu progreso"
                enabled={settings.showProgress}
                onToggle={() => handleToggle("showProgress")}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <IoShieldCheckmarkOutline className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-deep">Seguridad</h2>
              <p className="text-sm text-muted">
                Configura las opciones de seguridad
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              icon={IoLockClosedOutline}
              title="Cambiar contraseña"
              description="Último cambio: hace 30 días"
              isLink
              onClick={() => alert("Redirigiendo a cambio de contraseña...")}
            />
            <ToggleSetting
              icon={IoChevronForward}
              title="Autenticación de dos factores"
              description="Añade una capa extra de seguridad"
              isLink
              onClick={() => alert("Redirigiendo a configuración 2FA...")}
            />
            <ToggleSetting
              icon={IoEyeOutline}
              title="Sesiones activas"
              description="Gestiona los dispositivos conectados"
              isLink
              onClick={() => alert("Redirigiendo a sesiones...")}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <IoDocumentTextOutline className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-deep">Notificaciones</h2>
              <p className="text-sm text-muted">
                Configura cómo recibes notificaciones
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              icon={IoDocumentTextOutline}
              title="Notificaciones por correo"
              description="Recibe actualizaciones por email"
              enabled={settings.emailNotifications}
              onToggle={() => handleToggle("emailNotifications")}
            />
            <ToggleSetting
              icon={IoDocumentTextOutline}
              title="Notificaciones push"
              description="Recibe notificaciones en tu dispositivo"
              enabled={settings.pushNotifications}
              onToggle={() => handleToggle("pushNotifications")}
            />
            <ToggleSetting
              icon={IoDocumentTextOutline}
              title="Notificaciones SMS"
              description="Recibe alertas por mensaje de texto"
              enabled={settings.smsNotifications}
              onToggle={() => handleToggle("smsNotifications")}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <IoTimeOutline className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-deep">
                Historial de Actividad
              </h2>
              <p className="text-sm text-muted">
                Revisa las acciones realizadas en tu cuenta
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {activityLog.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-deep">{log.action}</p>
                  <p className="text-xs text-muted mt-0.5">{log.details}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-muted">{formatDate(log.date)}</p>
                  <p className="text-xs text-muted mt-0.5">{log.ip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <IoWarningOutline className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-deep">Danger Zone</h2>
              <p className="text-sm text-muted">Acciones irreversibles</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowExportModal(true)}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <IoDocumentTextOutline className="w-5 h-5 text-muted" />
                <div className="text-left">
                  <p className="text-sm font-medium text-deep">
                    Exportar mis datos
                  </p>
                  <p className="text-xs text-muted">
                    Descarga una copia de todos tus datos
                  </p>
                </div>
              </div>
              <IoChevronForward className="w-5 h-5 text-muted" />
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <IoTrashOutline className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-600">
                    Eliminar mi cuenta
                  </p>
                  <p className="text-xs text-muted">
                    Borra todos tus datos de forma permanente
                  </p>
                </div>
              </div>
              <IoChevronForward className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <IoDocumentTextOutline className="w-5 h-5 text-muted" />
            <h2 className="text-lg font-bold text-deep">
              Política de Privacidad
            </h2>
          </div>
          <p className="text-sm text-muted mb-4">
            Dharaterapeutas se compromete a proteger tu privacidad. Lee nuestra
            política completa para entender cómo manejamos tus datos personales.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              className="text-sm text-sage hover:underline font-medium"
            >
              Ver Política de Privacidad
            </a>
            <span className="text-muted">•</span>
            <a
              href="#"
              className="text-sm text-sage hover:underline font-medium"
            >
              Términos y Condiciones
            </a>
            <span className="text-muted">•</span>
            <a
              href="#"
              className="text-sm text-sage hover:underline font-medium"
            >
              Política de Cookies
            </a>
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sand rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h3 className="text-lg font-bold text-deep">Exportar Datos</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-lg hover:bg-sand transition-colors"
              >
                <IoChevronForward className="w-5 h-5 rotate-90 text-deep" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 text-amber-600">
                <IoAlertCircle className="w-6 h-6" />
                <p className="font-medium">Información importante</p>
              </div>
              <p className="text-sm text-muted mb-6">
                Se exportarán los siguientes datos: información del perfil,
                configuraciones de privacidad, historial de actividad y datos de
                tratamiento. El archivo se descargará en formato JSON.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg font-medium text-deep hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExportData}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-sage text-white px-4 py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <IoDocumentTextOutline className="w-4 h-4" />
                      Exportar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sand rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h3 className="text-lg font-bold text-deep">Eliminar Cuenta</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="p-2 rounded-lg hover:bg-sand transition-colors"
              >
                <IoChevronForward className="w-5 h-5 rotate-90 text-deep" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <IoWarningOutline className="w-6 h-6" />
                <p className="font-medium">
                  ¡Atención! Esta acción es irreversible
                </p>
              </div>
              <p className="text-sm text-muted mb-4">
                Se eliminarán permanentemente todos tus datos, incluyendo:
              </p>
              <ul className="text-sm text-muted mb-4 space-y-1 list-disc list-inside">
                <li>Tu perfil y datos personales</li>
                <li>Historial de citas y tratamientos</li>
                <li>Documentos y archivos</li>
                <li>Mensajes y conversaciones</li>
                <li>Reseñas realizadas</li>
              </ul>

              <div className="mb-6">
                <label className="block text-sm font-medium text-deep mb-2">
                  Escribe <strong>ELIMINAR</strong> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-deep focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg font-medium text-deep hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "ELIMINAR" || saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <IoTrashOutline className="w-4 h-4" />
                      Eliminar Cuenta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToggleSetting = ({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  isLink,
}) => (
  <div
    className={`flex items-center justify-between ${isLink ? "cursor-pointer" : ""}`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full ${enabled ? "bg-sage/10" : "bg-gray-100"} flex items-center justify-center`}
      >
        <Icon className={`w-4 h-4 ${enabled ? "text-sage" : "text-muted"}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-deep">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </div>
    {isLink ? (
      <button
        onClick={onToggle}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <IoChevronForward className="w-5 h-5 text-muted" />
      </button>
    ) : (
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          enabled ? "bg-sage" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            enabled ? "translate-x-7" : "translate-x-1"
          }`}
        ></span>
      </button>
    )}
  </div>
);

export default PrivacyScreen;
