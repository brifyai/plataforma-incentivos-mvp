-- Migration: Create notifications table
-- Description: Creates the notifications table for user notifications

-- Create notifications table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for security
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Create or update trigger for updated_at
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

-- Insert sample notifications for empresa@nexupay.cl user
INSERT INTO public.notifications (user_id, title, message, type, read) VALUES
    ('eb7b4a35-2c3c-413c-9406-5a0316d0b01b', '¡Bienvenido a NexuPay!', 'Tu cuenta empresarial ha sido configurada correctamente. Comienza a gestionar tus deudas.', 'success', false),
    ('eb7b4a35-2c3c-413c-9406-5a0316d0b01b', 'Nueva función disponible', 'Ahora puedes usar IA para negociar automáticamente con tus deudores.', 'info', false),
    ('eb7b4a35-2c3c-413c-9406-5a0316d0b01b', 'Configura tu perfil', 'Completa la información de tu empresa para acceder a todas las funciones.', 'warning', false),
    ('eb7b4a35-2c3c-413c-9406-5a0316d0b01b', 'Campana de notificaciones', 'Haz click en la campana para ver tus notificaciones en formato SweetAlert compacto.', 'info', false);

-- Create company profile for empresa@nexupay.cl if it doesn't exist
-- Check if company already exists first, then insert if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.companies WHERE user_id = 'eb7b4a35-2c3c-413c-9406-5a0316d0b01b'
    ) THEN
        INSERT INTO public.companies (user_id, company_name, rut, contact_email, contact_phone, created_at, updated_at)
        VALUES ('eb7b4a35-2c3c-413c-9406-5a0316d0b01b', 'Empresa NexuPay', '76.123.456-7', 'empresa@nexupay.cl', '+56 9 1234 5678', NOW(), NOW());
    END IF;
END $$;