import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { ChevronDownIcon, ChevronUpIcon, EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const FAQ_DATA = [
  {
    id: 1,
    question: "¿Cómo puedo programar una cita con un cliente?",
    answer: "Puedes programar una cita desde la sección 'Reservas' haciendo clic en 'Nueva cita' o desde el perfil del cliente en la tabla de clientes."
  },
  {
    id: 2,
    question: "¿Cómo gestiono los documentos de mis clientes?",
    answer: "En la sección 'Documentos y Materiales' puedes subir, organizar y compartir documentos con tus clientes de forma segura."
  },
  {
    id: 3,
    question: "¿Puedo personalizar mis tarifas por tipo de sesión?",
    answer: "Sí, en tu 'Perfil Profesional' puedes configurar diferentes tarifas para sesiones individuales, de seguimiento, paquetes y sesiones de pareja."
  },
  {
    id: 4,
    question: "¿Cómo funciona el sistema de pagos?",
    answer: "El sistema procesa pagos automáticamente después de cada sesión. Puedes ver el historial y generar reportes en la sección 'Pagos'."
  },
  {
    id: 5,
    question: "¿Puedo configurar mi disponibilidad?",
    answer: "Sí, en la sección 'Disponibilidad' puedes establecer tus horarios de trabajo, días libres y configurar tu calendario."
  },
  {
    id: 6,
    question: "¿Cómo accedo al historial de sesiones de un cliente?",
    answer: "Desde el perfil del cliente puedes ver todas sus sesiones, notas, documentos y historial de pagos en las pestañas correspondientes."
  }
];

const FAQItem = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <span className="font-medium text-gray-900">{faq.question}</span>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-600">{faq.answer}</p>
        </div>
      )}
    </div>
  );
};

export const HelpCenter = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-deep">Centro de Ayuda</h1>
        <p className="text-gray-600">Soporte y documentación</p>
      </div>
      
      {/* Preguntas Frecuentes */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-deep">Preguntas Frecuentes</h2>
          </div>
          
          <div className="space-y-4">
            {FAQ_DATA.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isOpen={openFAQ === faq.id}
                onToggle={() => toggleFAQ(faq.id)}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Contacto */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-deep">¿Necesitas más ayuda?</h2>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Contacta con nuestro equipo de soporte</h3>
            <p className="text-blue-800 mb-4">
              Si no encuentras la respuesta que buscas en nuestras preguntas frecuentes, 
              no dudes en contactarnos. Nuestro equipo estará encantado de ayudarte.
            </p>
            
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="h-5 w-5 text-blue-600" />
              <a 
                href="mailto:info@dharadimensionhumana.es" 
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                info@dharadimensionhumana.es
              </a>
            </div>
            
            <p className="text-sm text-blue-700 mt-3">
              Tiempo de respuesta habitual: 24-48 horas
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};