/**
 * Custom hook for offer creation and management
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createOffer, getCompanyClients } from '../services/databaseService';

export const useOfferCreation = (onOfferCreated) => {
  const { profile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    offer_type: 'discount',
    discount_percentage: '',
    fixed_amount: '',
    user_incentive_percentage: 5,
    client_id: '',
    validity_start: '',
    validity_end: '',
    max_uses: '',
    terms_conditions: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setCreateForm({
      title: '',
      description: '',
      offer_type: 'discount',
      discount_percentage: '',
      fixed_amount: '',
      user_incentive_percentage: 5,
      client_id: '',
      validity_start: '',
      validity_end: '',
      max_uses: '',
      terms_conditions: '',
    });
    setError(null);
  };

  const loadClients = async () => {
    if (!profile?.company?.id) return;

    try {
      const result = await getCompanyClients(profile.company.id);
      if (result.error) {
        console.error('Error loading clients:', result.error);
        setClients([]);
      } else {
        setClients(result.clients || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }
  };

  const handleCreate = async () => {
    // Basic validation
    if (!createForm.title || !createForm.description) {
      setError('Por favor complete el título y descripción de la oferta');
      return;
    }

    if (createForm.offer_type === 'discount' && !createForm.discount_percentage) {
      setError('Por favor especifique el porcentaje de descuento');
      return;
    }

    if (createForm.offer_type === 'fixed_amount' && !createForm.fixed_amount) {
      setError('Por favor especifique el monto fijo de descuento');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const offerData = {
        company_id: profile.company.id,
        title: createForm.title,
        description: createForm.description,
        offer_type: createForm.offer_type,
        user_incentive_percentage: parseFloat(createForm.user_incentive_percentage),
        client_id: createForm.client_id || null,
        validity_start: createForm.validity_start ? new Date(createForm.validity_start).toISOString() : new Date().toISOString(),
        validity_end: createForm.validity_end ? new Date(createForm.validity_end).toISOString() : null,
        max_uses: createForm.max_uses ? parseInt(createForm.max_uses) : null,
        terms_conditions: createForm.terms_conditions,
        status: 'active',
      };

      // Add type-specific fields
      if (createForm.offer_type === 'discount') {
        offerData.discount_percentage = parseFloat(createForm.discount_percentage);
      } else if (createForm.offer_type === 'fixed_amount') {
        offerData.fixed_amount = parseFloat(createForm.fixed_amount);
      }

      const { offer, error: createError } = await createOffer(offerData);

      if (createError) {
        setError(createError);
        return;
      }

      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);

      // Callback to refresh parent data
      if (onOfferCreated) {
        onOfferCreated();
      }

    } catch (error) {
      setError('Error al crear oferta. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    resetForm();
    await loadClients();
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  return {
    // State
    showCreateModal,
    clients,
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