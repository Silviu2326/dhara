import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  X,
  LogOut
} from 'lucide-react';
import { useAppStore } from '../app/store';
import { useAuth } from '../hooks/useAuth';

const menuItems = [
  { name: 'Dashboard', path: '/app/dashboard-profesional', icon: LayoutDashboard },
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
  { name: 'Configuración', path: '/app/configuracion-cuenta', icon: Settings },
];

export const TherapistSidebar = () => {
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
          transition-all duration-300 ease-in-out z-50 overflow-y-auto flex flex-col
          ${sidebarOpen 
            ? 'w-64 translate-x-0' 
            : 'w-0 -translate-x-full overflow-hidden'
          }
          lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0
        `}
      >
        {/* Header */}
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

        {/* Logo en desktop */}
        <div className="p-4 border-b border-gray-200 hidden lg:block">
          <h2 className="text-xl font-bold text-sage">Dharaterapeutas</h2>
          <p className="text-sm text-muted">Panel Profesional</p>
        </div>

        {/* Navigation */}
        <nav className="p-2 lg:p-4 flex-1">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const currentPath = decodeURIComponent(location.pathname);
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');

              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg 
                      transition-colors duration-200
                      ${
                        isActive
                          ? 'bg-sage text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-deep'
                      }
                    `}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Cerrar Sesión */}
        <div className="p-4 border-t border-gray-200">
          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => {
              logout();
              navigate('/login');
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
