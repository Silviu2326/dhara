import React, { useState, useEffect } from 'react';
import { DollarSign, Package } from 'lucide-react';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano' }
];

export const RatesForm = ({ rates = {}, onChange, isEditing = false }) => {
  const [formData, setFormData] = useState({
    sessionPrice: '',
    followUpPrice: '',
    packagePrice: '',
    coupleSessionPrice: '',
    currency: 'EUR'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      sessionPrice: rates.sessionPrice || '',
      followUpPrice: rates.followUpPrice || '',
      packagePrice: rates.packagePrice || '',
      coupleSessionPrice: rates.coupleSessionPrice || '',
      currency: rates.currency || 'EUR'
    });
  }, [rates]);

  const validatePrice = (value, fieldName) => {
    if (!value.trim()) {
      return '';
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return `${fieldName} debe ser un número válido mayor o igual a 0`;
    }
    
    if (numValue > 9999) {
      return `${fieldName} no puede ser mayor a 9999`;
    }
    
    return '';
  };

  const handleInputChange = (field, value) => {
    // Para precios, permitir solo números y punto decimal
    if (['sessionPrice','followUpPrice','packagePrice','coupleSessionPrice'].includes(field)) {
      // Permitir números, punto decimal y vacío
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
        return;
      }
    }

    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Validar en tiempo real
    const newErrors = { ...errors };
    
    if (field === 'sessionPrice') {
      const error = validatePrice(value, 'El precio por sesión');
      if (error) {
        newErrors.sessionPrice = error;
      } else {
        delete newErrors.sessionPrice;
      }
    }
    
    if (field === 'packagePrice') {
      const error = validatePrice(value, 'El precio del pack');
      if (error) {
        newErrors.packagePrice = error;
      } else {
        delete newErrors.packagePrice;
      }
    }
    
    if (field === 'followUpPrice') {
      const error = validatePrice(value, 'El precio de seguimiento');
      if (error) {
        newErrors.followUpPrice = error;
      } else {
        delete newErrors.followUpPrice;
      }
    }

    if (field === 'coupleSessionPrice') {
      const error = validatePrice(value, 'El precio de pareja');
      if (error) {
        newErrors.coupleSessionPrice = error;
      } else {
        delete newErrors.coupleSessionPrice;
      }
    }

    setErrors(newErrors);

    // Notificar cambios al componente padre
    if (onChange) {
      onChange(newFormData);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === formData.currency);
  const currencySymbol = selectedCurrency?.symbol || '€';

  const formatDisplayPrice = (price) => {
    if (!price) return '';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return numPrice.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-sage" />
          <h3 className="text-lg font-semibold text-deep">Tarifas</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-sage" />
              <span className="text-sm font-medium text-gray-700">Sesión individual (50 min)</span>
            </div>
            <div className="text-2xl font-bold text-deep">
              {formData.sessionPrice ? (
                `${currencySymbol}${formatDisplayPrice(formData.sessionPrice)}`
              ) : (
                <span className="text-gray-400 text-base">No definido</span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-sage" />
              <span className="text-sm font-medium text-gray-700">Sesión de seguimiento (30 min)</span>
            </div>
            <div className="text-2xl font-bold text-deep">
              {formData.followUpPrice ? (
                `${currencySymbol}${formatDisplayPrice(formData.followUpPrice)}`
              ) : (
                <span className="text-gray-400 text-base">No definido</span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="h-4 w-4 text-sage" />
              <span className="text-sm font-medium text-gray-700">Pack 4 sesiones</span>
            </div>
            <div className="text-2xl font-bold text-deep">
              {formData.packagePrice ? (
                `${currencySymbol}${formatDisplayPrice(formData.packagePrice)}`
              ) : (
                <span className="text-gray-400 text-base">No definido</span>
              )}
            </div>
            {formData.packagePrice && formData.sessionPrice && (
              <div className="text-xs text-gray-600 mt-1">
                Ahorro: {currencySymbol}{formatDisplayPrice((parseFloat(formData.sessionPrice) * 4 - parseFloat(formData.packagePrice)).toFixed(2))}
              </div>
            )}
            {formData.coupleSessionPrice && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sesión de pareja:</span>
                <span className="font-semibold text-deep">
                  {currencySymbol}{formatDisplayPrice(formData.coupleSessionPrice)}
                </span>
              </div>
            )}
          </div>
          
          {/* Precio pareja */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-sage" />
              <span className="text-sm font-medium text-gray-700">Sesión de pareja</span>
            </div>
            <div className="text-2xl font-bold text-deep">
              {formData.coupleSessionPrice ? (
                `${currencySymbol}${formatDisplayPrice(formData.coupleSessionPrice)}`
              ) : (
                <span className="text-gray-400 text-base">No definido</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <DollarSign className="h-5 w-5 text-sage" />
        <h3 className="text-lg font-semibold text-deep">Tarifas</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Moneda */}
        <div>
          <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 mb-1">
            Moneda
          </label>
          <select
            id="currency-select"
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
          >
            {CURRENCIES.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        {/* Precio sesión */}
        <div>
          <label htmlFor="session-price" className="block text-sm font-medium text-gray-700 mb-1">
            Sesión individual (50 min)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {currencySymbol}
            </span>
            <input
              id="session-price"
              type="text"
              value={formData.sessionPrice}
              onChange={(e) => handleInputChange('sessionPrice', e.target.value)}
              placeholder="0.00"
              className={`
                w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent
                ${errors.sessionPrice ? 'border-red-300' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.sessionPrice}
              aria-describedby={errors.sessionPrice ? 'session-price-error' : undefined}
            />
          </div>
          {errors.sessionPrice && (
            <p id="session-price-error" className="text-red-600 text-sm mt-1">{errors.sessionPrice}</p>
          )}
        </div>

        {/* Precio seguimiento */}
        <div>
          <label htmlFor="followup-price" className="block text-sm font-medium text-gray-700 mb-1">
            Sesión de seguimiento (30 min)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {currencySymbol}
            </span>
            <input
              id="followup-price"
              type="text"
              value={formData.followUpPrice}
              onChange={(e) => handleInputChange('followUpPrice', e.target.value)}
              placeholder="0.00"
              className={`
                w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent
                ${errors.followUpPrice ? 'border-red-300' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.followUpPrice}
              aria-describedby={errors.followUpPrice ? 'followup-price-error' : undefined}
            />
          </div>
          {errors.followUpPrice && (
            <p id="followup-price-error" className="text-red-600 text-sm mt-1">{errors.followUpPrice}</p>
          )}
        </div>

        {/* Precio pack */}
        <div>
          <label htmlFor="package-price" className="block text-sm font-medium text-gray-700 mb-1">
            Pack 4 sesiones
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {currencySymbol}
            </span>
            <input
              id="package-price"
              type="text"
              value={formData.packagePrice}
              onChange={(e) => handleInputChange('packagePrice', e.target.value)}
              placeholder="0.00"
              className={`
                w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent
                ${errors.packagePrice ? 'border-red-300' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.packagePrice}
              aria-describedby={errors.packagePrice ? 'package-price-error' : undefined}
            />
          </div>
          {errors.packagePrice && (
            <p id="package-price-error" className="text-red-600 text-sm mt-1">{errors.packagePrice}</p>
          )}
        </div>
      </div>

      {/* Vista previa */}
      {(formData.sessionPrice || formData.followUpPrice || formData.packagePrice || formData.coupleSessionPrice) && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Vista previa de tarifas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.sessionPrice && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sesión individual:</span>
                <span className="font-semibold text-deep">
                  {currencySymbol}{formatDisplayPrice(formData.sessionPrice)}
                </span>
              </div>
            )}
            {formData.followUpPrice && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sesión de seguimiento:</span>
                <span className="font-semibold text-deep">
                  {currencySymbol}{formatDisplayPrice(formData.followUpPrice)}
                </span>
              </div>
            )}
            {formData.packagePrice && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pack 4 sesiones:</span>
                <span className="font-semibold text-deep">
                  {currencySymbol}{formatDisplayPrice(formData.packagePrice)}
                </span>
              </div>
            )}
          </div>
          
          {formData.sessionPrice && formData.packagePrice && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Ahorro con pack:</span>
                <span className="font-semibold text-sage">
                  {currencySymbol}{formatDisplayPrice((parseFloat(formData.sessionPrice) * 4 - parseFloat(formData.packagePrice)).toFixed(2))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Define tus tarifas para sesiones individuales y packs. Los precios se mostrarán públicamente en tu perfil.
      </p>
    </div>
  );
};