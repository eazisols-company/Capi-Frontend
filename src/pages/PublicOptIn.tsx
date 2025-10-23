import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizedCountryCodeSelect } from "@/components/ui/optimized-country-code-select";
import { SearchableSubmissionCountrySelect } from "@/components/ui/searchable-submission-country-select";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { FlagIcon } from 'react-flag-kit';
import { apiClient } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { getCurrencySymbol } from "@/lib/utils";
import { FONT_OPTIONS, COUNTRY_CODES, CURRENCIES, getCountryFlagCode } from "@/utils/constants";

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

export default function PublicOptIn() {
  const { connectionId } = useParams();
  const [searchParams] = useSearchParams();
  const [optInData, setOptInData] = useState<OptInSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country_code: "+1",
    country: "",
    deposit_amount: "",
    currency: "USD"
  });

  // Function to filter phone number input to only allow numbers
  const handlePhoneChange = (value: string) => {
    // Remove all non-numeric characters except + at the beginning
    const numericValue = value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, phone: numericValue }));
  };

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

      const responseData = response.data.data;
      
      // Handle multiple settings - pick the latest by date
      if (Array.isArray(responseData)) {
        // If we get an array of settings, sort by date and pick the latest
        const sortedSettings = responseData.sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB.getTime() - dateA.getTime(); // Latest first
        });
        
        // Use the first (latest) setting
        setOptInData(sortedSettings[0]);
      } else if (responseData && responseData.settings && Array.isArray(responseData.settings)) {
        // If settings is an array within the response data
        const sortedSettings = responseData.settings.sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB.getTime() - dateA.getTime(); // Latest first
        });
        
        // Create a new response object with the latest settings
        const latestSettings = sortedSettings[0];
        setOptInData({
          ...responseData,
          settings: latestSettings
        });
      } else {
        // Single setting or already processed
        setOptInData(responseData);
      }
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

    // Validate phone number
    if (!formData.phone || formData.phone.length < 5 || formData.phone.length > 15) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const depositAmount = parseFloat(formData.deposit_amount) || 0;

      // Strip country code from phone if it's included
      let cleanPhone = formData.phone;
      if (cleanPhone.startsWith(formData.country_code)) {
        cleanPhone = cleanPhone.substring(formData.country_code.length);
      }
      // Also handle cases where phone might start with + but different country code
      if (cleanPhone.startsWith('+')) {
        // Find any country code that matches and remove it
        const matchingCode = COUNTRY_CODES.find(cc => cleanPhone.startsWith(cc.code));
        if (matchingCode) {
          cleanPhone = cleanPhone.substring(matchingCode.code.length);
        }
      }

      const submissionData = {
        connection_id: optInData.connection_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: cleanPhone,
        country_code: formData.country_code,
        country: formData.country,
        deposit_amount: depositAmount,
        currency: formData.currency,
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
      
      // Clear previous field errors
      setFieldErrors({});
      
      // Check if it's a validation error with field-specific errors
      if (error.response?.data?.details?.field_errors) {
        const fieldValidationErrors = error.response.data.details.field_errors;
        setFieldErrors(fieldValidationErrors);
        
        // Show the first field error in toast
        const firstField = Object.keys(fieldValidationErrors)[0];
        const firstError = fieldValidationErrors[firstField];
        
        toast({
          title: "Validation Error",
          description: `${firstField.replace(/_/g, ' ')}: ${firstError}`,
          variant: "destructive"
        });
      } else {
        // Generic error
        const errorMessage = error.response?.data?.error || 'Failed to submit form';
        toast({
          title: "Submission Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
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
      <div className="max-w-lg w-full">
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, first_name: e.target.value }));
                    if (fieldErrors.first_name) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.first_name;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="John"
                  required
                  className={`border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200 ${
                    fieldErrors.first_name ? 'border-red-500' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: fieldErrors.first_name ? '#ef4444' : `${settings.secondary_color}60`,
                    '--tw-ring-color': fieldErrors.first_name ? '#ef4444' : settings.secondary_color
                  } as React.CSSProperties}
                />
                {fieldErrors.first_name && (
                  <p className="text-red-400 text-sm mt-1">
                    {fieldErrors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-white">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, last_name: e.target.value }));
                    if (fieldErrors.last_name) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.last_name;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Doe"
                  required
                  className={`border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200 ${
                    fieldErrors.last_name ? 'border-red-500' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: fieldErrors.last_name ? '#ef4444' : `${settings.secondary_color}60`,
                    '--tw-ring-color': fieldErrors.last_name ? '#ef4444' : settings.secondary_color
                  } as React.CSSProperties}
                />
                {fieldErrors.last_name && (
                  <p className="text-red-400 text-sm mt-1">
                    {fieldErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  // Clear field error when user starts typing
                  if (fieldErrors.email) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.email;
                      return newErrors;
                    });
                  }
                }}
                placeholder="john@example.com"
                required
                className={`border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200 ${
                  fieldErrors.email ? 'border-red-500' : ''
                }`}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: fieldErrors.email ? '#ef4444' : `${settings.secondary_color}60`,
                  '--tw-ring-color': fieldErrors.email ? '#ef4444' : settings.secondary_color
                } as React.CSSProperties}
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Phone Number</Label>
              <div className="flex gap-2">
                <OptimizedCountryCodeSelect
                  value={formData.country_code}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, country_code: value }));
                    if (fieldErrors.phone) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.phone;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-36 border-2 text-white transition-all duration-200 ${
                    fieldErrors.phone ? 'border-red-500' : ''
                  }`}
                  placeholder="Select country code"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: fieldErrors.phone ? '#ef4444' : `${settings.secondary_color}60`
                  }}
                />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    handlePhoneChange(e.target.value);
                    if (fieldErrors.phone) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.phone;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="1234567890"
                  required
                  maxLength={15}
                  className={`border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200 flex-1 ${
                    fieldErrors.phone ? 'border-red-500' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: fieldErrors.phone ? '#ef4444' : `${settings.secondary_color}60`,
                    '--tw-ring-color': fieldErrors.phone ? '#ef4444' : settings.secondary_color
                  } as React.CSSProperties}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-red-400 text-sm mt-1">
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-white">Country</Label>
              <SearchableSubmissionCountrySelect
                countries={connection.countries.map(c => c.country)}
                value={formData.country}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, country: value }));
                  if (fieldErrors.country) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.country;
                      return newErrors;
                    });
                  }
                }}
                className={`border-2 text-white transition-all duration-200 ${
                  fieldErrors.country ? 'border-red-500' : ''
                }`}
                placeholder="Select country"
                emptyText="No country found."
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: fieldErrors.country ? '#ef4444' : `${settings.secondary_color}60`
                }}
              />
              {fieldErrors.country && (
                <p className="text-red-400 text-sm mt-1">
                  {fieldErrors.country}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposit" className="text-white">Deposit Amount</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, deposit_amount: e.target.value }));
                    if (fieldErrors.deposit_amount) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.deposit_amount;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Enter deposit amount"
                  required
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                  className={`border-2 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    fieldErrors.deposit_amount ? 'border-red-500' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: fieldErrors.deposit_amount ? '#ef4444' : `${settings.secondary_color}60`,
                    '--tw-ring-color': fieldErrors.deposit_amount ? '#ef4444' : settings.secondary_color
                  } as React.CSSProperties}
                />
                {fieldErrors.deposit_amount && (
                  <p className="text-red-400 text-sm mt-1">
                    {fieldErrors.deposit_amount}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-white">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, currency: value }));
                    if (fieldErrors.currency) {
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.currency;
                        return newErrors;
                      });
                    }
                  }}
                  required
                >
                  <SelectTrigger 
                    className={`border-2 text-white transition-all duration-200 ${
                      fieldErrors.currency ? 'border-red-500' : ''
                    }`}
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: fieldErrors.currency ? '#ef4444' : `${settings.secondary_color}60`
                    }}
                  >
                    <SelectValue>
                      {formData.currency && (
                        <div className="flex items-center gap-2">
                          <FlagIcon 
                            code={CURRENCIES.find(c => c.code === formData.currency)?.flagCode as any} 
                            size={16} 
                          />
                          <span>{CURRENCIES.find(c => c.code === formData.currency)?.name}</span>
                          <span>({CURRENCIES.find(c => c.code === formData.currency)?.symbol})</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <FlagIcon code={currency.flagCode as any} size={16} />
                          <span className="font-medium">{currency.name}</span>
                          <span className="text-xs text-gray-500">({currency.symbol})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.currency && (
                  <p className="text-red-400 text-sm mt-1">
                    {fieldErrors.currency}
                  </p>
                )}
              </div>
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
