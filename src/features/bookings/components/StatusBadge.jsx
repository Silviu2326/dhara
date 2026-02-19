import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  UserX,
  DollarSign,
  RefreshCw
} from 'lucide-react';

const statusConfig = {
  upcoming: {
    label: 'Próxima',
    icon: Calendar,
    colors: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dot: 'bg-blue-500'
    }
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    colors: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500'
    }
  },
  confirmed: {
    label: 'Confirmada',
    icon: CheckCircle,
    colors: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      dot: 'bg-green-500'
    }
  },
  completed: {
    label: 'Completada',
    icon: CheckCircle,
    colors: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    }
  },
  cancelled: {
    label: 'Cancelada',
    icon: XCircle,
    colors: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500'
    }
  },
  no_show: {
    label: 'No asistió',
    icon: UserX,
    colors: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      dot: 'bg-gray-500'
    }
  },
  rescheduled: {
    label: 'Reprogramada',
    icon: RefreshCw,
    colors: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      dot: 'bg-purple-500'
    }
  },
  paid: {
    label: 'Pagado',
    icon: DollarSign,
    colors: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      dot: 'bg-green-500'
    }
  },
  unpaid: {
    label: 'Sin pagar',
    icon: AlertCircle,
    colors: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      dot: 'bg-orange-500'
    }
  },
  refunded: {
    label: 'Reembolsado',
    icon: RefreshCw,
    colors: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500'
    }
  }
};

export const StatusBadge = ({ 
  status, 
  size = 'md', 
  variant = 'default',
  showIcon = true,
  showDot = false,
  className = ''
}) => {
  const config = statusConfig[status];
  
  if (!config) {
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full ${className}`}>
        {status}
      </span>
    );
  }

  const { label, icon: Icon, colors } = config;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'h-3 w-3',
      dot: 'h-1.5 w-1.5'
    },
    md: {
      container: 'px-2.5 py-1 text-xs',
      icon: 'h-3.5 w-3.5',
      dot: 'h-2 w-2'
    },
    lg: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'h-4 w-4',
      dot: 'h-2.5 w-2.5'
    }
  };

  const variantClasses = {
    default: `${colors.bg} ${colors.text} ${colors.border}`,
    outline: `bg-white ${colors.text} border ${colors.border}`,
    solid: `${colors.dot.replace('bg-', 'bg-')} text-white`,
    minimal: `${colors.text} bg-transparent`
  };

  const containerClass = `
    inline-flex items-center font-medium rounded-full
    ${sizeClasses[size].container}
    ${variantClasses[variant]}
    ${className}
  `;

  return (
    <span className={containerClass}>
      {showDot && (
        <span 
          className={`
            ${sizeClasses[size].dot} 
            ${colors.dot} 
            rounded-full mr-1.5
          `}
        />
      )}
      {showIcon && Icon && (
        <Icon className={`${sizeClasses[size].icon} mr-1`} />
      )}
      <span>{label}</span>
    </span>
  );
};

// Utility function to get status color for other components
export const getStatusColor = (status) => {
  const config = statusConfig[status];
  return config ? config.colors : statusConfig.pending.colors;
};

// Utility function to get all available statuses
export const getAvailableStatuses = () => {
  return Object.keys(statusConfig).map(key => ({
    value: key,
    label: statusConfig[key].label,
    icon: statusConfig[key].icon,
    colors: statusConfig[key].colors
  }));
};

// Status badge with count
export const StatusBadgeWithCount = ({ status, count, ...props }) => {
  return (
    <div className="inline-flex items-center space-x-1">
      <StatusBadge status={status} {...props} />
      {count !== undefined && (
        <span className="text-xs text-gray-500 font-medium">({count})</span>
      )}
    </div>
  );
};

// Multiple status badges
export const StatusBadgeGroup = ({ statuses, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {statuses.map((status, index) => (
        <StatusBadge 
          key={index} 
          status={typeof status === 'string' ? status : status.status}
          size={status.size || 'sm'}
          variant={status.variant || 'default'}
          {...(typeof status === 'object' ? status : {})}
        />
      ))}
    </div>
  );
};