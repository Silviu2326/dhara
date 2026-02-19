import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Servicio de Stripe para el frontend
 *
 * Funcionalidades:
 * - Crear Payment Intent
 * - Confirmar pagos
 * - Crear reembolsos
 */

class StripeService {
  /**
   * Crear un Payment Intent
   * @param {Object} data - Datos del pago
   * @param {number} data.amount - Monto en euros
   * @param {string} data.clientId - ID del cliente
   * @param {string} data.bookingId - ID de la reserva (opcional)
   * @param {string} data.description - Descripción del pago
   * @returns {Promise<Object>} Payment Intent creado
   */
  async createPaymentIntent(data) {
    try {
      const token = localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');

      const response = await axios.post(
        `${API_URL}/api/payments/stripe/create-intent`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }

      throw new Error(response.data.message || 'Error creating payment intent');
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Confirmar un pago después de procesarlo con Stripe
   * @param {string} paymentIntentId - ID del Payment Intent
   * @returns {Promise<Object>} Resultado de la confirmación
   */
  async confirmPayment(paymentIntentId) {
    try {
      const token = localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');

      const response = await axios.post(
        `${API_URL}/api/payments/stripe/confirm`,
        { paymentIntentId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }

      throw new Error(response.data.message || 'Error confirming payment');
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Crear un reembolso
   * @param {Object} data - Datos del reembolso
   * @param {string} data.paymentId - ID del pago en la base de datos
   * @param {number} data.amount - Monto a reembolsar (opcional)
   * @param {string} data.reason - Razón del reembolso
   * @returns {Promise<Object>} Resultado del reembolso
   */
  async createRefund(data) {
    try {
      const token = localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');

      const response = await axios.post(
        `${API_URL}/api/payments/stripe/refund`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }

      throw new Error(response.data.message || 'Error creating refund');
    } catch (error) {
      console.error('Error creating refund:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener la clave pública de Stripe
   * @returns {string} Clave pública de Stripe
   */
  getPublishableKey() {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!key) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY not configured');
      throw new Error('Stripe publishable key not configured');
    }

    return key;
  }
}

export const stripeService = new StripeService();
export default stripeService;
