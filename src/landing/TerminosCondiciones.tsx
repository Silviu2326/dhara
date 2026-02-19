import React from 'react';
import { X } from 'lucide-react';

interface TerminosCondicionesProps {
  isOpen: boolean;
  onClose: () => void;
}
//
function TerminosCondiciones({ isOpen, onClose }: TerminosCondicionesProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-stone-200 px-8 py-6 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-2xl font-bold" style={{ color: '#8CA48F' }}>Términos y Condiciones de Uso</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-8 py-6 prose prose-stone max-w-none">
            <p className="text-sm text-stone-500 mb-6">Última actualización: 26 de enero de 2026</p>

            <h3 className="text-xl font-semibold mt-8 mb-4">1. Información General y Titularidad</h3>
            <p className="text-stone-600 leading-relaxed">
              En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se hace constar que la titularidad de la aplicación móvil (en adelante, la "App") y del nombre comercial App Dhara corresponde a Isabel Miralles Rubert, con DNI 24399337V y domicilio en Lliria, Valencia. Correo electrónico: info@dharadimensionhumana.es.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">2. Objeto de la Plataforma</h3>
            <p className="text-stone-600 mb-4">La App constituye un ecosistema digital de bienestar diseñado para facilitar:</p>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li>La búsqueda y localización de profesionales de terapias naturales.</li>
              <li>La gestión y registro de citas y reservas.</li>
              <li>El intercambio de documentos informativos entre profesional y usuario.</li>
              <li>La comunicación directa mediante chat interno para el seguimiento de sesiones activas.</li>
              <li>El acceso a material didáctico (Diccionario de Terapias).</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">3. Naturaleza Jurídica de los Servicios (Exclusión Sanitaria)</h3>
            <p className="text-stone-600 mb-4">El Usuario acepta expresamente que:</p>
            <ol className="list-decimal pl-6 space-y-2 text-stone-600">
              <li><strong>Carácter No Sanitario:</strong> La App es una plataforma de servicios de terapias naturales y holísticas. Los profesionales listados no ejercen profesiones sanitarias reguladas conforme a la Ley 44/2003.</li>
              <li><strong>No Sustitución Médica:</strong> El uso de la App y el contacto con sus profesionales no constituyen un diagnóstico médico. Se recomienda al Usuario no postergar ni ignorar el consejo médico profesional debido a la información obtenida a través de la App.</li>
            </ol>

            <h3 className="text-xl font-semibold mt-8 mb-4">4. Funcionalidades y Registro</h3>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Cuenta de Usuario:</strong> Para acceder a los servicios, el Usuario debe ser mayor de 18 años y registrarse facilitando nombre completo, email, teléfono y dirección. El Usuario es responsable de la custodia de sus credenciales.</li>
              <li><strong>Geolocalización:</strong> La función de mapa utiliza datos de ubicación en tiempo real. Esta función es facultativa y requiere el consentimiento previo del Usuario a través de los ajustes de su dispositivo.</li>
              <li><strong>Diccionario de Terapias:</strong> Es un contenido informativo de carácter general. La Titular no garantiza la exactitud absoluta de las definiciones ni su aplicabilidad clínica.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">5. Gestión de Documentos y Chat Interno</h3>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Custodia de Archivos:</strong> La App dispone de un área de "Documentos" donde el Usuario puede recibir archivos del profesional. El Usuario es responsable de descargar y custodiar dicha información. La Titular no se hace responsable de la pérdida de datos si el profesional causa baja en la plataforma.</li>
              <li><strong>Canal de Chat:</strong> El chat es una herramienta exclusiva para el seguimiento de sesiones activas. Queda prohibido el uso de este canal para el envío de contenido ilícito, ofensivo o spam. La Titular se reserva el derecho de acceso a los logs en caso de denuncia de abuso para garantizar la seguridad de la comunidad.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">6. Régimen Económico y Pagos mediante Stripe</h3>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Pasarela de Pago:</strong> La App integra la tecnología de Stripe para facilitar el pago de sesiones. La Titular actúa únicamente como mediador técnico.</li>
              <li><strong>Contratación:</strong> La relación contractual por la sesión de terapia se establece exclusivamente entre el Usuario y el Profesional.</li>
              <li><strong>Política de Devoluciones:</strong> El Usuario acepta que la gestión de cancelaciones y reembolsos se rige por la política específica de cada profesional, la cual debe ser aceptada de forma previa a la confirmación de la reserva.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">7. Sistema de Valoraciones y Control de Calidad</h3>
            <ul className="list-disc pl-6 space-y-2 text-stone-600">
              <li><strong>Feedback del Usuario:</strong> El Usuario podrá valorar mediante reseñas el servicio recibido. Estas deben ser honestas y respetuosas.</li>
              <li><strong>Moderación y Bloqueo:</strong> La Titular supervisa las valoraciones para mantener el estándar de calidad de la plataforma. La acumulación de reseñas negativas o la confirmación de malas praxis a través del soporte técnico podrá conllevar la expulsión inmediata del profesional de la plataforma.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">8. Limitación de Responsabilidad</h3>
            <p className="text-stone-600 mb-4">La Titular no será responsable de:</p>
            <ol className="list-decimal pl-6 space-y-2 text-stone-600">
              <li>Interrupciones del servicio por mantenimiento o causas ajenas.</li>
              <li>La veracidad de los títulos aportados por los profesionales (aunque se realice una revisión de buena fe).</li>
              <li>El uso indebido de los documentos compartidos entre profesional y usuario.</li>
              <li>La pérdida de datos en caso de que el profesional cierre su cuenta, por lo que se recomienda al usuario la descarga periódica de sus documentos.</li>
            </ol>

            <h3 className="text-xl font-semibold mt-8 mb-4">9. Propiedad Intelectual</h3>
            <p className="text-stone-600">
              Todo el software, diseño, algoritmos y contenidos de la App (incluyendo el Diccionario de Terapias) están protegidos por derechos de propiedad intelectual propiedad de la Titular. Queda prohibida la ingeniería inversa o la extracción de datos (scraping) sin autorización expresa.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">10. Legislación y Fuero</h3>
            <p className="text-stone-600">
              Estos términos se rigen por la ley española. Las partes se someten a los juzgados y tribunales de Valencia, salvo que por ley de protección de consumidores corresponda el domicilio del Usuario.
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

export default TerminosCondiciones;
