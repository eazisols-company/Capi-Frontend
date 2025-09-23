import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export default function Dashboard() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState("7d");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined });
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
      // Always fetch all submissions and filter client-side for consistency
      const submissionsResponse = await apiClient.getSubmissions();
        const allSubmissions = submissionsResponse.data.submissions || [];
        
      // Filter submissions based on date range
      let filteredSubmissions = allSubmissions;
      if (timeFilter !== "all") {
        let dateRange = customDateRange;
        
        // If customDateRange is not set but we have a preset, get the preset's range
        if ((!customDateRange.from || !customDateRange.to) && timeFilter !== "custom") {
          dateRange = getDateRangeForPreset(timeFilter);
        }
        
        // Apply filtering if we have a valid date range
        if (dateRange.from && dateRange.to) {
          filteredSubmissions = allSubmissions.filter(submission => {
            const submissionDate = new Date(submission.created_at);
            
            // Normalize dates to start of day for accurate comparison
            const startDate = new Date(dateRange.from!);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(dateRange.to!);
            endDate.setHours(23, 59, 59, 999);
            
            const isAfterStart = submissionDate >= startDate;
            const isBeforeEnd = submissionDate <= endDate;
            
            return isAfterStart && isBeforeEnd;
          });
        }
      }
        
      // Calculate stats from filtered submissions
      const totalSubmissions = filteredSubmissions.length;
      const totalDeposits = filteredSubmissions.reduce((sum, sub) => sum + (parseFloat(sub.deposit_amount) || 0), 0);
      const depositsCount = filteredSubmissions.filter(sub => sub.status === 'submitted').length;
      const conversionRate = totalSubmissions > 0 ? (depositsCount / totalSubmissions) * 100 : 0;
      
      // Get top countries from filtered submissions
      const countryStats = filteredSubmissions.reduce((acc: Record<string, number>, sub: any) => {
          acc[sub.country] = (acc[sub.country] || 0) + 1;
          return acc;
        }, {});
        const topCountries = Object.entries(countryStats)
          .map(([country, count]) => ({ country, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

      // Get recent submissions (last 10) from filtered submissions
      const recentSubmissions = filteredSubmissions
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        const totalCommissions = calculateTotalCommissions(filteredSubmissions);

        setStats({
          totalSubmissions,
          totalDeposits,
          conversionRate,
          topCountries,
          recentSubmissions,
          totalCommissions
        });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const handleTimeFilterChange = (filterValue: string, dateRange?: DateRange) => {
    setTimeFilter(filterValue);
    if (dateRange) {
      setCustomDateRange(dateRange);
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
          <div className="flex items-center gap-6">
            {profile && (
              <Badge
                variant="outline" 
                className="text-primary border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2 whitespace-nowrap"
                onClick={copyClientId}
                title="Click to copy Client ID"
              >
                Account: {profile.account_id}
                <Copy className="h-3 w-3" />
              </Badge>
            )}
            <DateRangePicker
              value={timeFilter}
              onChange={handleTimeFilterChange}
              placeholder="Select date range"
              className="w-full max-w-64"
            />
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

    </div>
  );
}