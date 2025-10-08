import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Zap, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface PerformanceMetrics {
  totalResponseTime: number;
  averageResponseTime: number;
  fastestResponse: number;
  slowestResponse: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTimeSeconds: number;
  fastestResponseSeconds: number;
  slowestResponseSeconds: number;
  successRate: number;
}

interface ApiCallStats {
  totalCalls: number;
  sessionDuration: number;
  callsPerMinute: number;
}

interface PerformanceMonitorProps {
  azureService: any;
  isVisible?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  azureService, 
  isVisible = false 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [apiStats, setApiStats] = useState<ApiCallStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!azureService || !isVisible) return;

    const updateMetrics = () => {
      try {
        const performanceMetrics = azureService.getPerformanceMetrics();
        const apiCallStats = azureService.getApiCallStats();
        
        setMetrics(performanceMetrics);
        setApiStats(apiCallStats);
      } catch (error) {
        console.warn('Failed to get performance metrics:', error);
      }
    };

    // Update metrics immediately
    updateMetrics();

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [azureService, isVisible]);

  if (!isVisible || !metrics || !apiStats) {
    return null;
  }

  const getPerformanceStatus = (responseTimeSeconds: number) => {
    if (responseTimeSeconds <= 15) return { status: 'excellent', color: 'bg-green-500', text: 'Excellent' };
    if (responseTimeSeconds <= 25) return { status: 'good', color: 'bg-yellow-500', text: 'Good' };
    if (responseTimeSeconds <= 40) return { status: 'fair', color: 'bg-orange-500', text: 'Fair' };
    return { status: 'poor', color: 'bg-red-500', text: 'Poor' };
  };

  const getSuccessRateStatus = (rate: number) => {
    if (rate >= 95) return { status: 'excellent', color: 'bg-green-500', text: 'Excellent' };
    if (rate >= 90) return { status: 'good', color: 'bg-yellow-500', text: 'Good' };
    if (rate >= 80) return { status: 'fair', color: 'bg-orange-500', text: 'Fair' };
    return { status: 'poor', color: 'bg-red-500', text: 'Poor' };
  };

  const avgStatus = getPerformanceStatus(metrics.averageResponseTimeSeconds);
  const successStatus = getSuccessRateStatus(metrics.successRate);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-2 border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span>Performance Monitor</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '−' : '+'}
            </button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs text-gray-600">Avg Response</span>
              </div>
              <div className="text-lg font-bold">{metrics.averageResponseTimeSeconds}s</div>
              <Badge 
                variant="outline" 
                className={`text-xs ${avgStatus.color} text-white border-0`}
              >
                {avgStatus.text}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-3 w-3" />
                <span className="text-xs text-gray-600">Success Rate</span>
              </div>
              <div className="text-lg font-bold">{metrics.successRate.toFixed(1)}%</div>
              <Badge 
                variant="outline" 
                className={`text-xs ${successStatus.color} text-white border-0`}
              >
                {successStatus.text}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Performance vs Target</span>
              <span>{metrics.averageResponseTimeSeconds}s / 25s</span>
            </div>
            <Progress 
              value={Math.min((25 / metrics.averageResponseTimeSeconds) * 100, 100)} 
              className="h-2"
            />
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Fastest:</span>
                  <div className="font-medium">{metrics.fastestResponseSeconds}s</div>
                </div>
                <div>
                  <span className="text-gray-600">Slowest:</span>
                  <div className="font-medium">{metrics.slowestResponseSeconds}s</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Total Calls:</span>
                  <div className="font-medium">{apiStats.totalCalls}</div>
                </div>
                <div>
                  <span className="text-gray-600">Calls/min:</span>
                  <div className="font-medium">{apiStats.callsPerMinute}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Success:</span>
                  <div className="font-medium text-green-600">{metrics.successfulRequests}</div>
                </div>
                <div>
                  <span className="text-gray-600">Failed:</span>
                  <div className="font-medium text-red-600">{metrics.failedRequests}</div>
                </div>
              </div>

              {/* Performance Tips */}
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-600 mb-1">Optimization Tips:</div>
                <div className="space-y-1 text-xs">
                  {metrics.averageResponseTimeSeconds > 25 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Consider reducing query complexity</span>
                    </div>
                  )}
                  {metrics.successRate < 95 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Check network stability</span>
                    </div>
                  )}
                  {metrics.averageResponseTimeSeconds <= 15 && metrics.successRate >= 95 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Performance is optimal</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;
