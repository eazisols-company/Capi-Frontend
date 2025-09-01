// Debug helper to check current API configuration
export const debugConfig = () => {
  console.log('🔧 API Configuration:');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('Resolved Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000');
  console.log('All Environment Variables:', import.meta.env);
};

// Call this in browser console: debugConfig()
(window as any).debugConfig = debugConfig;
