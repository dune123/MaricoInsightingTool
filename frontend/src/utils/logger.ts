/**
 * ========================================
 * BRANDBLOOM INSIGHTS - CENTRALIZED LOGGING SERVICE
 * ========================================
 * 
 * Purpose: Single source of truth for all application logging
 * 
 * Description:
 * This centralized logging service eliminates duplicate logging across multiple files
 * and provides consistent, controllable logging throughout the application.
 * 
 * Key Features:
 * - Single logging interface for entire application
 * - Configurable log levels and categories
 * - Eliminates duplicate logs from multiple services
 * - Performance optimized with conditional execution
 * - Development vs production mode handling
 * 
 * Log Categories:
 * - API: HTTP requests and responses
 * - SERVICE: Business logic operations
 * - COMPONENT: React component lifecycle
 * - NAVIGATION: Route and wizard navigation
 * - STATE: Application state changes
 * - ERROR: Error conditions (always shown)
 * 
 * Usage:
 * import { logger } from '@/utils/logger';
 * logger.api('GET /analyses', { data });
 * logger.service('Analysis created', { analysisId });
 * logger.component('Component mounted', { componentName });
 * 
 * Control:
 * - logger.enableAPI() / logger.disableAPI()
 * - logger.enableServices() / logger.disableServices()
 * - logger.enableAll() / logger.disableAll()
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

type LogLevel = 'API' | 'SERVICE' | 'COMPONENT' | 'NAVIGATION' | 'STATE' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  source?: string;
}

class Logger {
  private readonly STORAGE_PREFIX = 'bb_debug_';
  
  // Log level configurations
  private readonly LOG_CONFIGS = {
    API: { 
      enabled: () => this.isEnabled('api'),
      icon: '🌐',
      color: '#0066cc'
    },
    SERVICE: { 
      enabled: () => this.isEnabled('services'),
      icon: '⚙️',
      color: '#00aa44'
    },
    COMPONENT: { 
      enabled: () => this.isEnabled('verbose'),
      icon: '🧩',
      color: '#ff6600'
    },
    NAVIGATION: { 
      enabled: () => this.isEnabled('verbose'),
      icon: '🧭',
      color: '#9966cc'
    },
    STATE: { 
      enabled: () => this.isEnabled('verbose'),
      icon: '📊',
      color: '#cc6600'
    },
    ERROR: { 
      enabled: () => true, // Always enabled
      icon: '❌',
      color: '#cc0000'
    }
  };

  private isEnabled(category: string): boolean {
    return process.env.NODE_ENV === 'development' && 
           localStorage.getItem(`${this.STORAGE_PREFIX}${category}`) === 'true';
  }

  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    const config = this.LOG_CONFIGS[level];
    
    if (!config.enabled()) {
      return; // Skip logging if disabled
    }

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      source
    };

    const prefix = `${config.icon} [${level}]`;
    
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }

    // Store log entry for debugging (optional)
    this.storeLogEntry(entry);
  }

  private storeLogEntry(entry: LogEntry): void {
    // Optional: Store recent logs in memory for debugging
    if (this.isEnabled('verbose')) {
      const logs = JSON.parse(localStorage.getItem('bb_recent_logs') || '[]');
      logs.push(entry);
      if (logs.length > 100) logs.shift(); // Keep last 100 logs
      localStorage.setItem('bb_recent_logs', JSON.stringify(logs));
    }
  }

  // Public logging methods
  api(message: string, data?: any, source?: string): void {
    this.log('API', message, data, source);
  }

  service(message: string, data?: any, source?: string): void {
    this.log('SERVICE', message, data, source);
  }

  component(message: string, data?: any, source?: string): void {
    this.log('COMPONENT', message, data, source);
  }

  navigation(message: string, data?: any, source?: string): void {
    this.log('NAVIGATION', message, data, source);
  }

  state(message: string, data?: any, source?: string): void {
    this.log('STATE', message, data, source);
  }

  error(message: string, data?: any, source?: string): void {
    this.log('ERROR', message, data, source);
    // Also log to console.error for better visibility
    console.error('❌ [ERROR]', message, data);
  }

  // Control methods for enabling/disabling log categories
  enableAPI(): void {
    localStorage.setItem(`${this.STORAGE_PREFIX}api`, 'true');
    console.log('✅ API debug logging enabled');
  }

  enableServices(): void {
    localStorage.setItem(`${this.STORAGE_PREFIX}services`, 'true');
    console.log('✅ Service debug logging enabled');
  }

  enableVerbose(): void {
    localStorage.setItem(`${this.STORAGE_PREFIX}verbose`, 'true');
    console.log('✅ Verbose debug logging enabled');
  }

  enableAll(): void {
    this.enableAPI();
    this.enableServices();
    this.enableVerbose();
    console.log('✅ All debug logging enabled');
  }

  disableAPI(): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}api`);
    console.log('🔇 API debug logging disabled');
  }

  disableServices(): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}services`);
    console.log('🔇 Service debug logging disabled');
  }

  disableVerbose(): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}verbose`);
    console.log('🔇 Verbose debug logging disabled');
  }

  disableAll(): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}api`);
    localStorage.removeItem(`${this.STORAGE_PREFIX}services`);
    localStorage.removeItem(`${this.STORAGE_PREFIX}verbose`);
    localStorage.removeItem('bb_recent_logs');
    console.log('🔇 All debug logging disabled - refresh page to see effect');
  }

  // Utility methods
  getRecentLogs(): LogEntry[] {
    return JSON.parse(localStorage.getItem('bb_recent_logs') || '[]');
  }

  clearLogs(): void {
    localStorage.removeItem('bb_recent_logs');
    console.log('🗑️ Recent logs cleared');
  }

  getStatus(): void {
    console.log('🔍 Logger Status:');
    console.log('  API:', this.isEnabled('api') ? '✅ Enabled' : '❌ Disabled');
    console.log('  Services:', this.isEnabled('services') ? '✅ Enabled' : '❌ Disabled');
    console.log('  Verbose:', this.isEnabled('verbose') ? '✅ Enabled' : '❌ Disabled');
  }
}

// Export singleton instance
export const logger = new Logger();

// Expose logger controls to window in development mode
if (process.env.NODE_ENV === 'development') {
  (window as any).logger = logger;
  
  // Backward compatibility with existing debug functions
  (window as any).enableDebugAPI = () => logger.enableAPI();
  (window as any).enableDebugServices = () => logger.enableServices();
  (window as any).enableDebugVerbose = () => logger.enableVerbose();
  (window as any).disableAllDebug = () => logger.disableAll();
}
