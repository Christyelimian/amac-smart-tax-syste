'use server';

/**
 * @fileOverview Fraud detection AI agent.
 *
 * - detectFraud - A function that handles the fraud detection process.
 * - DetectFraudInput - The input type for the detectFraud function.
 * - DetectFraudOutput - The return type for the detectFraud function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectFraudInputSchema = z.object({
  transactionData: z.string().describe('JSON string of the transaction data to analyze.'),
  userProfile: z.string().describe('JSON string of the user profile data.'),
});
export type DetectFraudInput = z.infer<typeof DetectFraudInputSchema>;

const DetectFraudOutputSchema = z.object({
  isFraudulent: z.boolean().describe('Whether or not the transaction is likely fraudulent.'),
  fraudExplanation: z.string().describe('Explanation of why the transaction is considered fraudulent.'),
  riskScore: z.number().describe('A score indicating the risk level of the transaction (0-100).'),
  flagReasons: z.array(z.string()).describe('Specific reasons why the transaction was flagged.'),
});
export type DetectFraudOutput = z.infer<typeof DetectFraudOutputSchema>;

export async function detectFraud(input: DetectFraudInput): Promise<DetectFraudOutput> {
  return detectFraudFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectFraudPrompt',
  input: {schema: DetectFraudInputSchema},
  output: {schema: DetectFraudOutputSchema},
  prompt: `You are an expert fraud detection system. Analyze the provided transaction data and user profile to determine if the transaction is fraudulent.\n\nTransaction Data: {{{transactionData}}}\nUser Profile: {{{userProfile}}}\n\nBased on the data, determine if the transaction is fraudulent, provide an explanation, a risk score (0-100), and specific reasons for flagging the transaction.  The output should be valid JSON matching the schema.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const detectFraudFlow = ai.defineFlow(
  {
    name: 'detectFraudFlow',
    inputSchema: DetectFraudInputSchema,
    outputSchema: DetectFraudOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (e) {
      console.error('Fraud Detection Flow Failed', e);
      return {
        isFraudulent: false,
        fraudExplanation: 'An error occurred during fraud detection.',
        riskScore: 0,
        flagReasons: ['System Error'],
      };
    }
  }
);
