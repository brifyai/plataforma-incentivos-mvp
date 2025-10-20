-- ===================================
-- Sistema de Mensajería en Tiempo Real
-- ===================================

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
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

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
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

-- Tabla de archivos adjuntos
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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_conversations_debtor_id ON conversations(debtor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_debt_id ON conversations(debt_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- Políticas de Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas para conversaciones
-- Los deudores pueden ver sus propias conversaciones
CREATE POLICY "Deudores pueden ver sus conversaciones" ON conversations
    FOR SELECT USING (
        auth.uid() = debtor_id
    );

-- Las empresas pueden ver sus conversaciones
CREATE POLICY "Empresas pueden ver sus conversaciones" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.id = company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Los deudores pueden insertar conversaciones
CREATE POLICY "Deudores pueden insertar conversaciones" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = debtor_id
    );

-- Las empresas pueden insertar conversaciones
CREATE POLICY "Empresas pueden insertar conversaciones" ON conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.id = company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Los deudores pueden actualizar sus conversaciones
CREATE POLICY "Deudores pueden actualizar sus conversaciones" ON conversations
    FOR UPDATE USING (
        auth.uid() = debtor_id
    );

-- Las empresas pueden actualizar sus conversaciones
CREATE POLICY "Empresas pueden actualizar sus conversaciones" ON conversations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.id = company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Políticas para mensajes
-- Los deudores pueden ver mensajes de sus conversaciones
CREATE POLICY "Deudores pueden ver sus mensajes" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_id 
            AND conversations.debtor_id = auth.uid()
        )
    );

-- Las empresas pueden ver mensajes de sus conversaciones
CREATE POLICY "Empresas pueden ver sus mensajes" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_id 
            AND EXISTS (
                SELECT 1 FROM companies 
                WHERE companies.id = conversations.company_id 
                AND companies.user_id = auth.uid()
            )
        )
    );

-- Los deudores pueden insertar mensajes en sus conversaciones
CREATE POLICY "Deudores pueden insertar mensajes" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_id 
            AND conversations.debtor_id = auth.uid()
        ) AND sender_type = 'debtor'
    );

-- Las empresas pueden insertar mensajes en sus conversaciones
CREATE POLICY "Empresas pueden insertar mensajes" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_id 
            AND EXISTS (
                SELECT 1 FROM companies 
                WHERE companies.id = conversations.company_id 
                AND companies.user_id = auth.uid()
            )
        ) AND sender_type = 'company'
    );

-- Los deudores pueden actualizar sus mensajes (solo para marcar como leídos)
CREATE POLICY "Deudores pueden actualizar sus mensajes" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_id 
            AND conversations.debtor_id = auth.uid()
        )
    );

-- Las empresas pueden actualizar mensajes de sus conversaciones
CREATE POLICY "Empresas pueden actualizar mensajes" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_id 
            AND EXISTS (
                SELECT 1 FROM companies 
                WHERE companies.id = conversations.company_id 
                AND companies.user_id = auth.uid()
            )
        )
    );

-- Políticas para archivos adjuntos
-- Los deudores pueden ver archivos adjuntos de sus mensajes
CREATE POLICY "Deudores pueden ver sus archivos adjuntos" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages 
            WHERE messages.id = message_id 
            AND EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversation_id 
                AND conversations.debtor_id = auth.uid()
            )
        )
    );

-- Las empresas pueden ver archivos adjuntos de sus conversaciones
CREATE POLICY "Empresas pueden ver sus archivos adjuntos" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages 
            WHERE messages.id = message_id 
            AND EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversation_id 
                AND EXISTS (
                    SELECT 1 FROM companies 
                    WHERE companies.id = conversations.company_id 
                    AND companies.user_id = auth.uid()
                )
            )
        )
    );

-- Los deudores pueden insertar archivos adjuntos en sus mensajes
CREATE POLICY "Deudores pueden insertar archivos adjuntos" ON message_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages 
            WHERE messages.id = message_id 
            AND EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversation_id 
                AND conversations.debtor_id = auth.uid()
            )
        )
    );

-- Las empresas pueden insertar archivos adjuntos en sus conversaciones
CREATE POLICY "Empresas pueden insertar archivos adjuntos" ON message_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages 
            WHERE messages.id = message_id 
            AND EXISTS (
                SELECT 1 FROM conversations 
                WHERE conversations.id = messages.conversation_id 
                AND EXISTS (
                    SELECT 1 FROM companies 
                    WHERE companies.id = conversations.company_id 
                    AND companies.user_id = auth.uid()
                )
            )
        )
    );

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar contador de mensajes no leídos
CREATE OR REPLACE FUNCTION update_conversation_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es un nuevo mensaje y no es del mismo tipo que el receptor
    IF TG_OP = 'INSERT' THEN
        -- Actualizar contador de no leídos para la empresa
        IF NEW.sender_type = 'debtor' THEN
            UPDATE conversations 
            SET 
                unread_count_company = unread_count_company + 1,
                last_message_at = NEW.created_at,
                last_message_content = NEW.content
            WHERE id = NEW.conversation_id;
        -- Actualizar contador de no leídos para el deudor
        ELSIF NEW.sender_type = 'company' THEN
            UPDATE conversations 
            SET 
                unread_count = unread_count + 1,
                last_message_at = NEW.created_at,
                last_message_content = NEW.content
            WHERE id = NEW.conversation_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_unread_count_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_unread_count();

-- Trigger para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_as_read_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Cuando se actualiza una conversación, marcar mensajes como leídos
    IF TG_OP = 'UPDATE' THEN
        -- Marcar mensajes de la empresa como leídos para el deudor
        IF OLD.unread_count > 0 AND NEW.unread_count = 0 THEN
            UPDATE messages 
            SET read_at = NOW() 
            WHERE conversation_id = NEW.id 
            AND sender_type = 'company' 
            AND read_at IS NULL;
        END IF;
        
        -- Marcar mensajes del deudor como leídos para la empresa
        IF OLD.unread_count_company > 0 AND NEW.unread_count_company = 0 THEN
            UPDATE messages 
            SET read_at = NOW() 
            WHERE conversation_id = NEW.id 
            AND sender_type = 'debtor' 
            AND read_at IS NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER mark_messages_as_read_trigger
    AFTER UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION mark_messages_as_read_trigger();

-- Función de utilidad para obtener conversaciones con filtros
CREATE OR REPLACE FUNCTION get_conversations_with_filters(
    p_user_id UUID DEFAULT NULL,
    p_company_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_unread_only BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    debtor_id UUID,
    debtor_name TEXT,
    debtor_rut TEXT,
    company_id UUID,
    company_name TEXT,
    subject TEXT,
    status TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_content TEXT,
    unread_count INTEGER,
    unread_count_company INTEGER,
    priority TEXT,
    debt_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.debtor_id,
        c.debtor_name,
        c.debtor_rut,
        c.company_id,
        c.company_name,
        c.subject,
        c.status,
        c.last_message_at,
        c.last_message_content,
        c.unread_count,
        c.unread_count_company,
        c.priority,
        c.debt_id,
        c.metadata,
        c.created_at,
        c.updated_at
    FROM conversations c
    WHERE 
        (p_user_id IS NULL OR c.debtor_id = p_user_id)
        AND (p_company_id IS NULL OR c.company_id = p_company_id)
        AND (p_status IS NULL OR c.status = p_status)
        AND (NOT p_unread_only OR (c.unread_count > 0 OR c.unread_count_company > 0))
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función de utilidad para enviar mensaje con actualización automática
CREATE OR REPLACE FUNCTION send_message(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_sender_type TEXT,
    p_content TEXT,
    p_content_type TEXT DEFAULT 'text',
    p_metadata JSONB DEFAULT '{}',
    p_ai_generated BOOLEAN DEFAULT FALSE,
    p_ai_confidence DECIMAL(3,2) DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_message_id UUID;
    v_conversation_exists BOOLEAN;
BEGIN
    -- Verificar que la conversación existe y el usuario tiene permisos
    SELECT EXISTS(
        SELECT 1 FROM conversations c
        WHERE c.id = p_conversation_id
        AND (
            (p_sender_type = 'debtor' AND c.debtor_id = p_sender_id)
            OR (p_sender_type = 'company' AND EXISTS(
                SELECT 1 FROM companies comp
                WHERE comp.id = c.company_id AND comp.user_id = p_sender_id
            ))
        )
    ) INTO v_conversation_exists;
    
    IF NOT v_conversation_exists THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Conversación no encontrada o sin permisos'::TEXT;
        RETURN;
    END IF;
    
    -- Insertar el mensaje
    INSERT INTO messages (
        conversation_id,
        sender_id,
        sender_type,
        content,
        content_type,
        metadata,
        ai_generated,
        ai_confidence
    ) VALUES (
        p_conversation_id,
        p_sender_id,
        p_sender_type,
        p_content,
        p_content_type,
        p_metadata,
        p_ai_generated,
        p_ai_confidence
    ) RETURNING id INTO v_message_id;
    
    -- El trigger actualizará automáticamente los contadores
    RETURN QUERY SELECT TRUE, v_message_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE conversations IS 'Tabla principal de conversaciones entre deudores y empresas';
COMMENT ON TABLE messages IS 'Tabla de mensajes individuales dentro de las conversaciones';
COMMENT ON TABLE message_attachments IS 'Tabla para archivos adjuntos a los mensajes';

COMMENT ON COLUMN conversations.metadata IS 'Metadatos adicionales en formato JSON';
COMMENT ON COLUMN messages.metadata IS 'Metadatos del mensaje como propuestas, archivos, etc.';
COMMENT ON COLUMN messages.ai_generated IS 'Indica si el mensaje fue generado por IA';
COMMENT ON COLUMN messages.ai_confidence IS 'Nivel de confianza de la IA (0.00 a 1.00)';
COMMENT ON COLUMN messages.escalation_triggered IS 'Indica si el mensaje activó una escalada a humano';