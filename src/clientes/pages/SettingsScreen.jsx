import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  IoNotificationsOutline,
  IoPersonOutline,
  IoLockClosedOutline,
  IoCardOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoChevronForward,
  IoMoonOutline,
  IoLanguageOutline,
  IoShieldCheckmarkOutline,
  IoColorPaletteOutline,
} from "react-icons/io5";

const SETTINGS_SECTIONS = [
  {
    title: "Cuenta",
    items: [
      {
        id: "profile",
        label: "Información Personal",
        icon: IoPersonOutline,
        description: "Actualiza tu nombre, email y datos de contacto",
        path: "/app/perfil",
      },
      {
        id: "notifications",
        label: "Preferencias de Notificaciones",
        icon: IoNotificationsOutline,
        description: "Configura cómo quieres recibir notificaciones",
        path: "/app/notificaciones",
      },
      {
        id: "privacy",
        label: "Privacidad y Seguridad",
        icon: IoLockClosedOutline,
        description: "Gestiona tu contraseña y opciones de privacidad",
        path: "/app/privacidad",
      },
    ],
  },
  {
    title: "Preferencias",
    items: [
      {
        id: "appearance",
        label: "Apariencia",
        icon: IoColorPaletteOutline,
        description: "Tema claro/oscuro y personalización",
      },
      {
        id: "language",
        label: "Idioma",
        icon: IoLanguageOutline,
        description: "Español (México)",
      },
    ],
  },
  {
    title: "Pagos",
    items: [
      {
        id: "payment-methods",
        label: "Métodos de Pago",
        icon: IoCardOutline,
        description: "Gestiona tus tarjetas y métodos de pago",
        path: "/app/pagos",
      },
    ],
  },
  {
    title: "Soporte",
    items: [
      {
        id: "help",
        label: "Centro de Ayuda",
        icon: IoHelpCircleOutline,
        description: "Preguntas frecuentes y soporte técnico",
        path: "/app/ayuda",
      },
      {
        id: "legal",
        label: "Términos y Privacidad",
        icon: IoShieldCheckmarkOutline,
        description: "Términos de servicio y política de privacidad",
      },
    ],
  },
];

const SettingsScreen = ({ user }) => {
  const [settings, setSettings] = useState({
    darkMode: false,
    language: "es",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  const handleToggle = (setting) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-deep">Configuración</h1>
          <p className="text-muted mt-1">Gestiona tu cuenta y preferencias</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-deep">
                {user?.name || "Usuario"}
              </h2>
              <p className="text-sm text-muted">
                {user?.email || "email@ejemplo.com"}
              </p>
            </div>
            <Link
              to="/app/perfil"
              className="px-4 py-2 bg-[#F3EEE9] text-sage rounded-lg font-medium hover:bg-[#E8E3DC] transition-colors text-sm"
            >
              Ver perfil
            </Link>
          </div>
        </div>
      </div>

      {SETTINGS_SECTIONS.map((section, sectionIndex) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 px-1">
            {section.title}
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const showBorder = itemIndex < section.items.length - 1;

              if (item.id === "appearance" || item.id === "language") {
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 ${
                      showBorder ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#F3EEE9] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-sage" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-deep">
                          {item.label}
                        </p>
                        <p className="text-sm text-muted">{item.description}</p>
                      </div>
                    </div>
                    {item.id === "appearance" && (
                      <button
                        onClick={() => handleToggle("darkMode")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.darkMode ? "bg-sage" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.darkMode
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    )}
                    {item.id === "language" && (
                      <div className="flex items-center gap-2 text-muted">
                        <span className="text-sm">{item.description}</span>
                        <IoChevronForward className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.path || "#"}
                  className={`flex items-center justify-between p-4 hover:bg-sand/30 transition-colors ${
                    showBorder ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F3EEE9] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-deep">
                        {item.label}
                      </p>
                      <p className="text-sm text-muted">{item.description}</p>
                    </div>
                  </div>
                  <IoChevronForward className="w-5 h-5 text-muted" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3 px-1">
          Notificaciones
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <p className="text-base font-semibold text-deep">
                Notificaciones por Email
              </p>
              <p className="text-sm text-muted">
                Recibe actualizaciones por correo electrónico
              </p>
            </div>
            <button
              onClick={() => handleToggle("emailNotifications")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? "bg-sage" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <p className="text-base font-semibold text-deep">
                Notificaciones Push
              </p>
              <p className="text-sm text-muted">
                Recibe notificaciones en tu navegador
              </p>
            </div>
            <button
              onClick={() => handleToggle("pushNotifications")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.pushNotifications ? "bg-sage" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.pushNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-base font-semibold text-deep">
                Notificaciones SMS
              </p>
              <p className="text-sm text-muted">
                Recibe recordatorios por mensaje de texto
              </p>
            </div>
            <button
              onClick={() => handleToggle("smsNotifications")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.smsNotifications ? "bg-sage" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.smsNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
        >
          <IoLogOutOutline className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted">
          Dharaterapeutas v1.0.0 • © 2024 Todos los derechos reservados
        </p>
      </div>
    </div>
  );
};

export default SettingsScreen;
