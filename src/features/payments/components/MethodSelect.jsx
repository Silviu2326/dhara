import React from 'react';
import { ChevronDown, CreditCard, Smartphone, Wallet } from 'lucide-react';

export const MethodSelect = ({ value, onChange }) => {
  const methodOptions = [
    { value: 'all', label: 'Todos los métodos', icon: null },
    { value: 'stripe', label: 'Stripe', icon: CreditCard },
    { value: 'bizum', label: 'Bizum', icon: Smartphone },
    { value: 'paypal', label: 'PayPal', icon: Wallet }
  ];

  const selectedMethod = methodOptions.find(opt => opt.value === value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">
        Método:
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent min-w-[140px]"
        >
          {methodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {selectedMethod?.icon && value !== 'all' && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <selectedMethod.icon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para mostrar iconos de método de pago
export const PaymentMethodIcon = ({ method, className = "h-4 w-4" }) => {
  const methodConfig = {
    stripe: { icon: CreditCard, color: 'text-blue-600' },
    bizum: { icon: Smartphone, color: 'text-green-600' },
    paypal: { icon: Wallet, color: 'text-blue-500' },
    card: { icon: CreditCard, color: 'text-gray-600' }
  };

  const config = methodConfig[method?.toLowerCase()] || methodConfig.card;
  const IconComponent = config.icon;

  return (
    <IconComponent className={`${className} ${config.color}`} />
  );
};

// Componente para mostrar el método de pago con icono y texto
export const PaymentMethodBadge = ({ method }) => {
  const methodConfig = {
    stripe: { label: 'Stripe', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    bizum: { label: 'Bizum', color: 'bg-green-50 text-green-700 border-green-200' },
    paypal: { label: 'PayPal', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    card: { label: 'Tarjeta', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  };

  const config = methodConfig[method?.toLowerCase()] || methodConfig.card;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
      config.color
    }`}>
      <PaymentMethodIcon method={method} className="h-3 w-3" />
      {config.label}
    </span>
  );
};