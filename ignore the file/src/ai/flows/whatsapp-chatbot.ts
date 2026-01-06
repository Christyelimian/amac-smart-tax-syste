'use server';

/**
 * @fileOverview Implements a WhatsApp chatbot for customer support and payment assistance.
 *
 * - whatsAppChatbot - A function that handles the chatbot interactions.
 * - WhatsAppChatbotInput - The input type for the whatsAppChatbot function.
 * - WhatsAppChatbotOutput - The return type for the whatsAppChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WhatsAppChatbotInputSchema = z.object({
  message: z.string().describe('The message from the user.'),
  userId: z.string().describe('The unique identifier of the user.'),
});
export type WhatsAppChatbotInput = z.infer<typeof WhatsAppChatbotInputSchema>;

const WhatsAppChatbotOutputSchema = z.object({
  response: z.string().describe('The response from the chatbot.'),
});
export type WhatsAppChatbotOutput = z.infer<typeof WhatsAppChatbotOutputSchema>;

export async function whatsAppChatbot(input: WhatsAppChatbotInput): Promise<WhatsAppChatbotOutput> {
  return whatsAppChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'whatsAppChatbotPrompt',
  input: {schema: WhatsAppChatbotInputSchema},
  output: {schema: WhatsAppChatbotOutputSchema},
  prompt: `You are a helpful and friendly AI chatbot assisting citizens with the Smart Tax and Revenue Electronic Management System (STREAMS) via WhatsApp.

  Your goal is to provide excellent customer support and payment assistance.

  You should be able to answer questions about:
  - Making payments
  - Understanding different taxes and revenue streams
  - Resolving payment issues
  - Finding relevant information on the STREAMS platform

  If you don't know the answer to a question, politely say so and suggest the user contact AMAC administration directly.

  Current user message: {{{message}}}
  User ID: {{{userId}}}

  Response:`,
});

const whatsAppChatbotFlow = ai.defineFlow(
  {
    name: 'whatsAppChatbotFlow',
    inputSchema: WhatsAppChatbotInputSchema,
    outputSchema: WhatsAppChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
