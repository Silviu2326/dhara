import React from "react";
import { Bell, User, Menu, LogOut } from "lucide-react";
import { useAppStore } from "../../app/store";
import { useNavigate } from "react-router-dom";

export const ClientNavbar = () => {
  const { toggleSidebar, user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 h-16">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate("/app/cliente/notificaciones")}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/app/cliente/configuracion")}
          >
            <div className="w-8 h-8 bg-sage rounded-full flex items-center justify-center flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <span className="hidden md:block text-sm font-medium text-deep truncate max-w-[120px]">
              {user?.name || "Cliente"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
          <button
            onClick={handleLogout}
            className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </nav>
  );
};
