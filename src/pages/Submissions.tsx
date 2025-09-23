import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSubmissionCountrySelect } from "@/components/ui/searchable-submission-country-select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Filter, 
  Calendar,
  Globe,
  Mail,
  Phone,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  Copy,
  Edit
} from "lucide-react";
import { FlagIcon } from 'react-flag-kit';
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { SubmissionDetailsModal } from "@/components/SubmissionDetailsModal";
import { SubmissionEditModal } from "@/components/SubmissionEditModal";
import { useTimezone } from "@/hooks/useTimezone";
import { formatDateForTable, formatDateForExport, getTimezoneDisplayName } from "@/lib/timezone-utils";
import { COUNTRY_CODES, getCountryCodeByPhone } from "@/utils/constants";

// Helper function to get date range for presets
const getDateRangeForPreset = (preset: string) => {
  const today = new Date();
  
  switch (preset) {
    case "today":
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      return { from: startOfToday, to: endOfToday };
    
    case "yesterday":
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return { from: startOfYesterday, to: endOfYesterday };
    
    case "7d":
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 6); // Include today, so 7 days total
      const startOfWeek = new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 0, 0, 0, 0);
      const endOfToday7d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      return { from: startOfWeek, to: endOfToday7d };
    
    case "14d":
      const lastTwoWeeks = new Date();
      lastTwoWeeks.setDate(today.getDate() - 13); // Include today, so 14 days total
      const startOfTwoWeeks = new Date(lastTwoWeeks.getFullYear(), lastTwoWeeks.getMonth(), lastTwoWeeks.getDate(), 0, 0, 0, 0);
      const endOfToday14d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      return { from: startOfTwoWeeks, to: endOfToday14d };
    
    case "28d":
      const lastMonth = new Date();
      lastMonth.setDate(today.getDate() - 27); // Include today, so 28 days total
      const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate(), 0, 0, 0, 0);
      const endOfToday28d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      return { from: startOfMonth, to: endOfToday28d };
    
    case "all":
      const allTime = new Date("2020-01-01");
      return { from: allTime, to: today };
    
    default:
      return { from: undefined, to: undefined };
  }
};

export default function Submissions() {
  const { user } = useAuth();
  const { userTimezone } = useTimezone();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [connectionFilter, setConnectionFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("7d");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [autoSubmission, setAutoSubmission] = useState(true);
  const [autoSubmissionLoading, setAutoSubmissionLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
      fetchConnections();
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, statusFilter, countryFilter, connectionFilter, eventFilter, timeFilter, customDateRange]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSubmissions();
      const submissionsData = response.data.submissions || [];
      
      // Normalize submission IDs (handle both id and _id fields)
      const normalizedSubmissions = submissionsData.map(submission => ({
        ...submission,
        id: submission.id || submission._id // Normalize ID field
      })).filter(submission => submission.id); // Filter out submissions without valid IDs
      
      setSubmissions(normalizedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
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
      
      // Filter out connections with undefined IDs and normalize ID field
      const validConnections = connectionsData
        .filter(conn => conn.id || conn._id)
        .map(conn => ({
          ...conn,
          id: conn.id || conn._id // Normalize ID field (handle both id and _id)
        }));
      
      setConnections(validConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      const profile = response.data.profile;
      
      // Set auto-submission setting from profile, default to true if not set
      setAutoSubmission(profile?.auto_submission ?? true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const updateAutoSubmission = async (enabled: boolean) => {
    try {
      setAutoSubmissionLoading(true);
      
      await apiClient.updateProfile({
        auto_submission: enabled
      });

      setAutoSubmission(enabled);
      
      toast({
        title: "Settings Updated",
        description: `Auto-submission ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating auto-submission setting:', error);
      toast({
        title: "Error",
        description: "Failed to update auto-submission setting",
        variant: "destructive"
      });
      
      // Revert the toggle if the API call failed
      setAutoSubmission(!enabled);
    } finally {
      setAutoSubmissionLoading(false);
    }
  };


  const filterSubmissions = () => {
    let filtered = submissions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.phone.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    // Country filter
    if (countryFilter !== "all") {
      filtered = filtered.filter(submission => submission.country === countryFilter);
    }

    // Connection filter
    if (connectionFilter && connectionFilter !== "all") {
      filtered = filtered.filter(submission => {
        return String(submission.connection_id) === String(connectionFilter);
      });
    }

    // Event filter
    if (eventFilter !== "all") {
      filtered = filtered.filter(submission => submission.custom_event_name === eventFilter);
    }

    // Time filter
    if (timeFilter !== "all") {
      let dateRange = customDateRange;
      
      // If customDateRange is not set but we have a preset, get the preset's range
      if ((!customDateRange.from || !customDateRange.to) && timeFilter !== "custom") {
        dateRange = getDateRangeForPreset(timeFilter);
      }
      
      // Apply filtering if we have a valid date range
      if (dateRange.from && dateRange.to) {
        filtered = filtered.filter(submission => {
          const submissionDate = new Date(submission.created_at);
          
          // Normalize dates to start of day for accurate comparison
          const startDate = new Date(dateRange.from!);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(dateRange.to!);
          endDate.setHours(23, 59, 59, 999);
          
          const submissionDateNormalized = new Date(submissionDate);
          submissionDateNormalized.setHours(0, 0, 0, 0);
          
          const isAfterStart = submissionDate >= startDate;
          const isBeforeEnd = submissionDate <= endDate;
          
          return isAfterStart && isBeforeEnd;
        });
      }
    }

    setFilteredSubmissions(filtered);
  };

  const handleTimeFilterChange = (filterValue: string, dateRange?: DateRange) => {
    setTimeFilter(filterValue);
    if (dateRange) {
      setCustomDateRange(dateRange);
    }
  };

  const handleManualSubmission = async (submissionId: string) => {
    if (!submissionId || submissionId === 'undefined') {
      toast({
        title: "Error",
        description: "Invalid submission ID. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingIds(prev => new Set(prev).add(submissionId));
      
      await apiClient.submitToMeta(submissionId);

      toast({
        title: "Success",
        description: "Submission sent to Meta successfully",
      });

      fetchSubmissions(); // Refresh data
    } catch (error) {
      console.error('Error submitting to Meta CAPI:', error);
      toast({
        title: "Error",
        description: "Failed to submit to Meta CAPI",
        variant: "destructive"
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  const handleSubmissionClick = (submission: any) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const getConnectionForSubmission = (submission: any) => {
    return connections.find(conn => String(conn.id) === String(submission.connection_id));
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleEditSubmission = (submission: any) => {
    setEditingSubmission(submission);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingSubmission(null);
  };

  const handleSubmissionUpdated = () => {
    fetchSubmissions(); // Refresh the submissions list
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "ID copied to clipboard",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied!",
        description: "ID copied to clipboard",
      });
    }
  };

  const exportToCSV = () => {
    if (filteredSubmissions.length === 0) {
      toast({
        title: "No Data",
        description: "No submissions to export",
        variant: "destructive"
      });
      return;
    }

    // Define CSV headers with better organization
    const headers = [
      'First Name',
      'Last Name',
      'Email Address',
      'Phone Number',
      'Country',
      'Deposit Amount',
      // 'Commission Tier',
      'Custom Event Name',
      'Submission Status',
      'Connection Name',
      'Connection ID',
      'Submission Date'
    ];

    // Helper function to format phone numbers properly
    const formatPhoneNumber = (phone: string | number) => {
      if (!phone) return '';
      let phoneStr = String(phone);

      // Handle scientific notation
      if (/[eE][+-]?\d+/.test(phoneStr)) {
        phoneStr = Number(phone).toLocaleString('fullwide', { useGrouping: false });
      }

      // Remove decimals
      phoneStr = phoneStr.split('.')[0];

      // Ensure international format keeps '+'
      if (phoneStr.length > 10 && !phoneStr.startsWith('+')) {
        phoneStr = '+' + phoneStr;
      }

      // Force Excel to treat it as text
      return `="${phoneStr}"`;
    };


    // Helper function to format dates nicely
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      return formatDateForExport(dateStr, userTimezone);
    };

    // Convert submissions to CSV format with better formatting
    const csvData = filteredSubmissions.map(submission => [
      submission.first_name || 'N/A',
      submission.last_name || 'N/A',
      submission.email || 'N/A',
      formatPhoneNumber(submission.phone) || 'N/A',
      submission.country || 'N/A',
      submission.deposit_amount ? `$${submission.deposit_amount}` : 'N/A',
      // submission.commission_tier || '1',
      submission.custom_event_name || 'N/A',
      submission.status ? submission.status.charAt(0).toUpperCase() + submission.status.slice(1) : 'N/A',
      submission.connection_name || getConnectionForSubmission(submission)?.name || 'N/A',
      submission.connection_id || 'N/A',
      formatDate(submission.created_at)
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => {
        // Handle numbers and strings properly for CSV
        const fieldStr = String(field);
        // If field contains comma, newline, or quotes, wrap in quotes
        if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('"')) {
          return `"${fieldStr.replace(/"/g, '""')}"`;
        }
        return fieldStr;
      }).join(','))
      .join('\n');

    // Create and download file with better filename
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `Lead_Submissions_Export_${timestamp}_${timeStr}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredSubmissions.length} submissions to ${filename}`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-secondary text-secondary-foreground';
      case 'pending':
        return 'bg-primary text-primary-foreground';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Map country codes (dial codes) to country codes for flag display
  const getCountryCodeFromDialCode = (dialCode: string): string => {
    const countryCode = getCountryCodeByPhone(dialCode);
    return countryCode?.flagCode || 'US'; // Default to US if not found
  };

  const getCountryInfo = (phone: string, country: string) => {
    // First try to match by country code if available
    if (country) {
      // Find country code by matching country abbreviation or full name
      const countryCode = COUNTRY_CODES.find(cc => 
        cc.country === country.toUpperCase() || 
        cc.country.includes(country.toUpperCase()) ||
        cc.flagCode === country.toUpperCase()
      );
      
      if (countryCode) {
        const phoneWithoutCountryCode = phone?.toString().replace(new RegExp(`^\\+?${countryCode.code.replace('+', '')}`), '') || '';
        return {
          countryCode: countryCode.flagCode,
          dialCode: countryCode.code,
          number: phoneWithoutCountryCode
        };
      }
    }

    // Fallback: try to detect from phone number
    const phoneStr = phone?.toString() || '';
    
    // Check common patterns in phone numbers
    if (phoneStr.startsWith('+61') || phoneStr.startsWith('61')) {
      return { countryCode: 'AU', dialCode: '+61', number: phoneStr.replace(/^\+?61/, '') };
    } else if (phoneStr.startsWith('+1') || phoneStr.startsWith('1')) {
      return { countryCode: 'US', dialCode: '+1', number: phoneStr.replace(/^\+?1/, '') };
    } else if (phoneStr.startsWith('+44') || phoneStr.startsWith('44')) {
      return { countryCode: 'GB', dialCode: '+44', number: phoneStr.replace(/^\+?44/, '') };
    } else if (phoneStr.startsWith('+49') || phoneStr.startsWith('49')) {
      return { countryCode: 'DE', dialCode: '+49', number: phoneStr.replace(/^\+?49/, '') };
    }

    // Default fallback
    return {
      countryCode: 'US', // Default to US for unknown countries
      dialCode: '+',
      number: phoneStr.replace(/^\+/, '')
    };
  };

  const uniqueCountries = [...new Set(submissions.map(s => s.country))];
  const uniqueEventNames = [...new Set(submissions.map(s => s.custom_event_name).filter(Boolean))];

  return (
    <div className="space-y-6 slide-in">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Lead Submissions
            </h1>
            <p className="text-muted-foreground">
              Manage and track all your opt-in submissions and their status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-submission"
                checked={autoSubmission}
                onCheckedChange={updateAutoSubmission}
                disabled={autoSubmissionLoading}
              />
              <Label htmlFor="auto-submission" className="text-sm">
                Auto-submit to Meta
                {autoSubmissionLoading && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (updating...)
                  </span>
                )}
              </Label>
            </div>
            <Button 
              className="interactive-button hover:bg-[#F97415] hover:text-white hover:border-[#F97415]"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Submissions */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                  <p className="text-3xl font-bold text-foreground">{submissions.length}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-green-500 text-sm">
                      <span className="mr-1">↗</span>
                      <span>100% of total</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">All form submissions</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Submissions */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-foreground">
                    {submissions.filter(s => s.status === 'pending').length}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-yellow-500 text-sm">
                      <span className="mr-1">↗</span>
                      <span>
                        {submissions.length > 0 
                          ? Math.round((submissions.filter(s => s.status === 'pending').length / submissions.length) * 100)
                          : 0}% of total
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">pending submissions</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Handled Submissions */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Handled</p>
                  <p className="text-3xl font-bold text-foreground">
                    {submissions.filter(s => s.status === 'submitted').length}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-green-500 text-sm">
                      <span className="mr-1">↗</span>
                      <span>
                        {submissions.length > 0 
                          ? Math.round((submissions.filter(s => s.status === 'submitted').length / submissions.length) * 100)
                          : 0}% of total
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">handled submissions</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canceled Submissions */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Canceled</p>
                  <p className="text-3xl font-bold text-foreground">
                    {submissions.filter(s => s.status === 'failed').length}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-red-500 text-sm">
                      <span className="mr-1">↗</span>
                      <span>
                        {submissions.length > 0 
                          ? Math.round((submissions.filter(s => s.status === 'failed').length / submissions.length) * 100)
                          : 0}% of total
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">canceled submissions</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

         {/* Filters */}
         <Card>
           <CardContent className="pt-6">
             <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
               <div className="relative sm:col-span-2 lg:col-span-1">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Search submissions..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10"
                 />
               </div>

               <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
                 <DateRangePicker
                   value={timeFilter}
                   onChange={handleTimeFilterChange}
                   placeholder="Select date range"
                   className="w-full"
                 />
               </div>
               
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger>
                   <SelectValue placeholder="Filter by status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Statuses</SelectItem>
                   <SelectItem value="pending">Pending</SelectItem>
                   <SelectItem value="submitted">Submitted</SelectItem>
                   <SelectItem value="failed">Failed</SelectItem>
                 </SelectContent>
               </Select>

               <SearchableSubmissionCountrySelect
                 countries={uniqueCountries}
                 value={countryFilter === "all" ? "" : countryFilter}
                 onValueChange={(value) => setCountryFilter(value || "all")}
                 placeholder="Filter by country"
                 emptyText="No countries found"
               />

               <Select 
                 value={connectionFilter || "all"} 
                 onValueChange={(value) => setConnectionFilter(value || "all")}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Filter by connection" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Connections</SelectItem>
                   {connections.filter(conn => conn.id && conn.name).map((connection, index) => (
                     <SelectItem key={`connection-${connection.id}-${index}`} value={String(connection.id)}>
                       {connection.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>

               <Select value={eventFilter} onValueChange={setEventFilter}>
                 <SelectTrigger>
                   <SelectValue placeholder="Filter by event" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Events</SelectItem>
                   {uniqueEventNames.map(eventName => (
                     <SelectItem key={eventName} value={eventName}>{eventName}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>

               <Button 
                 variant="outline" 
                 onClick={() => {
                   setSearchTerm("");
                   setTimeFilter("7d");
                   setStatusFilter("all");
                   setCountryFilter("all");
                   setConnectionFilter("all");
                   setEventFilter("all");
                 }}
                 className="interactive-button hover:bg-[#F97415] hover:text-white hover:border-[#F97415]"
               >
                 <Filter className="h-4 w-4 mr-2" />
                 Clear
               </Button>
             </div>
           </CardContent>
         </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Submissions ({filteredSubmissions.length})
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Review and manage lead submission details
            <span className="text-xs bg-muted px-2 py-1 rounded-md">
              Times shown in: {getTimezoneDisplayName(userTimezone)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading submissions...</span>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                     <TableHead className="w-[120px] font-medium">ID</TableHead>
                     <TableHead className="font-medium">NAME</TableHead>
                     <TableHead className="font-medium">EMAIL</TableHead>
                     <TableHead className="font-medium">PHONE</TableHead>
                     <TableHead className="w-[100px] font-medium">AMOUNT</TableHead>
                     <TableHead className="w-[100px] font-medium">CURRENCY</TableHead>
                     <TableHead className="w-[120px] font-medium">PLATFORM</TableHead>
                     {/* <TableHead className="w-[80px] font-medium">TIERS</TableHead> */}
                     <TableHead className="w-[100px] font-medium">STATUS</TableHead>
                     <TableHead className="w-[120px] font-medium">DATE</TableHead>
                     <TableHead className="w-[100px] font-medium">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow 
                      key={submission.id}
                      className="hover:bg-muted/30 border-border"
                    >
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">#</span>
                          <span>{submission.id?.substring(0, 8)}...</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-[#F97415] hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(submission.id);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {submission.first_name} {submission.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {submission.email}
                      </TableCell>
                       <TableCell className="text-muted-foreground">
                         {(() => {
                           // Use the new country_code field if available, otherwise fallback to old logic
                           if (submission.country_code && submission.phone) {
                             const flagCountryCode = getCountryCodeFromDialCode(submission.country_code);
                             return (
                              <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                 <FlagIcon code={flagCountryCode as any} size={20} />
                                 <span className="text-sm font-medium text-muted-foreground">{submission.country_code}</span>
                                 </div>
                                 <span className="text-sm font-medium text-foreground">
                                   {submission.phone}
                                 </span>
                               </div>
                             );
                           } else {
                             // Fallback to old logic for backward compatibility
                             const countryInfo = getCountryInfo(submission.phone, submission.country);
                             return (
                              <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                 <FlagIcon code={countryInfo.countryCode as any} size={20} />
                                 <span className="text-sm font-medium text-muted-foreground">{countryInfo.dialCode}</span>
                                 </div>
                                 <span className="text-sm font-medium text-foreground">
                                   {countryInfo.number || 'N/A'}
                                 </span>
                               </div>
                             );
                           }
                         })()}
                       </TableCell>
                      <TableCell>
                        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-sm font-medium">
                          {submission.deposit_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {submission.currency || 'USD'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          {submission.country || 'Unknown'}
                        </Badge>
                      </TableCell>
                      {/* <TableCell>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                          {submission.commission_tier || '1'}
                        </Badge>
                      </TableCell> */}
                      <TableCell>
                        <Badge 
                          className={`${getStatusColor(submission.status)} flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(submission.status)}
                          <span className="capitalize">{submission.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateForTable(submission.created_at, userTimezone)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {submission.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSubmission(submission);
                              }}
                              className="h-8 w-8 p-0 hover:bg-[#F97415] hover:text-white"
                              title="Edit submission"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {submission.status === 'pending' && !autoSubmission && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManualSubmission(submission.id);
                              }}
                              disabled={processingIds.has(submission.id)}
                              className="h-8 w-8 p-0 hover:bg-[#F97415] hover:text-white"
                            >
                              {processingIds.has(submission.id) ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmissionClick(submission);
                            }}
                            className="h-8 w-8 p-0 hover:bg-[#F97415] hover:text-white"
                            title="View submission details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || countryFilter !== "all" || connectionFilter !== "all" || eventFilter !== "all" || timeFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Submissions will appear here once leads are captured."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details Modal */}
      <SubmissionDetailsModal
        submission={selectedSubmission}
        connection={selectedSubmission ? getConnectionForSubmission(selectedSubmission) : undefined}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />

      {/* Submission Edit Modal */}
      <SubmissionEditModal
        submission={editingSubmission}
        connection={editingSubmission ? getConnectionForSubmission(editingSubmission) : undefined}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSubmissionUpdated={handleSubmissionUpdated}
      />

    </div>
  );
}