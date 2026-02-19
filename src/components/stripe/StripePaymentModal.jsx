import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { stripeService } from '../../services/api/stripeService';
import { X, Loader } from 'lucide-react';

/**
 * Modal de pago con Stripe
 *
 * Props:
 * - isOpen: Boolean para mostrar/ocultar modal
 * - onClose: Callback para cerrar modal
 * - amount: Monto a pagar
 * - clientId: ID del cliente
 * - bookingId: ID de la reserva (opcional)
 * - description: Descripción del pago
 * - onSuccess: Callback cuando el pago es exitoso
 * - onError: Callback cuando hay un error
 */
export const StripePaymentModal = ({
  isOpen,
  onClose,
  amount,
  clientId,
  bookingId,
  description,
  onSuccess,
  onError
}) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar Stripe
  useEffect(() => {
    try {
      const publishableKey = stripeService.getPublishableKey();
      setStripePromise(loadStripe(publishableKey));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Crear Payment Intent cuando se abre el modal
  useEffect(() => {
    if (isOpen && amount && clientId) {
      createPaymentIntent();
    }
  }, [isOpen, amount, clientId]);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await stripeService.createPaymentIntent({
        amount,
        clientId,
        bookingId,
        description: description || `Pago de €${amount}`,
        currency: 'eur'
      });

      if (result.success) {
        setClientSecret(result.data.clientSecret);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err.message || 'Error al iniciar el pago');

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (paymentData) => {
    // Confirmar pago en el backend
    const result = await stripeService.confirmPayment(paymentData.paymentIntentId);

    if (result.success && onSuccess) {
      onSuccess({
        ...paymentData,
        ...result.data
      });
    }

    // Cerrar modal después de 2 segundos
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleError = (err) => {
    if (onError) {
      onError(err);
    }
  };

  if (!isOpen) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#7BA888', // sage color
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px'
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-deep">Realizar Pago</h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-sage animate-spin mb-4" />
              <p className="text-gray-600">Preparando pago...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-500 mb-4">
                <X className="w-12 h-12" />
              </div>
              <p className="text-red-600 text-center">{error}</p>
              <button
                onClick={createPaymentIntent}
                className="mt-4 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage/90 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : stripePromise && clientSecret ? (
            <Elements stripe={stripePromise} options={options}>
              <StripePaymentForm
                amount={amount}
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StripePaymentModal;
