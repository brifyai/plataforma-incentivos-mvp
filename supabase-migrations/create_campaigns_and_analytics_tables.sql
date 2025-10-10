-- =====================================================
-- Migration: Create Campaigns and Analytics Tables
-- Description: Creates tables for campaign management, AI interventions, and analytics
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: campaigns
-- Stores information about message campaigns sent to debtors
-- =====================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    corporate_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')),

    -- Campaign configuration
    offer_details JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',

    -- Statistics
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    viewed_count INTEGER DEFAULT 0,
    responded_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,

    -- Timing
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: campaign_recipients
-- Stores individual recipients of campaigns with their status
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    debtor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'responded', 'converted', 'failed')),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,

    -- Response details
    response_type VARCHAR(50), -- 'accepted_offer', 'counter_offer', 'needs_time', 'unreachable', etc.
    response_details JSONB DEFAULT '{}',

    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(campaign_id, debtor_id)
);

-- =====================================================
-- Table: campaign_responses
-- Stores detailed responses and interactions from campaign recipients
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_recipient_id UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,

    -- Response details
    response_type VARCHAR(50) NOT NULL,
    response_data JSONB DEFAULT '{}',
    ai_processed BOOLEAN DEFAULT FALSE,

    -- AI intervention tracking
    ai_intervention_id UUID,
    ai_confidence_score DECIMAL(3,2),

    -- Timing
    responded_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: ai_interventions
-- Stores AI-powered interventions and their effectiveness
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    campaign_recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE CASCADE,

    -- Intervention details
    intervention_type VARCHAR(50) NOT NULL, -- 'follow_up', 'negotiation', 'reminder', 'escalation'
    trigger_reason TEXT,
    ai_model_used VARCHAR(100),
    prompt_used TEXT,

    -- AI response
    ai_response TEXT,
    ai_confidence_score DECIMAL(3,2),

    -- Human override
    human_override BOOLEAN DEFAULT FALSE,
    human_response TEXT,
    human_override_reason TEXT,

    -- Effectiveness tracking
    effectiveness_score INTEGER CHECK (effectiveness_score >= 1 AND effectiveness_score <= 5),
    conversion_result VARCHAR(20) DEFAULT 'none' CHECK (conversion_result IN ('none', 'partial', 'full', 'negative')),

    -- Timing
    intervened_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: campaign_analytics
-- Stores aggregated analytics data for performance tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Daily metrics
    campaigns_sent INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_viewed INTEGER DEFAULT 0,
    responses_received INTEGER DEFAULT 0,
    conversions_generated INTEGER DEFAULT 0,

    -- AI metrics
    ai_interventions INTEGER DEFAULT 0,
    ai_effective_interventions INTEGER DEFAULT 0,
    ai_conversions INTEGER DEFAULT 0,

    -- Performance rates
    view_rate DECIMAL(5,2) DEFAULT 0.00,
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    ai_effectiveness_rate DECIMAL(5,2) DEFAULT 0.00,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, date)
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_corporate_client_id ON campaigns(corporate_client_id);

-- Campaign recipients indexes
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_debtor_id ON campaign_recipients(debtor_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_sent_at ON campaign_recipients(sent_at);

-- Campaign responses indexes
CREATE INDEX IF NOT EXISTS idx_campaign_responses_recipient_id ON campaign_responses(campaign_recipient_id);
CREATE INDEX IF NOT EXISTS idx_campaign_responses_type ON campaign_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_campaign_responses_ai_processed ON campaign_responses(ai_processed);

-- AI interventions indexes
CREATE INDEX IF NOT EXISTS idx_ai_interventions_company_id ON ai_interventions(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_type ON ai_interventions(intervention_type);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_effectiveness ON ai_interventions(effectiveness_score);
CREATE INDEX IF NOT EXISTS idx_ai_interventions_intervened_at ON ai_interventions(intervened_at DESC);

-- Campaign analytics indexes
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_company_id ON campaign_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON campaign_analytics(date DESC);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can view campaigns from their company" ON campaigns
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

CREATE POLICY "Users can create campaigns for their company" ON campaigns
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

CREATE POLICY "Users can update campaigns from their company" ON campaigns
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

-- Campaign recipients policies
CREATE POLICY "Users can view recipients from their company campaigns" ON campaign_recipients
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE company_id IN (
                SELECT id FROM companies WHERE user_id = auth.uid()
            )
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

CREATE POLICY "Users can manage recipients from their company campaigns" ON campaign_recipients
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE company_id IN (
                SELECT id FROM companies WHERE user_id = auth.uid()
            )
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

-- Campaign responses policies
CREATE POLICY "Users can view responses from their company campaigns" ON campaign_responses
    FOR SELECT USING (
        campaign_recipient_id IN (
            SELECT cr.id FROM campaign_recipients cr
            JOIN campaigns c ON cr.campaign_id = c.id
            WHERE c.company_id IN (
                SELECT id FROM companies WHERE user_id = auth.uid()
            )
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

CREATE POLICY "Users can manage responses from their company campaigns" ON campaign_responses
    FOR ALL USING (
        campaign_recipient_id IN (
            SELECT cr.id FROM campaign_recipients cr
            JOIN campaigns c ON cr.campaign_id = c.id
            WHERE c.company_id IN (
                SELECT id FROM companies WHERE user_id = auth.uid()
            )
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

-- AI interventions policies
CREATE POLICY "Users can view AI interventions from their company" ON ai_interventions
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

CREATE POLICY "Users can manage AI interventions from their company" ON ai_interventions
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

-- Campaign analytics policies
CREATE POLICY "Users can view analytics from their company" ON campaign_analytics
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

CREATE POLICY "Users can manage analytics from their company" ON campaign_analytics
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'god_mode')
    );

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign statistics based on recipient status changes
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE campaigns
        SET
            sent_count = (
                SELECT COUNT(*) FROM campaign_recipients
                WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'viewed', 'responded', 'converted')
            ),
            viewed_count = (
                SELECT COUNT(*) FROM campaign_recipients
                WHERE campaign_id = NEW.campaign_id AND status IN ('viewed', 'responded', 'converted')
            ),
            responded_count = (
                SELECT COUNT(*) FROM campaign_recipients
                WHERE campaign_id = NEW.campaign_id AND status IN ('responded', 'converted')
            ),
            converted_count = (
                SELECT COUNT(*) FROM campaign_recipients
                WHERE campaign_id = NEW.campaign_id AND status = 'converted'
            ),
            updated_at = NOW()
        WHERE id = NEW.campaign_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update campaign stats when recipients change
CREATE TRIGGER trigger_update_campaign_stats
    AFTER INSERT OR UPDATE OR DELETE ON campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_recipients_updated_at BEFORE UPDATE ON campaign_recipients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_responses_updated_at BEFORE UPDATE ON campaign_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_interventions_updated_at BEFORE UPDATE ON ai_interventions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_analytics_updated_at BEFORE UPDATE ON campaign_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration completion marker
-- =====================================================

-- Insert migration record
INSERT INTO schema_migrations (migration_name, executed_at, success, description)
VALUES ('012_create_campaigns_and_analytics_tables', NOW(), true, 'Create campaigns, recipients, responses, AI interventions, and analytics tables with proper RLS policies')
ON CONFLICT (migration_name) DO NOTHING;