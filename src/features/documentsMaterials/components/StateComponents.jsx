import React from 'react';
import {
  DocumentIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';

// Componente de carga
export const Loader = ({ message = 'Cargando...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin border-2 border-blue-500 border-t-transparent rounded-full ${sizeClasses[size]} mb-4`}></div>
      <p className="text-gray-600 text-center">{message}</p>
    </div>
  );
};

// Componente de carga en línea
export const InlineLoader = ({ message = 'Cargando...' }) => {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      <span className="text-sm">{message}</span>
    </div>
  );
};

// Componente de skeleton para la tabla
export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg border animate-pulse">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente de estado vacío
export const EmptyState = ({ 
  icon: Icon = FolderOpenIcon,
  title = 'No hay documentos',
  description = 'Aún no has subido ningún documento. Comienza arrastrando archivos aquí.',
  action,
  actionLabel = 'Subir documentos',
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      
      {action && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <CloudArrowUpIcon className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Estados específicos
export const EmptyDocuments = ({ onUpload }) => (
  <EmptyState
    icon={DocumentIcon}
    title="No hay documentos"
    description="Aún no has subido ningún documento. Comienza arrastrando archivos aquí o haz clic en el botón de subida."
    action
    actionLabel="Subir documentos"
    onAction={onUpload}
  />
);

export const EmptySearch = ({ searchTerm, onClear }) => (
  <EmptyState
    icon={FolderOpenIcon}
    title="No se encontraron resultados"
    description={`No hay documentos que coincidan con "${searchTerm}". Intenta con otros términos de búsqueda.`}
    action
    actionLabel="Limpiar búsqueda"
    onAction={onClear}
  />
);

export const EmptyFilter = ({ filters, onClearFilters }) => {
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
    .map(([key]) => key);

  return (
    <EmptyState
      icon={FolderOpenIcon}
      title="No hay documentos con estos filtros"
      description={`No se encontraron documentos que coincidan con los filtros aplicados: ${activeFilters.join(', ')}.`}
      action
      actionLabel="Limpiar filtros"
      onAction={onClearFilters}
    />
  );
};

// Componente de error
export const ErrorState = ({ 
  title = 'Ha ocurrido un error',
  description = 'No se pudieron cargar los documentos. Por favor, inténtalo de nuevo.',
  onRetry,
  showRetry = true
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Intentar de nuevo
        </button>
      )}
    </div>
  );
};

// Error Boundary
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log del error (en producción enviarías esto a un servicio de logging)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-96 flex items-center justify-center">
          <ErrorState
            title="Error en la aplicación"
            description="Ha ocurrido un error inesperado. Por favor, recarga la página o inténtalo más tarde."
            onRetry={this.handleRetry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para manejo de estados de carga
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState(null);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setLoadingError = (error) => {
    setIsLoading(false);
    setError(error);
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    reset
  };
};

// Componente de estado de carga con overlay
export const LoadingOverlay = ({ isVisible, message = 'Procesando...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-700">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default {
  Loader,
  InlineLoader,
  TableSkeleton,
  EmptyState,
  EmptyDocuments,
  EmptySearch,
  EmptyFilter,
  ErrorState,
  ErrorBoundary,
  LoadingOverlay,
  useLoadingState
};