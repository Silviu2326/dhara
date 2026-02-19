import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Loader } from '../../components/Loader';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useProfessionalProfile } from './hooks/useProfessionalProfile';
import { Lightbulb, Keyboard, Target, AlertTriangle, CheckCircle, X } from 'lucide-react';

// Importar componentes del perfil
import { AvatarUpload } from './components/AvatarUpload';
import { BannerUpload } from './components/BannerUpload';
import { AboutEditor } from './components/AboutEditor';
import { TherapiesSelect } from './components/TherapiesSelect';
import { CredentialsTable } from './components/CredentialsTable';
import { RatesForm } from './components/RatesForm';
import { CustomRatesForm } from './components/CustomRatesForm';
import { AvailabilitySwitch } from './components/AvailabilitySwitch';
import { LegalInfo } from './components/LegalInfo';
import { PublicPreviewModal } from './components/PublicPreviewModal';
import { PersonalStats } from './components/PersonalStats';
import { HeaderActions, SaveStatus } from './components/HeaderActions';
import { WorkLocationsManager } from './components/WorkLocationsManager';
import { VideoPresentation } from './components/VideoPresentation';
import { ExternalLinks } from './components/ExternalLinks';
import { FeaturedTestimonials } from './components/FeaturedTestimonials';
import { WorkExperience } from './components/WorkExperience';
import { PricingPackages } from './components/PricingPackages';
import { SectionEditButton } from './components/SectionEditButton';

export const ProfessionalProfile = () => {
  // Hook personalizado para manejar datos del perfil
  const {
    profileData,
    stats,
    isLoading,
    isSaving,
    error,
    hasChanges,
    updateField,
    saveProfile,
    refresh
  } = useProfessionalProfile();

  // Estados locales para UI
  const [isEditing, setIsEditing] = useState(false);
  const [editingSections, setEditingSections] = useState({}); // Edición por sección
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [showHelpPanel, setShowHelpPanel] = useState(false);

  // Configurar última fecha de guardado cuando se carga el perfil
  useEffect(() => {
    if (profileData && !isLoading) {
      setLastSaved(new Date().toISOString());
    }
  }, [profileData, isLoading]);

  // Auto-save functionality
  useEffect(() => {
    if (!hasChanges || !autoSaveEnabled || !isEditing) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        await saveProfile();
        setLastAutoSave(new Date().toISOString());
      } catch (err) {
        console.error('Error en auto-guardado:', err);
      }
    }, 30000); // Auto-save cada 30 segundos

    return () => clearTimeout(autoSaveTimer);
  }, [hasChanges, autoSaveEnabled, isEditing, saveProfile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      // Ctrl+S o Cmd+S para guardar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !isSaving) {
          handleSave();
        }
      }
      
      // Ctrl+E o Cmd+E para editar
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (!isEditing) {
          handleEdit();
        }
      }
      
      // Escape para cancelar edición
      if (e.key === 'Escape' && isEditing) {
        handleCancel();
      }
      
      // Ctrl+P o Cmd+P para preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePreview();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [hasChanges, isSaving, isEditing]);

  // Handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleToggleSectionEdit = (sectionName) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const isSectionEditing = (sectionName) => {
    return isEditing || editingSections[sectionName];
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      await saveProfile();
      setLastSaved(new Date().toISOString());
      setIsEditing(false);

      // También salir de los modos de edición de secciones individuales
      setEditingSections({});
    } catch (err) {
      console.error('Error saving profile:', err);
      // El error se maneja en el hook
    }
  };

  // Función de guardado para el botón flotante
  const handleQuickSave = async () => {
    if (!hasChanges) return;

    try {
      await saveProfile();
      setLastSaved(new Date().toISOString());

      // Salir de los modos de edición de secciones individuales
      setEditingSections({});

      // No cambiamos isEditing global para permitir seguir editando otras secciones
    } catch (err) {
      console.error('Error saving profile:', err);
      // El error se maneja en el hook
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.');
      if (!confirmCancel) return;
    }

    refresh(); // Recargar datos originales
    setIsEditing(false);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  // Calculadora de progreso del perfil
  const calculateProfileCompletion = (data) => {
    if (!data) {
      return {
        percentage: 0,
        completed: 0,
        total: 0,
        missingItems: []
      };
    }

    let completed = 0;
    let total = 0;

    const checks = [
      { field: data.avatar, weight: 5, name: 'Avatar' },
      { field: data.banner, weight: 3, name: 'Banner' },
      { field: data.about, weight: 10, name: 'Descripción' },
      { field: data.therapies?.length > 0, weight: 8, name: 'Especialidades' },
      { field: data.credentials?.length > 0, weight: 6, name: 'Formación' },
      { field: data.workLocations?.length > 0, weight: 8, name: 'Ubicaciones' },
      { field: data.rates?.sessionPrice, weight: 7, name: 'Tarifas' },
      { field: data.workExperience?.length > 0, weight: 6, name: 'Experiencia' },
      { field: data.legalInfo?.licenses?.length > 0, weight: 9, name: 'Licencias' },
      { field: data.videoPresentation?.url, weight: 4, name: 'Video' },
      { field: data.externalLinks?.length > 0, weight: 3, name: 'Enlaces' },
      { field: data.pricingPackages?.packages?.length > 0, weight: 5, name: 'Paquetes' }
    ];

    checks.forEach(check => {
      total += check.weight;
      if (check.field) {
        completed += check.weight;
      }
    });

    return {
      percentage: Math.round((completed / total) * 100),
      completed,
      total,
      missingItems: checks.filter(check => !check.field).map(check => check.name)
    };
  };

  const profileProgress = calculateProfileCompletion(profileData);

  // Función para validar secciones individuales
  const getSectionStatus = (sectionName, data) => {
    switch (sectionName) {
      case 'avatar':
        return {
          isComplete: !!data.avatar,
          isValid: true,
          priority: 'medium'
        };
      case 'about':
        return {
          isComplete: data.about && data.about.length > 50,
          isValid: data.about ? data.about.length <= 1000 : true,
          priority: 'high'
        };
      case 'therapies':
        return {
          isComplete: data.therapies && data.therapies.length > 0,
          isValid: data.therapies ? data.therapies.length <= 10 : true,
          priority: 'high'
        };
      case 'credentials':
        return {
          isComplete: data.credentials && data.credentials.length > 0,
          isValid: true,
          priority: 'medium'
        };
      case 'workLocations':
        return {
          isComplete: data.workLocations && data.workLocations.length > 0,
          isValid: true,
          priority: 'high'
        };
      case 'rates':
        return {
          isComplete: data.rates && data.rates.sessionPrice,
          isValid: data.rates ? parseFloat(data.rates.sessionPrice) > 0 : true,
          priority: 'high'
        };
      case 'legalInfo':
        return {
          isComplete: data.legalInfo && data.legalInfo.licenses && data.legalInfo.licenses.length > 0,
          isValid: data.legalInfo ? data.legalInfo.dataProtectionCompliance : false,
          priority: 'critical'
        };
      default:
        return {
          isComplete: true,
          isValid: true,
          priority: 'low'
        };
    }
  };

  // Componente para mostrar estado de sección
  const SectionStatusIndicator = ({ sectionName, data, className = "" }) => {
    const status = getSectionStatus(sectionName, data);
    
    if (status.isComplete && status.isValid) {
      return <div className={`w-3 h-3 bg-green-500 rounded-full ${className}`} title="Completo y válido" />;
    }
    
    if (status.isComplete && !status.isValid) {
      return <div className={`w-3 h-3 bg-yellow-500 rounded-full ${className}`} title="Completo pero necesita revisión" />;
    }
    
    if (status.priority === 'critical') {
      return <div className={`w-3 h-3 bg-red-500 rounded-full animate-pulse ${className}`} title="Crítico - completar urgentemente" />;
    }
    
    if (status.priority === 'high') {
      return <div className={`w-3 h-3 bg-orange-500 rounded-full ${className}`} title="Alta prioridad" />;
    }
    
    return <div className={`w-3 h-3 bg-gray-400 rounded-full ${className}`} title="Opcional" />;
  };

  // Manejar el estado de loading si no hay datos aún
  if (isLoading || !profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6" data-testid="professional-profile">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-deep">Perfil Profesional</h1>
            <p className="text-gray-600 mt-1">Gestiona tu información profesional y configuración</p>
            
            {/* Indicador de progreso */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Completado</span>
                <span>{profileProgress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    profileProgress.percentage >= 80 ? 'bg-green-500' :
                    profileProgress.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${profileProgress.percentage}%` }}
                ></div>
              </div>
              {profileProgress.missingItems.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Pendiente: {profileProgress.missingItems.slice(0, 3).join(', ')}
                  {profileProgress.missingItems.length > 3 && ` y ${profileProgress.missingItems.length - 3} más`}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SaveStatus 
              isSaving={isSaving} 
              lastSaved={lastSaved} 
              lastAutoSave={lastAutoSave}
              hasUnsavedChanges={hasChanges}
              autoSaveEnabled={autoSaveEnabled}
            />
            <HeaderActions
              isEditing={isEditing}
              isSaving={isSaving}
              hasChanges={hasChanges}
              onEdit={handleEdit}
              onSave={handleSave}
              onQuickSave={handleQuickSave}
              onCancel={handleCancel}
              onPreview={handlePreview}
            />
            <button
              onClick={() => setShowHelpPanel(!showHelpPanel)}
              className="p-2 text-gray-500 hover:text-sage rounded-lg hover:bg-gray-100 transition-colors"
              title="Ayuda y atajos de teclado"
            >
              ?
            </button>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Avatar y Banner */}
            <Card>
              <div className="space-y-6">
                <BannerUpload
                  currentBanner={profileData.banner}
                  onBannerChange={(file, url) => updateField('banner', url)}
                  isEditing={isEditing}
                />
                <div className="flex justify-center -mt-16 relative z-10">
                  <AvatarUpload
                    currentAvatar={profileData.avatar}
                    onAvatarChange={(file, url) => updateField('avatar', url)}
                    isEditing={isEditing}
                  />
                </div>
              </div>
            </Card>

            {/* Sobre mí */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-deep">Sobre mí</h3>
                <div className="flex items-center gap-2">
                  <SectionStatusIndicator sectionName="about" data={profileData} />
                  <SectionEditButton
                    isEditing={isSectionEditing('about')}
                    sectionName="about"
                    onToggleEdit={handleToggleSectionEdit}
                  />
                </div>
              </div>
              <AboutEditor
                value={profileData.about}
                onChange={(value) => updateField('about', value)}
                isEditing={isSectionEditing('about')}
              />
            </Card>

            {/* Especialidades */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-deep">Especialidades</h3>
                <SectionEditButton
                  isEditing={isSectionEditing('therapies')}
                  sectionName="therapies"
                  onToggleEdit={handleToggleSectionEdit}
                />
              </div>
              <TherapiesSelect
                selectedTherapies={profileData.therapies}
                onChange={(therapies) => updateField('therapies', therapies)}
                isEditing={isSectionEditing('therapies')}
              />
            </Card>

            {/* Vídeo de Presentación */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-deep">Vídeo de Presentación</h3>
                <SectionEditButton
                  isEditing={isSectionEditing('video')}
                  sectionName="video"
                  onToggleEdit={handleToggleSectionEdit}
                />
              </div>
              <VideoPresentation
                videoData={profileData.videoPresentation}
                onChange={(videoPresentation) => updateField('videoPresentation', videoPresentation)}
                isEditing={isSectionEditing('video')}
              />
            </Card>

            {/* Enlaces Externos */}
            <Card>
              <ExternalLinks
                links={profileData.externalLinks}
                onChange={(externalLinks) => updateField('externalLinks', externalLinks)}
                isEditing={isSectionEditing('externalLinks')}
                editButton={
                  <SectionEditButton
                    isEditing={isSectionEditing('externalLinks')}
                    sectionName="externalLinks"
                    onToggleEdit={handleToggleSectionEdit}
                  />
                }
              />
            </Card>

            {/* Testimonios Destacados */}
            <Card>
              <FeaturedTestimonials
                selectedTestimonials={profileData.featuredTestimonials}
                onChange={(featuredTestimonials) => updateField('featuredTestimonials', featuredTestimonials)}
                isEditing={isSectionEditing('testimonials')}
                editButton={
                  <SectionEditButton
                    isEditing={isSectionEditing('testimonials')}
                    sectionName="testimonials"
                    onToggleEdit={handleToggleSectionEdit}
                  />
                }
              />
            </Card>

            {/* Experiencia Laboral */}
            <Card>
              <WorkExperience
                experiences={profileData.workExperience}
                onChange={(workExperience) => updateField('workExperience', workExperience)}
                isEditing={isSectionEditing('workExperience')}
                editButton={
                  <SectionEditButton
                    isEditing={isSectionEditing('workExperience')}
                    sectionName="workExperience"
                    onToggleEdit={handleToggleSectionEdit}
                  />
                }
              />
            </Card>

            {/* Paquetes y Cupones */}
            <Card>
              <PricingPackages
                packages={profileData.pricingPackages.packages}
                coupons={profileData.pricingPackages.coupons}
                onChange={(pricingData) => updateField('pricingPackages', pricingData)}
                isEditing={isSectionEditing('pricing')}
                editButton={
                  <SectionEditButton
                    isEditing={isSectionEditing('pricing')}
                    sectionName="pricing"
                    onToggleEdit={handleToggleSectionEdit}
                  />
                }
              />
            </Card>

            {/* Ubicaciones de Trabajo */}
            <Card>
              <WorkLocationsManager
                locations={profileData.workLocations}
                onChange={(workLocations) => updateField('workLocations', workLocations)}
                isEditing={isSectionEditing('workLocations')}
                editButton={
                  <SectionEditButton
                    isEditing={isSectionEditing('workLocations')}
                    sectionName="workLocations"
                    onToggleEdit={handleToggleSectionEdit}
                  />
                }
              />
            </Card>

            {/* Formación */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-deep">Formación</h3>
                <SectionEditButton
                  isEditing={isSectionEditing('credentials')}
                  sectionName="credentials"
                  onToggleEdit={handleToggleSectionEdit}
                  data-section="credentials"
                />
              </div>
              <CredentialsTable
                credentials={profileData.credentials}
                onChange={(credentials) => updateField('credentials', credentials)}
                isEditing={isSectionEditing('credentials')}
                data-testid="credentials-table"
              />
            </Card>

            {/* Información Legal */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-deep">Información Legal</h3>
                <SectionEditButton
                  isEditing={isSectionEditing('legalInfo')}
                  sectionName="legalInfo"
                  onToggleEdit={handleToggleSectionEdit}
                  data-section="legalInfo"
                />
              </div>
              <LegalInfo
                legalInfo={profileData.legalInfo}
                onChange={(legalInfo) => updateField('legalInfo', legalInfo)}
                isEditing={isSectionEditing('legalInfo')}
                data-testid="legal-info"
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Métricas */}
            <Card>
              <PersonalStats stats={stats} />
            </Card>

            {/* Tarifas Personalizadas */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-deep">Tarifas</h3>
                <SectionEditButton
                  isEditing={isSectionEditing('rates')}
                  sectionName="rates"
                  onToggleEdit={handleToggleSectionEdit}
                />
              </div>
              <CustomRatesForm
                rates={profileData.rates}
                onChange={(rates) => updateField('rates', rates)}
                isEditing={isSectionEditing('rates')}
              />
            </Card>

            {/* Disponibilidad */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-deep">Disponibilidad</h3>
                <SectionEditButton
                  isEditing={isSectionEditing('availability')}
                  sectionName="availability"
                  onToggleEdit={handleToggleSectionEdit}
                />
              </div>
              <AvailabilitySwitch
                isAvailable={profileData.isAvailable}
                onChange={(available) => updateField('isAvailable', available)}
                isEditing={isSectionEditing('availability')}
              />
            </Card>
          </div>
        </div>

        {/* Panel de ayuda */}
        {showHelpPanel && (
          <Card>
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2"><Lightbulb className="h-5 w-5" /> Consejos y Atajos</h3>
                <button 
                  onClick={() => setShowHelpPanel(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2"><Keyboard className="h-4 w-4" /> Atajos de Teclado</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div><kbd className="bg-blue-100 px-2 py-1 rounded">Ctrl+S</kbd> Guardar cambios</div>
                    <div><kbd className="bg-blue-100 px-2 py-1 rounded">Ctrl+E</kbd> Activar edición</div>
                    <div><kbd className="bg-blue-100 px-2 py-1 rounded">Escape</kbd> Cancelar edición</div>
                    <div><kbd className="bg-blue-100 px-2 py-1 rounded">Ctrl+P</kbd> Vista previa</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2"><Target className="h-4 w-4" /> Consejos de Perfil</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Completa al menos el 80% para mejor visibilidad</li>
                    <li>• Usa una descripción de 100-300 palabras</li>
                    <li>• Agrega al menos 3 especialidades</li>
                    <li>• Incluye tu ubicación principal</li>
                    <li>• Las licencias son obligatorias</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-600">
                  <strong>Auto-guardado:</strong> {autoSaveEnabled ? 'Activado (cada 30s)' : 'Desactivado'} • 
                  <strong> Estado:</strong> {getSectionStatus('legalInfo', profileData).priority === 'critical' ? <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-orange-500" /> Información legal pendiente</span> : <span className="inline-flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> Todo correcto</span>}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Modal de vista previa */}
        <PublicPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          profileData={profileData}
          stats={stats}
        />
      </div>
    </ErrorBoundary>
  );
};