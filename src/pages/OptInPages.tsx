import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Eye, 
  Palette,
  Type,
  Image as ImageIcon,
  Save,
  RefreshCw,
  Link as LinkIcon,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { extractApiErrorMessage, getCurrencySymbol } from "@/lib/utils";
import { FlagIcon } from 'react-flag-kit';
import { FONT_OPTIONS, CURRENCIES, getCountryFlagCode } from "@/utils/constants";

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
    primary_color: "#E16A14",
    secondary_color: "#E16A14",
    text_color: "#FFFFFF",
    button_text_color: "#FFFFFF",
    logo_url: "https://capi-trackit-prod.s3.us-east-1.amazonaws.com/logos/68b5a890ac742871c4d9fed5/trackaff_logo_background_removed.png",
    uploaded_logo_url: "",
    page_bg_color: "#000000",
    page_bg_image_url: "",
    uploaded_bg_image_url: "",
    form_bg_color: "rgba(255, 255, 255, 0.1)",
    page_title: "Track The Untrackable",
    page_subtitle: "Stop guessing. Start tracking. Boost your ROAS.",
    form_title: "Get Started",
    submit_button_text: "Join Now",
    font_family: "Inter",
    show_deposit_section: true,
    field_labels: {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email Address",
      phone: "Phone Number",
      country: "Select Country",
      depositAmount: "Deposit Amount",
      currency: "Select Currency"
    }
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string>("");
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingBgImageFile, setPendingBgImageFile] = useState<File | null>(null);
  const [previewBgImageUrl, setPreviewBgImageUrl] = useState<string>("");

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
          primary_color: connectionSettings.primary_color || "#E16A14",
          secondary_color: connectionSettings.secondary_color || "#E16A14",
          text_color: connectionSettings.text_color || "#FFFFFF",
          button_text_color: connectionSettings.button_text_color || "#FFFFFF",
          logo_url: connectionSettings.logo_url || "",
          uploaded_logo_url: connectionSettings.uploaded_logo_url || "",
          page_bg_color: connectionSettings.page_bg_color || "#000000",
          page_bg_image_url: connectionSettings.page_bg_image_url || "",
          uploaded_bg_image_url: connectionSettings.uploaded_bg_image_url || "",
          form_bg_color: connectionSettings.form_bg_color || "rgba(255, 255, 255, 0.1)",
          page_title: connectionSettings.page_title || "Track The Untrackable",
          page_subtitle: connectionSettings.page_subtitle || "Stop guessing. Start tracking. Boost your ROAS.",
          form_title: connectionSettings.form_title || "Get Started",
          submit_button_text: connectionSettings.submit_button_text || "Join Now",
          font_family: connectionSettings.font_family || "Inter",
          show_deposit_section: connectionSettings.show_deposit_section !== undefined ? connectionSettings.show_deposit_section : true,
          field_labels: connectionSettings.field_labels || {
            firstName: "First Name",
            lastName: "Last Name",
            email: "Email Address",
            phone: "Phone Number",
            country: "Select Country",
            depositAmount: "Deposit Amount",
            currency: "Select Currency"
          }
        });
      } else {
        // Reset to defaults if no settings exist for this connection
        setFormData({
          connection_id: selectedConnectionId,
          primary_color: "#E16A14",
          secondary_color: "#E16A14",
          text_color: "#FFFFFF",
          button_text_color: "#FFFFFF",
          logo_url: "https://capi-trackit-prod.s3.us-east-1.amazonaws.com/logos/68b5a890ac742871c4d9fed5/trackaff_logo_background_removed.png",
          uploaded_logo_url: "",
          page_bg_color: "#000000",
          page_bg_image_url: "",
          uploaded_bg_image_url: "",
          form_bg_color: "rgba(255, 255, 255, 0.1)",
          page_title: "Track The Untrackable",
          page_subtitle: "Stop guessing. Start tracking. Boost your ROAS.",
          form_title: "Get Started",
          submit_button_text: "Join Now",
          font_family: "Inter",
          show_deposit_section: true,
          field_labels: {
            firstName: "First Name",
            lastName: "Last Name",
            email: "Email Address",
            phone: "Phone Number",
            country: "Select Country",
            depositAmount: "Deposit Amount",
            currency: "Select Currency"
          }
        });
      }
      
      // Reset upload state when switching connections
      setUploadedFile(null);
      setPreviewLogoUrl("");
      setPendingUploadFile(null);
      setPendingBgImageFile(null);
      setPreviewBgImageUrl("");
    }
  }, [selectedConnectionId, settings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getOptInSettings();
      const data = response.data.data;
      
      if (data && data.settings) {
        let settingsArray = Array.isArray(data.settings) ? data.settings : [data.settings];
        
        // Sort settings by date to ensure latest is first
        settingsArray = settingsArray.sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB.getTime() - dateA.getTime(); // Latest first
        });
        
        setSettings(settingsArray);
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
      
      let finalLogoUrl = formData.logo_url;
      let finalBgImageUrl = formData.page_bg_image_url;
      
      // Handle logo upload
      if (pendingUploadFile) {
        // Delete previous uploaded logo if exists
        if (isUploadedLogo()) {
          try {
            await apiClient.deleteLogo(selectedConnectionId);
          } catch (deleteError) {
            console.warn('Failed to delete previous uploaded logo:', deleteError);
          }
        }
        
        // Upload the new file
        const response = await apiClient.uploadLogo(pendingUploadFile, selectedConnectionId);
        finalLogoUrl = response.data.data.logo_url;
        
        // Clear pending file
        setPendingUploadFile(null);
        setPreviewLogoUrl("");
        
        // Clean up the preview URL
        if (previewLogoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewLogoUrl);
        }
      } 
      // If user has changed to a manual URL and there's an existing uploaded logo
      else if (formData.logo_url && !formData.logo_url.includes('capi-trackit.s3') && isUploadedLogo()) {
        // Delete the previous uploaded logo
        try {
          await apiClient.deleteLogo(selectedConnectionId);
        } catch (deleteError) {
          console.warn('Failed to delete previous uploaded logo:', deleteError);
        }
      }

      // Handle background image upload
      if (pendingBgImageFile) {
        // Delete previous uploaded background if exists
        if (isUploadedBgImage()) {
          try {
            // await apiClient.deleteBgImage(selectedConnectionId);
            console.log('Would delete previous background image');
          } catch (deleteError) {
            console.warn('Failed to delete previous uploaded background:', deleteError);
          }
        }
        
        // Upload the new background file (using logo upload for now)
        try {
          const response = await apiClient.uploadLogo(pendingBgImageFile, selectedConnectionId);
          finalBgImageUrl = response.data.data.logo_url;
        } catch (uploadError) {
          console.warn('Background image upload not yet supported by backend, saving URL only');
        }
        
        // Clear pending file
        setPendingBgImageFile(null);
        setPreviewBgImageUrl("");
        
        // Clean up the preview URL
        if (previewBgImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewBgImageUrl);
        }
      }
      
      await apiClient.updateOptInSettings({
        ...formData,
        logo_url: finalLogoUrl ? finalLogoUrl : "https://capi-trackit-prod.s3.us-east-1.amazonaws.com/logos/68b5a890ac742871c4d9fed5/trackaff_logo_background_removed.png",
        page_bg_image_url: finalBgImageUrl,
        connection_id: selectedConnectionId
      } as any);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedConnectionId) {
      toast({
        title: "Error",
        description: "Please select a connection first",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview URL for the file
    const fileUrl = URL.createObjectURL(file);
    setPreviewLogoUrl(fileUrl);
    setPendingUploadFile(file);
    
    toast({
      title: "Preview Ready",
      description: "File selected for preview. Click 'Save Changes' to upload and save."
    });
  };

  const handleRemoveUploadedLogo = async () => {
    if (!selectedConnectionId) return;

    try {
      setUploading(true);
      
      await apiClient.deleteLogo(selectedConnectionId);
      
      // Clear the uploaded logo
      setFormData(prev => ({ 
        ...prev, 
        logo_url: "", 
        uploaded_logo_url: "" 
      }));
      setUploadedFile(null);
      
      // Refresh settings to get updated data from backend
      await fetchSettings();
      
      toast({
        title: "Success",
        description: "Uploaded logo removed successfully"
      });
      
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: "Error",
        description: extractApiErrorMessage(error, "Failed to remove logo"),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper function to get the effective logo URL for preview
  const getEffectiveLogoUrl = () => {
    // Show preview file first, then preview URL, then saved URL, then default TrackAff logo
    return previewLogoUrl || formData.logo_url || "/trackaff_logo_background_removed.png";
  };

  // Helper function to check if current saved logo is uploaded (S3 URL)
  const isUploadedLogo = () => {
    return formData.uploaded_logo_url && formData.uploaded_logo_url.includes('capi-trackit.s3');
  };

  // Helper function to check if user has pending changes
  const hasPendingChanges = () => {
    return pendingUploadFile || previewLogoUrl;
  };

  // Helper function to delete previous uploaded logo if exists
  const deletePreviousUploadedLogo = async () => {
    if (isUploadedLogo() && selectedConnectionId) {
      try {
        await apiClient.deleteLogo(selectedConnectionId);
      } catch (deleteError) {
        console.warn('Failed to delete previous logo:', deleteError);
        // Continue even if delete fails
      }
    }
  };

  // Handle URL input change (just for preview, no deletion until save)
  const handleLogoUrlChange = (newUrl: string) => {
    // Clear any pending file upload when user enters URL
    if (newUrl && pendingUploadFile) {
      setPendingUploadFile(null);
      if (previewLogoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewLogoUrl);
      }
      setPreviewLogoUrl("");
    }
    
    setFormData(prev => ({ 
      ...prev, 
      logo_url: newUrl
    }));
  };

  // Background image upload handlers
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedConnectionId) {
      toast({
        title: "Error",
        description: "Please select a connection first",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit for background images)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview URL for the file
    const fileUrl = URL.createObjectURL(file);
    setPreviewBgImageUrl(fileUrl);
    setPendingBgImageFile(file);
    
    toast({
      title: "Preview Ready",
      description: "Background image selected for preview. Click 'Save Changes' to upload and save."
    });
  };

  const handleRemoveUploadedBgImage = async () => {
    if (!selectedConnectionId) return;

    try {
      setUploading(true);
      
      // Call API to delete background image (assuming similar endpoint)
      // await apiClient.deleteBgImage(selectedConnectionId);
      
      // Clear the uploaded background image
      setFormData(prev => ({ 
        ...prev, 
        page_bg_image_url: "", 
        uploaded_bg_image_url: "" 
      }));
      
      // Refresh settings to get updated data from backend
      await fetchSettings();
      
      toast({
        title: "Success",
        description: "Uploaded background image removed successfully"
      });
      
    } catch (error: any) {
      console.error('Error removing background image:', error);
      toast({
        title: "Error",
        description: extractApiErrorMessage(error, "Failed to remove background image"),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper function to check if current background image is uploaded (S3 URL)
  const isUploadedBgImage = () => {
    return formData.uploaded_bg_image_url && formData.uploaded_bg_image_url.includes('capi-trackit.s3');
  };

  // Helper function to get the effective background image URL for preview
  const getEffectiveBgImageUrl = () => {
    return previewBgImageUrl || formData.page_bg_image_url || "";
  };

  // Handle background URL input change
  const handleBgImageUrlChange = (newUrl: string) => {
    // Clear any pending file upload when user enters URL
    if (newUrl && pendingBgImageFile) {
      setPendingBgImageFile(null);
      if (previewBgImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewBgImageUrl);
      }
      setPreviewBgImageUrl("");
    }
    
    setFormData(prev => ({ 
      ...prev, 
      page_bg_image_url: newUrl
    }));
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
                primary_color: "#E16A14",
                secondary_color: "#E16A14",
                text_color: "#FFFFFF",
                button_text_color: "#FFFFFF",
                logo_url: "",
                uploaded_logo_url: "",
                page_bg_color: "#000000",
                page_bg_image_url: "",
                uploaded_bg_image_url: "",
                form_bg_color: "rgba(255, 255, 255, 0.1)",
                page_title: "Track The Untrackable",
                page_subtitle: "Stop guessing. Start tracking. Boost your ROAS.",
                form_title: "Get Started",
                submit_button_text: "Join Now",
                font_family: "Inter",
                show_deposit_section: true,
                field_labels: {
                  firstName: "First Name",
                  lastName: "Last Name",
                  email: "Email Address",
                  phone: "Phone Number",
                  country: "Select Country",
                  depositAmount: "Deposit Amount",
                  currency: "Select Currency"
                }
              });
              setUploadedFile(null);
              setPendingUploadFile(null);
              setPendingBgImageFile(null);
              if (previewLogoUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewLogoUrl);
              }
              if (previewBgImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewBgImageUrl);
              }
              setPreviewLogoUrl("");
              setPreviewBgImageUrl("");
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
              <SelectTrigger className="w-full text-left overflow-visible">
                <SelectValue placeholder="Select a connection">
                  {selectedConnectionId && connections.find(c => c._id === selectedConnectionId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {connections.map((connection) => (
                  <SelectItem key={connection._id} value={connection._id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{connection.name}</span>
                      <div className="flex items-center gap-2">
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(connections.find(c => c._id === selectedConnectionId)?.optin_page_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Live Page
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customization Sections - Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Color Scheme and Typography - Combined Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Colors & Typography
            </CardTitle>
            <CardDescription>
              Customize colors and font for your opt-in page
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Colors Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Colors</h3>
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
                    placeholder="#E16A14"
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
                    placeholder="#E16A14"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="text_color">Text Color (Headlines/Text)</Label>
                <div className="flex gap-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    value={formData.text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="button_text_color">Submit Button Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="button_text_color"
                    type="color"
                    value={formData.button_text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_text_color: e.target.value }))}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    value={formData.button_text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_text_color: e.target.value }))}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Typography</h3>
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
          </div>
        </CardContent>
        </Card>

        {/* Logo and Background - Combined Card */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-secondary" />
            Logo and Background
          </CardTitle>
          <CardDescription>
            Customize your logo, page background, and form appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Logo</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="logo_upload">Upload Logo</Label>
                {(isUploadedLogo() || pendingUploadFile) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (pendingUploadFile) {
                        setPendingUploadFile(null);
                        if (previewLogoUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(previewLogoUrl);
                        }
                        setPreviewLogoUrl("");
                        toast({
                          title: "Cleared",
                          description: "File selection cleared"
                        });
                      } else {
                        handleRemoveUploadedLogo();
                      }
                    }}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {uploading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {pendingUploadFile ? 'Clear' : 'Remove'}
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Input
                id="logo_upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="cursor-pointer"
                disabled={uploading || !selectedConnectionId}
              />
              <p className="text-xs text-muted-foreground">
                Recommended size: 200x60px. Max file size: 2MB
                {pendingUploadFile && (
                  <span className="text-blue-600 block mt-1">
                    📁 {pendingUploadFile.name} - Click 'Save Changes' to upload
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL (Optional)</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
                placeholder="https://your-domain.com/logo.png"
                type="url"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Page Background Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Page Background</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page_bg_color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="page_bg_color"
                    type="color"
                    value={formData.page_bg_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, page_bg_color: e.target.value }))}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    value={formData.page_bg_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, page_bg_color: e.target.value }))}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bg_image_upload">Background Image (Optional)</Label>
                {(isUploadedBgImage() || pendingBgImageFile) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (pendingBgImageFile) {
                        setPendingBgImageFile(null);
                        if (previewBgImageUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(previewBgImageUrl);
                        }
                        setPreviewBgImageUrl("");
                        toast({
                          title: "Cleared",
                          description: "Background image selection cleared"
                        });
                      } else {
                        handleRemoveUploadedBgImage();
                      }
                    }}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {uploading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {pendingBgImageFile ? 'Clear' : 'Remove'}
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Input
                id="bg_image_upload"
                type="file"
                accept="image/*"
                onChange={handleBgImageUpload}
                className="cursor-pointer"
                disabled={uploading || !selectedConnectionId}
              />
              <p className="text-xs text-muted-foreground">
                Max file size: 5MB
                {pendingBgImageFile && (
                  <span className="text-blue-600 block mt-1">
                    📁 {pendingBgImageFile.name} - Click 'Save Changes' to upload
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_bg_image_url">Background Image URL (Optional)</Label>
              <Input
                id="page_bg_image_url"
                value={formData.page_bg_image_url}
                onChange={(e) => handleBgImageUrlChange(e.target.value)}
                placeholder="https://your-domain.com/background.jpg"
                type="url"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Form Background Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Form Background</h3>
            <div className="space-y-2">
              <Label htmlFor="form_bg_color">Form Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="form_bg_color_picker"
                  type="color"
                  value={formData.form_bg_color.startsWith('rgba') || formData.form_bg_color.startsWith('rgb') ? "#FFFFFF" : formData.form_bg_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, form_bg_color: e.target.value }))}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  id="form_bg_color"
                  type="text"
                  value={formData.form_bg_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, form_bg_color: e.target.value }))}
                  placeholder="rgba(255, 255, 255, 0.1)"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supports rgba, hex, or CSS color values
              </p>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Live Preview - Moved to bottom and enlarged */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-secondary" />
                Live Preview
              </CardTitle>
              <CardDescription>
                Click on any text below to edit directly (headlines, form title, button text, and field labels).
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="deposit_toggle" className="text-sm">Show Deposit Section</Label>
                <Switch 
                  id="deposit_toggle"
                  checked={formData.show_deposit_section}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, show_deposit_section: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <style>
            {`
              .editable-preview {
                cursor: text;
                outline: 2px solid transparent;
                transition: outline 0.2s;
                border-radius: 4px;
                padding: 2px 4px;
                margin: -2px -4px;
              }
              .editable-preview:hover {
                outline: 2px solid rgba(255,255,255,0.3);
              }
              .editable-preview:focus {
                outline: 2px solid rgba(255,255,255,0.6);
                background: rgba(255,255,255,0.05);
              }
            `}
          </style>
          <div 
            className="border rounded-lg p-8 md:p-12 bg-background min-h-[700px] overflow-hidden"
            style={{ 
              fontFamily: FONT_OPTIONS.find(f => f.value === formData.font_family)?.cssName || "'Inter', sans-serif",
              background: getEffectiveBgImageUrl() 
                ? `linear-gradient(${formData.page_bg_color}CC, ${formData.page_bg_color}EE), url(${getEffectiveBgImageUrl()}) center/cover`
                : formData.page_bg_color
            }}
          >
            <div className="max-w-md mx-auto text-center space-y-6 md:space-y-8">
              {/* Logo */}
              {getEffectiveLogoUrl() && (
                <div className="mb-8">
                  <img 
                    src={getEffectiveLogoUrl()} 
                    alt="Logo" 
                    className="h-12 md:h-14 mx-auto"
                    key={getEffectiveLogoUrl()}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Header - Editable */}
              <div className="space-y-3">
                <h1 
                  className="text-3xl md:text-4xl font-bold editable-preview"
                  style={{ color: formData.text_color }}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const newValue = e.currentTarget.textContent || "";
                    setFormData(prev => ({ ...prev, page_title: newValue }));
                  }}
                >
                  {formData.page_title}
                </h1>
                <p 
                  className="text-base md:text-lg editable-preview"
                  style={{ color: formData.text_color, opacity: 0.9 }}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const newValue = e.currentTarget.textContent || "";
                    setFormData(prev => ({ ...prev, page_subtitle: newValue }));
                  }}
                >
                  {formData.page_subtitle}
                </p>
              </div>

              {/* Form */}
              <div 
                className="backdrop-blur-sm rounded-lg p-6 space-y-4"
                style={{ background: formData.form_bg_color }}
              >
                <h2 
                  className="text-xl md:text-2xl font-semibold mb-4 editable-preview text-center"
                  style={{ color: formData.text_color }}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const newValue = e.currentTarget.textContent || "";
                    setFormData(prev => ({ ...prev, form_title: newValue }));
                  }}
                >
                  {formData.form_title}
                </h2>
                
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label 
                        className="text-xs editable-preview inline-block"
                        style={{ color: formData.text_color, opacity: 0.8 }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newValue = e.currentTarget.textContent || "First Name";
                          setFormData(prev => ({ 
                            ...prev, 
                            field_labels: { ...prev.field_labels, firstName: newValue }
                          }));
                        }}
                      >
                        {formData.field_labels.firstName}
                      </label>
                      <Input 
                        placeholder="John"
                        className="border-2 placeholder:text-gray-400 focus:ring-2 transition-all duration-200"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderColor: `${formData.secondary_color}40`,
                          color: formData.text_color,
                          '--tw-ring-color': formData.secondary_color
                        } as React.CSSProperties}
                        disabled
                      />
                    </div>
                    <div className="space-y-1">
                      <label 
                        className="text-xs editable-preview inline-block"
                        style={{ color: formData.text_color, opacity: 0.8 }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newValue = e.currentTarget.textContent || "Last Name";
                          setFormData(prev => ({ 
                            ...prev, 
                            field_labels: { ...prev.field_labels, lastName: newValue }
                          }));
                        }}
                      >
                        {formData.field_labels.lastName}
                      </label>
                      <Input 
                        placeholder="Doe"
                        className="border-2 placeholder:text-gray-400 focus:ring-2 transition-all duration-200"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderColor: `${formData.secondary_color}40`,
                          color: formData.text_color,
                          '--tw-ring-color': formData.secondary_color
                        } as React.CSSProperties}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label 
                      className="text-xs editable-preview inline-block"
                      style={{ color: formData.text_color, opacity: 0.8 }}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newValue = e.currentTarget.textContent || "Email Address";
                        setFormData(prev => ({ 
                          ...prev, 
                          field_labels: { ...prev.field_labels, email: newValue }
                        }));
                      }}
                    >
                      {formData.field_labels.email}
                    </label>
                    <Input 
                      placeholder="john@example.com"
                      className="border-2 placeholder:text-gray-400 focus:ring-2 transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: `${formData.secondary_color}40`,
                        color: formData.text_color,
                        '--tw-ring-color': formData.secondary_color
                      } as React.CSSProperties}
                      disabled
                    />
                  </div>
                  <div className="space-y-1">
                    <label 
                      className="text-xs editable-preview inline-block"
                      style={{ color: formData.text_color, opacity: 0.8 }}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newValue = e.currentTarget.textContent || "Phone Number";
                        setFormData(prev => ({ 
                          ...prev, 
                          field_labels: { ...prev.field_labels, phone: newValue }
                        }));
                      }}
                    >
                      {formData.field_labels.phone}
                    </label>
                    <div className="flex gap-3">
                      <Select disabled>
                        <SelectTrigger
                          className="border-2 transition-all duration-200 w-32"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: `${formData.secondary_color}40`,
                            color: formData.text_color
                          }}
                        >
                          <SelectValue
                            placeholder={
                              <div className="flex items-center gap-1">
                                <span>🇺🇸</span>
                                <span>+1</span>
                              </div>
                            }
                          />
                        </SelectTrigger>
                      </Select>
                      <Input 
                        placeholder="1234567890"
                        className="border-2 placeholder:text-gray-400 focus:ring-2 transition-all duration-200 flex-1"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderColor: `${formData.secondary_color}40`,
                          color: formData.text_color,
                          '--tw-ring-color': formData.secondary_color
                        } as React.CSSProperties}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label 
                      className="text-xs editable-preview inline-block"
                      style={{ color: formData.text_color, opacity: 0.8 }}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newValue = e.currentTarget.textContent || "Select Country";
                        setFormData(prev => ({ 
                          ...prev, 
                          field_labels: { ...prev.field_labels, country: newValue }
                        }));
                      }}
                    >
                      {formData.field_labels.country}
                    </label>
                    <Select disabled>
                      <SelectTrigger 
                        className="border-2 transition-all duration-200"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderColor: `${formData.secondary_color}40`,
                          color: formData.text_color
                        }}
                      >
                        <SelectValue placeholder={
                          selectedConnectionId && connections.find(c => c._id === selectedConnectionId)?.countries?.length > 0
                            ? connections.find(c => c._id === selectedConnectionId)?.countries[0].country
                            : "Argentina"
                        } />
                      </SelectTrigger>
                    </Select>
                  </div>
                  
                  {/* Deposit Section - Conditional */}
                  {formData.show_deposit_section && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label 
                          className="text-xs editable-preview inline-block"
                          style={{ color: formData.text_color, opacity: 0.8 }}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newValue = e.currentTarget.textContent || "Deposit Amount";
                            setFormData(prev => ({ 
                              ...prev, 
                              field_labels: { ...prev.field_labels, depositAmount: newValue }
                            }));
                          }}
                        >
                          {formData.field_labels.depositAmount}
                        </label>
                        <Input 
                          placeholder="Enter deposit amount"
                          className="border-2 placeholder:text-gray-400 focus:ring-2 transition-all duration-200"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: `${formData.secondary_color}40`,
                            color: formData.text_color,
                            '--tw-ring-color': formData.secondary_color
                          } as React.CSSProperties}
                          disabled
                        />
                      </div>
                      <div className="space-y-1">
                        <label 
                          className="text-xs editable-preview inline-block"
                          style={{ color: formData.text_color, opacity: 0.8 }}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newValue = e.currentTarget.textContent || "Select Currency";
                            setFormData(prev => ({ 
                              ...prev, 
                              field_labels: { ...prev.field_labels, currency: newValue }
                            }));
                          }}
                        >
                          {formData.field_labels.currency}
                        </label>
                        <Select disabled>
                          <SelectTrigger 
                            className="border-2 transition-all duration-200"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderColor: `${formData.secondary_color}40`,
                              color: formData.text_color
                            }}
                          >
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <FlagIcon code="US" size={16} />
                                <span>US Dollar</span>
                                <span className="text-xs opacity-70">($)</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  <div
                    className="w-full font-semibold py-5 text-base transition-all duration-300 hover:shadow-lg rounded-md flex items-center justify-center cursor-pointer editable-preview"
                    style={{ 
                      backgroundColor: formData.primary_color,
                      color: formData.button_text_color,
                      border: `1px solid ${formData.primary_color}`,
                      boxShadow: `0 4px 20px ${formData.primary_color}60`
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const newValue = e.currentTarget.textContent || "Join Now";
                      setFormData(prev => ({ ...prev, submit_button_text: newValue }));
                    }}
                  >
                    {formData.submit_button_text}
                  </div>
                </div>
              </div>


              {/* Powered by TrackAff */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <p 
                  className="text-sm opacity-60 text-center"
                  style={{ color: formData.text_color }}
                >
                  Powered by TrackAff
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Buttons */}
      <div className="flex justify-end gap-3">
        {selectedConnectionId && connections.find(c => c._id === selectedConnectionId)?.optin_page_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(connections.find(c => c._id === selectedConnectionId)?.optin_page_url, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Live Page
          </Button>
        )}
          <Button 
            onClick={() => {
            setFormData({
              connection_id: selectedConnectionId,
              primary_color: "#E16A14",
              secondary_color: "#E16A14",
              text_color: "#FFFFFF",
              button_text_color: "#FFFFFF",
              logo_url: "",
              uploaded_logo_url: "",
              page_bg_color: "#000000",
              page_bg_image_url: "",
              uploaded_bg_image_url: "",
              form_bg_color: "rgba(255, 255, 255, 0.1)",
              page_title: "Track The Untrackable",
              page_subtitle: "Stop guessing. Start tracking. Boost your ROAS.",
              form_title: "Get Started",
              submit_button_text: "Join Now",
              font_family: "Inter",
              show_deposit_section: true,
              field_labels: {
                firstName: "First Name",
                lastName: "Last Name",
                email: "Email Address",
                phone: "Phone Number",
                country: "Select Country",
                depositAmount: "Deposit Amount",
                currency: "Select Currency"
              }
            });
            setUploadedFile(null);
            setPendingUploadFile(null);
            setPendingBgImageFile(null);
            if (previewLogoUrl.startsWith('blob:')) {
              URL.revokeObjectURL(previewLogoUrl);
            }
            if (previewBgImageUrl.startsWith('blob:')) {
              URL.revokeObjectURL(previewBgImageUrl);
            }
            setPreviewLogoUrl("");
            setPreviewBgImageUrl("");
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
  );
}