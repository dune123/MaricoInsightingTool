/**
 * ========================================
 * NON-MMM DOWNLOAD ANALYSIS STEP
 * ========================================
 * 
 * Purpose: Final step for non-MMM analysis workflow - Download Analysis as PowerPoint
 * 
 * Description:
 * This component allows users to download their complete analysis as a PowerPoint presentation:
 * 1. Context slide with data overview from selected sheet
 * 2. Initial insights slide
 * 3. Chart analysis slides (one slide per variable pair with line chart and scatter plot)
 * 4. Model results slide with final production model details
 * 
 * Key Features:
 * - PowerPoint generation with comprehensive analysis data
 * - Professional presentation layout
 * - Download functionality with progress tracking
 * - Analysis completion workflow
 * - Error handling and user feedback
 * 
 * Dependencies:
 * - AnalysisContext for state management
 * - Non-MMM specific types and interfaces
 * - PowerPoint generation API endpoint
 * - Analysis data from previous steps
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import React, { useState, useEffect } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Presentation,
  BarChart3,
  TrendingUp,
  Target,
  Brain,
  FileImage,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NonMMMStateService } from '@/analysis/nonmmm/services/NonMMMStateService';

// ========================================
// INTERFACES AND TYPES
// ========================================

interface DownloadAnalysisStepState {
  isGenerating: boolean;
  generationProgress: number;
  error: string | null;
  downloadUrl: string | null;
  analysisData: {
    brandName: string;
    filename: string;
    targetVariable: string;
    expectedSigns: Record<string, string>;
    chartData: any[];
    modelResults: any[];
    dataSummary: any;
  } | null;
}

interface PowerPointSlide {
  title: string;
  type: 'context' | 'insights' | 'charts' | 'model';
  content: any;
}

// ========================================
// DOWNLOAD ANALYSIS STEP COMPONENT
// ========================================

export function NonMMMDownloadAnalysisStep() {
  const { state } = useAnalysis();
  const { toast } = useToast();
  
  const [stepState, setStepState] = useState<DownloadAnalysisStepState>({
    isGenerating: false,
    generationProgress: 0,
    error: null,
    downloadUrl: null,
    analysisData: null
  });

  // Load analysis data when component mounts
  useEffect(() => {
    if (state.currentAnalysisId) {
      loadAnalysisData();
    }
  }, [state.currentAnalysisId]);

  // Load all analysis data from state service
  const loadAnalysisData = async () => {
    try {
      const nonmmmState = await NonMMMStateService.getNonMMMState();
      console.log('🔍 Download Analysis - Loading Non-MMM State:', nonmmmState);
      
      if (nonmmmState) {
        const analysisData = {
          brandName: nonmmmState.brand as string || 'Unknown Brand',
          filename: nonmmmState.uploadedFile as string || 'Unknown File',
          targetVariable: nonmmmState.targetVariable as string || 'Unknown Target',
          expectedSigns: (nonmmmState.expectedSigns as Record<string, string>) || {},
          chartData: nonmmmState.chartData as any[] || [],
          modelResults: nonmmmState.modelResults as any[] || [],
          dataSummary: nonmmmState.dataSummary as any || {}
        };
        
        console.log('📊 Download Analysis - Analysis Data:', analysisData);
        console.log('📈 Download Analysis - Chart Data Count:', analysisData.chartData.length);
        console.log('🤖 Download Analysis - Model Results Count:', analysisData.modelResults.length);
        
        setStepState(prev => ({
          ...prev,
          analysisData
        }));
      }
    } catch (error) {
      console.error('Error loading analysis data:', error);
      setStepState(prev => ({
        ...prev,
        error: 'Failed to load analysis data'
      }));
    }
  };

  // Generate PowerPoint presentation
  const generatePowerPoint = async () => {
    if (!stepState.analysisData) {
      toast({
        title: 'Error',
        description: 'Analysis data not available. Please complete previous steps.',
        variant: 'destructive'
      });
      return;
    }

    setStepState(prev => ({
      ...prev,
      isGenerating: true,
      generationProgress: 0,
      error: null
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setStepState(prev => ({
          ...prev,
          generationProgress: Math.min(prev.generationProgress + 10, 90)
        }));
      }, 200);

      // Call backend API to generate PowerPoint
      const response = await fetch('/api/nonmmm/generate-powerpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_id: state.currentAnalysisId,
          brand: stepState.analysisData.brandName,
          analysis_data: stepState.analysisData
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      setStepState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 100,
        downloadUrl
      }));

      toast({
        title: 'PowerPoint Generated!',
        description: 'Your analysis presentation is ready for download.',
      });

    } catch (error) {
      console.error('Error generating PowerPoint:', error);
      setStepState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 0,
        error: 'Failed to generate PowerPoint presentation'
      }));

      toast({
        title: 'Generation Failed',
        description: 'Failed to generate PowerPoint presentation. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Download the generated PowerPoint
  const downloadPowerPoint = () => {
    if (stepState.downloadUrl) {
      const link = document.createElement('a');
      link.href = stepState.downloadUrl;
      link.download = `${stepState.analysisData?.brandName || 'Analysis'}_Presentation.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get slide preview data
  const getSlidePreviews = (): PowerPointSlide[] => {
    if (!stepState.analysisData) {
      console.log('📋 Download Analysis - No analysis data available for slide preview');
      return [];
    }

    console.log('📋 Download Analysis - Generating slide previews with data:', stepState.analysisData);
    const slides: PowerPointSlide[] = [];

    // Context slide
    slides.push({
      title: 'Analysis Context',
      type: 'context',
      content: {
        brandName: stepState.analysisData.brandName,
        filename: stepState.analysisData.filename,
        targetVariable: stepState.analysisData.targetVariable,
        dataSummary: stepState.analysisData.dataSummary
      }
    });

    // Initial insights slide
    slides.push({
      title: 'Initial Insights',
      type: 'insights',
      content: {
        keyFindings: [
          'Data quality assessment completed',
          'Target variable identified and validated',
          'Expected signs configured for all variables',
          'Statistical analysis performed'
        ]
      }
    });

    // Chart analysis slides
    if (stepState.analysisData.chartData && stepState.analysisData.chartData.length > 0) {
      console.log('📊 Download Analysis - Adding chart slides:', stepState.analysisData.chartData.length);
      stepState.analysisData.chartData.forEach((chart, index) => {
        slides.push({
          title: `Chart Analysis: ${chart.variableName || `Variable ${index + 1}`}`,
          type: 'charts',
          content: {
            variableName: chart.variableName,
            lineChart: chart.lineChart,
            scatterPlot: chart.scatterPlot,
            trendline: chart.trendline,
            expectedSign: stepState.analysisData?.expectedSigns[chart.variableName] || '~'
          }
        });
      });
    } else {
      console.log('📊 Download Analysis - No chart data available for slides');
    }

    // Model results slide
    if (stepState.analysisData.modelResults && stepState.analysisData.modelResults.length > 0) {
      console.log('🤖 Download Analysis - Adding model results slide');
      slides.push({
        title: 'Model Results',
        type: 'model',
        content: {
          models: stepState.analysisData.modelResults,
          bestModel: stepState.analysisData.modelResults[0] // Assuming first is best
        }
      });
    } else {
      console.log('🤖 Download Analysis - No model results available for slides');
    }

    console.log('📋 Download Analysis - Total slides generated:', slides.length);
    return slides;
  };

  const slidePreviews = getSlidePreviews();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Presentation className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Download Analysis</CardTitle>
              <CardDescription>
                Generate and download your complete analysis as a PowerPoint presentation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your analysis is complete! Download a professional PowerPoint presentation 
              containing all your analysis results, charts, and insights.
            </p>
            
            {stepState.analysisData && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Brand:</span>
                  <p className="text-sm text-muted-foreground">{stepState.analysisData.brandName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Target Variable:</span>
                  <p className="text-sm text-muted-foreground">{stepState.analysisData.targetVariable}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Data File:</span>
                  <p className="text-sm text-muted-foreground">{stepState.analysisData.filename}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Charts Generated:</span>
                  <p className="text-sm text-muted-foreground">{stepState.analysisData.chartData?.length || 0}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PowerPoint Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Presentation Preview
          </CardTitle>
          <CardDescription>
            Your PowerPoint will contain {slidePreviews.length} slides with the following content:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {slidePreviews.map((slide, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{slide.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {slide.type === 'context' && 'Data overview and analysis context'}
                    {slide.type === 'insights' && 'Key findings and initial insights'}
                    {slide.type === 'charts' && `Chart analysis for ${slide.content.variableName}`}
                    {slide.type === 'model' && 'Statistical model results and validation'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {slide.type === 'context' && <FileText className="h-4 w-4 text-muted-foreground" />}
                  {slide.type === 'insights' && <Brain className="h-4 w-4 text-muted-foreground" />}
                  {slide.type === 'charts' && <BarChart3 className="h-4 w-4 text-muted-foreground" />}
                  {slide.type === 'model' && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {stepState.isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Generating PowerPoint...</span>
              </div>
              <Progress value={stepState.generationProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                {stepState.generationProgress < 30 && 'Preparing analysis data...'}
                {stepState.generationProgress >= 30 && stepState.generationProgress < 60 && 'Creating slides...'}
                {stepState.generationProgress >= 60 && stepState.generationProgress < 90 && 'Adding charts and visualizations...'}
                {stepState.generationProgress >= 90 && 'Finalizing presentation...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {stepState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{stepState.error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {stepState.downloadUrl ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>PowerPoint ready for download</span>
            </div>
          ) : (
            <span>Click generate to create your presentation</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {!stepState.downloadUrl ? (
            <Button 
              onClick={generatePowerPoint}
              disabled={stepState.isGenerating || !stepState.analysisData}
              className="flex items-center gap-2"
            >
              {stepState.isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Presentation className="h-4 w-4" />
                  Generate PowerPoint
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={downloadPowerPoint}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Presentation
            </Button>
          )}
        </div>
      </div>

      {/* Completion Message */}
      {stepState.downloadUrl && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Analysis Complete!</h3>
                <p className="text-sm text-green-700">
                  Your PowerPoint presentation has been generated successfully. 
                  You can now download it and share your analysis results.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NonMMMDownloadAnalysisStep;
