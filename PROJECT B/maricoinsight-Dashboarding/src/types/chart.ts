export interface ChartData {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'donut' | 'kpi';
  title: string;
  description?: string;
  data: any[];
  config: {
    xKey?: string;
    yKey?: string | string[];
    nameKey?: string;
    valueKey?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    // KPI-specific config
    value?: string | number;
    trend?: number;
    trendDirection?: 'up' | 'down' | 'neutral';
    period?: string;
    unit?: string;
    target?: number;
  };
  // Layout properties for grid positioning
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  charts: ChartData[];
  metadata: Record<string, any>;
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