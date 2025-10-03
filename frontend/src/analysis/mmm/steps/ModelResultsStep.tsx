/**
 * ModelResultsStep Component
 * 
 * Purpose: Comprehensive model results display and interpretation interface
 * 
 * Description: This component presents the results of the trained media mix model
 * in a comprehensive, user-friendly format. It displays model performance metrics,
 * variable coefficients, statistical significance, and provides interpretation
 * guidance for business decision-making.
 * 
 * Key Functions:
 * - getSignificanceColor(): Returns color classes based on p-value significance
 * - getVIFColor(): Returns color classes based on VIF (Variance Inflation Factor)
 * - getModelQuality(): Determines model quality based on R-squared value
 * - renderModelPerformance(): Displays model performance metrics
 * - renderVariableCoefficients(): Shows variable coefficients and significance
 * - renderModelDiagnostics(): Displays model diagnostics and validation
 * 
 * State Variables:
 * - modelResult: Model results from analysis context
 * 
 * Model Performance Metrics:
 * - R-squared: Coefficient of determination
 * - MAPE: Mean Absolute Percentage Error
 * - RMSE: Root Mean Square Error
 * - AIC/BIC: Model selection criteria
 * 
 * Statistical Significance Levels:
 * - p < 0.01: Highly significant (green)
 * - p < 0.05: Significant (yellow)
 * - p > 0.05: Not significant (red)
 * 
 * Data Flow:
 * 1. Component loads model results from analysis context
 * 2. Performance metrics are calculated and displayed
 * 3. Variable coefficients are shown with significance indicators
 * 4. Model diagnostics and validation results are presented
 * 5. User can export results or proceed to optimization
 * 
 * Dependencies:
 * - AnalysisContext: Global state and model results
 * - UI components: Card, Button, Table, Badge, Progress
 * - Lucide React icons: CheckCircle, AlertTriangle, TrendingUp
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

export function ModelResultsStep() {
  const { state } = useAnalysis();
  const { modelResult } = state;

  if (!modelResult) {
    return <div className="text-center py-12 text-muted-foreground">No model results available</div>;
  }

  const getSignificanceColor = (pValue: number) => {
    if (pValue < 0.01) return 'bg-success/10 text-success border-success/20';
    if (pValue < 0.05) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const getVIFColor = (vif: number) => {
    if (vif < 2) return 'bg-success/10 text-success border-success/20';
    if (vif < 5) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const getModelQuality = (rSquared: number) => {
    if (rSquared > 0.8) return { label: 'Excellent', color: 'text-success', icon: CheckCircle };
    if (rSquared > 0.6) return { label: 'Good', color: 'text-warning', icon: TrendingUp };
    return { label: 'Fair', color: 'text-destructive', icon: AlertTriangle };
  };

  const quality = getModelQuality(modelResult.rSquared);
  const QualityIcon = quality.icon;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Model Results</h2>
        <p className="text-muted-foreground">
          Your {modelResult.modelType} model has been successfully built
        </p>
      </div>

      {/* Model Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">R-Squared</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{(modelResult.rSquared * 100).toFixed(1)}%</div>
              <QualityIcon className={`w-6 h-6 ${quality.color}`} />
            </div>
            <div className="mt-2">
              <Progress value={modelResult.rSquared * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{quality.label} fit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Adjusted R²</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(modelResult.adjustedRSquared * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Accounting for variables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Intercept</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelResult.intercept.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Base revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Variable Results */}
      <Card>
        <CardHeader>
          <CardTitle>Variable Coefficients & Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>Coefficient</TableHead>
                <TableHead>P-Value</TableHead>
                <TableHead>Significance</TableHead>
                <TableHead>Elasticity @10%</TableHead>
                <TableHead>VIF</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelResult.variables.map((variable) => (
                <TableRow key={variable.name}>
                  <TableCell className="font-medium">{variable.name}</TableCell>
                  <TableCell>{variable.coefficient?.toFixed(4)}</TableCell>
                  <TableCell>{variable.pValue?.toFixed(4)}</TableCell>
                  <TableCell>
                    <Badge className={getSignificanceColor(variable.pValue || 1)}>
                      {(variable.pValue || 1) < 0.01 ? 'Highly Sig.' : 
                       (variable.pValue || 1) < 0.05 ? 'Significant' : 'Not Sig.'}
                    </Badge>
                  </TableCell>
                  <TableCell>{((variable.elasticity || 0) * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge className={getVIFColor(variable.vif || 1)}>
                      {variable.vif?.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(variable.pValue || 1) < 0.05 && (variable.vif || 1) < 5 ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Model Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Explained Variance:</span>
              <span className="font-medium">{(modelResult.rSquared * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Significant Variables:</span>
              <span className="font-medium">
                {modelResult.variables.filter(v => (v.pValue || 1) < 0.05).length} / {modelResult.variables.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Low VIF Variables:</span>
              <span className="font-medium">
                {modelResult.variables.filter(v => (v.vif || 1) < 5).length} / {modelResult.variables.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Model Type:</span>
              <Badge variant="outline">{modelResult.modelType}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variable Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modelResult.variables
                .sort((a, b) => (b.elasticity || 0) - (a.elasticity || 0))
                .slice(0, 5)
                .map((variable) => (
                  <div key={variable.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{variable.name}</span>
                      <span>{((variable.elasticity || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(variable.elasticity || 0) * 100 * 3.33} className="h-2" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-info/5 border-info/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-info mb-2">Model Recommendations</h4>
          <ul className="text-sm space-y-1">
            <li>• Model explains {(modelResult.rSquared * 100).toFixed(1)}% of revenue variance - {quality.label.toLowerCase()} performance</li>
            <li>• {modelResult.variables.filter(v => (v.pValue || 1) < 0.05).length} variables are statistically significant</li>
            <li>• Top performing variable: {modelResult.variables.sort((a, b) => (b.elasticity || 0) - (a.elasticity || 0))[0]?.name}</li>
            <li>• Ready for scenario optimization and budget allocation</li>
          </ul>
        </CardContent>
      </Card>


    </div>
  );
}