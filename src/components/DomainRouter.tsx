import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isDomainCustom, getConnectionIdForDomain, getCurrentHostname } from '@/lib/domainRouting';
import { RefreshCw } from 'lucide-react';

interface DomainRouterProps {
  children: React.ReactNode;
}

/**
 * DomainRouter component handles custom domain detection and routing
 * This component wraps the main app and handles domain-based routing
 */
export default function DomainRouter({ children }: DomainRouterProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCustomDomain = async () => {
      try {
        const hostname = getCurrentHostname();
        
        // Check if this is a custom domain
        if (isDomainCustom(hostname)) {
          // Skip if we're already on an opt-in page to avoid infinite loops
          if (location.pathname.startsWith('/optin')) {
            setIsLoading(false);
            return;
          }
          
          // Get connection ID for this domain
          const connectionId = await getConnectionIdForDomain(hostname);
          
          if (connectionId) {
            // Redirect to opt-in page
            navigate(`/optin/${connectionId}`, { replace: true });
            return;
          } else {
            // Domain not found, show error or redirect to main site
            setError(`Domain ${hostname} not found or not configured`);
            setIsLoading(false);
            return;
          }
        }
        
        // Not a custom domain, continue with normal app
        setIsLoading(false);
      } catch (error) {
        console.error('Domain routing error:', error);
        setError('Failed to process domain routing');
        setIsLoading(false);
      }
    };

    handleCustomDomain();
  }, [navigate, location.pathname]);

  // Show loading state while checking domain
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-white text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error state if domain lookup failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Domain Not Found</h3>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = import.meta.env.VITE_BASE_DOMAIN || 'https://trackaff.io'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go to TrackAff
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the main app
  return <>{children}</>;
}
