import React, { useState, useEffect, useRef } from 'react';

export const QuickCommands = ({
  onCommandSelect,
  onClose,
  searchTerm = '',
  isVisible = false,
  className = ''
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  // Comandos disponibles
  const commands = [
    {
      id: 'template-anxiety',
      command: '/plantilla ansiedad',
      shortcut: '/ansiedad',
      category: 'Plantillas',
      description: 'Plantilla para manejo de ansiedad',
      content: 'Recuerda que la ansiedad es temporal. Practica la respiración profunda: inhala por 4 segundos, mantén por 4, exhala por 6. ¿Cómo te sientes ahora?',
      icon: '🧘',
      tags: ['ansiedad', 'respiración', 'mindfulness']
    },
    {
      id: 'template-depression',
      command: '/plantilla depresión',
      shortcut: '/depresión',
      category: 'Plantillas',
      description: 'Plantilla para apoyo en depresión',
      content: 'Es importante reconocer tus sentimientos. Cada pequeño paso cuenta. ¿Qué actividad pequeña podrías hacer hoy que te haga sentir un poco mejor?',
      icon: '💙',
      tags: ['depresión', 'apoyo', 'actividades']
    },
    {
      id: 'template-stress',
      command: '/plantilla estrés',
      shortcut: '/estrés',
      category: 'Plantillas',
      description: 'Plantilla para manejo de estrés',
      content: 'El estrés es una respuesta natural. Vamos a trabajar juntos para encontrar estrategias que te ayuden. ¿Cuál es tu principal fuente de estrés ahora?',
      icon: '⚡',
      tags: ['estrés', 'estrategias', 'manejo']
    },
    {
      id: 'template-sleep',
      command: '/plantilla sueño',
      shortcut: '/sueño',
      category: 'Plantillas',
      description: 'Plantilla para problemas de sueño',
      content: 'Un buen descanso es fundamental para tu bienestar. Vamos a revisar tu rutina de sueño. ¿A qué hora sueles acostarte y levantarte?',
      icon: '🌙',
      tags: ['sueño', 'rutina', 'descanso']
    },
    {
      id: 'template-relationships',
      command: '/plantilla relaciones',
      shortcut: '/relaciones',
      category: 'Plantillas',
      description: 'Plantilla para temas de relaciones',
      content: 'Las relaciones pueden ser complejas. Es normal tener altibajos. ¿Qué aspecto específico de tus relaciones te gustaría explorar?',
      icon: '👥',
      tags: ['relaciones', 'comunicación', 'vínculos']
    },
    {
      id: 'link-document',
      command: '/link documento',
      shortcut: '/doc',
      category: 'Enlaces',
      description: 'Insertar enlace a documento',
      content: '[Documento de ejercicios](https://ejemplo.com/documento) - Te he compartido algunos ejercicios que pueden ayudarte.',
      icon: '📄',
      tags: ['documento', 'enlace', 'recursos']
    },
    {
      id: 'link-video',
      command: '/link video',
      shortcut: '/video',
      category: 'Enlaces',
      description: 'Insertar enlace a video educativo',
      content: '[Video: Técnicas de relajación](https://ejemplo.com/video) - Este video te ayudará a practicar técnicas de relajación.',
      icon: '🎥',
      tags: ['video', 'educativo', 'técnicas']
    },
    {
      id: 'schedule-session',
      command: '/programar sesión',
      shortcut: '/sesión',
      category: 'Acciones',
      description: 'Sugerir programar nueva sesión',
      content: 'Me parece que sería beneficioso programar una sesión adicional. ¿Tienes disponibilidad esta semana?',
      icon: '📅',
      tags: ['sesión', 'cita', 'programar']
    },
    {
      id: 'homework',
      command: '/tarea',
      shortcut: '/tarea',
      category: 'Acciones',
      description: 'Asignar tarea terapéutica',
      content: 'Para nuestra próxima sesión, me gustaría que practiques [ejercicio específico]. ¿Te parece factible?',
      icon: '📝',
      tags: ['tarea', 'ejercicio', 'práctica']
    },
    {
      id: 'check-in',
      command: '/check-in',
      shortcut: '/check',
      category: 'Evaluación',
      description: 'Pregunta de seguimiento',
      content: '¿Cómo te has sentido desde nuestra última conversación? En una escala del 1 al 10, ¿cómo calificarías tu estado de ánimo hoy?',
      icon: '📊',
      tags: ['seguimiento', 'evaluación', 'estado']
    },
    {
      id: 'emergency',
      command: '/emergencia',
      shortcut: '/emergencia',
      category: 'Urgente',
      description: 'Protocolo de emergencia',
      content: 'Si estás en crisis, por favor contacta inmediatamente: Línea de Crisis 24h: 911 o acude a urgencias. Tu seguridad es lo más importante.',
      icon: '🚨',
      tags: ['emergencia', 'crisis', 'urgente']
    },
    {
      id: 'breathing',
      command: '/respiración',
      shortcut: '/respirar',
      category: 'Técnicas',
      description: 'Ejercicio de respiración',
      content: 'Vamos a hacer un ejercicio de respiración juntos: Inhala lentamente por 4 segundos... Mantén el aire por 4 segundos... Exhala por 6 segundos... Repite 3 veces más.',
      icon: '🫁',
      tags: ['respiración', 'relajación', 'técnica']
    }
  ];

  // Filtrar comandos basado en el término de búsqueda
  const filteredCommands = commands.filter(cmd => {
    const term = searchTerm.toLowerCase();
    return (
      cmd.command.toLowerCase().includes(term) ||
      cmd.shortcut.toLowerCase().includes(term) ||
      cmd.description.toLowerCase().includes(term) ||
      cmd.tags.some(tag => tag.toLowerCase().includes(term))
    );
  });

  // Agrupar comandos por categoría
  const groupedCommands = filteredCommands.reduce((groups, cmd) => {
    const category = cmd.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(cmd);
    return groups;
  }, {});

  // Manejar navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onCommandSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, filteredCommands, onCommandSelect, onClose]);

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // Reset del índice seleccionado cuando cambian los comandos filtrados
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  if (!isVisible || filteredCommands.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto ${className}`}
    >
      {/* Header */}
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Comandos rápidos</h3>
          <div className="text-xs text-gray-500">
            {filteredCommands.length} comando{filteredCommands.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Comandos agrupados */}
      <div className="p-2">
        {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
          <div key={category} className="mb-4 last:mb-0">
            {/* Título de categoría */}
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {category}
            </div>
            
            {/* Comandos de la categoría */}
            <div className="space-y-1">
              {categoryCommands.map((command, categoryIndex) => {
                const globalIndex = filteredCommands.indexOf(command);
                const isSelected = globalIndex === selectedIndex;
                
                return (
                  <button
                    key={command.id}
                    ref={el => itemRefs.current[globalIndex] = el}
                    onClick={() => onCommandSelect(command)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-all duration-200
                      ${isSelected 
                        ? 'bg-sage-50 border-sage-200 border' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icono */}
                      <div className="text-lg flex-shrink-0 mt-0.5">
                        {command.icon}
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`
                            text-sm font-medium
                            ${isSelected ? 'text-sage-900' : 'text-gray-900'}
                          `}>
                            {command.command}
                          </span>
                          {command.shortcut !== command.command && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {command.shortcut}
                            </span>
                          )}
                        </div>
                        
                        <p className={`
                          text-xs mt-1 line-clamp-2
                          ${isSelected ? 'text-sage-700' : 'text-gray-600'}
                        `}>
                          {command.description}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {command.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag}
                              className={`
                                text-xs px-1.5 py-0.5 rounded-full
                                ${isSelected 
                                  ? 'bg-sage-100 text-sage-600' 
                                  : 'bg-gray-100 text-gray-600'
                                }
                              `}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Indicador de selección */}
                      {isSelected && (
                        <div className="flex-shrink-0 text-sage-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer con ayuda */}
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>↑↓ Navegar</span>
            <span>Enter Seleccionar</span>
            <span>Esc Cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para manejar comandos rápidos
export const useQuickCommands = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentCommands, setRecentCommands] = useState([]);

  // Cargar comandos recientes del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quickCommands_recent');
    if (saved) {
      try {
        setRecentCommands(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent commands:', e);
      }
    }
  }, []);

  // Guardar comando usado
  const saveRecentCommand = (command) => {
    const updated = [
      command,
      ...recentCommands.filter(cmd => cmd.id !== command.id)
    ].slice(0, 10); // Mantener solo los últimos 10
    
    setRecentCommands(updated);
    localStorage.setItem('quickCommands_recent', JSON.stringify(updated));
  };

  const showCommands = (term = '') => {
    setSearchTerm(term);
    setIsVisible(true);
  };

  const hideCommands = () => {
    setIsVisible(false);
    setSearchTerm('');
  };

  const selectCommand = (command) => {
    saveRecentCommand(command);
    hideCommands();
    return command;
  };

  return {
    isVisible,
    searchTerm,
    recentCommands,
    showCommands,
    hideCommands,
    selectCommand,
    setSearchTerm
  };
};

// Componente de comandos recientes
export const RecentCommands = ({ 
  commands = [], 
  onCommandSelect,
  className = '' 
}) => {
  if (commands.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="px-3 py-2 border-b border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
          Comandos recientes
        </h4>
      </div>
      
      <div className="p-2 space-y-1">
        {commands.slice(0, 5).map(command => (
          <button
            key={command.id}
            onClick={() => onCommandSelect(command)}
            className="w-full text-left p-2 hover:bg-gray-50 rounded-md transition-colors duration-200 group"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">{command.icon}</span>
              <span className="text-sm font-medium text-gray-900 group-hover:text-sage-600">
                {command.shortcut}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {command.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickCommands;