import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Globe, 
  Calendar,
  BarChart3,
  Activity,
  Target,
  Zap
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState("7d");
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalDeposits: 0,
    conversionRate: 0,
    topCountries: [],
    recentSubmissions: []
  });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchProfile();
    }
  }, [user, timeFilter]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Use analytics endpoint for dashboard data
      const response = await apiClient.getDashboardAnalytics(timeFilter);
      const analytics = response.data.analytics;

      setStats({
        totalSubmissions: analytics.total_submissions,
        totalDeposits: analytics.total_deposits,
        conversionRate: analytics.conversion_rate,
        topCountries: analytics.top_countries,
        recentSubmissions: analytics.recent_submissions || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      value: `${profile?.system_currency || 'EUR'} ${stats.totalDeposits.toLocaleString()}`,
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
              Here's your Meta CAPI tracking overview
            </p>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <Badge variant="outline" className="text-primary border-primary/20">
                Account: {profile.account_id}
              </Badge>
            )}
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              View All Connections
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
                      {profile?.system_currency || 'EUR'} {parseFloat(submission.deposit_amount).toLocaleString()}
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