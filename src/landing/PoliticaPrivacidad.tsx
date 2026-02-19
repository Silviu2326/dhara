import React from 'react';
import { X } from 'lucide-react';

interface PoliticaPrivacidadProps {
  isOpen: boolean;
  onClose: () => void;
}

function PoliticaPrivacidad({ isOpen, onClose }: PoliticaPrivacidadProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-stone-200 px-8 py-6 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-2xl font-bold" style={{ color: '#8CA48F' }}>Política de Privacidad</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-8 py-6 prose prose-stone max-w-none">
            <p className="text-stone-600 leading-relaxed mb-6">
              Dhara cumple con los principios del Reglamento (UE) 2016/679 (RGPD) y de la LOPDGDD: licitud, lealtad, transparencia, minimización, limitación de finalidad, conservación limitada, exactitud, integridad y confidencialidad.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">1. RESPONSABLE DEL TRATAMIENTO</h3>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Identidad:</strong> Isabel Miralles Rubert</li>
              <li><strong>DNI:</strong> 24399337V</li>
              <li><strong>Nombre Comercial:</strong> App Dhara</li>
              <li><strong>Dirección:</strong> Llíria, Valencia</li>
              <li><strong>Email de contacto:</strong> info@dharadimensionhumana.es</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">2. TIPOLOGÍA DE DATOS RECOGIDOS</h3>
            <p className="text-stone-600 mb-4">Tratamos las siguientes categorías de datos:</p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Datos identificativos:</strong> Nombre, apellidos, dirección postal, dirección de correo electrónico y número de teléfono.</li>
              <li><strong>Datos de geolocalización:</strong> Coordenadas GPS para la búsqueda de profesionales cercanos (solo si se activa expresamente).</li>
              <li><strong>Datos de categoría especial (Salud/Bienestar):</strong> Información derivada del uso del chat, historial de reservas en terapias específicas y el contenido de los archivos recibidos en el apartado "Documentos".</li>
              <li><strong>Datos de transacciones:</strong> Información de pagos gestionada exclusivamente a través de la pasarela cifrada de Stripe.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">3. FINALIDADES DEL TRATAMIENTO</h3>
            <p className="text-stone-600 mb-4">Tus datos serán tratados para:</p>
            <ol className="list-decimal pl-6 space-y-2 text-stone-600">
              <li><strong>Gestión de la cuenta:</strong> Alta, mantenimiento y control del perfil de usuario.</li>
              <li><strong>Prestación del servicio:</strong> Facilitar la reserva de citas, el uso del mapa interactivo y la gestión del diccionario de terapias.</li>
              <li><strong>Gestión de comunicaciones:</strong> Facilitar el uso del chat interno entre usuario y profesional para el seguimiento de las sesiones.</li>
              <li><strong>Repositorio de documentos:</strong> Permitir la recepción y almacenamiento temporal de documentos enviados por el profesional.</li>
              <li><strong>Control de calidad:</strong> Monitorización de reseñas y gestión del soporte técnico.</li>
            </ol>

            <h3 className="text-xl font-semibold mt-8 mb-4">4. BASE JURÍDICA DE LEGITIMACIÓN</h3>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Ejecución de un contrato:</strong> Para la gestión de tu registro y el uso de las funcionalidades de la App.</li>
              <li><strong>Consentimiento explícito (Art. 9.2.a RGPD):</strong> Para el tratamiento de datos de salud/bienestar derivados de la reserva de terapias y el uso del chat/documentos. Este consentimiento se otorga mediante la marcación de la casilla de aceptación en el registro.</li>
              <li><strong>Consentimiento del interesado:</strong> Para la activación de la geolocalización y notificaciones, revocable en cualquier momento desde la configuración.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">5. PLAZO DE CONSERVACIÓN</h3>
            <p className="text-stone-600 mb-4">Los datos se conservarán mientras se mantenga la relación contractual.</p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Baja del Servicio:</strong> En caso de que el Usuario o el Profesional cancelen su cuenta, los datos asociados serán eliminados de la interfaz activa.</li>
              <li><strong>Bloqueo:</strong> No obstante, los datos permanecerán bloqueados durante los plazos de prescripción legal de responsabilidades (generalmente 5 años en materia civil/mercantil en España) antes de su supresión definitiva.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">6. DESTINATARIOS Y COMUNICACIONES DE DATOS</h3>
            <p className="text-stone-600 mb-4">Tus datos no se cederán a terceros, salvo en los siguientes supuestos:</p>
            <ol className="list-decimal pl-6 space-y-2 text-stone-600">
              <li><strong>A los Profesionales:</strong> Comunicación necesaria de tus datos de contacto para la prestación del servicio de terapia reservado.</li>
              <li><strong>A Stripe:</strong> Para la gestión de cobros y pagos.</li>
              <li><strong>Encargados de Tratamiento:</strong> Proveedores de servicios de alojamiento (hosting) y servicios en la nube que cumplan con el RGPD y operen dentro del Espacio Económico Europeo o en países con nivel de protección adecuado.</li>
            </ol>

            <h3 className="text-xl font-semibold mt-8 mb-4">7. DERECHOS DEL USUARIO</h3>
            <p className="text-stone-600 mb-4">Tienes derecho a ejercer en cualquier momento tus derechos de:</p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Acceso:</strong> Saber qué datos tratamos.</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos.</li>
              <li><strong>Supresión (Olvido):</strong> Solicitar la eliminación de tus datos.</li>
              <li><strong>Limitación:</strong> Solicitar que suspendamos temporalmente el tratamiento.</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado para trasladarlos a otro responsable.</li>
              <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos por motivos personales.</li>
            </ul>
            <p className="text-stone-600 mt-4">
              Para ejercer estos derechos, debes enviar un correo electrónico a <strong>info@dharadimensionhumana.es</strong> adjuntando una copia de tu DNI o documento equivalente para verificar tu identidad. Asimismo, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) si consideras que tus derechos han sido vulnerados.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">8. SEGURIDAD DE LOS DATOS</h3>
            <p className="text-stone-600">
              Implementamos medidas técnicas y organizativas (cifrado, firewalls, control de acceso) para garantizar la integridad de tus datos, especialmente en el chat y el repositorio de documentos, evitando su alteración, pérdida o acceso no autorizado.
            </p>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-stone-200 px-8 py-4 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full text-white font-semibold transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: '#8CA48F' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoliticaPrivacidad;
