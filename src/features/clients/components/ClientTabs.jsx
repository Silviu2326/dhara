import React from 'react';
import { 
  UserIcon, 
  CalendarIcon, 
  CreditCardIcon, 
  StarIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { ClientProfileCard } from './ClientProfileCard';
import { ClientSessionsTable } from './ClientSessionsTable';
import { ClientPaymentsTable } from './ClientPaymentsTable';
import { ClientReviews } from './ClientReviews';
import { ClientNotesSection } from './ClientNotesSection';

const TABS = [
  {
    id: 'profile',
    label: 'Perfil',
    icon: UserIcon,
    description: 'Información personal y datos básicos'
  },
  {
    id: 'sessions',
    label: 'Sesiones',
    icon: CalendarIcon,
    description: 'Historial de sesiones y citas'
  },
  {
    id: 'payments',
    label: 'Pagos',
    icon: CreditCardIcon,
    description: 'Historial de pagos y facturas'
  },
  {
    id: 'reviews',
    label: 'Valoraciones',
    icon: StarIcon,
    description: 'Reseñas y comentarios del cliente'
  },
  {
    id: 'notes',
    label: 'Notas',
    icon: DocumentTextIcon,
    description: 'Notas privadas del terapeuta'
  }
];

export const ClientTabs = ({
  client,
  activeTab,
  onTabChange,
  onEditClient,
  onNewBooking,
  onUploadDocument,
  onDeleteClient,
  onViewPaymentDetails,
  onDownloadInvoice,
  onCreateNote,
  onViewNote,
  onAddResponse,
  onRefreshNotes
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ClientProfileCard
            client={client}
            onEdit={onEditClient}
            onNewBooking={onNewBooking}
            onUploadDocument={onUploadDocument}
            onDelete={onDeleteClient}
          />
        );
      
      case 'sessions':
        return (
          <ClientSessionsTable
            clientId={client.id}
            sessions={client.sessions || []}
            onNewBooking={onNewBooking}
          />
        );
      
      case 'payments':
        return (
          <ClientPaymentsTable
            clientId={client.id}
            payments={client.payments || []}
            onViewDetails={onViewPaymentDetails}
            onDownloadInvoice={onDownloadInvoice}
          />
        );
      
      case 'reviews':
        return (
          <ClientReviews
            clientId={client.id}
            reviews={client.reviews || []}
          />
        );
      
      case 'notes':
        return (
          <ClientNotesSection
            clientId={client.id}
            clientNotes={client.clientNotes || []}
            stats={{
              totalNotes: client.clientNotesCount || 0,
              therapistNotes: client.therapistNotesCount || 0,
              clientNotes: client.clientOwnNotesCount || 0,
              emergencyNotes: client.emergencyNotesCount || 0,
              pendingResponses: client.pendingResponsesCount || 0,
              lastNote: client.lastClientNote
            }}
            isLoading={client.isLoadingClientNotes || false}
            onCreateNote={onCreateNote}
            onViewNote={onViewNote}
            onAddResponse={onAddResponse}
            onRefresh={onRefreshNotes}
          />
        );
      
      default:
        return null;
    }
  };

  const getTabCount = (tabId) => {
    switch (tabId) {
      case 'sessions':
        return client.sessions?.length || 0;
      case 'payments':
        return client.payments?.length || 0;
      case 'reviews':
        return client.reviews?.length || 0;
      case 'notes':
        return client.clientNotesCount || 0;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = getTabCount(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <Icon className={`mr-2 h-5 w-5 ${
                  isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {tab.label}
                {count !== null && count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    isActive 
                      ? 'bg-primary bg-opacity-10 text-primary' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

// Hook para manejar el estado de las tabs
export const useClientTabs = (defaultTab = 'profile') => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const switchToTab = (tabId) => {
    if (TABS.find(tab => tab.id === tabId)) {
      setActiveTab(tabId);
    }
  };

  const resetToDefault = () => {
    setActiveTab(defaultTab);
  };

  return {
    activeTab,
    setActiveTab,
    switchToTab,
    resetToDefault,
    availableTabs: TABS
  };
};