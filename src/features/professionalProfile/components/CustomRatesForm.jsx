import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Clock, Users, Package, Edit, Check, X } from 'lucide-react';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano' }
];

const SESSION_TYPES = [
  { id: 'individual', name: 'Sesión Individual', icon: Users, defaultDuration: 50 },
  { id: 'couple', name: 'Sesión de Pareja', icon: Users, defaultDuration: 60 },
  { id: 'group', name: 'Sesión Grupal', icon: Users, defaultDuration: 90 },
  { id: 'consultation', name: 'Consulta Inicial', icon: Clock, defaultDuration: 30 },
  { id: 'followup', name: 'Sesión de Seguimiento', icon: Clock, defaultDuration: 30 },
  { id: 'online', name: 'Sesión Online', icon: Clock, defaultDuration: 50 }
];

export const CustomRatesForm = ({ rates = {}, onChange, isEditing = false }) => {
  const [currency, setCurrency] = useState('EUR');
  const [sessionRates, setSessionRates] = useState([]);
  const [packages, setPackages] = useState([]);
  const [editingSession, setEditingSession] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  useEffect(() => {
    // Inicializar con datos existentes o valores por defecto
    if (rates.customRates) {
      setSessionRates(rates.customRates.sessions || []);
      setPackages(rates.customRates.packages || []);
      setCurrency(rates.customRates.currency || 'EUR');
    } else {
      // Migrar datos del formato antiguo si existen
      const migratedSessions = [];

      if (rates.sessionPrice) {
        migratedSessions.push({
          id: 'session_1',
          type: 'individual',
          name: 'Sesión Individual',
          duration: 50,
          price: parseFloat(rates.sessionPrice),
          description: 'Sesión de terapia individual'
        });
      }

      if (rates.followUpPrice) {
        migratedSessions.push({
          id: 'session_2',
          type: 'followup',
          name: 'Sesión de Seguimiento',
          duration: 30,
          price: parseFloat(rates.followUpPrice),
          description: 'Sesión de seguimiento'
        });
      }

      if (rates.coupleSessionPrice) {
        migratedSessions.push({
          id: 'session_3',
          type: 'couple',
          name: 'Sesión de Pareja',
          duration: 60,
          price: parseFloat(rates.coupleSessionPrice),
          description: 'Sesión de terapia de pareja'
        });
      }

      setSessionRates(migratedSessions);

      // Migrar pack si existe
      if (rates.packagePrice) {
        setPackages([{
          id: 'package_1',
          name: 'Pack 4 Sesiones',
          sessions: 4,
          sessionType: 'individual',
          price: parseFloat(rates.packagePrice),
          description: 'Pack de 4 sesiones individuales'
        }]);
      }

      setCurrency(rates.currency || 'EUR');
    }
  }, [rates]);

  // Notificar cambios al componente padre
  const notifyChanges = (newSessions, newPackages, newCurrency) => {
    const customRates = {
      currency: newCurrency,
      sessions: newSessions,
      packages: newPackages
    };

    // Mantener compatibilidad con formato antiguo
    const legacyRates = {
      currency: newCurrency,
      customRates
    };

    // Buscar sesiones específicas para mantener compatibilidad
    const individualSession = newSessions.find(s => s.type === 'individual');
    const followupSession = newSessions.find(s => s.type === 'followup');
    const coupleSession = newSessions.find(s => s.type === 'couple');

    if (individualSession) legacyRates.sessionPrice = individualSession.price.toString();
    if (followupSession) legacyRates.followUpPrice = followupSession.price.toString();
    if (coupleSession) legacyRates.coupleSessionPrice = coupleSession.price.toString();

    // Pack de 4 sesiones individuales
    const pack4 = newPackages.find(p => p.sessions === 4 && p.sessionType === 'individual');
    if (pack4) legacyRates.packagePrice = pack4.price.toString();

    if (onChange) {
      onChange(legacyRates);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const currencySymbol = selectedCurrency?.symbol || '€';

  const addSession = () => {
    const newSession = {
      id: `session_${Date.now()}`,
      type: 'individual',
      name: 'Nueva Sesión',
      duration: 50,
      price: 60,
      description: 'Descripción de la sesión'
    };

    const newSessions = [...sessionRates, newSession];
    setSessionRates(newSessions);
    setEditingSession(newSession.id);
    notifyChanges(newSessions, packages, currency);
  };

  const addPackage = () => {
    const newPackage = {
      id: `package_${Date.now()}`,
      name: 'Nuevo Pack',
      sessions: 4,
      sessionType: sessionRates[0]?.type || 'individual',
      price: 200,
      description: 'Pack de sesiones con descuento'
    };

    const newPackages = [...packages, newPackage];
    setPackages(newPackages);
    setEditingPackage(newPackage.id);
    notifyChanges(sessionRates, newPackages, currency);
  };

  const updateSession = (sessionId, updates) => {
    const newSessions = sessionRates.map(session =>
      session.id === sessionId ? { ...session, ...updates } : session
    );
    setSessionRates(newSessions);
    notifyChanges(newSessions, packages, currency);
  };

  const updatePackage = (packageId, updates) => {
    const newPackages = packages.map(pkg =>
      pkg.id === packageId ? { ...pkg, ...updates } : pkg
    );
    setPackages(newPackages);
    notifyChanges(sessionRates, newPackages, currency);
  };

  const deleteSession = (sessionId) => {
    const newSessions = sessionRates.filter(session => session.id !== sessionId);
    setSessionRates(newSessions);
    notifyChanges(newSessions, packages, currency);
  };

  const deletePackage = (packageId) => {
    const newPackages = packages.filter(pkg => pkg.id !== packageId);
    setPackages(newPackages);
    notifyChanges(sessionRates, newPackages, currency);
  };

  const formatPrice = (price) => {
    return price?.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const calculatePackageSavings = (pkg) => {
    const sessionType = sessionRates.find(s => s.type === pkg.sessionType);
    if (!sessionType) return 0;

    const fullPrice = sessionType.price * pkg.sessions;
    const savings = fullPrice - pkg.price;
    return Math.max(0, savings);
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-sage" />
          <h3 className="text-lg font-semibold text-deep">Tarifas</h3>
        </div>

        {/* Sesiones */}
        {sessionRates.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700">Tipos de Sesión</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessionRates.map((session) => {
                const SessionIcon = SESSION_TYPES.find(t => t.id === session.type)?.icon || Clock;

                return (
                  <div key={session.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <SessionIcon className="h-4 w-4 text-sage" />
                      <span className="text-sm font-medium text-gray-700">
                        {session.name} ({session.duration} min)
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-deep">
                      {currencySymbol}{formatPrice(session.price)}
                    </div>
                    {session.description && (
                      <div className="text-xs text-gray-600 mt-1">{session.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Paquetes */}
        {packages.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700">Paquetes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => {
                const savings = calculatePackageSavings(pkg);
                const sessionType = sessionRates.find(s => s.type === pkg.sessionType);

                return (
                  <div key={pkg.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="h-4 w-4 text-sage" />
                      <span className="text-sm font-medium text-gray-700">
                        {pkg.name} ({pkg.sessions} sesiones)
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-deep">
                      {currencySymbol}{formatPrice(pkg.price)}
                    </div>
                    {sessionType && (
                      <div className="text-xs text-gray-600 mt-1">
                        Tipo: {sessionType.name}
                      </div>
                    )}
                    {savings > 0 && (
                      <div className="text-xs text-sage font-medium mt-1">
                        Ahorro: {currencySymbol}{formatPrice(savings)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sessionRates.length === 0 && packages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay tarifas configuradas</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-sage" />
          <h3 className="text-lg font-semibold text-deep">Tarifas Personalizadas</h3>
        </div>
      </div>

      {/* Selector de moneda */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 mb-2">
          Moneda
        </label>
        <select
          id="currency-select"
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value);
            notifyChanges(sessionRates, packages, e.target.value);
          }}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
        >
          {CURRENCIES.map(curr => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol} {curr.code} - {curr.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sesiones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-700">Tipos de Sesión</h4>
          <button
            onClick={addSession}
            className="flex items-center space-x-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Sesión</span>
          </button>
        </div>

        <div className="space-y-4">
          {sessionRates.map((session) => (
            <SessionEditor
              key={session.id}
              session={session}
              currencySymbol={currencySymbol}
              isEditing={editingSession === session.id}
              onEdit={() => setEditingSession(session.id)}
              onSave={() => setEditingSession(null)}
              onCancel={() => setEditingSession(null)}
              onUpdate={(updates) => updateSession(session.id, updates)}
              onDelete={() => deleteSession(session.id)}
            />
          ))}
        </div>
      </div>

      {/* Paquetes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-700">Paquetes</h4>
          <button
            onClick={addPackage}
            disabled={sessionRates.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Package className="h-4 w-4" />
            <span>Agregar Paquete</span>
          </button>
        </div>

        {sessionRates.length === 0 && (
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            Primero agrega al menos un tipo de sesión para poder crear paquetes
          </div>
        )}

        <div className="space-y-4">
          {packages.map((pkg) => (
            <PackageEditor
              key={pkg.id}
              package={pkg}
              sessionRates={sessionRates}
              currencySymbol={currencySymbol}
              isEditing={editingPackage === pkg.id}
              onEdit={() => setEditingPackage(pkg.id)}
              onSave={() => setEditingPackage(null)}
              onCancel={() => setEditingPackage(null)}
              onUpdate={(updates) => updatePackage(pkg.id, updates)}
              onDelete={() => deletePackage(pkg.id)}
              calculateSavings={calculatePackageSavings}
            />
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          💡 <strong>Consejo:</strong> Define diferentes tipos de sesión con sus duraciones y precios específicos.
          Luego crea paquetes con descuentos para ofrecer mejores precios por volumen.
        </p>
      </div>
    </div>
  );
};

// Componente para editar sesiones
const SessionEditor = ({
  session,
  currencySymbol,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onUpdate,
  onDelete
}) => {
  const [formData, setFormData] = useState(session);

  useEffect(() => {
    setFormData(session);
  }, [session]);

  const handleSave = () => {
    onUpdate(formData);
    onSave();
  };

  if (!isEditing) {
    const SessionIcon = SESSION_TYPES.find(t => t.id === session.type)?.icon || Clock;

    return (
      <div className="bg-white border border-gray-200 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SessionIcon className="h-5 w-5 text-sage" />
            <div>
              <h5 className="font-medium text-gray-900">{session.name}</h5>
              <p className="text-sm text-gray-600">
                {session.duration} min • {currencySymbol}{session.price}
              </p>
              {session.description && (
                <p className="text-xs text-gray-500 mt-1">{session.description}</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-sage transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Sesión
          </label>
          <select
            value={formData.type}
            onChange={(e) => {
              const selectedType = SESSION_TYPES.find(t => t.id === e.target.value);
              setFormData({
                ...formData,
                type: e.target.value,
                name: selectedType?.name || formData.name,
                duration: selectedType?.defaultDuration || formData.duration
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
          >
            {SESSION_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Personalizado
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración (minutos)
          </label>
          <input
            type="number"
            min="15"
            max="180"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio ({currencySymbol})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
            placeholder="Describe este tipo de sesión..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={onCancel}
          className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Cancelar</span>
        </button>
        <button
          onClick={handleSave}
          className="flex items-center space-x-1 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
        >
          <Check className="h-4 w-4" />
          <span>Guardar</span>
        </button>
      </div>
    </div>
  );
};

// Componente para editar paquetes
const PackageEditor = ({
  package: pkg,
  sessionRates,
  currencySymbol,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onUpdate,
  onDelete,
  calculateSavings
}) => {
  const [formData, setFormData] = useState(pkg);

  useEffect(() => {
    setFormData(pkg);
  }, [pkg]);

  const handleSave = () => {
    onUpdate(formData);
    onSave();
  };

  const savings = calculateSavings(isEditing ? formData : pkg);

  if (!isEditing) {
    const sessionType = sessionRates.find(s => s.type === pkg.sessionType);

    return (
      <div className="bg-white border border-gray-200 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-sage" />
            <div>
              <h5 className="font-medium text-gray-900">{pkg.name}</h5>
              <p className="text-sm text-gray-600">
                {pkg.sessions} sesiones • {currencySymbol}{pkg.price}
              </p>
              {sessionType && (
                <p className="text-xs text-gray-500">Tipo: {sessionType.name}</p>
              )}
              {savings > 0 && (
                <p className="text-xs text-sage font-medium">
                  Ahorro: {currencySymbol}{savings.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-sage transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Paquete
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad de Sesiones
          </label>
          <input
            type="number"
            min="2"
            max="20"
            value={formData.sessions}
            onChange={(e) => setFormData({ ...formData, sessions: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Sesión
          </label>
          <select
            value={formData.sessionType}
            onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
          >
            {sessionRates.map(session => (
              <option key={session.id} value={session.type}>
                {session.name} ({currencySymbol}{session.price})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio del Paquete ({currencySymbol})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage"
            placeholder="Describe este paquete..."
          />
        </div>

        {savings > 0 && (
          <div className="md:col-span-2 bg-green-100 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              💰 Este paquete ofrece un ahorro de {currencySymbol}{savings.toFixed(2)} comparado con comprar sesiones individuales
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={onCancel}
          className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Cancelar</span>
        </button>
        <button
          onClick={handleSave}
          className="flex items-center space-x-1 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
        >
          <Check className="h-4 w-4" />
          <span>Guardar</span>
        </button>
      </div>
    </div>
  );
};