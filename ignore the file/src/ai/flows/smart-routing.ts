'use server';

/**
 * @fileOverview AI-powered route optimization for field collectors.
 *
 * - optimizeRoute - A function that optimizes the daily routes for field collectors.
 * - OptimizeRouteInput - The input type for the optimizeRoute function.
 * - OptimizeRouteOutput - The return type for the optimizeRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeRouteInputSchema = z.object({
  collectorId: z.string().describe('Unique identifier for the field collector.'),
  locations: z
    .array(z.object({
      address: z.string().describe('The full street address of the location.'),
      latitude: z.number().describe('Latitude of the location.'),
      longitude: z.number().describe('Longitude of the location.'),
      payerName: z.string().describe('Name of the payer at this location.'),
      priority: z.enum(['high', 'medium', 'low']).describe('Priority of the location (high, medium, low).'),
    }))
    .describe('An array of locations to visit, including address, coordinates, and priority.'),
  startTime: z.string().describe('The desired start time for the route, in ISO format.'),
  endTime: z.string().describe('The desired end time for the route, in ISO format.'),
});
export type OptimizeRouteInput = z.infer<typeof OptimizeRouteInputSchema>;

const OptimizeRouteOutputSchema = z.object({
  optimizedRoute: z.array(z.object({
    address: z.string().describe('The full street address of the location.'),
    latitude: z.number().describe('Latitude of the location.'),
    longitude: z.number().describe('Longitude of the location.'),
    payerName: z.string().describe('Name of the payer at this location.'),
    priority: z.enum(['high', 'medium', 'low']).describe('Priority of the location (high, medium, low).'),
    arrivalTime: z.string().describe('Estimated arrival time at this location, in ISO format.'),
  })).describe('An array of locations in the optimized route, with estimated arrival times.'),
  totalTravelTime: z.string().describe('The total estimated travel time for the route.'),
  unvisitedLocations: z.array(z.object({
    address: z.string().describe('The full street address of the location.'),
    latitude: z.number().describe('Latitude of the location.'),
    longitude: z.number().describe('Longitude of the location.'),
    payerName: z.string().describe('Name of the payer at this location.'),
    priority: z.enum(['high', 'medium', 'low']).describe('Priority of the location (high, medium, low).'),
  })).optional().describe('List of locations which could not be visited within the specified time window.'),
});
export type OptimizeRouteOutput = z.infer<typeof OptimizeRouteOutputSchema>;

export async function optimizeRoute(input: OptimizeRouteInput): Promise<OptimizeRouteOutput> {
  return optimizeRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeRoutePrompt',
  input: {schema: OptimizeRouteInputSchema},
  output: {schema: OptimizeRouteOutputSchema},
  prompt: `You are an AI assistant specializing in route optimization for field collectors. Given a list of locations, their coordinates, priorities, and a time window, you will determine the optimal route to visit these locations.

You should consider travel time between locations, the priority of each location, and the specified start and end times. The output should include the optimized route with estimated arrival times for each location, the total travel time for the route, and a list of any unvisited locations.

Collector ID: {{{collectorId}}}
Start Time: {{{startTime}}}
End Time: {{{endTime}}}

Locations:
{{#each locations}}
  - Address: {{{address}}}, Latitude: {{{latitude}}}, Longitude: {{{longitude}}}, Payer: {{{payerName}}}, Priority: {{{priority}}}
{{/each}}
`,
});

const optimizeRouteFlow = ai.defineFlow(
  {
    name: 'optimizeRouteFlow',
    inputSchema: OptimizeRouteInputSchema,
    outputSchema: OptimizeRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
