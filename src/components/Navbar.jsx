import React from 'react';
import { User, Menu, LogOut } from 'lucide-react';
import { useAppStore } from '../app/store';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';

export const Navbar = () => {
  const { toggleSidebar, user } = useAppStore();
  const { logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 h-16">
      <div className="flex items-center justify-between h-full">
        {/* Lado izquierdo */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSidebar}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Lado derecho */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Usuario */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sage rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="hidden md:block text-sm font-medium text-deep truncate max-w-[120px]">
              {user?.name || 'Terapeuta'}
            </span>
          </div>
          
          {/* Logout - icono en móvil, texto en desktop */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="hidden sm:flex"
          >
            Salir
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="sm:hidden"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};