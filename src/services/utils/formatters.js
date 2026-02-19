import { logger } from './logger';

class Formatters {
  constructor() {
    // Configuraciones por defecto
    this.config = {
      locale: 'es-ES',
      currency: 'EUR',
      timezone: 'Europe/Madrid',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm',
      numberFormat: {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    };

    // Configuraciones por país
    this.localeConfigs = {
      'es-ES': { currency: 'EUR', timezone: 'Europe/Madrid' },
      'es-MX': { currency: 'MXN', timezone: 'America/Mexico_City' },
      'en-US': { currency: 'USD', timezone: 'America/New_York' },
      'es-AR': { currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
      'es-CO': { currency: 'COP', timezone: 'America/Bogota' },
      'es-CL': { currency: 'CLP', timezone: 'America/Santiago' },
      'pt-BR': { currency: 'BRL', timezone: 'America/Sao_Paulo' }
    };
  }

  // Configuración del locale
  setLocale(locale) {
    if (this.localeConfigs[locale]) {
      this.config.locale = locale;
      const localeConfig = this.localeConfigs[locale];
      this.config.currency = localeConfig.currency;
      this.config.timezone = localeConfig.timezone;
    }
  }

  // Formateo de fechas
  formatDate(date, options = {}) {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';

      const formatOptions = {
        locale: options.locale || this.config.locale,
        format: options.format || 'default',
        timezone: options.timezone || this.config.timezone,
        ...options
      };

      const intlOptions = {};

      switch (formatOptions.format) {
        case 'short':
          intlOptions.dateStyle = 'short';
          break;
        case 'medium':
          intlOptions.dateStyle = 'medium';
          break;
        case 'long':
          intlOptions.dateStyle = 'long';
          break;
        case 'full':
          intlOptions.dateStyle = 'full';
          break;
        case 'iso':
          return dateObj.toISOString().split('T')[0];
        case 'relative':
          return this.formatRelativeDate(dateObj);
        case 'custom':
          if (formatOptions.pattern) {
            return this.formatDateWithPattern(dateObj, formatOptions.pattern);
          }
          break;
        default:
          intlOptions.year = 'numeric';
          intlOptions.month = '2-digit';
          intlOptions.day = '2-digit';
      }

      if (formatOptions.timezone) {
        intlOptions.timeZone = formatOptions.timezone;
      }

      return new Intl.DateTimeFormat(formatOptions.locale, intlOptions).format(dateObj);
    } catch (error) {
      logger.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  formatTime(time, options = {}) {
    try {
      let dateObj;

      if (typeof time === 'string' && time.includes(':')) {
        // Formato HH:MM
        const [hours, minutes] = time.split(':');
        dateObj = new Date();
        dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        dateObj = new Date(time);
      }

      if (isNaN(dateObj.getTime())) return 'Invalid Time';

      const formatOptions = {
        locale: options.locale || this.config.locale,
        format: options.format || '24h',
        timezone: options.timezone || this.config.timezone,
        ...options
      };

      const intlOptions = {
        timeZone: formatOptions.timezone
      };

      if (formatOptions.format === '12h') {
        intlOptions.hour12 = true;
        intlOptions.hour = 'numeric';
        intlOptions.minute = '2-digit';
      } else {
        intlOptions.hour12 = false;
        intlOptions.hour = '2-digit';
        intlOptions.minute = '2-digit';
      }

      if (formatOptions.includeSeconds) {
        intlOptions.second = '2-digit';
      }

      return new Intl.DateTimeFormat(formatOptions.locale, intlOptions).format(dateObj);
    } catch (error) {
      logger.error('Error formatting time:', error);
      return 'Invalid Time';
    }
  }

  formatDateTime(dateTime, options = {}) {
    try {
      const dateObj = new Date(dateTime);
      if (isNaN(dateObj.getTime())) return 'Invalid DateTime';

      const formatOptions = {
        locale: options.locale || this.config.locale,
        dateFormat: options.dateFormat || 'medium',
        timeFormat: options.timeFormat || '24h',
        separator: options.separator || ' ',
        timezone: options.timezone || this.config.timezone,
        ...options
      };

      const datePart = this.formatDate(dateObj, {
        format: formatOptions.dateFormat,
        locale: formatOptions.locale,
        timezone: formatOptions.timezone
      });

      const timePart = this.formatTime(dateObj, {
        format: formatOptions.timeFormat,
        locale: formatOptions.locale,
        timezone: formatOptions.timezone,
        includeSeconds: formatOptions.includeSeconds
      });

      return `${datePart}${formatOptions.separator}${timePart}`;
    } catch (error) {
      logger.error('Error formatting datetime:', error);
      return 'Invalid DateTime';
    }
  }

  formatRelativeDate(date) {
    try {
      const dateObj = new Date(date);
      const now = new Date();
      const diffInSeconds = Math.floor((now - dateObj) / 1000);

      if (diffInSeconds < 60) return 'hace un momento';
      if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
      if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
      if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
      if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 604800)} semanas`;
      if (diffInSeconds < 31536000) return `hace ${Math.floor(diffInSeconds / 2592000)} meses`;

      return `hace ${Math.floor(diffInSeconds / 31536000)} años`;
    } catch (error) {
      logger.error('Error formatting relative date:', error);
      return 'Invalid Date';
    }
  }

  formatDateWithPattern(date, pattern) {
    try {
      const dateObj = new Date(date);
      const map = {
        'yyyy': dateObj.getFullYear(),
        'yy': dateObj.getFullYear().toString().slice(-2),
        'MM': String(dateObj.getMonth() + 1).padStart(2, '0'),
        'M': dateObj.getMonth() + 1,
        'dd': String(dateObj.getDate()).padStart(2, '0'),
        'd': dateObj.getDate(),
        'HH': String(dateObj.getHours()).padStart(2, '0'),
        'H': dateObj.getHours(),
        'mm': String(dateObj.getMinutes()).padStart(2, '0'),
        'm': dateObj.getMinutes(),
        'ss': String(dateObj.getSeconds()).padStart(2, '0'),
        's': dateObj.getSeconds()
      };

      return pattern.replace(/yyyy|yy|MM|M|dd|d|HH|H|mm|m|ss|s/g, (match) => map[match] || match);
    } catch (error) {
      logger.error('Error formatting date with pattern:', error);
      return 'Invalid Date';
    }
  }

  // Formateo de monedas
  formatCurrency(amount, options = {}) {
    try {
      const formatOptions = {
        currency: options.currency || this.config.currency,
        locale: options.locale || this.config.locale,
        minimumFractionDigits: options.minimumFractionDigits || 2,
        maximumFractionDigits: options.maximumFractionDigits || 2,
        showSymbol: options.showSymbol !== false,
        ...options
      };

      const numberValue = parseFloat(amount);
      if (isNaN(numberValue)) return 'Invalid Amount';

      const intlOptions = {
        style: 'currency',
        currency: formatOptions.currency,
        minimumFractionDigits: formatOptions.minimumFractionDigits,
        maximumFractionDigits: formatOptions.maximumFractionDigits
      };

      if (!formatOptions.showSymbol) {
        intlOptions.style = 'decimal';
      }

      const formatted = new Intl.NumberFormat(formatOptions.locale, intlOptions).format(numberValue);

      if (!formatOptions.showSymbol && formatOptions.currency) {
        return `${formatted} ${formatOptions.currency}`;
      }

      return formatted;
    } catch (error) {
      logger.error('Error formatting currency:', error);
      return 'Invalid Amount';
    }
  }

  // Formateo de números
  formatNumber(number, options = {}) {
    try {
      const formatOptions = {
        locale: options.locale || this.config.locale,
        minimumFractionDigits: options.minimumFractionDigits || 0,
        maximumFractionDigits: options.maximumFractionDigits || 2,
        useGrouping: options.useGrouping !== false,
        ...options
      };

      const numberValue = parseFloat(number);
      if (isNaN(numberValue)) return 'Invalid Number';

      const intlOptions = {
        minimumFractionDigits: formatOptions.minimumFractionDigits,
        maximumFractionDigits: formatOptions.maximumFractionDigits,
        useGrouping: formatOptions.useGrouping
      };

      return new Intl.NumberFormat(formatOptions.locale, intlOptions).format(numberValue);
    } catch (error) {
      logger.error('Error formatting number:', error);
      return 'Invalid Number';
    }
  }

  formatPercentage(value, options = {}) {
    try {
      const formatOptions = {
        locale: options.locale || this.config.locale,
        minimumFractionDigits: options.minimumFractionDigits || 0,
        maximumFractionDigits: options.maximumFractionDigits || 1,
        ...options
      };

      const numberValue = parseFloat(value);
      if (isNaN(numberValue)) return 'Invalid Percentage';

      const intlOptions = {
        style: 'percent',
        minimumFractionDigits: formatOptions.minimumFractionDigits,
        maximumFractionDigits: formatOptions.maximumFractionDigits
      };

      // Si el valor ya está en porcentaje (0-100), convertir a decimal (0-1)
      const decimalValue = formatOptions.fromPercent ? numberValue / 100 : numberValue;

      return new Intl.NumberFormat(formatOptions.locale, intlOptions).format(decimalValue);
    } catch (error) {
      logger.error('Error formatting percentage:', error);
      return 'Invalid Percentage';
    }
  }

  // Formateo de texto
  formatText(text, options = {}) {
    if (typeof text !== 'string') return String(text);

    const formatOptions = {
      case: options.case || 'none', // 'upper', 'lower', 'title', 'sentence', 'camel', 'pascal'
      maxLength: options.maxLength,
      truncateWord: options.truncateWord !== false,
      suffix: options.suffix || '...',
      ...options
    };

    let formatted = text;

    // Aplicar transformación de caso
    switch (formatOptions.case) {
      case 'upper':
        formatted = formatted.toUpperCase();
        break;
      case 'lower':
        formatted = formatted.toLowerCase();
        break;
      case 'title':
        formatted = this.toTitleCase(formatted);
        break;
      case 'sentence':
        formatted = this.toSentenceCase(formatted);
        break;
      case 'camel':
        formatted = this.toCamelCase(formatted);
        break;
      case 'pascal':
        formatted = this.toPascalCase(formatted);
        break;
    }

    // Aplicar truncado
    if (formatOptions.maxLength && formatted.length > formatOptions.maxLength) {
      if (formatOptions.truncateWord) {
        formatted = formatted.substring(0, formatOptions.maxLength) + formatOptions.suffix;
      } else {
        const truncated = formatted.substring(0, formatOptions.maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) {
          formatted = truncated.substring(0, lastSpace) + formatOptions.suffix;
        } else {
          formatted = truncated + formatOptions.suffix;
        }
      }
    }

    return formatted;
  }

  toTitleCase(text) {
    return text.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  toSentenceCase(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  toCamelCase(text) {
    return text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '');
  }

  toPascalCase(text) {
    return text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, '');
  }

  // Formateo de archivos
  formatFileSize(bytes, options = {}) {
    if (bytes === 0) return '0 Bytes';

    const formatOptions = {
      locale: options.locale || this.config.locale,
      binary: options.binary !== false, // Usar 1024 por defecto
      decimals: options.decimals || 2,
      ...options
    };

    const k = formatOptions.binary ? 1024 : 1000;
    const sizes = formatOptions.binary
      ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
      : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(formatOptions.decimals));

    return `${this.formatNumber(size, {
      locale: formatOptions.locale,
      maximumFractionDigits: formatOptions.decimals
    })} ${sizes[i]}`;
  }

  formatFileName(fileName, options = {}) {
    const formatOptions = {
      maxLength: options.maxLength || 50,
      keepExtension: options.keepExtension !== false,
      ...options
    };

    if (!fileName) return '';

    let name = fileName;
    let extension = '';

    if (formatOptions.keepExtension) {
      const lastDot = fileName.lastIndexOf('.');
      if (lastDot > 0) {
        name = fileName.substring(0, lastDot);
        extension = fileName.substring(lastDot);
      }
    }

    if (name.length + extension.length > formatOptions.maxLength) {
      const maxNameLength = formatOptions.maxLength - extension.length - 3; // 3 para "..."
      name = name.substring(0, maxNameLength) + '...';
    }

    return name + extension;
  }

  // Formateo de datos médicos
  formatHeight(height, fromUnit = 'cm', toUnit = 'cm', options = {}) {
    try {
      const heightValue = parseFloat(height);
      if (isNaN(heightValue)) return 'Invalid Height';

      let cmHeight = heightValue;

      // Convertir a cm si es necesario
      if (fromUnit === 'ft') {
        cmHeight = heightValue * 30.48;
      } else if (fromUnit === 'm') {
        cmHeight = heightValue * 100;
      } else if (fromUnit === 'in') {
        cmHeight = heightValue * 2.54;
      }

      // Convertir a la unidad deseada
      let result = cmHeight;
      if (toUnit === 'ft') {
        result = cmHeight / 30.48;
      } else if (toUnit === 'm') {
        result = cmHeight / 100;
      } else if (toUnit === 'in') {
        result = cmHeight / 2.54;
      }

      const formatted = this.formatNumber(result, {
        maximumFractionDigits: options.decimals || 1,
        locale: options.locale
      });

      return `${formatted} ${toUnit}`;
    } catch (error) {
      logger.error('Error formatting height:', error);
      return 'Invalid Height';
    }
  }

  formatWeight(weight, fromUnit = 'kg', toUnit = 'kg', options = {}) {
    try {
      const weightValue = parseFloat(weight);
      if (isNaN(weightValue)) return 'Invalid Weight';

      let kgWeight = weightValue;

      // Convertir a kg si es necesario
      if (fromUnit === 'lbs') {
        kgWeight = weightValue * 0.453592;
      } else if (fromUnit === 'g') {
        kgWeight = weightValue / 1000;
      }

      // Convertir a la unidad deseada
      let result = kgWeight;
      if (toUnit === 'lbs') {
        result = kgWeight / 0.453592;
      } else if (toUnit === 'g') {
        result = kgWeight * 1000;
      }

      const formatted = this.formatNumber(result, {
        maximumFractionDigits: options.decimals || 1,
        locale: options.locale
      });

      return `${formatted} ${toUnit}`;
    } catch (error) {
      logger.error('Error formatting weight:', error);
      return 'Invalid Weight';
    }
  }

  formatBloodPressure(systolic, diastolic, options = {}) {
    try {
      const sys = parseInt(systolic);
      const dia = parseInt(diastolic);

      if (isNaN(sys) || isNaN(dia)) return 'Invalid Blood Pressure';

      const separator = options.separator || '/';
      const unit = options.showUnit ? ' mmHg' : '';

      return `${sys}${separator}${dia}${unit}`;
    } catch (error) {
      logger.error('Error formatting blood pressure:', error);
      return 'Invalid Blood Pressure';
    }
  }

  // Formateo de duración
  formatDuration(milliseconds, options = {}) {
    try {
      const formatOptions = {
        format: options.format || 'hms', // 'hms', 'long', 'short'
        locale: options.locale || this.config.locale,
        ...options
      };

      if (isNaN(milliseconds)) return 'Invalid Duration';

      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      switch (formatOptions.format) {
        case 'hms':
          if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
          } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
          } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
          } else {
            return `${seconds}s`;
          }

        case 'long':
          const parts = [];
          if (days > 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`);
          if (hours % 24 > 0) parts.push(`${hours % 24} hora${hours % 24 !== 1 ? 's' : ''}`);
          if (minutes % 60 > 0) parts.push(`${minutes % 60} minuto${minutes % 60 !== 1 ? 's' : ''}`);
          if (seconds % 60 > 0) parts.push(`${seconds % 60} segundo${seconds % 60 !== 1 ? 's' : ''}`);
          return parts.join(', ');

        case 'short':
          if (days > 0) return `${days}d`;
          if (hours > 0) return `${hours}h`;
          if (minutes > 0) return `${minutes}m`;
          return `${seconds}s`;

        case 'clock':
          const h = String(hours % 24).padStart(2, '0');
          const m = String(minutes % 60).padStart(2, '0');
          const s = String(seconds % 60).padStart(2, '0');
          return hours >= 24 ? `${days}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;

        default:
          return `${milliseconds}ms`;
      }
    } catch (error) {
      logger.error('Error formatting duration:', error);
      return 'Invalid Duration';
    }
  }

  // Formateo de listas
  formatList(items, options = {}) {
    if (!Array.isArray(items) || items.length === 0) return '';

    const formatOptions = {
      locale: options.locale || this.config.locale,
      style: options.style || 'long', // 'long', 'short', 'narrow'
      type: options.type || 'conjunction', // 'conjunction', 'disjunction'
      ...options
    };

    if (items.length === 1) return items[0];

    try {
      const listFormatter = new Intl.ListFormat(formatOptions.locale, {
        style: formatOptions.style,
        type: formatOptions.type
      });

      return listFormatter.format(items);
    } catch (error) {
      // Fallback para navegadores que no soportan Intl.ListFormat
      const separator = formatOptions.type === 'disjunction' ? ' o ' : ', ';
      const lastSeparator = formatOptions.type === 'disjunction' ? ' o ' : ' y ';

      if (items.length === 2) {
        return items.join(lastSeparator);
      }

      return items.slice(0, -1).join(separator) + lastSeparator + items[items.length - 1];
    }
  }

  // Formateo de direcciones
  formatAddress(address, options = {}) {
    if (!address || typeof address !== 'object') return '';

    const formatOptions = {
      format: options.format || 'full', // 'full', 'short', 'single-line'
      includeCountry: options.includeCountry !== false,
      ...options
    };

    const parts = [];

    if (address.street) parts.push(address.street);
    if (address.number) parts.push(address.number);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    if (formatOptions.includeCountry && address.country) parts.push(address.country);

    switch (formatOptions.format) {
      case 'short':
        return [address.city, address.state].filter(Boolean).join(', ');
      case 'single-line':
        return parts.join(', ');
      default:
        return parts.join('\n');
    }
  }

  // Utilidades de formateo
  maskString(str, options = {}) {
    if (!str) return '';

    const formatOptions = {
      maskChar: options.maskChar || '*',
      visibleStart: options.visibleStart || 0,
      visibleEnd: options.visibleEnd || 0,
      ...options
    };

    if (str.length <= formatOptions.visibleStart + formatOptions.visibleEnd) {
      return str;
    }

    const start = str.substring(0, formatOptions.visibleStart);
    const end = str.substring(str.length - formatOptions.visibleEnd);
    const maskLength = str.length - formatOptions.visibleStart - formatOptions.visibleEnd;
    const mask = formatOptions.maskChar.repeat(maskLength);

    return start + mask + end;
  }

  formatPhoneNumber(phone, options = {}) {
    if (!phone) return '';

    const formatOptions = {
      format: options.format || 'international', // 'international', 'national', 'masked'
      countryCode: options.countryCode,
      ...options
    };

    const cleaned = phone.replace(/\D/g, '');

    switch (formatOptions.format) {
      case 'masked':
        if (cleaned.length >= 10) {
          return this.maskString(cleaned, { visibleStart: 2, visibleEnd: 2 });
        }
        return this.maskString(cleaned, { visibleStart: 1, visibleEnd: 1 });

      case 'national':
        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return cleaned;

      case 'international':
      default:
        if (cleaned.length >= 10) {
          return `+${cleaned.slice(0, -10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
        }
        return cleaned;
    }
  }
}

// Crear instancia única
export const formatters = new Formatters();

// Exportar métodos individuales para conveniencia
export const formatDate = (date, options) => formatters.formatDate(date, options);
export const formatTime = (time, options) => formatters.formatTime(time, options);
export const formatDateTime = (dateTime, options) => formatters.formatDateTime(dateTime, options);
export const formatCurrency = (amount, options) => formatters.formatCurrency(amount, options);
export const formatNumber = (number, options) => formatters.formatNumber(number, options);
export const formatPercentage = (value, options) => formatters.formatPercentage(value, options);
export const formatText = (text, options) => formatters.formatText(text, options);
export const formatFileSize = (bytes, options) => formatters.formatFileSize(bytes, options);
export const formatDuration = (milliseconds, options) => formatters.formatDuration(milliseconds, options);
export const setLocale = (locale) => formatters.setLocale(locale);

export default formatters;