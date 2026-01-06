'use server';

/**
 * @fileOverview AI-powered route optimization for field collectors.
 *
 * - optimizeCollectionRoute - A function that optimizes collection routes.
 * - OptimizeCollectionRouteInput - The input type for the optimizeCollectionRoute function.
 * - OptimizeCollectionRouteOutput - The return type for the optimizeCollectionRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeCollectionRouteInputSchema = z.object({
  collectorId: z.string().describe('Unique identifier for the field collector.'),
  currentLocation: z
    .string()
    .describe(
      'Current GPS coordinates (latitude, longitude) of the collector, as a comma separated string.'
    ),
  targetLocations: z
    .string()
    .describe(
      'A list of GPS coordinates (latitude, longitude) of target locations for collection, separated by semicolons.'
    ),
  timeConstraint: z
    .string()
    .describe(
      'The amount of time the collector has to make collections, expressed as a number followed by the unit (e.g. 8 hours)'
    ),
});
export type OptimizeCollectionRouteInput = z.infer<typeof OptimizeCollectionRouteInputSchema>;

const OptimizeCollectionRouteOutputSchema = z.object({
  optimizedRoute: z
    .string()
    .describe(
      'An optimized route for the collector, represented as a sequence of GPS coordinates (latitude, longitude) separated by semicolons.'
    ),
  estimatedTravelTime: z
    .string()
    .describe('Estimated total travel time for the optimized route, expressed in hours.'),
  estimatedRevenue: z.number().describe('Estimated revenue collection for the optimized route.'),
  message: z.string().describe('Additional message or instructions for the collector.'),
});
export type OptimizeCollectionRouteOutput = z.infer<typeof OptimizeCollectionRouteOutputSchema>;

export async function optimizeCollectionRoute(
  input: OptimizeCollectionRouteInput
): Promise<OptimizeCollectionRouteOutput> {
  return optimizeCollectionRouteFlow(input);
}

const optimizeCollectionRoutePrompt = ai.definePrompt({
  name: 'optimizeCollectionRoutePrompt',
  input: {schema: OptimizeCollectionRouteInputSchema},
  output: {schema: OptimizeCollectionRouteOutputSchema},
  prompt: `You are an AI assistant that optimizes collection routes for field collectors to minimize travel time and maximize revenue collection.

  Given the collector's current location, target locations, and time constraints, generate an optimized route with estimated travel time and revenue.

  Collector ID: {{{collectorId}}}
  Current Location: {{{currentLocation}}}
  Target Locations: {{{targetLocations}}}
  Time Constraint: {{{timeConstraint}}}

  Provide the optimized route as a sequence of GPS coordinates separated by semicolons.
  Estimate the total travel time in hours and the potential revenue collection for the route.
  Include any relevant message or instructions for the collector.
  Consider real world conditions when optimizing the routes such as traffic conditions, road quality, and any other factors that would minimize travel time.
  Output the optimized route in a JSON format.
  `,
});

const optimizeCollectionRouteFlow = ai.defineFlow(
  {
    name: 'optimizeCollectionRouteFlow',
    inputSchema: OptimizeCollectionRouteInputSchema,
    outputSchema: OptimizeCollectionRouteOutputSchema,
  },
  async input => {
    const {output} = await optimizeCollectionRoutePrompt(input);
    return output!;
  }
);
