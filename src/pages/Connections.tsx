import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  AlertCircle
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const COUNTRIES = [
  "United States", "United Kingdom", "Germany", "France", "Italy", "Spain", "Netherlands",
  "Belgium", "Switzerland", "Austria", "Sweden", "Norway", "Denmark", "Finland",
  "Canada", "Australia", "Japan", "South Korea", "Singapore", "Hong Kong",
  "Brazil", "Mexico", "Argentina", "Chile", "Colombia", "India", "China",
  "South Africa", "Nigeria", "Egypt", "UAE", "Saudi Arabia", "Turkey", "Poland"
];

export default function Connections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    pixel_id: "",
    pixel_access_token: "",
    countries: [{ country: "", value: "" }],
    submission_link: "",
    use_custom_domain: false,
    custom_domain: ""
  });

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getConnections();
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch connections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      pixel_id: "",
      pixel_access_token: "",
      countries: [{ country: "", value: "" }],
      submission_link: "",
      use_custom_domain: false,
      custom_domain: ""
    });
    setEditingConnection(null);
  };

  const openEditDialog = (connection: any) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      pixel_id: connection.pixel_id,
      pixel_access_token: connection.pixel_access_token,
      countries: connection.countries || [{ country: "", value: "" }],
      submission_link: connection.submission_link || "",
      use_custom_domain: connection.use_custom_domain,
      custom_domain: connection.custom_domain || ""
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
        countries: validCountries,
        submission_link: formData.submission_link,
        use_custom_domain: formData.use_custom_domain,
        custom_domain: formData.custom_domain
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
    } catch (error) {
      console.error('Error saving connection:', error);
      toast({
        title: "Error",
        description: "Failed to save connection",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      await apiClient.deleteConnection(connectionId);

      toast({
        title: "Success",
        description: "Connection deleted successfully"
      });

      fetchConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: "Error",
        description: "Failed to delete connection",
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
            Manage your Meta Conversion API pixel connections
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
                    <Label htmlFor="pixel_access_token">Pixel Access Token</Label>
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
                      <Select
                        value={country.country}
                        onValueChange={(value) => updateCountryField(index, 'country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((countryName) => (
                            <SelectItem key={countryName} value={countryName}>
                              {countryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        value={country.value}
                        onChange={(e) => updateCountryField(index, 'value', e.target.value)}
                        placeholder="Value"
                        min="0"
                        step="0.01"
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
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>To set up your custom domain:</p>
                      <p>1. Add a CNAME record: <code className="bg-muted px-1 rounded">tracking.yourdomain.com → trackiterra.app</code></p>
                      <p>2. SSL will be automatically provisioned once DNS propagates</p>
                    </div>
                  </div>
                )}
              </div>

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
                      <CardTitle className="text-xl">{connection.name}</CardTitle>
                      <CardDescription>
                        Pixel ID: {connection.pixel_id}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={connection.domain_verified ? "default" : "secondary"}
                      className={connection.domain_verified ? "bg-secondary" : ""}
                    >
                      {connection.domain_verified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(connection)}
                      className="interactive-button"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                                          <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(connection._id)}
                      className="interactive-button text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Countries */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Countries & Values
                    </h4>
                    <div className="space-y-1">
                      {connection.countries?.map((country: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{country.country}</span>
                          <span className="text-foreground font-medium">${country.value}</span>
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
                          <>Default: trackiterra.app</>
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

                  {/* Redirect Link */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-accent" />
                      Redirect Link
                    </h4>
                    {connection.submission_link ? (
                      <a 
                        href={connection.submission_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {connection.submission_link.substring(0, 40)}...
                        <ExternalLink className="h-3 w-3" />
                      </a>
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