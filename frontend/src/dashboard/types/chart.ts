export interface ChartData {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'donut' | 'kpi';
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  config: {
    xKey?: string;
    yKey?: string | string[];
    nameKey?: string;
    valueKey?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;
    showTrendLine?: boolean;
    // KPI-specific config
    value?: string | number;
    trend?: number;
    trendDirection?: 'up' | 'down' | 'neutral';
    period?: string;
    unit?: string;
    target?: number;
  };
  // File-related properties for image charts
  file_id?: string;
  url?: string;
  loaded?: boolean;
  error?: string;
  // Layout properties for grid positioning
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  // Insights data for dashboard display
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

export interface AnalysisResult {
  summary: string;
  insights: string[];
  charts: ChartData[];
  metadata: Record<string, unknown>;
}

export interface DashboardHistoryItem {
  question: string;
  analysis: AnalysisResult;
  timestamp: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  charts: ChartData[];
  createdAt: Date;
  updatedAt: Date;
}