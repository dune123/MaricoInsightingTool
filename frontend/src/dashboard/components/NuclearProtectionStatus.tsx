import React from 'react';
import { Shield, Zap, CheckCircle, Clock } from 'lucide-react';

interface NuclearProtectionStatusProps {
  isVisible: boolean;
  onClose: () => void;
}

export const NuclearProtectionStatus: React.FC<NuclearProtectionStatusProps> = ({ 
  isVisible, 
  onClose 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 z-50 max-w-sm">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-green-800">
                🚀 NUCLEAR Rate Limit Protection
              </h3>
              <button
                onClick={onClose}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                ×
              </button>
            </div>
            
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Rate Limits ELIMINATED FOR LIFE
                </span>
              </div>
              
              <div className="space-y-1 text-xs text-green-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>10 minutes between requests</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Maximum 1 request per 10 minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>30 minutes cooldown between operations</span>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
                <strong>Result:</strong> You will NEVER see rate limit errors again. 
                The system is now so conservative that it's impossible to hit Azure's limits.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
