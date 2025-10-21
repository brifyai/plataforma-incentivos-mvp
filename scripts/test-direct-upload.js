/**
 * Script para probar subida directa al bucket verification-documents
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvluqdldygmgncqqjkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHVxZGxkeWdtZ25jcXFqa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzIzMTgsImV4cCI6MjA3NTAwODMxOH0.MAdrj__CjDY8DlLn9Nzsm1spx8MXH1_uWe6OjVGiWM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectUpload() {
  try {
    console.log('🚀 Probando subida directa al bucket verification-documents...');
    console.log('=' .repeat(60));

    // Crear un archivo PDF de prueba
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Page /Parent 1 0 R /Resources << /Font << /F1 3 0 R >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj

3 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 72 720 Td (Test PDF File) Tj ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000092 00000 n 
0000000140 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
164
%%EOF`;

    const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'test-document.pdf', { type: 'application/pdf' });

    console.log('📄 Archivo PDF de prueba creado');
    console.log('📋 Tamaño:', pdfFile.size, 'bytes');
    console.log('📋 Tipo:', pdfFile.type);

    // Intentar subir el archivo
    const fileName = `test_${Date.now()}_verification.pdf`;
    console.log('📤 Intentando subir archivo:', fileName);

    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, pdfFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error en la subida:', error);
      console.log('📋 Detalles completos:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        error: error.error
      });

      // Análisis del error
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log('\n🔧 Diagnóstico: El bucket no existe o no es accesible');
        console.log('💡 Solución: Crea el bucket manualmente o verifica permisos');
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        console.log('\n🔧 Diagnóstico: Problema de permisos (RLS)');
        console.log('💡 Solución: Configura políticas RLS para Storage');
      } else if (error.message.includes('mime') || error.message.includes('type')) {
        console.log('\n🔧 Diagnóstico: Tipo de archivo no permitido');
        console.log('💡 Solución: Verifica MIME types permitidos en el bucket');
      } else if (error.message.includes('size')) {
        console.log('\n🔧 Diagnóstico: Archivo demasiado grande');
        console.log('💡 Solución: Verifica límite de tamaño del bucket');
      }

      return { success: false, error: error.message };
    }

    console.log('✅ Subida exitosa!');
    console.log('📋 Datos:', data);

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    console.log('🔗 URL pública:', urlData.publicUrl);

    // Listar archivos para verificar
    console.log('\n📋 Listando archivos en el bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from('verification-documents')
      .list('', { limit: 10 });

    if (listError) {
      console.error('❌ Error listando archivos:', listError);
    } else {
      console.log('✅ Archivos en el bucket:', files?.length || 0);
      files?.forEach(file => {
        console.log(`  - ${file.name} (${file.created_at})`);
      });
    }

    // Limpiar archivo de prueba
    console.log('\n🧹 Limpiando archivo de prueba...');
    const { error: deleteError } = await supabase.storage
      .from('verification-documents')
      .remove([fileName]);

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar el archivo de prueba:', deleteError);
    } else {
      console.log('✅ Archivo de prueba eliminado');
    }

    console.log('\n✅ Prueba completada exitosamente');
    console.log('🎯 El bucket verification-documents funciona correctamente');
    console.log('📤 Los botones de subida deberían funcionar ahora');

    return { success: true, message: 'Subida directa funciona' };

  } catch (error) {
    console.error('💥 Error general en testDirectUpload:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Prueba Directa de Subida');
  console.log('🔧 NexuPay - Verificación de Bucket');
  console.log('=' .repeat(60));

  const result = await testDirectUpload();

  console.log('\n' + '=' .repeat(60));
  if (result.success) {
    console.log('✅ ÉXITO:', result.message);
    console.log('🎯 El bucket está configurado correctamente');
    console.log('📤 Prueba los botones en: http://localhost:3002/empresa/verification');
  } else {
    console.log('❌ ERROR:', result.error);
    console.log('\n🔧 Solución requerida:');
    console.log('1. Ve a: https://app.supabase.com/project/wvluqdldygmgncqqjkow/storage');
    console.log('2. Verifica que el bucket verification-documents exista');
    console.log('3. Asegúrate que sea público');
    console.log('4. Configura políticas RLS si es necesario');
  }
}

main().catch(console.error);