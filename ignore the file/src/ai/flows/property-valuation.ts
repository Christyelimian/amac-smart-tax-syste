'use server';

/**
 * @fileOverview Property valuation AI agent.
 *
 * - propertyValuation - A function that handles the property valuation process.
 * - PropertyValuationInput - The input type for the propertyValuation function.
 * - PropertyValuationOutput - The return type for the propertyValuation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PropertyValuationInputSchema = z.object({
  propertyAddress: z.string().describe('The address of the property to be valued.'),
  propertyType: z.string().describe('The type of property (e.g., residential, commercial, industrial).'),
  propertySize: z.number().describe('The size of the property in square meters.'),
  numberOfBedrooms: z.number().describe('The number of bedrooms in the property (if applicable).'),
  numberOfBathrooms: z.number().describe('The number of bathrooms in the property (if applicable).'),
  landSize: z.number().describe('The land size in square meters.'),
  buildingAge: z.number().describe('The age of the building in years.'),
  locationDescription: z.string().describe('A description of the location of the property.'),
  marketData: z.string().describe('Market data for comparable properties in the area.'),
});
export type PropertyValuationInput = z.infer<typeof PropertyValuationInputSchema>;

const PropertyValuationOutputSchema = z.object({
  estimatedValue: z.number().describe('The estimated value of the property in Naira.'),
  valuationDate: z.string().describe('The date of the valuation.'),
  confidenceScore: z.number().describe('A score indicating the confidence level of the valuation (0-1).'),
  factorsInfluencingValuation: z.string().describe('A description of the factors that influenced the valuation.'),
});
export type PropertyValuationOutput = z.infer<typeof PropertyValuationOutputSchema>;

export async function propertyValuation(input: PropertyValuationInput): Promise<PropertyValuationOutput> {
  return propertyValuationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'propertyValuationPrompt',
  input: {schema: PropertyValuationInputSchema},
  output: {schema: PropertyValuationOutputSchema},
  prompt: `You are an expert property valuer specializing in valuing properties in Nigeria. You are provided with property details and market data, and you will use this information to estimate the property value. Ensure the valuation is fair and accurate. Convert the value to Naira.

Property Address: {{{propertyAddress}}}
Property Type: {{{propertyType}}}
Property Size: {{{propertySize}}} square meters
Number of Bedrooms: {{{numberOfBedrooms}}}
Number of Bathrooms: {{{numberOfBathrooms}}}
Land Size: {{{landSize}}} square meters
Building Age: {{{buildingAge}}} years
Location Description: {{{locationDescription}}}
Market Data: {{{marketData}}}

Provide the estimated value in Naira, the valuation date, a confidence score (0-1), and a description of the factors influencing the valuation.
`,
});

const propertyValuationFlow = ai.defineFlow(
  {
    name: 'propertyValuationFlow',
    inputSchema: PropertyValuationInputSchema,
    outputSchema: PropertyValuationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
