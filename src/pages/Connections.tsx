import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableCountrySelect } from "@/components/ui/searchable-country-select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Link as LinkIcon, 
  Plus, 
  Edit,
  Trash2,
  Globe,
  DollarSign,
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  AlertCircle,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Code,
  Tag,
  Zap,
  Loader2,
  Copy
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { extractApiErrorMessage, getCurrencySymbol } from "@/lib/utils";
import { FlagIcon } from 'react-flag-kit';
import { COUNTRIES, getCountryFlagCode } from "@/utils/constants";

export default function Connections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletingConnection, setDeletingConnection] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [testingConnections, setTestingConnections] = useState<Set<string>>(new Set());
  const [connectionTestResults, setConnectionTestResults] = useState<Map<string, { isLive: boolean; lastTested: Date }>>(new Map());

  const [formData, setFormData] = useState({
    name: "",
    platform: 'Facebook',
    environment: 'Production',
    pixel_id: "",
    pixel_access_token: "",
    countries: [{ country: "", value: "" }],
    submission_link: "",
    use_custom_domain: false,
    custom_domain: "",
    test_event_code: "",
    custom_event_name: "Purchase"
  });

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (deletingConnection) {
      handleDelete();
    }
  }, [deletingConnection]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getConnections();
      const connectionsData = response.data.connections || [];
      setConnections(connectionsData);

      // If backend provides live status, update our local state
      connectionsData.forEach((connection: any) => {
        if (connection.live_status !== undefined || 
            connection.last_test_result !== undefined ||
            connection.test_result !== undefined ||
            connection.connection_status !== undefined) {
          setConnectionTestResults(prev => {
            const newMap = new Map(prev);
            const isLive = connection.live_status === true || 
                          connection.last_test_result === true ||
                          connection.connection_status === true ||
                          connection.test_result?.connection_status === true ||
                          connection.test_result?.success === true;
            
            const lastTested = connection.last_tested || 
                             connection.test_result?.tested_at ||
                             connection.tested_at;
            
            newMap.set(connection._id, {
              isLive,
              lastTested: lastTested ? new Date(lastTested) : new Date()
            });
            return newMap;
          });
        }
      });
    } catch (error: any) {
      console.error('Error fetching connections:', error);
      
      toast({
        title: "Error",
        description: extractApiErrorMessage(error, "Failed to fetch connections"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const resetForm = () => {
    setFormData({
      name: "",
      platform: 'Facebook',
      environment: 'Production',
      pixel_id: "",
      pixel_access_token: "",
      countries: [{ country: "", value: "" }],
      submission_link: "",
      use_custom_domain: false,
      custom_domain: "",
      test_event_code: "",
      custom_event_name: "Purchase"
    });
    setEditingConnection(null);
  };

  const openEditDialog = (connection: any) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      platform: connection.platform || 'Facebook',
      environment: connection.environment || 'Production',
      pixel_id: connection.pixel_id,
      pixel_access_token: connection.pixel_access_token,
      countries: connection.countries || [{ country: "", value: "" }],
      submission_link: connection.submission_link || "",
      use_custom_domain: connection.use_custom_domain,
      custom_domain: connection.custom_domain || "",
      test_event_code: connection.test_event_code || "",
      custom_event_name: connection.custom_event_name || "Purchase"
    });
    setIsDialogOpen(true);
  };

  const addCountryField = () => {
    setFormData(prev => ({
      ...prev,
      countries: [...prev.countries, { country: "", value: "" }]
    }));
  };

  const removeCountryField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.filter((_, i) => i !== index)
    }));
  };

  const updateCountryField = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.map((country, i) => 
        i === index ? { ...country, [field]: value } : country
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate Pixel ID length (must be more than 15 and less than 18 characters)
      if (formData.pixel_id.length < 15 || formData.pixel_id.length > 17 || !/^\d{15,17}$/.test(formData.pixel_id)) {
        toast({
          title: "Error",
          description: "Invalid Pixel ID. Pixel ID must be 15–17 digits.",
          variant: "destructive"
        });
        return;
      }

      // Validate System Access Token length (must be more than 200 characters)
      if (formData.pixel_access_token.length <= 200) {
        toast({
          title: "Error",
          description: "Invalid System Access Token. System Access Token must be more than 200 characters long.",
          variant: "destructive"
        });
        return;
      }

      // Validate custom domain field when custom domain is enabled
      if (formData.use_custom_domain && !formData.custom_domain.trim()) {
        toast({
          title: "Error",
          description: "Custom domain is required when 'Use Custom Domain' is enabled.",
          variant: "destructive"
        });
        return;
      }

      const validCountries = formData.countries.filter(c => c.country && c.value);
      
      if (validCountries.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one country with a value",
          variant: "destructive"
        });
        return;
      }

      const connectionData = {
        name: formData.name,
        pixel_id: formData.pixel_id,
        pixel_access_token: formData.pixel_access_token,
        countries: validCountries.map(c => ({
          country: c.country,
          value: parseFloat(c.value) || 0
        })),
        submission_link: formData.submission_link,
        use_custom_domain: formData.use_custom_domain,
        custom_domain: formData.custom_domain,
        test_event_code: formData.test_event_code,
        custom_event_name: formData.custom_event_name
      };

      if (editingConnection) {
        await apiClient.updateConnection(editingConnection._id, connectionData);
      } else {
        await apiClient.createConnection(connectionData);
      }

      toast({
        title: "Success",
        description: `Connection ${editingConnection ? 'updated' : 'created'} successfully`
      });

      setIsDialogOpen(false);
      resetForm();
      fetchConnections();
    } catch (error: any) {
      console.error('Error saving connection:', error);
      
      toast({
        title: "Error",
        description: extractApiErrorMessage(error, "Failed to save connection"),
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingConnection) return;

    try {
      await apiClient.deleteConnection(deletingConnection._id);

      toast({
        title: "Success",
        description: "Connection deleted successfully"
      });

      setDeletingConnection(null);
      fetchConnections();
    } catch (error: any) {
      console.error('Error deleting connection:', error);
      
      toast({
        title: "Error",
        description: extractApiErrorMessage(error, "Failed to delete connection"),
        variant: "destructive"
      });
      setDeletingConnection(null);
    }
  };

  const handleTestConnection = async (connection: any) => {
    if (!connection._id) return;

    // Add connection to testing set
    setTestingConnections(prev => new Set([...prev, connection._id]));

    try {
      const response = await apiClient.testConnection(connection._id);
      
      // Parse the response - check both direct and nested test_result structure
      const isSuccess = response.data?.success === true || 
                       response.data?.status === true || 
                       response.data?.test_result?.success === true || 
                       response.data?.test_result?.connection_status === true;
      
      const testMessage = response.data?.message || 
                         response.data?.test_result?.message || 
                         "Connection test completed";

      // Update test results
      setConnectionTestResults(prev => {
        const newMap = new Map(prev);
        newMap.set(connection._id, {
          isLive: isSuccess,
          lastTested: response.data?.test_result?.tested_at ? new Date(response.data.test_result.tested_at) : new Date()
        });
        return newMap;
      });

      toast({
        title: isSuccess ? "✅ Test Successful" : "❌ Test Failed",
        description: isSuccess 
          ? "Connection is working! Meta is receiving events properly." 
          : "Connection failed. Please verify your pixel id , access token or test event code.",
        variant: isSuccess ? "default" : "destructive"
      });

    } catch (error: any) {
      console.error('Error testing connection:', error);
      
      // Mark as not live on error
      setConnectionTestResults(prev => {
        const newMap = new Map(prev);
        newMap.set(connection._id, {
          isLive: false,
          lastTested: new Date()
        });
        return newMap;
      });

      toast({
        title: "❌ Connection Test Error",
        description: "Unable to reach Meta CAPI. Check your internet connection and try again.",
        variant: "destructive"
      });
    } finally {
      // Remove connection from testing set
      setTestingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connection._id);
        return newSet;
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Meta CAPI Connections
          </h1>
          <p className="text-muted-foreground">
            Manage your pixel connections
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="interactive-button bg-primary hover:bg-primary/90"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? 'Edit Connection' : 'Create New Connection'}
              </DialogTitle>
              <DialogDescription>
                Configure your Meta CAPI pixel connection settings
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Main Trading Pixel"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pixel_id">Pixel ID</Label>
                    <Input
                      id="pixel_id"
                      value={formData.pixel_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, pixel_id: e.target.value }))}
                      placeholder="123456789012345"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pixel_access_token">System Access Token</Label>
                    <Input
                      id="pixel_access_token"
                      type="password"
                      value={formData.pixel_access_token}
                      onChange={(e) => setFormData(prev => ({ ...prev, pixel_access_token: e.target.value }))}
                      placeholder="EAAxxxxxxxxx"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Countries & Values */}
              <div className="space-y-4">
                <Label>Countries & Values</Label>
                {formData.countries.map((country, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <SearchableCountrySelect
                        value={country.country}
                        onValueChange={(value) => updateCountryField(index, 'country', value)}
                        placeholder="Select country"
                      />
                    </div>
                    <div className="w-32 relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                        {getCurrencySymbol(profile?.system_currency)}
                      </div>
                      <Input
                        type="number"
                        value={country.value}
                        onChange={(e) => updateCountryField(index, 'value', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>
                    {formData.countries.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCountryField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCountryField}
                  className="interactive-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Country
                </Button>
              </div>

              {/* Submission Link */}
              <div className="space-y-2">
                <Label htmlFor="submission_link">Submission Redirect Link (Optional)</Label>
                <Input
                  id="submission_link"
                  value={formData.submission_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, submission_link: e.target.value }))}
                  placeholder="https://t.me/your-channel or https://your-website.com"
                />
                <p className="text-xs text-muted-foreground">
                  Users will be redirected here after form submission
                </p>
              </div>

              {/* Domain Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_custom_domain"
                    checked={formData.use_custom_domain}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_custom_domain: checked }))}
                  />
                  <Label htmlFor="use_custom_domain">Use Custom Domain</Label>
                </div>

                {formData.use_custom_domain && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_domain">Custom Domain</Label>
                    <Input
                      id="custom_domain"
                      value={formData.custom_domain}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_domain: e.target.value }))}
                      placeholder="tracking.yourdomain.com"
                    />
                   <div className="text-sm text-muted-foreground space-y-2 border rounded-lg p-4 bg-muted/30">
                      <p className="font-medium text-foreground">To set up your custom domain:</p>
                      
                       <p>
                         Add CNAME record:{" "}
                         <code className="bg-muted px-1 py-0.5 rounded text-xs inline-block">
                           www → {editingConnection?.optin_page_url || "your-optin-page-url"}
                         </code>
                       </p>

                      <p>SSL will be automatically provisioned once DNS propagates</p>

                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        ⚠️ After adding DNS records, it may take some time for changes to fully
                        propagate. During this time, the domain may not work properly.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Settings Section */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <div className="border rounded-lg">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                        <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-foreground">Advanced Settings</h3>
                        <p className="text-sm text-muted-foreground">Optional test and event configuration</p>
                      </div>
                    </div>
                    {isAdvancedOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Test Event Code */}
                        <div className="space-y-2">
                          <Label htmlFor="test_event_code" className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-muted-foreground" />
                            Test Event Code
                          </Label>
                          <Input
                            id="test_event_code"
                            value={formData.test_event_code}
                            onChange={(e) => setFormData(prev => ({ ...prev, test_event_code: e.target.value }))}
                            placeholder="TEST12345"
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional test event code for debugging
                          </p>
                        </div>

                        {/* Custom Event Name */}
                        <div className="space-y-2">
                          <Label htmlFor="custom_event_name" className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            Custom Event Name
                          </Label>
                          <Select
                            value={formData.custom_event_name}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, custom_event_name: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Purchase">Purchase</SelectItem>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="Deposit">Deposit</SelectItem>
                              {/* <SelectItem value="CompleteRegistration">Complete Registration</SelectItem>
                              <SelectItem value="AddToCart">Add to Cart</SelectItem>
                              <SelectItem value="InitiateCheckout">Initiate Checkout</SelectItem>
                              <SelectItem value="ViewContent">View Content</SelectItem>
                              <SelectItem value="AddPaymentInfo">Add Payment Info</SelectItem>
                              <SelectItem value="Subscribe">Subscribe</SelectItem>
                              <SelectItem value="StartTrial">Start Trial</SelectItem>
                              <SelectItem value="Contact">Contact</SelectItem> */}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {/* Default: tracksters_opt_in */}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Help & Documentation Section */}
              <Collapsible open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                <div className="border rounded-lg">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-foreground">Help & Documentation</h3>
                        <p className="text-sm text-muted-foreground">How to get your Pixel ID & System Access Token</p>
                      </div>
                    </div>
                    {isHelpOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">How to get your System Access Token:</h4>
                        <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                          <li className="flex items-start gap-2">
                            <span className="font-medium min-w-[20px]">1.</span>
                            <span>Go to <strong>Meta Business Manager</strong> → <strong>Events Manager</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium min-w-[20px]">2.</span>
                            <span>Select your pixel → <strong>Settings</strong> → <strong>Conversions API</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium min-w-[20px]">3.</span>
                            <span>Click <strong>Generate Access Token</strong> or copy your existing token</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium min-w-[20px]">4.</span>
                            <span>Paste the token in the System Access Token field above</span>
                          </li>
                        </ol>
                      </div>
                      
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-3">Important Notes:</h4>
                        <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400">•</span>
                            <span>System access tokens are different from regular access tokens</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400">•</span>
                            <span>They start with "EAA" and are used for server-side API calls</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400">•</span>
                            <span>Keep your tokens secure and never share them publicly</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400">•</span>
                            <span>Pixel ID should be around 16 digits from your Facebook pixel</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="interactive-button bg-primary hover:bg-primary/90"
                >
                  {editingConnection ? 'Update Connection' : 'Create Connection'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connections List */}
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading connections...</div>
            </CardContent>
          </Card>
        ) : connections.length > 0 ? (
          connections.map((connection) => (
            <Card key={connection.id} className="hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <LinkIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {connection.name}
                      </CardTitle>
                      <CardDescription>
                        Pixel ID: {connection.pixel_id}
                      </CardDescription>
                      {connection.optin_page_url && (
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <a 
                              href={connection.optin_page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              Opt-in Page: {connection.optin_page_url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(connection.optin_page_url, "Opt-in page URL")}
                                    className="h-6 w-6 p-0 hover:bg-muted"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy opt-in page URL</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Connection Status Badge */}
                    {connection.test_event_code ? (
                      connectionTestResults.has(connection._id) && (
                        <Badge 
                          variant={connectionTestResults.get(connection._id)?.isLive ? "default" : "destructive"}
                          className={connectionTestResults.get(connection._id)?.isLive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300"}
                        >
                          {connectionTestResults.get(connection._id)?.isLive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </>
                          )}
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-300">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No Event Code
                      </Badge>
                    )}
                    
                    {/* Test Button - Only show if test_event_code exists */}
                    {connection.test_event_code && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(connection)}
                              disabled={testingConnections.has(connection._id)}
                              className="interactive-button"
                            >
                              {testingConnections.has(connection._id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Zap className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Test if connection is live</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(connection)}
                      className="interactive-button"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                                          <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="interactive-button text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the connection "{connection.name}"? This action cannot be undone and will permanently remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => setDeletingConnection(connection)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Connection
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {/* Countries */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Countries & Values
                    </h4>
                    <div className="space-y-1">
                      {connection.countries?.map((country: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <FlagIcon code={getCountryFlagCode(country.country) as any} size={14} />
                            <span className="text-muted-foreground">{country.country}:</span>
                          </div>
                          <span className="text-foreground font-medium">{getCurrencySymbol(profile?.system_currency)}{country.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Domain Info */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-secondary" />
                      Domain Settings
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        {connection.use_custom_domain ? (
                          <>Custom: {connection.custom_domain}</>
                        ) : (
                          <>Default: trackAff.app</>
                        )}
                      </p>
                      {connection.ssl_enabled && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          SSL Enabled
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-green-600" />
                      Advanced Settings
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Event:</span>
                        <span className="text-foreground font-medium">{connection.custom_event_name || 'Purchase'}</span>
                      </div>
                      {connection.test_event_code && (
                        <div className="flex items-center gap-2">
                          <Code className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Test:</span>
                          <span className="text-foreground font-medium">{connection.test_event_code}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opt-in Page Status */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-accent" />
                      Opt-in Page
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        {connection.optin_page_configured ? (
                          <Badge variant="default" className="text-xs bg-secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Set Up
                          </Badge>
                        )}
                      </div>
                      {/* {connection.optin_page_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(connection.optin_page_url, '_blank')}
                          className="text-xs h-7"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Page
                        </Button>
                      )} */}
                    </div>
                  </div>

                  {/* Redirect Link */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-accent" />
                      Redirect Link
                    </h4>
                    {connection.submission_link ? (
                      <div className="flex items-center gap-2">
                        <a 
                          href={connection.submission_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {connection.submission_link.length > 25 
                            ? connection.submission_link.substring(0, 25) + '...'
                            : connection.submission_link
                          }
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(connection.submission_link, "Redirect link")}
                                className="h-6 w-6 p-0 hover:bg-muted"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy redirect link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not configured</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No connections yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first Meta CAPI connection to start tracking conversions
              </p>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="interactive-button bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Connection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}