import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { FlagIcon } from 'react-flag-kit';
import { getCountryFlagCode } from '@/utils/constants';

interface CountryData {
  country: string;
  count: number;
  amount: number;
  commission: number;
}

interface CountriesChartProps {
  data: any[];
  currency: string;
  timeFilter: string;
}

const CountriesChart: React.FC<CountriesChartProps> = ({
  data,
  currency,
  timeFilter
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  // Always use the actual filtered data from the dashboard
  const chartData = data;
  
  // Calculate country statistics
  const countryStats = chartData.reduce((acc, submission) => {
    const country = submission.country;
    if (!acc[country]) {
      acc[country] = {
        count: 0,
        amount: 0,
        commission: 0,
        submissions: []
      };
    }
    acc[country].count += 1;
    acc[country].amount += parseFloat(submission.deposit_amount) || 0;
    
    // Calculate commission for this submission
    let commission = 0;
    if (submission.commission_amount && typeof submission.commission_amount === 'number') {
      commission = submission.commission_amount;
    }
    acc[country].commission += commission;
    
    acc[country].submissions.push(submission);
    return acc;
  }, {} as Record<string, { count: number; amount: number; commission: number; submissions: any[] }>);

  // Convert to array and calculate percentages
  const totalSubmissions = chartData.length;
  const totalAmount = chartData.reduce((sum, sub) => sum + (parseFloat(sub.deposit_amount) || 0), 0);

  const allCountriesData: CountryData[] = Object.entries(countryStats)
    .map(([country, stats]) => ({
      country,
      count: (stats as { count: number; amount: number; commission: number; submissions: any[] }).count,
      amount: (stats as { count: number; amount: number; commission: number; submissions: any[] }).amount,
      commission: (stats as { count: number; amount: number; commission: number; submissions: any[] }).commission
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending (top performing first)

  // Calculate pagination
  const totalPages = Math.ceil(allCountriesData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const countriesData = allCountriesData.slice(startIndex, endIndex);


  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Countries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Column Headers */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Country</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
              Submissions
            </span>
            <span className="text-sm font-medium text-muted-foreground min-w-[5rem] text-right">
              Deposits
            </span>
            <span className="text-sm font-medium text-muted-foreground min-w-[5rem] text-right">
              Commissions
            </span>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {countriesData.length > 0 ? (
            countriesData.map((country, index) => (
              <div key={country.country} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FlagIcon code={getCountryFlagCode(country.country) as any} size={16} />
                  <span className="font-medium text-foreground">{country.country}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground min-w-[3rem] text-right">
                    {formatNumber(country.count)}
                  </span>
                  <span className="text-muted-foreground min-w-[5rem] text-right">
                    {formatCurrency(country.amount)}
                  </span>
                  <span className="text-muted-foreground min-w-[5rem] text-right">
                    {formatCurrency(country.commission)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No country data available</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, allCountriesData.length)} of {allCountriesData.length} countries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CountriesChart;
