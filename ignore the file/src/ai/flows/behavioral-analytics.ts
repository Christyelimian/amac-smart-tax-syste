// src/ai/flows/behavioral-analytics.ts
'use server';

/**
 * @fileOverview Implements behavioral analysis of taxpayers using AI.
 *
 * - analyzeTaxpayerBehavior - Analyzes taxpayer behavior and provides insights.
 * - AnalyzeTaxpayerBehaviorInput - The input type for the analyzeTaxpayerBehavior function.
 * - AnalyzeTaxpayerBehaviorOutput - The return type for the analyzeTaxpayerBehavior function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTaxpayerBehaviorInputSchema = z.object({
  taxpayerId: z.string().describe('Unique identifier for the taxpayer.'),
  transactionHistory: z.string().describe('Detailed history of transactions for the taxpayer.'),
  demographicData: z.string().describe('Demographic information about the taxpayer.'),
  feedbackData: z.string().describe('Feedback provided by the taxpayer.'),
});
export type AnalyzeTaxpayerBehaviorInput = z.infer<typeof AnalyzeTaxpayerBehaviorInputSchema>;

const AnalyzeTaxpayerBehaviorOutputSchema = z.object({
  behavioralInsights: z.string().describe('Insights into the taxpayer behavior, including patterns and trends.'),
  serviceRecommendations: z.string().describe('Recommendations for improved service delivery and support.'),
  riskAssessment: z.string().describe('Risk assessment based on the taxpayer behavior.'),
});
export type AnalyzeTaxpayerBehaviorOutput = z.infer<typeof AnalyzeTaxpayerBehaviorOutputSchema>;

export async function analyzeTaxpayerBehavior(input: AnalyzeTaxpayerBehaviorInput): Promise<AnalyzeTaxpayerBehaviorOutput> {
  return analyzeTaxpayerBehaviorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTaxpayerBehaviorPrompt',
  input: {schema: AnalyzeTaxpayerBehaviorInputSchema},
  output: {schema: AnalyzeTaxpayerBehaviorOutputSchema},
  prompt: `You are an AI assistant that analyzes taxpayer behavior to provide insights and recommendations.

  Analyze the provided taxpayer data and generate insights into their behavior.
  Provide recommendations for improved service delivery and support based on the analysis.
  Assess the risk associated with the taxpayer based on their behavior.

  Taxpayer ID: {{{taxpayerId}}}
  Transaction History: {{{transactionHistory}}}
  Demographic Data: {{{demographicData}}}
  Feedback Data: {{{feedbackData}}}

  Output:
  - Behavioral Insights: Describe any observed patterns or trends in the taxpayer's behavior.
  - Service Recommendations: Suggest ways to improve service delivery and support for the taxpayer.
  - Risk Assessment: Assess the risk associated with the taxpayer based on their behavior.
  `,
});

const analyzeTaxpayerBehaviorFlow = ai.defineFlow(
  {
    name: 'analyzeTaxpayerBehaviorFlow',
    inputSchema: AnalyzeTaxpayerBehaviorInputSchema,
    outputSchema: AnalyzeTaxpayerBehaviorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
