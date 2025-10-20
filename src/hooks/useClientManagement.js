/**
 * Custom hook for client management operations
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createClient } from '../services/databaseService';

export const useClientManagement = (onClientCreated) => {
  const { profile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    business_name: '',
    rut: '',
    contact_email: '',
    contact_phone: '',
    contact_name: '',
    industry: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setCreateForm({
      business_name: '',
      rut: '',
      contact_email: '',
      contact_phone: '',
      contact_name: '',
      industry: '',
      address: '',
    });
    setError(null);
  };

  const handleCreate = async () => {
    // Basic validation
    if (!createForm.business_name || !createForm.rut || !createForm.contact_email) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const clientData = {
        company_id: profile.company.id,
        ...createForm
      };

      const { client, error: createError } = await createClient(clientData);

      if (createError) {
        setError(createError);
        return;
      }

      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);

      // Callback to refresh parent data
      if (onClientCreated) {
        onClientCreated();
      }

    } catch (error) {
      setError('Error al crear cliente. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  return {
    // State
    showCreateModal,
    createForm,
    loading,
    error,

    // Actions
    setCreateForm,
    handleCreate,
    openModal,
    closeModal,
    resetForm
  };
};