import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { X, CheckCircle, Circle, Calendar, TrendingUp, FileText, Target, Clock, Award, AlertCircle } from 'lucide-react';

const ProgressTracker = ({ isOpen, onClose, client, plan }) => {
  const [activeTab, setActiveTab] = useState('objectives');
  const [progressData, setProgressData] = useState({
    objectives: [],
    sessions: [],
    homework: [],
    notes: []
  });
  const [newNote, setNewNote] = useState('');
  const [showReport, setShowReport] = useState(false);

  // Inicializar datos de progreso
  useEffect(() => {
    if (plan && client) {
      const initialObjectives = plan.objectives?.map((objective, index) => ({
        id: `obj_${index}`,
        text: objective,
        completed: false,
        completedDate: null,
        progress: 0,
        notes: ''
      })) || [];

      const initialSessions = plan.sessions?.map((session, index) => ({
        id: `session_${index}`,
        week: session.week,
        topic: session.topic,
        completed: false,
        completedDate: null,
        attendance: null, // 'attended', 'missed', 'cancelled'
        notes: '',
        rating: null // 1-5 stars
      })) || [];

      const initialHomework = plan.homework?.map((task, index) => ({
        id: `hw_${index}`,
        text: task,
        completed: false,
        completedDate: null,
        quality: null, // 'excellent', 'good', 'fair', 'poor'
        notes: ''
      })) || [];

      setProgressData({
        objectives: initialObjectives,
        sessions: initialSessions,
        homework: initialHomework,
        notes: [
          {
            id: 'note_1',
            date: new Date().toISOString(),
            text: 'Cliente iniciado en el plan terapéutico. Motivación inicial alta.',
            type: 'general'
          }
        ]
      });
    }
  }, [plan, client]);

  const toggleObjectiveCompletion = (objectiveId) => {
    setProgressData(prev => ({
      ...prev,
      objectives: prev.objectives.map(obj => 
        obj.id === objectiveId 
          ? { 
              ...obj, 
              completed: !obj.completed,
              completedDate: !obj.completed ? new Date().toISOString() : null
            }
          : obj
      )
    }));
  };

  const updateObjectiveProgress = (objectiveId, progress) => {
    setProgressData(prev => ({
      ...prev,
      objectives: prev.objectives.map(obj => 
        obj.id === objectiveId 
          ? { ...obj, progress: parseInt(progress) }
          : obj
      )
    }));
  };

  const toggleSessionCompletion = (sessionId) => {
    setProgressData(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              completed: !session.completed,
              completedDate: !session.completed ? new Date().toISOString() : null,
              attendance: !session.completed ? 'attended' : null
            }
          : session
      )
    }));
  };

  const updateSessionAttendance = (sessionId, attendance) => {
    setProgressData(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => 
        session.id === sessionId 
          ? { ...session, attendance, completed: attendance === 'attended' }
          : session
      )
    }));
  };

  const updateSessionRating = (sessionId, rating) => {
    setProgressData(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => 
        session.id === sessionId 
          ? { ...session, rating: parseInt(rating) }
          : session
      )
    }));
  };

  const toggleHomeworkCompletion = (homeworkId) => {
    setProgressData(prev => ({
      ...prev,
      homework: prev.homework.map(hw => 
        hw.id === homeworkId 
          ? { 
              ...hw, 
              completed: !hw.completed,
              completedDate: !hw.completed ? new Date().toISOString() : null
            }
          : hw
      )
    }));
  };

  const updateHomeworkQuality = (homeworkId, quality) => {
    setProgressData(prev => ({
      ...prev,
      homework: prev.homework.map(hw => 
        hw.id === homeworkId 
          ? { ...hw, quality }
          : hw
      )
    }));
  };

  const addNote = () => {
    if (newNote.trim()) {
      const note = {
        id: `note_${Date.now()}`,
        date: new Date().toISOString(),
        text: newNote.trim(),
        type: 'general'
      };
      
      setProgressData(prev => ({
        ...prev,
        notes: [note, ...prev.notes]
      }));
      
      setNewNote('');
    }
  };

  const calculateOverallProgress = () => {
    const totalItems = progressData.objectives.length + progressData.sessions.length + progressData.homework.length;
    if (totalItems === 0) return 0;
    
    const completedItems = 
      progressData.objectives.filter(obj => obj.completed).length +
      progressData.sessions.filter(session => session.completed).length +
      progressData.homework.filter(hw => hw.completed).length;
    
    return Math.round((completedItems / totalItems) * 100);
  };

  const generateProgressReport = () => {
    const overallProgress = calculateOverallProgress();
    const completedObjectives = progressData.objectives.filter(obj => obj.completed).length;
    const completedSessions = progressData.sessions.filter(session => session.completed).length;
    const completedHomework = progressData.homework.filter(hw => hw.completed).length;
    const averageSessionRating = progressData.sessions
      .filter(session => session.rating)
      .reduce((sum, session) => sum + session.rating, 0) / 
      progressData.sessions.filter(session => session.rating).length || 0;

    return {
      overallProgress,
      completedObjectives,
      totalObjectives: progressData.objectives.length,
      completedSessions,
      totalSessions: progressData.sessions.length,
      completedHomework,
      totalHomework: progressData.homework.length,
      averageSessionRating: Math.round(averageSessionRating * 10) / 10,
      startDate: plan?.startDate || new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };
  };

  if (!isOpen || !client || !plan) return null;

  const overallProgress = calculateOverallProgress();
  const report = generateProgressReport();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Seguimiento de Progreso - {client.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Plan: {plan.name} • Progreso general: {overallProgress}%
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowReport(true)}
              variant="outline"
              className="text-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generar Informe
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progreso General</span>
                <span className="font-medium text-gray-900">{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{overallProgress}%</div>
              <div className="text-xs text-gray-500">Completado</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'objectives', label: 'Objetivos', icon: Target },
              { id: 'sessions', label: 'Sesiones', icon: Calendar },
              { id: 'homework', label: 'Tareas', icon: Clock },
              { id: 'notes', label: 'Notas', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Objectives Tab */}
          {activeTab === 'objectives' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Objetivos del Plan</h3>
                <div className="text-sm text-gray-600">
                  {progressData.objectives.filter(obj => obj.completed).length} de {progressData.objectives.length} completados
                </div>
              </div>
              
              {progressData.objectives.map(objective => (
                <Card key={objective.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleObjectiveCompletion(objective.id)}
                      className={`mt-1 ${
                        objective.completed 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {objective.completed ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${
                        objective.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {objective.text}
                      </p>
                      
                      {!objective.completed && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Progreso: {objective.progress}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={objective.progress}
                            onChange={(e) => updateObjectiveProgress(objective.id, e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                      
                      {objective.completed && objective.completedDate && (
                        <p className="text-sm text-green-600 mt-2">
                          Completado el {new Date(objective.completedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Sesiones del Plan</h3>
                <div className="text-sm text-gray-600">
                  {progressData.sessions.filter(session => session.completed).length} de {progressData.sessions.length} completadas
                </div>
              </div>
              
              {progressData.sessions.map(session => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-sm font-medium text-blue-800">
                          S{session.week}
                        </span>
                      </div>
                      {session.completed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        Semana {session.week}: {session.topic}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Asistencia
                          </label>
                          <select
                            value={session.attendance || ''}
                            onChange={(e) => updateSessionAttendance(session.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="attended">Asistió</option>
                            <option value="missed">Faltó</option>
                            <option value="cancelled">Cancelada</option>
                          </select>
                        </div>
                        
                        {session.attendance === 'attended' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Calificación (1-5)
                            </label>
                            <select
                              value={session.rating || ''}
                              onChange={(e) => updateSessionRating(session.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="">Sin calificar</option>
                              <option value="1">1 - Muy pobre</option>
                              <option value="2">2 - Pobre</option>
                              <option value="3">3 - Regular</option>
                              <option value="4">4 - Buena</option>
                              <option value="5">5 - Excelente</option>
                            </select>
                          </div>
                        )}
                      </div>
                      
                      {session.completedDate && (
                        <p className="text-sm text-green-600 mt-2">
                          Completada el {new Date(session.completedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Homework Tab */}
          {activeTab === 'homework' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tareas para Casa</h3>
                <div className="text-sm text-gray-600">
                  {progressData.homework.filter(hw => hw.completed).length} de {progressData.homework.length} completadas
                </div>
              </div>
              
              {progressData.homework.map(homework => (
                <Card key={homework.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleHomeworkCompletion(homework.id)}
                      className={`mt-1 ${
                        homework.completed 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {homework.completed ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`font-medium mb-3 ${
                        homework.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {homework.text}
                      </p>
                      
                      {homework.completed && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Calidad del trabajo
                          </label>
                          <select
                            value={homework.quality || ''}
                            onChange={(e) => updateHomeworkQuality(homework.id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Sin evaluar</option>
                            <option value="excellent">Excelente</option>
                            <option value="good">Buena</option>
                            <option value="fair">Regular</option>
                            <option value="poor">Pobre</option>
                          </select>
                        </div>
                      )}
                      
                      {homework.completedDate && (
                        <p className="text-sm text-green-600">
                          Completada el {new Date(homework.completedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notas de Progreso</h3>
                
                <div className="flex gap-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Agregar nueva nota sobre el progreso del cliente..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={addNote}
                    disabled={!newNote.trim()}
                    className="self-start"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {progressData.notes.map(note => (
                  <Card key={note.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2">{note.text}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(note.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Informe de Progreso - {client.name}
                </h3>
                <button
                  onClick={() => setShowReport(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{report.overallProgress}%</div>
                    <div className="text-sm text-gray-600">Progreso General</div>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {report.completedObjectives}/{report.totalObjectives}
                    </div>
                    <div className="text-sm text-gray-600">Objetivos</div>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {report.completedSessions}/{report.totalSessions}
                    </div>
                    <div className="text-sm text-gray-600">Sesiones</div>
                  </Card>
                  
                  <Card className="p-4 text-center">
                    <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">
                      {report.completedHomework}/{report.totalHomework}
                    </div>
                    <div className="text-sm text-gray-600">Tareas</div>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Resumen del Progreso</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 mb-2">
                        <strong>Cliente:</strong> {client.name}
                      </p>
                      <p className="text-gray-700 mb-2">
                        <strong>Plan:</strong> {plan.name}
                      </p>
                      <p className="text-gray-700 mb-2">
                        <strong>Fecha de inicio:</strong> {new Date(report.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 mb-2">
                        <strong>Última actualización:</strong> {new Date(report.lastUpdate).toLocaleDateString()}
                      </p>
                      {report.averageSessionRating > 0 && (
                        <p className="text-gray-700">
                          <strong>Calificación promedio de sesiones:</strong> {report.averageSessionRating}/5
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Objetivos Completados</h4>
                    <div className="space-y-2">
                      {progressData.objectives.filter(obj => obj.completed).map(objective => (
                        <div key={objective.id} className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">{objective.text}</span>
                        </div>
                      ))}
                      {progressData.objectives.filter(obj => obj.completed).length === 0 && (
                        <p className="text-gray-500 text-sm">Aún no se han completado objetivos</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Objetivos Pendientes</h4>
                    <div className="space-y-2">
                      {progressData.objectives.filter(obj => !obj.completed).map(objective => (
                        <div key={objective.id} className="flex items-center gap-2 text-orange-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{objective.text} ({objective.progress}% completado)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  onClick={() => setShowReport(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ProgressTracker };