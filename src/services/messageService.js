import { supabase } from '../config/supabase';

export const messageService = {
  // Enviar mensaje
  sendMessage: async (messageData) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }
  },

  // Obtener mensajes
  getMessages: async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { data: [], error };
    }
  },

  // Marcar mensaje como leído
  markAsRead: async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { error };
    }
  }
};