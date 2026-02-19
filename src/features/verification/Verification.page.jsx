import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Loader } from '../../components/Loader';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { StatusBanner } from './components/StatusBanner';
import { DiplomaUpload } from './components/DiplomaUpload';
import { InsuranceUpload } from './components/InsuranceUpload';
import { FilesTable } from './components/FilesTable';
import { ReviewerComment } from './components/ReviewerComment';
import { SubmitButton } from './components/SubmitButton';
import { AuditTimeline } from './components/AuditTimeline';
import { verificationService } from '../../services/api/verificationService';

export const Verification = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Verification state
  const [verificationStatus, setVerificationStatus] = useState('not_submitted');
  const [diplomaFiles, setDiplomaFiles] = useState([]);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [reviewerComment, setReviewerComment] = useState(null);
  const [requirements, setRequirements] = useState([]);

  // Load verification data from API
  useEffect(() => {
    loadVerificationData();
  }, []);

  const loadVerificationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all verification data in parallel
      const [statusResponse, documentsResponse, timelineResponse, requirementsResponse] = 
        await Promise.all([
          verificationService.getVerificationStatus().catch(() => null),
          verificationService.getVerificationDocuments().catch(() => ({ documents: [] })),
          verificationService.getVerificationTimeline().catch(() => ({ events: [] })),
          verificationService.getVerificationRequirements().catch(() => ({ requirements: [] }))
        ]);

      // Set verification status (map API status to component status)
      if (statusResponse) {
        const apiStatus = statusResponse.overallStatus || 'not_submitted';
        // Map API statuses to component statuses
        const statusMap = {
          'not_submitted': 'not_submitted',
          'pending': 'pending',
          'under_review': 'pending',
          'approved': 'approved',
          'rejected': 'rejected',
          'expired': 'not_submitted',
          'resubmission_required': 'rejected'
        };
        setVerificationStatus(statusMap[apiStatus] || 'not_submitted');
        
        // Set reviewer comment if status is rejected and there's feedback
        if ((apiStatus === 'rejected' || apiStatus === 'resubmission_required') && statusResponse.rejectionFeedback) {
          setReviewerComment({
            comment: statusResponse.rejectionFeedback.comment || statusResponse.rejectionFeedback.reason || '',
            reviewDate: statusResponse.rejectionFeedback.date || statusResponse.rejectionFeedback.reviewedAt || new Date().toISOString(),
            reviewerName: statusResponse.rejectionFeedback.reviewer || statusResponse.rejectionFeedback.reviewerName || 'Equipo de Verificación',
            suggestions: statusResponse.rejectionFeedback.suggestions || statusResponse.rejectionFeedback.comments || []
          });
        }
      }

      // Set submitted files
      if (documentsResponse && documentsResponse.documents) {
        const formattedFiles = documentsResponse.documents.map(doc => ({
          id: doc.id || doc._id,
          name: doc.fileName || doc.name,
          originalName: doc.metadata?.originalName || doc.originalName || doc.fileName,
          type: doc.type || doc.documentType || 'other',
          mimeType: doc.mimeType || 'application/pdf',
          size: doc.size || doc.fileSize || 0,
          uploadDate: doc.uploadedAt || doc.createdAt || doc.uploadDate || new Date().toISOString(),
          status: doc.status || 'pending',
          url: doc.url || doc.downloadUrl
        }));
        setSubmittedFiles(formattedFiles);
      }

      // Set audit timeline events
      if (timelineResponse && timelineResponse.events) {
        const formattedEvents = timelineResponse.events.map(event => ({
          id: event.id || event._id,
          type: event.type || event.eventType || 'submitted',
          date: event.date || event.createdAt || event.timestamp || new Date().toISOString(),
          title: event.title || event.eventName || 'Evento',
          description: event.description || event.message || '',
          details: event.details || event.items || [],
          reviewer: event.reviewer || event.performedBy || 'Sistema'
        }));
        setAuditEvents(formattedEvents);
      }

      // Set requirements
      if (requirementsResponse && requirementsResponse.requirements) {
        setRequirements(requirementsResponse.requirements);
      }

    } catch (err) {
      console.error('Error loading verification data:', err);
      setError('Error al cargar los datos de verificación. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Upload diploma files
      const uploadedDiplomas = [];
      for (const file of diplomaFiles) {
        const response = await verificationService.uploadVerificationDocument(
          'education_certificate',
          file,
          { 
            documentCategory: 'diploma',
            description: 'Diploma o título profesional'
          }
        );
        uploadedDiplomas.push(response);
      }

      // Upload insurance file
      let uploadedInsurance = null;
      if (insuranceFile) {
        uploadedInsurance = await verificationService.uploadVerificationDocument(
          'insurance_certificate',
          insuranceFile,
          {
            documentCategory: 'insurance',
            description: 'Seguro de responsabilidad civil'
          }
        );
      }

      // Submit for verification
      await verificationService.submitForVerification({
        documentIds: [
          ...uploadedDiplomas.map(d => d.id || d._id),
          ...(uploadedInsurance ? [uploadedInsurance.id || uploadedInsurance._id] : [])
        ],
        additionalNotes: 'Documentos enviados para verificación profesional'
      });

      // Reload data to show updated status
      await loadVerificationData();
      
      // Clear uploaded files
      setDiplomaFiles([]);
      setInsuranceFile(null);
      setReviewerComment(null);
      
    } catch (err) {
      console.error('Error submitting verification:', err);
      setError('Error al enviar la verificación. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      // In a real implementation, this would call an API to get a download URL
      // For now, if the file has a URL, open it
      if (file.url) {
        window.open(file.url, '_blank');
      } else {
        console.log('Downloading file:', file.name);
        // TODO: Implement actual download via API
        alert('Descarga iniciada para: ' + file.originalName);
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Error al descargar el archivo.');
    }
  };

  const handleDeleteFile = async (fileId) => {
    // Only allow deletion if verification is not pending or approved
    if (verificationStatus === 'pending' || verificationStatus === 'approved') {
      return;
    }
    
    try {
      await verificationService.deleteVerificationDocument(fileId);
      // Reload data after deletion
      await loadVerificationData();
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Error al eliminar el archivo.');
    }
  };

  // Calculate total submitted documents count
  const totalSubmittedDocs = submittedFiles.length;
  const requiredDocs = requirements.length > 0 ? requirements.length : 3;

  const canSubmit = diplomaFiles.length > 0 && insuranceFile !== null && 
    (verificationStatus === 'not_submitted' || verificationStatus === 'rejected');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadVerificationData} 
          className="text-blue-600 hover:text-blue-800 underline mr-4"
        >
          Reintentar
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Recargar página
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-deep">Verificación Profesional</h1>
            <p className="text-gray-600 mt-1">Gestiona tu proceso de verificación de credenciales</p>
          </div>
          <button
            onClick={loadVerificationData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Status Banner */}
        <StatusBanner status={verificationStatus} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload Forms */}
          <div className="space-y-6">
            {/* Diploma Upload */}
            <Card>
              <h2 className="text-xl font-semibold text-deep mb-4">Diplomas y Títulos</h2>
              <DiplomaUpload
                files={diplomaFiles}
                onFilesChange={setDiplomaFiles}
                disabled={verificationStatus === 'pending' || verificationStatus === 'approved'}
              />
            </Card>

            {/* Insurance Upload */}
            <Card>
              <h2 className="text-xl font-semibold text-deep mb-4">Seguro de Responsabilidad Civil</h2>
              <InsuranceUpload
                file={insuranceFile}
                onFileChange={setInsuranceFile}
                disabled={verificationStatus === 'pending' || verificationStatus === 'approved'}
              />
            </Card>

            {/* Submit Button */}
            <Card>
              <SubmitButton
                status={verificationStatus}
                isSubmitting={isSubmitting}
                canSubmit={canSubmit}
                onSubmit={handleSubmitVerification}
                diplomaCount={diplomaFiles.length}
                hasInsurance={insuranceFile !== null}
                totalSubmittedDocs={totalSubmittedDocs}
                requiredDocs={requiredDocs}
              />
            </Card>
          </div>

          {/* Right Column - Status and History */}
          <div className="space-y-6">
            {/* Reviewer Comments (only show if rejected) */}
            {verificationStatus === 'rejected' && reviewerComment && (
              <ReviewerComment
                comment={reviewerComment.comment}
                reviewDate={reviewerComment.reviewDate}
                reviewerName={reviewerComment.reviewerName}
                suggestions={reviewerComment.suggestions}
              />
            )}

            {/* Files Table */}
            <Card>
              <h2 className="text-xl font-semibold text-deep mb-4">
                Archivos Enviados ({totalSubmittedDocs} de {requiredDocs} documentos)
              </h2>
              <FilesTable
                files={submittedFiles}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
                canDelete={verificationStatus !== 'pending' && verificationStatus !== 'approved'}
              />
            </Card>

            {/* Audit Timeline */}
            <Card>
              <AuditTimeline events={auditEvents} />
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
