import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, CheckCircle, Clock, XCircle } from 'lucide-react';

interface SubmissionStatusChartProps {
  timeSeriesData: any[];
  timeFilter: string;
  backendStats?: {
    submitted: number;
    pending: number;
    failed: number;
    total: number;
  };
  loading?: boolean;
}

const SubmissionStatusChart: React.FC<SubmissionStatusChartProps> = ({
  timeSeriesData,
  timeFilter,
  backendStats,
  loading = false
}) => {
  // Use backend aggregated counts (100% accurate from MongoDB)
  const handled = backendStats?.submitted || 0;
  const pending = backendStats?.pending || 0;
  const canceled = backendStats?.failed || 0;
  const total = backendStats?.total || 0;

  // Use backend time series data (already aggregated by MongoDB)
  // Format: [{ date: '2025-11-19', count: 95, submitted: 95, pending: 0, failed: 0 }]
  const barChartData = timeSeriesData.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
    count: item.count
  }));

  const statusCards = [
    {
      label: 'Handled',
      value: handled,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Pending',
      value: pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Canceled',
      value: canceled,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      label: 'Total',
      value: total,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Submission Status
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {timeFilter === 'today' ? 'Today' :
             timeFilter === 'yesterday' ? 'Yesterday' :
             timeFilter === '7d' ? 'Last 7 Days' :
             timeFilter === '14d' ? 'Last 14 Days' :
             timeFilter === '28d' ? 'Last 28 Days' :
             timeFilter === 'all' ? 'Last 30 Days' :
             'Selected Period'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Status Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {statusCards.map((status) => (
              <div key={status.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${status.bgColor}`}>
                  <status.icon className={`h-4 w-4 ${status.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{status.label}</p>
                  <p className="text-lg font-bold text-foreground">{status.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmissionStatusChart;
