-- ===================================
-- Adaptar o crear tablas de mensajería existentes
-- ===================================

-- 1. Verificar y adaptar tabla conversations
DO $$
BEGIN
    -- Si la tabla no existe, crearla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'conversations' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE conversations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            debtor_id UUID REFERENCES users(id) ON DELETE CASCADE,
            debtor_name TEXT NOT NULL,
            debtor_rut TEXT,
            company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            subject TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
            last_message_at TIMESTAMP WITH TIME ZONE,
            last_message_content TEXT,
            unread_count INTEGER DEFAULT 0,
            unread_count_company INTEGER DEFAULT 0,
            priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
            debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabla conversations creada';
    ELSE
        -- Si la tabla existe, verificar y agregar columnas faltantes
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'debtor_id'
        ) THEN
            ALTER TABLE conversations ADD COLUMN debtor_id UUID REFERENCES users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Columna debtor_id agregada a conversations';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'debtor_name'
        ) THEN
            ALTER TABLE conversations ADD COLUMN debtor_name TEXT NOT NULL DEFAULT 'Usuario desconocido';
            RAISE NOTICE 'Columna debtor_name agregada a conversations';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'debtor_rut'
        ) THEN
            ALTER TABLE conversations ADD COLUMN debtor_rut TEXT;
            RAISE NOTICE 'Columna debtor_rut agregada a conversations';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'company_id'
        ) THEN
            ALTER TABLE conversations ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
            RAISE NOTICE 'Columna company_id agregada a conversations';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'company_name'
        ) THEN
            ALTER TABLE conversations ADD COLUMN company_name TEXT NOT NULL DEFAULT 'Empresa';
            RAISE NOTICE 'Columna company_name agregada a conversations';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'unread_count_company'
        ) THEN
            ALTER TABLE conversations ADD COLUMN unread_count_company INTEGER DEFAULT 0;
            RAISE NOTICE 'Columna unread_count_company agregada a conversations';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'priority'
        ) THEN
            ALTER TABLE conversations ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
            RAISE NOTICE 'Columna priority agregada a conversations';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'metadata'
        ) THEN
            ALTER TABLE conversations ADD COLUMN metadata JSONB DEFAULT '{}';
            RAISE NOTICE 'Columna metadata agregada a conversations';
        END IF;
        
        -- Si no hay columnas timestamp, agregarlas
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE conversations ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Columna created_at agregada a conversations';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Columna updated_at agregada a conversations';
        END IF;
        
        RAISE NOTICE 'Tabla conversations adaptada';
    END IF;
END $$;

-- 2. Verificar y adaptar tabla messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'messages' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
            sender_type TEXT NOT NULL CHECK (sender_type IN ('debtor', 'company', 'ai')),
            content TEXT NOT NULL,
            content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'proposal')),
            metadata JSONB DEFAULT '{}',
            ai_generated BOOLEAN DEFAULT FALSE,
            ai_confidence DECIMAL(3,2),
            escalation_triggered BOOLEAN DEFAULT FALSE,
            escalation_reason TEXT,
            read_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabla messages creada';
    ELSE
        -- Verificar columnas faltantes en messages
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'conversation_id'
        ) THEN
            ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
            RAISE NOTICE 'Columna conversation_id agregada a messages';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'sender_type'
        ) THEN
            ALTER TABLE messages ADD COLUMN sender_type TEXT NOT NULL DEFAULT 'company' CHECK (sender_type IN ('debtor', 'company', 'ai'));
            RAISE NOTICE 'Columna sender_type agregada a messages';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'content_type'
        ) THEN
            ALTER TABLE messages ADD COLUMN content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'proposal'));
            RAISE NOTICE 'Columna content_type agregada a messages';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'metadata'
        ) THEN
            ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}';
            RAISE NOTICE 'Columna metadata agregada a messages';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'ai_generated'
        ) THEN
            ALTER TABLE messages ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Columna ai_generated agregada a messages';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'ai_confidence'
        ) THEN
            ALTER TABLE messages ADD COLUMN ai_confidence DECIMAL(3,2);
            RAISE NOTICE 'Columna ai_confidence agregada a messages';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'read_at'
        ) THEN
            ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Columna read_at agregada a messages';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE messages ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Columna created_at agregada a messages';
        END IF;
        
        RAISE NOTICE 'Tabla messages adaptada';
    END IF;
END $$;

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

-- 4. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_conversations_debtor_id ON conversations(debtor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_debt_id ON conversations(debt_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- 5. Habilitar RLS si no está habilitado
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- 6. Verificación final
SELECT 
    'conversations' as table_name,
    COUNT(*) as record_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'conversations' AND table_schema = 'public') as column_count
FROM conversations
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as record_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'messages' AND table_schema = 'public') as column_count
FROM messages
UNION ALL
SELECT 
    'message_attachments' as table_name,
    COUNT(*) as record_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'message_attachments' AND table_schema = 'public') as column_count
FROM message_attachments;

RAISE NOTICE '✅ Adaptación de tablas de mensajería completada';