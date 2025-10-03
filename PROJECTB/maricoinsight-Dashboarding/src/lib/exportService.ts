/**
 * ========================================
 * EXPORT SERVICE - PPT GENERATION (SIMPLIFIED)
 * ========================================
 * 
 * Purpose: Handle chart capture and PowerPoint export functionality
 * 
 * Description:
 * This service provides functions to capture charts as images and generate
 * PowerPoint presentations with proper formatting and responsive scaling.
 * 
 * Key Functionality:
 * - Simple, reliable chart capture using html2canvas
 * - Generate PowerPoint presentations with multiple slides
 * - Maintain chart quality and responsive scaling
 * - Automatic download of generated PPT files
 * 
 * Dependencies:
 * - pptxgenjs: PowerPoint generation
 * - html2canvas: Chart image capture
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import PptxGenJS from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { ChartData } from '../types/chart';

export interface ExportOptions {
  fileName?: string;
  slideTitle?: string;
  includeInsights?: boolean;
  includeRecommendations?: boolean;
  includeActionItems?: boolean;
  includeRiskFactors?: boolean;
  includeOpportunities?: boolean;
  imageQuality?: number;
}

export interface ChartImage {
  title: string;
  imageData: string;
  type: string;
  description?: string;
  insights?: {
    keyFinding?: string;
    businessImpact?: string;
    recommendation?: string;
    supportingData?: string;
    quantifiedRecommendation?: string;
    actionItems?: string[];
    riskFactors?: string[];
    opportunities?: string[];
  };
}

/**
 * Simple chart capture using html2canvas
 */
export const captureChartImage = async (
  chartElement: HTMLElement,
  options: { quality?: number; backgroundColor?: string } = {}
): Promise<string> => {
  const {
    backgroundColor = '#ffffff'
  } = options;

  console.log(`🎯 Capturing chart element:`, {
    tagName: chartElement.tagName,
    className: chartElement.className,
    dimensions: `${chartElement.offsetWidth}x${chartElement.offsetHeight}`,
    hasSvg: !!chartElement.querySelector('svg'),
    hasRecharts: !!chartElement.querySelector('.recharts-wrapper')
  });

  try {
    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to find the actual chart content first
    const rechartsWrapper = chartElement.querySelector('.recharts-wrapper') as HTMLElement;
    const targetElement = rechartsWrapper || chartElement;
    
    console.log(`🎯 Capturing target element:`, {
      isRechartsWrapper: !!rechartsWrapper,
      element: targetElement.tagName,
      dimensions: `${targetElement.offsetWidth}x${targetElement.offsetHeight}`,
      hasSvg: !!targetElement.querySelector('svg')
    });

    // Try multiple capture methods
    let canvas: HTMLCanvasElement;
    let captureMethod = 'html2canvas';
    
    try {
      // Method 1: Direct html2canvas with minimal options
      canvas = await html2canvas(targetElement, {
        backgroundColor,
        scale: 1, // Lower scale for better compatibility
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: targetElement.offsetWidth,
        height: targetElement.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        foreignObjectRendering: false, // Disable for better SVG handling
        removeContainer: false,
        imageTimeout: 10000
      });
      
      console.log(`✅ html2canvas capture successful`);
    } catch (error) {
      console.warn(`⚠️ html2canvas failed, trying alternative method:`, error);
      
      // Method 2: Try with different options
      try {
        canvas = await html2canvas(targetElement, {
          backgroundColor,
          scale: 2,
          useCORS: false,
          allowTaint: false,
          logging: false,
          width: targetElement.offsetWidth,
          height: targetElement.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          foreignObjectRendering: true,
          removeContainer: false,
          imageTimeout: 15000,
          onclone: (clonedDoc) => {
            // Force all elements to be visible
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.visibility = 'visible';
                el.style.display = 'block';
                el.style.opacity = '1';
              }
            });
          }
        });
        
        captureMethod = 'html2canvas-alternative';
        console.log(`✅ Alternative html2canvas capture successful`);
      } catch (altError) {
        console.error(`❌ All capture methods failed:`, altError);
        throw new Error('Failed to capture chart with any method');
      }
    }

    const imageData = canvas.toDataURL('image/png', 0.95);
    
    console.log(`✅ Chart captured successfully:`, {
      imageSize: imageData.length,
      canvasSize: `${canvas.width}x${canvas.height}`,
      dataUrlStart: imageData.substring(0, 30),
      method: captureMethod
    });

    // Validate the image data
    if (!imageData.startsWith('data:image/png;base64,')) {
      console.error(`❌ Invalid image data format: ${imageData.substring(0, 30)}`);
      throw new Error('Invalid image data format');
    }

    // Check if the image has actual content (not just empty/white)
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imageData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData2.data;
      let nonWhitePixels = 0;
      
      // Sample every 10th pixel to check for non-white content
      for (let i = 0; i < pixels.length; i += 40) { // Check every 10th pixel (RGBA = 4 bytes)
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // Check if pixel is not white/transparent
        if (a > 0 && (r < 250 || g < 250 || b < 250)) {
          nonWhitePixels++;
        }
      }
      
      console.log(`🔍 Image content analysis: ${nonWhitePixels} non-white pixels found`);
      
      if (nonWhitePixels < 10) {
        console.warn(`⚠️ Image appears to be mostly empty/white (${nonWhitePixels} non-white pixels)`);
      }
    }

    return imageData;
  } catch (error) {
    console.error('❌ Error capturing chart image:', error);
    throw new Error(`Failed to capture chart image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Capture all charts from the dashboard in layout order
 */
export const captureAllCharts = async (
  chartElements: HTMLElement[],
  chartData: ChartData[]
): Promise<ChartImage[]> => {
  console.log(`🚀 Starting capture of ${chartData.length} charts with ${chartElements.length} elements`);

  const chartImages: ChartImage[] = [];

  // Sort charts by their layout position (y first, then x)
  const sortedCharts = [...chartData].sort((a, b) => {
    if (!a.layout || !b.layout) return 0;
    
    // First sort by y position (row)
    if (a.layout.y !== b.layout.y) {
      return a.layout.y - b.layout.y;
    }
    
    // Then sort by x position (column)
    return a.layout.x - b.layout.x;
  });

  console.log('📊 Sorted charts by layout:', sortedCharts.map(c => ({ 
    id: c.id, 
    title: c.title, 
    layout: c.layout 
  })));

  // Create a map of chart ID to element for easy lookup
  const elementMap = new Map<string, HTMLElement>();
  chartElements.forEach((element, index) => {
    const chartId = element.getAttribute('data-chart-id');
    if (chartId) {
      elementMap.set(chartId, element);
      console.log(`🔗 Mapped chart element: ${chartId} -> element ${index}`);
    }
  });

  // Process charts in layout order
  for (let i = 0; i < sortedCharts.length; i++) {
    const chart = sortedCharts[i];
    console.log(`\n📈 Processing chart ${i + 1}/${sortedCharts.length}: ${chart.title}`);
    
    const element = elementMap.get(chart.id);
    
    if (!element) {
      console.warn(`⚠️ Element not found for chart: ${chart.title} (ID: ${chart.id})`);
      // Try to use element by index as fallback
      if (i < chartElements.length) {
        console.log(`🔄 Using fallback element ${i} for chart: ${chart.title}`);
        const fallbackElement = chartElements[i];
        try {
          const imageData = await captureChartImage(fallbackElement, {
            quality: 2,
            backgroundColor: '#ffffff'
          });

          chartImages.push({
            title: chart.title,
            imageData,
            type: chart.type,
            description: chart.description,
            insights: chart.insights
          });
          
          console.log(`✅ Fallback capture successful for: ${chart.title}`);
        } catch (error) {
          console.error(`❌ Error capturing fallback chart ${chart.title}:`, error);
        }
      }
      continue;
    }

    try {
      console.log(`🎯 Capturing chart: ${chart.title} (ID: ${chart.id})`);
      
      const imageData = await captureChartImage(element, {
        quality: 2,
        backgroundColor: '#ffffff'
      });

      // Verify that we actually captured content
      if (imageData && imageData.length > 1000) {
        chartImages.push({
          title: chart.title,
          imageData,
          type: chart.type,
          description: chart.description
        });
        
        console.log(`✅ Successfully captured chart: ${chart.title} (${imageData.length} bytes)`);
      } else {
        console.warn(`⚠️ Chart ${chart.title} appears to be empty (${imageData.length} bytes)`);
        
        // Try alternative capture methods
        const rechartsWrapper = element.querySelector('.recharts-wrapper') as HTMLElement;
        if (rechartsWrapper) {
          console.log(`🔄 Trying alternative capture for: ${chart.title}`);
          try {
            const alternativeImageData = await captureChartImage(rechartsWrapper, {
              quality: 2,
              backgroundColor: '#ffffff'
            });
            
            chartImages.push({
              title: chart.title,
              imageData: alternativeImageData,
              type: chart.type,
              description: chart.description
            });
            
            console.log(`✅ Alternative capture successful for: ${chart.title}`);
          } catch (altError) {
            console.error(`❌ Alternative capture failed for: ${chart.title}`, altError);
            // Still add the original (even if empty) to maintain slide count
            chartImages.push({
              title: chart.title,
              imageData,
              type: chart.type,
              description: chart.description
            });
          }
        } else {
          // Add the original even if it might be empty
          chartImages.push({
            title: chart.title,
            imageData,
            type: chart.type,
            description: chart.description,
            insights: chart.insights
          });
          
          console.log(`📝 Added chart to export (may be empty): ${chart.title}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error capturing chart ${chart.title}:`, error);
      // Continue with other charts even if one fails
    }
  }

  console.log(`\n🎉 Successfully captured ${chartImages.length} out of ${sortedCharts.length} charts`);
  return chartImages;
};

/**
 * Generate PowerPoint presentation from chart images
 */
export const generatePowerPoint = async (
  chartImages: ChartImage[],
  options: ExportOptions = {}
): Promise<void> => {
  const {
    fileName = `Dashboard_Export_${new Date().toISOString().split('T')[0]}.pptx`,
    slideTitle = 'Dashboard Analysis',
    includeInsights = true,
    includeRecommendations = true,
    includeActionItems = true,
    includeRiskFactors = true,
    includeOpportunities = true
  } = options;

  console.log(`📊 Generating PowerPoint with ${chartImages.length} charts...`);

  try {
    // Create new presentation
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = 'BrandBloom Insights';
    pptx.company = 'Marico';
    pptx.title = slideTitle;
    pptx.subject = 'Dashboard Analysis Export';

    // Add title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText('Dashboard Analysis', {
      x: 1,
      y: 1,
      w: 8,
      h: 1,
      fontSize: 32,
      bold: true,
      color: '1F2937',
      align: 'center'
    });

    titleSlide.addText(`Generated on ${new Date().toLocaleDateString()}`, {
      x: 1,
      y: 2,
      w: 8,
      h: 0.5,
      fontSize: 16,
      color: '6B7280',
      align: 'center'
    });

    titleSlide.addText(`Total Charts: ${chartImages.length}`, {
      x: 1,
      y: 3,
      w: 8,
      h: 0.5,
      fontSize: 14,
      color: '6B7280',
      align: 'center'
    });

    // Add chart slides - each chart gets one slide with chart + insights + recommendations
    for (let i = 0; i < chartImages.length; i++) {
      const chartImage = chartImages[i];
      console.log(`📄 Creating slide ${i + 1}/${chartImages.length} for: ${chartImage.title}`);
      
      const slide = pptx.addSlide();

      // Add slide title
      slide.addText(chartImage.title, {
        x: 0.5,
        y: 0.2,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: '1F2937',
        align: 'center'
      });

      // Add chart type badge
      slide.addText(chartImage.type.toUpperCase(), {
        x: 0.5,
        y: 1,
        w: 1.5,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: 'FFFFFF',
        fill: { color: '3B82F6' },
        align: 'center'
      });

      // Add chart image with proper sizing and alignment
      console.log(`🖼️ Adding image to slide for: ${chartImage.title}`);
      console.log(`📊 Image data length: ${chartImage.imageData.length}`);
      console.log(`🔍 Image data preview: ${chartImage.imageData.substring(0, 50)}...`);
      
      // Validate image data format
      if (!chartImage.imageData.startsWith('data:image/')) {
        console.error(`❌ Invalid image data format for: ${chartImage.title}`);
        console.log(`🔍 Actual format: ${chartImage.imageData.substring(0, 20)}`);
      }
      
      // Test if the image data is valid by creating a test image
      const testImg = new Image();
      testImg.onload = () => {
        console.log(`✅ Image data is valid for: ${chartImage.title} (${testImg.width}x${testImg.height})`);
      };
      testImg.onerror = () => {
        console.error(`❌ Image data is corrupted for: ${chartImage.title}`);
      };
      testImg.src = chartImage.imageData;
      
      try {
        slide.addImage({
          data: chartImage.imageData,
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4
        });
        
        console.log(`✅ Image added successfully for: ${chartImage.title}`);
      } catch (imageError) {
        console.error(`❌ Error adding image for ${chartImage.title}:`, imageError);
        throw imageError;
      }

      // Add insights and recommendations below the chart
      if (includeInsights && (chartImage.insights || chartImage.description)) {
        const insights = chartImage.insights || extractInsights(chartImage.description || '');
        let currentY = 5.8;
        
        // Key Finding
        if (insights.keyFinding) {
          slide.addText('🔍 Key Finding:', {
            x: 0.5,
            y: currentY,
            w: 2.5,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: '1F2937'
          });

          slide.addText(insights.keyFinding, {
            x: 0.5,
            y: currentY + 0.3,
            w: 9,
            h: 0.6,
            fontSize: 12,
            color: '374151',
            wrap: true
          });
          currentY += 1.0;
        }

        // Business Impact
        if (insights.businessImpact) {
          slide.addText('💼 Business Impact:', {
            x: 0.5,
            y: currentY,
            w: 2.5,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: '1F2937'
          });

          slide.addText(insights.businessImpact, {
            x: 0.5,
            y: currentY + 0.3,
            w: 9,
            h: 0.6,
            fontSize: 12,
            color: '374151',
            wrap: true
          });
          currentY += 1.0;
        }

        // Recommendation
        if (includeRecommendations && insights.recommendation) {
          slide.addText('💡 Recommendation:', {
            x: 0.5,
            y: currentY,
            w: 2.5,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: '1F2937'
          });

          slide.addText(insights.recommendation, {
            x: 0.5,
            y: currentY + 0.3,
            w: 9,
            h: 0.6,
            fontSize: 12,
            color: '374151',
            wrap: true
          });
          currentY += 1.0;
        }

        // Quantified Recommendation
        if (includeRecommendations && insights.quantifiedRecommendation) {
          slide.addText('📊 Quantified Recommendation:', {
            x: 0.5,
            y: currentY,
            w: 3,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: '1F2937'
          });

          slide.addText(insights.quantifiedRecommendation, {
            x: 0.5,
            y: currentY + 0.3,
            w: 9,
            h: 0.6,
            fontSize: 12,
            color: '374151',
            wrap: true
          });
          currentY += 1.0;
        }

        // Action Items
        if (includeActionItems && insights.actionItems && insights.actionItems.length > 0) {
          slide.addText('✅ Action Items:', {
            x: 0.5,
            y: currentY,
            w: 2.5,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: '1F2937'
          });

          const actionItemsText = insights.actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
          slide.addText(actionItemsText, {
            x: 0.5,
            y: currentY + 0.3,
            w: 9,
            h: Math.min(insights.actionItems.length * 0.3, 1.5),
            fontSize: 12,
            color: '374151',
            wrap: true
          });
          currentY += Math.min(insights.actionItems.length * 0.3 + 0.5, 2.0);
        }

        // Risk Factors
        if (includeRiskFactors && insights.riskFactors && insights.riskFactors.length > 0) {
          slide.addText('⚠️ Risk Factors:', {
            x: 0.5,
            y: currentY,
            w: 2.5,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: 'EF4444'
          });

          const riskFactorsText = insights.riskFactors.map((risk, index) => `${index + 1}. ${risk}`).join('\n');
          slide.addText(riskFactorsText, {
            x: 0.5,
            y: currentY + 0.3,
            w: 9,
            h: Math.min(insights.riskFactors.length * 0.3, 1.5),
            fontSize: 12,
            color: 'EF4444',
            wrap: true
          });
          currentY += Math.min(insights.riskFactors.length * 0.3 + 0.5, 2.0);
        }

        // Opportunities
        if (includeOpportunities && insights.opportunities && insights.opportunities.length > 0) {
          slide.addText('🚀 Opportunities:', {
            x: 0.5,
            y: currentY,
            w: 2.5,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: '10B981'
          });

          const opportunitiesText = insights.opportunities.map((opp, index) => `${index + 1}. ${opp}`).join('\n');
          slide.addText(opportunitiesText, {
            x: 0.5,
            y: currentY + 0.3,
            w: 9,
            h: Math.min(insights.opportunities.length * 0.3, 1.5),
            fontSize: 12,
            color: '10B981',
            wrap: true
          });
        }
      }
    }

    // Add insights summary slide if insights are enabled
    if (includeInsights || includeRecommendations || includeActionItems) {
      const insightsSlide = pptx.addSlide();
      insightsSlide.addText('Key Insights & Recommendations', {
        x: 1,
        y: 0.5,
        w: 8,
        h: 1,
        fontSize: 28,
        bold: true,
        color: '1F2937',
        align: 'center'
      });

      // Collect all insights from all charts
      const allInsights = {
        keyFindings: [] as string[],
        recommendations: [] as string[],
        actionItems: [] as string[],
        riskFactors: [] as string[],
        opportunities: [] as string[]
      };

      chartImages.forEach(chart => {
        const insights = chart.insights || extractInsights(chart.description || '');
        
        if (insights.keyFinding) allInsights.keyFindings.push(`• ${insights.keyFinding}`);
        if (insights.recommendation) allInsights.recommendations.push(`• ${insights.recommendation}`);
        if (insights.actionItems) allInsights.actionItems.push(...insights.actionItems.map(item => `• ${item}`));
        if (insights.riskFactors) allInsights.riskFactors.push(...insights.riskFactors.map(risk => `• ${risk}`));
        if (insights.opportunities) allInsights.opportunities.push(...insights.opportunities.map(opp => `• ${opp}`));
      });

      let currentY = 2;
      
      // Key Findings
      if (allInsights.keyFindings.length > 0) {
        insightsSlide.addText('🔍 Key Findings:', {
          x: 0.5,
          y: currentY,
          w: 3,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: '1F2937'
        });
        
        const keyFindingsText = allInsights.keyFindings.slice(0, 5).join('\n'); // Limit to 5 items
        insightsSlide.addText(keyFindingsText, {
          x: 0.5,
          y: currentY + 0.4,
          w: 9,
          h: Math.min(allInsights.keyFindings.length * 0.3, 2),
          fontSize: 12,
          color: '374151',
          wrap: true
        });
        currentY += Math.min(allInsights.keyFindings.length * 0.3 + 0.6, 2.6);
      }

      // Recommendations
      if (allInsights.recommendations.length > 0) {
        insightsSlide.addText('💡 Recommendations:', {
          x: 0.5,
          y: currentY,
          w: 3,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: '1F2937'
        });
        
        const recommendationsText = allInsights.recommendations.slice(0, 5).join('\n'); // Limit to 5 items
        insightsSlide.addText(recommendationsText, {
          x: 0.5,
          y: currentY + 0.4,
          w: 9,
          h: Math.min(allInsights.recommendations.length * 0.3, 2),
          fontSize: 12,
          color: '374151',
          wrap: true
        });
        currentY += Math.min(allInsights.recommendations.length * 0.3 + 0.6, 2.6);
      }

      // Action Items
      if (allInsights.actionItems.length > 0) {
        insightsSlide.addText('✅ Action Items:', {
          x: 0.5,
          y: currentY,
          w: 3,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: '1F2937'
        });
        
        const actionItemsText = allInsights.actionItems.slice(0, 5).join('\n'); // Limit to 5 items
        insightsSlide.addText(actionItemsText, {
          x: 0.5,
          y: currentY + 0.4,
          w: 9,
          h: Math.min(allInsights.actionItems.length * 0.3, 2),
          fontSize: 12,
          color: '374151',
          wrap: true
        });
        currentY += Math.min(allInsights.actionItems.length * 0.3 + 0.6, 2.6);
      }
    }

    // Add summary slide
    const summarySlide = pptx.addSlide();
    summarySlide.addText('Analysis Summary', {
      x: 1,
      y: 1,
      w: 8,
      h: 1,
      fontSize: 28,
      bold: true,
      color: '1F2937',
      align: 'center'
    });

    summarySlide.addText(`This presentation contains ${chartImages.length} charts from your dashboard analysis.`, {
      x: 1,
      y: 2.5,
      w: 8,
      h: 1,
      fontSize: 16,
      color: '6B7280',
      align: 'center'
    });

    summarySlide.addText('Generated by BrandBloom Insights Dashboard', {
      x: 1,
      y: 4,
      w: 8,
      h: 0.5,
      fontSize: 12,
      color: '9CA3AF',
      align: 'center'
    });

    // Download the presentation
    console.log(`💾 Saving PowerPoint file: ${fileName}`);
    await pptx.writeFile({ fileName });
    
    console.log(`✅ PowerPoint presentation "${fileName}" generated successfully!`);
  } catch (error) {
    console.error('❌ Error generating PowerPoint:', error);
    throw new Error('Failed to generate PowerPoint presentation');
  }
};

/**
 * Extract insights from chart description
 */
const extractInsights = (description: string) => {
  const insights = {
    keyFinding: '',
    businessImpact: '',
    recommendation: '',
    supportingData: '',
    quantifiedRecommendation: '',
    actionItems: [] as string[],
    riskFactors: [] as string[],
    opportunities: [] as string[]
  };

  // Extract key finding
  const keyFindingMatch = description.match(/Key Finding[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (keyFindingMatch) {
    insights.keyFinding = keyFindingMatch[1].trim();
  }

  // Extract business impact
  const businessImpactMatch = description.match(/Business Impact[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (businessImpactMatch) {
    insights.businessImpact = businessImpactMatch[1].trim();
  }

  // Extract recommendation
  const recommendationMatch = description.match(/Recommendation[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (recommendationMatch) {
    insights.recommendation = recommendationMatch[1].trim();
  }

  // Extract quantified recommendation
  const quantifiedRecommendationMatch = description.match(/Quantified Recommendation[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (quantifiedRecommendationMatch) {
    insights.quantifiedRecommendation = quantifiedRecommendationMatch[1].trim();
  }

  // Extract supporting data
  const supportingDataMatch = description.match(/Supporting Data[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (supportingDataMatch) {
    insights.supportingData = supportingDataMatch[1].trim();
  }

  // Extract action items (numbered list)
  const actionItemsMatches = description.match(/Action Items?[:\s]*([\s\S]*?)(?=Risk Factors|Opportunities|$)/i);
  if (actionItemsMatches) {
    const actionItemsText = actionItemsMatches[1];
    const items = actionItemsText.split(/\n|\d+\./).filter(item => item.trim().length > 0);
    insights.actionItems = items.map(item => item.trim()).filter(item => item.length > 0);
  }

  // Extract risk factors
  const riskFactorsMatches = description.match(/Risk Factors?[:\s]*([\s\S]*?)(?=Opportunities|Action Items|$)/i);
  if (riskFactorsMatches) {
    const riskFactorsText = riskFactorsMatches[1];
    const items = riskFactorsText.split(/\n|\d+\./).filter(item => item.trim().length > 0);
    insights.riskFactors = items.map(item => item.trim()).filter(item => item.length > 0);
  }

  // Extract opportunities
  const opportunitiesMatches = description.match(/Opportunities?[:\s]*([\s\S]*?)(?=Risk Factors|Action Items|$)/i);
  if (opportunitiesMatches) {
    const opportunitiesText = opportunitiesMatches[1];
    const items = opportunitiesText.split(/\n|\d+\./).filter(item => item.trim().length > 0);
    insights.opportunities = items.map(item => item.trim()).filter(item => item.length > 0);
  }

  return insights;
};

/**
 * Main export function - captures charts and generates PPT
 */
export const exportDashboardToPPT = async (
  chartElements: HTMLElement[],
  chartData: ChartData[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    console.log('🚀 Starting dashboard export to PPT...');
    console.log(`📊 Charts to export: ${chartData.length}`);
    console.log(`🔍 Elements found: ${chartElements.length}`);
    
    // Capture all charts as images
    const chartImages = await captureAllCharts(chartElements, chartData);
    
    if (chartImages.length === 0) {
      throw new Error('No charts found to export');
    }

    console.log(`📸 Captured ${chartImages.length} charts`);

    // Generate PowerPoint presentation
    await generatePowerPoint(chartImages, options);
    
    console.log('🎉 Dashboard export completed successfully!');
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
};