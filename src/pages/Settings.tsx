import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, User, CreditCard, Save, Lock } from "lucide-react";
import { FlagIcon } from 'react-flag-kit';
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { TIMEZONES, getDetectedTimezone } from "@/lib/timezone-utils";
import { SYSTEM_CURRENCIES } from "@/utils/constants";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    system_currency: "EUR" as "EUR" | "USD",
    timezone: getDetectedTimezone(),
    billing_address: {}
  });

  // Store original data for comparison
  const [originalFormData, setOriginalFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
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

  // Utility function to check if form data has changed
  const hasFormDataChanged = () => {
    return (
      formData.first_name !== originalFormData.first_name ||
      formData.last_name !== originalFormData.last_name ||
      formData.phone !== originalFormData.phone ||
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
                <Label>First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>System Currency</Label>
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
              <Label>Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {TIMEZONES.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
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
              <Input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                placeholder="Enter your current password"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                placeholder="Enter your new password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                placeholder="Confirm your new password"
              />
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
            <CardDescription>Manage your billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Billing management coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}