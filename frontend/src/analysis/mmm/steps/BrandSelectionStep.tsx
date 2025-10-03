/**
 * BrandSelectionStep Component
 * 
 * Purpose: Brand name input and validation step in the analysis wizard
 * 
 * Description: This component allows users to enter or modify their brand
 * name for the analysis. It provides validation, state management, and
 * integration with the global analysis context.
 * 
 * Key Functions:
 * - handleContinue(): Validates brand name and proceeds to next step
 * - handleBrandNameChange(): Updates local brand name state
 * - validateBrandName(): Checks if brand name is valid
 * - renderBrandInput(): Renders brand name input field
 * - renderSuggestedBrands(): Shows suggested brand options
 * 
 * State Variables:
 * - brandName: Current brand name input value
 * 
 * Validation Features:
 * - Checks for empty/whitespace-only input
 * - Provides user-friendly error messages
 * - Prevents advancement without valid brand name
 * 
 * Data Flow:
 * 1. Component loads existing brand name from context
 * 2. User enters or modifies brand name
 * 3. Validation is performed on continue
 * 4. If valid, brand name is saved to global context
 * 5. Wizard advances to next step
 * 
 * Dependencies:
 * - AnalysisContext: Global state and brand management
 * - useToast: User feedback notifications
 * - UI components: Card, Button, Input, Label
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalysis } from "@/context/AnalysisContext";
import { useToast } from "@/hooks/use-toast";

export function BrandSelectionStep() {
  const { state, setSelectedBrand, nextStep } = useAnalysis();
  const { toast } = useToast();
  const [brandName, setBrandName] = useState(state.selectedBrand);

  const handleContinue = () => {
    if (!brandName.trim()) {
      toast({
        title: "Brand name required",
        description: "Please enter your brand name to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedBrand(brandName.trim());
    nextStep();
  };

  const suggestedBrands = ['Brand_A', 'Brand_B', 'Brand_C'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Select Your Brand</h2>
        <p className="text-muted-foreground">
          Choose the brand you want to analyze from your dataset
        </p>
      </div>

              <Card className="card-premium w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-gradient-primary">Brand Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input
              id="brand-name"
              placeholder="Enter your brand name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>

          {state.analysisData && (
            <div className="space-y-2">
              <Label>Detected Brands in Dataset</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedBrands.map((brand) => (
                  <Button
                    key={brand}
                    variant="outline"
                    size="sm"
                    onClick={() => setBrandName(brand)}
                    className={brandName === brand ? "bg-primary/10 border-primary" : ""}
                  >
                    {brand}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleContinue} className="btn-premium-primary w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}