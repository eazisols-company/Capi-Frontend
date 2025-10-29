import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizedCountryCodeSelect } from "@/components/ui/optimized-country-code-select";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, User, CreditCard, Save, Lock, Eye, EyeOff } from "lucide-react";
import { FlagIcon } from 'react-flag-kit';
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { TIMEZONES, getDetectedTimezone, getTimezoneDisplayWithOffset } from "@/lib/timezone-utils";
import { SYSTEM_CURRENCIES, COUNTRY_CODES } from "@/utils/constants";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    country_code: "+1",
    system_currency: "EUR" as "EUR" | "USD",
    timezone: getDetectedTimezone(),
    billing_address: {}
  });

  // Store original data for comparison
  const [originalFormData, setOriginalFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    country_code: "+1",
    system_currency: "EUR" as "EUR" | "USD",
    timezone: getDetectedTimezone(),
    billing_address: {}
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [changingPassword, setChangingPassword] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Utility function to check if form data has changed
  const hasFormDataChanged = () => {
    return (
      formData.first_name !== originalFormData.first_name ||
      formData.last_name !== originalFormData.last_name ||
      formData.phone !== originalFormData.phone ||
      formData.country_code !== originalFormData.country_code ||
      formData.system_currency !== originalFormData.system_currency ||
      formData.timezone !== originalFormData.timezone ||
      JSON.stringify(formData.billing_address) !== JSON.stringify(originalFormData.billing_address)
    );
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      const data = response.data.profile;
      
      const profileData = {
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        country_code: data.country_code || "+1",
        system_currency: (data.system_currency || "EUR") as "EUR" | "USD",
        timezone: data.timezone || getDetectedTimezone(),
        billing_address: data.billing_address || {}
      };
      
      setProfile(data);
      setFormData(profileData);
      setOriginalFormData(profileData); // Store original data for comparison
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log('Saving form data:', formData);
      
      // Validate required fields
      if (formData.first_name.trim() === "") {
        toast({
          title: "Error",
          description: "First name is required",
          variant: "destructive"
        });
        return;
      }
      
      if (formData.last_name.trim() === "") {
        toast({
          title: "Error",
          description: "Last name is required",
          variant: "destructive"
        });
        return;
      }
      
      if (formData.phone.trim() === "") {
        toast({
          title: "Error",
          description: "Phone number is required",
          variant: "destructive"
        });
        return;
      }
      
      if (!/^\d{4,15}$/.test(formData.phone)) {
        toast({
          title: "Error",
          description: "Phone number must be between 4 to 15 digits",
          variant: "destructive"
        });
        return;
      }

      setSaving(true);
      await apiClient.updateProfile(formData);

      toast({
        title: "Success",
        description: "Settings updated successfully"
      });

      // Update original form data to reflect the new saved state
      setOriginalFormData({ ...formData });
      
      // Refresh both local profile and auth user context
      await Promise.all([
        fetchProfile(),
        refreshUser()
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          "Failed to update settings";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setChangingPassword(true);
      await apiClient.changePassword(passwordData);

      toast({
        title: "Success",
        description: "Password changed successfully"
      });

      // Clear password form
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          "Failed to change password. Please check your current password.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and billing information</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving || !hasFormDataChanged()} 
          className="interactive-button bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Account ID</p>
                <p className="font-mono font-semibold">{profile.account_id}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <OptimizedCountryCodeSelect
                  value={formData.country_code}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country_code: value }))}
                  className="w-36"
                  placeholder="Select country code"
                />
                <Input
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow numeric input and limit to 15 characters
                    const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
                    setFormData(prev => ({ ...prev, phone: numericValue }));
                  }}
                  placeholder="Enter phone number"
                  className="flex-1"
                  maxLength={15}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>System Currency <span className="text-red-500"></span></Label>
              <Select
                value={formData.system_currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, system_currency: value as "EUR" | "USD" }))}
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.system_currency && (
                      <div className="flex items-center gap-2">
                        <FlagIcon 
                          code={SYSTEM_CURRENCIES.find(c => c.code === formData.system_currency)?.flagCode as any} 
                          size={16} 
                        />
                        <span>{SYSTEM_CURRENCIES.find(c => c.code === formData.system_currency)?.name}</span>
                        <span>({SYSTEM_CURRENCIES.find(c => c.code === formData.system_currency)?.symbol})</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_CURRENCIES.map((currency) => (
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
            </div>
            <div className="space-y-2">
              <Label>Timezone <span className="text-red-500"></span></Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone">
                    {formData.timezone && (
                      <span className="truncate">
                        {getTimezoneDisplayWithOffset(formData.timezone)}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {TIMEZONES.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{timezone.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {timezone.abbreviation ? `${timezone.abbreviation} - ` : ''}
                          {timezone.offset.includes('/') 
                            ? `GMT ${timezone.offset.split('/')[0]} / GMT ${timezone.offset.split('/')[1]}`
                            : `GMT ${timezone.offset}`
                          }
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All dates and times in the app will be displayed in this timezone
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-500" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  placeholder="Enter your current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="Enter your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Confirm your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Lock className="h-4 w-4 mr-2" />
              {changingPassword ? "Changing Password..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-secondary" />
              Billing Information
            </CardTitle>
            <CardDescription>View your plan details and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.max_connections || profile?.connections_expiry_date ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold text-sm mb-3 text-primary">Connection Limits</h3>
                  <div className="space-y-3">
                    {profile.max_connections && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Maximum Connections</span>
                        <span className="font-semibold text-lg">{profile.max_connections}</span>
                      </div>
                    )}
                    {profile.connections_expiry_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Expires On</span>
                        <span className="font-semibold text-sm">
                          {new Date(profile.connections_expiry_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    {profile.connections_expiry_date && (
                      <div className="pt-2 border-t border-primary/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Days Remaining</span>
                          <span className={`font-semibold ${
                            Math.ceil((new Date(profile.connections_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 7
                              ? 'text-destructive'
                              : 'text-green-600'
                          }`}>
                            {Math.max(0, Math.ceil((new Date(profile.connections_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Need to increase your limits? Contact your administrator for more information.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No billing limits set</p>
                <p className="text-xs mt-2">Contact your administrator to set up connection limits</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}