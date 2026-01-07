import React, { useState } from 'react';
import {
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader,
  Info,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react';
import { aiAssessmentService, AIAssessmentRequest, AIAssessmentResponse } from '../../services/aiAssessmentService';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface AIAssessmentPanelProps {
  revenueType: string;
  zone: string;
  assessmentData: Record<string, any>;
  currentAmount: number;
  onAssessmentComplete?: (assessment: AIAssessmentResponse) => void;
}

const AIAssessmentPanel: React.FC<AIAssessmentPanelProps> = ({
  revenueType,
  zone,
  assessmentData,
  currentAmount,
  onAssessmentComplete
}) => {
  const [isAssessing, setIsAssessing] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<AIAssessmentResponse | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);

  const handleAIAssessment = async () => {
    try {
      setIsAssessing(true);
      toast.info('AI is analyzing the property assessment...');

      const request: AIAssessmentRequest = {
        revenueType,
        zone,
        assessmentData,
        context: {
          location: assessmentData.business_address || assessmentData.address,
          marketData: {
            zone_premium: zone === 'a' ? 1.5 : zone === 'b' ? 1.2 : 1.0,
            economic_indicators: {
              inflation_rate: 0.15, // 15% inflation
              gdp_growth: 0.03, // 3% growth
              exchange_rate: 1500 // NGN/USD
            }
          }
        }
      };

      const assessment = await aiAssessmentService.performAssessment(request);

      setAiAssessment(assessment);

      if (onAssessmentComplete) {
        onAssessmentComplete(assessment);
      }

      toast.success('AI assessment completed!');

      // Load assessment history
      await loadAssessmentHistory();

    } catch (error) {
      console.error('AI Assessment failed:', error);
      toast.error(error instanceof Error ? error.message : 'AI assessment failed');
    } finally {
      setIsAssessing(false);
    }
  };

  const loadAssessmentHistory = async () => {
    try {
      const history = await aiAssessmentService.getAssessmentHistory(revenueType, 5);
      setAssessmentHistory(history);
    } catch (error) {
      console.warn('Failed to load assessment history:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Assessment</h3>
          <p className="text-sm text-gray-600">Get intelligent property valuation using advanced AI</p>
        </div>
      </div>

      {/* Current vs AI Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Formula-Based Amount</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(currentAmount)}</div>
        </div>

        {aiAssessment && (
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">AI Recommended Amount</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(aiAssessment.recommendedAmount)}</div>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${getConfidenceColor(aiAssessment.confidence)}`}>
              <Target className="w-3 h-3" />
              {getConfidenceLabel(aiAssessment.confidence)}
            </div>
          </div>
        )}
      </div>

      {/* AI Assessment Button */}
      {!aiAssessment && (
        <div className="mb-6">
          <Button
            onClick={handleAIAssessment}
            disabled={isAssessing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isAssessing ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                AI is analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Get AI Assessment
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            AI analysis considers market data, comparables, and economic factors
          </p>
        </div>
      )}

      {/* AI Assessment Results */}
      {aiAssessment && (
        <div className="space-y-6">
          {/* Confidence and Summary */}
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">AI Assessment Summary</h4>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(aiAssessment.confidence)}`}>
                {Math.round(aiAssessment.confidence * 100)}% Confidence
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 mb-4">
              <p>{aiAssessment.justification}</p>
            </div>

            {/* Amount Breakdown */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Amount Breakdown
              </h5>
              <div className="space-y-2">
                {Object.entries(aiAssessment.breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-medium">{formatCurrency(value as number)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total:</span>
                    <span>{formatCurrency(aiAssessment.recommendedAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {aiAssessment.riskFactors && aiAssessment.riskFactors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Factors to Consider
              </h4>
              <ul className="space-y-1 text-sm text-yellow-700">
                {aiAssessment.riskFactors.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {aiAssessment.recommendations && aiAssessment.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                AI Recommendations
              </h4>
              <ul className="space-y-1 text-sm text-blue-700">
                {aiAssessment.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Comparable Properties */}
          {aiAssessment.comparableProperties && aiAssessment.comparableProperties.length > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Market Comparables Used
              </h4>
              <div className="space-y-3">
                {aiAssessment.comparableProperties.map((comp, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800">{comp.property}</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(comp.rate)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{comp.comparison_reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assessment History */}
          {assessmentHistory.length > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-3">Recent AI Assessments</h4>
              <div className="space-y-2">
                {assessmentHistory.slice(0, 3).map((hist, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {new Date(hist.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(hist.ai_response?.recommended_amount || 0)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceColor(hist.confidence_score)}`}>
                      {Math.round((hist.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About AI Assessment</p>
            <p className="mb-2">
              AI-powered assessment uses advanced algorithms and market data to provide intelligent property valuations.
              It considers location premiums, market comparables, economic indicators, and property characteristics.
            </p>
            <p className="text-xs">
              <strong>Best for:</strong> High-value properties, complex commercial spaces, luxury hotels, and unique business types
              where standard formulas may not capture full value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssessmentPanel;
