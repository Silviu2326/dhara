import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { getCurrentPlan, upgradePlan } from '../plansSubscription/plansSubscription.api';
import { CreditCard, AlertTriangle, CheckCircle, X } from 'lucide-react';

export const AccountSettings = () => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const planData = await getCurrentPlan();
      setCurrentPlan(planData);
    } catch (error) {
      console.error('Error loading current plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    setActionLoading(true);
    try {
      // Simular cancelación del plan
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentPlan({ ...currentPlan, status: 'cancelled' });
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling plan:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePlan = async (newPlanId) => {
    setActionLoading(true);
    try {
      await upgradePlan(newPlanId);
      // Recargar información del plan
      await loadCurrentPlan();
      setShowChangeModal(false);
    } catch (error) {
      console.error('Error changing plan:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getPlanDisplayName = (plan) => {
    const planNames = {
      'basic': 'Plan Básico',
      'professional': 'Plan Profesional',
      'premium': 'Plan Premium'
    };
    return planNames[plan] || plan;
  };

  const getPlanColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-deep">Configuración de Cuenta</h1>
        <p className="text-gray-600">Gestiona tu cuenta y preferencias</p>
      </div>
      
      <Card>
        <h2 className="text-xl font-semibold text-deep mb-4">Configuración General</h2>
        <p className="text-gray-600">Actualiza tu información personal y preferencias de la cuenta.</p>
      </Card>

      {/* Nueva sección de gestión de planes */}
      <Card>
        <div className="flex items-center mb-4">
          <CreditCard className="w-6 h-6 text-sage mr-3" />
          <h2 className="text-xl font-semibold text-deep">Plan de Suscripción</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
            <span className="ml-3 text-gray-600">Cargando información del plan...</span>
          </div>
        ) : currentPlan ? (
          <div className="space-y-6">
            {/* Información del plan actual */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  {getPlanDisplayName(currentPlan.plan)}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(currentPlan.status)}`}>
                  {currentPlan.status === 'active' ? 'Activo' : 
                   currentPlan.status === 'cancelled' ? 'Cancelado' : 
                   currentPlan.status === 'suspended' ? 'Suspendido' : currentPlan.status}
                </span>
              </div>
              
              {currentPlan.status === 'active' && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Acceso completo a todas las funcionalidades</p>
                  <p>• Soporte técnico prioritario</p>
                  <p>• Gestión ilimitada de clientes y planes</p>
                </div>
              )}
              
              {currentPlan.status === 'cancelled' && (
                <div className="flex items-center text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span>Tu plan ha sido cancelado. El acceso se mantendrá hasta el final del período de facturación.</span>
                </div>
              )}
            </div>

            {/* Acciones del plan */}
            {currentPlan.status === 'active' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowChangeModal(true)}
                  className="flex-1"
                >
                  Cambiar Plan
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1"
                >
                  Cancelar Suscripción
                </Button>
              </div>
            )}
            
            {currentPlan.status === 'cancelled' && (
              <Button
                variant="primary"
                onClick={() => setShowChangeModal(true)}
                className="w-full"
              >
                Reactivar Suscripción
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se pudo cargar la información del plan</p>
          </div>
        )}
      </Card>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Cancelar Suscripción</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a todas las funcionalidades premium al final del período de facturación actual.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="flex-1"
              >
                Mantener Plan
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelPlan}
                loading={actionLoading}
                className="flex-1"
              >
                Confirmar Cancelación
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cambio de plan */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Cambiar Plan de Suscripción</h3>
              <button
                onClick={() => setShowChangeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Plan Básico */}
              <div className="border rounded-lg p-4 hover:border-sage transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Plan Básico</h4>
                    <p className="text-sm text-gray-600">Funcionalidades esenciales para empezar</p>
                    <p className="text-lg font-semibold text-sage mt-2">€29/mes</p>
                  </div>
                  <Button
                    variant={currentPlan?.plan === 'basic' ? 'ghost' : 'outline'}
                    onClick={() => currentPlan?.plan !== 'basic' && handleChangePlan('basic')}
                    disabled={currentPlan?.plan === 'basic' || actionLoading}
                  >
                    {currentPlan?.plan === 'basic' ? 'Plan Actual' : 'Seleccionar'}
                  </Button>
                </div>
              </div>
              
              {/* Plan Profesional */}
              <div className="border rounded-lg p-4 hover:border-sage transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Plan Profesional</h4>
                    <p className="text-sm text-gray-600">Todas las funcionalidades para profesionales</p>
                    <p className="text-lg font-semibold text-sage mt-2">€59/mes</p>
                  </div>
                  <Button
                    variant={currentPlan?.plan === 'professional' ? 'ghost' : 'outline'}
                    onClick={() => currentPlan?.plan !== 'professional' && handleChangePlan('professional')}
                    disabled={currentPlan?.plan === 'professional' || actionLoading}
                  >
                    {currentPlan?.plan === 'professional' ? 'Plan Actual' : 'Seleccionar'}
                  </Button>
                </div>
              </div>
              
              {/* Plan Premium */}
              <div className="border rounded-lg p-4 hover:border-sage transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Plan Premium</h4>
                    <p className="text-sm text-gray-600">Funcionalidades avanzadas y soporte prioritario</p>
                    <p className="text-lg font-semibold text-sage mt-2">€99/mes</p>
                  </div>
                  <Button
                    variant={currentPlan?.plan === 'premium' ? 'ghost' : 'outline'}
                    onClick={() => currentPlan?.plan !== 'premium' && handleChangePlan('premium')}
                    disabled={currentPlan?.plan === 'premium' || actionLoading}
                  >
                    {currentPlan?.plan === 'premium' ? 'Plan Actual' : 'Seleccionar'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Los cambios se aplicarán inmediatamente. Si cambias a un plan de menor precio, 
                se aplicará un crédito prorrateado a tu próxima factura.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};