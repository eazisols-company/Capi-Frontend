import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { Activity } from 'lucide-react';

interface PerformanceOverTimeChartProps {
  timeSeriesData: any[];  // Backend aggregated time series
  timeFilter: string;
  currency: string;
  loading?: boolean;
}

const PerformanceOverTimeChart: React.FC<PerformanceOverTimeChartProps> = ({
  timeSeriesData,
  timeFilter,
  currency,
  loading = false
}) => {
  // Use backend aggregated time series data (100% accurate, all submissions counted)
  // Format: [{ date: '2025-11-19', count: 95, submitted: 95, pending: 0, failed: 0, total_deposits: 1234.56, total_commissions: 567.89 }]
  const performanceData = timeSeriesData.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
    submissions: item.submitted || item.count,  // Number of submissions per day
    deposits: item.total_deposits || 0,  // Backend aggregates daily deposit totals
    commissions: item.total_commissions || 0  // Backend aggregates daily commission totals
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'submissions' 
                ? `Submissions: ${entry.value}`
                : entry.dataKey === 'deposits' 
                ? `Deposits: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(entry.value)}`
                : entry.dataKey === 'commissions'
                ? `Commissions: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(entry.value)}`
                : `${entry.dataKey}: ${entry.value.toFixed(2)}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Performance Over Time
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {timeFilter === 'today' ? 'Today' :
             timeFilter === 'yesterday' ? 'Yesterday' :
             timeFilter === '7d' ? 'Last 7 Days' :
             timeFilter === '14d' ? 'Last 14 Days' :
             timeFilter === '28d' ? 'Last 28 Days' :
             'Last 30 Days'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis 
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Area chart for submissions */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="submissions"
                fill="#3b82f6"
                fillOpacity={0.3}
                stroke="#3b82f6"
                strokeWidth={2}
              />
              
              {/* Line for deposits */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="deposits"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
              />
              
              {/* Line for commissions */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="commissions"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-30"></div>
              <span className="text-sm text-muted-foreground">Submissions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-muted-foreground">Deposits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-muted-foreground">Commissions</span>
            </div>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading performance data...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceOverTimeChart;
