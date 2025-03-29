import { isTauri } from './lib/utils';

// Configuration object with environment-specific settings
const config = {
  // Is the app running in a Tauri environment
  isTauriApp: isTauri(),
  
  // API endpoints (can be different for web vs desktop)
  api: {
    // Example: In Tauri, you might use commands directly instead of REST APIs
    baseUrl: isTauri() ? null : 'https://api.example.com',
  },
  
  // Feature flags - enable/disable features based on environment
  features: {
    // Features that only work in Tauri
    fileSystem: isTauri(),
    systemIntegration: isTauri(),
    
    // Features that work everywhere
    authentication: true,
    darkMode: true,
  }
};

export default config; 