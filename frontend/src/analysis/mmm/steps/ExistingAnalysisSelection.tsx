/**
 * ExistingAnalysisSelection Component
 * 
 * Purpose: Component for selecting existing brand analyses with proper navigation
 * 
 * Description: This component displays a list of existing brand analyses that
 * users can select to continue working on. It properly loads the full analysis
 * data from the backend and navigates to the correct step in the workflow.
 * 
 * Key Functions:
 * - loadAnalyses(): Fetches existing analyses from backend
 * - handleAnalysisSelect(): Loads full analysis data and navigates
 * - handleBack(): Returns to analysis mode selection
 * - renderAnalysisCard(): Renders individual analysis selection card
 * - renderLoadingState(): Shows loading skeleton while fetching data
 * - renderEmptyState(): Displays message when no analyses exist
 * 
 * State Variables:
 * - analyses: Array of existing analysis list items
 * - isLoading: Loading state for analysis list
 * - isSelecting: Loading state for analysis selection
 * 
 * Props:
 * - onBack: Callback function to return to previous step
 * 
 * API Endpoints:
 * - GET /api/analysis: Lists all existing analyses
 * - GET /api/analysis/{id}: Retrieves full analysis data
 * 
 * Data Flow:
 * 1. Component loads and fetches existing analyses list
 * 2. User selects an analysis from the list
 * 3. Full analysis data is loaded from backend
 * 4. Analysis context is populated with restored data
 * 5. Navigation proceeds to correct step in workflow
 * 
 * Dependencies:
 * - AnalysisContext: Global state and analysis management
 * - brandAnalysisService: Backend analysis operations
 * - useToast: User feedback notifications
 * - useNavigate: React Router navigation
 * - UI components: Card, Button, Badge, Skeleton
 * - Lucide React icons: Calendar, TrendingUp, ArrowLeft, FileText
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysis } from "@/context/AnalysisContext";
import { brandAnalysisService, AnalysisListItem } from "@/analysis/mmm/services/brandAnalysisService";
import { initializationService } from "@/analysis/mmm/services/initializationService";
import { useToast } from "@/hooks/use-toast";
import { Calendar, TrendingUp, ArrowLeft, FileText } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { SheetData } from "@/types/analysis";

interface ExistingAnalysisSelectionProps {
  onBack?: () => void;
}

export function ExistingAnalysisSelection({ onBack }: ExistingAnalysisSelectionProps) {
  const { setCurrentAnalysisId, setSelectedBrand, setAnalysisType, setAnalysisMode, setAnalysisData, goToStep } = useAnalysis();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const { toast } = useToast();

  const loadAnalyses = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('📋 Loading existing MMM analyses...');
      const result = await initializationService.listAnalyses();
      
      if (result.success && result.data) {
        // Filter to show only MMM analyses to maintain clear separation
        const allAnalyses = result.data as AnalysisListItem[];
        const mmmAnalyses = allAnalyses.filter(analysis => 
          analysis.analysisType.toLowerCase() === 'mmm'
        );
        
        setAnalyses(mmmAnalyses);
        console.log(`✅ Loaded ${mmmAnalyses.length} MMM analyses out of ${allAnalyses.length} total`);
      } else {
        throw new Error(result.message);
      }
    } catch (error: unknown) {
      console.error('❌ Failed to load MMM analyses:', error);
      toast({
        title: "Loading Failed",
        description: error instanceof Error ? error.message : 'Failed to load existing MMM analyses',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const handleAnalysisSelect = async (analysis: AnalysisListItem) => {
    setIsSelecting(true);
    
    try {
      console.log('🎯 Selecting analysis:', analysis.analysisId);
      
      // CRITICAL: Check if step 3 (data upload) is complete before allowing resume
      if (analysis.currentStep < 4) {
        throw new Error(`Analysis cannot be resumed: Data upload (Step 3) must be completed first. This analysis is only at step ${analysis.currentStep}. Please start a new analysis.`);
      }
      
      // Use initialization service to resume existing analysis
      const result = await initializationService.resumeExistingAnalysis(analysis.analysisId);
      
      if (!result.success || !result.analysisId || !result.brandName) {
        throw new Error(result.error || 'Failed to resume analysis');
      }
      
      // Set context for the selected analysis
      setCurrentAnalysisId(result.analysisId);
      setSelectedBrand(result.brandName);
      setAnalysisType(analysis.analysisType.toLowerCase() as 'mmm' | 'fresh');
      setAnalysisMode('existing'); // Mark as existing analysis to be resumed
      
      // Load the full analysis data from backend for detailed information
      const analysisResult = await brandAnalysisService.getAnalysis(result.analysisId);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.message || 'Failed to load analysis data');
      }
      
      const fullAnalysis = analysisResult.data;
      console.log('📊 Loaded full analysis data:', fullAnalysis);
      
      // Set analysis data if it exists in the full analysis
      if (fullAnalysis.files.originalFileName) {
        // Create a more comprehensive analysisData object for existing analyses
        const analysisData = {
          filename: fullAnalysis.files.originalFileName,
          processedFilename: fullAnalysis.files.concatenatedFileName || fullAnalysis.files.originalFileName,
          // Enhanced sheet information for trigger state restoration
          sheets: (fullAnalysis.concatenationState?.selectedSheets || []).map(sheetName => ({
            sheetName,
            columns: [], // Not needed for state restoration trigger
            rowCount: 0, // Not needed for state restoration trigger  
            isSelected: true, // Mark as selected to trigger existing state check
          })),
          // Enhanced column information for better context
          columns: fullAnalysis.concatenationState?.columnCategories 
            ? Object.values(fullAnalysis.concatenationState.columnCategories).flat().map(col => ({
                name: col as string,
                type: 'categorical' as const, // Default type for restored columns
                values: [] // Empty values array for restored columns
              }))
            : [], // Will be populated when data is loaded
          rowCount: fullAnalysis.concatenationState?.totalRows || 0,
          uploadedAt: new Date(fullAnalysis.createdAt),
          isConcatenated: fullAnalysis.progress.concatenationCompleted,
          concatenationConfig: fullAnalysis.concatenationState ? {
            selectedSheets: fullAnalysis.concatenationState.selectedSheets || [],
            resultingColumns: fullAnalysis.concatenationState.columnCategories 
              ? Object.values(fullAnalysis.concatenationState.columnCategories).flat().map(col => String(col))
              : [],
            customFileName: fullAnalysis.files.concatenatedFileName || ''
          } : undefined,
          targetVariable: fullAnalysis.concatenationState?.targetVariable,
          selectedFilters: [], // Filters will be loaded directly in DataConcatenationStep
          brandMetadata: fullAnalysis.concatenationState?.brandMetadata,
          // Add price/RPI sheet information if available
          priceSheet: fullAnalysis.concatenationState?.priceSheet,
          rpiSheet: fullAnalysis.concatenationState?.rpiSheet
        };
        
        console.log('📝 Setting enhanced analysis data:', {
          filename: analysisData.filename,
          processedFilename: analysisData.processedFilename,
          sheetsCount: analysisData.sheets?.length,
          columnsCount: analysisData.columns?.length,
          rowCount: analysisData.rowCount,
          isConcatenated: analysisData.isConcatenated,
          targetVariable: analysisData.targetVariable,
          selectedFilters: analysisData.selectedFilters?.length,
          hasBrandMetadata: !!analysisData.brandMetadata
        });
        
        // Analysis data mapping completed
        
        setAnalysisData(analysisData);
      }
      
      // Navigate to the appropriate wizard - use MMMWizard internal step navigation
      const targetStep = analysis.currentStep;
      console.log(`🧭 Resuming analysis at step ${targetStep} (analysis was at step ${analysis.currentStep})`);
      
      // Set the target step in context so the wizard knows where to start
      goToStep(targetStep);
      
      // FIXED: No URL routing - let MMMWizard handle internal step navigation
      // The MMMWizard will handle the step display based on context.currentStep
      if (analysis.analysisType.toLowerCase() === 'mmm') {
        const targetRoute = '/mmm';
        console.log('🕐 Executing navigation to MMM wizard:', targetRoute);
        
        // Use setTimeout to ensure state updates are processed before navigation
        setTimeout(() => {
          navigate(targetRoute);
        }, 100);
      } else {
        // For Non-MMM, use the generic route (as it doesn't have the redirect issue)
        const wizardRoute = '/nonmmm';
        console.log('🕐 Executing navigation to Non-MMM wizard:', wizardRoute);
        
        // Use setTimeout to ensure state updates are processed before navigation
        setTimeout(() => {
          navigate(wizardRoute);
        }, 100);
      }
      
      toast({
        title: "Analysis Selected",
        description: `Continuing ${analysis.brandName} analysis from step ${targetStep}`,
        variant: "default"
      });
      
      console.log('✅ Analysis selected successfully');
      
    } catch (error: unknown) {
      console.error('❌ Failed to select analysis:', error);
      toast({
        title: "Selection Failed",
        description: error instanceof Error ? error.message : 'Failed to select analysis',
        variant: "destructive"
      });
    } finally {
      setIsSelecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-secondary/10 text-secondary border-secondary/30';
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'paused':
        return 'bg-accent/10 text-accent border-accent/30';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
              <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Loading Existing MMM Analyses...</h2>
        <p className="text-muted-foreground">Please wait while we fetch your MMM analyses</p>
      </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-4" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="space-y-6">
              <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">No Existing MMM Analyses</h2>
        <p className="text-muted-foreground">
          You haven't created any MMM analyses with uploaded data yet. Start a new MMM analysis and upload your data to see it here.
        </p>
      </div>
        
        <div className="flex justify-center">
          <Card className="p-8 text-center w-full mx-auto">
            <div className="mx-auto mb-4 w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Get Started</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first brand analysis to begin exploring your data and building models.
            </p>
            <div className="flex gap-2">
              {onBack && (
                <Button variant="outline" onClick={onBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button 
                variant="default" 
                onClick={() => {
                  setAnalysisMode('new');
                  goToStep(1); // Go to Data Upload step for new analysis using context
                }}
                className="flex-1"
              >
                Start New Analysis
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Select Existing Analysis</h2>
        <p className="text-muted-foreground">
          Choose an analysis to continue working on
        </p>
      </div>

      {onBack && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis Mode
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyses.map((analysis) => (
          <Card 
            key={analysis.analysisId}
            className="card-premium cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-primary/20"
            onClick={() => !isSelecting && handleAnalysisSelect(analysis)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-medium truncate">
                    {analysis.brandName}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${getStatusColor(analysis.status)}`}>
                      {analysis.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {analysis.analysisType}
                    </span>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium">Step {analysis.currentStep}/11</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(analysis.currentStep / 11) * 100}%` }}
                  />
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Modified {formatDate(analysis.lastModified)}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={isSelecting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnalysisSelect(analysis);
                  }}
                >
                  {isSelecting ? 'Loading...' : 'Continue Analysis'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
