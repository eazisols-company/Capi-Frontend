import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  countryData: any[];  // Backend aggregated country breakdown
  currency: string;
  timeFilter: string;
  loading?: boolean;
}

const CountriesChart: React.FC<CountriesChartProps> = ({
  countryData,
  currency,
  timeFilter,
  loading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Use backend aggregated country data (100% accurate, all submissions counted)
  // Format: [{ country: 'Poland', total_submissions: 479, total_deposits: 70280.50, total_commissions: 113730.20 }]
  const allCountriesData: CountryData[] = countryData.map((item: any) => ({
    country: item.country,
    count: item.total_submissions,
    amount: item.total_deposits,
    commission: item.total_commissions
  }));

  // Calculate totals for percentages
  const totalSubmissions = allCountriesData.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = allCountriesData.reduce((sum, item) => sum + item.amount, 0);

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
        <div className="relative">
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
          
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading countries data...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CountriesChart;
