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
  data: any[];
  timeFilter: string;
  currency: string;
}

const PerformanceOverTimeChart: React.FC<PerformanceOverTimeChartProps> = ({
  data,
  timeFilter,
  currency
}) => {
  // Generate performance data based on time filter
  const generatePerformanceDataFromSubmissions = () => {
    const performanceData = [];
    const today = new Date();
    let daysToShow = 30; // default
    
    // Determine number of days based on time filter
    switch (timeFilter) {
      case 'today':
        daysToShow = 1;
        break;
      case 'yesterday':
        daysToShow = 1;
        break;
      case '7d':
        daysToShow = 7;
        break;
      case '14d':
        daysToShow = 14;
        break;
      case '28d':
        daysToShow = 28;
        break;
      case 'all':
        daysToShow = 30; // Show last 30 days for "all time"
        break;
      default:
        daysToShow = 30;
    }
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayData = data.filter(submission => {
        const submissionDate = new Date(submission.created_at);
        return submissionDate.toDateString() === date.toDateString();
      });

      // Calculate metrics for the day
      const submissions = dayData.length;
      const deposits = dayData.reduce((sum, sub) => sum + (parseFloat(sub.deposit_amount) || 0), 0);
      const commissions = dayData.reduce((sum, sub) => sum + (sub.commission_amount || 0), 0);

      performanceData.push({
        date: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        submissions: submissions,
        deposits: deposits,
        commissions: commissions
      });
    }
    
    return performanceData;
  };

  // Always use the actual filtered data from the dashboard
  const performanceData = generatePerformanceDataFromSubmissions();

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
      </CardContent>
    </Card>
  );
};

export default PerformanceOverTimeChart;
