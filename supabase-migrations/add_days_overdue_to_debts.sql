-- =============================================
-- AGREGAR CAMPO DAYS_OVERDUE A TABLA DEBTS
-- Migración: Agregar días de atraso a deudas
-- =============================================

-- Agregar columna days_overdue a la tabla debts
ALTER TABLE public.debts
ADD COLUMN days_overdue INTEGER DEFAULT 0;

-- Crear índice para búsquedas por días de atraso
CREATE INDEX idx_debts_days_overdue ON public.debts(days_overdue);

-- Función para calcular días de atraso automáticamente
CREATE OR REPLACE FUNCTION calculate_days_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular días de atraso si la deuda está activa y tiene fecha de vencimiento
  IF NEW.status = 'active' AND NEW.due_date IS NOT NULL THEN
    NEW.days_overdue := GREATEST(0, EXTRACT(EPOCH FROM (CURRENT_DATE - NEW.due_date)) / 86400)::INTEGER;
  ELSE
    NEW.days_overdue := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar días de atraso automáticamente
CREATE TRIGGER trigger_calculate_days_overdue
  BEFORE INSERT OR UPDATE ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_days_overdue();

-- Actualizar registros existentes
UPDATE public.debts
SET updated_at = NOW()
WHERE status = 'active' AND due_date IS NOT NULL;

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================