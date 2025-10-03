/**
 * AnalysisTypeStep Component
 * 
 * Purpose: Second step in wizard for selecting analysis type and brand management
 * 
 * Description: This component allows users to select their analysis type (MMM, Attribution,
 * Market Research, Custom) and manage brand creation/selection. It integrates with the
 * backend to load existing analyses and provides brand management capabilities including
 * creation, selection, and deletion.
 * 
 * Key Functions:
 * - handleAnalysisTypeSelect(): Selects analysis type and updates context
 * - handleBrandCreate(): Creates new brand with validation
 * - handleExistingAnalysisSelect(): Loads and restores existing analysis
 * - handleAnalysisDelete(): Deletes analysis with confirmation
 * - loadExistingAnalyses(): Fetches existing analyses from backend
 * - navigateToNextStep(): Proceeds to next step in workflow
 * 
 * State Variables:
 * - brandName: Input value for brand name creation
 * - showBrandInput: Controls brand input field visibility
 * - isCreating: Tracks brand creation process
 * - showExistingDialog: Controls existing analysis dialog
 * - existingAnalysisData: Data from selected existing analysis
 * - existingAnalyses: List of existing analyses from backend
 * - isLoadingAnalyses: Loading state for analyses
 * - deletingAnalysisId: ID of analysis being deleted
 * 
 * API Endpoints:
 * - GET /api/analysis: Lists all existing analyses
 * - POST /api/analysis: Creates new analysis
 * - GET /api/analysis/{id}: Retrieves specific analysis
 * - DELETE /api/analysis/{id}: Deletes analysis
 * 
 * Data Flow:
 * 1. User selects analysis type (MMM, Attribution, Market Research, Custom)
 * 2. User creates new brand or selects existing analysis
 * 3. Analysis context is updated with selections
 * 4. Navigation proceeds to next step based on analysis progress
 * 
 * Dependencies:
 * - AnalysisContext: Global state management
 * - brandAnalysisService: Backend analysis operations
 * - useToast: User feedback notifications
 * - useNavigate: React Router navigation
 * - UI components: Card, Button, Input, Dialog, Badge, Skeleton
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnalysisType, UserType } from "@/types/analysis";
import { TrendingUp, Zap, Calendar, FileText, AlertCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { brandAnalysisService, AnalysisListItem, BrandAnalysis } from "@/analysis/mmm/services/brandAnalysisService";
import { initializationService } from "@/analysis/mmm/services/initializationService";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisTypeStepProps {
  onAnalysisTypeSelect: (analysisType: 'mmm' | 'non-mmm') => void;
  selectedAnalysisType: AnalysisType | null;
  userType: UserType | null;
}

export function AnalysisTypeStep({ onAnalysisTypeSelect, selectedAnalysisType, userType }: AnalysisTypeStepProps) {
  const { state, setAnalysisType, setSelectedBrand, setCurrentAnalysisId, setAnalysisMode, setAnalysisData, goToStep } = useAnalysis();
  const navigate = useNavigate();
  const [mmmBrandName, setMMMBrandName] = useState(state.selectedBrand || '');
  const [nonMMMBrandName, setNonMMMBrandName] = useState('');
  const [showMMMBrandInput, setShowMMMBrandInput] = useState(false);
  const [showNonMMMBrandInput, setShowNonMMMBrandInput] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showExistingDialog, setShowExistingDialog] = useState(false);
  const [existingAnalysisData, setExistingAnalysisData] = useState<BrandAnalysis | null>(null);
  const [existingAnalyses, setExistingAnalyses] = useState<AnalysisListItem[]>([]);
  const [existingNonMMMAnalyses, setExistingNonMMMAnalyses] = useState<AnalysisListItem[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [deletingAnalysisId, setDeletingAnalysisId] = useState<string | null>(null);
  const [localSelectedAnalysisType, setLocalSelectedAnalysisType] = useState<AnalysisType | null>(null);
  const { toast } = useToast();

  // Clear brand names when component mounts to prevent reuse of previous state
  useEffect(() => {
    setMMMBrandName('');
    setNonMMMBrandName('');
  }, []);

  // Expose clear function globally for debugging and reset purposes (no redundant logging)
  useEffect(() => {
    (window as Window & { clearAnalysisTypeStep?: () => void }).clearAnalysisTypeStep = () => {
      setMMMBrandName('');
      setNonMMMBrandName('');
      setShowMMMBrandInput(false);
      setShowNonMMMBrandInput(false);
      setLocalSelectedAnalysisType(null);
      setExistingAnalysisData(null);
    };
    
    return () => {
      delete (window as Window & { clearAnalysisTypeStep?: () => void }).clearAnalysisTypeStep;
    };
  }, []);

  // Load existing analyses on component mount - ONLY ONCE
  useEffect(() => {
    let isMounted = true;
    
    const loadExistingAnalyses = async () => {
      try {
        const result = await initializationService.listAnalyses();
        if (isMounted && result.success && result.data) {
          const allAnalyses = result.data as AnalysisListItem[];
          // Filter MMM and NonMMM analyses separately
          const mmmAnalyses = allAnalyses.filter(analysis => analysis.analysisType === 'MMM');
          const nonMMMAnalyses = allAnalyses.filter(analysis => 
            analysis.analysisType === 'NON_MMM' || analysis.analysisType.toLowerCase() === 'non-mmm'
          );
          setExistingAnalyses(mmmAnalyses);
          setExistingNonMMMAnalyses(nonMMMAnalyses);
        }
      } catch (error) {
        console.error('Failed to load existing analyses:', error);
      } finally {
        if (isMounted) {
          setIsLoadingAnalyses(false);
        }
      }
    };

    loadExistingAnalyses();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - runs only once

  const handleAnalysisTypeSelect = (analysisType: 'mmm' | 'non-mmm') => {
    if (analysisType === 'mmm') {
      setLocalSelectedAnalysisType('mmm');
      setShowMMMBrandInput(true);
      return; // Don't proceed until brand is entered
    }
    
    if (analysisType === 'non-mmm') {
      setLocalSelectedAnalysisType('non-mmm');
      setShowNonMMMBrandInput(true);
      return; // Don't proceed until brand is entered
    }
  };

  const handleMMMWithBrand = async () => {
    // Prevent multiple simultaneous calls
    if (isCreating) {
      console.log('⏸️ Already creating analysis, ignoring duplicate call');
      return;
    }
    
    // Determine which brand name to use based on which input is active
    const activeBrandName = showNonMMMBrandInput ? nonMMMBrandName : mmmBrandName;
    
    if (!activeBrandName.trim()) return;
    
    setIsCreating(true);
    
    try {
      // Determine analysis type from local state or fallback to global state
      const analysisType = localSelectedAnalysisType || state.analysisType || 'mmm';
      // Map frontend analysis types to backend expected values
      const analysisTypeString = analysisType === 'non-mmm' ? 'NON_MMM' : 'MMM';
      
      // Use single initialization service to prevent race conditions
      if (localStorage.getItem('bb_debug_services') === 'true') {
        console.log(`🚀 Using initialization service for ${analysisTypeString} brand:`, activeBrandName.trim());
      }
      const result = await initializationService.initializeNewAnalysis(activeBrandName.trim(), analysisTypeString);
      
      if (result.success && result.analysisId && result.brandName) {
        // Set analysis context
        setCurrentAnalysisId(result.analysisId);
        setSelectedBrand(result.brandName);
        setAnalysisType(analysisType);
        setAnalysisMode('new'); // Mark as new analysis
        
        toast({
          title: "Analysis Initialized",
          description: `${analysisTypeString} analysis initialized for ${result.brandName}. Please upload data to complete setup.`,
          variant: "default"
        });
        
        if (localStorage.getItem('bb_debug_services') === 'true') {
          console.log(`✅ ${analysisTypeString} brand analysis created via initialization service:`, result.analysisId);
        }
        
        if (analysisType === 'non-mmm') {
          // Call the prop function to let the common wizard handle routing
          onAnalysisTypeSelect('non-mmm');
        } else {
          // Call the prop function to let the common wizard handle routing
          onAnalysisTypeSelect('mmm');
        }
      } else {
        // Handle specific error cases
        if (result.error?.includes('already exists')) {
          // Brand exists - handle differently based on analysis type
          if (analysisType === 'non-mmm') {
            // For Non-MMM, redirect to Non-MMM workflow where existing analyses are properly handled
            // Redirect to Non-MMM workflow (reduced logging)
            navigate('/nonmmm');
          } else {
            // For MMM, load existing analysis data first, then show resume/overwrite dialog
            try {
              console.log('🔍 Loading existing analysis data for brand:', activeBrandName.trim());
              
              // Find the existing analysis for this brand
              const existingAnalysesResult = await initializationService.listAnalyses();
              if (existingAnalysesResult.success && existingAnalysesResult.data) {
                const existingAnalyses = existingAnalysesResult.data as AnalysisListItem[];
                const existingAnalysis = existingAnalyses.find(analysis => 
                  analysis.brandName.toLowerCase() === activeBrandName.trim().toLowerCase()
                );
                
                if (existingAnalysis) {
                  // Load full analysis data
                  const fullAnalysisResult = await brandAnalysisService.getAnalysis(existingAnalysis.analysisId);
                  if (fullAnalysisResult.success && fullAnalysisResult.data) {
                    setExistingAnalysisData(fullAnalysisResult.data);
                    console.log('✅ Loaded existing analysis data for dialog:', fullAnalysisResult.data);
                  }
                } else {
                  console.warn('⚠️ Could not find existing analysis in list for brand:', activeBrandName.trim());
                }
              }
              
              // Show resume/overwrite dialog
              setShowExistingDialog(true);
            } catch (dialogError) {
              console.error('❌ Failed to load existing analysis data for dialog:', dialogError);
              // Still show dialog even if we couldn't load the data
              setShowExistingDialog(true);
            }
          }
        } else {
          throw new Error(result.error || 'Failed to create analysis');
        }
      }
      
    } catch (error: unknown) {
      console.error('❌ Failed to initialize analysis:', error instanceof Error ? error.message : error);
      
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create analysis',
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // REMOVED: This function is no longer needed - all analysis creation goes through initializationService
  // const createNewAnalysis = async (forceOverwrite: boolean = false) => { ... }

  const handleResumeAnalysis = async () => {
    if (!existingAnalysisData) return;
    
    setIsCreating(true);
    
    try {
      if (localStorage.getItem('bb_debug_services') === 'true') {
        console.log('🔄 Loading full analysis data for:', existingAnalysisData.analysisId);
      }
      
      // CRITICAL: Check if step 3 (data upload) is complete before allowing resume
      if (existingAnalysisData.currentStep < 4) {
        throw new Error('Analysis cannot be resumed: Data upload (Step 3) must be completed first. Please start a new analysis.');
      }
      
      // Use initialization service to resume existing analysis
      const result = await initializationService.resumeExistingAnalysis(existingAnalysisData.analysisId);
      
      if (!result.success || !result.analysisId || !result.brandName) {
        throw new Error(result.error || 'Failed to resume analysis');
      }
      
      // Set analysis context
      setCurrentAnalysisId(result.analysisId);
      setSelectedBrand(result.brandName);
      setAnalysisType('mmm');
      setAnalysisMode('existing'); // Mark as existing analysis to be resumed
      
      // Get full analysis data for detailed information
      const fullAnalysisResult = await brandAnalysisService.getAnalysis(result.analysisId);
      if (!fullAnalysisResult.success || !fullAnalysisResult.data) {
        throw new Error('Failed to load full analysis data');
      }
      
      const fullAnalysis = fullAnalysisResult.data;
      
      // Set analysis data if it exists in the full analysis
      if (fullAnalysis.files?.originalFileName) {
        // Create a comprehensive analysisData object for existing analyses
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
          // Add price/RPI sheet information if available (with type safety)
          priceSheet: fullAnalysis.concatenationState?.priceSheet,
          rpiSheet: fullAnalysis.concatenationState?.rpiSheet ? {
            created: fullAnalysis.concatenationState.rpiSheet.created || false,
            rowCount: fullAnalysis.concatenationState.rpiSheet.rowCount || 0,
            columns: fullAnalysis.concatenationState.rpiSheet.columns || [],
            uniqueRegions: fullAnalysis.concatenationState.rpiSheet.uniqueRegions || 0,
            uniqueMonths: fullAnalysis.concatenationState.rpiSheet.uniqueMonths || 0,
            rpiColumns: fullAnalysis.concatenationState.rpiSheet.rpiColumns || [],
            ourBrand: fullAnalysis.concatenationState.rpiSheet.ourBrand || '',
            competitorBrands: fullAnalysis.concatenationState.rpiSheet.competitorBrands || [],
            message: fullAnalysis.concatenationState.rpiSheet.message || ''
          } : undefined
        };
        
        if (localStorage.getItem('bb_debug_verbose') === 'true') {
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
        }
        
        // Analysis data mapping completed
        
        setAnalysisData(analysisData);
      }
      
      // Navigate to the correct step - use MMMWizard internal step navigation
      const targetStep = fullAnalysis.currentStep;
      
      // FIXED: No URL routing - let MMMWizard handle internal step navigation
      // The MMMWizard will handle the step display based on context.currentStep
      const targetRoute = '/mmm';
      // Executing navigation (reduced logging)
      
      // Close dialog
      setShowExistingDialog(false);
      
      // Use setTimeout to ensure state updates are processed before navigation
      setTimeout(() => {
        // Executing navigation (reduced logging)
        goToStep(targetStep); // Update context state
        navigate(targetRoute); // Navigate to URL
      }, 100);
      
      toast({
        title: "Analysis Resumed",
        description: `Continuing ${fullAnalysis.brandName} analysis from step ${targetStep}`,
        variant: "default"
      });
      
    } catch (error: unknown) {
      console.error('❌ Failed to resume analysis:', error);
      
      toast({
        title: "Resume Failed",
        description: error instanceof Error ? error.message : 'Failed to resume analysis',
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOverwriteAnalysis = async () => {
    setIsCreating(true);
    
    try {
      // Use initialization service for overwrite (forceOverwrite = true)
      const result = await initializationService.overwriteExistingAnalysis(mmmBrandName.trim(), 'MMM');
      
      if (result.success && result.analysisId && result.brandName) {
        // Set analysis context
        setCurrentAnalysisId(result.analysisId);
        setSelectedBrand(result.brandName);
        setAnalysisType('mmm');
        
        toast({
          title: "Analysis Overwritten",
          description: `MMM analysis overwritten successfully for ${result.brandName}`,
          variant: "default"
        });
        
        if (localStorage.getItem('bb_debug_services') === 'true') {
          console.log('✅ Brand analysis overwritten via initialization service:', result.analysisId);
        }
        
        // Navigate directly to data upload step using context
        setTimeout(() => {
          goToStep(1);
        }, 100);
      } else {
        throw new Error(result.error || 'Failed to overwrite analysis');
      }
    } catch (error) {
      console.error('❌ Failed to overwrite analysis:', error);
      toast({
        title: "Overwrite Failed",
        description: error instanceof Error ? error.message : 'Failed to overwrite analysis',
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string, brandName: string, event: React.MouseEvent) => {
    // Prevent the click from bubbling up to the parent container
    event.stopPropagation();
    
    setDeletingAnalysisId(analysisId);
    
    try {
      const result = await brandAnalysisService.deleteAnalysis(analysisId);
      
      if (result.success) {
        toast({
          title: "Analysis Deleted",
          description: `Analysis for "${brandName}" has been deleted successfully`,
        });
        
        // Update local state directly instead of making another API call
        // Remove from both MMM and NonMMM lists since we don't know which one it was from
        setExistingAnalyses(prev => prev.filter(analysis => analysis.analysisId !== analysisId));
        setExistingNonMMMAnalyses(prev => prev.filter(analysis => analysis.analysisId !== analysisId));
      } else {
        throw new Error(result.message || 'Failed to delete analysis');
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete analysis',
        variant: "destructive",
      });
    } finally {
      setDeletingAnalysisId(null);
    }
  };

  const handleSelectExistingAnalysis = async (analysis: AnalysisListItem) => {
    console.log('🔄 handleSelectExistingAnalysis called for:', analysis.analysisId, analysis.brandName);
    setIsCreating(true);
    
    try {
      console.log('🔄 Loading existing analysis:', analysis.analysisId);
      
      // Load complete analysis data from backend (same as handleResumeAnalysis)
      const result = await brandAnalysisService.getAnalysis(analysis.analysisId);
      console.log('🔄 Analysis loaded result:', result);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to load analysis data');
      }
      
      const fullAnalysis = result.data;
      console.log('🔄 Full analysis data:', fullAnalysis);
      
      // Set analysis context
      console.log('🔄 Setting context - analysisId:', fullAnalysis.analysisId);
      setCurrentAnalysisId(fullAnalysis.analysisId);
      console.log('🔄 Setting context - brandName:', fullAnalysis.brandName);
      setSelectedBrand(fullAnalysis.brandName);
      // Set analysis type based on the actual analysis type
      const analysisTypeToSet = fullAnalysis.analysisType === 'NON_MMM' || fullAnalysis.analysisType?.toLowerCase() === 'non-mmm' ? 'non-mmm' : 'mmm';
      console.log('🔄 Setting analysis type to:', analysisTypeToSet);
      setAnalysisType(analysisTypeToSet as 'mmm' | 'non-mmm');
      console.log('🔄 Setting analysis mode to: existing');
      setAnalysisMode('existing');
      
      // Set analysis data if it exists in the full analysis
      if (fullAnalysis.files.originalFileName) {
        const analysisData = {
          filename: fullAnalysis.files.originalFileName,
          processedFilename: fullAnalysis.files.concatenatedFileName || fullAnalysis.files.originalFileName,
          sheets: (fullAnalysis.concatenationState?.selectedSheets || []).map(sheetName => ({
            sheetName,
            columns: [],
            rowCount: 0,
            isSelected: true,
          })),
          columns: fullAnalysis.concatenationState?.columnCategories 
            ? Object.values(fullAnalysis.concatenationState.columnCategories).flat().map(col => ({
                name: col as string,
                type: 'categorical' as const,
                values: []
              }))
            : [],
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
          priceSheet: fullAnalysis.concatenationState?.priceSheet,
          rpiSheet: fullAnalysis.concatenationState?.rpiSheet ? {
            created: fullAnalysis.concatenationState.rpiSheet.created || false,
            rowCount: fullAnalysis.concatenationState.rpiSheet.rowCount || 0,
            columns: fullAnalysis.concatenationState.rpiSheet.columns || [],
            uniqueRegions: fullAnalysis.concatenationState.rpiSheet.uniqueRegions || 0,
            uniqueMonths: fullAnalysis.concatenationState.rpiSheet.uniqueMonths || 0,
            rpiColumns: fullAnalysis.concatenationState.rpiSheet.rpiColumns || [],
            ourBrand: fullAnalysis.concatenationState.rpiSheet.ourBrand || '',
            competitorBrands: fullAnalysis.concatenationState.rpiSheet.competitorBrands || [],
            message: fullAnalysis.concatenationState.rpiSheet.message || ''
          } : undefined
        };
        
        setAnalysisData(analysisData);
      }
      
      // Navigate to the correct step based on analysis type
      const targetStep = fullAnalysis.currentStep;
      console.log('🔄 Target step:', targetStep);
      
      // Navigate to appropriate wizard based on analysis type
      const isNonMMM = fullAnalysis.analysisType === 'NON_MMM' || fullAnalysis.analysisType?.toLowerCase() === 'non-mmm';
      const targetRoute = isNonMMM ? '/nonmmm' : '/mmm';
      console.log('🔄 Target route:', targetRoute, 'isNonMMM:', isNonMMM);
      
      setTimeout(() => {
        console.log('🔄 Navigating to step:', targetStep, 'route:', targetRoute);
        console.log('🔄 Current context state before navigation:', {
          currentAnalysisId: state.currentAnalysisId,
          selectedBrand: state.selectedBrand,
          analysisType: state.analysisType,
          analysisMode: state.analysisMode
        });
        goToStep(targetStep);
        navigate(targetRoute);
      }, 500);
      
      toast({
        title: "Analysis Selected",
        description: `Continuing ${fullAnalysis.brandName} analysis from step ${targetStep}`,
        variant: "default"
      });
      
    } catch (error: unknown) {
      console.error('❌ Failed to select analysis:', error);
      
      toast({
        title: "Selection Failed",
        description: error instanceof Error ? error.message : 'Failed to select analysis',
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handle Non-MMM analysis selection
   * Shows brand input field (same as MMM)
   */
  const handleNonMMMAnalysis = () => {
    // Store analysis type locally (don't set global state yet)
            setLocalSelectedAnalysisType('non-mmm' as AnalysisType);
    
    // Show brand input field in General Analysis card (same behavior as MMM)
    setShowNonMMMBrandInput(true);
    
    toast({
      title: 'General Analysis Selected',
      description: 'Please enter your brand name to continue',
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-primary mb-4">Choose Your Analysis Approach</h2>
        <p className="text-lg text-muted-foreground">
          Select the type of analysis that best fits your data and objectives
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <Card 
          className={`group transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-2 border-2 ${
            showMMMBrandInput ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:border-primary/30 cursor-pointer'
          } bg-gradient-to-br from-white to-white/95 relative overflow-hidden`}
          onClick={() => !showMMMBrandInput && handleAnalysisTypeSelect('mmm')}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-xl" />
          </div>

          <CardHeader className="text-center pb-4 relative z-10">
            {/* Icon Container */}
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center shadow-lg">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            
            {/* Title and Subtitle */}
            <div className="mb-2">
              <CardTitle className="text-xl font-bold mb-2 text-primary">MMM Analysis</CardTitle>
              <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary mb-3">
                Marketing Mix Modeling
              </Badge>
            </div>
            
            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
              Comprehensive marketing effectiveness analysis with advanced attribution modeling and ROI optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showMMMBrandInput ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name" className="text-sm font-medium">
                    Enter Your Brand Name
                  </Label>
                  <Input
                    id="brand-name"
                    value={mmmBrandName}
                    onChange={(e) => setMMMBrandName(e.target.value)}
                    placeholder="e.g., X-Men, Coca-Cola, Nike"
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used as "Our Brand" in the analysis
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={handleMMMWithBrand}
                    disabled={!mmmBrandName.trim() || isCreating}
                  >
                    {isCreating ? 'Creating...' : `Start ${localSelectedAnalysisType === 'non-mmm' ? 'General' : 'MMM'} Analysis`}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowMMMBrandInput(false);
                      setLocalSelectedAnalysisType(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Existing Analyses Section */}
                {isLoadingAnalyses ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Loading existing analyses...</p>
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : existingAnalyses.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-sm">
                      <p className="text-sm font-medium text-slate-700 text-center">Resume Existing Analysis</p>
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {existingAnalyses.slice(0, 2).map((analysis) => (
                        <div
                          key={analysis.analysisId}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted/70 cursor-pointer transition-colors"
                          onClick={(e) => {
                            // Only handle click if it's not on the delete button
                            if (!(e.target as HTMLElement).closest('button')) {
                              handleSelectExistingAnalysis(analysis);
                            }
                          }}
                        >
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectExistingAnalysis(analysis);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <p className="font-medium text-sm truncate">{analysis.brandName}</p>
                            <Badge variant="outline" className="text-xs">
                              Step {analysis.currentStep}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {new Date(analysis.lastModified).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 p-1 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteAnalysis(analysis.analysisId, analysis.brandName, e)}
                            disabled={deletingAnalysisId === analysis.analysisId}
                            title="Delete Analysis"
                          >
                            {deletingAnalysisId === analysis.analysisId ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                      {existingAnalyses.length > 2 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{existingAnalyses.length - 2} more analyses available
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
                
                {/* Key Features Section */}
                <div className="p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-slate-700">Key Features</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Marketing attribution modeling',
                      'ROI optimization analysis',
                      'Channel effectiveness insights',
                      'Budget allocation recommendations',
                      'Long-term impact assessment',
                      'Seasonal trend analysis'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-xs text-slate-600 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Benefits Section */}
                <div className="p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-slate-700">Benefits</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Understand true marketing impact',
                      'Optimize budget allocation',
                      'Improve campaign performance',
                      'Data-driven decision making'
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-xs text-slate-600 leading-relaxed">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* New Analysis Button */}
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => handleAnalysisTypeSelect('mmm')}
                  disabled={isCreating}
                >
                  {isCreating ? 'Loading...' : 'Use MMM Template'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`group transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-2 border-2 ${
            showNonMMMBrandInput ? 'border-secondary/40 bg-secondary/5' : 'border-transparent hover:border-secondary/30'
          } bg-gradient-to-br from-white to-white/95 relative overflow-hidden`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-accent/20" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-xl" />
          </div>

          <CardHeader className="text-center pb-4 relative z-10">
            {/* Icon Container */}
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8 text-secondary" />
            </div>
            
            {/* Title and Subtitle */}
            <div className="mb-2">
              <CardTitle className="text-xl font-bold mb-2 text-secondary">General Analysis</CardTitle>
              <Badge variant="outline" className="text-xs font-medium border-secondary/30 text-secondary mb-3">
                Advanced Statistical Modeling
              </Badge>
            </div>
            
            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
              Sophisticated statistical analysis and modeling for business insights and predictive analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showNonMMMBrandInput ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nonmmm-brand-name" className="text-sm font-medium">
                    Enter Your Brand Name
                  </Label>
                  <Input
                    id="nonmmm-brand-name"
                    value={nonMMMBrandName}
                    onChange={(e) => setNonMMMBrandName(e.target.value)}
                    placeholder="e.g., BrandX, CompanyY, ProductZ"
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used to organize your General Analysis data and results
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={handleMMMWithBrand}
                    disabled={!nonMMMBrandName.trim() || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Start General Analysis'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowNonMMMBrandInput(false);
                      setLocalSelectedAnalysisType(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Existing Non-MMM Analyses Section */}
                {isLoadingAnalyses ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Loading existing analyses...</p>
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : existingNonMMMAnalyses.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-sm">
                      <p className="text-sm font-medium text-slate-700 text-center">Resume Existing General Analysis</p>
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {existingNonMMMAnalyses.slice(0, 2).map((analysis) => (
                        <div
                          key={analysis.analysisId}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted/70 cursor-pointer transition-colors relative z-10"
                          style={{ pointerEvents: 'auto' }}
                          onClick={(e) => {
                            // Only handle click if it's not on the delete button
                            if (!(e.target as HTMLElement).closest('button')) {
                              handleSelectExistingAnalysis(analysis);
                            }
                          }}
                        >
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectExistingAnalysis(analysis);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <p className="font-medium text-sm truncate">{analysis.brandName}</p>
                            <Badge variant="outline" className="text-xs">
                              Step {analysis.currentStep}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {new Date(analysis.lastModified).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 p-1 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 relative z-20"
                          style={{ pointerEvents: 'auto' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteAnalysis(analysis.analysisId, analysis.brandName, e);
                          }}
                          disabled={deletingAnalysisId === analysis.analysisId}
                          title="Delete Analysis"
                        >
                          {deletingAnalysisId === analysis.analysisId ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                      {existingNonMMMAnalyses.length > 2 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{existingNonMMMAnalyses.length - 2} more analyses
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Key Features Section */}
                <div className="p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-slate-700">Key Features</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Statistical regression modeling',
                      'Predictive analytics',
                      'Data exploration and visualization',
                      'Custom analysis workflows',
                      'Machine learning algorithms',
                      'Real-time insights generation'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-xs text-slate-600 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Benefits Section */}
                <div className="p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-slate-700">Benefits</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Advanced statistical insights',
                      'Custom analytical workflows',
                      'Predictive modeling capabilities',
                      'Flexible analysis approaches'
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-xs text-slate-600 leading-relaxed">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Start New Analysis Button */}
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={handleNonMMMAnalysis}
                >
                  Start General Analysis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Existing Analysis Dialog */}
      <Dialog open={showExistingDialog} onOpenChange={setShowExistingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Analysis Already Exists</DialogTitle>
            <DialogDescription>
              An analysis for brand "{showNonMMMBrandInput ? nonMMMBrandName : mmmBrandName}" already exists. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          
          {existingAnalysisData && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Brand Name:</span>
                  <span className="text-sm font-medium">{existingAnalysisData.brandName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Step:</span>
                  <span className="text-sm font-medium">Step {existingAnalysisData.currentStep}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium capitalize">{existingAnalysisData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Modified:</span>
                  <span className="text-sm font-medium">
                    {new Date(existingAnalysisData.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Resume Analysis:</strong> Continue from where you left off</p>
                <p><strong>Start New Analysis:</strong> Delete existing analysis folder and create a fresh analysis</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExistingDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleResumeAnalysis}
              disabled={isCreating}
            >
              {isCreating ? 'Loading...' : 'Resume Analysis'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleOverwriteAnalysis}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Start New Analysis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}