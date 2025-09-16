import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Eye, 
  Palette,
  Type,
  Image as ImageIcon,
  Save,
  RefreshCw,
  Link as LinkIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { extractApiErrorMessage, getCurrencySymbol } from "@/lib/utils";

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

export default function OptInPages() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    connection_id: "",
    primary_color: "#FACC15",
    secondary_color: "#10B981",
    logo_url: "",
    page_title: "Join Our Premium Trading Platform",
    page_subtitle: "Start your trading journey today",
    form_title: "Get Started",
    submit_button_text: "Join Now",
    font_family: "Inter"
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchConnections();
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnectionId && settings.length > 0) {
      const connectionSettings = settings.find(s => s.connection_id === selectedConnectionId);
      if (connectionSettings) {
        setFormData({
          connection_id: selectedConnectionId,
          primary_color: connectionSettings.primary_color || "#FACC15",
          secondary_color: connectionSettings.secondary_color || "#10B981",
          logo_url: connectionSettings.logo_url || "",
          page_title: connectionSettings.page_title || "Join Our Premium Trading Platform",
          page_subtitle: connectionSettings.page_subtitle || "Start your trading journey today",
          form_title: connectionSettings.form_title || "Get Started",
          submit_button_text: connectionSettings.submit_button_text || "Join Now",
          font_family: connectionSettings.font_family || "Inter"
        });
      } else {
        // Reset to defaults if no settings exist for this connection
        setFormData({
          connection_id: selectedConnectionId,
          primary_color: "#FACC15",
          secondary_color: "#10B981",
          logo_url: "",
          page_title: "Join Our Premium Trading Platform",
          page_subtitle: "Start your trading journey today",
          form_title: "Get Started",
          submit_button_text: "Join Now",
          font_family: "Inter"
        });
      }
    }
  }, [selectedConnectionId, settings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getOptInSettings();
      const data = response.data.data;
      
      if (data && data.settings) {
        setSettings(Array.isArray(data.settings) ? data.settings : [data.settings]);
      } else {
        setSettings([]);
      }
    } catch (error) {
      console.error('Error fetching opt-in settings:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      
      const errorMessage = extractApiErrorMessage(error, "Failed to fetch opt-in page settings");
      toast({
        title: "Error Fetching Settings",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await apiClient.getConnections();
      const connectionsData = response.data.connections || [];
      setConnections(connectionsData);
      
      // Auto-select first connection if none selected
      if (connectionsData.length > 0 && !selectedConnectionId) {
        setSelectedConnectionId(connectionsData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch connections",
        variant: "destructive"
      });
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedConnectionId) {
      toast({
        title: "Error",
        description: "Please select a connection first",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      await apiClient.updateOptInSettings({
        ...formData,
        connection_id: selectedConnectionId
      });

      toast({
        title: "Success",
        description: "Opt-in page settings saved successfully"
      });

      fetchSettings(); // Refresh data
      fetchConnections(); // Refresh connections to update optin_page_configured status
    } catch (error) {
      console.error('Error saving opt-in settings:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      
      const errorMessage = extractApiErrorMessage(error, "Failed to save opt-in page settings");
      toast({
        title: "Error Saving Settings",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real implementation, you would upload to Supabase Storage
    // For now, we'll just show a placeholder
    toast({
      title: "File Upload",
      description: "Logo upload feature coming soon. Please use a direct URL for now.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 slide-in">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading opt-in settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Opt-in Page Customization
          </h1>
          <p className="text-muted-foreground">
            Customize the appearance of your lead capture pages for each connection
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => {
              setFormData({
                connection_id: selectedConnectionId,
                primary_color: "#FACC15",
                secondary_color: "#10B981",
                logo_url: "",
                page_title: "Join Our Premium Trading Platform",
                page_subtitle: "Start your trading journey today",
                form_title: "Get Started",
                submit_button_text: "Join Now",
                font_family: "Inter"
              });
              toast({
                title: "Reset",
                description: "Settings reset to default values"
              });
            }}
            variant="outline"
            className="interactive-button"
            disabled={!selectedConnectionId}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !formData.page_title.trim() || !formData.form_title.trim() || !selectedConnectionId}
            className="interactive-button bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Connection Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            Select Connection
          </CardTitle>
          <CardDescription>
            Choose which connection to customize the opt-in page for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={selectedConnectionId}
              onValueChange={setSelectedConnectionId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((connection) => (
                  <SelectItem key={connection._id} value={connection._id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{connection.name}</span>
                      <div className="flex items-center gap-2 ml-4">
                        {connection.optin_page_configured ? (
                          <Badge variant="default" className="text-xs bg-secondary">
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Not Set Up
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedConnectionId && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {connections.find(c => c._id === selectedConnectionId)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pixel ID: {connections.find(c => c._id === selectedConnectionId)?.pixel_id}
                    </p>
                  </div>
                  {connections.find(c => c._id === selectedConnectionId)?.optin_page_url && (
                    console.log(connections.find(c => c._id === selectedConnectionId)?.optin_page_url),
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(connections.find(c => c._id === selectedConnectionId)?.optin_page_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Live Page
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customization Panel */}
        <div className="space-y-6">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Customize the colors of your opt-in page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color (Buttons)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#FACC15"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color (Accents)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-secondary" />
                Logo Settings
              </CardTitle>
              <CardDescription>
                Upload or set a logo URL for your opt-in page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://your-domain.com/logo.png"
                  type="url"
                />
                {formData.logo_url && (
                  <p className="text-xs text-muted-foreground">
                    Preview: {formData.logo_url.length > 50 ? formData.logo_url.substring(0, 50) + '...' : formData.logo_url}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_upload">Or Upload Logo</Label>
                <Input
                  id="logo_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended size: 200x60px or similar aspect ratio
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Text Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-accent" />
                Text Content
              </CardTitle>
              <CardDescription>
                Customize the text content of your opt-in page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page_title">Page Title</Label>
                <Input
                  id="page_title"
                  value={formData.page_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, page_title: e.target.value }))}
                  placeholder="Join Our Premium Trading Platform"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.page_title.length}/100 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="page_subtitle">Page Subtitle</Label>
                <Input
                  id="page_subtitle"
                  value={formData.page_subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, page_subtitle: e.target.value }))}
                  placeholder="Start your trading journey today"
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.page_subtitle.length}/150 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="form_title">Form Title</Label>
                <Input
                  id="form_title"
                  value={formData.form_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, form_title: e.target.value }))}
                  placeholder="Get Started"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.form_title.length}/50 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="submit_button_text">Submit Button Text</Label>
                <Input
                  id="submit_button_text"
                  value={formData.submit_button_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, submit_button_text: e.target.value }))}
                  placeholder="Join Now"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.submit_button_text.length}/30 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Typography
              </CardTitle>
              <CardDescription>
                Choose the font family for your opt-in page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="font_family">Font Family</Label>
                <Select
                  value={formData.font_family}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, font_family: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.cssName }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-secondary" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your opt-in page will look to visitors (responsive design)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-8 bg-background min-h-[600px] overflow-hidden"
                style={{ 
                  fontFamily: FONT_OPTIONS.find(f => f.value === formData.font_family)?.cssName || "'Inter', sans-serif",
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)'
                }}
              >
                <div className="max-w-sm sm:max-w-md mx-auto text-center space-y-4 sm:space-y-6">
                  {/* Logo */}
                  {formData.logo_url && (
                    <div className="mb-8">
                      <img 
                        src={formData.logo_url} 
                        alt="Logo" 
                        className="h-12 mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Header */}
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">
                      {formData.page_title}
                    </h1>
                    <p className="text-gray-300">
                      {formData.page_subtitle}
                    </p>
                  </div>

                  {/* Form */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white mb-4">
                      {formData.form_title}
                    </h2>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input 
                          placeholder="First Name" 
                          className="border-2 text-white placeholder:text-gray-300 focus:ring-2 transition-all duration-200"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: `${formData.secondary_color}40`,
                            '--tw-ring-color': formData.secondary_color
                          } as React.CSSProperties}
                          disabled
                        />
                        <Input 
                          placeholder="Last Name" 
                          className="border-2 text-white placeholder:text-gray-300 focus:ring-2 transition-all duration-200"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: `${formData.secondary_color}40`,
                            '--tw-ring-color': formData.secondary_color
                          } as React.CSSProperties}
                          disabled
                        />
                      </div>
                      <Input 
                        placeholder="Email Address" 
                        className="border-2 text-white placeholder:text-gray-300 focus:ring-2 transition-all duration-200"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderColor: `${formData.secondary_color}40`,
                          '--tw-ring-color': formData.secondary_color
                        } as React.CSSProperties}
                        disabled
                      />
                      <Input 
                        placeholder="Phone Number" 
                        className="border-2 text-white placeholder:text-gray-300 focus:ring-2 transition-all duration-200"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderColor: `${formData.secondary_color}40`,
                          '--tw-ring-color': formData.secondary_color
                        } as React.CSSProperties}
                        disabled
                      />
                      <Select disabled>
                        <SelectTrigger 
                          className="border-2 text-white transition-all duration-200"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: `${formData.secondary_color}40`
                          }}
                        >
                          <SelectValue placeholder={
                            selectedConnectionId && connections.find(c => c._id === selectedConnectionId)?.countries?.length > 0
                              ? `${connections.find(c => c._id === selectedConnectionId)?.countries[0].country} (${getCurrencySymbol(profile?.system_currency)}${connections.find(c => c._id === selectedConnectionId)?.countries[0].value})`
                              : "Select Country"
                          } />
                        </SelectTrigger>
                      </Select>
                      <Input 
                        placeholder="Deposit Amount" 
                        className="border-2 text-white placeholder:text-gray-300 focus:ring-2 transition-all duration-200"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderColor: `${formData.secondary_color}40`,
                          '--tw-ring-color': formData.secondary_color
                        } as React.CSSProperties}
                        disabled
                      />
                      
                      <Button 
                        className="w-full text-white font-semibold py-3 transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                        style={{ 
                          backgroundColor: formData.primary_color,
                          borderColor: formData.primary_color,
                          boxShadow: `0 4px 15px ${formData.primary_color}40`
                        }}
                        disabled
                      >
                        {formData.submit_button_text}
                      </Button>
                    </div>
                  </div>

                  {/* Accent Elements */}
                  <div className="flex justify-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: formData.secondary_color }}
                    />
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: formData.primary_color }}
                    />
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: formData.secondary_color }}
                    />
                  </div>

                  {/* Powered by Trackiterra */}
                  <div className="mt-8 pt-4 border-t border-white/20">
                    <p className="text-xs text-gray-400 text-center">
                      Powered by Trackiterra
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}