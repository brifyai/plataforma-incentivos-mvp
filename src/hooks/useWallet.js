/**
 * useWallet Hook
 * 
 * Hook personalizado para gestionar la billetera virtual
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getWalletBalance, 
  getWalletTransactions,
} from '../services/databaseService';
import {
  processWalletWithdrawal,
  redeemGiftCard,
} from '../services/paymentService';

export const useWallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga el balance y transacciones de la wallet
   */
  const loadWallet = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Handle god mode user (mock user not in database)
      if (user.id === 'god-mode-user') {
        setBalance(0);
        setTransactions([]);
        setLoading(false);
        return;
      }

      // Cargar balance y transacciones en paralelo
      const [balanceResult, transactionsResult] = await Promise.all([
        getWalletBalance(user.id),
        getWalletTransactions(user.id),
      ]);

      if (balanceResult.error) {
        console.warn('Error loading wallet balance:', balanceResult.error);
        setBalance(0);
        setError(balanceResult.error);
      } else {
        setBalance(balanceResult.balance);
      }

      if (transactionsResult.error) {
        console.warn('Error loading wallet transactions:', transactionsResult.error);
        setTransactions([]);
        setError(transactionsResult.error);
      } else {
        setTransactions(transactionsResult.transactions || []);
      }
    } catch (err) {
      console.error('Error loading wallet:', err);
      setError('Error al cargar billetera');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar wallet al montar
  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  /**
   * Procesa un retiro de fondos
   */
  const withdraw = useCallback(async (amount, bankAccount) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    // Skip withdrawal for god mode user
    if (user.id === 'god-mode-user') {
      return { success: false, error: 'Operación no disponible en modo administrador' };
    }

    try {
      const result = await processWalletWithdrawal({
        userId: user.id,
        amount,
        bankAccount,
      });

      if (result.success) {
        // Recargar wallet
        await loadWallet();
      }

      return result;
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      return { success: false, error: 'Error al procesar retiro' };
    }
  }, [user, loadWallet]);

  /**
   * Canjea un gift card
   */
  const redeemGift = useCallback(async (amount, merchant, denomination) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    // Skip gift card redemption for god mode user
    if (user.id === 'god-mode-user') {
      return { success: false, error: 'Operación no disponible en modo administrador' };
    }

    try {
      const result = await redeemGiftCard({
        userId: user.id,
        amount,
        merchant,
        denomination,
      });

      if (result.success) {
        // Recargar wallet
        await loadWallet();
      }

      return result;
    } catch (err) {
      console.error('Error redeeming gift card:', err);
      return { success: false, error: 'Error al canjear gift card' };
    }
  }, [user, loadWallet]);

  /**
   * Obtiene transacciones por tipo
   */
  const getTransactionsByType = useCallback((type) => {
    return transactions.filter(t => t.transaction_type === type);
  }, [transactions]);

  /**
   * Obtiene el total de créditos recibidos
   */
  const getTotalCredits = useCallback(() => {
    return transactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  }, [transactions]);

  /**
   * Obtiene el total de débitos
   */
  const getTotalDebits = useCallback(() => {
    return transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  }, [transactions]);

  /**
   * Obtiene estadísticas de la wallet
   */
  const getStats = useCallback(() => {
    const totalCredits = getTotalCredits();
    const totalDebits = getTotalDebits();
    const totalTransactions = transactions.length;

    return {
      balance,
      totalCredits,
      totalDebits,
      totalTransactions,
    };
  }, [balance, getTotalCredits, getTotalDebits, transactions]);

  return {
    balance,
    transactions,
    loading,
    error,
    loadWallet,
    withdraw,
    redeemGift: redeemGift,
    getTransactionsByType,
    getTotalCredits,
    getTotalDebits,
    getStats,
  };
};

export default useWallet;
