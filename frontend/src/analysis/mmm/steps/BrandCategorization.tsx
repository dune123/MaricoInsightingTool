/**
 * ========================================
 * BRAND CATEGORIZATION COMPONENT
 * ========================================
 * 
 * Purpose: Display and manage brand categorization for marketing mix modeling
 * 
 * Description:
 * This component displays brands organized into three categories: Our Brand, 
 * Competitors, and Halo Brands. Users can interact with competitor brands to
 * move them to the Halo Brands category for specialized analysis. The component
 * provides a visual three-column layout with clear categorization and interactive
 * brand management functionality.
 * 
 * Key Functionality:
 * - Display Our Brand prominently in left column (1/3 width)
 * - Show Competitor brands in right column (1/3 width) with click interaction
 * - Display Halo Brands in middle column (1/3 width)
 * - Allow moving brands between Competitors and Halo Brands categories
 * - Provide visual feedback for interactive elements
 * - Update brand metadata when categories change
 * 
 * Layout:
 * - Left 1/3: Our Brand (non-interactive, highlighted)
 * - Middle 1/3: Halo Brands (brands moved from competitors)
 * - Right 1/3: Competitors (clickable to move to Halo)
 * 
 * Dependencies:
 * - React hooks for state management
 * - UI components (Card, Badge, Button) for interface
 * - BrandExtractor service for brand manipulation
 * - Tailwind CSS for styling
 * 
 * Used by:
 * - DataConcatenationStep after target variable selection
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Target, Users, Award } from "lucide-react";
import { BrandCategories } from "@/types/analysis";

interface BrandCategorizationProps {
  brandCategories: BrandCategories;
  onBrandCategoriesChange: (categories: BrandCategories) => void;
}

export function BrandCategorization({ 
  brandCategories, 
  onBrandCategoriesChange 
}: BrandCategorizationProps) {

  const handleMoveToHalo = (brandName: string) => {
    const updatedCompetitors = brandCategories.competitors.filter(brand => brand !== brandName);
    const updatedHaloBrands = [...brandCategories.haloBrands];
    
    if (!updatedHaloBrands.includes(brandName)) {
      updatedHaloBrands.push(brandName);
    }

    const updatedCategories: BrandCategories = {
      ...brandCategories,
      competitors: updatedCompetitors,
      haloBrands: updatedHaloBrands.sort()
    };

    onBrandCategoriesChange(updatedCategories);
  };

  const handleMoveToCompetitors = (brandName: string) => {
    const updatedHaloBrands = brandCategories.haloBrands.filter(brand => brand !== brandName);
    const updatedCompetitors = [...brandCategories.competitors];
    
    if (!updatedCompetitors.includes(brandName)) {
      updatedCompetitors.push(brandName);
    }

    const updatedCategories: BrandCategories = {
      ...brandCategories,
      competitors: updatedCompetitors.sort(),
      haloBrands: updatedHaloBrands
    };

    onBrandCategoriesChange(updatedCategories);
  };

  return (
    <div className="mt-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          🏷️ BRAND CATEGORIZATION
        </h3>
        <p className="text-sm text-gray-600">
          Organize brands for analysis. Click competitor brands to move them to Halo category.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Our Brand - Left 1/3 */}
        <Card className="border-2 border-secondary/20 bg-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-secondary flex items-center gap-2">
              <Target className="w-4 h-4" />
              Our Brand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className="bg-secondary text-white font-medium w-full justify-center py-2">
                {brandCategories.ourBrand}
              </Badge>
              <p className="text-xs text-secondary/80 text-center">
                Primary brand for analysis
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Halo Brands - Middle 1/3 */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <Award className="w-4 h-4" />
              Halo Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[120px]">
              {brandCategories.haloBrands.length > 0 ? (
                <>
                  {brandCategories.haloBrands.map((brand) => (
                    <div key={brand} className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="flex-1 text-center py-1 border-primary/30 hover:bg-primary/10 cursor-pointer"
                        onClick={() => handleMoveToCompetitors(brand)}
                      >
                        {brand}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700"
                        onClick={() => handleMoveToCompetitors(brand)}
                        title="Move back to Competitors"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-primary/70 text-center mt-2">
                    Associated brands for enhanced analysis
                  </p>
                </>
              ) : (
                <div className="text-center text-primary/70 py-8">
                  <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No halo brands selected</p>
                  <p className="text-xs opacity-75">Click competitors to add</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Competitors - Right 1/3 */}
        <Card className="border-2 border-accent/20 bg-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-accent flex items-center gap-2">
              <Users className="w-4 h-4" />
              Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[120px]">
              {brandCategories.competitors.length > 0 ? (
                <>
                  {brandCategories.competitors.map((brand) => (
                    <div key={brand} className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700"
                        onClick={() => handleMoveToHalo(brand)}
                        title="Move to Halo Brands"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </Button>
                      <Badge 
                        variant="outline" 
                        className="flex-1 text-center py-1 border-accent/30 hover:bg-accent/10 cursor-pointer"
                        onClick={() => handleMoveToHalo(brand)}
                      >
                        {brand}
                      </Badge>
                    </div>
                  ))}
                  <p className="text-xs text-accent/80 text-center mt-2">
                    Click brands to move to Halo category
                  </p>
                </>
              ) : (
                <div className="text-center text-accent/70 py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No competitors found</p>
                  <p className="text-xs opacity-75">All brands moved to Halo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Summary:</span> {' '}
            <span className="text-secondary font-medium">{brandCategories.ourBrand}</span> as Our Brand, {' '}
            <span className="text-primary font-medium">{brandCategories.haloBrands.length}</span> Halo Brand{brandCategories.haloBrands.length !== 1 ? 's' : ''}, {' '}
            <span className="text-accent font-medium">{brandCategories.competitors.length}</span> Competitor{brandCategories.competitors.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
