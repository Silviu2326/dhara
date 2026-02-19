import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ClientTabs } from './ClientTabs';

export const ClientDrawer = ({ 
  isOpen, 
  onClose, 
  client, 
  onEditClient,
  onNewBooking,
  onUploadDocument,
  onDeleteClient
}) => {
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (isOpen) {
      // Reset to profile tab when opening
      setActiveTab('profile');
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !client) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {client.avatar ? (
                  <img 
                    className="h-12 w-12 rounded-full object-cover" 
                    src={client.avatar} 
                    alt={client.name} 
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{client.name}</h2>
                <p className="text-sm text-gray-500">ID: {client.id}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ClientTabs
              client={client}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEditClient={onEditClient}
              onNewBooking={onNewBooking}
              onUploadDocument={onUploadDocument}
              onDeleteClient={onDeleteClient}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// Hook para manejar el estado del drawer
export const useClientDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const openDrawer = (client) => {
    setSelectedClient(client);
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    // Delay clearing the client to allow for closing animation
    setTimeout(() => setSelectedClient(null), 300);
  };

  return {
    isOpen,
    selectedClient,
    openDrawer,
    closeDrawer
  };
};