import React, { useState, useEffect } from 'react';
import TagBadge from './TagBadge';
import SourceBadge from './SourceBadge';
import { updateProspect } from '../services/api';

/**
 * Modal pour afficher les détails complets d'un prospect
 */
export default function ProspectDetailsModal({ prospect, isOpen, onClose, onProspectUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser formData quand le prospect change
  useEffect(() => {
    if (prospect) {
      setFormData({
        nom_entreprise: prospect.nom_entreprise || '',
        adresse: prospect.adresse || '',
        code_postal: prospect.code_postal || '',
        ville: prospect.ville || '',
        telephone: prospect.telephone || '',
        telephone_2: prospect.telephone_2 || '',
        telephone_3: prospect.telephone_3 || '',
        email: prospect.email || '',
        url_site: prospect.url_site || '',
        nom_contact: prospect.nom_contact || '',
        note: prospect.note || '',
        latitude: prospect.latitude || '',
        longitude: prospect.longitude || '',
      });
    }
  }, [prospect]);

  // Réinitialiser l'état d'édition quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !prospect) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Nom entreprise obligatoire
    if (!formData.nom_entreprise?.trim()) {
      newErrors.nom_entreprise = 'Le nom de l\'entreprise est obligatoire';
    }

    // Validation email si renseigné
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation téléphone français si renseigné
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (formData.telephone && !phoneRegex.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide (ex: 01 23 45 67 89)';
    }
    if (formData.telephone_2 && !phoneRegex.test(formData.telephone_2)) {
      newErrors.telephone_2 = 'Format de téléphone invalide (ex: 01 23 45 67 89)';
    }
    if (formData.telephone_3 && !phoneRegex.test(formData.telephone_3)) {
      newErrors.telephone_3 = 'Format de téléphone invalide (ex: 01 23 45 67 89)';
    }

    // Validation note (entre 0 et 5)
    if (formData.note && (isNaN(formData.note) || formData.note < 0 || formData.note > 5)) {
      newErrors.note = 'La note doit être entre 0 et 5';
    }

    // Validation GPS
    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude invalide (-90 à 90)';
    }
    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude invalide (-180 à 180)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Préparer les données à envoyer (convertir les champs vides en null)
      const dataToUpdate = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value === '') {
          dataToUpdate[key] = null;
        } else if (key === 'note' || key === 'latitude' || key === 'longitude') {
          // Convertir en nombre si ce sont des champs numériques
          dataToUpdate[key] = value ? parseFloat(value) : null;
        } else {
          dataToUpdate[key] = value;
        }
      });

      await updateProspect(prospect.id, dataToUpdate);

      // Notifier le parent que le prospect a été mis à jour
      if (onProspectUpdated) {
        onProspectUpdated();
      }

      setIsEditing(false);
      setErrors({});
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prospect:', error);
      setErrors({ submit: error.userMessage || 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Réinitialiser le formulaire avec les données originales
    setFormData({
      nom_entreprise: prospect.nom_entreprise || '',
      adresse: prospect.adresse || '',
      code_postal: prospect.code_postal || '',
      ville: prospect.ville || '',
      telephone: prospect.telephone || '',
      telephone_2: prospect.telephone_2 || '',
      telephone_3: prospect.telephone_3 || '',
      email: prospect.email || '',
      url_site: prospect.url_site || '',
      nom_contact: prospect.nom_contact || '',
      note: prospect.note || '',
      latitude: prospect.latitude || '',
      longitude: prospect.longitude || '',
    });
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier le prospect' : prospect.nom_entreprise}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Erreur globale */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          {/* Sources et Date (non éditable) */}
          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sources</label>
              <SourceBadge prospect={prospect} />
            </div>
            <span className="text-sm text-gray-500 self-end">
              Ajouté le {new Date(prospect.date_ajout).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Informations principales */}
          {isEditing ? (
            /* MODE ÉDITION - Formulaire */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations</h3>

              {/* Nom entreprise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom_entreprise"
                  value={formData.nom_entreprise}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nom_entreprise ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nom de l'entreprise"
                />
                {errors.nom_entreprise && (
                  <p className="text-red-500 text-xs mt-1">{errors.nom_entreprise}</p>
                )}
              </div>

              {/* Grille 2 colonnes pour les champs suivants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Adresse */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Adresse complète"
                  />
                </div>

                {/* Code postal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    name="code_postal"
                    value={formData.code_postal}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="75001"
                  />
                </div>

                {/* Ville */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Paris"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 1</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.telephone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="01 23 45 67 89"
                  />
                  {errors.telephone && (
                    <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>
                  )}
                </div>

                {/* Téléphone 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 2</label>
                  <input
                    type="tel"
                    name="telephone_2"
                    value={formData.telephone_2}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.telephone_2 ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="01 23 45 67 89"
                  />
                  {errors.telephone_2 && (
                    <p className="text-red-500 text-xs mt-1">{errors.telephone_2}</p>
                  )}
                </div>

                {/* Téléphone 3 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 3</label>
                  <input
                    type="tel"
                    name="telephone_3"
                    value={formData.telephone_3}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.telephone_3 ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="01 23 45 67 89"
                  />
                  {errors.telephone_3 && (
                    <p className="text-red-500 text-xs mt-1">{errors.telephone_3}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="contact@entreprise.fr"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Site web */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                  <input
                    type="url"
                    name="url_site"
                    value={formData.url_site}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://entreprise.fr"
                  />
                </div>

                {/* Nom contact */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du contact</label>
                  <input
                    type="text"
                    name="nom_contact"
                    value={formData.nom_contact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jean Dupont"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note / Avis (0-5)</label>
                  <input
                    type="number"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    min="0"
                    max="5"
                    step="0.1"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.note ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="4.5"
                  />
                  {errors.note && (
                    <p className="text-red-500 text-xs mt-1">{errors.note}</p>
                  )}
                </div>

                {/* Latitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.latitude ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="48.8566"
                  />
                  {errors.latitude && (
                    <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>
                  )}
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.longitude ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2.3522"
                  />
                  {errors.longitude && (
                    <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* MODE LECTURE - Affichage normal */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne gauche */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Coordonnées</h3>

                {/* Adresse */}
                {prospect.adresse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Adresse</label>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-gray-900">{prospect.adresse}</p>
                    </div>
                  </div>
                )}

                {/* Code postal et Ville */}
                <div className="grid grid-cols-2 gap-4">
                  {prospect.code_postal && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Code postal</label>
                      <p className="text-sm text-gray-900 font-medium">{prospect.code_postal}</p>
                    </div>
                  )}
                  {prospect.ville && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Ville</label>
                      <p className="text-sm text-gray-900 font-medium">{prospect.ville}</p>
                    </div>
                  )}
                </div>

                {/* Téléphones */}
                {(prospect.telephone || prospect.telephone_2 || prospect.telephone_3) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone{(prospect.telephone_2 || prospect.telephone_3) && 's'}</label>
                    <div className="space-y-2">
                      {prospect.telephone && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <a href={`tel:${prospect.telephone}`} className="text-sm text-blue-600 hover:underline">
                            {prospect.telephone}
                          </a>
                        </div>
                      )}
                      {prospect.telephone_2 && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <a href={`tel:${prospect.telephone_2}`} className="text-sm text-blue-600 hover:underline">
                            {prospect.telephone_2}
                          </a>
                        </div>
                      )}
                      {prospect.telephone_3 && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <a href={`tel:${prospect.telephone_3}`} className="text-sm text-blue-600 hover:underline">
                            {prospect.telephone_3}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Email */}
                {prospect.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <a href={`mailto:${prospect.email}`} className="text-sm text-blue-600 hover:underline">
                        {prospect.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Colonne droite */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations complémentaires</h3>

                {/* Contact */}
                {prospect.nom_contact && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nom du contact</label>
                    <p className="text-sm text-gray-900">{prospect.nom_contact}</p>
                  </div>
                )}

                {/* Site web */}
                {prospect.url_site && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Site web</label>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      <a
                        href={prospect.url_site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {prospect.url_site}
                      </a>
                    </div>
                  </div>
                )}

                {/* Note */}
                {prospect.note && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Note / Avis</label>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">{prospect.note} / 5</span>
                    </div>
                  </div>
                )}

                {/* Coordonnées GPS */}
                {(prospect.latitude || prospect.longitude) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Coordonnées GPS</label>
                    <p className="text-xs text-gray-600 font-mono">
                      {prospect.latitude}, {prospect.longitude}
                    </p>
                    {prospect.latitude && prospect.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${prospect.latitude},${prospect.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        Voir sur Google Maps
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">Tags</h3>
            <TagBadge prospect={prospect} onTagsUpdated={onProspectUpdated} />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Enregistrer
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
