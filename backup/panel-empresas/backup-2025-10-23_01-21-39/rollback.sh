#!/bin/bash
# Rollback automático para backup 2025-10-23_01-21-39

echo "🔄 Iniciando rollback al backup 2025-10-23_01-21-39..."

if [ ! -d "backup\panel-empresas\backup-2025-10-23_01-21-39" ]; then
    echo "❌ Directorio de backup no encontrado: backup\panel-empresas\backup-2025-10-23_01-21-39"
    exit 1
fi

echo "💾 Haciendo backup del estado actual..."
cp -r src/pages/company backup/pre-rollback-$(date +%Y%m%d-%H%M%S)

echo "🔄 Restaurando archivos desde backup..."
cp -r "backup\panel-empresas\backup-2025-10-23_01-21-39/"* src/pages/company/

echo "✅ Rollback completado exitosamente"
echo "📁 Backup actual guardado en: backup/pre-rollback-$(date +%Y%m%d-%H%M%S)"
