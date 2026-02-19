import React, { useState } from 'react';
import { Shield, Edit, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/Button';

export const LegalInfo = ({ legalInfo = {}, onChange, isEditing = false }) => {
  const [isAddingLicense, setIsAddingLicense] = useState(false);
  const [newLicense, setNewLicense] = useState({
    type: '',
    number: '',
    issuingBody: '',
    expiryDate: '',
    status: 'active'
  });

  const {
    licenses = [],
    professionalRegistration = '',
    ethicsCode = '',
    insuranceCoverage = '',
    dataProtectionCompliance = false
  } = legalInfo;

  const handleAddLicense = () => {
    if (newLicense.type && newLicense.number && newLicense.issuingBody) {
      const updatedLicenses = [...licenses, { ...newLicense, id: Date.now() }];
      onChange({ ...legalInfo, licenses: updatedLicenses });
      setNewLicense({ type: '', number: '', issuingBody: '', expiryDate: '', status: 'active' });
      setIsAddingLicense(false);
    }
  };

  const handleRemoveLicense = (licenseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta licencia?')) {
      const updatedLicenses = licenses.filter(license => license.id !== licenseId);
      onChange({ ...legalInfo, licenses: updatedLicenses });
    }
  };

  const handleFieldChange = (field, value) => {
    onChange({ ...legalInfo, [field]: value });
  };

  const getLicenseStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'expired': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLicenseStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'expired': return 'Expirada';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Shield className="h-5 w-5 text-sage" />
        <h3 className="text-lg font-semibold text-deep">Información Legal y Colegiación</h3>
      </div>

      {/* Licencias y Colegiaciones */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Licencias y Colegiaciones</h4>
        
        {licenses.length > 0 ? (
          <div className="space-y-2">
            {licenses.map((license) => (
              <div key={license.id} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{license.type}</span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${
                        getLicenseStatusColor(license.status)
                      }`}>
                        {getLicenseStatusText(license.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Número: {license.number}</p>
                    <p className="text-sm text-gray-600">Organismo: {license.issuingBody}</p>
                    {license.expiryDate && (
                      <p className="text-sm text-gray-600">Vencimiento: {license.expiryDate}</p>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveLicense(license.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      aria-label={`Eliminar licencia ${license.type}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">No hay licencias registradas</p>
        )}

        {/* Formulario para añadir licencia */}
        {isEditing && (
          <div className="space-y-3">
            {isAddingLicense ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Licencia *
                    </label>
                    <select
                      value={newLicense.type}
                      onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="Colegio Oficial de Psicólogos">Colegio Oficial de Psicólogos</option>
                      <option value="Colegio Profesional de Terapeutas">Colegio Profesional de Terapeutas</option>
                      <option value="Licencia Sanitaria">Licencia Sanitaria</option>
                      <option value="Registro de Centros Sanitarios">Registro de Centros Sanitarios</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Licencia *
                    </label>
                    <input
                      type="text"
                      value={newLicense.number}
                      onChange={(e) => setNewLicense({ ...newLicense, number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                      placeholder="Ej: 12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organismo Emisor *
                    </label>
                    <input
                      type="text"
                      value={newLicense.issuingBody}
                      onChange={(e) => setNewLicense({ ...newLicense, issuingBody: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                      placeholder="Ej: COP Madrid"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      value={newLicense.expiryDate}
                      onChange={(e) => setNewLicense({ ...newLicense, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleAddLicense}
                    className="bg-sage text-white hover:bg-sage/90 px-4 py-2 rounded-lg"
                    disabled={!newLicense.type || !newLicense.number || !newLicense.issuingBody}
                  >
                    Añadir Licencia
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingLicense(false);
                      setNewLicense({ type: '', number: '', issuingBody: '', expiryDate: '', status: 'active' });
                    }}
                    className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingLicense(true)}
                className="bg-sage text-white hover:bg-sage/90 px-3 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir Licencia</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        {/* Registro Profesional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registro Profesional
          </label>
          {isEditing ? (
            <textarea
              value={professionalRegistration}
              onChange={(e) => handleFieldChange('professionalRegistration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              rows={2}
              placeholder="Información sobre registro profesional, número de colegiado, etc."
            />
          ) : (
            <p className="text-sm text-gray-600">
              {professionalRegistration || 'No especificado'}
            </p>
          )}
        </div>

        {/* Código Ético */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código Ético y Deontológico
          </label>
          {isEditing ? (
            <textarea
              value={ethicsCode}
              onChange={(e) => handleFieldChange('ethicsCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              rows={2}
              placeholder="Código ético al que se adhiere (ej: Código Deontológico del COP)"
            />
          ) : (
            <p className="text-sm text-gray-600">
              {ethicsCode || 'No especificado'}
            </p>
          )}
        </div>

        {/* Seguro de Responsabilidad Civil */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seguro de Responsabilidad Civil
          </label>
          {isEditing ? (
            <input
              type="text"
              value={insuranceCoverage}
              onChange={(e) => handleFieldChange('insuranceCoverage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              placeholder="Compañía aseguradora y número de póliza"
            />
          ) : (
            <p className="text-sm text-gray-600">
              {insuranceCoverage || 'No especificado'}
            </p>
          )}
        </div>

        {/* Cumplimiento RGPD */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="dataProtection"
            checked={dataProtectionCompliance}
            onChange={(e) => handleFieldChange('dataProtectionCompliance', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
          />
          <label htmlFor="dataProtection" className="text-sm text-gray-700">
            Cumplimiento del Reglamento General de Protección de Datos (RGPD)
          </label>
        </div>
      </div>

      {/* Aviso legal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Información Legal Importante:</p>
            <p className="mt-1">
              Es responsabilidad del profesional mantener actualizada toda la información legal 
              y cumplir con la normativa vigente en su jurisdicción. Esta información será 
              visible para los clientes como garantía de profesionalidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};