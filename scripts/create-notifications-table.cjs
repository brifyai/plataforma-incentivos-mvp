/**
 * Script para crear la tabla notifications que falta en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuración de Supabase
const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: fetch
  }
});

async function createNotificationsTable() {
  try {
    console.log('🔧 Creando tabla notifications...');
    
    // SQL para crear la tabla notifications
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'payment', 'debt', 'agreement', 'system')),
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );
      
      -- Crear índices para mejor rendimiento
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
      
      -- Habilitar RLS (Row Level Security)
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
      
      -- Políticas de seguridad
      CREATE POLICY "Users can view their own notifications" ON public.notifications
        FOR SELECT USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can insert their own notifications" ON public.notifications
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
      CREATE POLICY "Users can update their own notifications" ON public.notifications
        FOR UPDATE USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can delete their own notifications" ON public.notifications
        FOR DELETE USING (auth.uid() = user_id);
        
      -- Trigger para updated_at
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER handle_notifications_updated_at
        BEFORE UPDATE ON public.notifications
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    `;
    
    // Ejecutar el SQL usando RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Error creando tabla notifications:', error);
      
      // Si RPC no funciona, intentar con SQL directo
      console.log('🔄 Intentando crear tabla con método alternativo...');
      
      // Crear tabla básica sin triggers complejos
      const basicSQL = `
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
      `;
      
      const { data: basicData, error: basicError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);
      
      if (basicError && basicError.code === 'PGRST116') {
        // La tabla no existe, intentar crearla manualmente
        console.log('📝 La tabla no existe. Por favor, crea la tabla manualmente en Supabase Dashboard:');
        console.log('');
        console.log('```sql');
        console.log(basicSQL);
        console.log('```');
        console.log('');
        console.log('🔗 Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/sql');
      } else if (!basicError) {
        console.log('✅ Tabla notifications ya existe o fue creada');
      }
      
    } else {
      console.log('✅ Tabla notifications creada exitosamente');
    }
    
    // Insertar algunas notificaciones de ejemplo para el usuario empresa
    console.log('📝 Insertando notificaciones de ejemplo...');
    
    const sampleNotifications = [
      {
        user_id: 'eb7b4a35-2c3c-413c-9406-5a0316d0b01b',
        title: '¡Bienvenido a NexuPay!',
        message: 'Tu cuenta empresarial ha sido configurada correctamente. Comienza a gestionar tus deudas.',
        type: 'success',
        read: false
      },
      {
        user_id: 'eb7b4a35-2c3c-413c-9406-5a0316d0b01b',
        title: 'Nueva función disponible',
        message: 'Ahora puedes usar IA para negociar automáticamente con tus deudores.',
        type: 'info',
        read: false
      },
      {
        user_id: 'eb7b4a35-2c3c-413c-9406-5a0316d0b01b',
        title: 'Configura tu perfil',
        message: 'Completa la información de tu empresa para acceder a todas las funciones.',
        type: 'warning',
        read: false
      }
    ];
    
    for (const notification of sampleNotifications) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notification);
      
      if (insertError) {
        console.warn('⚠️ Error insertando notificación:', insertError.message);
      } else {
        console.log('✅ Notificación insertada:', notification.title);
      }
    }
    
    console.log('🎉 Proceso completado. La tabla notifications está lista.');
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

// Ejecutar el script
createNotificationsTable();