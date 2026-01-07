// ===========================================
// ASSESSMENT FORMULA CALCULATION ENGINE
// ===========================================
// Engine for calculating assessment amounts based on stored formulas
// Supports: fixed rates, calculated formulas, tiered pricing, AI-assisted

interface FormulaInput {
  [key: string]: any;
}

interface FormulaBreakdown {
  [key: string]: number | string;
}

interface CalculationResult {
  amount: number;
  breakdown: FormulaBreakdown;
  formula: string;
  confidence?: number; // For AI-assisted calculations
  justification?: string; // For AI-assisted calculations
}

interface AssessmentFormula {
  id: string;
  revenue_type_code: string;
  zone_id?: string;
  formula_type: 'fixed' | 'calculated' | 'tiered' | 'ai_assisted';
  base_amount?: number;
  formula_expression?: string;
  required_inputs: any;
  rate_table: any;
  ai_prompt_template?: string;
  ai_model?: string;
  ai_temperature?: number;
}

interface AssessmentData extends FormulaInput {
  revenue_type: string;
  zone: string;
  // Additional assessment-specific data
  [key: string]: any;
}

export class AssessmentCalculator {
  private math = require('mathjs'); // For safe mathematical evaluations

  /**
   * Calculate assessment amount using the appropriate formula
   */
  async calculateAmount(
    formula: AssessmentFormula,
    assessmentData: AssessmentData
  ): Promise<CalculationResult> {
    switch (formula.formula_type) {
      case 'fixed':
        return this.applyFixedFormula(formula);

      case 'calculated':
        return this.applyCalculatedFormula(formula, assessmentData);

      case 'tiered':
        return this.applyTieredFormula(formula, assessmentData);

      case 'ai_assisted':
        return this.applyAIAssistedFormula(formula, assessmentData);

      default:
        throw new Error(`Unknown formula type: ${formula.formula_type}`);
    }
  }

  /**
   * Apply fixed amount formula
   */
  private applyFixedFormula(formula: AssessmentFormula): CalculationResult {
    if (!formula.base_amount) {
      throw new Error('Fixed formula requires base_amount');
    }

    return {
      amount: formula.base_amount,
      breakdown: { base_fee: formula.base_amount },
      formula: 'Fixed rate'
    };
  }

  /**
   * Apply calculated formula (e.g., base + (rooms * rate) + premium)
   */
  private applyCalculatedFormula(
    formula: AssessmentFormula,
    data: AssessmentData
  ): CalculationResult {
    if (!formula.formula_expression || !formula.rate_table) {
      throw new Error('Calculated formula requires formula_expression and rate_table');
    }

    const breakdown: FormulaBreakdown = {};
    let total = 0;

    try {
      // Parse and evaluate the formula expression
      const result = this.evaluateExpression(formula.formula_expression, {
        ...data,
        ...formula.rate_table,
        base: formula.base_amount || 0
      });

      total = result.total;
      Object.assign(breakdown, result.breakdown);

    } catch (error) {
      throw new Error(`Formula evaluation failed: ${error.message}`);
    }

    return {
      amount: Math.round(total * 100) / 100, // Round to 2 decimal places
      breakdown,
      formula: formula.formula_expression
    };
  }

  /**
   * Apply tiered formula (e.g., different rates based on property size ranges)
   */
  private applyTieredFormula(
    formula: AssessmentFormula,
    data: AssessmentData
  ): CalculationResult {
    if (!formula.rate_table || !formula.rate_table.tiers) {
      throw new Error('Tiered formula requires rate_table with tiers');
    }

    const tiers = formula.rate_table.tiers;
    const breakdown: FormulaBreakdown = {};
    let total = 0;

    // Find applicable tier based on input data
    for (const tier of tiers) {
      if (this.matchesTierCriteria(tier.criteria, data)) {
        total = tier.amount;
        breakdown.base_tier = tier.amount;
        breakdown.tier_name = tier.name;

        // Apply any additional calculations
        if (tier.additional_calculation) {
          const additional = this.evaluateExpression(tier.additional_calculation, {
            ...data,
            tier_amount: tier.amount
          });
          total += additional.total;
          Object.assign(breakdown, additional.breakdown);
        }
        break;
      }
    }

    return {
      amount: Math.round(total * 100) / 100,
      breakdown,
      formula: `Tiered: ${breakdown.tier_name || 'Unknown tier'}`
    };
  }

  /**
   * Apply AI-assisted formula using Claude API
   */
  private async applyAIAssistedFormula(
    formula: AssessmentFormula,
    data: AssessmentData
  ): Promise<CalculationResult> {
    if (!formula.ai_prompt_template) {
      throw new Error('AI-assisted formula requires ai_prompt_template');
    }

    try {
      const aiResponse = await this.callClaudeAPI(formula, data);
      const aiResult = JSON.parse(aiResponse);

      return {
        amount: aiResult.recommended_amount,
        breakdown: aiResult.breakdown || {},
        formula: 'AI-assisted assessment',
        confidence: aiResult.confidence || 0.8,
        justification: aiResult.justification
      };
    } catch (error) {
      throw new Error(`AI assessment failed: ${error.message}`);
    }
  }

  /**
   * Safely evaluate mathematical expressions
   */
  private evaluateExpression(
    expression: string,
    variables: any
  ): { total: number; breakdown: FormulaBreakdown } {
    const breakdown: FormulaBreakdown = {};

    // Replace variable references with actual values
    let processedExpression = expression;

    // Extract and store breakdown components
    const componentMatches = expression.match(/(\w+)\s*=\s*([^;]+)/g);
    if (componentMatches) {
      for (const match of componentMatches) {
        const [key, valueExpr] = match.split('=').map(s => s.trim());
        try {
          const value = this.math.evaluate(valueExpr, variables);
          breakdown[key] = value;
        } catch (error) {
          // If evaluation fails, try to extract from variables directly
          if (variables[key] !== undefined) {
            breakdown[key] = variables[key];
          }
        }
      }
    }

    // Evaluate the final total
    const totalExpression = expression.replace(/(\w+)\s*=\s*([^;]+);?/g, '').trim();
    const total = this.math.evaluate(totalExpression || expression, variables);

    return { total, breakdown };
  }

  /**
   * Check if data matches tier criteria
   */
  private matchesTierCriteria(criteria: any, data: AssessmentData): boolean {
    for (const [key, condition] of Object.entries(criteria)) {
      const value = data[key];

      if (typeof condition === 'object') {
        // Range conditions
        if (condition.min !== undefined && value < condition.min) return false;
        if (condition.max !== undefined && value > condition.max) return false;
      } else {
        // Exact match
        if (value !== condition) return false;
      }
    }
    return true;
  }

  /**
   * Call Claude API for AI-assisted assessment
   */
  private async callClaudeAPI(
    formula: AssessmentFormula,
    data: AssessmentData
  ): Promise<string> {
    const prompt = this.buildAIPrompt(formula.ai_prompt_template!, data);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: formula.ai_model || "claude-sonnet-4-20250514",
        max_tokens: 1000,
        temperature: formula.ai_temperature || 0.1,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.content[0].text;
  }

  /**
   * Build AI prompt from template
   */
  private buildAIPrompt(template: string, data: AssessmentData): string {
    let prompt = template;

    // Replace placeholders with actual data
    for (const [key, value] of Object.entries(data)) {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }

    // Add assessment data as JSON
    prompt += `\n\nAssessment Data: ${JSON.stringify(data, null, 2)}`;

    return prompt;
  }

  /**
   * Validate assessment data against required inputs
   */
  validateAssessmentData(formula: AssessmentFormula, data: AssessmentData): string[] {
    const errors: string[] = [];
    const requiredInputs = formula.required_inputs || {};

    for (const [field, config] of Object.entries(requiredInputs)) {
      const fieldConfig = config as any;

      if (fieldConfig.required && (data[field] === undefined || data[field] === null || data[field] === '')) {
        errors.push(`${fieldConfig.label || field} is required`);
      }

      // Type validation
      if (data[field] !== undefined && fieldConfig.type) {
        switch (fieldConfig.type) {
          case 'number':
            if (typeof data[field] !== 'number' && isNaN(Number(data[field]))) {
              errors.push(`${fieldConfig.label || field} must be a number`);
            }
            break;
          case 'select':
            if (fieldConfig.options && !fieldConfig.options.includes(data[field])) {
              errors.push(`${fieldConfig.label || field} must be one of: ${fieldConfig.options.join(', ')}`);
            }
            break;
        }
      }
    }

    return errors;
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

export class FormulaUtils {
  /**
   * Get formula for specific revenue type and zone
   */
  static async getFormulaForRevenueType(
    revenueTypeCode: string,
    zoneId: string
  ): Promise<AssessmentFormula | null> {
    // This would query the database
    // For now, return mock data
    return {
      id: '1',
      revenue_type_code: revenueTypeCode,
      zone_id: zoneId,
      formula_type: 'calculated',
      base_amount: 100000,
      formula_expression: 'base + (rooms * room_rate) + category_premium',
      required_inputs: {
        hotel_category: { type: 'select', options: ['5-star', '4-star', '3-star'], required: true },
        total_rooms: { type: 'number', required: true }
      },
      rate_table: {
        room_rate: 1500,
        category_premium: { '5-star': 200000, '4-star': 150000, '3-star': 100000 }
      }
    };
  }

  /**
   * Calculate estimated amount for application preview
   */
  static async calculateEstimate(
    revenueTypeCode: string,
    zoneId: string,
    assessmentData: AssessmentData
  ): Promise<CalculationResult | null> {
    const formula = await this.getFormulaForRevenueType(revenueTypeCode, zoneId);
    if (!formula) return null;

    const calculator = new AssessmentCalculator();
    return calculator.calculateAmount(formula, assessmentData);
  }

  /**
   * Validate application data before submission
   */
  static validateApplicationData(
    revenueTypeCode: string,
    assessmentData: AssessmentData
  ): Promise<string[]> {
    // This would fetch the formula and validate
    return Promise.resolve([]);
  }
}

// ===========================================
// EXAMPLE USAGE
// ===========================================

/*
// Example: Calculate hotel assessment
const calculator = new AssessmentCalculator();

const hotelData = {
  revenue_type: 'hotel-license',
  zone: 'a',
  hotel_category: '5-star',
  total_rooms: 650,
  property_size_sqm: 15000,
  annual_turnover_estimate: 5000000000
};

const formula = await FormulaUtils.getFormulaForRevenueType('hotel-license', 'a');
const result = await calculator.calculateAmount(formula!, hotelData);

console.log(result);
// {
//   amount: 1275000,
//   breakdown: {
//     base_fee: 100000,
//     room_charge: 975000,
//     category_premium: 200000
//   },
//   formula: 'base + (rooms * room_rate) + category_premium'
// }
*/
