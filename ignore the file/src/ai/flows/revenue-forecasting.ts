// Revenue forecasting flow using AI to predict future revenue.
'use server';
/**
 * @fileOverview AI-powered predictive analytics for revenue projection and planning.
 *
 * - revenueForecasting - A function that handles the revenue forecasting process.
 * - RevenueForecastingInput - The input type for the revenueForecasting function.
 * - RevenueForecastingOutput - The return type for the revenueForecasting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RevenueForecastingInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical revenue data in CSV format. Columns should include date and revenue.'
    ),
  marketTrends: z.string().describe('Description of current market trends.'),
  economicIndicators: z.string().describe('Key economic indicators relevant to revenue.'),
  assumptions: z.string().describe('Assumptions for the forecasting model.'),
});
export type RevenueForecastingInput = z.infer<typeof RevenueForecastingInputSchema>;

const RevenueForecastingOutputSchema = z.object({
  projectedRevenue: z
    .string()
    .describe('Projected revenue for the next fiscal year.'),
  confidenceInterval: z
    .string()
    .describe('Confidence interval for the projected revenue.'),
  keyFactors: z
    .string()
    .describe('Key factors influencing the revenue projection.'),
  recommendations: z
    .string()
    .describe('Recommendations for resource allocation and budget management.'),
});
export type RevenueForecastingOutput = z.infer<typeof RevenueForecastingOutputSchema>;

export async function revenueForecasting(input: RevenueForecastingInput): Promise<RevenueForecastingOutput> {
  return revenueForecastingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'revenueForecastingPrompt',
  input: {schema: RevenueForecastingInputSchema},
  output: {schema: RevenueForecastingOutputSchema},
  prompt: `You are an expert financial analyst specializing in revenue forecasting for local governments.

You will use the following information to project revenue for the next fiscal year, provide a confidence interval, identify key influencing factors, and offer recommendations for resource allocation and budget management.

Historical Data: {{{historicalData}}}
Market Trends: {{{marketTrends}}}
Economic Indicators: {{{economicIndicators}}}
Assumptions: {{{assumptions}}}`,
});

const revenueForecastingFlow = ai.defineFlow(
  {
    name: 'revenueForecastingFlow',
    inputSchema: RevenueForecastingInputSchema,
    outputSchema: RevenueForecastingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
