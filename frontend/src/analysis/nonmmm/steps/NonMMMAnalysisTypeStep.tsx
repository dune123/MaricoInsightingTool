/**
 * ========================================
 * NON-MMM ANALYSIS TYPE SELECTION STEP
 * ========================================
 * 
 * Purpose: First step for non-MMM analysis workflow with integrated brand management
 * 
 * Description:
 * This component handles the initial setup for non-MMM analysis:
 * 1. Confirms user is a Data Scientist
 * 2. Sets analysis type to 'non-mmm'
 * 3. Allows brand name input with existing analysis detection
 * 4. Displays existing analyses in cards with delete functionality
 * 5. Handles new analysis creation and existing analysis resumption
 * 
 * Key Features:
 * - Brand name input and validation
 * - Existing analysis detection and loading
 * - New analysis initialization
 * - Analysis overwrite functionality
 * - Existing analyses display with delete capability
 * - Direct navigation to data upload after brand setup
 * 
 * Dependencies:
 * - AnalysisContext for state management
 * - BrandAnalysisService for analysis operations
 * - Non-MMM specific types and interfaces
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/context/AnalysisContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, FileText, BarChart3, TrendingUp, Trash2, Calendar, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { brandAnalysisService, AnalysisListItem } from '@/analysis/mmm/services/brandAnalysisService';
import { AnalysisType } from '@/types/analysis';
import { NonMMMStateService } from '../services/NonMMMStateService';

export function NonMMMAnalysisTypeStep() {
  const { state, setAnalysisType, setSelectedBrand, setCurrentAnalysisId, setAnalysisData, resetAnalysis } = useAnalysis();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [brandName, setBrandName] = useState('');
  const [existingAnalyses, setExistingAnalyses] = useState<AnalysisListItem[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingAnalysisId, setDeletingAnalysisId] = useState<string | null>(null);

  const loadExistingAnalyses = async (brand: string) => {
    if (!brand.trim()) return;

    setIsLoadingAnalyses(true);
    setError(null);

    try {
      const result = await brandAnalysisService.listAnalyses();
      if (result.success && result.data) {
        const analyses = result.data.filter(analysis => 
          analysis.brandName.toLowerCase().includes(brand.toLowerCase()) &&
          analysis.analysisType === 'NON_MMM'
        );
        setExistingAnalyses(analyses);
      } else {
        setExistingAnalyses([]);
      }
    } catch (err) {
      console.error('Error loading existing analyses:', err);
      setError('Failed to load existing analyses');
      setExistingAnalyses([]);
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  const handleBrandNameChange = (value: string) => {
    setBrandName(value);
    setError(null);
    
    if (value.trim()) {
      loadExistingAnalyses(value);
    }
  };

  const handleStartNewAnalysis = async () => {
    if (!brandName.trim()) {
      toast({
        title: "Brand Name Required",
        description: "Please enter a brand name to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Set analysis type to non-mmm
      setAnalysisType('non-mmm' as AnalysisType);
      setSelectedBrand(brandName.trim());
      
      // Create analysis first to get the proper analysis ID from backend
      const createResult = await brandAnalysisService.createAnalysis(
        brandName.trim(),
        'NON_MMM',
        false
      );
      
      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.message || 'Failed to create analysis');
      }
      
      // Use the analysis ID from the backend response to ensure consistency
      setCurrentAnalysisId(createResult.data.analysisId);

      toast({
        title: "Analysis Initialized",
        description: `Non-MMM analysis initialized for ${brandName.trim()}. Please upload data to begin analysis.`,
      });

      // Navigate directly to data upload step
      navigate('/nonmmm/upload');
    } catch (err) {
      console.error('Error starting new analysis:', err);
      setError('Failed to start new analysis. Please try again.');
      toast({
        title: "Error",
        description: "Failed to start new analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeAnalysis = async (analysis: AnalysisListItem) => {
    setIsLoading(true);
    setError(null);

    try {
      // Set state to resume existing analysis
      setAnalysisType('non-mmm' as AnalysisType);
      setSelectedBrand(analysis.brandName);
      setCurrentAnalysisId(analysis.analysisId);

      // Load existing analysis data and set it in context
      const analysisResult = await brandAnalysisService.getAnalysis(analysis.analysisId);
      
      if (analysisResult.success && analysisResult.data) {
        // Create a proper AnalysisData object from BrandAnalysis data
        const brandAnalysis = analysisResult.data;
        const analysisData = {
          filename: brandAnalysis.files.originalFileName || '',
          columns: [], // Will be loaded by individual steps
          rowCount: 0, // Will be loaded by individual steps
          uploadedAt: new Date(brandAnalysis.createdAt),
          sheets: [], // Will be loaded by individual steps
          isConcatenated: brandAnalysis.progress.concatenationCompleted || false,
          targetVariable: undefined, // Will be loaded from non-MMM state
          selectedFilters: [], // Will be loaded from non-MMM state
          brandMetadata: undefined,
          // Store the BrandAnalysis data for access to currentStep
          _brandAnalysis: brandAnalysis
        };
        
        // Set the analysis data in context so steps can access it
        setAnalysisData(analysisData);
        console.log('✅ Analysis data loaded and set in context:', analysisData);
        
        // Also load the non-MMM state from backend to ensure all data is available
        try {
          const nonmmmState = await NonMMMStateService.loadStateFromBackend(analysis.analysisId);
          if (nonmmmState) {
            console.log('✅ Non-MMM state loaded from backend:', nonmmmState);
          } else {
            console.log('ℹ️ No non-MMM state found in backend, will use analysis data');
          }
        } catch (error) {
          console.warn('⚠️ Failed to load non-MMM state from backend:', error);
        }
      } else {
        console.warn('⚠️ Failed to load analysis data:', analysisResult.message);
      }

      // Navigate to the main non-MMM wizard - it will handle step determination internally
      const targetRoute = '/nonmmm';

      toast({
        title: "Analysis Resumed",
        description: `Resuming analysis for ${analysis.brandName} at step ${analysis.currentStep}`,
      });

      // Ensure context state is properly set before navigation
      console.log('🧭 Navigating to:', targetRoute);
      console.log('🔍 Context state before navigation:', {
        currentAnalysisId: state.currentAnalysisId,
        selectedBrand: state.selectedBrand,
        analysisType: state.analysisType,
        analysisMode: state.analysisMode
      });
      navigate(targetRoute);
    } catch (err) {
      console.error('Error resuming analysis:', err);
      setError('Failed to resume analysis. Please try again.');
      toast({
        title: "Error",
        description: "Failed to resume analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string, brandName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering resume
    
    if (!confirm(`Are you sure you want to delete the analysis for ${brandName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingAnalysisId(analysisId);
    setError(null);

    try {
      await brandAnalysisService.deleteAnalysis(analysisId);
      
      // Remove from local state
      setExistingAnalyses(prev => prev.filter(a => a.analysisId !== analysisId));
      
      // Reset analysis context to clear any stale state
      resetAnalysis();
      
      toast({
        title: "Analysis Deleted",
        description: `Analysis for ${brandName} has been deleted successfully`,
      });
    } catch (err) {
      console.error('Error deleting analysis:', err);
      setError('Failed to delete analysis. Please try again.');
      toast({
        title: "Error",
        description: "Failed to delete analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingAnalysisId(null);
    }
  };

  const handleOverwriteAnalysis = async (analysis: AnalysisListItem) => {
    if (!confirm(`Are you sure you want to overwrite the existing analysis for ${analysis.brandName}? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Delete existing analysis
      await brandAnalysisService.deleteAnalysis(analysis.analysisId);
      
      // Reset analysis context to clear any stale state
      resetAnalysis();
      
      // Start new analysis
      await handleStartNewAnalysis();
    } catch (err) {
      console.error('Error overwriting analysis:', err);
      setError('Failed to overwrite analysis. Please try again.');
      toast({
        title: "Error",
        description: "Failed to overwrite analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section - Text on Top */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Non-MMM Analysis Setup</h2>
        <p className="text-muted-foreground">
          Configure your non-MMM analysis workflow for statistical modeling and data insights
        </p>
      </div>

      {/* Analysis Type Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analysis Type Confirmation
          </CardTitle>
          <CardDescription>
            You've selected to perform a non-MMM analysis as a Data Scientist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Data Scientist</Badge>
            <Badge variant="default">Non-MMM Analysis</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Brand Name Input and Analysis Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-secondary" />
            Brand Information & Analysis Management
          </CardTitle>
          <CardDescription>
            Enter your brand name to start a new analysis or manage existing ones with uploaded data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brand Name Input */}
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <div className="flex gap-2">
              <Input
                id="brandName"
                placeholder="Enter brand name (e.g., MBL, X-Men)"
                value={brandName}
                onChange={(e) => handleBrandNameChange(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => loadExistingAnalyses(brandName)}
                disabled={!brandName.trim() || isLoadingAnalyses}
                variant="outline"
                size="sm"
              >
                {isLoadingAnalyses ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Start New Analysis Button */}
          {brandName.trim() && (
            <div className="space-y-2">
              <Button
                onClick={handleStartNewAnalysis}
                disabled={isLoading || !brandName.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start New Non-MMM Analysis
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                This will create a new analysis and take you directly to the data upload step
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Information */}
      <Card>
        <CardHeader>
          <CardTitle>Non-MMM Analysis Workflow</CardTitle>
          <CardDescription>
            This analysis will guide you through the following steps:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">1-3</div>
              <div className="text-sm text-gray-600">Data Setup</div>
              <div className="text-xs text-gray-500">Upload, target selection, expected signs</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-secondary">4-6</div>
              <div className="text-sm text-gray-600">Data Analysis</div>
              <div className="text-xs text-gray-500">Summary, distribution, charts</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-accent">7-9</div>
              <div className="text-sm text-gray-600">Modeling</div>
              <div className="text-xs text-gray-500">Model building and results</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Analyses - List at Bottom */}
      {brandName.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Existing Non-MMM Analyses
            </CardTitle>
            <CardDescription>
              {existingAnalyses.length > 0 
                ? `Found ${existingAnalyses.length} existing non-MMM analysis${existingAnalyses.length > 1 ? 'es' : ''} for ${brandName}`
                : `No existing non-MMM analyses found for ${brandName}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAnalyses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading existing analyses...</span>
              </div>
            ) : existingAnalyses.length > 0 ? (
              <div className="space-y-3">
                {existingAnalyses.map((analysis) => (
                  <div
                    key={analysis.analysisId}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleResumeAnalysis(analysis)}
                  >
                    <div className="flex-1 min-w-0">
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResumeAnalysis(analysis);
                        }}
                        disabled={isLoading}
                      >
                        Resume
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOverwriteAnalysis(analysis);
                        }}
                        disabled={isLoading}
                        className="text-accent hover:text-accent/80 hover:bg-accent/5"
                      >
                        Overwrite
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteAnalysis(analysis.analysisId, analysis.brandName, e)}
                        disabled={deletingAnalysisId === analysis.analysisId}
                        title="Delete Analysis"
                      >
                        {deletingAnalysisId === analysis.analysisId ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>No existing non-MMM analyses found for this brand</p>
                <p className="text-sm">Enter a brand name above to start a new analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
