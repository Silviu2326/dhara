import React, { useState } from 'react';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CredentialModal } from './CredentialModal';

export const CredentialsTable = ({ credentials = [], onChange, isEditing = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);

  const handleAddCredential = (newCredential) => {
    // Generar ID temporal para nuevas credenciales
    const credentialWithId = {
      ...newCredential,
      id: newCredential.id || `temp_${Date.now()}`,
      isNew: !newCredential.id // Marcar como nueva si no tiene ID
    };
    const updatedCredentials = [...credentials, credentialWithId];
    console.log('🔧 [CREDENTIALS] Adding new credential:', credentialWithId);
    onChange(updatedCredentials);
    setIsModalOpen(false);
  };

  const handleEditCredential = (updatedCredential) => {
    const updatedCredentials = credentials.map(cred => 
      cred.id === updatedCredential.id ? updatedCredential : cred
    );
    onChange(updatedCredentials);
    setEditingCredential(null);
    setIsModalOpen(false);
  };

  const handleDeleteCredential = (credentialId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta credencial?')) {
      const updatedCredentials = credentials.filter(cred => cred.id !== credentialId);
      onChange(updatedCredentials);
    }
  };

  const openEditModal = (credential) => {
    setEditingCredential(credential);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCredential(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCredential(null);
  };

  if (!isEditing && credentials.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-5 w-5 text-sage" />
          <h3 className="text-lg font-semibold text-deep">Formación y Credenciales</h3>
        </div>
        <p className="text-gray-500 italic">No hay formación registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-5 w-5 text-sage" />
          <h3 className="text-lg font-semibold text-deep">Formación y Credenciales</h3>
        </div>
        
        {isEditing && (
          <Button
            onClick={openAddModal}
            className="bg-sage text-white hover:bg-sage/90 px-3 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir</span>
          </Button>
        )}
      </div>

      {credentials.length > 0 ? (
        <div className="space-y-3">
          {/* Vista de tarjetas para mejor legibilidad */}
          <div className="grid gap-3">
            {credentials.map((credential, index) => (
              <div key={credential.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{credential.title}</h4>
                        {credential.description && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{credential.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-700">{credential.year}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Institución:</span> {credential.institution}
                      </p>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(credential)}
                        className="text-sage hover:text-sage/80 p-2 rounded-full hover:bg-sage/10 transition-colors"
                        aria-label={`Editar ${credential.title}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCredential(credential.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        aria-label={`Eliminar ${credential.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Opción para vista de tabla expandible si hay muchas credenciales */}
          {credentials.length > 5 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-sage hover:text-sage/80 font-medium">
                Ver en formato tabla
              </summary>
              <div className="mt-3 overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Título / Certificación
                        </th>
                        <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Centro / Institución
                        </th>
                        <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Año
                        </th>
                        {isEditing && (
                          <th className="border-b border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                            Acciones
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {credentials.map((credential, index) => (
                        <tr key={credential.id || index} className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{credential.title}</div>
                              {credential.description && (
                                <div className="text-gray-600 text-xs mt-1">{credential.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700">
                            {credential.institution}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700">
                            {credential.year}
                          </td>
                          {isEditing && (
                            <td className="border-b border-gray-200 px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => openEditModal(credential)}
                                  className="text-sage hover:text-sage/80 p-1 rounded transition-colors"
                                  aria-label={`Editar ${credential.title}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCredential(credential.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                  aria-label={`Eliminar ${credential.title}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          )}
        </div>
      ) : isEditing ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No hay credenciales añadidas</p>
          <Button
            onClick={openAddModal}
            className="bg-sage text-white hover:bg-sage/90 px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir primera credencial</span>
          </Button>
        </div>
      ) : null}

      {/* Modal */}
      {isModalOpen && (
        <CredentialModal
          credential={editingCredential}
          onSave={editingCredential ? handleEditCredential : handleAddCredential}
          onClose={closeModal}
          isOpen={isModalOpen}
        />
      )}
    </div>
  );
};