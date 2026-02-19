import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Shield, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  Users, 
  MessageCircle, 
  FileText, 
  Star, 
  Bell, 
  Puzzle, 
  HelpCircle, 
  Settings, 
  EuroIcon,
  X
} from 'lucide-react';
import { useAppStore } from '../app/store';

const menuItems = [
  { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Perfil Profesional', path: '/app/perfil-profesional', icon: User },
  { name: 'Verificación', path: '/app/verificacion', icon: Shield },
  { name: 'Servicios y Packs', path: '/app/planes-suscripcion', icon: CreditCard },
  { name: 'Disponibilidad', path: '/app/disponibilidad', icon: Calendar },
  { name: 'Reservas', path: '/app/reservas', icon: BookOpen },
  { name: 'Clientes', path: '/app/clientes', icon: Users },
  { name: 'Chat', path: '/app/chat', icon: MessageCircle },
  { name: 'Documentos y Materiales', path: '/app/documentos-materiales', icon: FileText },
  { name: 'Reseñas', path: '/app/reseñas', icon: Star },
  { name: 'Cobros', path: '/app/pagos', icon: EuroIcon },
  { name: 'Notificaciones', path: '/app/notificaciones', icon: Bell },
  { name: 'Integraciones', path: '/app/integraciones', icon: Puzzle },
  { name: 'Centro de Ayuda', path: '/app/centro-ayuda', icon: HelpCircle },
  { name: 'Configuración de Cuenta', path: '/app/configuracion-cuenta', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // En desktop, mantener según estado
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 
          transition-all duration-300 ease-in-out z-50 overflow-y-auto
          ${sidebarOpen 
            ? 'w-64 translate-x-0' 
            : 'w-0 -translate-x-full overflow-hidden'
          }
          lg:top-16 lg:h-[calc(100vh-4rem)]
        `}
      >
        {/* Header en móvil */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <span className="font-semibold text-deep">Menú</span>
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    // Cerrar sidebar en móvil al navegar
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                  className={`
                    flex items-center space-x-3 px-3 py-3.5 sm:py-3 rounded-lg 
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-sage text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};