import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit3, Save, X, User, Phone, Mail, Globe, DollarSign } from "lucide-react";
import { FlagIcon } from 'react-flag-kit';
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/services/api";

// Form validation schema
const submissionEditSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone format"),
  country_code: z.string().min(1, "Country code is required"),
  country: z.string().min(1, "Country is required"),
  deposit_amount: z.number().min(0, "Amount must be positive").max(999999, "Amount too large"),
  currency: z.string().min(1, "Currency is required"),
  custom_event_name: z.enum(["Purchase", "Lead", "Deposit"] as const, {
    required_error: "Please select an event type",
  }),
  commission_amount: z.number().min(0, "Commission must be positive").max(999999, "Commission too large"),
  commission_currency: z.string().min(1, "Commission currency is required"),
  commission_tier: z.string().min(1, "Commission tier is required"),
  platform_name: z.string().min(1, "Country is required").optional(),
  event_sent_to: z.string().min(1, "Event destination is required").optional(),
});

type SubmissionEditFormData = z.infer<typeof submissionEditSchema>;

interface SubmissionEditModalProps {
  submission: any;
  connection?: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmissionUpdated: () => void;
}

// Common countries list
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", 
  "France", "Italy", "Spain", "Netherlands", "Belgium", "Switzerland",
  "Austria", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czech Republic",
  "Hungary", "Portugal", "Ireland", "Greece", "Cyprus", "Malta", "Luxembourg",
  "Slovenia", "Slovakia", "Estonia", "Latvia", "Lithuania", "Romania", "Bulgaria",
  "Croatia", "Serbia", "Montenegro", "Bosnia and Herzegovina", "North Macedonia",
  "Albania", "Moldova", "Ukraine", "Belarus", "Russia", "Turkey", "Israel",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Jordan", "Lebanon", "Egypt", "Morocco", "Tunisia", "Algeria", "Libya",
  "South Africa", "Nigeria", "Kenya", "Ghana", "Ethiopia", "Tanzania",
  "Uganda", "Rwanda", "Botswana", "Namibia", "Zambia", "Zimbabwe",
  "Japan", "South Korea", "China", "Taiwan", "Hong Kong", "Singapore",
  "Malaysia", "Thailand", "Philippines", "Indonesia", "Vietnam", "India",
  "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Myanmar", "Cambodia",
  "Laos", "Mongolia", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan",
  "Turkmenistan", "Afghanistan", "Iran", "Iraq", "Syria", "Yemen", "Oman",
  "Brazil", "Argentina", "Chile", "Colombia", "Peru", "Ecuador", "Venezuela",
  "Uruguay", "Paraguay", "Bolivia", "Guyana", "Suriname", "French Guiana",
  "Mexico", "Guatemala", "Belize", "El Salvador", "Honduras", "Nicaragua",
  "Costa Rica", "Panama", "Cuba", "Jamaica", "Haiti", "Dominican Republic",
  "Puerto Rico", "Trinidad and Tobago", "Barbados", "Bahamas", "Bermuda"
].sort();

// Country codes for phone numbers
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flagCode: "US" },
  { code: "+44", country: "UK", flagCode: "GB" },
  { code: "+49", country: "DE", flagCode: "DE" },
  { code: "+33", country: "FR", flagCode: "FR" },
  { code: "+32", country: "BE", flagCode: "BE" },
  { code: "+41", country: "CH", flagCode: "CH" },
  { code: "+43", country: "AT", flagCode: "AT" },
  { code: "+46", country: "SE", flagCode: "SE" },
  { code: "+47", country: "NO", flagCode: "NO" },
  { code: "+45", country: "DK", flagCode: "DK" },
  { code: "+358", country: "FI", flagCode: "FI" },
  { code: "+31", country: "NL", flagCode: "NL" },
  { code: "+39", country: "IT", flagCode: "IT" },
  { code: "+34", country: "ES", flagCode: "ES" },
  { code: "+351", country: "PT", flagCode: "PT" },
  { code: "+61", country: "AU", flagCode: "AU" },
  { code: "+81", country: "JP", flagCode: "JP" },
  { code: "+82", country: "KR", flagCode: "KR" },
  { code: "+65", country: "SG", flagCode: "SG" },
  { code: "+852", country: "HK", flagCode: "HK" },
  { code: "+55", country: "BR", flagCode: "BR" },
  { code: "+52", country: "MX", flagCode: "MX" },
  { code: "+54", country: "AR", flagCode: "AR" },
  { code: "+56", country: "CL", flagCode: "CL" },
  { code: "+57", country: "CO", flagCode: "CO" },
  { code: "+91", country: "IN", flagCode: "IN" },
  { code: "+92", country: "PK", flagCode: "PK" },
  { code: "+86", country: "CN", flagCode: "CN" },
  { code: "+27", country: "ZA", flagCode: "ZA" },
  { code: "+234", country: "NG", flagCode: "NG" },
  { code: "+20", country: "EG", flagCode: "EG" },
  { code: "+971", country: "AE", flagCode: "AE" },
  { code: "+966", country: "SA", flagCode: "SA" },
  { code: "+90", country: "TR", flagCode: "TR" },
  { code: "+48", country: "PL", flagCode: "PL" }
];

// Common currencies
const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", flagCode: "US" },
  { code: "EUR", name: "Euro", symbol: "€", flagCode: "EU" },
  { code: "GBP", name: "British Pound", symbol: "£", flagCode: "GB" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flagCode: "CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flagCode: "AU" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flagCode: "JP" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flagCode: "CH" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flagCode: "CN" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flagCode: "IN" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flagCode: "BR" },
];

// Helper function to get country flag code from country name
const getCountryFlagCode = (countryName: string): string => {
  const countryMap: { [key: string]: string } = {
    "United States": "US",
    "United Kingdom": "GB",
    "Germany": "DE",
    "France": "FR",
    "Italy": "IT",
    "Spain": "ES",
    "Netherlands": "NL",
    "Belgium": "BE",
    "Switzerland": "CH",
    "Austria": "AT",
    "Sweden": "SE",
    "Norway": "NO",
    "Denmark": "DK",
    "Finland": "FI",
    "Canada": "CA",
    "Australia": "AU",
    "Japan": "JP",
    "South Korea": "KR",
    "Singapore": "SG",
    "Hong Kong": "HK",
    "Brazil": "BR",
    "Mexico": "MX",
    "Argentina": "AR",
    "Chile": "CL",
    "Colombia": "CO",
    "India": "IN",
    "China": "CN",
    "South Africa": "ZA",
    "Nigeria": "NG",
    "Egypt": "EG",
    "United Arab Emirates": "AE",
    "Saudi Arabia": "SA",
    "Turkey": "TR",
    "Poland": "PL",
    "Russia": "RU",
    "Ukraine": "UA",
    "Greece": "GR",
    "Czech Republic": "CZ",
    "Hungary": "HU",
    "Romania": "RO",
    "Ireland": "IE",
    "Estonia": "EE",
    "Latvia": "LV",
    "Lithuania": "LT",
    "Slovakia": "SK",
    "Slovenia": "SI",
    "Croatia": "HR",
    "Serbia": "RS",
    "Bulgaria": "BG",
    "Malaysia": "MY",
    "Thailand": "TH",
    "Vietnam": "VN",
    "Philippines": "PH",
    "Indonesia": "ID"
  };
  return countryMap[countryName] || "US"; // Default to US flag if not found
};

// Available custom event names (matching those used in Connections)
const CUSTOM_EVENT_NAMES = [
  "Purchase",
  "Lead", 
  "Deposit",
  // "CompleteRegistration",
  // "AddToCart",
  // "ViewContent",
  // "InitiateCheckout",
  // "AddPaymentInfo",
  // "Subscribe"
];

// Available commission tiers
const COMMISSION_TIERS = [
  "1",
  "2", 
  "3",
  "4",
  "5",
  "VIP",
  "Premium",
  "Standard",
  "Basic"
];

export function SubmissionEditModal({
  submission,
  connection,
  isOpen,
  onClose,
  onSubmissionUpdated,
}: SubmissionEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available countries from the connection
  const getAvailableCountries = () => {
    if (connection?.countries && Array.isArray(connection.countries)) {
      return connection.countries
        .filter((c: any) => c.country && c.country.trim() !== '')
        .map((c: any) => c.country);
    }
    return COUNTRIES; // Fallback to full list if no connection countries
  };

  const availableCountries = getAvailableCountries();

  // Helper function to ensure valid commission tier
  const getValidCommissionTier = (tier: string | null | undefined) => {
    if (!tier || tier.trim() === '') return "1";
    if (COMMISSION_TIERS.includes(tier)) return tier;
    return "1"; // Default to tier 1
  };

  const form = useForm<SubmissionEditFormData>({
    resolver: zodResolver(submissionEditSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      country_code: "+1",
      country: "",
      deposit_amount: 0,
      currency: "USD",
      custom_event_name: "Purchase",
      commission_amount: 0,
      commission_currency: "USD",
      commission_tier: "1",
      platform_name: availableCountries[0] || "United States",
      event_sent_to: "facebook",
    },
  });

  // Reset form when submission changes
  useEffect(() => {
    if (submission && isOpen) {
      form.reset({
        first_name: submission.first_name || "",
        last_name: submission.last_name || "",
        email: submission.email || "",
        phone: submission.phone?.toString() || "",
        country_code: submission.country_code || "+1",
        country: submission.country || "",
        deposit_amount: Number(submission.deposit_amount) || 0,
        currency: submission.currency || submission.deposit_currency || "USD",
        custom_event_name: submission.custom_event_name || "Purchase",
        commission_amount: Number(submission.commission_amount) || 0,
        commission_currency: submission.commission_currency || "USD",
        commission_tier: getValidCommissionTier(submission.commission_tier),
        platform_name: submission.platform_name || submission.country || availableCountries[0] || "United States",
        event_sent_to: submission.event_sent_to || "facebook",
      });
    }
  }, [submission, isOpen, form]);

  const handleSubmit = async (data: SubmissionEditFormData) => {
    if (!submission?.id) {
      toast({
        title: "Error",
        description: "Invalid submission ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await apiClient.updateSubmission(submission.id, {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        // country_code: data.country_code, // TODO: Add to API interface
        country: data.country,
        deposit_amount: data.deposit_amount,
        currency: data.currency,
        custom_event_name: data.custom_event_name,
        commission_amount: data.commission_amount,
        commission_currency: data.commission_currency,
        commission_tier: data.commission_tier,
        platform_name: data.platform_name,
        event_sent_to: data.event_sent_to,
      } as any);

      toast({
        title: "Success",
        description: "Submission updated successfully",
      });

      onSubmissionUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error updating submission:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update submission",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Submission
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              ID: {submission.id?.substring(0, 8)}...
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Pending
            </Badge>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormField
                            control={form.control}
                            name="country_code"
                            render={({ field: countryCodeField }) => (
                              <FormItem>
                                <FormControl>
                                  <Select
                                    value={countryCodeField.value}
                                    onValueChange={countryCodeField.onChange}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue>
                                        {countryCodeField.value && (
                                          <div className="flex items-center gap-2">
                                            <FlagIcon 
                                              code={COUNTRY_CODES.find(cc => cc.code === countryCodeField.value)?.flagCode as any} 
                                              size={16} 
                                            />
                                            <span>{countryCodeField.value}</span>
                                          </div>
                                        )}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {COUNTRY_CODES.map((countryCode) => (
                                        <SelectItem key={countryCode.code} value={countryCode.code}>
                                          <div className="flex items-center gap-2">
                                            <FlagIcon code={countryCode.flagCode as any} size={16} />
                                            <span className="font-medium">{countryCode.code}</span>
                                            <span className="text-xs text-gray-500">{countryCode.country}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} className="flex-1" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                     control={form.control}
                     name="country"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="flex items-center gap-2">
                           <Globe className="h-4 w-4" />
                           Country
                         </FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder="Select country">
                                 {field.value && (
                                   <div className="flex items-center gap-2">
                                     <FlagIcon 
                                       code={getCountryFlagCode(field.value) as any} 
                                       size={16} 
                                     />
                                     <span>{field.value}</span>
                                   </div>
                                 )}
                               </SelectValue>
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             {COUNTRIES.map((country) => (
                               <SelectItem key={country} value={country}>
                                 <div className="flex items-center gap-2">
                                   <FlagIcon code={getCountryFlagCode(country) as any} size={16} />
                                   <span>{country}</span>
                                 </div>
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deposit_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency">
                                {field.value && (
                                  <div className="flex items-center gap-2">
                                    <FlagIcon 
                                      code={CURRENCIES.find(c => c.code === field.value)?.flagCode as any} 
                                      size={16} 
                                    />
                                    <span>{CURRENCIES.find(c => c.code === field.value)?.name}</span>
                                    <span>({CURRENCIES.find(c => c.code === field.value)?.symbol})</span>
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="custom_event_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Event Name</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CUSTOM_EVENT_NAMES.map((eventName) => (
                            <SelectItem key={eventName} value={eventName}>
                              {eventName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Commission Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-purple-600">💰</span>
                  Commission Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="commission_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="commission_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency">
                                {field.value && (
                                  <div className="flex items-center gap-2">
                                    <FlagIcon 
                                      code={CURRENCIES.find(c => c.code === field.value)?.flagCode as any} 
                                      size={16} 
                                    />
                                    <span>{CURRENCIES.find(c => c.code === field.value)?.name}</span>
                                    <span>({CURRENCIES.find(c => c.code === field.value)?.symbol})</span>
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <FormField
                    control={form.control}
                    name="commission_tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Tier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMISSION_TIERS.map((tier) => (
                              <SelectItem key={tier} value={tier}>
                                {tier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                </div>
              </CardContent>
            </Card>

            {/* Platform Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-blue-600">🌐</span>
                  Platform & Country Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                     control={form.control}
                     name="platform_name"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Platform Name (Country)</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder="Select country">
                                 {field.value && (
                                   <div className="flex items-center gap-2">
                                     <FlagIcon 
                                       code={getCountryFlagCode(field.value) as any} 
                                       size={16} 
                                     />
                                     <span>{field.value}</span>
                                   </div>
                                 )}
                               </SelectValue>
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             {availableCountries.map((country) => (
                               <SelectItem key={country} value={country}>
                                 <div className="flex items-center gap-2">
                                   <FlagIcon code={getCountryFlagCode(country) as any} size={16} />
                                   <span>{country}</span>
                                 </div>
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                  <FormField
                    control={form.control}
                    name="event_sent_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Sent To</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., facebook, google, etc." 
                            {...field} 
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
