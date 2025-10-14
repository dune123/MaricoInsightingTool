import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface RateLimitStatusProps {
  isVisible: boolean;
  waitTime?: number;
  onClose: () => void;
}

export const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ 
  isVisible, 
  waitTime = 0, 
  onClose 
}) => {
  const [timeLeft, setTimeLeft] = useState(waitTime);

  useEffect(() => {
    if (!isVisible || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {timeLeft > 0 ? (
              <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-yellow-800">
                Rate Limit Protection
              </h3>
              <button
                onClick={onClose}
                className="text-yellow-600 hover:text-yellow-800 text-sm"
              >
                ×
              </button>
            </div>
            
            {timeLeft > 0 ? (
              <div className="mt-2">
                <p className="text-sm text-yellow-700">
                  Please wait <span className="font-mono font-bold">{timeLeft}</span> seconds before your next request.
                </p>
                <div className="mt-2 bg-yellow-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((waitTime - timeLeft) / waitTime) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  This prevents API rate limit errors and ensures reliable service.
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-green-700">
                  ✅ Ready to process your request!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
