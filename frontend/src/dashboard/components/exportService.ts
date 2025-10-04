/**
 * ========================================
 * EXPORT SERVICE - PPT GENERATION
 * ========================================
 * 
 * Purpose: Handle chart capture and PowerPoint export functionality
 * 
 * Description:
 * This service provides functions to capture charts as images and generate
 * PowerPoint presentations with proper formatting and responsive scaling.
 * 
 * Key Functionality:
 * - Capture chart elements as high-quality images
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
  imageQuality?: number;
}

export interface ChartImage {
  title: string;
  imageData: string;
  type: string;
  description?: string;
}

/**
 * Capture a chart element as a high-quality image
 */
export const captureChartImage = async (
  chartElement: HTMLElement,
  options: { quality?: number; backgroundColor?: string } = {}
): Promise<string> => {
  const {
    quality = 1.5,
    backgroundColor = '#ffffff'
  } = options;

  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor,
      scale: quality,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: chartElement.offsetWidth,
      height: chartElement.offsetHeight,
      scrollX: 0,
      scrollY: 0
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (error) {
    console.error('Error capturing chart image:', error);
    throw new Error('Failed to capture chart image');
  }
};

/**
 * Capture all charts from the dashboard
 */
export const captureAllCharts = async (
  chartElements: HTMLElement[],
  chartData: ChartData[]
): Promise<ChartImage[]> => {
  const chartImages: ChartImage[] = [];

  for (let i = 0; i < chartElements.length; i++) {
    const element = chartElements[i];
    const chart = chartData[i];

    if (!element || !chart) continue;

    try {
      const imageData = await captureChartImage(element, {
        quality: 2,
        backgroundColor: '#ffffff'
      });

      chartImages.push({
        title: chart.title,
        imageData,
        type: chart.type,
        description: chart.description
      });
    } catch (error) {
      console.error(`Error capturing chart ${chart.title}:`, error);
      // Continue with other charts even if one fails
    }
  }

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
    imageQuality = 0.8
  } = options;

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
    for (const chartImage of chartImages) {
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
        backgroundColor: '3B82F6',
        align: 'center'
      });

      // Add chart image
      slide.addImage({
        data: chartImage.imageData,
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 4,
        sizing: {
          type: 'contain',
          w: 9,
          h: 4
        }
      });

      // Add insights and recommendations below the chart
      if (includeInsights && chartImage.description) {
        const insights = extractInsights(chartImage.description);
        let currentY = 5.8;
        
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

        if (insights.recommendation) {
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
    await pptx.writeFile({ fileName });
    
    console.log(`PowerPoint presentation "${fileName}" generated successfully!`);
  } catch (error) {
    console.error('Error generating PowerPoint:', error);
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
    recommendation: ''
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
  const recommendationMatch = description.match(/(?:Quantified )?Recommendation[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (recommendationMatch) {
    insights.recommendation = recommendationMatch[1].trim();
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
    console.log('Starting dashboard export to PPT...');
    
    // Capture all charts as images
    const chartImages = await captureAllCharts(chartElements, chartData);
    
    if (chartImages.length === 0) {
      throw new Error('No charts found to export');
    }

    console.log(`Captured ${chartImages.length} charts`);

    // Generate PowerPoint presentation
    await generatePowerPoint(chartImages, options);
    
    console.log('Dashboard export completed successfully!');
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};
