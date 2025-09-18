import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { SubmissionDetailsModal } from "@/components/SubmissionDetailsModal";
import { SubmissionEditModal } from "@/components/SubmissionEditModal";
import { useTimezone } from "@/hooks/useTimezone";
import { formatDateForTable, formatDateForExport, getTimezoneDisplayName } from "@/lib/timezone-utils";

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
  const [timeFilter, setTimeFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [showCustomDateDialog, setShowCustomDateDialog] = useState(false);
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
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

  const getStartDateForTimeFilter = (filter: string) => {
    const now = new Date();
    switch (filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '14d':
        return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      case '28d':
        return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'custom':
        return customDateRange.from || null;
      default:
        return null; // "all" case - no time filter
    }
  };

  const getEndDateForTimeFilter = (filter: string) => {
    if (filter === 'custom' && customDateRange.to) {
      const endDate = new Date(customDateRange.to);
      endDate.setHours(23, 59, 59, 999);
      return endDate;
    }
    return null; // Use current time as end date
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
      const startDate = getStartDateForTimeFilter(timeFilter);
      const endDate = getEndDateForTimeFilter(timeFilter);
      
      if (startDate) {
        filtered = filtered.filter(submission => {
          const submissionDate = new Date(submission.created_at);
          const isAfterStart = submissionDate >= startDate;
          const isBeforeEnd = !endDate || submissionDate <= endDate;
          return isAfterStart && isBeforeEnd;
        });
      }
    }

    setFilteredSubmissions(filtered);
  };

  const handleTimeFilterChange = (value: string) => {
    if (value === 'custom' || value === 'custom-display') {
      setShowCustomDateDialog(true);
      // Don't change the timeFilter value here, let the dialog handle it
    } else {
      // When switching to a non-custom filter, clear custom date range
      if (timeFilter === 'custom') {
        setCustomDateRange({ from: undefined, to: undefined });
      }
      setTimeFilter(value);
    }
  };

  const handleCustomRangeClick = () => {
    setIsTimeFilterOpen(false); // Close the dropdown
    setShowCustomDateDialog(true);
  };

  const handleCustomDateApply = () => {
    if (customDateRange.from && customDateRange.to) {
      setTimeFilter('custom');
      setShowCustomDateDialog(false);
    }
  };

  const handleCustomDateCancel = () => {
    // If no previous custom range was set, reset to 'all'
    if (timeFilter !== 'custom') {
      setCustomDateRange({ from: undefined, to: undefined });
    }
    setShowCustomDateDialog(false);
  };

  const getTimeFilterDisplayText = () => {
    switch (timeFilter) {
      case 'all':
        return 'All Time';
      case 'today':
        return 'Today';
      case '7d':
        return 'Last 7 days';
      case '14d':
        return 'Last 14 days';
      case '28d':
        return 'Last 28 days';
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          return `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`;
        }
        return 'Custom Range';
      default:
        return 'Filter by time';
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
      'Commission Tier',
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
      submission.commission_tier || '1',
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
              className="interactive-button"
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select 
                value={timeFilter === 'custom' ? 'custom-display' : timeFilter} 
                onValueChange={handleTimeFilterChange}
                open={isTimeFilterOpen}
                onOpenChange={setIsTimeFilterOpen}
              >
                <SelectTrigger>
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{getTimeFilterDisplayText()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  {/* <SelectItem value="1d">Last 24h</SelectItem> */}
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="14d">Last 14 days</SelectItem>
                  <SelectItem value="28d">Last 28 days</SelectItem>
                  {/* <SelectItem value="30d">Last 30 days</SelectItem> */}
                  {/* <SelectItem value="90d">Last 90 days</SelectItem> */}
                  <div 
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
                    onClick={handleCustomRangeClick}
                  >
                    Custom Range
                  </div>
                </SelectContent>
              </Select>
              
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

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                  setTimeFilter("all");
                  setStatusFilter("all");
                  setCountryFilter("all");
                  setConnectionFilter("all");
                  setEventFilter("all");
                }}
                className="interactive-button"
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
                      className="hover:bg-muted/30 cursor-pointer border-border"
                      onClick={() => handleSubmissionClick(submission)}
                    >
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">#</span>
                          <span>{submission.id?.substring(0, 8)}...</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-muted"
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
                        <div className="flex items-center gap-1">
                          <span className="text-primary font-medium">+{submission.phone?.toString().replace(/^\+/, '')}</span>
                        </div>
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
                              className="h-8 w-8 p-0 hover:bg-muted text-white"
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
                              className="h-8 w-8 p-0 hover:bg-primary/10"
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
                            className="h-8 w-8 p-0 hover:bg-muted"
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

      {/* Custom Date Range Dialog */}
      <Dialog open={showCustomDateDialog} onOpenChange={setShowCustomDateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      customDateRange.from.toLocaleDateString()
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customDateRange.from}
                    onSelect={(date) =>
                      setCustomDateRange(prev => ({ ...prev, from: date }))
                    }
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customDateRange.to ? (
                      customDateRange.to.toLocaleDateString()
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customDateRange.to}
                    onSelect={(date) =>
                      setCustomDateRange(prev => ({ ...prev, to: date }))
                    }
                    disabled={(date) =>
                      date > new Date() || 
                      date < new Date("1900-01-01") ||
                      (customDateRange.from && date < customDateRange.from)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCustomDateCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCustomDateApply}
                disabled={!customDateRange.from || !customDateRange.to}
                className="flex-1"
              >
                Apply Range
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}