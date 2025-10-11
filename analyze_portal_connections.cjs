/**
 * Análisis de Conexiones entre Portales - Sistema NexuPay
 * 
 * Verifica que los 3 portales (personas/deudores, empresas, administrador)
 * estén completamente conectados y que la información fluya correctamente.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ANALIZANDO CONEXIONES ENTRE PORTALES - SISTEMA NEXUPAY');
console.log('=' .repeat(60));

// 1. Analizar estructura de la base de datos
console.log('\n📊 1. ESTRUCTURA DE BASE DE DATOS Y TABLAS PRINCIPALES');

const dbServicePath = path.join(__dirname, 'src/services/databaseService.js');
const dbContent = fs.readFileSync(dbServicePath, 'utf8');

// Extraer funciones principales que conectan los portales
const mainFunctions = [
  'getUserProfile',
  'getCompanyProfile', 
  'getUserDebts',
  'getCompanyDebts',
  'getCompanyClients',
  'createDebt',
  'createPayment',
  'createAgreement',
  'getAllUsers',
  'getAllCompanies',
  'getPaymentStats',
  'getRecentPayments',
  'getPendingPayments'
];

console.log('\nFunciones de conexión encontradas:');
mainFunctions.forEach(func => {
  const hasFunction = dbContent.includes(`export const ${func}`);
  console.log(`  ${hasFunction ? '✅' : '❌'} ${func}`);
});

// 2. Analizar rutas y portales
console.log('\n🌐 2. ESTRUCTURA DE PORTALES Y RUTAS');

const routerPath = path.join(__dirname, 'src/routes/AppRouter.jsx');
const routerContent = fs.readFileSync(routerPath, 'utf8');

// Extraer rutas principales
const portalRoutes = {
  debtor: [],
  company: [],
  admin: []
};

// Buscar rutas de deudores/personas
const debtorRoutes = routerContent.match(/path="\/deudor[^"]*"/g) || [];
const debtorRoutes2 = routerContent.match(/path="\/[^"]*deudor[^"]*"/g) || [];
portalRoutes.debtor = [...new Set([...debtorRoutes, ...debtorRoutes2])];

// Buscar rutas de empresas
const companyRoutes = routerContent.match(/path="\/empresa[^"]*"/g) || [];
const companyRoutes2 = routerContent.match(/path="\/[^"]*company[^"]*"/g) || [];
portalRoutes.company = [...new Set([...companyRoutes, ...companyRoutes2])];

// Buscar rutas de admin
const adminRoutes = routerContent.match(/path="\/admin[^"]*"/g) || [];
portalRoutes.admin = [...new Set([...adminRoutes])];

console.log('\nRutas por portal:');
console.log(`👤 Portal Deudores/Personas (${portalRoutes.debtor.length} rutas):`);
portalRoutes.debtor.forEach(route => console.log(`  ${route}`));

console.log(`\n🏢 Portal Empresas (${portalRoutes.company.length} rutas):`);
portalRoutes.company.forEach(route => console.log(`  ${route}`));

console.log(`\n⚙️ Portal Administrador (${portalRoutes.admin.length} rutas):`);
portalRoutes.admin.forEach(route => console.log(`  ${route}`));

// 3. Analizar páginas principales de cada portal
console.log('\n📄 3. PÁGINAS PRINCIPALES POR PORTAL');

const pagesDir = path.join(__dirname, 'src/pages');

const debtorPages = [
  'DebtorDashboard.jsx',
  'DebtsPage.jsx', 
  'OffersPage.jsx',
  'AgreementsPage.jsx',
  'PaymentsPage.jsx',
  'WalletPage.jsx',
  'MessagesPage.jsx',
  'ProfilePage.jsx'
];

const companyPages = [
  'CompanyDashboard.jsx',
  'ClientsPage.jsx',
  'ClientDebtsPage.jsx',
  'CampaignsPage.jsx',
  'OffersPage.jsx',
  'AgreementsPage.jsx',
  'CompanyMessagesPage.jsx',
  'ProfilePage.jsx'
];

const adminPages = [
  'AdminDashboard.jsx',
  'AdminUsersPage.jsx',
  'AdminDebtorsPage.jsx',
  'AdminCompaniesPage.jsx',
  'PaymentsDashboard.jsx',
  'AdminAnalyticsPage.jsx'
];

console.log('\n👤 Portal Deudores/Personas:');
debtorPages.forEach(page => {
  const filePath = path.join(pagesDir, 'debtor', page);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${page}`);
});

console.log('\n🏢 Portal Empresas:');
companyPages.forEach(page => {
  const filePath = path.join(pagesDir, 'company', page);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${page}`);
});

console.log('\n⚙️ Portal Administrador:');
adminPages.forEach(page => {
  const filePath = path.join(pagesDir, 'admin', page);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${page}`);
});

// 4. Analizar flujo de datos entre portales
console.log('\n🔄 4. FLUJO DE DATOS ENTRE PORTALES');

// Verificar funciones que comparten datos
const dataFlowFunctions = {
  'Deudor → Empresa': [
    'getUserDebts', // Deudas del deudor visibles para empresas
    'createAgreement', // Acuerdos creados por deudores
    'createPayment', // Pagos realizados por deudores
    'getUserProfile' // Perfil del deudor visible para empresas
  ],
  'Deudor → Admin': [
    'getAllUsers', // Todos los usuarios visibles para admin
    'getUserDebts', // Deudas visibles para admin
    'getRecentPayments', // Pagos recientes visibles para admin
    'getUserProfile' // Perfil completo para admin
  ],
  'Empresa → Deudor': [
    'getCompanyOffers', // Ofertas de empresas visibles para deudores
    'getCompanyAgreements', // Acuerdos visibles para deudores
    'getCompanyProfile' // Perfil de empresa visible para deudores
  ],
  'Empresa → Admin': [
    'getAllCompanies', // Todas las empresas visibles para admin
    'getCompanyDebts', // Deudas gestionadas por empresas
    'getCompanyClients', // Clientes de empresas visibles para admin
    'getCompanyAnalytics' // Analytics de empresas para admin
  ],
  'Admin → Deudor': [
    'getSystemConfig', // Configuración del sistema que afecta a deudores
    'getPaymentStats' // Estadísticas que pueden influir en deudores
  ],
  'Admin → Empresa': [
    'getSystemConfig', // Configuración del sistema para empresas
    'getPaymentGoals', // Objetivos de pago para empresas
    'getCommissionStats' // Comisiones para empresas
  ]
};

Object.entries(dataFlowFunctions).forEach(([flow, functions]) => {
  console.log(`\n${flow}:`);
  functions.forEach(func => {
    const hasFunction = dbContent.includes(func);
    console.log(`  ${hasFunction ? '✅' : '❌'} ${func}`);
  });
});

// 5. Analizar tablas compartidas
console.log('\n🗃️ 5. TABLAS COMPARTIDAS ENTRE PORTALES');

const sharedTables = [
  'users', // Usuarios (deudores)
  'companies', // Empresas de cobranza
  'debts', // Deudas (conecta deudores con empresas)
  'offers', // Ofertas (empresas → deudores)
  'agreements', // Acuerdos (deudores ↔ empresas)
  'payments', // Pagos (deudores → empresas)
  'clients', // Clientes corporativos (empresas ↔ admin)
  'notifications', // Notificaciones para todos
  'messages', // Mensajes entre portales
  'wallet_transactions' // Billetera (principalmente deudores)
];

console.log('\nTablas que conectan los portales:');
sharedTables.forEach(table => {
  const hasTable = dbContent.includes(`from('${table}')`) || dbContent.includes(`.from('${table}')`);
  console.log(`  ${hasTable ? '✅' : '❌'} ${table}`);
});

// 6. Verificar componentes de autenticación compartidos
console.log('\n🔐 6. AUTENTICACIÓN Y PERMISOS COMPARTIDOS');

const authPath = path.join(__dirname, 'src/context/AuthContext.jsx');
const authContent = fs.existsSync(authPath) ? fs.readFileSync(authPath, 'utf8') : '';

const authFeatures = [
  'useAuth', // Hook de autenticación
  'login', // Función de login
  'logout', // Función de logout
  'register', // Función de registro
  'user', // Estado del usuario
  'profile', // Perfil del usuario
  'role', // Rol del usuario
  'isAuthenticated' // Estado de autenticación
];

console.log('\nCaracterísticas de autenticación:');
authFeatures.forEach(feature => {
  const hasFeature = authContent.includes(feature);
  console.log(`  ${hasFeature ? '✅' : '❌'} ${feature}`);
});

// 7. Analizar notificaciones y comunicación
console.log('\n📢 7. SISTEMA DE NOTIFICACIONES Y COMUNICACIÓN');

const notificationPath = path.join(__dirname, 'src/context/NotificationContext.jsx');
const notificationContent = fs.existsSync(notificationPath) ? fs.readFileSync(notificationPath, 'utf8') : '';

const notificationFeatures = [
  'createNotification', // Crear notificación
  'getUserNotifications', // Obtener notificaciones de usuario
  'markNotificationAsRead', // Marcar como leída
  'sendMessage', // Enviar mensaje
  'getMessages' // Obtener mensajes
];

console.log('\nCaracterísticas de notificación:');
notificationFeatures.forEach(feature => {
  const hasFeature = dbContent.includes(feature) || notificationContent.includes(feature);
  console.log(`  ${hasFeature ? '✅' : '❌'} ${feature}`);
});

// 8. Calcular porcentaje de conectividad
console.log('\n📈 8. MÉTRICAS DE CONECTIVIDAD');

let totalChecks = 0;
let passedChecks = 0;

// Contar funciones de base de datos
mainFunctions.forEach(func => {
  totalChecks++;
  if (dbContent.includes(`export const ${func}`)) passedChecks++;
});

// Contar páginas
[...debtorPages, ...companyPages, ...adminPages].forEach(page => {
  totalChecks++;
  const portal = debtorPages.includes(page) ? 'debtor' : 
                companyPages.includes(page) ? 'company' : 'admin';
  const filePath = path.join(pagesDir, portal, page);
  if (fs.existsSync(filePath)) passedChecks++;
});

// Contar funciones de flujo de datos
Object.values(dataFlowFunctions).flat().forEach(func => {
  totalChecks++;
  if (dbContent.includes(func)) passedChecks++;
});

// Contar tablas compartidas
sharedTables.forEach(table => {
  totalChecks++;
  const hasTable = dbContent.includes(`from('${table}')`) || dbContent.includes(`.from('${table}')`);
  if (hasTable) passedChecks++;
});

// Contar características de autenticación
authFeatures.forEach(feature => {
  totalChecks++;
  if (authContent.includes(feature)) passedChecks++;
});

const connectivityRate = ((passedChecks / totalChecks) * 100).toFixed(1);

console.log(`\n📊 RESUMEN DE CONECTIVIDAD:`);
console.log(`✅ Checks pasados: ${passedChecks}/${totalChecks}`);
console.log(`📈 Tasa de conectividad: ${connectivityRate}%`);

if (connectivityRate >= 90) {
  console.log('🎉 EXCELENTE: Los portales están muy bien conectados');
} else if (connectivityRate >= 70) {
  console.log('✅ BUENO: Los portales están conectados, pero hay espacio para mejora');
} else if (connectivityRate >= 50) {
  console.log('⚠️ REGULAR: Los portales tienen conexiones básicas pero faltan integraciones importantes');
} else {
  console.log('❌ PROBLEMÁTICO: Los portales no están suficientemente conectados');
}

console.log('\n' + '='.repeat(60));
console.log('🏁 ANÁLISIS DE CONEXIONES ENTRE PORTALES COMPLETADO');