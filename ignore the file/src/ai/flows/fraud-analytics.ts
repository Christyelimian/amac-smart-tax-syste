'use server';

/**
 * @fileOverview Fraud analytics AI agent for pattern recognition and suspicious activity reporting.
 *
 * - analyzeFraud - A function that analyzes payment data for fraud.
 * - FraudAnalyticsInput - The input type for the analyzeFraud function.
 * - FraudAnalyticsOutput - The return type for the analyzeFraud function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FraudAnalyticsInputSchema = z.object({
  transactionData: z.string().describe('JSON string of transaction data to be analyzed.'),
  userProfileData: z.string().describe('JSON string of user profile data associated with transactions.'),
});
export type FraudAnalyticsInput = z.infer<typeof FraudAnalyticsInputSchema>;

const FraudAnalyticsOutputSchema = z.object({
  fraudScore: z.number().describe('A score indicating the likelihood of fraud (0-1).'),
  riskFactors: z.array(z.string()).describe('List of factors contributing to the fraud score.'),
  explanation: z.string().describe('Detailed explanation of the fraud analysis and identified risks.'),
});
export type FraudAnalyticsOutput = z.infer<typeof FraudAnalyticsOutputSchema>;

export async function analyzeFraud(input: FraudAnalyticsInput): Promise<FraudAnalyticsOutput> {
  return analyzeFraudFlow(input);
}

const analyzeFraudPrompt = ai.definePrompt({
  name: 'analyzeFraudPrompt',
  input: {schema: FraudAnalyticsInputSchema},
  output: {schema: FraudAnalyticsOutputSchema},
  prompt: `You are an expert in fraud detection, specializing in identifying payment anomalies and suspicious activities.

  Analyze the provided transaction data and user profile data to identify potential fraud risks.
  Provide a fraud score between 0 and 1, a list of risk factors contributing to the score, and a detailed explanation of the analysis.

  Transaction Data: {{{transactionData}}}
  User Profile Data: {{{userProfileData}}}

  Output a JSON object conforming to the FraudAnalyticsOutputSchema. Follow the schema descriptions closely. Be conservative in flagging fraud; only flag something as fraudulent if the evidence is strong.
  `,
});

const analyzeFraudFlow = ai.defineFlow(
  {
    name: 'analyzeFraudFlow',
    inputSchema: FraudAnalyticsInputSchema,
    outputSchema: FraudAnalyticsOutputSchema,
  },
  async input => {
    const {output} = await analyzeFraudPrompt(input);
    return output!;
  }
);
