import React, { useState } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { X, Search, Filter, Copy, Eye, Star } from 'lucide-react';

const TemplateLibrary = ({ isOpen, onClose, onSelectTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Plantillas predefinidas
  const templates = [
    {
      id: 'template_anxiety',
      name: 'Plan de Ansiedad Generalizada',
      category: 'ansiedad',
      description: 'Plantilla completa para el tratamiento de trastornos de ansiedad generalizada',
      duration: 12,
      sessionsPerWeek: 2,
      popularity: 5,
      usageCount: 156,
      objectives: [
        'Reducir niveles de ansiedad mediante técnicas de relajación',
        'Identificar y modificar pensamientos catastróficos',
        'Desarrollar estrategias de afrontamiento efectivas',
        'Mejorar la autoestima y confianza personal',
        'Establecer rutinas saludables de sueño y ejercicio'
      ],
      techniques: [
        'Terapia Cognitivo-Conductual (TCC)',
        'Técnicas de respiración diafragmática',
        'Relajación muscular progresiva',
        'Mindfulness y meditación',
        'Exposición gradual controlada',
        'Reestructuración cognitiva'
      ],
      homework: [
        'Diario de pensamientos ansiosos (registro ABC)',
        'Práctica diaria de respiración (10 minutos)',
        'Ejercicios de relajación muscular',
        'Meditación mindfulness (aplicación recomendada)',
        'Exposición gradual a situaciones temidas',
        'Registro de actividades placenteras'
      ],
      sessions: [
        { week: 1, topic: 'Evaluación inicial y psicoeducación sobre ansiedad' },
        { week: 2, topic: 'Técnicas de respiración y relajación básica' },
        { week: 3, topic: 'Identificación de pensamientos automáticos' },
        { week: 4, topic: 'Reestructuración cognitiva - Parte I' },
        { week: 5, topic: 'Reestructuración cognitiva - Parte II' },
        { week: 6, topic: 'Introducción al mindfulness' },
        { week: 7, topic: 'Exposición gradual - Planificación' },
        { week: 8, topic: 'Exposición gradual - Implementación' },
        { week: 9, topic: 'Manejo de recaídas y prevención' },
        { week: 10, topic: 'Fortalecimiento de estrategias aprendidas' },
        { week: 11, topic: 'Planificación del alta y seguimiento' },
        { week: 12, topic: 'Evaluación final y cierre' }
      ]
    },
    {
      id: 'template_depression',
      name: 'Recuperación de Depresión',
      category: 'depresion',
      description: 'Plantilla integral para el tratamiento de episodios depresivos mayores',
      duration: 16,
      sessionsPerWeek: 2,
      popularity: 4,
      usageCount: 89,
      objectives: [
        'Mejorar el estado de ánimo y reducir síntomas depresivos',
        'Aumentar la activación conductual y motivación',
        'Desarrollar una red de apoyo social sólida',
        'Establecer metas realistas y alcanzables',
        'Mejorar la autoestima y autocompasión',
        'Prevenir recaídas futuras'
      ],
      techniques: [
        'Terapia Cognitivo-Conductual',
        'Activación conductual',
        'Terapia interpersonal',
        'Técnicas de autocompasión',
        'Programación de actividades placenteras',
        'Técnicas de resolución de problemas'
      ],
      homework: [
        'Registro diario de estado de ánimo',
        'Programación de actividades diarias',
        'Ejercicio físico regular (30 min, 3 veces/semana)',
        'Conexión social programada',
        'Diario de gratitud',
        'Práctica de autocompasión'
      ],
      sessions: [
        { week: 1, topic: 'Evaluación inicial y establecimiento de metas' },
        { week: 2, topic: 'Psicoeducación sobre depresión' },
        { week: 3, topic: 'Activación conductual - Identificación de valores' },
        { week: 4, topic: 'Programación de actividades placenteras' },
        { week: 5, topic: 'Identificación de pensamientos negativos' },
        { week: 6, topic: 'Reestructuración cognitiva' },
        { week: 7, topic: 'Mejora de habilidades sociales' },
        { week: 8, topic: 'Resolución de problemas interpersonales' },
        { week: 9, topic: 'Autoestima y autocompasión' },
        { week: 10, topic: 'Manejo del estrés y relajación' },
        { week: 11, topic: 'Prevención de recaídas' },
        { week: 12, topic: 'Consolidación de aprendizajes' },
        { week: 13, topic: 'Planificación del futuro' },
        { week: 14, topic: 'Red de apoyo y recursos' },
        { week: 15, topic: 'Evaluación de progreso' },
        { week: 16, topic: 'Cierre y seguimiento' }
      ]
    },
    {
      id: 'template_couples',
      name: 'Terapia de Pareja Integral',
      category: 'pareja',
      description: 'Plantilla especializada para mejorar la comunicación y resolver conflictos en parejas',
      duration: 12,
      sessionsPerWeek: 1,
      popularity: 5,
      usageCount: 134,
      objectives: [
        'Mejorar la comunicación efectiva entre la pareja',
        'Resolver conflictos de manera constructiva',
        'Fortalecer la intimidad emocional y física',
        'Establecer límites y expectativas saludables',
        'Desarrollar habilidades de negociación',
        'Reconstruir la confianza mutua'
      ],
      techniques: [
        'Terapia Sistémica',
        'Comunicación asertiva',
        'Técnicas de negociación',
        'Ejercicios de empatía',
        'Terapia Emotivo-Focalizad (EFT)',
        'Técnicas de mindfulness para parejas'
      ],
      homework: [
        'Ejercicios de comunicación diarios (15 minutos)',
        'Tiempo de calidad programado sin distracciones',
        'Diario de gratitud compartido',
        'Práctica de escucha activa',
        'Actividades de conexión emocional',
        'Ejercicios de intimidad no sexual'
      ],
      sessions: [
        { week: 1, topic: 'Evaluación de la relación y establecimiento de metas' },
        { week: 2, topic: 'Patrones de comunicación actuales' },
        { week: 3, topic: 'Habilidades de comunicación efectiva' },
        { week: 4, topic: 'Manejo de conflictos - Parte I' },
        { week: 5, topic: 'Manejo de conflictos - Parte II' },
        { week: 6, topic: 'Intimidad emocional y conexión' },
        { week: 7, topic: 'Expectativas y límites en la relación' },
        { week: 8, topic: 'Reconstrucción de la confianza' },
        { week: 9, topic: 'Intimidad física y afectiva' },
        { week: 10, topic: 'Planificación del futuro juntos' },
        { week: 11, topic: 'Prevención de recaídas en conflictos' },
        { week: 12, topic: 'Consolidación y cierre' }
      ]
    },
    {
      id: 'template_trauma',
      name: 'Recuperación de Trauma',
      category: 'trauma',
      description: 'Plantilla especializada para el tratamiento de trastorno de estrés postraumático',
      duration: 20,
      sessionsPerWeek: 1,
      popularity: 4,
      usageCount: 67,
      objectives: [
        'Procesar y integrar la experiencia traumática',
        'Reducir síntomas de TEPT (flashbacks, pesadillas)',
        'Desarrollar estrategias de regulación emocional',
        'Reconstruir la sensación de seguridad',
        'Mejorar las relaciones interpersonales',
        'Restaurar la funcionalidad diaria'
      ],
      techniques: [
        'EMDR (Eye Movement Desensitization and Reprocessing)',
        'Terapia Cognitivo-Conductual centrada en trauma',
        'Técnicas de grounding y estabilización',
        'Terapia narrativa',
        'Mindfulness y regulación emocional',
        'Técnicas de exposición gradual'
      ],
      homework: [
        'Técnicas de grounding diarias',
        'Registro de triggers y respuestas',
        'Práctica de técnicas de relajación',
        'Escritura terapéutica (cuando esté listo)',
        'Ejercicios de mindfulness',
        'Actividades de autocuidado programadas'
      ],
      sessions: [
        { week: 1, topic: 'Evaluación inicial y establecimiento de seguridad' },
        { week: 2, topic: 'Psicoeducación sobre trauma y TEPT' },
        { week: 3, topic: 'Técnicas de estabilización y grounding' },
        { week: 4, topic: 'Regulación emocional básica' },
        { week: 5, topic: 'Identificación de triggers' },
        { week: 6, topic: 'Preparación para procesamiento del trauma' },
        { week: 7, topic: 'Procesamiento del trauma - Fase 1' },
        { week: 8, topic: 'Procesamiento del trauma - Fase 2' },
        { week: 9, topic: 'Integración de la experiencia' },
        { week: 10, topic: 'Reestructuración de creencias' },
        { week: 11, topic: 'Reconstrucción de la narrativa personal' },
        { week: 12, topic: 'Fortalecimiento de recursos internos' },
        { week: 13, topic: 'Mejora de relaciones interpersonales' },
        { week: 14, topic: 'Planificación del futuro' },
        { week: 15, topic: 'Prevención de recaídas' },
        { week: 16, topic: 'Consolidación de aprendizajes' },
        { week: 17, topic: 'Preparación para el alta' },
        { week: 18, topic: 'Evaluación final' },
        { week: 19, topic: 'Cierre terapéutico' },
        { week: 20, topic: 'Sesión de seguimiento' }
      ]
    },
    {
      id: 'template_addiction',
      name: 'Recuperación de Adicciones',
      category: 'adicciones',
      description: 'Plantilla integral para el tratamiento de trastornos por uso de sustancias',
      duration: 24,
      sessionsPerWeek: 2,
      popularity: 4,
      usageCount: 45,
      objectives: [
        'Lograr y mantener la abstinencia',
        'Desarrollar estrategias de prevención de recaídas',
        'Mejorar la motivación para el cambio',
        'Reconstruir relaciones familiares y sociales',
        'Desarrollar habilidades de afrontamiento saludables',
        'Establecer un estilo de vida equilibrado'
      ],
      techniques: [
        'Entrevista Motivacional',
        'Terapia Cognitivo-Conductual',
        'Prevención de recaídas',
        'Terapia de Aceptación y Compromiso (ACT)',
        'Mindfulness y meditación',
        'Terapia familiar sistémica'
      ],
      homework: [
        'Registro diario de craving y triggers',
        'Plan de prevención de recaídas personalizado',
        'Actividades alternativas saludables',
        'Ejercicio físico regular',
        'Participación en grupos de apoyo',
        'Práctica de técnicas de relajación'
      ],
      sessions: [
        { week: 1, topic: 'Evaluación inicial y motivación para el cambio' },
        { week: 2, topic: 'Psicoeducación sobre adicción' },
        { week: 3, topic: 'Identificación de triggers y patrones' },
        { week: 4, topic: 'Desarrollo de estrategias de afrontamiento' },
        { week: 5, topic: 'Manejo del craving' },
        { week: 6, topic: 'Reestructuración cognitiva' },
        { week: 7, topic: 'Habilidades sociales y comunicación' },
        { week: 8, topic: 'Manejo de emociones difíciles' },
        { week: 9, topic: 'Reconstrucción de relaciones' },
        { week: 10, topic: 'Prevención de recaídas - Parte I' },
        { week: 11, topic: 'Prevención de recaídas - Parte II' },
        { week: 12, topic: 'Evaluación de progreso intermedio' },
        { week: 13, topic: 'Fortalecimiento de la red de apoyo' },
        { week: 14, topic: 'Manejo del estrés y ansiedad' },
        { week: 15, topic: 'Desarrollo de intereses y hobbies' },
        { week: 16, topic: 'Planificación de objetivos a largo plazo' },
        { week: 17, topic: 'Manejo de situaciones de alto riesgo' },
        { week: 18, topic: 'Autoestima y autoeficacia' },
        { week: 19, topic: 'Preparación para situaciones desafiantes' },
        { week: 20, topic: 'Consolidación de estrategias' },
        { week: 21, topic: 'Evaluación final de progreso' },
        { week: 22, topic: 'Planificación del seguimiento' },
        { week: 23, topic: 'Cierre terapéutico' },
        { week: 24, topic: 'Sesión de seguimiento' }
      ]
    }
  ];

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'ansiedad', label: 'Ansiedad' },
    { value: 'depresion', label: 'Depresión' },
    { value: 'pareja', label: 'Terapia de Pareja' },
    { value: 'trauma', label: 'Trauma' },
    { value: 'adicciones', label: 'Adicciones' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template) => {
    const planData = {
      name: template.name,
      type: template.category,
      description: template.description,
      duration: template.duration,
      sessionsPerWeek: template.sessionsPerWeek,
      objectives: [...template.objectives],
      techniques: [...template.techniques],
      homework: [...template.homework],
      sessions: [...template.sessions]
    };
    
    onSelectTemplate(planData);
    onClose();
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Biblioteca de Plantillas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona una plantilla predefinida para crear tu plan terapéutico
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {categories.find(c => c.value === template.category)?.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(template.popularity)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {template.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duración:</span>
                    <span className="font-medium">{template.duration} semanas</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sesiones/semana:</span>
                    <span className="font-medium">{template.sessionsPerWeek}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Usado por:</span>
                    <span className="font-medium">{template.usageCount} terapeutas</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePreview(template)}
                    variant="outline"
                    className="flex-1 text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Vista Previa
                  </Button>
                  <Button
                    onClick={() => handleSelectTemplate(template)}
                    className="flex-1 text-sm"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Usar Plantilla
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron plantillas</h3>
              <p className="text-gray-600">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vista Previa: {selectedTemplate.name}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                    <p className="text-gray-600">{selectedTemplate.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Duración</h4>
                      <p className="text-gray-600">{selectedTemplate.duration} semanas</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Sesiones por semana</h4>
                      <p className="text-gray-600">{selectedTemplate.sessionsPerWeek}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Total sesiones</h4>
                      <p className="text-gray-600">{selectedTemplate.duration * selectedTemplate.sessionsPerWeek}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Objetivos del Plan</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {selectedTemplate.objectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Técnicas Terapéuticas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.techniques.map((technique, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {technique}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Tareas para Casa</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {selectedTemplate.homework.map((task, index) => (
                        <li key={index}>{task}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Estructura de Sesiones</h4>
                    <div className="space-y-2">
                      {selectedTemplate.sessions.map((session, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-16 text-sm font-medium text-gray-500">
                            Semana {session.week}
                          </div>
                          <div className="flex-1 text-sm text-gray-700">
                            {session.topic}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    handleSelectTemplate(selectedTemplate);
                    setShowPreview(false);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Usar Esta Plantilla
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { TemplateLibrary };