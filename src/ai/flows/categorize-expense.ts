'use server';

/**
 * @fileOverview Expense categorization flow using receipt image analysis.
 *
 * - categorizeExpense - A function that categorizes expenses based on a receipt image.
 * - CategorizeExpenseInput - The input type for the categorizeExpense function.
 * - CategorizeExpenseOutput - The return type for the categorizeExpense function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeExpenseInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of the receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CategorizeExpenseInput = z.infer<typeof CategorizeExpenseInputSchema>;

const CategorizeExpenseOutputSchema = z.object({
  suggestedCategories: z
    .array(z.string())
    .describe('Suggested expense categories based on the receipt.'),
});
export type CategorizeExpenseOutput = z.infer<typeof CategorizeExpenseOutputSchema>;

export async function categorizeExpense(input: CategorizeExpenseInput): Promise<CategorizeExpenseOutput> {
  return categorizeExpenseFlow(input);
}

const categorizeExpensePrompt = ai.definePrompt({
  name: 'categorizeExpensePrompt',
  input: {schema: CategorizeExpenseInputSchema},
  output: {schema: CategorizeExpenseOutputSchema},
  prompt: `Analyze the receipt image and suggest relevant expense categories.

Receipt Image: {{media url=receiptDataUri}}

Provide at least 3 category suggestions.`,
});

const categorizeExpenseFlow = ai.defineFlow(
  {
    name: 'categorizeExpenseFlow',
    inputSchema: CategorizeExpenseInputSchema,
    outputSchema: CategorizeExpenseOutputSchema,
  },
  async input => {
    const {output} = await categorizeExpensePrompt(input);
    return output!;
  }
);
