import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

const formatDate = (date) => {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DataSummary = ({ client }) => {
  const dataTypes = [
    {
      type: 'Información personal',
      items: ['Datos de contacto', 'Información médica', 'Historial clínico'],
      count: 1
    },
    {
      type: 'Sesiones',
      items: ['Registros de citas', 'Notas de sesión', 'Evaluaciones'],
      count: client?.sessionsCount || 0
    },
    {
      type: 'Documentos',
      items: ['Consentimientos', 'Informes', 'Archivos adjuntos'],
      count: client?.documentsCount || 0
    },
    {
      type: 'Pagos',
      items: ['Historial de transacciones', 'Facturas', 'Datos bancarios'],
      count: client?.paymentsCount || 0
    },
    {
      type: 'Comunicaciones',
      items: ['Mensajes de chat', 'Emails', 'Notificaciones'],
      count: client?.messagesCount || 0
    }
  ];
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">Datos que serán eliminados:</h4>
      <div className="space-y-3">
        {dataTypes.map((dataType, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{dataType.type}</span>
                <span className="text-sm text-gray-600">({dataType.count})</span>
              </div>
              <ul className="text-sm text-gray-600 mt-1">
                {dataType.items.map((item, itemIndex) => (
                  <li key={itemIndex}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RGPDCompliance = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-900 mb-2">Cumplimiento RGPD</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Derecho al olvido:</strong> El cliente tiene derecho a solicitar la eliminación 
              de sus datos personales según el Artículo 17 del RGPD.
            </p>
            <p>
              <strong>Conservación de datos:</strong> Algunos datos pueden requerir conservación 
              por obligaciones legales (ej: datos fiscales por 6 años).
            </p>
            <p>
              <strong>Trazabilidad:</strong> Se mantendrá un registro de la eliminación para 
              cumplir con auditorías y requisitos legales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeletionSteps = ({ currentStep }) => {
  const steps = [
    {
      id: 1,
      title: 'Descarga de datos',
      description: 'Generar y descargar archivo ZIP con todos los datos del cliente'
    },
    {
      id: 2,
      title: 'Confirmación final',
      description: 'Confirmar la eliminación definitiva de todos los datos'
    },
    {
      id: 3,
      title: 'Eliminación',
      description: 'Borrado permanente de todos los datos del sistema'
    }
  ];
  
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Proceso de eliminación:</h4>
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        
        return (
          <div key={step.id} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              isCompleted
                ? 'bg-green-100 text-green-700'
                : isActive
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {isCompleted ? '✓' : step.id}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
              }`}>
                {step.title}
              </p>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DeleteClientDialog = ({ 
  isOpen, 
  onClose, 
  client,
  onDelete,
  onDownloadData
}) => {
  const [step, setStep] = useState(1); // 1: download, 2: confirm, 3: deleting
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const expectedConfirmation = `ELIMINAR ${client?.name?.toUpperCase()}`;
  const isConfirmationValid = confirmationText === expectedConfirmation;
  
  React.useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setStep(1);
      setIsDownloading(false);
      setIsDeleting(false);
      setDownloadCompleted(false);
      setConfirmationText('');
      setAgreedToTerms(false);
    }
  }, [isOpen]);
  
  const handleDownloadData = async () => {
    setIsDownloading(true);
    
    try {
      // Simular descarga de datos
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // En una implementación real, aquí se generaría y descargaría el ZIP
      await onDownloadData(client.id);
      
      setDownloadCompleted(true);
      setStep(2);
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Error al descargar los datos. Por favor inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!isConfirmationValid || !agreedToTerms) {
      return;
    }
    
    setIsDeleting(true);
    setStep(3);
    
    try {
      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await onDelete(client.id);
      onClose();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar el cliente. Por favor inténtalo de nuevo.');
      setStep(2);
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!isOpen || !client) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Eliminar cliente</h2>
              <p className="text-sm text-gray-600">
                {client.name} • ID: {client.id}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            disabled={isDownloading || isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Advertencia principal */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-900 mb-1">⚠️ Acción irreversible</h3>
                  <p className="text-sm text-red-800">
                    Esta acción eliminará permanentemente todos los datos del cliente del sistema. 
                    No podrás recuperar esta información una vez eliminada.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Pasos del proceso */}
            <DeletionSteps currentStep={step} />
            
            {/* Paso 1: Descarga de datos */}
            {step === 1 && (
              <div className="space-y-4">
                <DataSummary client={client} />
                
                <RGPDCompliance />
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <DocumentArrowDownIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Descarga obligatoria</h4>
                      <p className="text-sm text-yellow-800">
                        Antes de eliminar los datos, debes descargar una copia completa para 
                        cumplir con las regulaciones de protección de datos y como medida de seguridad.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Paso 2: Confirmación */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Datos descargados correctamente</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Para confirmar, escribe: <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">{expectedConfirmation}</code>
                    </label>
                    <input
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder={expectedConfirmation}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                        confirmationText && !isConfirmationValid
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-primary focus:border-primary'
                      }`}
                      disabled={isDeleting}
                    />
                    {confirmationText && !isConfirmationValid && (
                      <p className="text-sm text-red-600 mt-1">El texto no coincide</p>
                    )}
                  </div>
                  
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 text-primary focus:ring-primary"
                      disabled={isDeleting}
                    />
                    <span className="text-sm text-gray-700">
                      Confirmo que he descargado todos los datos necesarios y entiendo que 
                      esta acción es irreversible. Acepto la responsabilidad de cumplir con 
                      las regulaciones de protección de datos aplicables.
                    </span>
                  </label>
                </div>
              </div>
            )}
            
            {/* Paso 3: Eliminando */}
            {step === 3 && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminando datos...</h3>
                <p className="text-sm text-gray-600">
                  Por favor espera mientras se eliminan todos los datos del cliente.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <ClockIcon className="h-3 w-3 inline mr-1" />
            Última actividad: {formatDate(new Date(client.lastActivity || client.createdAt))}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDownloading || isDeleting}
            >
              Cancelar
            </Button>
            
            {step === 1 && (
              <Button
                onClick={handleDownloadData}
                disabled={isDownloading}
                loading={isDownloading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isDownloading ? 'Descargando...' : 'Descargar datos'}
              </Button>
            )}
            
            {step === 2 && (
              <Button
                onClick={handleDelete}
                disabled={!isConfirmationValid || !agreedToTerms || isDeleting}
                loading={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Eliminar definitivamente
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};