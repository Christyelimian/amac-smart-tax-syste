// ===========================================
// AI ASSESSMENT SERVICE - CLAUDE API INTEGRATION
// ===========================================
// Uses Anthropic Claude for intelligent property/business valuations
// Handles complex cases where formula calculations are insufficient

import { supabase } from '../integrations/supabase/client';

export interface AIAssessmentRequest {
  revenueType: string;
  zone: string;
  assessmentData: Record<string, any>;
  context?: {
    location?: string;
    marketData?: any;
    comparableProperties?: any[];
    economicIndicators?: any;
  };
}

export interface AIAssessmentResponse {
  recommendedAmount: number;
  breakdown: Record<string, number>;
  justification: string;
  confidence: number; // 0-1
  comparableProperties?: any[];
  riskFactors?: string[];
  recommendations?: string[];
}

export interface AIAssessmentFormula {
  id: string;
  revenue_type_code: string;
  zone_id?: string;
  ai_prompt_template: string;
  ai_model: string;
  ai_temperature: number;
  is_active: boolean;
  context_requirements?: string[];
}

export class AIAssessmentService {
  private readonly API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly MODEL = 'claude-sonnet-4-20250514';

  /**
   * Perform AI-powered assessment
   */
  async performAssessment(request: AIAssessmentRequest): Promise<AIAssessmentResponse> {
    try {
      // Get AI formula for this revenue type
      const formula = await this.getAIFormula(request.revenueType, request.zone);
      if (!formula) {
        throw new Error('No AI assessment formula available for this revenue type');
      }

      // Build prompt with context
      const prompt = this.buildAssessmentPrompt(formula, request);

      // Call Claude API
      const response = await this.callClaudeAPI(prompt, formula.ai_temperature);

      // Parse and validate response
      const assessment = this.parseAssessmentResponse(response);

      // Store assessment result for audit trail
      await this.storeAssessmentResult(request, assessment, formula);

      return assessment;

    } catch (error) {
      console.error('AI Assessment error:', error);
      throw new Error(`AI assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get AI formula for revenue type and zone
   */
  private async getAIFormula(revenueTypeCode: string, zoneId?: string): Promise<AIAssessmentFormula | null> {
    try {
      let query = supabase
        .from('assessment_formulas')
        .select('*')
        .eq('revenue_type_code', revenueTypeCode)
        .eq('formula_type', 'ai_assisted')
        .eq('is_active', true);

      // Try zone-specific first, then fallback to general
      if (zoneId) {
        const { data: zoneSpecific } = await query.eq('zone_id', zoneId).single();
        if (zoneSpecific) return zoneSpecific;
      }

      // Fallback to general formula
      const { data: general } = await query.is('zone_id', null).single();
      return general || null;

    } catch (error) {
      console.error('Error fetching AI formula:', error);
      return null;
    }
  }

  /**
   * Build assessment prompt for Claude
   */
  private buildAssessmentPrompt(formula: AIAssessmentFormula, request: AIAssessmentRequest): string {
    let prompt = formula.ai_prompt_template;

    // Replace placeholders with actual data
    prompt = prompt.replace('{{revenue_type}}', request.revenueType);
    prompt = prompt.replace('{{zone}}', request.zone);

    // Add assessment data
    prompt += '\n\nASSESSMENT DATA:\n';
    prompt += JSON.stringify(request.assessmentData, null, 2);

    // Add context if available
    if (request.context) {
      prompt += '\n\nCONTEXT INFORMATION:\n';
      if (request.context.location) {
        prompt += `Location: ${request.context.location}\n`;
      }
      if (request.context.marketData) {
        prompt += `Market Data: ${JSON.stringify(request.context.marketData)}\n`;
      }
      if (request.context.comparableProperties) {
        prompt += `Comparable Properties: ${JSON.stringify(request.context.comparableProperties)}\n`;
      }
      if (request.context.economicIndicators) {
        prompt += `Economic Indicators: ${JSON.stringify(request.context.economicIndicators)}\n`;
      }
    }

    // Add output format instructions
    prompt += '\n\nREQUIRED OUTPUT FORMAT:\n';
    prompt += `Return a JSON object with this exact structure:
{
  "recommended_amount": number,
  "breakdown": {
    "base_fee": number,
    "location_premium": number,
    "size_premium": number,
    "market_adjustment": number,
    "other_factors": number
  },
  "justification": "string explaining the assessment methodology and reasoning",
  "confidence": number between 0-1,
  "comparable_properties": [
    {
      "property": "description",
      "rate": number,
      "comparison_reason": "string"
    }
  ],
  "risk_factors": ["array of potential risk factors"],
  "recommendations": ["array of recommendations for reassessment or verification"]
}`;

    return prompt;
  }

  /**
   * Call Claude API
   */
  private async callClaudeAPI(prompt: string, temperature: number = 0.1): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.MODEL,
        max_tokens: 2000,
        temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return result.content[0].text;
  }

  /**
   * Parse Claude's response into structured assessment
   */
  private parseAssessmentResponse(response: string): AIAssessmentResponse {
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const assessment = JSON.parse(jsonMatch[1]);

      // Validate required fields
      if (typeof assessment.recommended_amount !== 'number') {
        throw new Error('Invalid recommended_amount in AI response');
      }

      if (!assessment.justification || typeof assessment.justification !== 'string') {
        throw new Error('Invalid justification in AI response');
      }

      // Ensure confidence is between 0-1
      assessment.confidence = Math.max(0, Math.min(1, assessment.confidence || 0.8));

      return assessment;

    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to parse AI assessment response');
    }
  }

  /**
   * Store assessment result for audit trail
   */
  private async storeAssessmentResult(
    request: AIAssessmentRequest,
    assessment: AIAssessmentResponse,
    formula: AIAssessmentFormula
  ): Promise<void> {
    try {
      await supabase.from('ai_assessment_logs').insert({
        revenue_type_code: request.revenueType,
        zone_id: request.zone,
        assessment_data: request.assessmentData,
        ai_response: assessment,
        formula_used: formula.id,
        model_version: formula.ai_model,
        confidence_score: assessment.confidence,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to store AI assessment log:', error);
      // Don't throw - logging failure shouldn't break assessment
    }
  }

  /**
   * Get assessment history for auditing
   */
  async getAssessmentHistory(revenueTypeCode: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_assessment_logs')
        .select('*')
        .eq('revenue_type_code', revenueTypeCode)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      return [];
    }
  }

  /**
   * Validate AI assessment result
   */
  validateAssessment(assessment: AIAssessmentResponse): string[] {
    const errors: string[] = [];

    if (assessment.recommendedAmount <= 0) {
      errors.push('Recommended amount must be positive');
    }

    if (assessment.confidence < 0 || assessment.confidence > 1) {
      errors.push('Confidence must be between 0 and 1');
    }

    if (!assessment.justification || assessment.justification.trim().length < 10) {
      errors.push('Justification must be at least 10 characters');
    }

    if (!assessment.breakdown || Object.keys(assessment.breakdown).length === 0) {
      errors.push('Breakdown must contain at least one item');
    }

    // Check if breakdown sums match recommended amount
    const breakdownSum = Object.values(assessment.breakdown).reduce((sum: number, val: any) =>
      sum + (typeof val === 'number' ? val : 0), 0
    );

    if (Math.abs(breakdownSum - assessment.recommendedAmount) > 1) {
      errors.push('Breakdown components must sum to recommended amount');
    }

    return errors;
  }
}

// Export singleton
export const aiAssessmentService = new AIAssessmentService();
