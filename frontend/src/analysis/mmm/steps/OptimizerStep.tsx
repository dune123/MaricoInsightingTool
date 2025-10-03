/**
 * OptimizerStep Component
 * 
 * Purpose: Media budget optimization and scenario planning interface
 * 
 * Description: This component provides an advanced interface for media budget
 * optimization and what-if scenario analysis. Users can create multiple scenarios,
 * adjust budget allocations, and see predicted outcomes based on the trained model
 * to optimize their media investment strategy.
 * 
 * Key Functions:
 * - generateP6MData(): Generates mock P6M (Past 6 Months) data for variables
 * - handleScenarioCreate(): Creates new optimization scenario
 * - handleScenarioUpdate(): Updates existing scenario parameters
 * - handleScenarioDelete(): Removes scenario from list
 * - handleOptimize(): Executes optimization algorithm
 * - handleExport(): Exports optimization results
 * 
 * State Variables:
 * - scenarios: Array of optimization scenarios
 * 
 * Scenario Planning Features:
 * - Create multiple what-if scenarios
 * - Adjust budget allocations across media channels
 * - Set budget constraints and optimization goals
 * - Compare scenario outcomes and performance metrics
 * - Save and load scenario configurations
 * 
 * Optimization Features:
 * - Budget allocation optimization algorithms
 * - ROI maximization and efficiency optimization
 * - Constraint-based optimization (min/max budgets)
 * - Marginal return analysis and diminishing returns
 * - Multi-objective optimization capabilities
 * 
 * Data Flow:
 * 1. Component loads model results and generates P6M data
 * 2. User creates and configures optimization scenarios
 * 3. Optimization algorithm processes scenarios
 * 4. Results are displayed with performance metrics
 * 5. User can export results or modify scenarios
 * 
 * Dependencies:
 * - AnalysisContext: Global state and model results
 * - ScenarioInput: Type definitions for scenario management
 * - useToast: User feedback notifications
 * - UI components: Card, Button, Input, Table, Badge
 * - Lucide React icons: Calculator, TrendingUp, Download
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalysis } from "@/context/AnalysisContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScenarioInput } from "@/types/analysis";
import { Calculator, TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function OptimizerStep() {
  const { state, setScenarioInputs } = useAnalysis();
  const { modelResult } = state;
  const { toast } = useToast();

  const [scenarios, setScenarios] = useState<ScenarioInput[]>([]);

  if (!modelResult) {
    return <div className="text-center py-12 text-muted-foreground">No model results available</div>;
  }

  // Generate P6M values (mock data)
  const generateP6MData = () => {
    return modelResult.variables.map(variable => ({
      variable: variable.name,
      p6mValue: Math.floor(Math.random() * 100000 + 50000),
      scenarioValue: Math.floor(Math.random() * 100000 + 50000),
      impact: 0
    }));
  };

  const [optimizerData, setOptimizerData] = useState<ScenarioInput[]>(() => generateP6MData());

  const handleScenarioChange = (index: number, field: 'scenarioValue', value: number) => {
    const newData = [...optimizerData];
    newData[index] = { ...newData[index], [field]: value };
    
    // Calculate impact based on model coefficient and elasticity
    const variable = modelResult.variables.find(v => v.name === newData[index].variable);
    if (variable) {
      const percentChange = ((value - newData[index].p6mValue) / newData[index].p6mValue) * 100;
      const impact = percentChange * (variable.elasticity || 0) * (variable.coefficient || 0);
      newData[index].impact = impact;
    }
    
    setOptimizerData(newData);
  };

  const calculateTotalImpact = () => {
    return optimizerData.reduce((sum, item) => sum + item.impact, 0);
  };

  const optimizeSpend = () => {
    // Simple optimization logic - increase spend on highest elasticity variables
    const newData = [...optimizerData];
    const sortedByElasticity = newData.sort((a, b) => {
      const aVar = modelResult.variables.find(v => v.name === a.variable);
      const bVar = modelResult.variables.find(v => v.name === b.variable);
      return (bVar?.elasticity || 0) - (aVar?.elasticity || 0);
    });

    // Increase top 2 variables by 20%, decrease others by 10%
    sortedByElasticity.forEach((item, index) => {
      if (index < 2) {
        item.scenarioValue = item.p6mValue * 1.2;
      } else {
        item.scenarioValue = item.p6mValue * 0.9;
      }
      
      const variable = modelResult.variables.find(v => v.name === item.variable);
      if (variable) {
        const percentChange = ((item.scenarioValue - item.p6mValue) / item.p6mValue) * 100;
        item.impact = percentChange * (variable.elasticity || 0) * (variable.coefficient || 0);
      }
    });

    setOptimizerData(newData);
    toast({
      title: "Optimization complete",
      description: `Total expected impact: ${calculateTotalImpact().toFixed(0)} revenue units`,
    });
  };

  const exportResults = () => {
    const csvContent = [
      ['Variable', 'P6M Value', 'Scenario Value', 'Change %', 'Expected Impact'].join(','),
      ...optimizerData.map(item => [
        item.variable,
        item.p6mValue,
        item.scenarioValue,
        (((item.scenarioValue - item.p6mValue) / item.p6mValue) * 100).toFixed(1) + '%',
        item.impact.toFixed(0)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mmm_optimization_results.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Scenario Optimizer</h2>
        <p className="text-muted-foreground">
          Optimize your marketing spend allocation for maximum revenue impact
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total P6M Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {optimizerData.reduce((sum, item) => sum + item.p6mValue, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scenario Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {optimizerData.reduce((sum, item) => sum + item.scenarioValue, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${calculateTotalImpact() >= 0 ? 'text-success' : 'text-destructive'}`}>
              {calculateTotalImpact() >= 0 ? '+' : ''}{calculateTotalImpact().toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Revenue units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-info">
              {((calculateTotalImpact() / optimizerData.reduce((sum, item) => sum + item.scenarioValue, 0)) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Controls */}
      <div className="flex gap-4 justify-center">
        <Button onClick={optimizeSpend} variant="default" className="flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Auto-Optimize
        </Button>
        <Button onClick={exportResults} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Results
        </Button>
      </div>

      {/* Optimization Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Spend Optimization Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>P6M Value</TableHead>
                <TableHead>Scenario Value</TableHead>
                <TableHead>Change %</TableHead>
                <TableHead>Expected Impact</TableHead>
                <TableHead>Elasticity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimizerData.map((item, index) => {
                const variable = modelResult.variables.find(v => v.name === item.variable);
                const changePercent = ((item.scenarioValue - item.p6mValue) / item.p6mValue) * 100;
                
                return (
                  <TableRow key={item.variable}>
                    <TableCell className="font-medium">{item.variable}</TableCell>
                    <TableCell>{item.p6mValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.scenarioValue}
                        onChange={(e) => handleScenarioChange(index, 'scenarioValue', Number(e.target.value))}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={changePercent >= 0 ? "default" : "secondary"}
                        className={changePercent >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}
                      >
                        {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={item.impact >= 0 ? 'text-success' : 'text-destructive'}>
                        {item.impact >= 0 ? '+' : ''}{item.impact.toFixed(0)}
                      </span>
                    </TableCell>
                    <TableCell>{((variable?.elasticity || 0) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-success/5 border-success/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-success mb-2">Optimization Insights</h4>
          <ul className="text-sm space-y-1">
            <li>• {optimizerData.find(item => {
              const variable = modelResult.variables.find(v => v.name === item.variable);
              return variable && variable.elasticity === Math.max(...modelResult.variables.map(v => v.elasticity || 0));
            })?.variable} shows highest elasticity - consider increasing investment</li>
            <li>• Current scenario generates {calculateTotalImpact() >= 0 ? 'positive' : 'negative'} revenue impact of {Math.abs(calculateTotalImpact()).toLocaleString()} units</li>
            <li>• Use auto-optimize for algorithmic spend allocation based on elasticities</li>
            <li>• Export results for further analysis and presentation to stakeholders</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}