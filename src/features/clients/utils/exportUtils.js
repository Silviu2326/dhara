/**
 * Utilidades para exportar datos de clientes
 */

/**
 * Convierte un array de clientes a formato CSV
 * @param {Array} clients - Array de objetos cliente
 * @param {Object} options - Opciones de exportación
 * @returns {string} - Datos en formato CSV
 */
export const convertClientsToCSV = (clients, options = {}) => {
  const {
    includePersonalData = true,
    includeSessionData = true,
    includePaymentData = true,
    includeNotesData = false, // Por defecto false por privacidad
    delimiter = ',',
    dateFormat = 'es-ES'
  } = options;

  // Definir las columnas base
  const baseColumns = [
    { key: 'id', label: 'ID Cliente' },
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Estado' },
    { key: 'createdAt', label: 'Fecha de registro', type: 'date' },
    { key: 'tags', label: 'Etiquetas', type: 'array' }
  ];

  // Columnas de datos personales
  const personalColumns = [
    { key: 'phone', label: 'Teléfono' },
    { key: 'age', label: 'Edad' },
    { key: 'address', label: 'Dirección' },
    { key: 'emergencyContact.name', label: 'Contacto de emergencia' },
    { key: 'emergencyContact.phone', label: 'Teléfono de emergencia' },
    { key: 'emergencyContact.relationship', label: 'Relación contacto emergencia' }
  ];

  // Columnas de datos de sesiones
  const sessionColumns = [
    { key: 'sessionsCount', label: 'Número de sesiones' },
    { key: 'lastSession', label: 'Última sesión', type: 'date' },
    { key: 'rating', label: 'Valoración promedio' }
  ];

  // Columnas de datos de pagos
  const paymentColumns = [
    { key: 'paymentsCount', label: 'Número de pagos' },
    { key: 'totalRevenue', label: 'Ingresos totales', type: 'calculated' }
  ];

  // Columnas de notas (solo si se incluyen)
  const notesColumns = [
    { key: 'notes', label: 'Notas privadas' },
    { key: 'documentsCount', label: 'Número de documentos' },
    { key: 'messagesCount', label: 'Número de mensajes' }
  ];

  // Construir el array de columnas final
  let columns = [...baseColumns];
  if (includePersonalData) columns = [...columns, ...personalColumns];
  if (includeSessionData) columns = [...columns, ...sessionColumns];
  if (includePaymentData) columns = [...columns, ...paymentColumns];
  if (includeNotesData) columns = [...columns, ...notesColumns];

  // Función para obtener valor anidado
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Función para formatear valores
  const formatValue = (value, type, dateFormat) => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString(dateFormat);
      case 'array':
        return Array.isArray(value) ? value.join('; ') : value;
      case 'calculated':
        // Para ingresos totales, calcular basado en sesiones y precio promedio
        return value || '0';
      default:
        return String(value).replace(/"/g, '""'); // Escapar comillas dobles
    }
  };

  // Crear encabezados
  const headers = columns.map(col => `"${col.label}"`).join(delimiter);

  // Crear filas de datos
  const rows = clients.map(client => {
    // Calcular ingresos totales si se incluyen datos de pago
    if (includePaymentData && !client.totalRevenue) {
      client.totalRevenue = (client.sessionsCount || 0) * 60; // Precio promedio de 60€ por sesión
    }

    return columns.map(col => {
      const value = getNestedValue(client, col.key);
      const formattedValue = formatValue(value, col.type, dateFormat);
      return `"${formattedValue}"`;
    }).join(delimiter);
  });

  // Combinar encabezados y filas
  return [headers, ...rows].join('\n');
};

/**
 * Descarga un archivo CSV con los datos de clientes
 * @param {Array} clients - Array de clientes
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {Object} options - Opciones de exportación
 */
export const downloadClientsCSV = (clients, filename = 'clientes', options = {}) => {
  const csvContent = convertClientsToCSV(clients, options);
  
  // Crear blob con BOM para UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Crear enlace de descarga
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpiar URL
  URL.revokeObjectURL(url);
};

/**
 * Genera estadísticas resumidas de los clientes para exportación
 * @param {Array} clients - Array de clientes
 * @returns {Object} - Objeto con estadísticas
 */
export const generateClientStats = (clients) => {
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    inactiveClients: clients.filter(c => c.status === 'inactive').length,
    demoClients: clients.filter(c => c.status === 'demo').length,
    totalSessions: clients.reduce((sum, c) => sum + (c.sessionsCount || 0), 0),
    averageRating: 0,
    totalRevenue: 0,
    clientsByTherapyType: {},
    clientsByMonth: {}
  };

  // Calcular valoración promedio
  const clientsWithRating = clients.filter(c => c.rating && c.rating > 0);
  if (clientsWithRating.length > 0) {
    stats.averageRating = clientsWithRating.reduce((sum, c) => sum + c.rating, 0) / clientsWithRating.length;
  }

  // Calcular ingresos totales estimados
  stats.totalRevenue = stats.totalSessions * 60; // 60€ por sesión promedio

  // Agrupar por tipo de terapia
  clients.forEach(client => {
    if (client.tags && client.tags.length > 0) {
      client.tags.forEach(tag => {
        stats.clientsByTherapyType[tag] = (stats.clientsByTherapyType[tag] || 0) + 1;
      });
    }
  });

  // Agrupar por mes de registro
  clients.forEach(client => {
    if (client.createdAt) {
      const month = new Date(client.createdAt).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
      stats.clientsByMonth[month] = (stats.clientsByMonth[month] || 0) + 1;
    }
  });

  return stats;
};

/**
 * Exporta estadísticas de clientes a CSV
 * @param {Array} clients - Array de clientes
 * @param {string} filename - Nombre del archivo
 */
export const downloadClientStatsCSV = (clients, filename = 'estadisticas_clientes') => {
  const stats = generateClientStats(clients);
  
  // Crear CSV con estadísticas
  let csvContent = 'Estadística,Valor\n';
  csvContent += `"Total de clientes","${stats.totalClients}"\n`;
  csvContent += `"Clientes activos","${stats.activeClients}"\n`;
  csvContent += `"Clientes inactivos","${stats.inactiveClients}"\n`;
  csvContent += `"Clientes demo","${stats.demoClients}"\n`;
  csvContent += `"Total de sesiones","${stats.totalSessions}"\n`;
  csvContent += `"Valoración promedio","${stats.averageRating.toFixed(2)}"\n`;
  csvContent += `"Ingresos totales estimados","€${stats.totalRevenue}"\n`;
  
  csvContent += '\n"Clientes por tipo de terapia"\n';
  csvContent += '"Tipo de terapia","Número de clientes"\n';
  Object.entries(stats.clientsByTherapyType).forEach(([type, count]) => {
    csvContent += `"${type}","${count}"\n`;
  });
  
  csvContent += '\n"Clientes por mes de registro"\n';
  csvContent += '"Mes","Número de clientes"\n';
  Object.entries(stats.clientsByMonth).forEach(([month, count]) => {
    csvContent += `"${month}","${count}"\n`;
  });
  
  // Descargar archivo
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Opciones predefinidas para diferentes tipos de exportación
 */
export const EXPORT_PRESETS = {
  basic: {
    includePersonalData: false,
    includeSessionData: true,
    includePaymentData: false,
    includeNotesData: false
  },
  complete: {
    includePersonalData: true,
    includeSessionData: true,
    includePaymentData: true,
    includeNotesData: false
  },
  confidential: {
    includePersonalData: true,
    includeSessionData: true,
    includePaymentData: true,
    includeNotesData: true
  },
  marketing: {
    includePersonalData: true,
    includeSessionData: false,
    includePaymentData: false,
    includeNotesData: false
  }
};