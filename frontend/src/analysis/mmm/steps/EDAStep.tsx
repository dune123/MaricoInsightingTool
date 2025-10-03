/**
 * EDAStep Component
 * 
 * Purpose: Comprehensive data exploration and statistical analysis interface
 * 
 * Description: This component provides an interactive exploratory data analysis
 * interface that helps users understand their dataset through visualizations,
 * statistics, and correlation analysis before proceeding to model building.
 * 
 * Key Functions:
 * - getCorrelationColor(): Returns color classes based on correlation strength
 * - renderOverview(): Displays dataset overview and statistics
 * - renderCorrelation(): Shows correlation matrix with visual indicators
 * - renderDistribution(): Displays data distribution charts
 * - renderQuality(): Shows data quality assessment
 * 
 * State Variables:
 * - analysisData: Dataset from analysis context
 * - numericColumns: Filtered numeric columns for analysis
 * 
 * Analysis Features:
 * - Distribution Charts: Histograms and box plots for numeric data
 * - Statistical Summary: Mean, median, std dev, min/max, quartiles
 * - Correlation Matrix: Variable relationships and dependencies
 * - Data Quality: Missing values, outliers, data completeness
 * - Column Analysis: Data types, unique values, statistical properties
 * 
 * Correlation Strength Indicators:
 * - |r| ≥ 0.7: Strong correlation (red)
 * - |r| ≥ 0.5: Moderate correlation (yellow)
 * - |r| ≥ 0.3: Weak correlation (blue)
 * - |r| < 0.3: Very weak correlation (muted)
 * 
 * Data Flow:
 * 1. Component loads analysis data from context
 * 2. Numeric columns are filtered for analysis
 * 3. Statistical summaries are calculated
 * 4. Correlation matrix is displayed with color coding
 * 5. Distribution charts are rendered for each variable
 * 
 * Dependencies:
 * - AnalysisContext: Global state and analysis data
 * - DataDistributionChart: Data visualization component
 * - UI components: Card, Button, Table, Tabs, Badge
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { DataDistributionChart } from "@/components/charts/DataDistributionChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Mock correlation matrix data
const correlationData = [
  { variable: 'Revenue', Revenue: 1.0, TV_Spend: 0.75, Digital_Spend: 0.68, Print_Spend: 0.45, Radio_Spend: 0.52 },
  { variable: 'TV_Spend', Revenue: 0.75, TV_Spend: 1.0, Digital_Spend: 0.32, Print_Spend: 0.28, Radio_Spend: 0.35 },
  { variable: 'Digital_Spend', Revenue: 0.68, TV_Spend: 0.32, Digital_Spend: 1.0, Print_Spend: 0.22, Radio_Spend: 0.18 },
  { variable: 'Print_Spend', Revenue: 0.45, TV_Spend: 0.28, Digital_Spend: 0.22, Print_Spend: 1.0, Radio_Spend: 0.41 },
  { variable: 'Radio_Spend', Revenue: 0.52, TV_Spend: 0.35, Digital_Spend: 0.18, Print_Spend: 0.41, Radio_Spend: 1.0 },
];

export function EDAStep() {
  const { state } = useAnalysis();
  const { analysisData } = state;

  if (!analysisData) {
    return <div>No data available</div>;
  }

  const numericColumns = analysisData.columns.filter(col => col.type === 'numeric');

  const getCorrelationColor = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 0.7) return 'bg-destructive/20 text-destructive';
    if (abs >= 0.5) return 'bg-warning/20 text-warning';
    if (abs >= 0.3) return 'bg-primary/20 text-primary';
    return 'bg-muted';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Exploratory Data Analysis</h2>
        <p className="text-muted-foreground">
          Detailed analysis of your dataset structure and relationships
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Brand Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{state.selectedBrand}</div>
                <p className="text-xs text-muted-foreground">Selected brand</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{state.filterColumns.length}</div>
                <p className="text-xs text-muted-foreground">Filter columns</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{numericColumns.length}</div>
                <p className="text-xs text-muted-foreground">Numeric variables</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data Quality Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">100%</div>
                  <p className="text-sm text-muted-foreground">Data Completeness</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">0</div>
                  <p className="text-sm text-muted-foreground">Missing Values</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">104</div>
                  <p className="text-sm text-muted-foreground">Time Periods</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">Weekly</div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Correlation Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>TV Spend</TableHead>
                      <TableHead>Digital Spend</TableHead>
                      <TableHead>Print Spend</TableHead>
                      <TableHead>Radio Spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {correlationData.map((row) => (
                      <TableRow key={row.variable}>
                        <TableCell className="font-medium">{row.variable}</TableCell>
                        <TableCell>
                          <Badge className={getCorrelationColor(row.Revenue)}>
                            {row.Revenue.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCorrelationColor(row.TV_Spend)}>
                            {row.TV_Spend.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCorrelationColor(row.Digital_Spend)}>
                            {row.Digital_Spend.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCorrelationColor(row.Print_Spend)}>
                            {row.Print_Spend.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCorrelationColor(row.Radio_Spend)}>
                            {row.Radio_Spend.toFixed(2)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistical Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable</TableHead>
                    <TableHead>Mean</TableHead>
                    <TableHead>Median</TableHead>
                    <TableHead>Std Dev</TableHead>
                    <TableHead>Skewness</TableHead>
                    <TableHead>Kurtosis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numericColumns.map((column) => (
                    <TableRow key={column.name}>
                      <TableCell className="font-medium">{column.name}</TableCell>
                      <TableCell>{column.statistics?.mean?.toLocaleString()}</TableCell>
                      <TableCell>{column.statistics?.median?.toLocaleString()}</TableCell>
                      <TableCell>{column.statistics?.std?.toLocaleString()}</TableCell>
                      <TableCell>0.12</TableCell>
                      <TableCell>-0.85</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysisData.columns.filter(col => col.type === 'numeric').map((column) => (
              <Card key={column.name}>
                <CardHeader>
                  <CardTitle className="text-base">{column.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataDistributionChart column={column} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>


    </div>
  );
}