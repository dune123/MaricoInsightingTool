/**
 * AnalysisModeStep Component
 * 
 * Purpose: Third step in wizard for selecting new vs existing analysis workflow
 * 
 * Description: This component allows users to choose between creating a new
 * analysis or continuing with an existing analysis. It provides a clear
 * interface for workflow selection and integrates with the ExistingAnalysisSelection
 * component.
 * 
 * Key Functions:
 * - handleAnalysisModeSelect(): Selects analysis mode and updates context
 * - handleBackToSelection(): Returns to mode selection from existing analysis list
 * - renderModeCard(): Renders individual mode selection card
 * - renderExistingAnalysisList(): Shows existing analysis selection interface
 * 
 * State Variables:
 * - showExistingList: Controls visibility of existing analysis selection
 * 
 * Analysis Modes:
 * - new: Start a fresh analysis from scratch
 * - existing: Continue working on a previously saved analysis
 * 
 * Data Flow:
 * 1. User selects analysis mode (new or existing)
 * 2. If 'new': proceeds to next step in workflow
 * 3. If 'existing': shows existing analysis selection interface
 * 4. User can return to mode selection from existing analysis list
 * 5. Analysis mode is stored in global context
 * 
 * Dependencies:
 * - AnalysisContext: Global state and analysis mode management
 * - ExistingAnalysisSelection: Component for existing analysis workflow
 * - UI components: Card, Button
 * - Lucide React icons: Plus, Search
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnalysisMode } from "@/types/analysis";
import { Plus, Search } from "lucide-react";
import { ExistingAnalysisSelection } from "./ExistingAnalysisSelection";
import { useState, useEffect } from "react";
import { AnalysisListItem } from "@/analysis/mmm/services/brandAnalysisService";
import { initializationService } from "@/analysis/mmm/services/initializationService";

interface AnalysisModeStepProps {
  onAnalysisModeSelect: (analysisMode: AnalysisMode) => void;
  selectedAnalysisMode: AnalysisMode | null;
}

export function AnalysisModeStep({ onAnalysisModeSelect, selectedAnalysisMode }: AnalysisModeStepProps) {
  const { setAnalysisMode } = useAnalysis();
  const [showExistingList, setShowExistingList] = useState(false);
  const [existingAnalyses, setExistingAnalyses] = useState<AnalysisListItem[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);

  // Load existing analyses on mount to show them immediately
  useEffect(() => {
    const loadExistingAnalyses = async () => {
      try {
        console.log('📋 Loading existing analyses for mode selection...');
        const result = await initializationService.listAnalyses();
        
        if (result.success && result.data) {
          const analyses = result.data as AnalysisListItem[];
          setExistingAnalyses(analyses);
          console.log('✅ Loaded existing analyses:', analyses.length);
          
          // If there are existing analyses, show them by default
          if (analyses.length > 0) {
            setShowExistingList(true);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load existing analyses:', error);
      } finally {
        setIsLoadingAnalyses(false);
      }
    };

    loadExistingAnalyses();
  }, []);

  const handleAnalysisModeSelect = (analysisMode: AnalysisMode) => {
    if (analysisMode === 'existing') {
      setShowExistingList(true);
      return;
    }
    
    // Set analysis mode in context
    setAnalysisMode(analysisMode);
    
    // Call the prop function to let the parent wizard handle navigation
    onAnalysisModeSelect(analysisMode);
  };

  const handleBackToSelection = () => {
    setShowExistingList(false);
  };

  if (showExistingList) {
    return <ExistingAnalysisSelection onBack={handleBackToSelection} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Analysis Mode</h2>
        <p className="text-muted-foreground">
          Would you like to create a new analysis or review an existing one?
        </p>
      </div>

      {/* Show loading state while checking for existing analyses */}
      {isLoadingAnalyses && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Checking for existing analyses...</span>
          </div>
        </div>
      )}

      {/* Show existing analyses count if available */}
      {!isLoadingAnalyses && existingAnalyses.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Found {existingAnalyses.length} existing analysis{existingAnalyses.length !== 1 ? 'es' : ''}
          </p>
        </div>
      )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-primary/20"
          onClick={() => handleAnalysisModeSelect('new')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>New Analysis</CardTitle>
            <CardDescription>
              Upload new data and start a fresh MMM analysis from the beginning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1 mb-4">
              <li>• Upload your dataset</li>
              <li>• Complete data exploration</li>
              <li>• Build new models</li>
              <li>• Generate insights</li>
            </ul>
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => handleAnalysisModeSelect('new')}
            >
              Start New Analysis
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-200 hover:scale-105 border-2 border-transparent hover:border-accent/20"
          onClick={() => handleAnalysisModeSelect('existing')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-accent" />
            </div>
            <CardTitle>Existing Analysis</CardTitle>
            <CardDescription>
              Review, modify, or extend an analysis that has already been completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1 mb-4">
              <li>• Load previous work</li>
              <li>• Modify existing models</li>
              <li>• Update scenarios</li>
              <li>• Export results</li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleAnalysisModeSelect('existing')}
            >
              Review Existing
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}