import { verificationService } from '../../services/api/verificationService';

export const getVerificationStatus = async () => {
  try {
    return await verificationService.getVerificationStatus();
  } catch (error) {
    console.error('Error fetching verification status:', error);
    throw error;
  }
};

export const getVerificationDocuments = async () => {
  try {
    return await verificationService.getVerificationDocuments();
  } catch (error) {
    console.error('Error fetching verification documents:', error);
    throw error;
  }
};

export const getVerificationTimeline = async () => {
  try {
    return await verificationService.getVerificationTimeline();
  } catch (error) {
    console.error('Error fetching verification timeline:', error);
    throw error;
  }
};

export const getVerificationRequirements = async () => {
  try {
    return await verificationService.getVerificationRequirements();
  } catch (error) {
    console.error('Error fetching verification requirements:', error);
    throw error;
  }
};

export const uploadVerificationDocument = async (documentType, file, metadata, onProgress) => {
  try {
    return await verificationService.uploadVerificationDocument(documentType, file, metadata, onProgress);
  } catch (error) {
    console.error('Error uploading verification document:', error);
    throw error;
  }
};

export const submitVerificationDocument = async (document) => {
  try {
    return await verificationService.submitForVerification({
      documentIds: [document.id || document._id]
    });
  } catch (error) {
    console.error('Error submitting verification document:', error);
    throw error;
  }
};

export const submitVerificationDocuments = async (documents) => {
  try {
    return await verificationService.submitForVerification({
      documentIds: documents.map(d => d.id || d._id)
    });
  } catch (error) {
    console.error('Error submitting verification documents:', error);
    throw error;
  }
};

export const deleteVerificationDocument = async (documentId) => {
  try {
    return await verificationService.deleteVerificationDocument(documentId);
  } catch (error) {
    console.error('Error deleting verification document:', error);
    throw error;
  }
};

export const resubmitVerification = async (resubmissionData) => {
  try {
    return await verificationService.resubmitForVerification(resubmissionData);
  } catch (error) {
    console.error('Error resubmitting verification:', error);
    throw error;
  }
};

export const getVerificationHistory = async () => {
  try {
    return await verificationService.getVerificationHistory();
  } catch (error) {
    console.error('Error fetching verification history:', error);
    throw error;
  }
};
