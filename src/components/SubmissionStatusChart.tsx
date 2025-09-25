import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, CheckCircle, Clock, XCircle } from 'lucide-react';

interface SubmissionStatusChartProps {
  data: any[];
  timeFilter: string;
}

const SubmissionStatusChart: React.FC<SubmissionStatusChartProps> = ({
  data,
  timeFilter
}) => {
  // Always use the actual filtered data from the dashboard
  const chartData = data;
  
  // Calculate status counts
  const statusCounts = chartData.reduce((acc, submission) => {
    acc[submission.status] = (acc[submission.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handled = statusCounts.submitted || 0;
  const pending = statusCounts.pending || 0;
  const canceled = statusCounts.canceled || 0;
  const total = handled + pending + canceled;

  // Generate chart data based on time filter
  const generateChartData = () => {
    const barChartData = [];
    const today = new Date();
    let daysToShow = 7; // default
    
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
        daysToShow = 7;
    }
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayData = chartData.filter(submission => {
        const submissionDate = new Date(submission.created_at);
        return submissionDate.toDateString() === date.toDateString();
      });

      barChartData.push({
        date: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        count: dayData.length
      });
    }
    
    return barChartData;
  };

  const barChartData = generateChartData();

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
      </CardContent>
    </Card>
  );
};

export default SubmissionStatusChart;
