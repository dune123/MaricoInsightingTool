/**
 * ModelBuildingStep Component
 * 
 * Purpose: Advanced model configuration and training interface for media mix modeling
 * 
 * Description: This component provides a comprehensive interface for configuring and
 * training machine learning models for media mix modeling and attribution analysis.
 * Users can select variables, choose model types, configure parameters, and initiate
 * model training with real-time feedback.
 * 
 * Key Functions:
 * - handleVariableToggle(): Toggles variable selection for model building
 * - handleModelTypeChange(): Changes selected model type
 * - handleRunModel(): Initiates model training process
 * - generateMockResults(): Generates mock model results for demonstration
 * - validateModelConfiguration(): Validates model configuration before training
 * 
 * State Variables:
 * - selectedVariables: Array of selected variables for modeling
 * - modelType: Currently selected model type
 * - isRunning: Tracks model training status
 * 
 * Model Types:
 * - Linear: Basic linear regression for simple relationships
 * - Log-Linear: Log transformation on target for exponential relationships
 * - Log-Log: Log transformation on both predictors and target
 * - Ridge: Regularized regression for high-dimensional data
 * - Bayesian: Probabilistic approach with uncertainty quantification
 * 
 * Data Flow:
 * 1. User selects variables from available numeric columns
 * 2. User chooses model type and configuration
 * 3. Model training is initiated with selected parameters
 * 4. Results are generated and stored in analysis context
 * 5. User proceeds to model results step
 * 
 * Dependencies:
 * - AnalysisContext: Global state and model result management
 * - useToast: User feedback notifications
 * - ModelVariable/ModelResult: Type definitions for modeling
 * - UI components: Card, Button, Checkbox, Select, Badge
 * - Lucide React icons: Play, Settings
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAnalysis } from "@/context/AnalysisContext";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ModelVariable, ModelResult } from "@/types/analysis";
import { Play, Settings } from "lucide-react";

type ModelType = 'linear' | 'log-linear' | 'log-log' | 'ridge' | 'bayesian';

export function ModelBuildingStep() {
  const { state, setModelResult } = useAnalysis();
  const { analysisData } = state;
  const { toast } = useToast();

  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [modelType, setModelType] = useState<ModelType>('linear');
  const [isRunning, setIsRunning] = useState(false);

  if (!analysisData) return <div>No data available</div>;

  const availableVariables = analysisData.columns
    .filter(col => col.type === 'numeric' && col.name !== 'Revenue')
    .map(col => col.name);

  const handleVariableToggle = (variable: string) => {
    setSelectedVariables(prev =>
      prev.includes(variable)
        ? prev.filter(v => v !== variable)
        : [...prev, variable]
    );
  };

  const generateMockResults = (): ModelResult => {
    const variables: ModelVariable[] = selectedVariables.map(name => ({
      name,
      expectedSign: 'positive',
      included: true,
      coefficient: Math.random() * 2 + 0.5,
      pValue: Math.random() * 0.05,
      elasticity: Math.random() * 0.3 + 0.1,
      vif: Math.random() * 3 + 1
    }));

    return {
      rSquared: 0.78 + Math.random() * 0.15,
      adjustedRSquared: 0.74 + Math.random() * 0.15,
      intercept: 50000 + Math.random() * 20000,
      variables,
      modelType
    };
  };

  const runModel = async () => {
    if (selectedVariables.length === 0) {
      toast({
        title: "No variables selected",
        description: "Please select at least one variable to build the model.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    
    // Simulate model running
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = generateMockResults();
    setModelResult(result);
    setIsRunning(false);
    
    toast({
      title: "Model completed successfully",
      description: `${modelType} model with R² = ${result.rSquared.toFixed(3)}`,
    });
    
    // Navigation is now handled by the page component
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Build Your Model</h2>
        <p className="text-muted-foreground">
          Select variables and model type to build your Marketing Mix Model
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variable Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Variable Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Select Variables ({selectedVariables.length}/{availableVariables.length})
              </Label>
              <div className="space-y-3">
                {availableVariables.map((variable) => {
                  const isSelected = selectedVariables.includes(variable);
                  const isRecommended = variable.includes('Spend');
                  
                  return (
                    <div
                      key={variable}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={variable}
                        checked={isSelected}
                        onCheckedChange={() => handleVariableToggle(variable)}
                      />
                      <Label htmlFor={variable} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span>{variable}</span>
                          {isRecommended && (
                            <Badge variant="secondary" className="ml-2">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Selected Variables</Label>
              <div className="flex flex-wrap gap-2">
                {selectedVariables.map((variable) => (
                  <Badge key={variable} variant="default">
                    {variable}
                  </Badge>
                ))}
                {selectedVariables.length === 0 && (
                  <span className="text-muted-foreground text-sm">No variables selected</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Model Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Model Type</Label>
              <Select value={modelType} onValueChange={(value: ModelType) => setModelType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Regression</SelectItem>
                  <SelectItem value="log-linear">Log-Linear</SelectItem>
                  <SelectItem value="log-log">Log-Log</SelectItem>
                  <SelectItem value="ridge">Ridge Regression</SelectItem>
                  <SelectItem value="bayesian">Bayesian Regression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Model Details</Label>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Variable:</span>
                  <Badge variant="outline">Revenue</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Periods:</span>
                  <span>104 weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span>{state.selectedBrand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variables:</span>
                  <span>{selectedVariables.length} selected</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={runModel} 
                disabled={isRunning || selectedVariables.length === 0}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Running Model...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Model
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Type Information */}
      <Card className="bg-info/5 border-info/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-info mb-2">Model Type Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Linear:</span>
              <p className="text-muted-foreground">Direct linear relationships</p>
            </div>
            <div>
              <span className="font-medium">Log-Linear:</span>
              <p className="text-muted-foreground">Diminishing returns effects</p>
            </div>
            <div>
              <span className="font-medium">Ridge:</span>
              <p className="text-muted-foreground">Handles multicollinearity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}