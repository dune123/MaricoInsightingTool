/**
 * ExpectedSignsStep Component
 * 
 * Purpose: Variable relationship expectation setting for enhanced model building
 * 
 * Description: This component allows users to specify expected relationships (positive,
 * negative, or neutral) between independent variables and the target variable. This
 * prior knowledge helps guide model building and improves interpretation of results
 * in media mix modeling and attribution analysis.
 * 
 * Key Functions:
 * - handleSignChange(): Updates expected sign for a variable
 * - getSignIcon(): Returns appropriate icon for sign type
 * - getSignColor(): Returns CSS classes for sign styling
 * - renderVariableRow(): Renders individual variable row with sign selection
 * 
 * State Variables:
 * - variableSigns: Record of variable names to expected signs
 * 
 * Expected Sign Types:
 * - Positive: Variable increase leads to target increase (e.g., ad spend → sales)
 * - Negative: Variable increase leads to target decrease (e.g., price → demand)
 * - Neutral: No expected directional relationship
 * 
 * Data Flow:
 * 1. Component loads numeric columns from analysis data
 * 2. User selects expected sign for each variable
 * 3. Signs are stored in local state
 * 4. Visual indicators show relationship direction
 * 5. Data is passed to next step for model building
 * 
 * Dependencies:
 * - AnalysisContext: Global state and analysis data
 * - UI components: Card, Button, Select, Table, Badge
 * - Lucide React icons: TrendingUp, TrendingDown, Minus
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAnalysis } from "@/context/AnalysisContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type ExpectedSign = 'positive' | 'negative' | 'neutral';

export function ExpectedSignsStep() {
  const { state } = useAnalysis();
  const { analysisData } = state;

  const [variableSigns, setVariableSigns] = useState<Record<string, ExpectedSign>>({});

  if (!analysisData) return <div>No data available</div>;

  const numericColumns = analysisData.columns
    .filter(col => col.type === 'numeric' && col.name !== 'Revenue')
    .map(col => col.name);

  const handleSignChange = (variable: string, sign: ExpectedSign) => {
    setVariableSigns(prev => ({ ...prev, [variable]: sign }));
  };

  const getSignIcon = (sign: ExpectedSign) => {
    switch (sign) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'neutral':
        return <Minus className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getSignColor = (sign: ExpectedSign) => {
    switch (sign) {
      case 'positive':
        return 'bg-success/10 text-success border-success/20';
      case 'negative':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'neutral':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted';
    }
  };

  const recommendedSigns: Record<string, ExpectedSign> = {
    'TV_Spend': 'positive',
    'Digital_Spend': 'positive',
    'Print_Spend': 'positive',
    'Radio_Spend': 'positive',
    'Seasonality': 'neutral'
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Set Expected Signs</h2>
        <p className="text-muted-foreground">
          Define the expected relationship between each variable and your target (Revenue)
        </p>
      </div>

              <Card className="w-full">
        <CardHeader>
          <CardTitle>Variable Expected Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>Current Sign</TableHead>
                <TableHead>Expected Sign</TableHead>
                <TableHead>Recommended</TableHead>
                <TableHead>Business Logic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numericColumns.map((variable) => {
                const currentSign = variableSigns[variable];
                const recommended = recommendedSigns[variable] || 'positive';
                
                return (
                  <TableRow key={variable}>
                    <TableCell className="font-medium">{variable}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSignIcon(currentSign)}
                        <Badge className={getSignColor(currentSign)}>
                          {currentSign || 'Not set'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentSign || ''}
                        onValueChange={(value: ExpectedSign) => handleSignChange(variable, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSignIcon(recommended)}
                        <Badge className={getSignColor(recommended)}>
                          {recommended}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {variable.includes('Spend') 
                        ? 'Higher spend should drive higher revenue'
                        : variable === 'Seasonality'
                        ? 'May vary by season'
                        : 'Expected to positively impact revenue'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

              <Card className="w-full bg-info/5 border-info/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-info mb-2">Expected Sign Guidelines</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="font-medium">Positive</span>
              </div>
              <p className="text-muted-foreground">Variable increases revenue when it increases</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="font-medium">Negative</span>
              </div>
              <p className="text-muted-foreground">Variable decreases revenue when it increases</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Minus className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Neutral</span>
              </div>
              <p className="text-muted-foreground">Variable has unpredictable impact on revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}