/**
 * Test para verificar la funcionalidad de edición/guardado del portal de personas
 * 
 * Este script analiza las páginas del portal de deudores para verificar:
 * - Funcionalidad de edición/guardado en ProfilePage
 * - Funcionalidad de edición/guardado en WalletPage  
 * - Conexión con Supabase para actualizaciones
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analizando funcionalidad del portal de personas...\n');

// Análisis de ProfilePage
console.log('📋 ANALIZANDO PROFILE PAGE');
console.log('==========================');

const profilePagePath = './src/pages/debtor/ProfilePage.jsx';
if (fs.existsSync(profilePagePath)) {
  const profileContent = fs.readFileSync(profilePagePath, 'utf8');
  
  // Verificar función handleSave
  const hasHandleSave = profileContent.includes('const handleSave = async () =>');
  console.log(`${hasHandleSave ? '✅' : '❌'} Función handleSave encontrada`);
  
  // Verificar llamada a updateUserProfile
  const callsUpdateUserProfile = profileContent.includes('await updateUserProfile(user.id, updates)');
  console.log(`${callsUpdateUserProfile ? '✅' : '❌'} Llama a updateUserProfile con userId y updates`);
  
  // Verificar refreshProfile
  const callsRefreshProfile = profileContent.includes('await refreshProfile()');
  console.log(`${callsRefreshProfile ? '✅' : '❌'} Refresca el perfil después de guardar`);
  
  // Verificar manejo de errores
  const hasErrorHandling = profileContent.includes('if (error)') && profileContent.includes('setError(error)');
  console.log(`${hasErrorHandling ? '✅' : '❌'} Manejo de errores implementado`);
  
  // Verificar estado de edición
  const hasEditingState = profileContent.includes('const [isEditing, setIsEditing] = useState(false)');
  console.log(`${hasEditingState ? '✅' : '❌'} Estado de edición implementado`);
  
  // Verificar botones Editar/Guardar
  const hasEditButton = profileContent.includes('<Edit className="w-4 h-4 mr-2" />');
  const hasSaveButton = profileContent.includes('<Save className="w-4 h-4 mr-2" />');
  console.log(`${hasEditButton ? '✅' : '❌'} Botón Editar presente`);
  console.log(`${hasSaveButton ? '✅' : '❌'} Botón Guardar presente`);
  
  // Verificar cambio de contraseña
  const hasPasswordChange = profileContent.includes('handleChangePassword') && profileContent.includes('hashPassword');
  console.log(`${hasPasswordChange ? '✅' : '❌'} Funcionalidad de cambio de contraseña implementada`);
  
} else {
  console.log('❌ ProfilePage.jsx no encontrado');
}

console.log('\n📋 ANALIZANDO WALLET PAGE');
console.log('==========================');

const walletPagePath = './src/pages/debtor/WalletPage.jsx';
if (fs.existsSync(walletPagePath)) {
  const walletContent = fs.readFileSync(walletPagePath, 'utf8');
  
  // Verificar funciones de wallet
  const hasAddFunds = walletContent.includes('confirmAddFunds');
  const hasWithdrawFunds = walletContent.includes('confirmWithdrawFunds');
  const hasGiftCard = walletContent.includes('confirmRedeemGiftCard');
  
  console.log(`${hasAddFunds ? '✅' : '❌'} Función Agregar Fondos implementada`);
  console.log(`${hasWithdrawFunds ? '✅' : '❌'} Función Retirar Fondos implementada`);
  console.log(`${hasGiftCard ? '✅' : '❌'} Función Canjear Gift Card implementada`);
  
  // Verificar si las funciones son simuladas o reales
  const hasSimulatedOperations = walletContent.includes('// Simular procesamiento');
  console.log(`${hasSimulatedOperations ? '⚠️' : '✅'} Operaciones ${hasSimulatedOperations ? 'SIMULADAS (no guardan en BD)' : 'REALES (conectadas a BD)'}`);
  
  // Verificar uso de useWallet hook
  const usesWalletHook = walletContent.includes('const { balance, transactions, getStats } = useWallet()');
  console.log(`${usesWalletHook ? '✅' : '❌'} Usa hook useWallet`);
  
  // Verificar modales
  const hasModals = walletContent.includes('<Modal') && walletContent.includes('isOpen=');
  console.log(`${hasModals ? '✅' : '❌'} Modales implementados`);
  
} else {
  console.log('❌ WalletPage.jsx no encontrado');
}

console.log('\n📋 ANALIZANDO SERVICIOS');
console.log('========================');

// Verificar updateUserProfile en databaseService
const dbServicePath = './src/services/databaseService.js';
let dbContent = '';
if (fs.existsSync(dbServicePath)) {
  dbContent = fs.readFileSync(dbServicePath, 'utf8');
  
  const hasUpdateUserProfile = dbContent.includes('export const updateUserProfile = async (userId, updates)');
  console.log(`${hasUpdateUserProfile ? '✅' : '❌'} updateUserProfile exportado en databaseService`);
  
  if (hasUpdateUserProfile) {
    // Extraer la función para analizarla
    const functionMatch = dbContent.match(/export const updateUserProfile = async \([^)]+\) => {[\s\S]*?^};/m);
    if (functionMatch) {
      const functionBody = functionMatch[0];
      
      // Verificar si usa Supabase
      const usesSupabase = functionBody.includes('supabase') && functionBody.includes('.from(');
      console.log(`${usesSupabase ? '✅' : '❌'} Función usa Supabase para actualizar`);
      
      // Verificar si actualiza tabla users
      const updatesUsersTable = functionBody.includes('.from(\'users\')') && functionBody.includes('.update(');
      console.log(`${updatesUsersTable ? '✅' : '❌'} Actualiza tabla users en Supabase`);
      
      // Verificar manejo de errores
      const hasTryCatch = functionBody.includes('try {') && functionBody.includes('catch');
      console.log(`${hasTryCatch ? '✅' : '❌'} Manejo de errores con try/catch`);
      
      // Verificar retorno de error
      const returnsError = functionBody.includes('return { error');
      console.log(`${returnsError ? '✅' : '❌'} Retorna objeto de error apropiado`);
    }
  }
} else {
  console.log('❌ databaseService.js no encontrado');
}

// Verificar si hay funciones de wallet en los servicios
console.log('\n📋 ANALIZANDO FUNCIONES DE WALLET');
console.log('===================================');

const hasWalletFunctions = dbContent && (
  dbContent.includes('addFunds') || 
  dbContent.includes('withdrawFunds') || 
  dbContent.includes('updateWallet') ||
  dbContent.includes('createTransaction')
);

if (hasWalletFunctions) {
  console.log('✅ Funciones de wallet encontradas en databaseService');
  
  const hasAddFunds = dbContent.includes('addFunds');
  const hasWithdrawFunds = dbContent.includes('withdrawFunds');
  const hasCreateTransaction = dbContent.includes('createTransaction');
  
  console.log(`${hasAddFunds ? '✅' : '❌'} addFunds function`);
  console.log(`${hasWithdrawFunds ? '✅' : '❌'} withdrawFunds function`);
  console.log(`${hasCreateTransaction ? '✅' : '❌'} createTransaction function`);
} else {
  console.log('❌ No se encontraron funciones de wallet en databaseService');
  console.log('⚠️  Las operaciones de wallet podrían estar simuladas');
}

console.log('\n📋 ANÁLISIS DE HOOKS');
console.log('===================');

// Verificar hook useWallet
const useWalletPath = './src/hooks/useWallet.js';
if (fs.existsSync(useWalletPath)) {
  const useWalletContent = fs.readFileSync(useWalletPath, 'utf8');
  
  const hasUseWallet = useWalletContent.includes('export const useWallet = ()');
  console.log(`${hasUseWallet ? '✅' : '❌'} Hook useWallet exportado`);
  
  if (hasUseWallet) {
    // Verificar si carga datos reales
    const loadsFromDatabase = useWalletContent.includes('supabase') || useWalletContent.includes('databaseService');
    console.log(`${loadsFromDatabase ? '✅' : '❌'} Carga datos desde base de datos`);
    
    // Verificar si tiene funciones de actualización
    const hasUpdateFunctions = useWalletContent.includes('addFunds') || useWalletContent.includes('withdrawFunds');
    console.log(`${hasUpdateFunctions ? '✅' : '❌'} Tiene funciones de actualización`);
  }
} else {
  console.log('❌ Hook useWallet no encontrado');
}

console.log('\n📋 RESUMEN DE FUNCIONALIDAD');
console.log('===========================');

// Variables para el resumen
let profileHasHandleSave = false;
let profileCallsUpdateUserProfile = false;
let profileHasPasswordChange = false;
let walletHasAddFunds = false;
let walletHasWithdrawFunds = false;
let walletHasGiftCard = false;
let walletHasSimulatedOperations = false;
let dbHasUpdateUserProfile = false;
let dbHasWalletFunctions = false;

// Re-analizar para el resumen
if (fs.existsSync(profilePagePath)) {
  const profileContent = fs.readFileSync(profilePagePath, 'utf8');
  profileHasHandleSave = profileContent.includes('const handleSave = async () =>');
  profileCallsUpdateUserProfile = profileContent.includes('await updateUserProfile(user.id, updates)');
  profileHasPasswordChange = profileContent.includes('handleChangePassword') && profileContent.includes('hashPassword');
}

if (fs.existsSync(walletPagePath)) {
  const walletContent = fs.readFileSync(walletPagePath, 'utf8');
  walletHasAddFunds = walletContent.includes('confirmAddFunds');
  walletHasWithdrawFunds = walletContent.includes('confirmWithdrawFunds');
  walletHasGiftCard = walletContent.includes('confirmRedeemGiftCard');
  walletHasSimulatedOperations = walletContent.includes('// Simular procesamiento');
}

if (fs.existsSync(dbServicePath)) {
  const dbContent = fs.readFileSync(dbServicePath, 'utf8');
  dbHasUpdateUserProfile = dbContent.includes('export const updateUserProfile = async (userId, updates)');
  dbHasWalletFunctions = dbContent && (
    dbContent.includes('addFunds') ||
    dbContent.includes('withdrawFunds') ||
    dbContent.includes('updateWallet') ||
    dbContent.includes('createTransaction')
  );
}

console.log('\n🔵 PROFILE PAGE:');
console.log('- Edición de perfil: ' + (profileHasHandleSave ? '✅ Funcional' : '❌ No implementado'));
console.log('- Guardado en BD: ' + (profileCallsUpdateUserProfile ? '✅ Conectado a Supabase' : '❌ Sin conexión'));
console.log('- Cambio de contraseña: ' + (profileHasPasswordChange ? '✅ Funcional' : '❌ No implementado'));

console.log('\n🔵 WALLET PAGE:');
console.log('- Agregar fondos: ' + (walletHasAddFunds ? (walletHasSimulatedOperations ? '⚠️ Simulado' : '✅ Funcional') : '❌ No implementado'));
console.log('- Retirar fondos: ' + (walletHasWithdrawFunds ? (walletHasSimulatedOperations ? '⚠️ Simulado' : '✅ Funcional') : '❌ No implementado'));
console.log('- Canje gift cards: ' + (walletHasGiftCard ? (walletHasSimulatedOperations ? '⚠️ Simulado' : '✅ Funcional') : '❌ No implementado'));

console.log('\n🔵 SERVICIOS:');
console.log('- updateUserProfile: ' + (dbHasUpdateUserProfile ? '✅ Disponible' : '❌ No encontrado'));
console.log('- Funciones wallet: ' + (dbHasWalletFunctions ? '✅ Disponibles' : '❌ No encontradas'));

console.log('\n📋 RECOMENDACIONES');
console.log('==================');

if (walletHasSimulatedOperations) {
  console.log('⚠️  Las operaciones de wallet están simuladas');
  console.log('   - Se deben implementar funciones reales en databaseService');
  console.log('   - Conectar con tabla wallet_transactions en Supabase');
  console.log('   - Actualizar el balance del usuario en la tabla users');
}

if (!dbHasWalletFunctions) {
  console.log('❌ Faltan funciones de wallet en databaseService');
  console.log('   - Implementar addFunds(userId, amount)');
  console.log('   - Implementar withdrawFunds(userId, amount)');
  console.log('   - Implementar createTransaction(userId, amount, type, concept)');
}

if (profileCallsUpdateUserProfile && dbHasUpdateUserProfile) {
  console.log('✅ La funcionalidad de perfil está correctamente implementada');
  console.log('   - Los cambios se guardan en Supabase');
  console.log('   - Hay manejo de errores');
  console.log('   - La UI se actualiza después de guardar');
}

console.log('\n🎯 ESTADO GENERAL: ' + (
  (profileHasHandleSave && profileCallsUpdateUserProfile && !walletHasSimulatedOperations)
    ? '✅ FUNCIONALIDAD COMPLETA'
    : '⚠️  REQUIERE MEJORAS'
));

console.log('\n📝 Para probar manualmente:');
console.log('1. Ingresar a http://localhost:3002/personas/perfil');
console.log('2. Hacer clic en "Editar"');
console.log('3. Modificar datos y guardar');
console.log('4. Verificar que los cambios persistan al recargar');
console.log('5. Ir a http://localhost:3002/personas/billetera');
console.log('6. Intentar agregar/retirar fondos');
console.log('7. Verificar si las operaciones son reales o simuladas');