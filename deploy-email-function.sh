#!/bin/bash

# Script para desplegar la función edge de envío de emails
# Uso: ./deploy-email-function.sh

echo "🚀 Desplegando función edge de envío de emails..."

# Verificar que estamos en el directorio correcto
if [ ! -d "supabase/functions/send-email" ]; then
    echo "❌ Error: No se encuentra el directorio supabase/functions/send-email"
    echo "   Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# Verificar que supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI no está instalado"
    echo "   Instálalo con: npm install -g supabase"
    exit 1
fi

# Verificar que estamos logueados en Supabase
echo "🔍 Verificando autenticación en Supabase..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Error: No estás autenticado en Supabase"
    echo "   Ejecuta: supabase login"
    exit 1
fi

# Desplegar la función
echo "📤 Desplegando función send-email..."
supabase functions deploy send-email

if [ $? -eq 0 ]; then
    echo "✅ Función desplegada exitosamente!"
    echo ""
    echo "📋 Información de la función:"
    supabase functions list | grep send-email
    echo ""
    echo "🧪 Para probar la función:"
    echo "   node test-email.js"
    echo ""
    echo "📊 Para ver logs:"
    echo "   supabase functions logs send-email --follow"
else
    echo "❌ Error al desplegar la función"
    exit 1
fi

echo "🎉 Despliegue completado!"