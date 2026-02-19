import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  Heart,
  FileText,
  Star,
  LayoutDashboard,
  Settings,
  BookOpen,
  MessageCircle,
  Bell,
  HelpCircle,
  X,
  LogOut,
  CreditCard,
} from "lucide-react";
import { useAppStore } from "../../app/store";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const menuItems = [
  { name: "Dashboard", path: "/app/cliente/dashboard", icon: LayoutDashboard },
  { name: "Home", path: "/app/cliente/home", icon: Home },
  { name: "Citas", path: "/app/cliente/citas", icon: Calendar },
  { name: "Favoritos", path: "/app/cliente/favoritos", icon: Heart },
  { name: "Documentos", path: "/app/cliente/documentos", icon: FileText },
  { name: "Reseñas", path: "/app/cliente/resenas", icon: Star },
  { name: "Diccionario", path: "/app/cliente/diccionario", icon: BookOpen },
  { name: "Chat", path: "/app/cliente/chat", icon: MessageCircle },
  { name: "Notificaciones", path: "/app/cliente/notificaciones", icon: Bell },
  {
    name: "Centro de Ayuda",
    path: "/app/cliente/centro-ayuda",
    icon: HelpCircle,
  },
  { name: "Configuración", path: "/app/cliente/configuracion", icon: Settings },
  { name: "Pagos", path: "/app/cliente/pagos", icon: CreditCard },
];

export const ClientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // En desktop, mantener según estado
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 
          transition-all duration-300 ease-in-out z-50 overflow-y-auto
          ${
            sidebarOpen
              ? "w-64 translate-x-0"
              : "w-0 -translate-x-full overflow-hidden"
          }
          lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <span className="text-lg font-semibold text-deep">Menú</span>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 hidden lg:block">
          <h2 className="text-xl font-bold text-sage">Dharaterapeutas</h2>
          <p className="text-sm text-muted">Portal Cliente</p>
        </div>

        <nav className="p-2 lg:p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg 
                      transition-colors duration-200
                      ${
                        isActive
                          ? "bg-sage text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-deep"
                      }
                    `}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 mt-auto">
          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
