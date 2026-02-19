import React, { useState } from 'react';
import { Button } from '../../../components/Button';
import { Package, Ticket, Check } from 'lucide-react';

const PricingPackages = ({ packages = [], coupons = [], onChange, isEditing, editButton = null }) => {
  const [activeTab, setActiveTab] = useState('packages');
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    description: '',
    sessions: 1,
    originalPrice: '',
    discountedPrice: '',
    validityDays: 90,
    isActive: true,
    features: []
  });

  const [couponFormData, setCouponFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage', // percentage or fixed
    discountValue: '',
    minAmount: '',
    maxUses: '',
    usedCount: 0,
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicableServices: []
  });

  const serviceTypes = [
    { value: 'individual', label: 'Sesión Individual' },
    { value: 'couple', label: 'Terapia de Pareja' },
    { value: 'followup', label: 'Sesión de Seguimiento' },
    { value: 'package', label: 'Paquetes' }
  ];

  // Package handlers
  const resetPackageForm = () => {
    setPackageFormData({
      name: '',
      description: '',
      sessions: 1,
      originalPrice: '',
      discountedPrice: '',
      validityDays: 90,
      isActive: true,
      features: []
    });
    setEditingPackage(null);
    setShowPackageForm(false);
  };

  const handleAddPackage = () => {
    setPackageFormData({
      name: '',
      description: '',
      sessions: 1,
      originalPrice: '',
      discountedPrice: '',
      validityDays: 90,
      isActive: true,
      features: []
    });
    setEditingPackage(null);
    setShowPackageForm(true);
  };

  const handleEditPackage = (pkg) => {
    setPackageFormData(pkg);
    setEditingPackage(pkg.id);
    setShowPackageForm(true);
  };

  const handleSavePackage = () => {
    if (!packageFormData.name.trim() || !packageFormData.originalPrice || !packageFormData.discountedPrice) {
      alert('Por favor, completa los campos obligatorios.');
      return;
    }

    if (parseFloat(packageFormData.discountedPrice) >= parseFloat(packageFormData.originalPrice)) {
      alert('El precio con descuento debe ser menor al precio original.');
      return;
    }

    const newPackage = {
      ...packageFormData,
      id: editingPackage || Date.now(),
      originalPrice: parseFloat(packageFormData.originalPrice),
      discountedPrice: parseFloat(packageFormData.discountedPrice)
    };

    let updatedPackages;
    if (editingPackage) {
      updatedPackages = packages.map(pkg => 
        pkg.id === editingPackage ? newPackage : pkg
      );
    } else {
      updatedPackages = [...packages, newPackage];
    }

    onChange({ packages: updatedPackages, coupons });
    resetPackageForm();
  };

  const handleDeletePackage = (packageId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este paquete?')) {
      const updatedPackages = packages.filter(pkg => pkg.id !== packageId);
      onChange({ packages: updatedPackages, coupons });
    }
  };

  // Coupon handlers
  const resetCouponForm = () => {
    setCouponFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minAmount: '',
      maxUses: '',
      usedCount: 0,
      validFrom: '',
      validUntil: '',
      isActive: true,
      applicableServices: []
    });
    setEditingCoupon(null);
    setShowCouponForm(false);
  };

  const handleAddCoupon = () => {
    setCouponFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minAmount: '',
      maxUses: '',
      usedCount: 0,
      validFrom: '',
      validUntil: '',
      isActive: true,
      applicableServices: []
    });
    setEditingCoupon(null);
    setShowCouponForm(true);
  };

  const handleEditCoupon = (coupon) => {
    setCouponFormData(coupon);
    setEditingCoupon(coupon.id);
    setShowCouponForm(true);
  };

  const handleSaveCoupon = () => {
    if (!couponFormData.code.trim() || !couponFormData.discountValue) {
      alert('Por favor, completa los campos obligatorios.');
      return;
    }

    // Validar que el código no exista
    const existingCoupon = coupons.find(c => 
      c.code.toLowerCase() === couponFormData.code.toLowerCase() && 
      c.id !== editingCoupon
    );
    if (existingCoupon) {
      alert('Ya existe un cupón con este código.');
      return;
    }

    const newCoupon = {
      ...couponFormData,
      id: editingCoupon || Date.now(),
      code: couponFormData.code.toUpperCase(),
      discountValue: parseFloat(couponFormData.discountValue),
      minAmount: couponFormData.minAmount ? parseFloat(couponFormData.minAmount) : null,
      maxUses: couponFormData.maxUses ? parseInt(couponFormData.maxUses) : null
    };

    let updatedCoupons;
    if (editingCoupon) {
      updatedCoupons = coupons.map(coupon => 
        coupon.id === editingCoupon ? newCoupon : coupon
      );
    } else {
      updatedCoupons = [...coupons, newCoupon];
    }

    onChange({ packages, coupons: updatedCoupons });
    resetCouponForm();
  };

  const handleDeleteCoupon = (couponId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cupón?')) {
      const updatedCoupons = coupons.filter(coupon => coupon.id !== couponId);
      onChange({ packages, coupons: updatedCoupons });
    }
  };

  const calculateSavings = (originalPrice, discountedPrice) => {
    const savings = originalPrice - discountedPrice;
    const percentage = ((savings / originalPrice) * 100).toFixed(0);
    return { savings, percentage };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const addPackageFeature = () => {
    setPackageFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updatePackageFeature = (index, value) => {
    setPackageFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removePackageFeature = (index) => {
    setPackageFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-deep">Paquetes y Cupones</h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona paquetes de sesiones con descuentos y cupones promocionales
          </p>
        </div>
        {editButton}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'packages'
                ? 'border-sage text-sage'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Paquetes ({packages.length})
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'coupons'
                ? 'border-sage text-sage'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cupones ({coupons.length})
          </button>
        </nav>
      </div>

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Crea paquetes de sesiones con precios especiales
            </p>
            {isEditing && (
              <Button
                onClick={handleAddPackage}
                className="bg-sage text-white hover:bg-sage/90"
              >
                + Crear Paquete
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => {
              const { savings, percentage } = calculateSavings(pkg.originalPrice, pkg.discountedPrice);
              return (
                <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-deep">{pkg.name}</h4>
                        {!pkg.isActive && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-sage">€{pkg.discountedPrice}</span>
                        <span className="text-sm text-gray-500 line-through">€{pkg.originalPrice}</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          -{percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {pkg.sessions} {pkg.sessions === 1 ? 'sesión' : 'sesiones'} • 
                        Válido por {pkg.validityDays} días
                      </p>
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="text-xs text-gray-600 space-y-1">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {isEditing && (
                      <div className="flex flex-col gap-1 ml-2">
                        <button
                          onClick={() => handleEditPackage(pkg)}
                          className="text-sage hover:text-sage/80 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {packages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <p>No hay paquetes creados</p>
              {isEditing && (
                <p className="text-sm mt-1">Haz clic en "Crear Paquete" para comenzar</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Crea cupones de descuento para promociones especiales
            </p>
            {isEditing && (
              <Button
                onClick={handleAddCoupon}
                className="bg-sage text-white hover:bg-sage/90"
              >
                + Crear Cupón
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-sage text-white px-3 py-1 rounded font-mono text-sm">
                        {coupon.code}
                      </span>
                      {!coupon.isActive && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{coupon.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Descuento: {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `€${coupon.discountValue}`}
                      </span>
                      {coupon.minAmount && (
                        <span>Mínimo: €{coupon.minAmount}</span>
                      )}
                      {coupon.maxUses && (
                        <span>Usos: {coupon.usedCount}/{coupon.maxUses}</span>
                      )}
                      {coupon.validFrom && coupon.validUntil && (
                        <span>
                          Válido: {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                        </span>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className="text-sage hover:text-sage/80 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {coupons.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Ticket className="h-6 w-6 text-gray-400" />
              </div>
              <p>No hay cupones creados</p>
              {isEditing && (
                <p className="text-sm mt-1">Haz clic en "Crear Cupón" para comenzar</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Package Form Modal */}
      {showPackageForm && isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-semibold text-deep mb-4">
              {editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Paquete *
                </label>
                <input
                  type="text"
                  value={packageFormData.name}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  placeholder="Ej: Bono 5 Sesiones"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={packageFormData.description}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  placeholder="Describe las ventajas de este paquete..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Sesiones *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={packageFormData.sessions}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, sessions: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Original *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={packageFormData.originalPrice}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                    placeholder="400.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio con Descuento *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={packageFormData.discountedPrice}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, discountedPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                    placeholder="350.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validez (días)
                </label>
                <input
                  type="number"
                  min="1"
                  value={packageFormData.validityDays}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, validityDays: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Características Incluidas
                  </label>
                  <Button
                    onClick={addPackageFeature}
                    variant="outline"
                    className="text-xs"
                  >
                    + Agregar
                  </Button>
                </div>
                <div className="space-y-2">
                  {packageFormData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updatePackageFeature(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                        placeholder="Ej: Sesiones de 60 minutos"
                      />
                      <button
                        onClick={() => removePackageFeature(index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={packageFormData.isActive}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Paquete activo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSavePackage}
                className="bg-sage text-white hover:bg-sage/90"
              >
                {editingPackage ? 'Actualizar' : 'Crear'} Paquete
              </Button>
              <Button
                onClick={resetPackageForm}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Form Modal */}
      {showCouponForm && isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-semibold text-deep mb-4">
              {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código del Cupón *
                  </label>
                  <input
                    type="text"
                    value={couponFormData.code}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent font-mono"
                    placeholder="DESCUENTO20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Descuento
                  </label>
                  <select
                    value={couponFormData.discountType}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Cantidad Fija (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={couponFormData.description}
                  onChange={(e) => setCouponFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  placeholder="Ej: Descuento especial para nuevos clientes"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor del Descuento *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={couponFormData.discountValue}
                      onChange={(e) => setCouponFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                      placeholder={couponFormData.discountType === 'percentage' ? '20' : '50.00'}
                    />
                    <span className="absolute right-3 top-2 text-gray-500 text-sm">
                      {couponFormData.discountType === 'percentage' ? '%' : '€'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compra Mínima
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={couponFormData.minAmount}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                    placeholder="100.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usos Máximos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponFormData.maxUses}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Válido Desde
                  </label>
                  <input
                    type="date"
                    value={couponFormData.validFrom}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Válido Hasta
                  </label>
                  <input
                    type="date"
                    value={couponFormData.validUntil}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={couponFormData.isActive}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Cupón activo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSaveCoupon}
                className="bg-sage text-white hover:bg-sage/90"
              >
                {editingCoupon ? 'Actualizar' : 'Crear'} Cupón
              </Button>
              <Button
                onClick={resetCouponForm}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { PricingPackages };