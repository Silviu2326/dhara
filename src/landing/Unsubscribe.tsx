import React, { useState, useEffect } from 'react';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import logoImage from './WhatsApp_Image_2025-08-15_at_13.59.22__1_-removebg-preview.png';

function Unsubscribe() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Obtener email de la URL si existe
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Error al procesar la baja');
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#8CA48F] to-[#6b856e] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">
          <div className="mb-8">
            <img src={logoImage} alt="Dhara" className="h-24 w-auto mx-auto mb-6" />
          </div>

          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>

          <h1 className="text-3xl font-bold mb-4 text-stone-800">
            ¡Lamentamos que te vayas!
          </h1>

          <p className="text-lg text-stone-600 mb-8 leading-relaxed">
            Tu baja ha sido procesada correctamente. Ya no recibirás más correos de nuestra parte.
          </p>

          <p className="text-sm text-stone-500 mb-8">
            Si cambias de opinión, siempre serás bienvenido de vuelta en Dhara.
          </p>

          <a
            href="/"
            className="inline-block px-8 py-4 rounded-full text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            style={{ backgroundColor: '#8CA48F' }}
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8CA48F] to-[#6b856e] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <img src={logoImage} alt="Dhara" className="h-24 w-auto mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-stone-800">
            Darse de baja
          </h1>
          <p className="text-stone-600 leading-relaxed">
            Lamentamos que dejes de formar parte de nuestra comunidad. Introduce tu correo para procesar tu baja.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-2">
              Correo electrónico *
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-[#8CA48F] transition-colors text-stone-800"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-stone-700 mb-2">
              Motivo de la baja (opcional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Cuéntanos por qué te das de baja... Tu opinión nos ayuda a mejorar."
              rows={4}
              className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-[#8CA48F] transition-colors resize-none text-stone-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ backgroundColor: '#8CA48F' }}
          >
            {loading ? 'Procesando...' : 'Confirmar baja'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          ¿Cambiaste de opinión?{' '}
          <a href="/" className="font-semibold hover:underline" style={{ color: '#8CA48F' }}>
            Volver al inicio
          </a>
        </p>
      </div>
    </div>
  );
}

export default Unsubscribe;
