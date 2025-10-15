import { useState, useEffect } from 'react';
import { getCompanyMessages } from '../services/databaseService';

export const useCompanyMessages = (companyId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companyId) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const { messages, error } = await getCompanyMessages(companyId);
        if (error) {
          setError(error);
        } else {
          setMessages(messages || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [companyId]);

  return { messages, loading, error };
};