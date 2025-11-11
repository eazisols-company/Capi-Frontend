import { useState, useEffect, useMemo } from "react";
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
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
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
  FileSearch,
  Copy,
  Edit,
  FileText
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
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [serverFilteredSubmissions, setServerFilteredSubmissions] = useState<any[]>([]);
  const [allAvailableCountries, setAllAvailableCountries] = useState<string[]>([]);
  const [allAvailableEventNames, setAllAvailableEventNames] = useState<string[]>([]);
  const [stats, setStats] = useState<any>({ pending: 0, submitted: 0, failed: 0, total: 0, connection_breakdown: [] });
  const [isExporting, setIsExporting] = useState(false);
  const [connectionStatsLimited, setConnectionStatsLimited] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchUserProfile();
      fetchAvailableFilterOptions(); // Fetch all available countries and events
    }
  }, [user]);

  // Fetch submissions when pagination or server-side filters change
  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage, pageSize, statusFilter, countryFilter, connectionFilter, timeFilter, customDateRange]);

  // Client-side filtering for search and event name (not supported by backend)
  useEffect(() => {
    filterSubmissions();
  }, [serverFilteredSubmissions, searchTerm, eventFilter]);

  const fetchAvailableFilterOptions = async () => {
    try {
      // Fetch a sample of submissions without filters to get available countries and events
      // We only need unique values, so a small limit is fine
      const response = await apiClient.getSubmissions({ limit: 1000, offset: 0 });
      const submissionsData = response.data.submissions || [];
      
      // Extract unique countries and event names
      const countries = [...new Set(submissionsData.map((s: any) => s.country).filter(Boolean))] as string[];
      const eventNames = [...new Set(submissionsData.map((s: any) => s.custom_event_name).filter(Boolean))] as string[];
      
      setAllAvailableCountries(countries);
      setAllAvailableEventNames(eventNames);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      const offset = (currentPage - 1) * pageSize;

      const baseFilterParams: any = {};

      if (statusFilter !== "all") {
        baseFilterParams.status = statusFilter;
      }

      if (countryFilter !== "all") {
        baseFilterParams.country = countryFilter;
      }

      if (connectionFilter && connectionFilter !== "all") {
        baseFilterParams.connection_id = connectionFilter;
      }

      if (timeFilter !== "all") {
        let dateRange = customDateRange;

        if ((!customDateRange.from || !customDateRange.to) && timeFilter !== "custom") {
          dateRange = getDateRangeForPreset(timeFilter);
        }

        if (dateRange.from && dateRange.to) {
          const startDate = new Date(dateRange.from);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);

          baseFilterParams.start_date = startDate.toISOString();
          baseFilterParams.end_date = endDate.toISOString();
        }
      }

      const paginatedParams = {
        ...baseFilterParams,
        limit: pageSize,
        offset
      };

      const response = await apiClient.getSubmissions(paginatedParams);
      const submissionsData = response.data.submissions || [];
      
      // Get counts from response
      const total = response.data.total_count || 0;
      const filtered = response.data.filtered_count || 0;
      
      // Get stats from response (if backend provides them)
      const responseStats = response.data.stats || {
        pending: 0,
        submitted: 0,
        failed: 0,
        total: filtered
      };
      
      // Normalize submission IDs (handle both id and _id fields)
      const normalizedSubmissions = submissionsData.map(submission => ({
        ...submission,
        id: submission.id || submission._id // Normalize ID field
      })).filter(submission => submission.id); // Filter out submissions without valid IDs
      
      const computedConnectionBreakdownMap = normalizedSubmissions.reduce((acc, submission) => {
        const connectionId = submission.connection_id ? String(submission.connection_id) : "unknown";
        if (!acc[connectionId]) {
          acc[connectionId] = {
            connection_id: connectionId,
            total: 0,
            pending: 0,
            submitted: 0,
            failed: 0
          };
        }
        acc[connectionId].total += 1;
        switch (submission.status) {
          case "submitted":
            acc[connectionId].submitted += 1;
            break;
          case "failed":
            acc[connectionId].failed += 1;
            break;
          default:
            acc[connectionId].pending += 1;
            break;
        }
        return acc;
      }, {} as Record<string, { connection_id: string; total: number; pending: number; submitted: number; failed: number }>);

      const computedConnectionBreakdown = Object.values(
        computedConnectionBreakdownMap
      ) as Array<{ connection_id: string; total: number; pending: number; submitted: number; failed: number }>;

      const computeBreakdownTotal = (entries: any[]) =>
        entries.reduce((sum, entry) => {
          const totalValue =
            Number(entry.total ?? entry.count ?? entry.total_count ?? 0);
          return sum + (Number.isFinite(totalValue) ? totalValue : 0);
        }, 0);

      const selectResponseBreakdown = (data: any) => {
        if (Array.isArray(data?.connection_breakdown) && data.connection_breakdown.length) {
          return data.connection_breakdown;
        }
        if (Array.isArray(data?.connection_stats) && data.connection_stats.length) {
          return data.connection_stats;
        }
        return [];
      };

      let connectionBreakdown = selectResponseBreakdown(response.data);
      let breakdownSourceTotal = computeBreakdownTotal(connectionBreakdown);

      if (!connectionBreakdown.length) {
        connectionBreakdown = computedConnectionBreakdown.filter((item) => item.total > 0);
        breakdownSourceTotal = computeBreakdownTotal(connectionBreakdown);
      }

      setConnectionStatsLimited(false);

      const MAX_STATS_FETCH_LIMIT = 2000;
      let aggregateStats = responseStats;

      if (
        filtered > normalizedSubmissions.length &&
        filtered > breakdownSourceTotal &&
        filtered <= MAX_STATS_FETCH_LIMIT
      ) {
        try {
          const aggregationParams = {
            ...baseFilterParams,
            limit: Math.min(filtered, MAX_STATS_FETCH_LIMIT),
            offset: 0
          };

          const aggregateResponse = await apiClient.getSubmissions(aggregationParams);
          const aggregateSubmissions = (aggregateResponse.data.submissions || []).map(submission => ({
            ...submission,
            id: submission.id || submission._id
          })).filter(submission => submission.id);

          const aggregateBreakdownFromResponse = selectResponseBreakdown(aggregateResponse.data);
          const aggregateBreakdown = (aggregateBreakdownFromResponse.length
            ? aggregateBreakdownFromResponse
            : aggregateSubmissions.reduce((acc, submission) => {
                const connectionId = submission.connection_id ? String(submission.connection_id) : "unknown";
                if (!acc[connectionId]) {
                  acc[connectionId] = {
                    connection_id: connectionId,
                    total: 0,
                    pending: 0,
                    submitted: 0,
                    failed: 0
                  };
                }
                acc[connectionId].total += 1;
                switch (submission.status) {
                  case "submitted":
                    acc[connectionId].submitted += 1;
                    break;
                  case "failed":
                    acc[connectionId].failed += 1;
                    break;
                  default:
                    acc[connectionId].pending += 1;
                    break;
                }
                return acc;
              }, {} as Record<string, { connection_id: string; total: number; pending: number; submitted: number; failed: number }>)
          );

          const aggregateBreakdownArray = Array.isArray(aggregateBreakdown)
            ? aggregateBreakdown
            : Object.values(aggregateBreakdown);

          const aggregateTotal = computeBreakdownTotal(aggregateBreakdownArray);

          if (aggregateTotal >= filtered) {
            connectionBreakdown = aggregateBreakdownArray;
            breakdownSourceTotal = aggregateTotal;
            const aggregateStatsData = aggregateResponse.data.stats;
            if (aggregateStatsData) {
              aggregateStats = {
                ...aggregateStatsData,
                pending: aggregateStatsData.pending ?? aggregateStatsData.pending_count ?? aggregateStatsData.waiting ?? 0,
                submitted: aggregateStatsData.submitted ?? aggregateStatsData.handled ?? aggregateStatsData.success ?? 0,
                failed: aggregateStatsData.failed ?? aggregateStatsData.canceled ?? aggregateStatsData.failed_count ?? 0,
                total: aggregateStatsData.total ?? aggregateStatsData.count ?? aggregateTotal,
                connection_breakdown: connectionBreakdown
              };
            }
          } else {
            setConnectionStatsLimited(true);
          }
        } catch (aggError) {
          console.error("Error fetching aggregate submission stats:", aggError);
          setConnectionStatsLimited(true);
        }
      } else if (filtered > breakdownSourceTotal) {
        setConnectionStatsLimited(true);
      }

      const statsSource = aggregateStats ?? responseStats;
      const normalizedStats = {
        ...statsSource,
        pending:
          Number(
            statsSource.pending ??
            statsSource.pending_count ??
            statsSource.waiting ??
            responseStats.pending ??
            responseStats.pending_count ??
            responseStats.waiting ??
            0
          ) || 0,
        submitted:
          Number(
            statsSource.submitted ??
            statsSource.handled ??
            statsSource.success ??
            statsSource.submitted_count ??
            responseStats.submitted ??
            responseStats.handled ??
            responseStats.success ??
            responseStats.submitted_count ??
            0
          ) || 0,
        failed:
          Number(
            statsSource.failed ??
            statsSource.canceled ??
            statsSource.failed_count ??
            responseStats.failed ??
            responseStats.canceled ??
            responseStats.failed_count ??
            0
          ) || 0,
        total:
          Number(
            statsSource.total ??
            statsSource.count ??
            statsSource.total_count ??
            responseStats.total ??
            responseStats.count ??
            responseStats.total_count ??
            filtered
          ) || 0,
        connection_breakdown: connectionBreakdown
      };
      
      setServerFilteredSubmissions(normalizedSubmissions);
      setTotalCount(total);
      setFilteredCount(filtered);
      setStats(normalizedStats);
      
      // Set submissions for backward compatibility (stats cards, etc.)
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
    let filtered = serverFilteredSubmissions;

    // Client-side search filter (name, email, phone) - applies to current page only
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.phone?.includes(searchTerm)
      );
    }

    // Client-side event filter (not supported by backend) - applies to current page only
    if (eventFilter !== "all") {
      filtered = filtered.filter(submission => submission.custom_event_name === eventFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const handleTimeFilterChange = (filterValue: string, dateRange?: DateRange) => {
    setTimeFilter(filterValue);
    if (dateRange) {
      setCustomDateRange(dateRange);
    }
    setCurrentPage(1); // Reset to first page when date filter changes
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Calculate total pages based on filtered count
  const totalPages = Math.ceil(filteredCount / pageSize);

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

  const exportToCSV = async () => {
    if (isExporting) return; // Prevent multiple simultaneous exports

    try {
      setIsExporting(true);

      // Prepare filter parameters for export (same as current filters)
      const params: any = {
        format: 'csv' as const,
      };

      // Add server-side filters
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      
      if (countryFilter !== "all") {
        params.country = countryFilter;
      }
      
      if (connectionFilter && connectionFilter !== "all") {
        params.connection_id = connectionFilter;
      }

      // Add custom event name filter
      if (eventFilter !== "all") {
        params.custom_event_name = eventFilter;
      }

      // Add search filter
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Add date range filters
      if (timeFilter !== "all") {
        let dateRange = customDateRange;
        
        // If using a preset (not custom), convert it to actual dates
        if ((!customDateRange.from || !customDateRange.to) && timeFilter !== "custom") {
          dateRange = getDateRangeForPreset(timeFilter);
        }
        
        // Send dates to backend in ISO format
        if (dateRange.from && dateRange.to) {
          // Set start of day for 'from' date
          const startDate = new Date(dateRange.from);
          startDate.setHours(0, 0, 0, 0);
          
          // Set end of day for 'to' date
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          
          params.start_date = startDate.toISOString();
          params.end_date = endDate.toISOString();
        }
      }

      // Call the new export API
      const response = await apiClient.exportSubmissions(params);

      // Create and download the CSV file
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `Lead_Submissions_Export_${timestamp}_${timeStr}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `All matching submissions have been exported to ${filename}`,
      });
    } catch (error: any) {
      console.error('Error exporting submissions:', error);
      
      // Handle specific error cases
      let errorMessage = "Failed to export submissions";
      
      if (error.response?.status === 400) {
        // Handle export limit exceeded or invalid parameters
        errorMessage = error.response?.data?.error || "Invalid export parameters. Please try with filters to reduce the dataset.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred. Please try again later.";
      }
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
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

  // Use pre-fetched available countries and event names for filter dropdowns
  const uniqueCountries = allAvailableCountries;
  const uniqueEventNames = allAvailableEventNames;

  const brandStatusColors = {
    total: "#F97415",
    pending: "#F59E0B",
    handled: "#17B75E",
    canceled: "#EF4444"
  } as const;

  const donutChartConfig = {
    handled: {
      label: "Handled",
      color: brandStatusColors.handled
    },
    pending: {
      label: "Pending",
      color: brandStatusColors.pending
    },
    canceled: {
      label: "Canceled",
      color: brandStatusColors.canceled
    }
  } as const;

  const connectionChartConfig = {
    handled: {
      label: "Handled",
      color: brandStatusColors.handled
    },
    pending: {
      label: "Pending",
      color: brandStatusColors.pending
    },
    canceled: {
      label: "Canceled",
      color: brandStatusColors.canceled
    }
  } as const;

  const statusDescriptions: Record<string, string> = {
    total: "All submissions recorded during the selected period.",
    pending: "Awaiting processing or automatic submission.",
    handled: "Successfully delivered and marked as submitted.",
    canceled: "Failed or canceled submissions that need attention."
  };

  const totalSubmissionsForPeriod = useMemo(() => {
    const pendingCount = Number(stats.pending) || 0;
    const submittedCount = Number(stats.submitted) || 0;
    const failedCount = Number(stats.failed) || 0;
    const computedTotal = pendingCount + submittedCount + failedCount;
    if (computedTotal > 0) {
      return computedTotal;
    }

    const filteredTotal = Number(filteredCount) || 0;
    if (filteredTotal > 0) {
      return filteredTotal;
    }

    const rawTotal = Number(stats.total) || 0;
    if (rawTotal > 0) {
      return rawTotal;
    }

    return serverFilteredSubmissions.length;
  }, [filteredCount, serverFilteredSubmissions.length, stats.failed, stats.pending, stats.submitted, stats.total]);

  const circleSummary = useMemo(() => {
    const pendingCount = Number(stats.pending) || 0;
    const submittedCount = Number(stats.submitted) || 0;
    const failedCount = Number(stats.failed) || 0;

    return [
      { key: "total", label: "Total", value: totalSubmissionsForPeriod, color: brandStatusColors.total },
      { key: "pending", label: "Pending", value: pendingCount, color: brandStatusColors.pending },
      { key: "handled", label: "Handled", value: submittedCount, color: brandStatusColors.handled },
      { key: "canceled", label: "Canceled", value: failedCount, color: brandStatusColors.canceled }
    ];
  }, [stats.failed, stats.pending, stats.submitted, totalSubmissionsForPeriod]);

  const circleChartData = useMemo(
    () => circleSummary.filter((item) => item.key !== "total"),
    [circleSummary]
  );

  const statusDescriptionItems = useMemo(
    () =>
      circleSummary.map((item) => ({
        ...item,
        description: statusDescriptions[item.key] || ""
      })),
    [circleSummary]
  );

  const connectionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    connections.forEach((connection) => {
      if (connection?.id) {
        map.set(String(connection.id), connection.name || `Connection ${connection.id}`);
      }
      if (connection?._id) {
        map.set(String(connection._id), connection.name || `Connection ${connection._id}`);
      }
    });
    return map;
  }, [connections]);

  const connectionPerformanceData = useMemo(() => {
    const normalizeEntry = (entry: any) => {
      if (!entry) {
        return null;
      }
      const connectionId = entry.connection_id ?? entry.id ?? entry.connectionId ?? entry._id ?? "unknown";
      const pendingCount = Number(entry.pending ?? entry.pending_count ?? entry.waiting ?? 0);
      const handledCount = Number(entry.submitted ?? entry.handled ?? entry.success ?? entry.submitted_count ?? 0);
      const canceledCount = Number(entry.failed ?? entry.canceled ?? entry.failed_count ?? 0);
      const totalCount = Number(entry.total ?? entry.count ?? entry.total_count ?? pendingCount + handledCount + canceledCount);

      if (totalCount <= 0) {
        return null;
      }

      const name =
        entry.name ??
        entry.connection_name ??
        connectionNameMap.get(String(connectionId)) ??
        "Unknown";

      return {
        connectionId: String(connectionId),
        name,
        total: totalCount,
        pending: pendingCount,
        handled: handledCount,
        canceled: canceledCount,
        avg: totalCount > 0 ? (handledCount / totalCount) * 100 : 0
      };
    };

    const breakdown = Array.isArray(stats.connection_breakdown) ? stats.connection_breakdown : [];
    const normalizedFromStats = breakdown
      .map((entry) => normalizeEntry(entry))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (normalizedFromStats.length) {
      return normalizedFromStats.sort((a, b) => b.total - a.total);
    }

    const fallbackMap = new Map<
      string,
      {
        connectionId: string;
        name: string;
        total: number;
        pending: number;
        handled: number;
        canceled: number;
        avg: number;
      }
    >();

    (serverFilteredSubmissions || []).forEach((submission) => {
      const connectionId = submission.connection_id ? String(submission.connection_id) : "unknown";
      if (!fallbackMap.has(connectionId)) {
        const name =
          connectionNameMap.get(connectionId) ??
          submission.connection_name ??
          "Unknown";
        fallbackMap.set(connectionId, {
          connectionId,
          name,
          total: 0,
          pending: 0,
          handled: 0,
          canceled: 0,
          avg: 0
        });
      }

      const record = fallbackMap.get(connectionId)!;
      record.total += 1;

      switch (submission.status) {
        case "submitted":
          record.handled += 1;
          break;
        case "failed":
          record.canceled += 1;
          break;
        default:
          record.pending += 1;
          break;
      }

      record.avg = record.total > 0 ? (record.handled / record.total) * 100 : 0;
    });

    return Array.from(fallbackMap.values())
      .filter((entry) => entry.total > 0)
      .map((entry) => ({
        ...entry,
        avg: entry.total > 0 ? (entry.handled / entry.total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [connectionNameMap, serverFilteredSubmissions, stats.connection_breakdown]);

  const connectionChartWidth = useMemo(() => {
    const baseWidth = 720;
    const perConnectionWidth = 120;
    return Math.max(connectionPerformanceData.length * perConnectionWidth, baseWidth);
  }, [connectionPerformanceData.length]);

  const CircleTooltip = ({ active }: { active?: boolean }) => {
    if (!active) {
      return null;
    }

    return (
      <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-lg">
        <div className="space-y-1">
          {circleSummary.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
              <span className="font-medium text-foreground">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ConnectionTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) {
      return null;
    }

    const totalForConnection = payload.reduce(
      (sum: number, entry: any) => sum + (Number(entry.value) || 0),
      0
    );
    const meta = payload[0]?.payload;
    const successRate = meta?.avg ?? 0;

    return (
      <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-lg">
        <div className="mb-1 font-medium text-foreground max-w-[240px]">{label}</div>
        <div className="text-[11px] text-muted-foreground mb-2">
          Success rate: {successRate.toFixed(1)}%
        </div>
        <div className="space-y-1">
          {payload.map((entry: any) => {
            const key = entry.dataKey as keyof typeof connectionChartConfig;
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-muted-foreground">
                    {connectionChartConfig[key]?.label ?? entry.name}
                  </span>
                </div>
                <span className="font-medium text-foreground">
                  {Number(entry.value || 0).toLocaleString()}
                </span>
              </div>
            );
          })}
          <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-1">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold text-foreground">
              {totalForConnection.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderConnectionAxisTick = ({ x, y, payload }: any) => {
    const rawLabel: string = payload?.value ?? "";
    const words = rawLabel.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const trial = currentLine ? `${currentLine} ${word}` : word;
      if (trial.length > 14) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = trial;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return (
      <g transform={`translate(${x},${y + 8})`}>
        {lines.map((line, index) => {
          const isLast = index === lines.length - 1;
          return (
            <text
              key={index}
              x={0}
              y={index * 12}
              fill="#FFFFFF"
              fontSize={11}
              fontWeight={isLast ? 600 : 500}
              textAnchor="middle"
            >
              {line}
            </text>
          );
        })}
      </g>
    );
  };

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
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
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
                  setCustomDateRange({ from: undefined, to: undefined });
                  setStatusFilter("all");
                  setCountryFilter("all");
                  setConnectionFilter("all");
                  setEventFilter("all");
                  setCurrentPage(1); // Reset to first page
                }}
                className="interactive-button hover:bg-[#F97415] hover:text-white hover:border-[#F97415]"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="h-full overflow-hidden lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Submission Overview</CardTitle>
              <CardDescription>Distribution of statuses for the selected period</CardDescription>
            </CardHeader>
            <CardContent className="flex h-full flex-col min-h-[360px]">
              {totalSubmissionsForPeriod > 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="relative w-full max-w-[340px] mb-16">
                    <ChartContainer config={donutChartConfig} className="aspect-square w-full mx-auto">
                      <PieChart>
                        <Pie
                          data={circleChartData}
                          dataKey="value"
                          nameKey="key"
                          innerRadius={90}
                          outerRadius={150}
                          stroke="#1F2937"
                          strokeWidth={1}
                          paddingAngle={2}
                        >
                          {circleChartData.map((entry) => (
                            <Cell key={entry.key} fill={`var(--color-${entry.key})`} stroke="transparent" />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          cursor={{ fill: "transparent" }} 
                          content={<CircleTooltip />}
                          wrapperStyle={{ zIndex: 1000 }}
                        />
                      </PieChart>
                </ChartContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Total</span>
                      <span className="text-3xl font-bold text-foreground">
                        {totalSubmissionsForPeriod.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">Selected period</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border/60 text-sm text-muted-foreground">
                  No submissions available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full overflow-hidden lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Connection Performance</CardTitle>
              <CardDescription>Submission volume by connection</CardDescription>
            </CardHeader>
            <CardContent className="flex h-full flex-col min-h-[360px]">
              {connectionPerformanceData.length ? (
                <div className="flex-1 space-y-3">
                  <div className="overflow-x-auto transparent-scrollbar">
                    <ChartContainer
                      config={connectionChartConfig}
                      className="h-[400px] w-full aspect-auto [&_.recharts-cartesian-axis-tick_text]:fill-white min-w-[720px]"
                      style={{ minWidth: connectionChartWidth }}
                    >
                      <BarChart
                        data={connectionPerformanceData}
                        margin={{ top: 22, right: 24, bottom: 32, left: 12 }}
                        barCategoryGap="28%"
                        barGap={6}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
                        <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        height={58}
                        interval={0}
                        tick={renderConnectionAxisTick}
                      />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#E2E8F0" }}
                        />
                        <ChartTooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} content={<ConnectionTooltip />} />
                        <Bar dataKey="handled" fill="var(--color-handled)" radius={[6, 6, 0, 0]}>
                          <LabelList
                            dataKey="handled"
                            position="top"
                            fill="#F8FAFC"
                            fontSize={11}
                            formatter={(value: number) => value?.toLocaleString?.() ?? value}
                          />
                        </Bar>
                        <Bar dataKey="pending" fill="var(--color-pending)" radius={[6, 6, 0, 0]}>
                          <LabelList
                            dataKey="pending"
                            position="top"
                            fill="#F8FAFC"
                            fontSize={11}
                            formatter={(value: number) => value?.toLocaleString?.() ?? value}
                          />
                        </Bar>
                        <Bar dataKey="canceled" fill="var(--color-canceled)" radius={[6, 6, 0, 0]}>
                          <LabelList
                            dataKey="canceled"
                            position="top"
                            fill="#F8FAFC"
                            fontSize={11}
                            formatter={(value: number) => value?.toLocaleString?.() ?? value}
                          />
                        </Bar>
                    </BarChart>
                    </ChartContainer>
                  </div>
                  {connectionStatsLimited && (
                    <p className="text-xs text-muted-foreground">
                      Showing a partial view of connection performance. Narrow your filters to see full totals.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border/60 text-sm text-muted-foreground">
                  Not enough data to compare connections
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {/* Submissions ({filteredSubmissions.length}) */}
            Submissions
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
                     <TableHead className="font-medium">NAME</TableHead>
                     <TableHead className="font-medium">EMAIL</TableHead>
                     <TableHead className="font-medium">PHONE</TableHead>
                     <TableHead className="font-medium">AMOUNT</TableHead>
                     <TableHead className="font-medium">CURRENCY</TableHead>
                     <TableHead className="font-medium">COUNTRY</TableHead>
                     {/* <TableHead className="w-[80px] font-medium">TIERS</TableHead> */}
                     <TableHead className="font-medium">STATUS</TableHead>
                     <TableHead className="font-medium">DATE</TableHead>
                     <TableHead className="font-medium">DATA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow 
                      key={submission.id}
                      className="hover:bg-muted/30 border-border"
                    >
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
                          {submission.display_deposit_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {submission.user_system_currency || 'USD'}
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
                            <FileSearch className="h-4 w-4" />
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
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || countryFilter !== "all" || connectionFilter !== "all" || eventFilter !== "all" || timeFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Submissions will appear here once leads are captured."
                }
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && filteredCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, filteredCount)}</span> of{' '}
                  <span className="font-medium">{filteredCount.toLocaleString()}</span> results
                </p>
                
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</Label>
                  <Select 
                    value={pageSize.toString()} 
                    onValueChange={(value) => handlePageSizeChange(Number(value))}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
        handleManualSubmission={handleManualSubmission}
        processingIds={processingIds}
      />

    </div>
  );
}