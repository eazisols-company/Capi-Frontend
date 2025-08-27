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
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const FONT_OPTIONS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", 
  "Poppins", "Source Sans Pro", "Nunito", "Raleway", "Ubuntu"
];

export default function OptInPages() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
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
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('opt_in_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
        setFormData({
          primary_color: data.primary_color || "#FACC15",
          secondary_color: data.secondary_color || "#10B981",
          logo_url: data.logo_url || "",
          page_title: data.page_title || "Join Our Premium Trading Platform",
          page_subtitle: data.page_subtitle || "Start your trading journey today",
          form_title: data.form_title || "Get Started",
          submit_button_text: data.submit_button_text || "Join Now",
          font_family: data.font_family || "Inter"
        });
      }
    } catch (error) {
      console.error('Error fetching opt-in settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch opt-in page settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('opt_in_settings')
        .upsert({
          user_id: user?.id,
          ...formData
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opt-in page settings saved successfully"
      });

      fetchSettings(); // Refresh data
    } catch (error) {
      console.error('Error saving opt-in settings:', error);
      toast({
        title: "Error",
        description: "Failed to save opt-in page settings",
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
            Customize the appearance of your lead capture pages
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
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
                />
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page_subtitle">Page Subtitle</Label>
                <Input
                  id="page_subtitle"
                  value={formData.page_subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, page_subtitle: e.target.value }))}
                  placeholder="Start your trading journey today"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form_title">Form Title</Label>
                <Input
                  id="form_title"
                  value={formData.form_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, form_title: e.target.value }))}
                  placeholder="Get Started"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submit_button_text">Submit Button Text</Label>
                <Input
                  id="submit_button_text"
                  value={formData.submit_button_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, submit_button_text: e.target.value }))}
                  placeholder="Join Now"
                />
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
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
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
                See how your opt-in page will look to visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-8 bg-background min-h-[600px]"
                style={{ 
                  fontFamily: formData.font_family,
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)'
                }}
              >
                <div className="max-w-md mx-auto text-center space-y-6">
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
                      <div className="grid grid-cols-2 gap-3">
                        <Input 
                          placeholder="First Name" 
                          className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                          disabled
                        />
                        <Input 
                          placeholder="Last Name" 
                          className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                          disabled
                        />
                      </div>
                      <Input 
                        placeholder="Email Address" 
                        className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                        disabled
                      />
                      <Input 
                        placeholder="Phone Number" 
                        className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                        disabled
                      />
                      <Select disabled>
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                      </Select>
                      <Input 
                        placeholder="Deposit Amount" 
                        className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                        disabled
                      />
                      
                      <Button 
                        className="w-full text-white font-semibold py-3"
                        style={{ 
                          backgroundColor: formData.primary_color,
                          borderColor: formData.primary_color
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}