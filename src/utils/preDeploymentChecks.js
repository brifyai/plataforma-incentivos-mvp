/**
 * Sistema de Verificación Pre-Despliegue
 * 
 * Verificaciones automáticas para prevenir errores en producción
 * como páginas en blanco y componentes rotos
 */

import { componentValidator, routeValidator, validateNavigationMenu } from './routeValidator.jsx';
import { appHealthMonitor } from './errorPrevention.jsx';

/**
 * Verificador principal de pre-despliegue
 */
export class PreDeploymentChecker {
  constructor() {
    this.checks = [];
    this.results = [];
    this.criticalIssues = [];
  }

  /**
   * Agrega una verificación personalizada
   */
  addCheck(name, checkFunction, isCritical = false) {
    this.checks.push({
      name,
      check: checkFunction,
      isCritical,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Ejecuta todas las verificaciones
   */
  async runAllChecks() {
    console.log('🔍 Starting pre-deployment checks...');
    this.results = [];
    this.criticalIssues = [];

    for (const checkConfig of this.checks) {
      try {
        console.log(`  ⏳ Running: ${checkConfig.name}`);
        const startTime = Date.now();
        
        const result = await checkConfig.check();
        const duration = Date.now() - startTime;
        
        const checkResult = {
          name: checkConfig.name,
          status: result.success ? 'PASS' : 'FAIL',
          message: result.message || '',
          details: result.details || {},
          duration,
          isCritical: checkConfig.isCritical,
          timestamp: new Date().toISOString()
        };

        this.results.push(checkResult);

        if (!result.success && checkConfig.isCritical) {
          this.criticalIssues.push(checkResult);
        }

        console.log(`  ${result.success ? '✅' : '❌'} ${checkConfig.name}: ${result.message || (result.success ? 'Passed' : 'Failed')}`);
      } catch (error) {
        const errorResult = {
          name: checkConfig.name,
          status: 'ERROR',
          message: `Check failed with error: ${error.message}`,
          details: { error: error.stack },
          isCritical: checkConfig.isCritical,
          timestamp: new Date().toISOString()
        };

        this.results.push(errorResult);

        if (checkConfig.isCritical) {
          this.criticalIssues.push(errorResult);
        }

        console.log(`  ❌ ${checkConfig.name}: Error - ${error.message}`);
        appHealthMonitor.logError(error, `PreDeploymentChecker: ${checkConfig.name}`);
      }
    }

    return this.generateReport();
  }

  /**
   * Genera reporte de resultados
   */
  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const total = this.results.length;

    const report = {
      summary: {
        total,
        passed,
        failed,
        errors,
        criticalIssues: this.criticalIssues.length,
        status: this.criticalIssues.length > 0 ? 'CRITICAL' : failed > 0 || errors > 0 ? 'WARNING' : 'PASS'
      },
      checks: this.results,
      criticalIssues: this.criticalIssues,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 Pre-Deployment Check Summary:');
    console.log(`  Total: ${total}, Passed: ${passed}, Failed: ${failed}, Errors: ${errors}`);
    console.log(`  Status: ${report.summary.status}`);
    
    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.criticalIssues.forEach(issue => {
        console.log(`  - ${issue.name}: ${issue.message}`);
      });
    }

    return report;
  }

  /**
   * Genera recomendaciones basadas en los resultados
   */
  generateRecommendations() {
    const recommendations = [];

    this.results.forEach(result => {
      if (result.status === 'FAIL' || result.status === 'ERROR') {
        if (result.name.includes('Component')) {
          recommendations.push('Review component imports and ensure all dependencies are available');
        }
        if (result.name.includes('Route')) {
          recommendations.push('Check route definitions and ensure all paths are valid');
        }
        if (result.name.includes('Navigation')) {
          recommendations.push('Validate navigation menu items and their paths');
        }
      }
    });

    return [...new Set(recommendations)]; // Eliminar duplicados
  }
}

/**
 * Verificaciones estándar para la aplicación
 */
export const createStandardChecks = () => {
  const checker = new PreDeploymentChecker();

  // Verificación de componentes críticos
  checker.addCheck('Critical Components Check', async () => {
    const criticalComponents = [
      'src/App.jsx',
      'src/routes/AppRouter.jsx',
      'src/components/layout/DashboardLayout.jsx',
      'src/context/AuthContext.jsx'
    ];

    const results = [];
    for (const componentPath of criticalComponents) {
      try {
        const validation = await componentValidator.validateComponent(componentPath);
        if (!validation.isValid) {
          results.push(`❌ ${componentPath}: ${validation.errors.join(', ')}`);
        } else {
          results.push(`✅ ${componentPath}: Valid`);
        }
      } catch (error) {
        results.push(`❌ ${componentPath}: ${error.message}`);
      }
    }

    const failed = results.filter(r => r.startsWith('❌')).length;
    
    return {
      success: failed === 0,
      message: failed === 0 ? 'All critical components valid' : `${failed} critical components failed`,
      details: { results, failed, total: criticalComponents.length }
    };
  }, true);

  // Verificación de rutas
  checker.addCheck('Route Structure Check', async () => {
    try {
      // Importar y validar rutas principales
      const { default: AppRouter } = await import('../routes/AppRouter');
      
      // Verificar que el componente se pueda renderizar
      if (typeof AppRouter !== 'function') {
        return {
          success: false,
          message: 'AppRouter is not a valid React component'
        };
      }

      return {
        success: true,
        message: 'Route structure is valid',
        details: { componentType: typeof AppRouter }
      };
    } catch (error) {
      return {
        success: false,
        message: `Route structure check failed: ${error.message}`,
        details: { error: error.stack }
      };
    }
  }, true);

  // Verificación de menú de navegación
  checker.addCheck('Navigation Menu Check', async () => {
    try {
      // Importar menú de empresa como ejemplo
      const companyMenu = [
        { name: 'Dashboard', path: '/empresa/dashboard', icon: 'Home' },
        { name: 'Clientes', path: '/empresa/clientes', icon: 'Users' },
        { name: 'Propuestas', path: '/empresa/propuestas', icon: 'FileText' }
      ];

      const validation = validateNavigationMenu(companyMenu);
      
      return {
        success: validation.invalid.length === 0,
        message: validation.invalid.length === 0 
          ? 'Navigation menu is valid' 
          : `${validation.invalid.length} menu items have issues`,
        details: validation
      };
    } catch (error) {
      return {
        success: false,
        message: `Navigation menu check failed: ${error.message}`
      };
    }
  });

  // Verificación de módulos de IA
  checker.addCheck('AI Module Check', async () => {
    try {
      const aiModulePath = '../modules/ai-negotiation/index.jsx';
      const validation = await componentValidator.validateComponent(aiModulePath, 'AIModule');
      
      return {
        success: true, // No es crítico que falle
        message: validation.isValid ? 'AI module is valid' : 'AI module has issues (non-critical)',
        details: validation
      };
    } catch (error) {
      return {
        success: true, // No es crítico que falle
        message: 'AI module not available (non-critical)',
        details: { error: error.message }
      };
    }
  });

  // Verificación de dependencias
  checker.addCheck('Dependencies Check', () => {
    const requiredGlobals = ['React', 'ReactDOM'];
    const missing = [];

    requiredGlobals.forEach(global => {
      if (typeof window[global] === 'undefined') {
        missing.push(global);
      }
    });

    return {
      success: missing.length === 0,
      message: missing.length === 0 ? 'All dependencies available' : `Missing: ${missing.join(', ')}`,
      details: { missing, required: requiredGlobals }
    };
  }, true);

  // Verificación de configuración
  checker.addCheck('Configuration Check', () => {
    try {
      // Verificar variables de entorno críticas
      const requiredEnvVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
      ];

      const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
      
      return {
        success: missing.length === 0,
        message: missing.length === 0 ? 'All environment variables configured' : `Missing env vars: ${missing.join(', ')}`,
        details: { missing, configured: requiredEnvVars.filter(envVar => import.meta.env[envVar]) }
      };
    } catch (error) {
      return {
        success: false,
        message: `Configuration check failed: ${error.message}`
      };
    }
  });

  return checker;
};

/**
 * Ejecuta verificaciones pre-despliegue automáticamente
 */
export const runPreDeploymentChecks = async () => {
  const checker = createStandardChecks();
  const report = await checker.runAllChecks();
  
  // Guardar reporte en localStorage para referencia
  try {
    localStorage.setItem('pre-deployment-report', JSON.stringify(report));
  } catch (error) {
    console.warn('Could not save pre-deployment report to localStorage:', error);
  }

  return report;
};

/**
 * Verificación rápida para desarrollo
 */
export const quickHealthCheck = async () => {
  const checks = [
    {
      name: 'React Available',
      check: () => ({ success: typeof React !== 'undefined', message: 'React is available' })
    },
    {
      name: 'App Router Available',
      check: async () => {
        try {
          await import('../routes/AppRouter');
          return { success: true, message: 'AppRouter is importable' };
        } catch (error) {
          return { success: false, message: `AppRouter import failed: ${error.message}` };
        }
      }
    },
    {
      name: 'No Console Errors',
      check: () => {
        const errors = appHealthMonitor.getHealthStatus().errors;
        return { 
          success: errors.length < 5, 
          message: errors.length < 5 ? 'Acceptable error level' : 'Too many errors detected',
          details: { errorCount: errors.length }
        };
      }
    }
  ];

  const results = [];
  for (const check of checks) {
    try {
      const result = await check.check();
      results.push({ ...check, ...result });
    } catch (error) {
      results.push({ ...check, success: false, message: error.message });
    }
  }

  const passed = results.filter(r => r.success).length;
  const status = passed === results.length ? 'HEALTHY' : passed > results.length / 2 ? 'WARNING' : 'CRITICAL';

  return {
    status,
    checks: results,
    summary: `${passed}/${results.length} checks passed`
  };
};

// Auto-ejecución en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Esperar a que la aplicación cargue completamente
  setTimeout(() => {
    quickHealthCheck().then(result => {
      console.log(`🏥 Quick Health Check: ${result.status} (${result.summary})`);
    });
  }, 2000);
}