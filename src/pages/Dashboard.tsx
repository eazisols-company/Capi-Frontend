import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Users, 
  DollarSign, 
  Globe,
  Activity,
  Target,
  Zap,
  Copy,
  Banknote,
  Calendar as CalendarIcon,
  X
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { getCurrencySymbol } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState("7d");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [showCustomDateDialog, setShowCustomDateDialog] = useState(false);
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalDeposits: 0,
    conversionRate: 0,
    topCountries: [],
    recentSubmissions: [],
    totalCommissions: 0
  });
  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchConnections();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, timeFilter, connections, customDateRange]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await apiClient.getConnections();
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const copyClientId = async () => {
    if (profile?.account_id) {
      try {
        await navigator.clipboard.writeText(profile.account_id);
        toast({
          title: "Copied!",
          description: "Client ID copied to clipboard",
        });
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = profile.account_id;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast({
          title: "Copied!",
          description: "Client ID copied to clipboard",
        });
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      // For custom date ranges and unsupported periods, we'll calculate analytics from submissions data
      // For standard periods, use the analytics endpoint
      if (timeFilter === 'custom' || timeFilter === '14d') {
        // Get submissions for custom date range or unsupported periods and calculate stats manually
        const submissionsResponse = await apiClient.getSubmissions({
          start_date: getStartDateForFilter(timeFilter),
          end_date: getEndDateForFilter(timeFilter)
        });
        const allSubmissions = submissionsResponse.data.submissions || [];
        
        // Calculate stats from submissions
        const totalSubmissions = allSubmissions.length;
        const totalDeposits = allSubmissions.reduce((sum, sub) => sum + (parseFloat(sub.deposit_amount) || 0), 0);
        const depositsCount = allSubmissions.filter(sub => sub.status === 'submitted').length;
        const conversionRate = totalSubmissions > 0 ? (depositsCount / totalSubmissions) * 100 : 0;
        
        // Debug logging for conversion rate
        console.log('14d Filter Debug:', {
          totalSubmissions,
          depositsCount,
          conversionRate,
          statuses: allSubmissions.map(sub => sub.status),
          timeFilter
        });
        
        // Get top countries
        const countryStats = allSubmissions.reduce((acc: Record<string, number>, sub: any) => {
          acc[sub.country] = (acc[sub.country] || 0) + 1;
          return acc;
        }, {});
        const topCountries = Object.entries(countryStats)
          .map(([country, count]) => ({ country, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Get recent submissions (last 10)
        const recentSubmissions = allSubmissions
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        const totalCommissions = calculateTotalCommissions(allSubmissions);

        setStats({
          totalSubmissions,
          totalDeposits,
          conversionRate,
          topCountries,
          recentSubmissions,
          totalCommissions
        });
      } else {
        // Use analytics endpoint for standard periods
        const analyticsFilter = mapTimeFilterToAnalytics(timeFilter);
        const response = await apiClient.getDashboardAnalytics(analyticsFilter);
        const analytics = response.data.analytics;

        // Get all submissions for commission calculation
        const submissionsResponse = await apiClient.getSubmissions({
          start_date: getStartDateForFilter(timeFilter),
          end_date: getEndDateForFilter(timeFilter)
        });
        const allSubmissions = submissionsResponse.data.submissions || [];

        // Calculate total commissions
        const totalCommissions = calculateTotalCommissions(allSubmissions);

        setStats({
          totalSubmissions: analytics.total_submissions,
          totalDeposits: analytics.total_deposits,
          conversionRate: analytics.conversion_rate,
          topCountries: analytics.top_countries,
          recentSubmissions: analytics.recent_submissions || [],
          totalCommissions: totalCommissions
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getStartDateForFilter = (filter: string) => {
    const now = new Date();
    switch (filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '14d':
        return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      case '28d':
        return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
      case 'all':
        return new Date('2020-01-01').toISOString();
      case 'custom':
        return customDateRange.from ? customDateRange.from.toISOString() : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const getEndDateForFilter = (filter: string) => {
    if (filter === 'custom' && customDateRange.to) {
      const endDate = new Date(customDateRange.to);
      endDate.setHours(23, 59, 59, 999);
      return endDate.toISOString();
    }
    return new Date().toISOString();
  };

  const mapTimeFilterToAnalytics = (filter: string) => {
    // Map our filter values to what the analytics API expects
    // Note: 14d is not supported by analytics API, so it's handled via custom calculation
    switch (filter) {
      case 'today':
        return '1d';
      case '7d':
        return '7d';
      case '28d':
        return '30d'; // Map to closest supported value
      case 'all':
        return '90d'; // Use 90d as "all time" fallback
      default:
        return '7d';
    }
  };

  const calculateTotalCommissions = (submissions: any[]) => {
    let total = 0;
    
    submissions.forEach((submission: any) => {
      // Priority 1: Use explicit commission_amount if available
      if (submission.commission_amount && typeof submission.commission_amount === 'number') {
        total += submission.commission_amount;
        return;
      }
      
      // Priority 2: Fallback to connection country configuration
      const connection = connections.find(conn => 
        conn.id === submission.connection_id || conn._id === submission.connection_id
      );
      
      if (connection && connection.countries) {
        // Find the fee for this submission's country
        const countryConfig = connection.countries.find((c: any) => 
          c.country === submission.country
        );
        
        if (countryConfig && countryConfig.value) {
          total += parseFloat(countryConfig.value) || 0;
        }
      }
    });
    
    return total;
  };

  const handleTimeFilterChange = (value: string) => {
    if (value === 'custom' || value === 'custom-display') {
      setShowCustomDateDialog(true);
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
    // If no previous custom range was set, reset to previous filter
    if (timeFilter !== 'custom') {
      setCustomDateRange({ from: undefined, to: undefined });
    }
    setShowCustomDateDialog(false);
  };

  const getTimeFilterDisplayText = () => {
    switch (timeFilter) {
      case 'today':
        return 'Today';
      case '7d':
        return '7 Days';
      case '14d':
        return '14 Days';
      case '28d':
        return '28 Days';
      case 'all':
        return 'All Time';
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          return `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`;
        }
        return 'Custom Range';
      default:
        return '7 Days';
    }
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today':
        return 'Today';
      case '7d':
        return '7 Days';
      case '14d':
        return '14 Days';
      case '28d':
        return '28 Days';
      case 'all':
        return 'All Time';
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          return `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`;
        }
        return 'Custom';
      default:
        return '7 Days';
    }
  };

  const statCards = [
    {
      title: "Total Submissions",
      value: stats.totalSubmissions.toLocaleString(),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Lead submissions received"
    },
    {
      title: "Total Deposits",
      value: `${getCurrencySymbol(profile?.system_currency)}${stats.totalDeposits.toLocaleString()}`,
      icon: DollarSign,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      description: "Sum of all deposit amounts"
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
      description: "Successful submission rate"
    },
    {
      title: "Total Commissions",
      value: `${getCurrencySymbol(profile?.system_currency)}${stats.totalCommissions.toLocaleString()}`,
      icon: Banknote,
      color: "text-green-600",
      bgColor: "bg-primary/10",
      description: "Total commission earnings"
    },
    {
      title: "Active Countries",
      value: stats.topCountries.length.toString(),
      icon: Globe,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Countries with submissions"
    }
  ];

  return (
    <div className="space-y-6 slide-in">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back{profile ? `, ${profile.first_name}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Here's a summary of your account performance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <Badge 
                variant="outline" 
                className="text-primary border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2"
                onClick={copyClientId}
                title="Click to copy Client ID"
              >
                Account: {profile.account_id}
                <Copy className="h-3 w-3" />
              </Badge>
            )}
            <Select 
              value={timeFilter === 'custom' ? 'custom-display' : timeFilter} 
              onValueChange={handleTimeFilterChange}
              open={isTimeFilterOpen}
              onOpenChange={setIsTimeFilterOpen}
            >
              <SelectTrigger className="w-40">
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{getTimeFilterDisplayText()}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="14d">14 Days</SelectItem>
                <SelectItem value="28d">28 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <div 
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
                  onClick={handleCustomRangeClick}
                >
                  Custom Range
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Countries */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Top Performing Countries
            </CardTitle>
            <CardDescription>
              Countries with the most submissions in the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topCountries.length > 0 ? (
              <div className="space-y-4">
                {stats.topCountries.map((country: any, index) => (
                  <div key={country.country} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-foreground">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{country.count} submissions</span>
                      <div className="w-20 h-2 rounded-full bg-muted">
                        <div 
                          className="h-full rounded-full bg-primary" 
                          style={{ width: `${(country.count / stats.totalSubmissions) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No submissions data available for the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-secondary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full interactive-button bg-primary hover:bg-primary/90" size="sm" onClick={() => window.location.href = '/submissions'}>
              <Users className="h-4 w-4 mr-2" />
              View All Submissions
            </Button>
            <Button className="w-full interactive-button bg-secondary hover:bg-secondary/90" size="sm" variant="secondary" onClick={() => window.location.href = '/connections'}>
              <Activity className="h-4 w-4 mr-2" />
              Add New Connections
            </Button>
            {/* <Button className="w-full interactive-button" size="sm" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Analytics
            </Button>
            <Button className="w-full interactive-button" size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button> */}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Recent Submissions
          </CardTitle>
          <CardDescription>
            Latest lead submissions received
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentSubmissions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSubmissions.map((submission: any) => (
                <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {submission.first_name} {submission.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {submission.country} • {submission.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {getCurrencySymbol(profile?.system_currency)}{parseFloat(submission.deposit_amount).toLocaleString()}
                    </p>
                    <Badge 
                      variant={submission.status === 'submitted' ? 'default' : 
                              submission.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {submission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent submissions found</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      customDateRange.from.toLocaleDateString()
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
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
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.to ? (
                      customDateRange.to.toLocaleDateString()
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
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