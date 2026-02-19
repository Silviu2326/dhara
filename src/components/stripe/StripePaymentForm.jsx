import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../Button';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

/**
 * Formulario de pago con Stripe Elements
 *
 * Props:
 * - amount: Monto a pagar
 * - clientSecret: Client secret del Payment Intent
 * - onSuccess: Callback cuando el pago es exitoso
 * - onError: Callback cuando hay un error
 */
export const StripePaymentForm = ({ amount, clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirmar pago con Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/success`,
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSuccess(true);

        if (onSuccess) {
          onSuccess({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            status: paymentIntent.status
          });
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Error al procesar el pago');

      if (onError) {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'ideal']
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">¡Pago procesado exitosamente!</p>
        </div>
      )}

      {/* Payment summary */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">Total a pagar:</span>
        <span className="text-2xl font-bold text-deep">
          €{typeof amount === 'number' ? amount.toFixed(2) : '0.00'}
        </span>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing || success}
        className="w-full bg-sage text-white rounded-lg py-3 px-4 font-medium hover:bg-sage/90 focus:ring-2 focus:ring-sage focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Procesando pago...</span>
          </div>
        ) : success ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Pago completado</span>
          </div>
        ) : (
          `Pagar €${typeof amount === 'number' ? amount.toFixed(2) : '0.00'}`
        )}
      </Button>

      {/* Security note */}
      <p className="text-xs text-center text-gray-500">
        🔒 Pago seguro procesado por Stripe. Tu información de pago está protegida.
      </p>
    </form>
  );
};

export default StripePaymentForm;
