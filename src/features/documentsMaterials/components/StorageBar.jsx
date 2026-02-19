import React from 'react';
import { CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getStorageColor = (percentage) => {
  if (percentage >= 90) return 'red';
  if (percentage >= 75) return 'yellow';
  return 'blue';
};

const getStorageStyles = (color) => {
  const styles = {
    red: {
      bg: 'bg-red-500',
      text: 'text-red-700',
      bgLight: 'bg-red-50',
      border: 'border-red-200'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-700',
      bgLight: 'bg-yellow-50',
      border: 'border-yellow-200'
    },
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-700',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200'
    }
  };
  
  return styles[color];
};

export const StorageBar = ({ used = 0, limit = 5368709120, compact = false }) => { // 5GB por defecto
  const percentage = Math.min((used / limit) * 100, 100);
  const color = getStorageColor(percentage);
  const styles = getStorageStyles(color);
  const isNearLimit = percentage >= 75;
  const isOverLimit = percentage >= 90;
  
  return (
    <div className={`space-y-2 ${
      compact ? 'space-y-1' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudIcon className={`text-gray-500 ${
            compact ? 'w-4 h-4' : 'w-5 h-5'
          }`} />
          <span className={`font-medium text-gray-900 ${
            compact ? 'text-sm' : 'text-base'
          }`}>
            Almacenamiento
          </span>
          {isNearLimit && (
            <ExclamationTriangleIcon className={`${
              isOverLimit ? 'text-red-500' : 'text-yellow-500'
            } ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          )}
        </div>
        
        <div className={`text-gray-600 ${
          compact ? 'text-xs' : 'text-sm'
        }`}>
          <span className={styles.text}>{formatBytes(used)}</span>
          <span className="text-gray-400"> / </span>
          <span>{formatBytes(limit)}</span>
        </div>
      </div>
      
      {/* Barra de progreso */}
      <div className="relative">
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${
          compact ? 'h-1.5' : 'h-2'
        }`}>
          <div
            className={`${styles.bg} transition-all duration-300 ease-out ${
              compact ? 'h-1.5' : 'h-2'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Marcadores de advertencia */}
        {!compact && (
          <>
            {/* Marca del 75% */}
            <div 
              className="absolute top-0 w-0.5 h-2 bg-yellow-400 opacity-50"
              style={{ left: '75%' }}
            />
            {/* Marca del 90% */}
            <div 
              className="absolute top-0 w-0.5 h-2 bg-red-400 opacity-50"
              style={{ left: '90%' }}
            />
          </>
        )}
      </div>
      
      {/* Información adicional */}
      <div className={`flex items-center justify-between text-gray-500 ${
        compact ? 'text-xs' : 'text-sm'
      }`}>
        <span>{percentage.toFixed(1)}% utilizado</span>
        <span>{formatBytes(limit - used)} disponible</span>
      </div>
      
      {/* Alertas */}
      {isOverLimit && (
        <div className={`${styles.bgLight} ${styles.border} border rounded-lg p-3 ${
          compact ? 'p-2' : ''
        }`}>
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className={`${styles.text} flex-shrink-0 ${
              compact ? 'w-4 h-4' : 'w-5 h-5'
            }`} />
            <div>
              <p className={`${styles.text} font-medium ${
                compact ? 'text-xs' : 'text-sm'
              }`}>
                Almacenamiento casi lleno
              </p>
              <p className={`text-gray-600 ${
                compact ? 'text-xs' : 'text-sm'
              }`}>
                Considera eliminar archivos antiguos o actualizar tu plan.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isNearLimit && (
        <div className={`${styles.bgLight} ${styles.border} border rounded-lg p-3 ${
          compact ? 'p-2' : ''
        }`}>
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className={`${styles.text} flex-shrink-0 ${
              compact ? 'w-4 h-4' : 'w-5 h-5'
            }`} />
            <div>
              <p className={`${styles.text} font-medium ${
                compact ? 'text-xs' : 'text-sm'
              }`}>
                Almacenamiento en advertencia
              </p>
              <p className={`text-gray-600 ${
                compact ? 'text-xs' : 'text-sm'
              }`}>
                Te queda {formatBytes(limit - used)} de espacio disponible.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StorageBarCompact = (props) => {
  return <StorageBar {...props} compact />;
};

// Componente simplificado para mostrar solo la barra
export const StorageBarSimple = ({ used, limit, className = '' }) => {
  const percentage = Math.min((used / limit) * 100, 100);
  const color = getStorageColor(percentage);
  const styles = getStorageStyles(color);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`${styles.bg} h-1.5 transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 min-w-0">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// Utilidades para trabajar con almacenamiento
export const storageUtils = {
  formatBytes,
  
  calculateUsage: (documents) => {
    return documents.reduce((total, doc) => total + (doc.size || 0), 0);
  },
  
  getStorageStats: (documents, limit) => {
    const used = storageUtils.calculateUsage(documents);
    const percentage = (used / limit) * 100;
    const available = limit - used;
    
    return {
      used,
      limit,
      available,
      percentage,
      isNearLimit: percentage >= 75,
      isOverLimit: percentage >= 90,
      color: getStorageColor(percentage)
    };
  },
  
  canUploadFile: (fileSize, currentUsage, limit) => {
    return (currentUsage + fileSize) <= limit;
  },
  
  getRemainingSpace: (currentUsage, limit) => {
    return Math.max(0, limit - currentUsage);
  },
  
  getRecommendations: (stats) => {
    const recommendations = [];
    
    if (stats.isOverLimit) {
      recommendations.push({
        type: 'critical',
        message: 'Elimina archivos para liberar espacio',
        action: 'delete_files'
      });
      recommendations.push({
        type: 'info',
        message: 'Considera actualizar tu plan de almacenamiento',
        action: 'upgrade_plan'
      });
    } else if (stats.isNearLimit) {
      recommendations.push({
        type: 'warning',
        message: 'Revisa y elimina archivos antiguos',
        action: 'cleanup_files'
      });
    }
    
    return recommendations;
  }
};