import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  User,
  Code,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTimezone } from "@/hooks/useTimezone";
import { formatDateDetailed } from "@/lib/timezone-utils";
import { SYSTEM_CURRENCIES } from "@/utils/constants";

interface SubmissionDetailsModalProps {
  submission: any;
  connection?: any;
  isOpen: boolean;
  onClose: () => void;
}

export function SubmissionDetailsModal({
  submission,
  connection,
  isOpen,
  onClose,
}: SubmissionDetailsModalProps) {
  const { userTimezone } = useTimezone();
  const [expandedSections, setExpandedSections] = useState({
    dataLog: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'submitted':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  const formatDateTime = (dateString: string) => {
    return formatDateDetailed(dateString, userTimezone);
  };

  // Helper functions for dynamic values
  const getPlatformName = () => {
    // Return the country from submission data (platform_name represents the connection country)
    return submission.platform_name || submission.country || 'United States';
  };

  const getEventType = () => {
    // Use custom_event_name if available, otherwise fallback to logic-based determination
    if (submission.custom_event_name) {
      return submission.custom_event_name;
    }
    // Fallback logic for backward compatibility
    if (submission.deposit_amount > 0) return 'Purchase';
    return 'Lead';
  };

  const getEnvironment = () => {
    // Get from connection data, fallback to auto-detection
    if (connection?.environment) {
      return connection.environment;
    }
    
    // Fallback to auto-detection if no connection data
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return 'Development';
    }
    if (hostname.includes('staging') || hostname.includes('test') || hostname.includes('dev')) {
      return 'Sandbox';
    }
    return 'Production';
  };

  const getCurrency = () => {
    // Get from submission data or connection settings
    // if (submission.currency) return submission.currency;
    if (submission.user_system_currency) return submission.user_system_currency;
    return 'US Dollar ($)'; // Default
  };

  const getCurrencySymbol = () => {
    // Get currency from submission data
    const userCurrency = submission.user_system_currency || '';
    
    // Try to find matching currency in SYSTEM_CURRENCIES
    // Support matching by code, name, or partial string match
    const currencyMatch = SYSTEM_CURRENCIES.find(currency => 
      userCurrency.toUpperCase().includes(currency.code) || 
      userCurrency.toLowerCase().includes(currency.name.toLowerCase())
    );
    
    // Return the symbol if found, otherwise default to dollar
    return currencyMatch?.symbol || '$';
  };

  const getDuration = () => {
    if (!submission.submitted_at || !submission.created_at) return 'Instant';
    
    const created = new Date(submission.created_at);
    const submitted = new Date(submission.submitted_at);
    const diffMs = submitted.getTime() - created.getTime();
    
    if (diffMs < 1000) return 'Instant';
    if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
    if (diffMs < 3600000) return `${Math.round(diffMs / 60000)}m ${Math.round((diffMs % 60000) / 1000)}s`;
    
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">
            Data Event Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{getEventType()} Submission</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  {getPlatformName()}
                </Badge>
                <span className={getStatusBadge(submission.status)}>
                  {getStatusIcon(submission.status)}
                  {submission.status === 'submitted' ? 'Success' : submission.status}
                </span>
              </div>
            </div>
          </div>

          {/* Submission Information - Always Open */}
          <Card>
            <div className="flex items-center gap-3 p-4 border-b">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Submission Information</h3>
                <p className="text-sm text-muted-foreground">
                  Customer and financial information related to this event
                </p>
              </div>
            </div>
            <CardContent className="pt-4">
              <div className="space-y-6">
          {/* Event ID and Timestamp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Event ID</label>
              <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-lg">
                <span className="font-mono text-sm">{submission._id || submission.id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(submission._id || submission.id)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Event Timestamp</label>
              <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatDateTime(submission.created_at)}
                </span>
              </div>
            </div>
          </div>

                {/* Customer Information */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">First Name</label>
                        <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                          <User className="h-3 w-3" />
                          <span className="text-sm">{submission.first_name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(submission.first_name)}
                            className="h-6 w-6 p-0 ml-auto"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Last Name</label>
                        <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                          <User className="h-3 w-3" />
                          <span className="text-sm">{submission.last_name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(submission.last_name)}
                            className="h-6 w-6 p-0 ml-auto"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground">Email Address</label>
                      <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                        <span className="text-sm">{submission.email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(submission.email)}
                          className="h-6 w-6 p-0 ml-auto"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Country</label>
                          <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                            <span className="text-sm">{submission.country}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Phone Number</label>
                          <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                            <span className="text-sm">{submission.phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(submission.phone)}
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {submission.ip_address && (
                        <div>
                          <label className="text-sm text-muted-foreground">IP Address</label>
                          <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                            <span className="text-sm font-mono">{submission.ip_address}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(submission.ip_address)}
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {submission.user_agent && (
                        <div>
                          <label className="text-sm text-muted-foreground">User Agent</label>
                          <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                            <span className="text-xs font-mono break-all">{submission.user_agent}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(submission.user_agent)}
                              className="h-6 w-6 p-0 ml-auto flex-shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {submission.source_url && (
                        <div>
                          <label className="text-sm text-muted-foreground">Source URL</label>
                          <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                            <span className="text-xs break-all">{submission.source_url}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(submission.source_url)}
                              className="h-6 w-6 p-0 ml-auto flex-shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <span className="text-green-600">{getCurrencySymbol()}</span>
                    Financial Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Deposit Amount</label>
                      <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                        <span className="text-sm font-medium">{getCurrencySymbol()}{submission.display_deposit_amount}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Currency</label>
                      <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                        <span className="text-sm">{getCurrency()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Details */}
                <div>
                  <h4 className="font-medium mb-4">Platform Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Platform Name (Country)</label>
                      <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                        <span className="text-sm">{getPlatformName()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Event Sent To</label>
                      <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                        <span className="text-sm">{submission.event_sent_to || 'facebook'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Log - Collapsible */}
          <Collapsible open={expandedSections.dataLog} onOpenChange={() => toggleSection('dataLog')}>
            <Card>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Data Log</h3>
                      <p className="text-sm text-muted-foreground">
                        Push attempts, event information, and platform response data
                      </p>
                    </div>
                  </div>
                  {expandedSections.dataLog ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  {/* Push Attempts Timeline */}
                  <div className="mb-6 pb-6 border-b">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Push Attempts Timeline
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      1 attempt • {submission.status === 'submitted' ? '1 successful' : '0 successful'} • {submission.status === 'failed' ? '1 failed' : '0 failed'}
                    </p>
                  <div className="space-y-4">
                    {/* Timeline Table */}
                    <div className="overflow-hidden rounded-lg border">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr className="text-left text-xs font-medium text-muted-foreground">
                            <th className="px-4 py-2">ATTEMPT</th>
                            <th className="px-4 py-2">STATUS</th>
                            <th className="px-4 py-2">TIMESTAMP</th>
                            <th className="px-4 py-2">EVENT TYPE</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="px-4 py-3 text-sm">#1</td>
                            <td className="px-4 py-3">
                              <span className={getStatusBadge(submission.status)}>
                                {getStatusIcon(submission.status)}
                                {submission.status === 'submitted' ? 'Success' : submission.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {submission.submitted_at 
                                ? formatDateTime(submission.submitted_at)
                                : formatDateTime(submission.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm">{getEventType()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Total Duration: {getDuration()}</span>
                    </div>
                  </div>
                  </div>

                  {/* Event Information */}
                  <div className="mb-6 pb-6 border-b">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      Event Information
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Technical details about the data push event
                      </p>
                  <div className="space-y-4">
                    {/* Event Properties */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Event Properties
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Platform</span>
                          <Badge variant="outline" className="block mt-1 justify-center text-blue-600 border-blue-200">

                            {/* commented out hardcoded paltform name because platform grab country and here we need to show facebook */}

                            {/* {getPlatformName()} */}
                            Facebook
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Event Type</span>
                          <Badge variant="outline" className="block mt-1 justify-center text-green-600 border-green-200">
                            {getEventType()}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Status</span>
                          <Badge variant="outline" className={`block mt-1 justify-center ${
                            submission.status === 'submitted' 
                              ? 'text-green-600 border-green-200' 
                              : submission.status === 'failed'
                              ? 'text-red-600 border-red-200'
                              : 'text-yellow-600 border-yellow-200'
                          }`}>
                            {submission.status === 'submitted' ? 'Success' : submission.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Environment</span>
                          <Badge variant="outline" className="block mt-1 justify-center">
                            {getEnvironment()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Technical Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground">Timestamp</label>
                          <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                            <Clock className="h-3 w-3" />
                            <span className="text-sm font-mono">
                              {formatDateTime(submission.created_at)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(formatDateTime(submission.created_at))}
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Trace ID</label>
                          <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded">
                            <span className="text-sm font-mono">
                              {submission.meta_response?.response?.fbtrace_id || 'N/A'}
                            </span>
                            {submission.meta_response?.response?.fbtrace_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(submission.meta_response.response.fbtrace_id)}
                                className="h-6 w-6 p-0 ml-auto"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Event Parameters */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Event Parameters
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-muted-foreground">USER DATA FIELDS</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary">Email</Badge>
                            <Badge variant="secondary">Phone Number</Badge>
                            <Badge variant="secondary">First Name</Badge>
                            <Badge variant="secondary">Last Name</Badge>
                            <Badge variant="secondary">Country</Badge>
                            <Badge variant="secondary">IP Address</Badge>
                            <Badge variant="secondary">User Agent</Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">CUSTOM DATA FIELDS</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-green-600 border-green-200">Deposit Amount</Badge>
                            <Badge variant="outline" className="text-green-600 border-green-200">Platform</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                    </div>

                  {/* Platform Response Data */}
                    <div>
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      Platform Response Data
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Raw response from advertising platform API
                      </p>
                  <div className="space-y-4">
                    {/* Response Status */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Response Status</span>
                      <Badge className={
                        submission.status === 'submitted' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }>
                        {submission.status === 'submitted' ? 'Success Response' : 'Error Response'}
                      </Badge>
                    </div>

                    {/* Response Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Response Size</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {JSON.stringify(submission.meta_response).length} bytes
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Fields Count</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {submission.meta_response?.response ? Object.keys(submission.meta_response.response).length : 0} fields
                        </p>
                      </div>
                    </div>

                    {/* Raw Response Data */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Raw Response Data</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(submission.meta_response, null, 2))}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy JSON
                        </Button>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(submission.meta_response, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Key Response Fields */}
                    <div>
                      <span className="text-sm font-medium">Key Response Fields</span>
                      <div className="space-y-2 mt-2">
                        {submission.meta_response?.response?.events_received && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">events_received:</span>
                            <span className="text-sm font-mono">{submission.meta_response.response.events_received}</span>
                          </div>
                        )}
                        {submission.meta_response?.response?.messages && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">messages:</span>
                            <span className="text-sm font-mono">
                              {Array.isArray(submission.meta_response.response.messages) 
                                ? `[${submission.meta_response.response.messages.length}]`
                                : JSON.stringify(submission.meta_response.response.messages)}
                            </span>
                          </div>
                        )}
                        {submission.meta_response?.response?.fbtrace_id && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">fbtrace_id:</span>
                            <span className="text-sm font-mono">{submission.meta_response.response.fbtrace_id}</span>
                          </div>
                        )}
                        {(submission.meta_response?.response?.error || (submission.status === 'failed' && submission.meta_response?.error)) && (
                          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <h5 className="font-medium text-red-800 dark:text-red-400 mb-2">Error Details</h5>
                            <div className="space-y-1 text-sm">
                              {submission.meta_response?.response?.error ? (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-red-600 dark:text-red-400">Message:</span>
                                    <span className="text-red-800 dark:text-red-300">{submission.meta_response.response.error.message}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-red-600 dark:text-red-400">Type:</span>
                                    <span className="text-red-800 dark:text-red-300">{submission.meta_response.response.error.type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-red-600 dark:text-red-400">Code:</span>
                                    <span className="text-red-800 dark:text-red-300">{submission.meta_response.response.error.code}</span>
                                  </div>
                                  {submission.meta_response.response.error.error_subcode && (
                                    <div className="flex justify-between">
                                      <span className="text-red-600 dark:text-red-400">Subcode:</span>
                                      <span className="text-red-800 dark:text-red-300">{submission.meta_response.response.error.error_subcode}</span>
                                    </div>
                                  )}
                                  {submission.meta_response.response.error.error_user_title && (
                                    <div className="flex justify-between">
                                      <span className="text-red-600 dark:text-red-400">User Title:</span>
                                      <span className="text-red-800 dark:text-red-300">{submission.meta_response.response.error.error_user_title}</span>
                                    </div>
                                  )}
                                  {submission.meta_response.response.error.error_user_msg && (
                                    <div className="mt-2">
                                      <span className="text-red-600 dark:text-red-400">User Message:</span>
                                      <p className="text-red-800 dark:text-red-300 mt-1 text-xs">{submission.meta_response.response.error.error_user_msg}</p>
                                    </div>
                                  )}
                                </>
                              ) : submission.meta_response?.error && (
                                <div className="mt-2">
                                  <span className="text-red-600 dark:text-red-400">Error:</span>
                                  <pre className="text-red-800 dark:text-red-300 mt-1 text-xs whitespace-pre-wrap">
                                    {typeof submission.meta_response.error === 'string' 
                                      ? submission.meta_response.error 
                                      : JSON.stringify(submission.meta_response.error, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
