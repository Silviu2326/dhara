import { ENVIRONMENTS } from '../config/environments';
import { APP_CONSTANTS } from '../config/constants';

/**
 * Sistema de logging avanzado para la aplicación
 */
class Logger {
  constructor() {
    this.levels = APP_CONSTANTS.LOGGING.LEVELS;
    this.currentLevel = ENVIRONMENTS.LOG_LEVEL;
    this.logs = [];
    this.maxLogs = 1000;

    // Configurar niveles de prioridad
    this.levelPriority = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    // Configurar colores para consola
    this.colors = {
      debug: '#6B7280',
      info: '#3B82F6',
      warn: '#F59E0B',
      error: '#EF4444'
    };

    // Inicializar almacenamiento persistente en desarrollo
    if (ENVIRONMENTS.isDevelopment) {
      this.initPersistentLogging();
    }
  }

  /**
   * Inicializa el logging persistente para desarrollo
   */
  initPersistentLogging() {
    try {
      const savedLogs = localStorage.getItem('dhara_dev_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs).slice(-this.maxLogs);
      }
    } catch (error) {
      console.warn('Failed to load persistent logs:', error);
    }
  }

  /**
   * Verifica si un nivel de log debe ser procesado
   */
  shouldLog(level) {
    const currentPriority = this.levelPriority[this.currentLevel] || 0;
    const messagePriority = this.levelPriority[level] || 0;
    return messagePriority >= currentPriority;
  }

  /**
   * Formatea un mensaje de log
   */
  formatMessage(level, message, extra = {}) {
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...extra,
      sessionId: this.getSessionId(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    };

    // Agregar stack trace para errores
    if (level === 'error' && !extra.stack) {
      logEntry.stack = new Error().stack;
    }

    return logEntry;
  }

  /**
   * Obtiene o genera un ID de sesión
   */
  getSessionId() {
    if (typeof window === 'undefined') return 'server-session';

    let sessionId = sessionStorage.getItem('dhara_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('dhara_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Registra un log en memoria y persistencia
   */
  recordLog(logEntry) {
    this.logs.push(logEntry);

    // Mantener solo los últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Guardar en localStorage en desarrollo
    if (ENVIRONMENTS.isDevelopment) {
      try {
        localStorage.setItem('dhara_dev_logs', JSON.stringify(this.logs));
      } catch (error) {
        // Silenciosamente fallar si localStorage está lleno
      }
    }
  }

  /**
   * Envía logs críticos al servidor
   */
  async sendToServer(logEntry) {
    if (!ENVIRONMENTS.ERROR_REPORTING_ENABLED) return;

    try {
      // Solo enviar errores y warnings críticos
      if (logEntry.level === 'ERROR' || logEntry.level === 'WARN') {
        await fetch(`${ENVIRONMENTS.API_BASE_URL}/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(logEntry)
        });
      }
    } catch (error) {
      // Fallar silenciosamente para evitar loops infinitos
      console.error('Failed to send log to server:', error);
    }
  }

  /**
   * Método principal de logging
   */
  log(level, message, extra = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, extra);

    // Registrar en memoria
    this.recordLog(logEntry);

    // Mostrar en consola si está habilitado
    if (ENVIRONMENTS.config.debug?.enableConsoleLogging) {
      this.logToConsole(level, message, extra, logEntry);
    }

    // Enviar al servidor para errores críticos
    this.sendToServer(logEntry);

    return logEntry;
  }

  /**
   * Muestra el log en la consola del navegador
   */
  logToConsole(level, message, extra, logEntry) {
    const color = this.colors[level] || '#000000';
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    const consoleMethod = level === 'error' ? 'error' :
                         level === 'warn' ? 'warn' :
                         level === 'info' ? 'info' : 'debug';

    if (typeof message === 'string') {
      console[consoleMethod](
        `%c[${timestamp}] ${level.toUpperCase()}: ${message}`,
        `color: ${color}; font-weight: bold;`,
        extra
      );
    } else {
      console[consoleMethod](
        `%c[${timestamp}] ${level.toUpperCase()}:`,
        `color: ${color}; font-weight: bold;`,
        message,
        extra
      );
    }
  }

  /**
   * Métodos de conveniencia para diferentes niveles
   */
  debug(message, extra = {}) {
    return this.log('debug', message, extra);
  }

  info(message, extra = {}) {
    return this.log('info', message, extra);
  }

  warn(message, extra = {}) {
    return this.log('warn', message, extra);
  }

  error(message, extra = {}) {
    return this.log('error', message, extra);
  }

  /**
   * Logging específico para APIs
   */
  apiRequest(method, url, data = {}) {
    return this.debug('API Request', {
      type: 'api_request',
      method: method.toUpperCase(),
      url,
      data: ENVIRONMENTS.isDevelopment ? data : '[REDACTED]'
    });
  }

  apiResponse(method, url, status, data = {}, duration = 0) {
    const level = status >= 400 ? 'error' : 'debug';
    return this.log(level, 'API Response', {
      type: 'api_response',
      method: method.toUpperCase(),
      url,
      status,
      duration: `${duration}ms`,
      data: ENVIRONMENTS.isDevelopment ? data : '[REDACTED]'
    });
  }

  /**
   * Logging específico para autenticación
   */
  authEvent(event, details = {}) {
    return this.info('Auth Event', {
      type: 'auth_event',
      event,
      ...details
    });
  }

  /**
   * Logging de performance
   */
  performance(label, duration, details = {}) {
    return this.info('Performance', {
      type: 'performance',
      label,
      duration: `${duration}ms`,
      ...details
    });
  }

  /**
   * Logging de errores de usuario
   */
  userError(action, error, context = {}) {
    return this.error('User Error', {
      type: 'user_error',
      action,
      error: error.message || error,
      stack: error.stack,
      ...context
    });
  }

  /**
   * Logging de actividad de usuario
   */
  userActivity(action, details = {}) {
    return this.info('User Activity', {
      type: 'user_activity',
      action,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Logging de métricas de rendimiento
   */
  metric(name, value, unit = '', tags = {}) {
    return this.info('Metric', {
      type: 'metric',
      name,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logging de eventos de negocio
   */
  businessEvent(eventName, data = {}) {
    return this.info('Business Event', {
      type: 'business_event',
      event: eventName,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logging de eventos de seguridad
   */
  securityEvent(eventType, details = {}) {
    return this.warn('Security Event', {
      type: 'security_event',
      eventType,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logging de flujo de trabajo (workflow)
   */
  workflow(workflowName, step, status, details = {}) {
    const level = status === 'error' ? 'error' : 'info';
    return this.log(level, 'Workflow Step', {
      type: 'workflow',
      workflow: workflowName,
      step,
      status,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logging de transacciones
   */
  transaction(transactionId, action, status, details = {}) {
    const level = status === 'failed' ? 'error' : 'info';
    return this.log(level, 'Transaction', {
      type: 'transaction',
      transactionId,
      action,
      status,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Obtiene todos los logs
   */
  getLogs(level = null, limit = null) {
    let logs = [...this.logs];

    if (level) {
      logs = logs.filter(log => log.level === level.toUpperCase());
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  /**
   * Limpia todos los logs
   */
  clearLogs() {
    this.logs = [];
    if (ENVIRONMENTS.isDevelopment) {
      localStorage.removeItem('dhara_dev_logs');
    }
  }

  /**
   * Exporta logs para debugging
   */
  exportLogs() {
    if (typeof window === 'undefined') return null;

    const logsData = {
      exported: new Date().toISOString(),
      environment: ENVIRONMENTS.current,
      sessionId: this.getSessionId(),
      logs: this.logs
    };

    const blob = new Blob([JSON.stringify(logsData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dharaterapeutas-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    return logsData;
  }

  /**
   * Establece el nivel de logging dinámicamente
   */
  setLevel(level) {
    if (this.levelPriority.hasOwnProperty(level)) {
      this.currentLevel = level;
      this.info('Log level changed', { newLevel: level });
    } else {
      this.warn('Invalid log level', { attemptedLevel: level });
    }
  }

  /**
   * Obtiene estadísticas de logs
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      byType: {},
      timeRange: {
        oldest: null,
        newest: null
      }
    };

    if (this.logs.length > 0) {
      stats.timeRange.oldest = this.logs[0].timestamp;
      stats.timeRange.newest = this.logs[this.logs.length - 1].timestamp;
    }

    this.logs.forEach(log => {
      // Por nivel
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

      // Por tipo si existe
      if (log.type) {
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Filtra logs por criterios específicos
   */
  filterLogs(criteria = {}) {
    const {
      level,
      type,
      startDate,
      endDate,
      messageContains,
      sessionId
    } = criteria;

    return this.logs.filter(log => {
      // Filtrar por nivel
      if (level && log.level !== level.toUpperCase()) {
        return false;
      }

      // Filtrar por tipo
      if (type && log.type !== type) {
        return false;
      }

      // Filtrar por rango de fechas
      if (startDate || endDate) {
        const logDate = new Date(log.timestamp);
        if (startDate && logDate < new Date(startDate)) {
          return false;
        }
        if (endDate && logDate > new Date(endDate)) {
          return false;
        }
      }

      // Filtrar por contenido del mensaje
      if (messageContains && !log.message.toLowerCase().includes(messageContains.toLowerCase())) {
        return false;
      }

      // Filtrar por session ID
      if (sessionId && log.sessionId !== sessionId) {
        return false;
      }

      return true;
    });
  }

  /**
   * Obtiene logs de errores recientes
   */
  getRecentErrors(minutes = 30) {
    const cutoffTime = new Date(Date.now() - (minutes * 60 * 1000));

    return this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return log.level === 'ERROR' && logDate >= cutoffTime;
    });
  }

  /**
   * Obtiene resumen de actividad por periodo
   */
  getActivitySummary(periodHours = 24) {
    const cutoffTime = new Date(Date.now() - (periodHours * 60 * 60 * 1000));
    const recentLogs = this.logs.filter(log => new Date(log.timestamp) >= cutoffTime);

    const summary = {
      period: `${periodHours} hours`,
      totalEvents: recentLogs.length,
      errorCount: recentLogs.filter(log => log.level === 'ERROR').length,
      warningCount: recentLogs.filter(log => log.level === 'WARN').length,
      apiCalls: recentLogs.filter(log => log.type === 'api_request').length,
      userActivities: recentLogs.filter(log => log.type === 'user_activity').length,
      uniqueSessions: [...new Set(recentLogs.map(log => log.sessionId))].length
    };

    return summary;
  }

  /**
   * Detecta patrones anómalos en los logs
   */
  detectAnomalies() {
    const anomalies = [];
    const recentLogs = this.logs.slice(-100); // Últimos 100 logs

    // Detectar muchos errores en poco tiempo
    const recentErrors = this.getRecentErrors(10);
    if (recentErrors.length > 5) {
      anomalies.push({
        type: 'high_error_rate',
        description: `${recentErrors.length} errors in the last 10 minutes`,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }

    // Detectar actividad sospechosa de seguridad
    const securityEvents = recentLogs.filter(log => log.type === 'security_event');
    if (securityEvents.length > 3) {
      anomalies.push({
        type: 'multiple_security_events',
        description: `${securityEvents.length} security events detected`,
        severity: 'critical',
        timestamp: new Date().toISOString()
      });
    }

    // Detectar múltiples intentos de login fallidos
    const failedLogins = recentLogs.filter(log =>
      log.type === 'auth_event' && log.event === 'login_failed'
    );
    if (failedLogins.length > 3) {
      anomalies.push({
        type: 'multiple_failed_logins',
        description: `${failedLogins.length} failed login attempts`,
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    }

    return anomalies;
  }

  /**
   * Genera reporte de logs en formato legible
   */
  generateReport(options = {}) {
    const {
      includeStats = true,
      includeRecentErrors = true,
      includeAnomalies = true,
      format = 'text'
    } = options;

    const report = {
      generatedAt: new Date().toISOString(),
      environment: ENVIRONMENTS.current,
      sessionId: this.getSessionId()
    };

    if (includeStats) {
      report.statistics = this.getStats();
    }

    if (includeRecentErrors) {
      report.recentErrors = this.getRecentErrors();
    }

    if (includeAnomalies) {
      report.anomalies = this.detectAnomalies();
    }

    report.activitySummary = this.getActivitySummary();

    if (format === 'json') {
      return report;
    }

    // Formato texto legible
    let textReport = `
DHARATERAPEUTAS - LOG REPORT
============================
Generated: ${report.generatedAt}
Environment: ${report.environment}
Session: ${report.sessionId}

`;

    if (report.statistics) {
      textReport += `STATISTICS:
- Total logs: ${report.statistics.total}
- By level: ${JSON.stringify(report.statistics.byLevel)}
- By type: ${JSON.stringify(report.statistics.byType)}

`;
    }

    if (report.recentErrors && report.recentErrors.length > 0) {
      textReport += `RECENT ERRORS (${report.recentErrors.length}):
${report.recentErrors.map(error =>
  `- [${error.timestamp}] ${error.message}`
).join('\n')}

`;
    }

    if (report.anomalies && report.anomalies.length > 0) {
      textReport += `ANOMALIES DETECTED (${report.anomalies.length}):
${report.anomalies.map(anomaly =>
  `- [${anomaly.severity.toUpperCase()}] ${anomaly.description}`
).join('\n')}

`;
    }

    textReport += `ACTIVITY SUMMARY (Last 24h):
- Total events: ${report.activitySummary.totalEvents}
- Errors: ${report.activitySummary.errorCount}
- Warnings: ${report.activitySummary.warningCount}
- API calls: ${report.activitySummary.apiCalls}
- User activities: ${report.activitySummary.userActivities}
- Unique sessions: ${report.activitySummary.uniqueSessions}
`;

    return textReport;
  }
}

// Instancia global del logger
export const logger = new Logger();

// Export adicional para compatibilidad
export default logger;