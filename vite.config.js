import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3002,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React y librerías core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Supabase y librerías de base de datos
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // UI y componentes
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          
          // Utilidades y herramientas
          'utils-vendor': ['date-fns', 'lodash-es'],
          
          // Módulos de AI
          'ai-modules': [
            './src/modules/ai-negotiation/services/negotiationAIService.js',
            './src/modules/ai-negotiation/services/negotiationAnalyticsService.js',
            './src/services/aiService.js'
          ],
          
          // Servicios principales
          'services': [
            './src/services/databaseService.js',
            './src/services/authService.js',
            './src/services/messageService.js'
          ],
          
          // Páginas de admin
          'admin-pages': [
            './src/pages/admin/AdminDashboard.jsx',
            './src/pages/admin/AdminCompaniesPage.jsx',
            './src/pages/admin/AdminDebtorsPage.jsx'
          ],
          
          // Páginas de empresa
          'company-pages': [
            './src/pages/company/CompanyDashboard.jsx',
            './src/pages/company/CompanyMessagesPage.jsx',
            './src/pages/company/ClientsPage.jsx'
          ],
          
          // Páginas de deudor
          'debtor-pages': [
            './src/pages/debtor/DebtorDashboard.jsx',
            './src/pages/debtor/MessagesPage.jsx',
            './src/pages/debtor/DebtsPage.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2015'
  },
})
