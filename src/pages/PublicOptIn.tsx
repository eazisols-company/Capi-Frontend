import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiClient } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { getCurrencySymbol } from "@/lib/utils";

interface OptInSettings {
  connection_id: string;
  user_id: string;
  settings: {
    primary_color: string;
    secondary_color: string;
    logo_url: string;
    uploaded_logo_url?: string;
    page_title: string;
    page_subtitle: string;
    form_title: string;
    submit_button_text: string;
    font_family: string;
  };
  connection: {
    name: string;
    countries: Array<{ country: string; value: number }>;
  };
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", cssName: "'Inter', sans-serif" },
  { value: "Roboto", label: "Roboto", cssName: "'Roboto', sans-serif" },
  { value: "Open Sans", label: "Open Sans", cssName: "'Open Sans', sans-serif" },
  { value: "Lato", label: "Lato", cssName: "'Lato', sans-serif" },
  { value: "Montserrat", label: "Montserrat", cssName: "'Montserrat', sans-serif" },
  { value: "Poppins", label: "Poppins", cssName: "'Poppins', sans-serif" },
  { value: "Source Sans Pro", label: "Source Sans Pro", cssName: "'Source Sans Pro', sans-serif" },
  { value: "Nunito", label: "Nunito", cssName: "'Nunito', sans-serif" },
  { value: "Raleway", label: "Raleway", cssName: "'Raleway', sans-serif" },
  { value: "Ubuntu", label: "Ubuntu", cssName: "'Ubuntu', sans-serif" }
];

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+32", country: "BE", flag: "🇧🇪" },
  { code: "+41", country: "CH", flag: "🇨🇭" },
  { code: "+43", country: "AT", flag: "🇦🇹" },
  { code: "+46", country: "SE", flag: "🇸🇪" },
  { code: "+47", country: "NO", flag: "🇳🇴" },
  { code: "+45", country: "DK", flag: "🇩🇰" },
  { code: "+358", country: "FI", flag: "🇫🇮" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+351", country: "PT", flag: "🇵🇹" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+65", country: "SG", flag: "🇸🇬" },
  { code: "+852", country: "HK", flag: "🇭🇰" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+54", country: "AR", flag: "🇦🇷" },
  { code: "+56", country: "CL", flag: "🇨🇱" },
  { code: "+57", country: "CO", flag: "🇨🇴" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+92", country: "PK", flag: "🇵🇰" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+234", country: "NG", flag: "🇳🇬" },
  { code: "+20", country: "EG", flag: "🇪🇬" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+966", country: "SA", flag: "🇸🇦" },
  { code: "+90", country: "TR", flag: "🇹🇷" },
  { code: "+48", country: "PL", flag: "🇵🇱" },
  { code: "+7", country: "RU", flag: "🇷🇺" },
  { code: "+380", country: "UA", flag: "🇺🇦" },
  { code: "+30", country: "GR", flag: "🇬🇷" },
  { code: "+420", country: "CZ", flag: "🇨🇿" },
  { code: "+36", country: "HU", flag: "🇭🇺" },
  { code: "+40", country: "RO", flag: "🇷🇴" }
];

export default function PublicOptIn() {
  const { connectionId } = useParams();
  const [searchParams] = useSearchParams();
  const [optInData, setOptInData] = useState<OptInSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country_code: "+1",
    country: "",
    deposit_amount: ""
  });

  // Helper function to get the effective logo URL
  const getEffectiveLogoUrl = () => {
    if (!optInData?.settings) return "";
    return optInData.settings.logo_url;
  };

  useEffect(() => {
    fetchOptInSettings();
  }, [connectionId]);

  // Dynamic favicon update
  useEffect(() => {
    const effectiveLogoUrl = getEffectiveLogoUrl();
    if (effectiveLogoUrl) {
      const updateFavicon = () => {
        const absoluteLogoUrl = effectiveLogoUrl.startsWith('http') 
          ? effectiveLogoUrl 
          : `${window.location.origin}${effectiveLogoUrl}`;
        
        // Remove existing favicon links
        const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
        existingFavicons.forEach(favicon => favicon.remove());
        
        // Add new favicon links with cache busting
        const timestamp = Date.now();
        
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/x-icon';
        favicon.href = `${absoluteLogoUrl}?v=${timestamp}`;
        document.head.appendChild(favicon);
        
        const shortcutIcon = document.createElement('link');
        shortcutIcon.rel = 'shortcut icon';
        shortcutIcon.href = `${absoluteLogoUrl}?v=${timestamp}`;
        document.head.appendChild(shortcutIcon);
        
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = `${absoluteLogoUrl}?v=${timestamp}`;
        document.head.appendChild(appleTouchIcon);
      };
      
      updateFavicon();
    }
  }, [optInData?.settings?.logo_url]);

  const fetchOptInSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get settings by domain first, then by connection ID
      const domain = window.location.hostname;
      const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'trackAff.app';
      let response;

      // Check if this is a custom domain (not localhost, not the base domain)
      const isLocalhost = domain === 'localhost' || domain === '127.0.0.1' || domain.includes('localhost');
      const isBaseDomain = domain.includes(baseDomain);
      
      if (!isLocalhost && !isBaseDomain) {
        // Custom domain - resolve by domain
        response = await apiClient.getPublicOptInSettings(undefined, domain);
      } else if (connectionId) {
        // Default domain with connection ID or localhost development
        response = await apiClient.getPublicOptInSettings(connectionId);
      } else {
        throw new Error('No connection ID or domain provided');
      }

      setOptInData(response.data.data);
    } catch (error: any) {
      console.error('Error fetching opt-in settings:', error);
      setError(error.response?.data?.error || 'Failed to load opt-in page');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!optInData) return;

    try {
      setSubmitting(true);
      
      const depositAmount = parseFloat(formData.deposit_amount) || 0;

      const submissionData = {
        connection_id: optInData.connection_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: `${formData.country_code}${formData.phone}`,
        country: formData.country,
        deposit_amount: depositAmount,
        source_url: window.location.href,
        user_agent: navigator.userAgent,
        ip_address: '' // Will be set by backend
      };

      const response = await apiClient.createPublicSubmission(submissionData);
      
      setSubmitted(true);
      
      // Redirect if provided
      if (response.data.data.redirect_url) {
        setTimeout(() => {
          window.location.href = response.data.data.redirect_url;
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit form';
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading...</title>
          <meta name="description" content="Loading opt-in page..." />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-white text-lg">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Page Not Available</title>
          <meta name="description" content="This opt-in page is not available" />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Page Not Available</h3>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Thank You!</title>
          <meta name="description" content="Your submission has been received successfully" />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Thank You!</h3>
              <p className="text-muted-foreground">Your submission has been received successfully.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!optInData) return null;

  const { settings, connection } = optInData;
  const selectedFont = FONT_OPTIONS.find(f => f.value === settings.font_family);

  return (
    <>
      <Helmet>
        <title>{settings.page_title}</title>
        <meta name="description" content={settings.page_subtitle} />
        
        {/* Dynamic Favicon */}
        {getEffectiveLogoUrl() && (
          <>
            <link rel="icon" type="image/x-icon" href={
              getEffectiveLogoUrl().startsWith('http') 
                ? getEffectiveLogoUrl() 
                : `${window.location.origin}${getEffectiveLogoUrl()}`
            } />
            <link rel="shortcut icon" href={
              getEffectiveLogoUrl().startsWith('http') 
                ? getEffectiveLogoUrl() 
                : `${window.location.origin}${getEffectiveLogoUrl()}`
            } />
            <link rel="apple-touch-icon" href={
              getEffectiveLogoUrl().startsWith('http') 
                ? getEffectiveLogoUrl() 
                : `${window.location.origin}${getEffectiveLogoUrl()}`
            } />
          </>
        )}
        
        {/* Cache busting for social media */}
        <meta property="og:updated_time" content={Date.now().toString()} />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={settings.page_title} />
        <meta property="og:description" content={settings.page_subtitle} />
        <meta property="og:site_name" content={connection.name} />
        {getEffectiveLogoUrl() && (
          <meta property="og:image" content={
            getEffectiveLogoUrl().startsWith('http') 
              ? getEffectiveLogoUrl() 
              : `${window.location.origin}${getEffectiveLogoUrl()}`
          } />
        )}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={settings.page_title} />
        <meta name="twitter:description" content={settings.page_subtitle} />
        <meta name="twitter:site" content={`@${connection.name.replace(/\s+/g, '')}`} />
        {getEffectiveLogoUrl() && (
          <meta name="twitter:image" content={
            getEffectiveLogoUrl().startsWith('http') 
              ? getEffectiveLogoUrl() 
              : `${window.location.origin}${getEffectiveLogoUrl()}`
          } />
        )}
        
        {/* Additional meta tags */}
        <meta name="author" content={connection.name} />
        <meta name="theme-color" content={settings.primary_color} />
        <link rel="canonical" href={window.location.href} />
        
        {/* Additional cache control */}
        <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="pragma" content="no-cache" />
        <meta http-equiv="expires" content="0" />
      </Helmet>
      
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ 
          fontFamily: selectedFont?.cssName || "'Inter', sans-serif",
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)'
        }}
      >
      <div className="max-w-md w-full">
        <div className="text-center space-y-6 mb-8">
          {/* Logo */}
          {getEffectiveLogoUrl() && (
            <div className="mb-8">
              <img 
                src={getEffectiveLogoUrl()} 
                alt="Logo" 
                className="h-16 mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              {settings.page_title}
            </h1>
            <p className="text-xl text-gray-300">
              {settings.page_subtitle}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            {settings.form_title}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-white">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                  required
                  className="border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: `${settings.secondary_color}60`,
                    '--tw-ring-color': settings.secondary_color
                  } as React.CSSProperties}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-white">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                  required
                  className="border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: `${settings.secondary_color}60`,
                    '--tw-ring-color': settings.secondary_color
                  } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                required
                className="border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: `${settings.secondary_color}60`,
                  '--tw-ring-color': settings.secondary_color
                } as React.CSSProperties}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Phone Number</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.country_code}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country_code: value }))}
                >
                  <SelectTrigger 
                    className="border-2 text-white transition-all duration-200 w-28"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: `${settings.secondary_color}60`
                    }}
                  >
                    <SelectValue>
                      {formData.country_code && (
                        <div className="flex items-center gap-1">
                          <span>{COUNTRY_CODES.find(cc => cc.code === formData.country_code)?.flag}</span>
                          <span>{formData.country_code}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((countryCode) => (
                      <SelectItem key={countryCode.code} value={countryCode.code}>
                        <div className="flex items-center gap-2">
                          <span>{countryCode.flag}</span>
                          <span>{countryCode.code}</span>
                          <span className="text-xs text-gray-500">{countryCode.country}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="234 567 8900"
                  required
                  className="border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200 flex-1"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: `${settings.secondary_color}60`,
                    '--tw-ring-color': settings.secondary_color
                  } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-white">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                required
              >
                <SelectTrigger 
                  className="border-2 text-white transition-all duration-200"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: `${settings.secondary_color}60`
                  }}
                >
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {connection.countries.map((countryData) => (
                    <SelectItem key={countryData.country} value={countryData.country}>
                      {countryData.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit" className="text-white">Deposit Amount</Label>
              <Input
                id="deposit"
                type="number"
                value={formData.deposit_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
                placeholder="Enter deposit amount"
                required
                className="border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: `${settings.secondary_color}60`,
                  '--tw-ring-color': settings.secondary_color
                } as React.CSSProperties}
              />
            </div>

            <Button 
              type="submit"
              disabled={submitting}
              className="w-full text-white font-semibold py-4 text-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ 
                backgroundColor: settings.primary_color,
                borderColor: settings.primary_color,
                boxShadow: `0 6px 20px ${settings.primary_color}40`
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                settings.submit_button_text
              )}
            </Button>
          </form>

          {/* Accent Elements */}
          {/* <div className="flex justify-center space-x-2 mt-6">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: settings.secondary_color }}
            />
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: settings.primary_color }}
            />
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: settings.secondary_color }}
            />
          </div> */}

          {/* Powered by TrackAff */}
          <div className="mt-8 pt-4 border-t border-white/20">
            <p className="text-xs text-gray-400 text-center">
              Powered by TrackAff
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
