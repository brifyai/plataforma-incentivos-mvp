/**
 * Test Script for Corporate Client Filters
 *
 * This script tests the corporate client filter functionality
 * across all admin pages to ensure proper implementation.
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Testing Corporate Client Filters Implementation\n');

// List of admin pages that should have corporate client filters
const adminPages = [
  {
    name: 'AdminUsersPage',
    path: 'src/pages/admin/AdminUsersPage.jsx',
    expectedImports: ['getAllCorporateClients'],
    expectedStates: ['filterCorporateClient', 'corporateClients'],
    expectedFunctions: ['loadCorporateClients'],
    expectedFilters: ['matchesCorporateClient']
  },
  {
    name: 'AdminDebtorsPage',
    path: 'src/pages/admin/AdminDebtorsPage.jsx',
    expectedImports: ['getAllCorporateClients'],
    expectedStates: ['filterCorporateClient', 'corporateClients'],
    expectedFunctions: ['loadCorporateClients'],
    expectedFilters: ['matchesCorporateClient']
  },
  {
    name: 'AdminCompaniesPage',
    path: 'src/pages/admin/AdminCompaniesPage.jsx',
    expectedImports: ['getAllCorporateClients'],
    expectedStates: ['filterCorporateClient', 'corporateClients'],
    expectedFunctions: ['loadCorporateClients'],
    expectedFilters: ['matchesCorporateClient']
  },
  {
    name: 'PaymentsDashboard',
    path: 'src/pages/admin/PaymentsDashboard.jsx',
    expectedImports: ['getAllCorporateClients'],
    expectedStates: ['filterCorporateClient', 'corporateClients'],
    expectedFunctions: ['loadCorporateClients', 'filterPaymentsByCorporateClient'],
    expectedFilters: ['filteredRecentPayments', 'filteredPendingPayments']
  },
  {
    name: 'AdminAnalyticsPage',
    path: 'src/pages/admin/AdminAnalyticsPage.jsx',
    expectedImports: ['getAllCorporateClients'],
    expectedStates: ['filterCorporateClient', 'corporateClients'],
    expectedFunctions: ['loadCorporateClients'],
    expectedFilters: []
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

console.log('📋 Running tests on admin pages...\n');

adminPages.forEach(page => {
  console.log(`🔍 Testing ${page.name}...`);
  
  try {
    const content = fs.readFileSync(page.path, 'utf8');
    let pagePassed = true;
    
    // Test imports
    page.expectedImports.forEach(importItem => {
      totalTests++;
      if (content.includes(importItem)) {
        console.log(`  ✅ Import found: ${importItem}`);
        passedTests++;
      } else {
        console.log(`  ❌ Import missing: ${importItem}`);
        failedTests++;
        pagePassed = false;
      }
    });
    
    // Test state variables
    page.expectedStates.forEach(state => {
      totalTests++;
      if (content.includes(`const [${state}`) || content.includes(`${state}, set`)) {
        console.log(`  ✅ State found: ${state}`);
        passedTests++;
      } else {
        console.log(`  ❌ State missing: ${state}`);
        failedTests++;
        pagePassed = false;
      }
    });
    
    // Test functions
    page.expectedFunctions.forEach(func => {
      totalTests++;
      if (content.includes(`const ${func}`) || content.includes(`function ${func}`)) {
        console.log(`  ✅ Function found: ${func}`);
        passedTests++;
      } else {
        console.log(`  ❌ Function missing: ${func}`);
        failedTests++;
        pagePassed = false;
      }
    });
    
    // Test filters
    page.expectedFilters.forEach(filter => {
      totalTests++;
      if (content.includes(filter)) {
        console.log(`  ✅ Filter found: ${filter}`);
        passedTests++;
      } else {
        console.log(`  ❌ Filter missing: ${filter}`);
        failedTests++;
        pagePassed = false;
      }
    });
    
    // Test for select element with corporate client options
    totalTests++;
    if (content.includes('filterCorporateClient') && 
        content.includes('corporateClients.map') &&
        content.includes('Todos los Clientes') &&
        content.includes('Sin Cliente Corporativo')) {
      console.log(`  ✅ Corporate client select dropdown found`);
      passedTests++;
    } else {
      console.log(`  ❌ Corporate client select dropdown missing or incomplete`);
      failedTests++;
      pagePassed = false;
    }
    
    // Test for Building icon import
    totalTests++;
    if (content.includes('Building') && content.includes('lucide-react')) {
      console.log(`  ✅ Building icon import found`);
      passedTests++;
    } else {
      console.log(`  ❌ Building icon import missing`);
      failedTests++;
      pagePassed = false;
    }
    
    if (pagePassed) {
      console.log(`  🎉 ${page.name} - ALL TESTS PASSED\n`);
    } else {
      console.log(`  ⚠️  ${page.name} - SOME TESTS FAILED\n`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error reading ${page.name}: ${error.message}\n`);
    failedTests++;
    totalTests++;
  }
});

// Test database service
console.log('🔍 Testing database service...');
try {
  const dbServicePath = 'src/services/databaseService.js';
  const dbContent = fs.readFileSync(dbServicePath, 'utf8');
  
  totalTests++;
  if (dbContent.includes('getAllCorporateClients')) {
    console.log('  ✅ getAllCorporateClients function found in database service');
    passedTests++;
  } else {
    console.log('  ❌ getAllCorporateClients function missing in database service');
    failedTests++;
  }
  
  totalTests++;
  if (dbContent.includes('corporate_clients')) {
    console.log('  ✅ corporate_clients table reference found');
    passedTests++;
  } else {
    console.log('  ❌ corporate_clients table reference missing');
    failedTests++;
  }
  
} catch (error) {
  console.log(`  ❌ Error reading database service: ${error.message}`);
  failedTests++;
  totalTests++;
}

console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Corporate client filters are properly implemented.');
  console.log('\n📝 Implementation Summary:');
  console.log('  ✅ All admin pages have corporate client filters');
  console.log('  ✅ Proper imports and state management');
  console.log('  ✅ Filter functions implemented');
  console.log('  ✅ UI components with select dropdowns');
  console.log('  ✅ Database service integration');
  console.log('  ✅ Building icons for visual consistency');
  
  console.log('\n🚀 Ready for testing in the browser!');
  console.log('   Visit: http://localhost:3002/admin/usuarios');
  console.log('   Visit: http://localhost:3002/admin/deudores');
  console.log('   Visit: http://localhost:3002/admin/empresas');
  console.log('   Visit: http://localhost:3002/admin/pagos');
  console.log('   Visit: http://localhost:3002/admin/analytics');
  
} else {
  console.log('\n⚠️  SOME TESTS FAILED. Please review the implementation.');
  console.log('   Check the failed items above and fix the issues.');
}

console.log('\n' + '='.repeat(60));