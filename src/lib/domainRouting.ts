/**
 * Domain routing utilities for handling custom domain detection and lookup
 */

// Main domains that should not trigger custom domain routing
const MAIN_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'trackaff.app',
  'trackaff.vercel.app',
  'capi-connect-hub.vercel.app',
  'trackiterra.vercel.app',
  'https://trackiterra.vercel.app',
  'main.d8agcje03b3er.amplifyapp.com',
  'https://main.d8agcje03b3er.amplifyapp.com',
  'trackaff.io',
  'https://trackaff.io',
  'www.trackaff.io',
  'https://www.trackaff.io'
];

/**
 * Check if the current hostname is a custom domain (not a main domain)
 * @param hostname - The hostname to check
 * @returns true if it's a custom domain, false otherwise
 */
export const isDomainCustom = (hostname: string): boolean => {
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];
  
  return !MAIN_DOMAINS.some(domain => 
    cleanHostname === domain || cleanHostname.includes(domain)
  );
};

/**
 * Get connection ID for a custom domain by making an API call
 * @param domain - The domain to lookup
 * @returns Promise<string | null> - The connection ID or null if not found
 */
export const getConnectionIdForDomain = async (domain: string): Promise<string | null> => {
  try {
    // Import apiClient dynamically to avoid circular dependencies
    const { apiClient } = await import('@/services/api');
    const response = await apiClient.resolveDomain(domain);
    
    console.log('🔍 API Response:', response.data);
    
    // Check if the response is successful and has the expected structure
    if (response.data && response.data.success && response.data.data && response.data.data.connection_id) {
      console.log('✅ Connection ID found:', response.data.data.connection_id);
      return response.data.data.connection_id;
    }
    
    console.log('❌ Invalid response structure:', response.data);
    return null;
  } catch (error) {
    console.error('Domain lookup failed:', error);
    return null;
  }
};

/**
 * Get the current hostname from window.location
 * @returns The current hostname
 */
export const getCurrentHostname = (): string => {
  return window.location.hostname;
};

/**
 * Check if we're currently on a custom domain
 * @returns true if on a custom domain, false otherwise
 */
export const isCurrentlyOnCustomDomain = (): boolean => {
  return isDomainCustom(getCurrentHostname());
};

/**
 * Get the base domain from environment or default
 * @returns The base domain
 */
export const getBaseDomain = (): string => {
  return import.meta.env.VITE_BASE_DOMAIN || 'trackaff.app';
};

/**
 * Check if the current domain is the base domain
 * @returns true if on base domain, false otherwise
 */
export const isBaseDomain = (): boolean => {
  const hostname = getCurrentHostname();
  const baseDomain = getBaseDomain();
  return hostname.includes(baseDomain);
};

/**
 * Check if we're in localhost development
 * @returns true if on localhost, false otherwise
 */
export const isLocalhost = (): boolean => {
  const hostname = getCurrentHostname();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
};
