-- =====================================================
-- INSERTAR CLIENTES CORPORATIVOS DE PRUEBA
-- Para probar la funcionalidad de Base de Conocimiento
-- =====================================================

-- Insertar clientes corporativos de ejemplo para cada empresa
INSERT INTO corporate_clients (company_id, name, display_category, contact_info, trust_level) 
SELECT 
  c.id,
  CASE 
    WHEN c.name LIKE '%Banco%' THEN 'Banco Estado'
    WHEN c.name LIKE '%Retail%' THEN 'Falabella Retail'
    WHEN c.name LIKE '%Telecom%' THEN 'Entel Telecomunicaciones'
    ELSE 'Cliente Corporativo Demo'
  END,
  CASE 
    WHEN c.name LIKE '%Banco%' THEN 'banco'
    WHEN c.name LIKE '%Retail%' THEN 'retail'
    WHEN c.name LIKE '%Telecom%' THEN 'telecomunicaciones'
    ELSE 'financiera'
  END,
  jsonb_build_object(
    'phone', '+56 2 2345 6789',
    'email', 'contacto@' || LOWER(REPLACE(REPLACE(REPLACE(c.name, ' ', ''), 'Á', 'a'), 'É', 'e')) || '.cl',
    'address', 'Av. Principal 123, Santiago',
    'contact_person', 'Juan Pérez',
    'industry', CASE 
      WHEN c.name LIKE '%Banco%' THEN 'Banca y Servicios Financieros'
      WHEN c.name LIKE '%Retail%' THEN 'Retail y Comercio'
      WHEN c.name LIKE '%Telecom%' THEN 'Telecomunicaciones'
      ELSE 'Servicios Generales'
    END
  ),
  'verified'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM corporate_clients cc WHERE cc.company_id = c.id
)
LIMIT 10;

-- Insertar segmentos de ejemplo para cada cliente corporativo
INSERT INTO corporate_segments (corporate_id, name, description, criteria)
SELECT 
  cc.id,
  'Jóvenes Profesionales',
  'Segmento de clientes jóvenes entre 25-35 años con ingresos estables',
  jsonb_build_object(
    'age_range', jsonb_build_object('min', 25, 'max', 35),
    'income_level', 'medio_alto',
    'employment_status', 'employed',
    'risk_score', jsonb_build_object('min', 0.3, 'max', 0.7)
  )
FROM corporate_clients cc
WHERE NOT EXISTS (
  SELECT 1 FROM corporate_segments cs WHERE cs.corporate_id = cc.id AND cs.name = 'Jóvenes Profesionales'
);

INSERT INTO corporate_segments (corporate_id, name, description, criteria)
SELECT 
  cc.id,
  'Familias Nucleares',
  'Segmento de familias con deudas consolidadas y buen historial',
  jsonb_build_object(
    'family_status', 'married_with_children',
    'age_range', jsonb_build_object('min', 35, 'max', 55),
    'debt_age', jsonb_build_object('min', 30, 'max', 180),
    'payment_history', 'good'
  )
FROM corporate_clients cc
WHERE NOT EXISTS (
  SELECT 1 FROM corporate_segments cs WHERE cs.corporate_id = cc.id AND cs.name = 'Familias Nucleares'
);

INSERT INTO corporate_segments (corporate_id, name, description, criteria)
SELECT 
  cc.id,
  'Emprendedores',
  'Segmento de trabajadores independientes y pequeños empresarios',
  jsonb_build_object(
    'employment_status', 'self_employed',
    'age_range', jsonb_build_object('min', 30, 'max', 50),
    'income_stability', 'variable',
    'risk_score', jsonb_build_object('min', 0.4, 'max', 0.8)
  )
FROM corporate_clients cc
WHERE NOT EXISTS (
  SELECT 1 FROM corporate_segments cs WHERE cs.corporate_id = cc.id AND cs.name = 'Emprendedores'
);

-- Actualizar contadores
UPDATE corporate_clients 
SET segment_count = (
  SELECT COUNT(*) 
  FROM corporate_segments 
  WHERE corporate_id = corporate_clients.id AND is_active = true
);

-- Mostrar resultados
SELECT 
  cc.id,
  c.name as company_name,
  cc.name as corporate_client_name,
  cc.display_category,
  cc.trust_level,
  cc.segment_count,
  jsonb_extract_path_text(cc.contact_info, 'email') as contact_email
FROM corporate_clients cc
JOIN companies c ON c.id = cc.company_id
ORDER BY c.name, cc.name;

SELECT 
  cc.name as corporate_client,
  cs.name as segment_name,
  cs.description,
  cs.debtor_count
FROM corporate_segments cs
JOIN corporate_clients cc ON cc.id = cs.corporate_id
ORDER BY cc.name, cs.name;