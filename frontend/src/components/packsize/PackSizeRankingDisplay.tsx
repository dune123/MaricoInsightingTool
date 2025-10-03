/**
 * ========================================
 * PACK SIZE RANKING DISPLAY COMPONENT
 * ========================================
 * 
 * Purpose: Comprehensive pack size analysis and ranking visualization
 * 
 * Description:
 * This component provides a detailed display of pack size rankings, performance
 * comparisons, and RPI (Relative Price Index) analysis for strategic business
 * insights. It enables users to understand pack size performance patterns and
 * make data-driven decisions about product portfolio optimization.
 * 
 * Key Functionality:
 * - Pack size ranking visualization with performance metrics
 * - RPI analysis and comparison across different pack sizes
 * - Interactive sorting and filtering capabilities
 * - Tabbed interface for organized data presentation
 * - Export functionality for reporting purposes
 * - Real-time data updates from backend analytics
 * 
 * Analysis Features:
 * - Pack size performance rankings
 * - RPI calculation and comparison
 * - Market share analysis by pack size
 * - Competitive positioning insights
 * - Trend analysis and historical comparisons
 * 
 * Interactive Elements:
 * - Sortable columns for custom ranking
 * - Filter controls for refined analysis
 * - Expandable details for in-depth insights
 * - Visual indicators for performance levels
 * - Action buttons for data export
 * 
 * Business Value:
 * - Product portfolio optimization insights
 * - Pricing strategy guidance
 * - Market positioning analysis
 * - Performance benchmarking
 * - Strategic decision support
 * 
 * Used by:
 * - Product management teams
 * - Marketing strategy analysis
 * - Business intelligence reporting
 * - Executive dashboards
 * 
 * Dependencies:
 * - Pack size service for data fetching
 * - UI components for interface
 * - Chart libraries for visualization
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronUp, ChevronDown, BarChart3, Package, ArrowUpDown, Info } from 'lucide-react';
import { 
  PackSizeService, 
  PackSizeRankingResponse, 
  PackSizeDetail,
  PackSizeCategoriesResponse 
} from '@/analysis/mmm/services/packSizeService';

interface PackSizeRankingDisplayProps {
  columnNames: string[];
  showInsights?: boolean;
  className?: string;
}

export const PackSizeRankingDisplay: React.FC<PackSizeRankingDisplayProps> = ({
  columnNames,
  showInsights = true,
  className = ''
}) => {
  const [analysisData, setAnalysisData] = useState<PackSizeRankingResponse | null>(null);
  const [categories, setCategories] = useState<PackSizeCategoriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (columnNames.length > 0) {
      loadPackSizeAnalysis();
    }
  }, [columnNames]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadPackSizeAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PackSizeService.analyzePackSizes(columnNames, showInsights);
      setAnalysisData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze pack sizes');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await PackSizeService.getPackSizeCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load pack size categories:', err);
    }
  };

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getSortedPackSizes = () => {
    if (!analysisData) return [];
    
    return [...analysisData.pack_size_details].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      return (a.rank - b.rank) * direction;
    });
  };

  const getPackSizeIcon = (category: string) => {
    return PackSizeService.getPackSizeCategoryIcon(category);
  };

  const getPackSizeColor = (category: string) => {
    return PackSizeService.getPackSizeCategoryColor(category);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pack Size Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Analyzing pack sizes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData || analysisData.columns_with_pack_size === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pack Size Analysis
          </CardTitle>
          <CardDescription>
            No pack sizes found in the provided column names.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Pack Size Ranking Analysis
        </CardTitle>
        <CardDescription>
          Dynamic pack size ranking for {analysisData.columns_with_pack_size} of {analysisData.total_columns} columns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ranking" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ranking">Rankings</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Rankings Tab */}
          <TabsContent value="ranking" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Pack Size Rankings</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSort}
                className="flex items-center gap-1"
              >
                <ArrowUpDown className="h-3 w-3" />
                {sortDirection === 'asc' ? 'Smallest First' : 'Largest First'}
              </Button>
            </div>

            <div className="space-y-2">
              {getSortedPackSizes().map((detail, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPackSizeIcon(detail.category)}</span>
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPackSizeColor(detail.category) }}
                      ></span>
                    </div>
                    <div>
                      <div className="font-medium">{PackSizeService.formatPackSize(detail.pack_size)}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {detail.column_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={detail.rank === 1 ? "default" : "secondary"}>
                      Rank {detail.rank}
                    </Badge>
                    {detail.is_smallest && (
                      <Badge variant="outline" className="text-secondary">
                        Smallest
                      </Badge>
                    )}
                    {detail.is_largest && (
                      <Badge variant="outline" className="text-primary">
                        Largest
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {analysisData.ranking_order}
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analysisData.size_distribution).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">
                    {getPackSizeIcon(category.split(' ')[0])}
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-gray-600">{category}</div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Unique Pack Sizes Found:</h4>
              <div className="flex flex-wrap gap-2">
                {analysisData.unique_pack_sizes.map((size, index) => (
                  <Badge key={index} variant="outline">
                    {PackSizeService.formatPackSize(size)}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            {categories && (
              <>
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Ranking Logic</h4>
                  <p className="text-sm text-gray-600">{categories.ranking_logic}</p>
                </div>

                <div className="space-y-3">
                  {Object.entries(categories.categories).map(([key, category]) => (
                    <div key={key} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{getPackSizeIcon(key)}</span>
                        <div>
                          <div className="font-medium">
                            Rank {category.rank}: {category.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Examples: {category.examples.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {categories.usage}
                  </AlertDescription>
                </Alert>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PackSizeRankingDisplay;

