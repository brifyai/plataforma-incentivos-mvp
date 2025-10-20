-- Agregar columna RUT a corporate_clients si no existe
ALTER TABLE corporate_clients ADD COLUMN IF NOT EXISTS rut VARCHAR(20);

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_corporate_clients_rut ON corporate_clients(rut);

-- Actualizar algunos clientes corporativos con RUTs de prueba
UPDATE corporate_clients SET rut = '76.123.456-7' WHERE name LIKE '%Corporación ABC%';
UPDATE corporate_clients SET rut = '77.987.654-3' WHERE name LIKE '%TechCorp%';
UPDATE corporate_clients SET rut = '78.456.789-0' WHERE name LIKE '%RetailMax%';
UPDATE corporate_clients SET rut = '79.111.222-1' WHERE name LIKE '%Empresa%';
UPDATE corporate_clients SET rut = '80.333.444-4' WHERE name LIKE '%AIntelligence%';