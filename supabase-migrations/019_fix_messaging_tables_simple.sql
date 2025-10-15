-- ===================================
-- Versión simplificada para corregir tablas de mensajería
-- ===================================

-- 1. Agregar columnas faltantes a conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS debtor_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS debtor_name TEXT NOT NULL DEFAULT 'Usuario desconocido';

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS debtor_rut TEXT;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT 'Empresa';

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS unread_count_company INTEGER DEFAULT 0;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Agregar columnas faltantes a messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_type TEXT NOT NULL DEFAULT 'company' CHECK (sender_type IN ('debtor', 'company', 'ai'));

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'proposal'));

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Crear tabla message_attachments si no existe
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear índices importantes
CREATE INDEX IF NOT EXISTS idx_conversations_debtor_id ON conversations(debtor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- 5. Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- 6. Verificación
SELECT 'Tablas de mensajería actualizadas correctamente' as status;