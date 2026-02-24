import React, { useState } from 'react';
import { XMarkIcon, ClipboardIcon, CheckIcon, ShareIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

export const InvitationCodeModal = ({
  isOpen,
  onClose,
  client,
  invitationCode,
  onSendEmail,
  onRegenerateCode
}) => {
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen || !client) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!client.email) return;
    
    setSendingEmail(true);
    try {
      await onSendEmail(client.id, invitationCode);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Invitación a DharaTerapeutas',
      text: `Hola ${client.name}, tu terapeuta te ha invitado a unirte a DharaTerapeutas. Usa este código: ${invitationCode}`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyCode();
    }
  };

  const appUrl = window.location.origin;
  const fullInvitationMessage = `Hola ${client.name},

Tu terapeuta te ha invitado a unirte a DharaTerapeutas.

Código de invitación: ${invitationCode}

Para comenzar, visita: ${appUrl}/registro-cliente

O descarga nuestra app e introduce el código cuando te lo solicite.

¡Nos vemos pronto!
Equipo DharaTerapeutas`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Código de Invitación</h2>
            <p className="text-sm text-gray-600">
              Cliente: {client.name}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Mensaje explicativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Comparte este código con <strong>{client.name}</strong> para que pueda crear su cuenta 
              en la app de clientes y acceder a sus sesiones, documentos y comunicarse contigo.
            </p>
          </div>

          {/* Código de invitación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de invitación
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={invitationCode}
                  readOnly
                  className="block w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-wider bg-gray-50 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                className="flex items-center gap-2 px-4"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-5 w-5 text-green-600" />
                    <span className="hidden sm:inline">Copiado</span>
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Este código es único y vinculado a este cliente. Caduca en 30 días.
            </p>
          </div>

          {/* Mensaje completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje completo
            </label>
            <textarea
              value={fullInvitationMessage}
              readOnly
              rows={8}
              className="block w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none resize-none"
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            {client.email && (
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || emailSent}
                loading={sendingEmail}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <EnvelopeIcon className="h-5 w-5" />
                {emailSent ? '¡Email enviado!' : 'Enviar por email'}
              </Button>
            )}
            
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <ShareIcon className="h-5 w-5" />
              Compartir
            </Button>
            
            {onRegenerateCode && (
              <Button
                onClick={onRegenerateCode}
                variant="ghost"
                className="flex-1"
              >
                Generar nuevo código
              </Button>
            )}
          </div>

          {/* Instrucciones */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">¿Cómo usar el código?</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>El cliente descarga la app o visita la web</li>
              <li>Selecciona "Registrarme como cliente"</li>
              <li>Introduce sus datos y el código de invitación</li>
              <li>¡Listo! Ya puede acceder a su perfil</li>
            </ol>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
